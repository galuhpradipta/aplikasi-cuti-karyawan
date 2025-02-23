import { Request, Response } from "express";
import { prisma } from "../config/database";
import { Prisma, LeaveRequest } from "@prisma/client";

export const getLeaveRequestReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: Prisma.LeaveRequestWhereInput = {};

    if (startDate) {
      where.startDate = {
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      where.endDate = {
        lte: new Date(endDate as string),
      };
    }

    if (status) {
      where.status = status as string;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        leaveType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching leave request reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const exportLeaveRequestsCSV = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;

    const where: Prisma.LeaveRequestWhereInput = {};

    if (startDate) {
      where.startDate = {
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      where.endDate = {
        lte: new Date(endDate as string),
      };
    }

    if (status) {
      where.status = status as string;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        leaveType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Generate CSV content
    const csvHeader =
      "Name,Email,Leave Type,Start Date,End Date,Total Days,Status\n";
    const csvRows = leaveRequests
      .map(
        (
          request: LeaveRequest & {
            user: { name: string; email: string };
            leaveType: { name: string };
          }
        ) => {
          const totalDays =
            Math.ceil(
              (new Date(request.endDate).getTime() -
                new Date(request.startDate).getTime()) /
                (1000 * 3600 * 24)
            ) + 1;
          return `${request.user.name},${request.user.email},${request.leaveType.name},${request.startDate},${request.endDate},${totalDays},${request.status}`;
        }
      )
      .join("\n");
    const csvContent = csvHeader + csvRows;

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leave-requests.csv"
    );

    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting leave requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
