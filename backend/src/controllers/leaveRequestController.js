import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a new leave request
export const createLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const userId = req.user.id;

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                userId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                status: 'PENDING',
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // Create approval records based on the user's role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });

        let approvalOrder = [];

        // Define approval flow based on user's role
        if (user.role.name === 'Karyawan') {
            approvalOrder = ['Kepala Divisi', 'HRD'];
        } else if (user.role.name === 'Kepala Divisi') {
            approvalOrder = ['HRD'];
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
                        status: 'PENDING',
                    },
                });
            }
        }

        res.status(201).json(leaveRequest);
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat pengajuan cuti' });
    }
};

// Get all leave requests for a user
export const getUserLeaveRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const leaveRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
            },
            include: {
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
                createdAt: 'desc',
            },
        });

        res.json(leaveRequests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pengajuan cuti' });
    }
};

// Get a specific leave request
export const getLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
            include: {
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
            return res.status(404).json({ message: 'Pengajuan cuti tidak ditemukan' });
        }

        res.json(leaveRequest);
    } catch (error) {
        console.error('Error fetching leave request:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pengajuan cuti' });
    }
};

// Update a leave request
export const updateLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate, reason } = req.body;
        const userId = req.user.id;

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Pengajuan cuti tidak ditemukan' });
        }

        if (leaveRequest.status !== 'PENDING') {
            return res.status(400).json({ message: 'Pengajuan cuti yang sudah diproses tidak dapat diubah' });
        }

        const updatedLeaveRequest = await prisma.leaveRequest.update({
            where: {
                id: parseInt(id),
            },
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
            },
            include: {
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

        res.json(updatedLeaveRequest);
    } catch (error) {
        console.error('Error updating leave request:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengubah pengajuan cuti' });
    }
};

// Delete a leave request
export const deleteLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id: parseInt(id),
                userId,
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Pengajuan cuti tidak ditemukan' });
        }

        if (leaveRequest.status !== 'PENDING') {
            return res.status(400).json({ message: 'Pengajuan cuti yang sudah diproses tidak dapat dihapus' });
        }

        // Delete associated approvals first
        await prisma.approval.deleteMany({
            where: {
                leaveRequestId: parseInt(id),
            },
        });

        // Delete the leave request
        await prisma.leaveRequest.delete({
            where: {
                id: parseInt(id),
            },
        });

        res.json({ message: 'Pengajuan cuti berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus pengajuan cuti' });
    }
}; 