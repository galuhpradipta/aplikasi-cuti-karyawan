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

        const pendingApprovals = await prisma.approval.findMany({
            where: {
                approverId: userId,
                status: 'PENDING',
                ...(userRole !== 'Kepala Divisi' ? {
                    leaveRequest: {
                        approvals: {
                            some: {
                                status: 'APPROVED',
                                approver: {
                                    role: {
                                        name: APPROVAL_FLOW[APPROVAL_FLOW.indexOf(userRole) - 1]
                                    }
                                }
                            }
                        }
                    }
                } : {})
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
                            }
                        }
                    }
                },
            },
        });

        if (!approval) {
            return res.status(404).json({ message: 'Approval not found or already processed' });
        }

        // Check if previous approver has approved (except for Kepala Divisi)
        if (userRole !== 'Kepala Divisi') {
            const previousRole = APPROVAL_FLOW[APPROVAL_FLOW.indexOf(userRole) - 1];
            const previousApproval = approval.leaveRequest.approvals.find(a =>
                a.approver.role.name === previousRole
            );

            if (!previousApproval || previousApproval.status !== 'APPROVED') {
                return res.status(400).json({
                    message: `Cannot process ${userRole} approval before ${previousRole} approval`
                });
            }
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
            // If approved, handle next approval and status
            else if (status === 'APPROVED') {
                // Find the next role in the approval flow
                const currentRoleIndex = APPROVAL_FLOW.indexOf(userRole);
                const nextRole = currentRoleIndex < APPROVAL_FLOW.length - 1 ? APPROVAL_FLOW[currentRoleIndex + 1] : null;

                if (nextRole) {
                    // Find the next approver with the next role
                    const nextApprover = await prisma.user.findFirst({
                        where: {
                            role: {
                                name: nextRole
                            }
                        }
                    });

                    if (nextApprover) {
                        // Create next approval
                        await prisma.approval.create({
                            data: {
                                leaveRequestId: approval.leaveRequestId,
                                approverId: nextApprover.id,
                                approvalOrder: currentRoleIndex + 2, // +2 because order starts from 1
                                status: 'PENDING'
                            }
                        });
                    }
                }

                // Check if this was the last required approval
                if (currentRoleIndex === APPROVAL_FLOW.length - 1) {
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