import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Get users with pagination and search
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { nik: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          division: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Remove password from response
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      users: usersWithoutPassword,
      meta: {
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Update user
export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, nik, roleId, divisionId, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        role: true,
      },
    });

    if (!existingUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if email is being changed and is already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }
    }

    // Check if NIK is being changed and is already taken
    if (nik && nik !== existingUser.nik) {
      const nikExists = await prisma.user.findUnique({
        where: { nik },
      });
      if (nikExists) {
        res.status(400).json({ message: "NIK already exists" });
        return;
      }
    }

    // If role is being changed to Kepala Divisi, check if division already has a head
    if (roleId && divisionId) {
      const newRole = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (newRole?.name === "Kepala Divisi") {
        const existingHead = await prisma.user.findFirst({
          where: {
            divisionId,
            role: {
              name: "Kepala Divisi",
            },
            id: { not: parseInt(id) }, // Exclude current user
          },
        });

        if (existingHead) {
          res.status(400).json({ message: "This division already has a head" });
          return;
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(nik && { nik }),
        ...(roleId && { roleId }),
        ...(divisionId !== undefined && { divisionId }), // Allow null for removing division
        ...(password && { password: await bcrypt.hash(password, 10) }),
      },
      include: {
        role: true,
        division: true,
      },
    });

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

// Delete user
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Don't allow deleting Direktur or HRD
    if (user.role.name === "Direktur" || user.role.name === "HRD") {
      res.status(403).json({ message: "Cannot delete this user type" });
      return;
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
