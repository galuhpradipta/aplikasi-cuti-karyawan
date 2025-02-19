import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get pending approvals for the current user
export const getPendingApprovals = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role.name;

        if (userRole !== 'Kepala Divisi') {
            return res.status(403).json({ message: 'Unauthorized: Only Kepala Divisi can access approvals' });
        }

        const pendingApprovals = await prisma.approval.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
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
                            }
                        },
                        leaveType: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(pendingApprovals);
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Error fetching pending approvals' });
    }
};

// Handle approval decision (approve/reject)
export const handleApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role.name;

        if (userRole !== 'Kepala Divisi') {
            return res.status(403).json({ message: 'Unauthorized: Only Kepala Divisi can handle approvals' });
        }

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be APPROVED or REJECTED' });
        }

        // Get the approval
        const approval = await prisma.approval.findFirst({
            where: {
                id: parseInt(id),
                approverId: userId,
                status: 'PENDING',
            },
            include: {
                leaveRequest: true,
            },
        });

        if (!approval) {
            return res.status(404).json({ message: 'Approval not found or already processed' });
        }

        // Start a transaction
        const result = await prisma.$transaction(async (prisma) => {
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
                            approvals: true,
                        },
                    },
                },
            });

            // If rejected, update leave request status to REJECTED
            if (status === 'REJECTED') {
                await prisma.leaveRequest.update({
                    where: { id: approval.leaveRequestId },
                    data: { status: 'REJECTED' },
                });
            }
            // If approved, check if this was the last required approval
            else if (status === 'APPROVED') {
                const allApprovals = await prisma.approval.findMany({
                    where: { leaveRequestId: approval.leaveRequestId },
                });

                const allApproved = allApprovals.every(a => a.status === 'APPROVED');

                if (allApproved) {
                    await prisma.leaveRequest.update({
                        where: { id: approval.leaveRequestId },
                        data: { status: 'APPROVED' },
                    });
                }
            }

            return updatedApproval;
        });

        res.json(result);
    } catch (error) {
        console.error('Error handling approval:', error);
        res.status(500).json({ message: 'Error processing approval' });
    }
}; 