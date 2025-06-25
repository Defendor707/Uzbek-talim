import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from '../storage';
import ImageOptimizer from './imageOptimizer';

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const optimizedDir = path.join(process.cwd(), 'uploads', 'optimized');
const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Set up storage for multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to restrict file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images, documents, and PDFs
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and PDFs are allowed.'));
  }
};

// Set up multer upload
export const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Handle file uploads for lessons
export const uploadLessonFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) {
      return res.status(400).json({ message: 'Invalid lesson ID' });
    }
    
    // Check if lesson exists
    const lesson = await storage.getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if the user is the owner of the lesson
    if (req.user && lesson.teacherId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Save file metadata to database
    const file = {
      filename: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      lessonId: lessonId,
      uploadedBy: req.user ? req.user.userId : null
    };
    
    // Placeholder for saving file to database
    // TODO: Implement file storage in database
    
    return res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ message: 'File upload failed' });
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get relative path to store in database
    const relativePath = path.relative(process.cwd(), req.file.path);
    
    // Update user profile with new image path
    const updatedUser = await storage.updateUser(req.user.userId, {
      profileImage: relativePath
    });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      message: 'Profile image uploaded successfully',
      user: {
        id: updatedUser.id,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    return res.status(500).json({ message: 'Profile image upload failed' });
  }
};

// Upload test image with optimization
export const uploadTestImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Rasm yuklanmadi' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Autentifikatsiya talab etiladi' });
    }

    // Optimize image for web display
    const filename = path.basename(req.file.filename, path.extname(req.file.filename));
    const optimizedPath = path.join(optimizedDir, `${filename}.webp`);
    const thumbnailPath = path.join(thumbnailDir, `${filename}_thumb.webp`);

    // Optimize main image
    const optimizationResult = await ImageOptimizer.optimizeImage(
      req.file.path,
      optimizedPath,
      { maxWidth: 1200, maxHeight: 800, quality: 85, format: 'webp' }
    );

    // Create thumbnail
    await ImageOptimizer.createThumbnail(req.file.path, thumbnailPath, 200);

    // Get relative paths
    const originalPath = path.relative(process.cwd(), req.file.path);
    const optimizedRelativePath = path.relative(process.cwd(), optimizedPath);
    const thumbnailRelativePath = path.relative(process.cwd(), thumbnailPath);
    
    return res.status(200).json({
      message: 'Test rasmi muvaffaqiyatli yuklandi va optimize qilindi',
      imagePath: originalPath,
      optimizedPath: optimizedRelativePath,
      thumbnailPath: thumbnailRelativePath,
      optimization: {
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize,
        compressionRatio: Math.round((1 - optimizationResult.optimizedSize / optimizationResult.originalSize) * 100)
      }
    });
  } catch (error) {
    console.error('Test image upload error:', error);
    return res.status(500).json({ message: 'Test rasmi yuklash xato' });
  }
};

// Upload question image with optimization
export const uploadQuestionImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Rasm yuklanmadi' });
    }
    
    if (!req.user) {
      return res.status(401).json({ message: 'Autentifikatsiya talab etiladi' });
    }

    // Optimize image for web display
    const filename = path.basename(req.file.filename, path.extname(req.file.filename));
    const optimizedPath = path.join(optimizedDir, `${filename}.webp`);
    const thumbnailPath = path.join(thumbnailDir, `${filename}_thumb.webp`);

    // Optimize main image (smaller for questions)
    const optimizationResult = await ImageOptimizer.optimizeImage(
      req.file.path,
      optimizedPath,
      { maxWidth: 800, maxHeight: 600, quality: 80, format: 'webp' }
    );

    // Create thumbnail
    await ImageOptimizer.createThumbnail(req.file.path, thumbnailPath, 150);

    // Get relative paths
    const originalPath = path.relative(process.cwd(), req.file.path);
    const optimizedRelativePath = path.relative(process.cwd(), optimizedPath);
    const thumbnailRelativePath = path.relative(process.cwd(), thumbnailPath);
    
    return res.status(200).json({
      message: 'Savol rasmi muvaffaqiyatli yuklandi va optimize qilindi',
      imagePath: originalPath,
      optimizedPath: optimizedRelativePath,
      thumbnailPath: thumbnailRelativePath,
      optimization: {
        originalSize: optimizationResult.originalSize,
        optimizedSize: optimizationResult.optimizedSize,
        compressionRatio: Math.round((1 - optimizationResult.optimizedSize / optimizationResult.originalSize) * 100)
      }
    });
  } catch (error) {
    console.error('Question image upload error:', error);
    return res.status(500).json({ message: 'Savol rasmi yuklash xato' });
  }
};
