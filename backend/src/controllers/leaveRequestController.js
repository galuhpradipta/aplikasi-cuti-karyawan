import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validate leave request input
const validateLeaveRequest = async (startDate, endDate, reason, leaveTypeId, userId) => {
    const errors = [];

    // Check if dates are valid
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime())) {
        errors.push('Tanggal mulai tidak valid');
    }

    if (isNaN(end.getTime())) {
        errors.push('Tanggal selesai tidak valid');
    }

    if (start > end) {
        errors.push('Tanggal mulai tidak boleh lebih besar dari tanggal selesai');
    }

    if (start < now && start.toDateString() !== now.toDateString()) {
        errors.push('Tanggal mulai tidak boleh kurang dari hari ini');
    }

    // Check reason
    if (!reason || reason.trim().length < 10) {
        errors.push('Alasan harus diisi minimal 10 karakter');
    }

    if (reason && reason.trim().length > 500) {
        errors.push('Alasan tidak boleh lebih dari 500 karakter');
    }

    // Validate leave type
    const leaveType = await prisma.leaveType.findUnique({
        where: { id: leaveTypeId },
    });

    if (!leaveType) {
        errors.push('Tipe cuti tidak valid');
        return errors;
    }

    // Calculate total days
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // If leave type has max days, validate against it
    if (leaveType.maxDays !== null) {
        // Get total days used for this leave type in the current year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);

        const usedLeaveRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
                leaveTypeId,
                status: { not: 'REJECTED' },
                startDate: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
        });

        const totalUsedDays = usedLeaveRequests.reduce((total, request) => {
            const requestStart = new Date(request.startDate);
            const requestEnd = new Date(request.endDate);
            const days = Math.ceil((requestEnd.getTime() - requestStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return total + days;
        }, 0);

        if (totalUsedDays + daysDiff > leaveType.maxDays) {
            errors.push(`Jumlah hari cuti ${leaveType.name} melebihi batas maksimal (${leaveType.maxDays} hari per tahun)`);
        }
    }

    return errors;
};

// Create a new leave request
export const createLeaveRequest = async (req, res) => {
    try {
        const { startDate, endDate, reason, leaveTypeId } = req.body;
        const userId = req.user.id;

        // Validate input
        const validationErrors = await validateLeaveRequest(startDate, endDate, reason, leaveTypeId, userId);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validationErrors,
            });
        }

        // Check for overlapping leave requests
        const overlappingRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: 'PENDING',
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
            return res.status(400).json({
                message: 'Terdapat pengajuan cuti yang bertabrakan dengan tanggal yang dipilih',
            });
        }

        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                userId,
                leaveTypeId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason.trim(),
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
                leaveType: true,
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

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'ID pengajuan cuti tidak valid' });
        }

        const leaveRequest = await prisma.leaveRequest.findFirst({
            where: {
                id: parseInt(id),
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
        const { startDate, endDate, reason, leaveTypeId } = req.body;
        const userId = req.user.id;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'ID pengajuan cuti tidak valid' });
        }

        // Validate input
        const validationErrors = await validateLeaveRequest(startDate, endDate, reason, leaveTypeId, userId);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: 'Validasi gagal',
                errors: validationErrors,
            });
        }

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

        // Check for overlapping leave requests
        const overlappingRequests = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: 'PENDING',
                id: { not: parseInt(id) },
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
            return res.status(400).json({
                message: 'Terdapat pengajuan cuti yang bertabrakan dengan tanggal yang dipilih',
            });
        }

        const updatedLeaveRequest = await prisma.leaveRequest.update({
            where: {
                id: parseInt(id),
            },
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason.trim(),
                leaveTypeId,
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

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: 'ID pengajuan cuti tidak valid' });
        }

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