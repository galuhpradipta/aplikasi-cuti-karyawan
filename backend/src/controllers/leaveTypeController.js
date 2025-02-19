import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all leave types
export const getAllLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await prisma.leaveType.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        res.json(leaveTypes);
    } catch (error) {
        console.error('Error fetching leave types:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data tipe cuti' });
    }
}; 