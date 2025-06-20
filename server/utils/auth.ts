import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { loginSchema, registerUserSchema } from '@shared/schema';

// JWT secret should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
export const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token: string): { userId: number; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
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
    
    // For simplified registration, we'll generate a dummy email from username
    const dummyEmail = `${userData.username}@uzbektalim.local`;
    
    // Check if username already exists
    const existingUsername = await storage.getUserByUsername(userData.username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user with only required fields
    const { confirmPassword, ...userDataWithoutConfirm } = userData;
    
    // Add generated email since our database still requires it
    const newUser = await storage.createUser({
      ...userDataWithoutConfirm,
      email: dummyEmail
    });
    
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
    
    // Find user by username or email
    let user = await storage.getUserByUsername(credentials.username);
    if (!user) {
      // Try to find by email if username doesn't work
      user = await storage.getUserByEmail(credentials.username);
    }
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
