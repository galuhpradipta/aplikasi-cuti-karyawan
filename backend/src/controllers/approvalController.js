import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const APPROVAL_FLOW = ['Kepala Divisi', 'HRD', 'Direktur'];

// Get pending approvals for the current user
export const getPendingApprovals = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role.name;

        if (!APPROVAL_FLOW.includes(userRole)) {
            return res.status(403).json({ message: 'Unauthorized: Only approvers can access approvals' });
        }

        // Get the approval order based on role position (1-based index)
        const approvalOrder = APPROVAL_FLOW.indexOf(userRole) + 1;

        const pendingApprovals = await prisma.approval.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
                approvalOrder: approvalOrder,
                leaveRequest: {
                    approvals: {
                        none: {
                            AND: [
                                {
                                    approvalOrder: { lt: approvalOrder }
                                },
                                {
                                    status: {
                                        not: 'APPROVED'
                                    }
                                }
                            ]
                        }
                    }
                }
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
                        approvals: {
                            include: {
                                approver: {
                                    select: {
                                        name: true,
                                        role: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            },
                            orderBy: {
                                approvalOrder: 'asc'
                            }
                        }
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

        if (!APPROVAL_FLOW.includes(userRole)) {
            return res.status(403).json({ message: 'Unauthorized: Only approvers can handle approvals' });
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
                leaveRequest: {
                    include: {
                        approvals: {
                            include: {
                                approver: {
                                    include: {
                                        role: true
                                    }
                                }
                            },
                            orderBy: {
                                approvalOrder: 'asc'
                            }
                        }
                    }
                },
            },
        });

        if (!approval) {
            return res.status(404).json({ message: 'Approval not found or already processed' });
        }

        // Get current approver's order
        const approverOrder = APPROVAL_FLOW.indexOf(userRole) + 1;

        // Check if previous approvers have approved
        const previousApprovals = approval.leaveRequest.approvals.filter(
            a => a.approvalOrder < approverOrder
        );

        if (previousApprovals.some(a => a.status !== 'APPROVED')) {
            return res.status(400).json({
                message: 'Cannot process approval before previous approvers have approved'
            });
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
            // If approved and this is the last approval (Direktur), update leave request status to APPROVED
            else if (status === 'APPROVED' && userRole === 'Direktur') {
                await prisma.leaveRequest.update({
                    where: { id: approval.leaveRequestId },
                    data: { status: 'APPROVED' },
                });
            }

            return updatedApproval;
        });

        res.json(result);
    } catch (error) {
        console.error('Error handling approval:', error);
        res.status(500).json({ message: 'Error processing approval' });
    }
}; 