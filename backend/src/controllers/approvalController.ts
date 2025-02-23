import { Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../types/express";

const prisma = new PrismaClient();

export const getPendingApprovals = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Get pending approvals based on user's role
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        approverId: userId,
        status: "PENDING",
      },
      include: {
        leaveRequest: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nik: true,
              },
            },
            leaveType: true,
            approvals: {
              include: {
                approver: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        approver: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(pendingApprovals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleApproval = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate status
    if (!["APPROVED", "REJECTED"].includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }

    // Get the approval
    const approval = await prisma.approval.findUnique({
      where: { id: parseInt(id) },
      include: {
        leaveRequest: {
          include: {
            approvals: {
              orderBy: {
                approvalOrder: "asc",
              },
            },
          },
        },
      },
    });

    if (!approval) {
      res.status(404).json({ message: "Approval not found" });
      return;
    }

    // Check if the user is the assigned approver
    if (approval.approverId !== userId) {
      res
        .status(403)
        .json({ message: "Not authorized to handle this approval" });
      return;
    }

    // Update the approval
    const updatedApproval = await prisma.approval.update({
      where: { id: parseInt(id) },
      data: {
        status,
        remarks,
        approvedAt: new Date(),
      },
      include: {
        leaveRequest: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nik: true,
              },
            },
            leaveType: true,
            approvals: {
              include: {
                approver: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        approver: {
          include: {
            role: true,
          },
        },
      },
    });

    // If rejected, update leave request status to REJECTED
    if (status === "REJECTED") {
      await prisma.leaveRequest.update({
        where: { id: approval.leaveRequestId },
        data: { status: "REJECTED" },
      });
    }

    // If approved, check if this was the last approval needed
    if (status === "APPROVED") {
      const allApprovals = approval.leaveRequest.approvals;
      const isLastApproval = allApprovals.every(
        (a) => a.id === parseInt(id) || a.status === "APPROVED"
      );

      if (isLastApproval) {
        await prisma.leaveRequest.update({
          where: { id: approval.leaveRequestId },
          data: { status: "APPROVED" },
        });
      }
    }

    res.json(updatedApproval);
  } catch (error) {
    console.error("Error handling approval:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
