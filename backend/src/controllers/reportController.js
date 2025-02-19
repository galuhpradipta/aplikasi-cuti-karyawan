import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

// Get leave request reports with filters
export const getLeaveRequestReports = async (req, res) => {
    try {
        const { startDate, endDate, status, userId } = req.query;

        const filters = {
            where: {},
            include: {
                user: {
                    include: {
                        role: true
                    }
                },
                leaveType: true,
                approvals: {
                    include: {
                        approver: true
                    }
                }
            }
        };

        if (startDate && endDate) {
            filters.where.startDate = {
                gte: new Date(startDate)
            };
            filters.where.endDate = {
                lte: new Date(endDate)
            };
        }

        if (status) {
            filters.where.status = status;
        }

        if (userId) {
            filters.where.userId = parseInt(userId);
        }

        const leaveRequests = await prisma.leaveRequest.findMany(filters);

        res.json(leaveRequests);
    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ error: 'Failed to get reports' });
    }
};

// Export leave requests to CSV
export const exportLeaveRequestsCSV = async (req, res) => {
    try {
        const { startDate, endDate, status, userId } = req.query;

        const filters = {
            where: {},
            include: {
                user: {
                    include: {
                        role: true
                    }
                },
                leaveType: true,
                approvals: {
                    include: {
                        approver: true
                    }
                }
            }
        };

        if (startDate && endDate) {
            filters.where.startDate = {
                gte: new Date(startDate)
            };
            filters.where.endDate = {
                lte: new Date(endDate)
            };
        }

        if (status) {
            filters.where.status = status;
        }

        if (userId) {
            filters.where.userId = parseInt(userId);
        }

        const leaveRequests = await prisma.leaveRequest.findMany(filters);

        const fields = [
            'ID',
            'Nama Karyawan',
            'Jabatan',
            'Jenis Cuti',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Total Hari',
            'Alasan',
            'Status',
            'Tanggal Pengajuan'
        ];

        const data = leaveRequests.map(request => ({
            'ID': request.id,
            'Nama Karyawan': request.user.name,
            'Jabatan': request.user.role.name,
            'Jenis Cuti': request.leaveType.name,
            'Tanggal Mulai': format(new Date(request.startDate), 'dd/MM/yyyy'),
            'Tanggal Selesai': format(new Date(request.endDate), 'dd/MM/yyyy'),
            'Total Hari': request.totalDays,
            'Alasan': request.reason,
            'Status': request.status,
            'Tanggal Pengajuan': format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm:ss')
        }));

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`leave-requests-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting to CSV:', error);
        res.status(500).json({ error: 'Failed to export to CSV' });
    }
}; 