import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Get all roles
export const getRoles = async (req, res) => {
    try {
        const roles = await prisma.role.findMany({
            orderBy: {
                id: 'asc'
            }
        });
        console.log('Fetched roles:', roles); // Add logging
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Error fetching roles' });
    }
};

// Register new user
export const register = async (req, res) => {
    try {
        const { email, password, name, roleId, nik } = req.body;

        // Check if user already exists (email)
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUserByEmail) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if user already exists (NIK)
        const existingUserByNIK = await prisma.user.findUnique({
            where: { nik },
        });

        if (existingUserByNIK) {
            return res.status(400).json({ message: 'User with this NIK already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                nik,
                roleId,
            },
            include: {
                role: true,
            },
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, roleId: user.roleId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: true,
            },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, roleId: user.roleId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
}; 