import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Get all leave types
export const getAllLeaveTypes = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: {
        name: "asc",
      },
    });
    res.json(leaveTypes);
  } catch (error) {
    console.error("Error fetching leave types:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengambil data tipe cuti" });
  }
};
