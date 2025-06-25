import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class Logger {
  static error(message: string, error?: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    
    console.error(`${timestamp} ERROR ${contextStr}: ${message}`);
    if (error) {
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Error details:', error);
      }
    }
  }

  static warn(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.warn(`${timestamp} WARN ${contextStr}: ${message}`);
  }

  static info(message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.log(`${timestamp} INFO ${contextStr}: ${message}`);
  }

  static debug(message: string, data?: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const contextStr = context ? `[${context}]` : '';
      console.log(`${timestamp} DEBUG ${contextStr}: ${message}`);
      if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    }
  }
}

export function createAppError(message: string, statusCode: number = 500, code?: string, details?: any): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function globalErrorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server xatosi yuz berdi';
  let details = err.details;

  // Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Ma\'lumotlar validatsiyadan o\'tmadi';
    details = fromZodError(err).details;
  }

  // Database connection errors
  if (err.message?.includes('connection') || err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Ma\'lumotlar bazasiga ulanishda xatolik';
    Logger.error('Database connection error', err, 'DATABASE');
  }

  // Authentication errors
  if (err.message?.includes('401') || err.message?.includes('Avtorizatsiya')) {
    statusCode = 401;
    message = 'Avtorizatsiya talab qilinadi';
  }

  // Rate limiting errors
  if (statusCode === 429) {
    message = 'Juda ko\'p so\'rov yuborildi, keyinroq urinib ko\'ring';
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'Fayl hajmi juda katta';
  }

  // Log error
  if (statusCode >= 500) {
    Logger.error(`Server error: ${message}`, err, `${req.method} ${req.path}`);
  } else {
    Logger.warn(`Client error: ${message}`, `${req.method} ${req.path}`);
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    details = undefined;
    if (!err.statusCode) {
      message = 'Server xatosi yuz berdi';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  const message = `${req.originalUrl} yo'li topilmadi`;
  Logger.warn(`404 - ${message}`, `${req.method} ${req.path}`);
  
  res.status(404).json({
    success: false,
    message
  });
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const userInfo = req.user ? `User ${req.user.userId}` : 'Anonymous';
  
  Logger.info(`${req.method} ${req.path} - ${userInfo}`, 'REQUEST');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    Logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${userInfo}`,
      'RESPONSE'
    );
  });

  next();
}