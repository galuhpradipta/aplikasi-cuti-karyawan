import { PrismaClient, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface RegisterRequestBody {
  email: string;
  password: string;
  name: string;
  roleId: number;
  nik: string;
  divisionId?: number;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
}

// Get all roles
export const getRoles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: {
        id: "asc",
      },
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Error fetching roles" });
  }
};

// Get all divisions
export const getDivisions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const divisions = await prisma.division.findMany({
      orderBy: {
        name: "asc",
      },
    });
    res.json(divisions);
  } catch (error) {
    console.error("Error fetching divisions:", error);
    res.status(500).json({ message: "Error fetching divisions" });
  }
};

// Register new user
export const register = async (
  req: Request<unknown, unknown, RegisterRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, password, name, roleId, nik, divisionId } = req.body;

    // Validate required fields
    if (!email || !password || !name || !roleId || !nik) {
      res.status(400).json({
        message: "Missing required fields",
        details: {
          email: !email,
          password: !password,
          name: !name,
          roleId: !roleId,
          nik: !nik,
        },
      });
      return;
    }

    // Check if user already exists (email)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // Check if user already exists (NIK)
    const existingUserByNIK = await prisma.user.findUnique({
      where: { nik },
    });

    if (existingUserByNIK) {
      res.status(400).json({ message: "User with this NIK already exists" });
      return;
    }

    // Validate roleId exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      res.status(400).json({ message: "Invalid role ID" });
      return;
    }

    // If role is Karyawan or Kepala Divisi, division is required
    if (
      (role.name === "Karyawan" || role.name === "Kepala Divisi") &&
      !divisionId
    ) {
      res.status(400).json({ message: "Division is required for this role" });
      return;
    }

    // If divisionId is provided, validate it exists
    if (divisionId) {
      const division = await prisma.division.findUnique({
        where: { id: divisionId },
      });

      if (!division) {
        res.status(400).json({ message: "Invalid division ID" });
        return;
      }

      // If role is Kepala Divisi, check if division already has a head
      if (role.name === "Kepala Divisi") {
        const existingHead = await prisma.user.findFirst({
          where: {
            divisionId,
            role: {
              name: "Kepala Divisi",
            },
          },
        });

        if (existingHead) {
          res.status(400).json({ message: "This division already has a head" });
          return;
        }
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        nik,
        roleId,
        divisionId,
      },
      include: {
        role: true,
        division: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId } as JwtPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === "P2002" && Array.isArray(error.meta?.target)) {
        const target = error.meta?.target[0];
        res.status(400).json({
          message: "Unique constraint violation",
          field: typeof target === "string" ? target : undefined,
          details: error.message,
        });
        return;
      }
      // Foreign key constraint violation
      if (error.code === "P2003") {
        res.status(400).json({
          message: "Invalid relationship",
          field: error.meta?.field_name,
          details: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      message: "Error registering user",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

// Login user
export const login = async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, roleId: user.roleId } as JwtPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};
