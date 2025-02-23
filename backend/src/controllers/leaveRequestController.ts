import { PrismaClient } from "@prisma/client";
import { Response } from "express";
import { AuthenticatedRequest } from "../types/express";

const prisma = new PrismaClient();

interface CreateLeaveRequestBody {
  startDate: string;
  endDate: string;
  reason: string;
  leaveTypeId: number;
}

interface UpdateLeaveRequestBody {
  startDate?: string;
  endDate?: string;
  reason?: string;
  leaveTypeId?: number;
}

// Validate leave request input
const validateLeaveRequest = async (
  startDate: string,
  endDate: string,
  reason: string,
  leaveTypeId: number,
  userId: number
): Promise<string[]> => {
  const errors: string[] = [];

  // Check if dates are valid
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime())) {
    errors.push("Tanggal mulai tidak valid");
  }

  if (isNaN(end.getTime())) {
    errors.push("Tanggal selesai tidak valid");
  }

  if (start > end) {
    errors.push("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
  }

  if (start < now && start.toDateString() !== now.toDateString()) {
    errors.push("Tanggal mulai tidak boleh kurang dari hari ini");
  }

  // Check reason
  if (!reason || reason.trim().length < 10) {
    errors.push("Alasan harus diisi minimal 10 karakter");
  }

  if (reason && reason.trim().length > 500) {
    errors.push("Alasan tidak boleh lebih dari 500 karakter");
  }

  // Validate leave type
  const leaveType = await prisma.leaveType.findUnique({
    where: { id: leaveTypeId },
  });

  if (!leaveType) {
    errors.push("Tipe cuti tidak valid");
    return errors;
  }

  // Calculate total days
  const daysDiff =
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // If leave type has max days, validate against it
  if (leaveType.maxDays !== null) {
    // Get total days used for this leave type in the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const usedLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        leaveTypeId,
        status: { not: "REJECTED" },
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const totalUsedDays = usedLeaveRequests.reduce((total, request) => {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      const days =
        Math.ceil(
          (requestEnd.getTime() - requestStart.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return total + days;
    }, 0);

    if (totalUsedDays + daysDiff > leaveType.maxDays) {
      errors.push(
        `Jumlah hari cuti ${leaveType.name} melebihi batas maksimal (${leaveType.maxDays} hari per tahun)`
      );
    }
  }

  return errors;
};

// Create a new leave request
export const createLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, reason, leaveTypeId } =
      req.body as CreateLeaveRequestBody;
    const userId = req.user.id;

    // Validate input
    const validationErrors = await validateLeaveRequest(
      startDate,
      endDate,
      reason,
      leaveTypeId,
      userId
    );
    if (validationErrors.length > 0) {
      res.status(400).json({
        message: "Validasi gagal",
        errors: validationErrors,
      });
      return;
    }

    // Check for overlapping leave requests
    const overlappingRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        status: "PENDING",
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
        ],
      },
    });

    if (overlappingRequests.length > 0) {
      res.status(400).json({
        message:
          "Terdapat pengajuan cuti yang bertabrakan dengan tanggal yang dipilih",
      });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        leaveType: true,
      },
    });

    // Create approval records based on the user's role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const approvalOrder: string[] = [];

    // Define approval flow based on user's role
    if (user.role.name === "Karyawan") {
      approvalOrder.push("Kepala Divisi", "HRD", "Direktur");
    } else if (user.role.name === "Kepala Divisi") {
      approvalOrder.push("HRD", "Direktur");
    } else if (user.role.name === "HRD") {
      approvalOrder.push("Direktur");
    }

    // Create approval records
    for (let i = 0; i < approvalOrder.length; i++) {
      const approverRole = approvalOrder[i];
      const approver = await prisma.user.findFirst({
        where: {
          role: {
            name: approverRole,
          },
        },
      });

      if (approver) {
        await prisma.approval.create({
          data: {
            leaveRequestId: leaveRequest.id,
            approverId: approver.id,
            approvalOrder: i + 1,
            status: "PENDING",
          },
        });
      }
    }

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error("Error creating leave request:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat membuat pengajuan cuti" });
  }
};

