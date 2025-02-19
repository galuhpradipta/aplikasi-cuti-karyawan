import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Get all users with pagination
export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const where = {
            OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { nik: { contains: search } }
            ]
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    nik: true,
                    name: true,
                    email: true,
                    role: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                nik: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, nik, roleId, password } = req.body;

        // Check if email is already taken by another user
        const existingUserByEmail = await prisma.user.findFirst({
            where: {
                email,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Check if NIK is already taken by another user
        const existingUserByNIK = await prisma.user.findFirst({
            where: {
                nik,
                NOT: {
                    id: parseInt(id)
                }
            }
        });

        if (existingUserByNIK) {
            return res.status(400).json({ message: 'NIK already in use' });
        }

        // Prepare update data
        const updateData = {
            name,
            email,
            nik,
            roleId: parseInt(roleId)
        };

        // Only update password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                nik: true,
                name: true,
                email: true,
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has any leave requests
        const hasLeaveRequests = await prisma.leaveRequest.findFirst({
            where: { userId: parseInt(id) }
        });

        if (hasLeaveRequests) {
            return res.status(400).json({
                message: 'Cannot delete user with existing leave requests'
            });
        }

        // Delete user
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
}; 