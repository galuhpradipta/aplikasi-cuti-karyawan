import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import leaveTypeRoutes from './routes/leaveTypeRoutes.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.APP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/leave-types', leaveTypeRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            message: 'Invalid JSON payload',
            error: err.message
        });
    }

    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            message: 'Database operation failed',
            error: err.message
        });
    }

    if (err.name === 'PrismaClientValidationError') {
        return res.status(400).json({
            message: 'Invalid data provided',
            error: err.message
        });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Terjadi kesalahan pada server',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        // Test database connection
        await prisma.$connect();
        console.log('Database connection established');

        // Create default roles if they don't exist
        const roles = ['Karyawan', 'Kepala Divisi', 'HRD', 'Direktur'];
        for (const roleName of roles) {
            await prisma.role.upsert({
                where: { name: roleName },
                update: {},
                create: { name: roleName },
            });
        }
        console.log('Default roles created');
    } catch (error) {
        console.error('Error connecting to database:', error);
        process.exit(1);
    }
}); 