// Get all leave requests for the authenticated user
export const getUserLeaveRequests = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
      },
      include: {
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengajuan cuti",
    });
  }
};

// Get a specific leave request
export const getLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const leaveRequestId = parseInt(id);
    if (isNaN(leaveRequestId)) {
      res.status(400).json({ message: "ID pengajuan cuti tidak valid" });
      return;
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        userId,
      },
      include: {
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      res.status(404).json({ message: "Pengajuan cuti tidak ditemukan" });
      return;
    }

    res.json(leaveRequest);
  } catch (error) {
    console.error("Error fetching leave request:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengajuan cuti",
    });
  }
};

// Update a leave request
export const updateLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { startDate, endDate, reason, leaveTypeId } =
      req.body as UpdateLeaveRequestBody;

    const leaveRequestId = parseInt(id);
    if (isNaN(leaveRequestId)) {
      res.status(400).json({ message: "ID pengajuan cuti tidak valid" });
      return;
    }

    // Check if leave request exists and belongs to user
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        userId,
      },
    });

    if (!existingRequest) {
      res.status(404).json({ message: "Pengajuan cuti tidak ditemukan" });
      return;
    }

    if (existingRequest.status !== "PENDING") {
      res.status(400).json({
        message: "Hanya pengajuan cuti dengan status PENDING yang dapat diubah",
      });
      return;
    }

    // Validate input if provided
    if (startDate && endDate && reason && leaveTypeId) {
      const validationErrors = await validateLeaveRequest(
        startDate,
        endDate,
        reason,
        leaveTypeId,
        userId
      );
      if (validationErrors.length > 0) {
        res.status(400).json({
          message: "Validasi gagal",
          errors: validationErrors,
        });
        return;
      }
    }

    // Update leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(reason && { reason: reason.trim() }),
        ...(leaveTypeId && { leaveTypeId }),
      },
      include: {
        leaveType: true,
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error("Error updating leave request:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengubah pengajuan cuti" });
  }
};

// Delete a leave request
export const deleteLeaveRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const leaveRequestId = parseInt(id);
    if (isNaN(leaveRequestId)) {
      res.status(400).json({ message: "ID pengajuan cuti tidak valid" });
      return;
    }

    // Check if leave request exists and belongs to user
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        userId,
      },
    });

    if (!existingRequest) {
      res.status(404).json({ message: "Pengajuan cuti tidak ditemukan" });
      return;
    }

    if (existingRequest.status !== "PENDING") {
      res.status(400).json({
        message:
          "Hanya pengajuan cuti dengan status PENDING yang dapat dihapus",
      });
      return;
    }

    // Delete related approvals first
    await prisma.approval.deleteMany({
      where: {
        leaveRequestId,
      },
    });

    // Delete leave request
    await prisma.leaveRequest.delete({
      where: {
        id: leaveRequestId,
      },
    });

    res.json({ message: "Pengajuan cuti berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat menghapus pengajuan cuti" });
  }
};

// Get dashboard stats
export const getStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    // Get all leave types
    const leaveTypes = await prisma.leaveType.findMany();

    // Get leave requests for the current year
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        startDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        leaveType: true,
      },
    });

    // Calculate stats for each leave type
    const stats = leaveTypes.map((leaveType) => {
      const requests = leaveRequests.filter(
        (req) => req.leaveTypeId === leaveType.id
      );
      const totalDays = requests.reduce((total, req) => {
        if (req.status === "REJECTED") return total;
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        return (
          total +
          (Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          ) +
            1)
        );
      }, 0);

      return {
        leaveType,
        totalRequests: requests.length,
        totalDays,
        remainingDays:
          leaveType.maxDays !== null
            ? Math.max(0, leaveType.maxDays - totalDays)
            : null,
        requests: requests.map((req) => ({
          id: req.id,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          days:
            Math.ceil(
              (new Date(req.endDate).getTime() -
                new Date(req.startDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) + 1,
        })),
      };
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengambil statistik" });
  }
};
