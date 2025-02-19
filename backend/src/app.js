import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import leaveTypeRoutes from './routes/leaveTypeRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 