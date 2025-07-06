import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { loginSchema, registerUserSchema } from '@shared/schema';

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'ozbek-talim-secret-key-2025-production-jwt-secure';
const JWT_EXPIRES_IN = '24h'; // Reduced to 24 hours for better security

// Generate JWT token
export const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token with detailed error handling
export const verifyToken = (token: string): { userId: number; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expired, user needs to login again');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token format');
    } else {
      console.log('Token verification failed:', error);
    }
    return null;
  }
};

// Authentication middleware - supports both Bearer tokens and session-based auth
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    
    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no Bearer token, try to get from session (for web interface)
    if (!token && (req as any).session?.token) {
      token = (req as any).session.token;
    }
    
    // If still no token, check if user info is already in session
    if (!token && (req as any).session?.userId) {
      req.user = {
        userId: (req as any).session.userId,
        role: (req as any).session.role
      };
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    next();
  };
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const userData = registerUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Foydalanuvchi nomi allaqachon mavjud' });
    }
    
    // Create new user with only required fields (no email needed)
    const { confirmPassword, ...userDataWithoutConfirm } = userData;
    
    const newUser = await storage.createUser(userDataWithoutConfirm);
    
    // Create profile based on role
    if (userData.role === 'student' && req.body.studentProfile) {
      await storage.createStudentProfile({
        userId: newUser.id,
        ...req.body.studentProfile
      });
    } else if (userData.role === 'teacher' && req.body.teacherProfile) {
      await storage.createTeacherProfile({
        userId: newUser.id,
        ...req.body.teacherProfile
      });
    } else if (userData.role === 'center' && req.body.centerProfile) {
      await storage.createCenterProfile({
        userId: newUser.id,
        ...req.body.centerProfile
      });
    }
    
    // Generate token
    const token = generateToken(newUser.id, newUser.role);
    
    // Return user info (without password) and token
    const { passwordHash, ...userInfo } = newUser;
    
    return res.status(201).json({
      user: userInfo,
      token
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: fromZodError(error).details
      });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const credentials = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(credentials.username);
    if (!user) {
      return res.status(401).json({ message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol' });
    }
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Noto\'g\'ri foydalanuvchi nomi yoki parol' });
    }
    
    // Generate token
    const token = generateToken(user.id, user.role);
    
    // Return user info (without password) and token
    const { passwordHash, ...userInfo } = user;
    
    return res.status(200).json({
      user: userInfo,
      token
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: fromZodError(error).details
      });
    }
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}
