import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticate, authorize, login, register } from "./utils/auth";
import { upload, uploadLessonFile, uploadProfileImage, uploadTestImage, uploadQuestionImage } from "./utils/upload";
import { syncService } from "./sync/syncService";
import { botNotificationService } from "./sync/botNotifications";
import { generateTestReportExcel, generateStudentProgressExcel } from "./utils/excelExport";
import express from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generalLimiter, authLimiter, uploadLimiter, testLimiter } from "./middleware/rateLimiter";
import { testsCache, lessonsCache, profileCache, statisticsCache, invalidateTestsCache, invalidateLessonsCache, invalidateUserCache } from "./middleware/cache";
import { globalErrorHandler, notFoundHandler, requestLogger, asyncHandler } from "./middleware/errorHandler";
import autoSaveMiddleware from "./middleware/autoSave";
import * as jwt from "jsonwebtoken";

// Helper function to determine if notification should be sent based on settings
function shouldSendNotification(settings: any, scorePercentage: number): boolean {
  if (!settings) return true; // Default: send all notifications
  
  // Check score range
  if (scorePercentage < settings.minScoreNotification || scorePercentage > settings.maxScoreNotification) {
    return false;
  }
  
  // Check pass/fail only settings
  const passingScore = 60; // Default passing score
  const isPassed = scorePercentage >= passingScore;
  
  if (settings.notifyOnlyFailed && isPassed) return false;
  if (settings.notifyOnlyPassed && !isPassed) return false;
  
  // Check if instant notifications are enabled
  if (!settings.instantNotification) return false;
  
  return true;
}
import * as schema from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply general rate limiting to all API routes
  app.use('/api', generalLimiter.middleware);

  // Auth Routes with specific rate limiting
  app.post("/api/auth/register", authLimiter.middleware, register);
  app.post("/api/auth/login", authLimiter.middleware, login);
  app.get("/api/auth/me", authenticate, profileCache, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userData } = user;
      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // User Routes
  app.get("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only return sensitive data if it's the current user or an admin
      if (req.user?.userId === userId) {
        const { passwordHash, ...userData } = user;
        return res.status(200).json(userData);
      } else {
        // Return limited data for other users
        return res.status(200).json({
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          profileImage: user.profileImage,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.put("/api/users/profile", authenticate, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const updateData = req.body;

      // Ensure we don't update sensitive fields like role
      delete updateData.role;

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, ...userData } = updatedUser;
      return res.status(200).json(userData);
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Profile image upload with rate limiting
  app.post(
    "/api/users/profile/image",
    authenticate,
    uploadLimiter.middleware,
    upload.single("profileImage"),
    uploadProfileImage
  );

  // Sync profile data with Telegram bot
  app.post("/api/users/sync-profile", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ 
        message: "Profile synced successfully",
        user: { ...user, password: undefined }
      });
    } catch (error) {
      console.error("Error syncing profile:", error);
      return res.status(500).json({ message: "Failed to sync profile" });
    }
  });

  // Profile specific routes for different roles
  app.get("/api/profile/student", authenticate, authorize(["student"]), async (req, res) => {
    try {
      const profile = await storage.getStudentProfile(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      return res.status(500).json({ message: "Failed to fetch student profile" });
    }
  });

  app.get("/api/profile/teacher", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const profile = await storage.getTeacherProfile(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      return res.status(500).json({ message: "Failed to fetch teacher profile" });
    }
  });

  // Center profile routes
  app.get("/api/center/profile", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const profile = await storage.getCenterProfile(req.user!.userId);
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching center profile:", error);
      return res.status(500).json({ message: "Failed to fetch center profile" });
    }
  });

  app.post("/api/center/profile", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const profileData = schema.insertCenterProfileSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });
      
      const profile = await storage.createCenterProfile(profileData);
      return res.status(201).json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating center profile:", error);
      return res.status(500).json({ message: "Failed to create center profile" });
    }
  });

  app.put("/api/center/profile", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const profileData = schema.insertCenterProfileSchema.partial().parse(req.body);
      
      const profile = await storage.updateCenterProfile(req.user!.userId, profileData);
      if (!profile) {
        return res.status(404).json({ message: "Center profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error updating center profile:", error);
      return res.status(500).json({ message: "Failed to update center profile" });
    }
  });

  // Center management routes
  app.get("/api/center/teachers", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const teachers = await storage.getTeachersByCenter(req.user!.userId);
      return res.status(200).json(teachers);
    } catch (error) {
      console.error("Error fetching center teachers:", error);
      return res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/center/students", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const students = await storage.getStudentsByCenter(req.user!.userId);
      return res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching center students:", error);
      return res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/center/assign-teacher", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const { teacherId } = req.body;
      if (!teacherId) {
        return res.status(400).json({ message: "Teacher ID is required" });
      }
      
      const success = await storage.assignTeacherToCenter(teacherId, req.user!.userId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign teacher to center" });
      }
      
      return res.status(200).json({ message: "Teacher assigned successfully" });
    } catch (error) {
      console.error("Error assigning teacher to center:", error);
      return res.status(500).json({ message: "Failed to assign teacher" });
    }
  });

  app.post("/api/center/assign-student", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }
      
      const success = await storage.assignStudentToCenter(studentId, req.user!.userId);
      if (!success) {
        return res.status(400).json({ message: "Failed to assign student to center" });
      }
      
      return res.status(200).json({ message: "Student assigned successfully" });
    } catch (error) {
      console.error("Error assigning student to center:", error);
      return res.status(500).json({ message: "Failed to assign student" });
    }
  });

  // Lesson Routes
  app.post("/api/lessons", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const lessonData = schema.insertLessonSchema.parse({
        ...req.body,
        teacherId: req.user!.userId,
      });

      const newLesson = await storage.createLesson(lessonData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyLessonUpdated(newLesson);
      await syncService.notifyLessonCreated(newLesson);
      
      return res.status(201).json(newLesson);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating lesson:", error);
      return res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.get("/api/lessons", authenticate, async (req, res) => {
    try {
      let lessons: any[] = [];

      if (req.user?.role === "teacher") {
        // Teachers see their own lessons
        lessons = await storage.getLessonsByTeacherId(req.user.userId);
      } else if (req.user?.role === "student") {
        // Students see lessons for their grade
        const profile = await storage.getStudentProfile(req.user.userId);
        if (profile?.grade) {
          lessons = await storage.getLessonsByGrade(profile.grade);
        } else {
          // Return empty array if no profile exists instead of error
          lessons = [];
        }
      } else if (req.user?.role === "center" || req.user?.role === "parent") {
        // Centers and parents see all lessons (or could be filtered by grade)
        lessons = await storage.getLessonsByGrade("10"); // Get grade 10 lessons as default
      }

      return res.status(200).json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      return res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", authenticate, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }

      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      return res.status(200).json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      return res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.put(
    "/api/lessons/:id",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const lessonId = parseInt(req.params.id);
        if (isNaN(lessonId)) {
          return res.status(400).json({ message: "Invalid lesson ID" });
        }

        // Check if lesson exists and belongs to the teacher
        const lesson = await storage.getLessonById(lessonId);
        if (!lesson) {
          return res.status(404).json({ message: "Lesson not found" });
        }

        if (lesson.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedLesson = await storage.updateLesson(lessonId, req.body);
        return res.status(200).json(updatedLesson);
      } catch (error) {
        console.error("Error updating lesson:", error);
        return res.status(500).json({ message: "Failed to update lesson" });
      }
    }
  );

  app.delete(
    "/api/lessons/:id",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const lessonId = parseInt(req.params.id);
        if (isNaN(lessonId)) {
          return res.status(400).json({ message: "Invalid lesson ID" });
        }

        // Check if lesson exists and belongs to the teacher
        const lesson = await storage.getLessonById(lessonId);
        if (!lesson) {
          return res.status(404).json({ message: "Lesson not found" });
        }

        if (lesson.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        await storage.deleteLessonById(lessonId);
        return res.status(200).json({ message: "Lesson deleted successfully" });
      } catch (error) {
        console.error("Error deleting lesson:", error);
        return res.status(500).json({ message: "Failed to delete lesson" });
      }
    }
  );

  // Lesson file upload
  app.post(
    "/api/lessons/:lessonId/files",
    authenticate,
    authorize(["teacher"]),
    upload.single("file"),
    uploadLessonFile
  );

  // Lesson cover image upload
  app.post(
    "/api/lessons/upload-cover", 
    authenticate,
    authorize(["teacher"]),
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Rasm yuklanmadi" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        return res.status(200).json({ imageUrl });
      } catch (error) {
        console.error("Error uploading lesson cover:", error);
        return res.status(500).json({ message: "Rasm yuklashda xatolik" });
      }
    }
  );

  // Test Routes
  app.post("/api/tests", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const testData = schema.insertTestSchema.parse({
        ...req.body,
        teacherId: req.user!.userId,
      });

      const newTest = await storage.createTest(testData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyTestCreated(newTest);
      await syncService.notifyTestCreated(newTest);
      
      return res.status(201).json(newTest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating test:", error);
      return res.status(500).json({ message: "Failed to create test" });
    }
  });

  // Test creation with images
  app.post("/api/tests/create-with-images", 
    authenticate, 
    authorize(["teacher"]), 
    upload.array('testImages', 5),
    async (req, res) => {
      try {
        const files = req.files as Express.Multer.File[];
        const imageUrls: string[] = [];
        
        // Process uploaded images
        if (files && files.length > 0) {
          for (const file of files) {
            // Store file path or URL (adjust based on your storage strategy)
            imageUrls.push(`/uploads/${file.filename}`);
          }
        }

        // Parse questions from form data
        let questions = [];
        try {
          questions = JSON.parse(req.body.questions || '[]');
        } catch (e) {
          questions = [];
        }

        // Generate unique test code for numerical tests
        let testCode = null;
        if (req.body.type === 'numerical') {
          let attempts = 0;
          while (attempts < 10) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const existingTest = await storage.getTestByCode(code);
            
            if (!existingTest) {
              testCode = code;
              break;
            }
            attempts++;
          }
          
          if (!testCode) {
            return res.status(500).json({ error: "Test kodi generatsiya qilishda xatolik" });
          }
        }

        const testData = schema.insertTestSchema.parse({
          title: req.body.title,
          description: req.body.description || '',
          testImages: imageUrls,
          teacherId: req.user!.userId,
          type: req.body.type === 'public' ? 'public' : 'numerical',
          testCode: testCode,
          grade: req.body.grade || '1',
          classroom: req.body.classroom || null,
          duration: parseInt(req.body.duration) || 0,
          totalQuestions: parseInt(req.body.totalQuestions) || 0,
          status: 'active',
        });

        const newTest = await storage.createTest(testData);
        
        // Create questions
        if (questions && questions.length > 0) {
          for (const question of questions) {
            await storage.createQuestion({
              testId: newTest.id,
              questionText: question.questionText || `${question.order || 1}-savol`,
              questionType: 'simple',
              options: question.options || ['A', 'B', 'C', 'D'],
              correctAnswer: question.correctAnswer,
              points: question.points || 1,
              order: question.order || 1
            });
          }
        }
        
        // Notify bot users and sync with website
        try {
          await botNotificationService.notifyTestCreated(newTest);
          await syncService.notifyTestCreated(newTest);
        } catch (notifyError) {
          console.error("Notification error:", notifyError);
          // Don't fail the request if notifications fail
        }
        
        return res.status(201).json({ 
          ...newTest,
          message: "Test muvaffaqiyatli yaratildi",
          testCode: newTest.testCode || testCode
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Ma'lumotlar to'g'ri emas",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error creating test with images:", error);
        return res.status(500).json({ 
          message: "Test yaratishda xatolik yuz berdi",
          error: error instanceof Error ? error.message : "Noma'lum xatolik"
        });
      }
    }
  );

  app.get("/api/tests", authenticate, testsCache, async (req, res) => {
    try {
      let tests: any[] = [];

      if (req.user?.role === "teacher") {
        // Teachers see their own tests
        tests = await storage.getTestsByTeacherId(req.user.userId);
      } else if (req.user?.role === "student") {
        // Students see all active public tests + grade-specific tests
        const profile = await storage.getStudentProfile(req.user.userId);
        const publicTests = await storage.getAllPublicTests();
        
        if (profile?.grade) {
          // Get grade-specific tests
          const gradeTests = await storage.getActiveTestsForStudent(
            profile.grade,
            profile.classroom || undefined
          );
          // Combine and deduplicate
          const allTestIds = new Set();
          tests = [...publicTests, ...gradeTests].filter(test => {
            if (allTestIds.has(test.id)) {
              return false;
            }
            allTestIds.add(test.id);
            return true;
          });
        } else {
          // If no profile, show all public tests anyway
          tests = publicTests;
        }
      } else if (req.user?.role === "center" || req.user?.role === "parent") {
        // Centers and parents see all public tests
        tests = await storage.getAllPublicTests();
      } else {
        // Default to empty array for other roles
        tests = [];
      }

      return res.status(200).json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      return res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  // Public tests endpoint - MUST be before the :id route
  app.get("/api/tests/public", authenticate, async (req, res) => {
    try {
      const publicTests = await storage.getAllPublicTests();
      return res.status(200).json(publicTests);
    } catch (error) {
      console.error("Error fetching public tests:", error);
      return res.status(500).json({ message: "Failed to fetch public tests" });
    }
  });

  app.get("/api/tests/:id", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const test = await storage.getTestById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      return res.status(200).json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      return res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.put(
    "/api/tests/:id",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.id);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and belongs to the teacher
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedTest = await storage.updateTest(testId, req.body);
        return res.status(200).json(updatedTest);
      } catch (error) {
        console.error("Error updating test:", error);
        return res.status(500).json({ message: "Failed to update test" });
      }
    }
  );

  // Update test with images
  app.put(
    "/api/tests/:id/update-with-images",
    authenticate,
    authorize(["teacher"]),
    upload.array('testImages', 5),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.id);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and belongs to the teacher
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Handle image uploads
        let testImages: string[] = [];
        
        // Parse existing images if provided
        if (req.body.existingImages) {
          try {
            const existingImages = JSON.parse(req.body.existingImages);
            if (Array.isArray(existingImages)) {
              testImages = [...existingImages];
            }
          } catch (e) {
            console.error("Error parsing existing images:", e);
          }
        }

        // Add new uploaded images
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
          const files = req.files as Express.Multer.File[];
          const newImagePaths = files.map(file => {
            const relativePath = file.path.replace(process.cwd() + '/', '');
            return relativePath;
          });
          testImages = [...testImages, ...newImagePaths];
        }

        // Parse questions
        let questions: any[] = [];
        if (req.body.questions) {
          try {
            questions = JSON.parse(req.body.questions);
          } catch (e) {
            console.error("Error parsing questions:", e);
            return res.status(400).json({ message: "Invalid questions format" });
          }
        }

        // Update test data
        const testData = {
          title: req.body.title,
          description: req.body.description || '',
          type: req.body.type,
          status: req.body.status,
          totalQuestions: parseInt(req.body.totalQuestions) || questions.length,
          testCode: req.body.testCode || null,
          ...(testImages.length > 0 && { testImages }),
        };

        const updatedTest = await storage.updateTest(testId, testData);

        // Delete existing questions for this test
        const existingQuestions = await storage.getQuestionsByTestId(testId);
        for (const question of existingQuestions) {
          await storage.deleteQuestionById(question.id);
        }

        // Create new questions
        for (const question of questions) {
          await storage.createQuestion({
            testId: testId,
            questionText: question.questionText || '',
            questionType: testData.type, // Add required question_type
            correctAnswer: question.correctAnswer, // Don't double-encode
            order: question.order || 1,
            points: question.points || 1,
            options: question.options || ['A', 'B', 'C', 'D'],
          });
        }

        // Notify bot users and sync with website
        if (updatedTest) {
          await botNotificationService.notifyTestCreated(updatedTest);
          await syncService.notifyTestCreated(updatedTest);
        }
        
        return res.status(200).json({
          ...updatedTest,
          testCode: req.body.testCode || updatedTest?.testCode,
        });
      } catch (error) {
        console.error("Error updating test with images:", error);
        return res.status(500).json({ message: "Failed to update test" });
      }
    }
  );

  app.delete(
    "/api/tests/:id",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.id);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and belongs to the teacher
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        await storage.deleteTestById(testId);
        return res.status(200).json({ message: "Test deleted successfully" });
      } catch (error) {
        console.error("Error deleting test:", error);
        return res.status(500).json({ message: "Failed to delete test" });
      }
    }
  );

  // Universal search endpoint - supports both name and code search
  app.get("/api/tests/search/:query", authenticate, async (req, res) => {
    try {
      const query = req.params.query.trim();
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      let availableTests: any[] = [];
      let searchResults: any[] = [];

      // Get available tests based on user role
      if (req.user?.role === "teacher") {
        // Teachers can search their own tests
        availableTests = await storage.getTestsByTeacherId(req.user.userId);
      } else if (req.user?.role === "student") {
        // Students can search tests available to them
        const profile = await storage.getStudentProfile(req.user.userId);
        if (profile?.grade) {
          const gradeTests = await storage.getActiveTestsForStudent(
            profile.grade,
            profile.classroom || undefined
          );
          const publicTests = await storage.getAllPublicTests();
          // Combine grade-specific tests and public tests, remove duplicates
          const testIds = new Set();
          availableTests = [...gradeTests, ...publicTests].filter(test => {
            if (testIds.has(test.id)) return false;
            testIds.add(test.id);
            return test.status === 'active';
          });
        } else {
          // If no profile, only show public tests
          availableTests = await storage.getAllPublicTests();
        }
      } else if (req.user?.role === "center" || req.user?.role === "parent") {
        // Centers and parents can search public tests
        availableTests = await storage.getAllPublicTests();
      }

      // Enhanced search for numerical tests and general search
      // 1. First priority: Search by exact test code (numerical tests)
      if (/^\d{6}$/.test(query)) {
        const testByCode = await storage.getTestByCode(query);
        if (testByCode && testByCode.status === 'active') {
          searchResults.push(testByCode);
        }
      } else {
        // 2. Search by partial test code (for numerical tests)
        const codeMatches = availableTests.filter(test => 
          test.testCode && test.testCode.includes(query)
        );
        searchResults = [...searchResults, ...codeMatches];
      }

      // 3. Search by title (case-insensitive)
      const titleMatches = availableTests.filter(test => 
        test.title.toLowerCase().includes(query.toLowerCase()) &&
        !searchResults.some(result => result.id === test.id)
      );
      searchResults = [...searchResults, ...titleMatches];

      // 4. Search by description if no results yet
      if (searchResults.length === 0) {
        const descriptionMatches = availableTests.filter(test => 
          test.description && 
          test.description.toLowerCase().includes(query.toLowerCase())
        );
        searchResults = [...searchResults, ...descriptionMatches];
      }

      // 5. Search by type (public, numerical, etc.)
      if (searchResults.length === 0) {
        const typeMatches = availableTests.filter(test => 
          test.type && test.type.toLowerCase().includes(query.toLowerCase())
        );
        searchResults = [...searchResults, ...typeMatches];
      }

      if (searchResults.length > 0) {
        // Sort results: exact title matches first, then partial matches
        searchResults.sort((a, b) => {
          const aExactTitle = a.title.toLowerCase() === query.toLowerCase();
          const bExactTitle = b.title.toLowerCase() === query.toLowerCase();
          if (aExactTitle && !bExactTitle) return -1;
          if (!aExactTitle && bExactTitle) return 1;
          return 0;
        });
        
        return res.status(200).json(searchResults);
      }

      // No tests found
      return res.status(404).json({ message: "Test topilmadi" });
    } catch (error) {
      console.error("Error searching tests:", error);
      return res.status(500).json({ message: "Failed to search tests" });
    }
  });



  // Question Routes
  app.post(
    "/api/tests/:testId/questions",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.testId);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and belongs to the teacher
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const questionData = schema.insertQuestionSchema.parse({
          ...req.body,
          testId,
        });

        const newQuestion = await storage.createQuestion(questionData);
        return res.status(201).json(newQuestion);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error creating question:", error);
        return res.status(500).json({ message: "Failed to create question" });
      }
    }
  );

  app.get("/api/tests/:testId/questions", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      const test = await storage.getTestById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Students shouldn't see correct answers for active tests
      const questions = await storage.getQuestionsByTestId(testId);
      
      if (req.user?.role === "student" && test.status === "active") {
        // Remove correct answers for students
        const sanitizedQuestions = questions.map(q => {
          const { correctAnswer, ...rest } = q;
          return rest;
        });
        return res.status(200).json(sanitizedQuestions);
      }

      return res.status(200).json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      return res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Delete question endpoint
  app.delete(
    "/api/questions/:id",
    authenticate,
    authorize(["teacher"]),
    async (req, res) => {
      try {
        const questionId = parseInt(req.params.id);
        if (isNaN(questionId)) {
          return res.status(400).json({ message: "Invalid question ID" });
        }

        // Get question to verify ownership through test
        const questions = await storage.getQuestionsByTestId(0); // We'll need to get all questions first
        const question = questions.find(q => q.id === questionId);
        
        if (!question) {
          return res.status(404).json({ message: "Question not found" });
        }

        // Check if the test belongs to the teacher
        const test = await storage.getTestById(question.testId);
        if (!test || test.teacherId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Delete the question (we'll need to add this method to storage)
        const success = await storage.deleteQuestionById(questionId);
        if (!success) {
          return res.status(500).json({ message: "Failed to delete question" });
        }

        return res.status(200).json({ message: "Question deleted successfully" });
      } catch (error) {
        console.error("Error deleting question:", error);
        return res.status(500).json({ message: "Failed to delete question" });
      }
    }
  );

  // Test Attempt Routes
  app.post(
    "/api/test-attempts",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const { testId, studentId } = req.body;
        
        if (!testId || !studentId) {
          return res.status(400).json({ message: "Test ID and Student ID are required" });
        }

        // Check if test exists and is active
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.status !== "active") {
          return res.status(400).json({ message: "Test is not active" });
        }

        // Create test attempt
        const attemptData = schema.insertTestAttemptSchema.parse({
          testId,
          studentId: req.user!.userId,
          totalQuestions: test.totalQuestions,
          status: "in_progress",
        });

        const newAttempt = await storage.createTestAttempt(attemptData);
        return res.status(201).json(newAttempt);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error starting test attempt:", error);
        return res.status(500).json({ message: "Failed to start test attempt" });
      }
    }
  );

  app.post(
    "/api/tests/:testId/attempts",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.testId);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and is active
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.status !== "active") {
          return res.status(400).json({ message: "Test is not active" });
        }

        // Create test attempt
        const attemptData = schema.insertTestAttemptSchema.parse({
          testId,
          studentId: req.user!.userId,
          totalQuestions: test.totalQuestions,
          status: "in_progress",
        });

        const newAttempt = await storage.createTestAttempt(attemptData);
        return res.status(201).json(newAttempt);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error starting test attempt:", error);
        return res.status(500).json({ message: "Failed to start test attempt" });
      }
    }
  );

  app.put(
    "/api/test-attempts/:attemptId",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Update attempt
        const updatedAttempt = await storage.updateTestAttempt(attemptId, {
          ...req.body,
          endTime: new Date(),
        });

        return res.status(200).json(updatedAttempt);
      } catch (error) {
        console.error("Error updating test attempt:", error);
        return res.status(500).json({ message: "Failed to update test attempt" });
      }
    }
  );

  // Submit answer to test attempt
  app.post(
    "/api/test-attempts/:attemptId/answers",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        const { questionId, answer } = req.body;
        if (!questionId || !answer) {
          return res.status(400).json({ message: "Question ID and answer are required" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Create or update student answer
        const answerData = schema.insertStudentAnswerSchema.parse({
          attemptId,
          questionId,
          answer,
        });

        const newAnswer = await storage.createStudentAnswer(answerData);
        return res.status(201).json(newAnswer);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error submitting answer:", error);
        return res.status(500).json({ message: "Failed to submit answer" });
      }
    }
  );

  app.get(
    "/api/student/attempts",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attempts = await storage.getTestAttemptsByStudentId(req.user!.userId);
        return res.status(200).json(attempts);
      } catch (error) {
        console.error("Error fetching student attempts:", error);
        return res.status(500).json({ message: "Failed to fetch test attempts" });
      }
    }
  );

  // Start test endpoint - used by TakeTest component
  app.post(
    "/api/tests/:testId/start",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const testId = parseInt(req.params.testId);
        if (isNaN(testId)) {
          return res.status(400).json({ message: "Invalid test ID" });
        }

        // Check if test exists and is active
        const test = await storage.getTestById(testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (test.status !== "active") {
          return res.status(400).json({ message: "Test is not active" });
        }

        // Create test attempt
        const attemptData = schema.insertTestAttemptSchema.parse({
          testId,
          studentId: req.user!.userId,
          totalQuestions: test.totalQuestions,
          status: "in_progress",
        });

        const newAttempt = await storage.createTestAttempt(attemptData);
        return res.status(201).json(newAttempt);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error starting test attempt:", error);
        return res.status(500).json({ message: "Failed to start test attempt" });
      }
    }
  );

  // Submit answer endpoint - used by TakeTest component
  app.post(
    "/api/test-attempts/:attemptId/answers",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        const { questionId, answer } = req.body;
        
        if (isNaN(attemptId) || !questionId || !answer) {
          return res.status(400).json({ message: "Attempt ID, Question ID and Answer are required" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Create student answer
        const answerData = schema.insertStudentAnswerSchema.parse({
          attemptId,
          questionId,
          answer,
        });

        const newAnswer = await storage.createStudentAnswer(answerData);
        return res.status(201).json(newAnswer);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error submitting answer:", error);
        return res.status(500).json({ message: "Failed to submit answer" });
      }
    }
  );

  // Complete test endpoint - used by TakeTest component
  app.post(
    "/api/test-attempts/:attemptId/complete",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Calculate score and update attempt
        const test = await storage.getTestById(attempt.testId);
        const questions = await storage.getQuestionsByTestId(attempt.testId);
        const answers = await storage.getStudentAnswersByAttemptId(attemptId);

        let score = 0;
        let totalPoints = 0;

        for (const question of questions) {
          totalPoints += question.points;
          const studentAnswer = answers.find(a => a.questionId === question.id);
          
          if (studentAnswer && studentAnswer.answer === question.correctAnswer) {
            score += question.points;
          }
        }

        const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

        // Update attempt with final score and end time
        const updatedAttempt = await storage.updateTestAttempt(attemptId, {
          endTime: new Date(),
          score: scorePercentage.toString(),
          status: "completed",
        });

        // Send notification to parent if student has a parent
        try {
          const studentProfile = await storage.getStudentProfile(req.user!.userId);
          if (studentProfile && studentProfile.parentId) {
            const test = await storage.getTestById(attempt.testId);
            const student = await storage.getUser(req.user!.userId);
            
            if (test && student) {
              const percentage = Math.round(scorePercentage);
              // Check parent notification settings
              const notificationSettings = await storage.getParentNotificationSettings(studentProfile.parentId);
              const shouldNotify = shouldSendNotification(notificationSettings, percentage);
              
              if (shouldNotify) {
                // Send Telegram notification to parent
                const { notifyParentOfTestCompletion } = require('./telegram/bot');
                await notifyParentOfTestCompletion(req.user!.userId, test.title, student.fullName || student.username, scorePercentage);
                
                // Create website notification if enabled
                if (!notificationSettings || notificationSettings.enableWebsite) {
                  // This would be implemented when we have a notifications table properly set up
                  // Website notification would be created for parent
                }
              } else {
                // Notification skipped based on parent settings
              }
            }
          }
        } catch (notificationError) {
          console.error("Error sending parent notification:", notificationError);
          // Don't fail the test completion if notification fails
        }

        return res.status(200).json({ ...updatedAttempt, score: scorePercentage });
      } catch (error) {
        console.error("Error completing test:", error);
        return res.status(500).json({ message: "Failed to complete test" });
      }
    }
  );

  // Student Answer Routes  
  app.post(
    "/api/student-answers",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const { attemptId, questionId, answer } = req.body;
        
        if (!attemptId || !questionId) {
          return res.status(400).json({ message: "Attempt ID and Question ID are required" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Create student answer
        const answerData = schema.insertStudentAnswerSchema.parse({
          attemptId,
          questionId,
          answer,
        });

        const newAnswer = await storage.createStudentAnswer(answerData);
        return res.status(201).json(newAnswer);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error saving student answer:", error);
        return res.status(500).json({ message: "Failed to save answer" });
      }
    }
  );

  app.post(
    "/api/attempts/:attemptId/answers",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Create student answer
        const answerData = schema.insertStudentAnswerSchema.parse({
          ...req.body,
          attemptId,
        });

        const newAnswer = await storage.createStudentAnswer(answerData);
        return res.status(201).json(newAnswer);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: "Validation error",
            errors: fromZodError(error).details,
          });
        }
        console.error("Error saving student answer:", error);
        return res.status(500).json({ message: "Failed to save answer" });
      }
    }
  );

  // Test submission endpoint
  app.post(
    "/api/test-attempts/:attemptId/submit",
    authenticate,
    authorize(["student"]),
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        // Check if attempt exists and belongs to the student
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        if (attempt.studentId !== req.user!.userId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        // Calculate score and update attempt
        const test = await storage.getTestById(attempt.testId);
        const questions = await storage.getQuestionsByTestId(attempt.testId);
        const answers = await storage.getStudentAnswersByAttemptId(attemptId);

        let score = 0;
        let totalPoints = 0;

        for (const question of questions) {
          totalPoints += question.points;
          const studentAnswer = answers.find(a => a.questionId === question.id);
          
          if (studentAnswer && studentAnswer.answer === question.correctAnswer) {
            score += question.points;
          }
        }

        const scorePercentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

        // Update attempt with final score and end time
        const updatedAttempt = await storage.updateTestAttempt(attemptId, {
          endTime: new Date(),
          score: scorePercentage.toString(),
          correctAnswers: Math.floor(score / (questions[0]?.points || 1)),
          completed: true,
          status: "completed",
        });

        return res.status(200).json(updatedAttempt);
      } catch (error) {
        console.error("Error submitting test:", error);
        return res.status(500).json({ message: "Failed to submit test" });
      }
    }
  );

  // Get test attempt result
  app.get("/api/test-attempts/:id/result", authenticate, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      if (isNaN(attemptId)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }

      const attempt = await storage.getTestAttemptById(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      if (attempt.studentId !== req.user!.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const test = await storage.getTestById(attempt.testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      const questions = await storage.getQuestionsByTestId(attempt.testId);
      const answers = await storage.getStudentAnswersByAttemptId(attemptId);
      
      // Calculate correct answers if not already set
      let correctAnswers = attempt.correctAnswers || 0;
      if (!attempt.correctAnswers) {
        correctAnswers = 0;
        for (const answer of answers) {
          const question = questions.find(q => q.id === answer.questionId);
          if (question && answer.answer === question.correctAnswer) {
            correctAnswers++;
          }
        }
      }
      
      const result = {
        id: attempt.id,
        testId: attempt.testId,
        studentId: attempt.studentId,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        score: attempt.score,
        correctAnswers,
        totalQuestions: questions.length,
        status: attempt.status,
        completed: attempt.completed,
        test: {
          title: test.title,
          description: test.description,
        }
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching test result:", error);
      return res.status(500).json({ message: "Failed to fetch test result" });
    }
  });

  app.get(
    "/api/attempts/:attemptId/answers",
    authenticate,
    async (req, res) => {
      try {
        const attemptId = parseInt(req.params.attemptId);
        if (isNaN(attemptId)) {
          return res.status(400).json({ message: "Invalid attempt ID" });
        }

        // Check if attempt exists
        const attempt = await storage.getTestAttemptById(attemptId);
        if (!attempt) {
          return res.status(404).json({ message: "Test attempt not found" });
        }

        // Check permissions - only student who took the test or the teacher who created it can view
        const test = await storage.getTestById(attempt.testId);
        if (!test) {
          return res.status(404).json({ message: "Test not found" });
        }

        if (
          req.user?.userId !== attempt.studentId &&
          req.user?.userId !== test.teacherId
        ) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const answers = await storage.getStudentAnswersByAttemptId(attemptId);
        return res.status(200).json(answers);
      } catch (error) {
        console.error("Error fetching student answers:", error);
        return res.status(500).json({ message: "Failed to fetch answers" });
      }
    }
  );

  // Schedule Routes
  app.post(
    "/api/schedules",
    authenticate,
    authorize(["teacher", "center"]),
    async (req, res) => {
      try {
        let scheduleData;

        if (req.user?.role === "teacher") {
          scheduleData = {
            ...req.body,
            teacherId: req.user.userId,
          };
        } else {
          // Center role
          scheduleData = req.body;
        }

        const newSchedule = await storage.createSchedule(scheduleData);
        
        // Notify bot users and sync with website
        await botNotificationService.notifyScheduleChanged(newSchedule);
        await syncService.notifyScheduleUpdate(newSchedule);
        
        return res.status(201).json(newSchedule);
      } catch (error) {
        console.error("Error creating schedule:", error);
        return res.status(500).json({ message: "Failed to create schedule" });
      }
    }
  );

  app.get("/api/schedules/teacher", authenticate, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const schedules = await storage.getSchedulesByTeacherId(req.user.userId);
      return res.status(200).json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.get("/api/schedules/class/:className", authenticate, async (req, res) => {
    try {
      const className = req.params.className;
      const schedules = await storage.getSchedulesByClassName(className);
      return res.status(200).json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  // Excel Export Routes
  app.get("/api/tests/:testId/export/excel", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Invalid test ID" });
      }

      // Check if test exists and belongs to the teacher
      const test = await storage.getTestById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      if (test.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const buffer = await generateTestReportExcel(testId);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="test_${testId}_results.xlsx"`);
      
      return res.send(buffer);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      return res.status(500).json({ message: "Failed to generate Excel report" });
    }
  });

  app.get("/api/students/:studentId/export/excel", authenticate, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      // Check authorization - student can only export their own data, teacher/parent can export student data
      if (req.user?.role === 'student' && req.user.userId !== studentId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const buffer = await generateStudentProgressExcel(studentId);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="student_${studentId}_progress.xlsx"`);
      
      return res.send(buffer);
    } catch (error) {
      console.error("Error generating student progress Excel:", error);
      return res.status(500).json({ message: "Failed to generate student progress Excel" });
    }
  });

  // Bot Sync Routes - for Telegram bot data synchronization
  app.get("/api/bot/notifications/:userId", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only allow users to get their own notifications or admins
      if (req.user?.userId !== userId && req.user?.role !== 'center') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const notifications = botNotificationService.getNotifications(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching bot notifications:", error);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.delete("/api/bot/notifications/:userId", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Only allow users to clear their own notifications
      if (req.user?.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      botNotificationService.clearNotifications(userId);
      return res.status(200).json({ message: "Notifications cleared" });
    } catch (error) {
      console.error("Error clearing bot notifications:", error);
      return res.status(500).json({ message: "Failed to clear notifications" });
    }
  });

  // Notifications API endpoint
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      // Return empty array since we don't have notifications table yet
      // This will show "Sizga habarlar mavjud emas" message in UI
      res.json([]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Teacher Profile Routes
  app.get("/api/profile/teacher", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const profile = await storage.getTeacherProfile(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      return res.status(500).json({ message: "Failed to fetch teacher profile" });
    }
  });

  app.post("/api/profile/teacher", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const profileData = schema.insertTeacherProfileSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      // Update user fullName if provided
      if (req.body.fullName) {
        await storage.updateUser(req.user!.userId, { fullName: req.body.fullName });
      }

      const newProfile = await storage.createTeacherProfile(profileData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'teacher');
      await syncService.notifyProfileUpdate(req.user!.userId, newProfile, 'teacher');
      
      return res.status(201).json(newProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating teacher profile:", error);
      return res.status(500).json({ message: "Failed to create teacher profile" });
    }
  });

  app.put("/api/profile/teacher", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      // Check if profile exists
      const existingProfile = await storage.getTeacherProfile(req.user!.userId);
      if (!existingProfile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }

      const profileData = schema.insertTeacherProfileSchema.partial().parse(req.body);
      
      // Update user fullName if provided
      if (req.body.fullName) {
        await storage.updateUser(req.user!.userId, { fullName: req.body.fullName });
      }
      
      // Update profile through storage
      const updatedProfile = await storage.updateTeacherProfile(req.user!.userId, profileData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'teacher');
      await syncService.notifyProfileUpdate(req.user!.userId, updatedProfile, 'teacher');
      
      return res.status(200).json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error updating teacher profile:", error);
      return res.status(500).json({ message: "Failed to update teacher profile" });
    }
  });

  // Student Profile Routes
  app.get("/api/profile/student", authenticate, authorize(["student"]), async (req, res) => {
    try {
      const profile = await storage.getStudentProfile(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      return res.status(500).json({ message: "Failed to fetch student profile" });
    }
  });

  app.post("/api/profile/student", authenticate, authorize(["student"]), async (req, res) => {
    try {
      const profileData = schema.insertStudentProfileSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      // Update user fullName if provided
      if (req.body.fullName) {
        await storage.updateUser(req.user!.userId, { fullName: req.body.fullName });
      }

      const newProfile = await storage.createStudentProfile(profileData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'student');
      await syncService.notifyProfileUpdate(req.user!.userId, newProfile, 'student');
      
      return res.status(201).json(newProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating student profile:", error);
      return res.status(500).json({ message: "Failed to create student profile" });
    }
  });

  app.put("/api/profile/student", authenticate, authorize(["student"]), async (req, res) => {
    try {
      // Check if profile exists
      const existingProfile = await storage.getStudentProfile(req.user!.userId);
      if (!existingProfile) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      const profileData = schema.insertStudentProfileSchema.partial().parse(req.body);
      
      // Update user fullName if provided
      if (req.body.fullName) {
        await storage.updateUser(req.user!.userId, { fullName: req.body.fullName });
      }
      
      // Update student profile
      const updatedProfile = await storage.updateStudentProfile(req.user!.userId, profileData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'student');
      await syncService.notifyProfileUpdate(req.user!.userId, updatedProfile, 'student');
      
      return res.status(200).json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error updating student profile:", error);
      return res.status(500).json({ message: "Failed to update student profile" });
    }
  });

  // Parent notification settings routes
  app.get("/api/parent/notification-settings", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      let settings = await storage.getParentNotificationSettings(req.user!.userId);
      
      // Create default settings if none exist
      if (!settings) {
        const defaultSettings = schema.insertParentNotificationSettingsSchema.parse({
          parentId: req.user!.userId,
          enableTelegram: true,
          enableWebsite: true,
          minScoreNotification: 0,
          maxScoreNotification: 100,
          notifyOnlyFailed: false,
          notifyOnlyPassed: false,
          instantNotification: true,
          dailyDigest: false,
          weeklyDigest: false,
        });
        
        settings = await storage.createParentNotificationSettings(defaultSettings);
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching parent notification settings:", error);
      return res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/parent/notification-settings", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      const settingsData = schema.insertParentNotificationSettingsSchema.parse(req.body);

      let settings = await storage.getParentNotificationSettings(req.user!.userId);
      
      if (settings) {
        // Update existing settings
        settings = await storage.updateParentNotificationSettings(req.user!.userId, settingsData);
      } else {
        // Create new settings
        const newSettings = {
          ...settingsData,
          parentId: req.user!.userId,
        };
        settings = await storage.createParentNotificationSettings(newSettings);
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error updating parent notification settings:", error);
      return res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Parent Profile Routes
  app.get("/api/profile/parent", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      // For parent, we store phone number in user table since there's no separate parent profile table
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data as parent profile (phone number is stored in user table phone field)
      return res.status(200).json({
        fullName: user.fullName,
        phoneNumber: user.phone || null,
      });
    } catch (error) {
      console.error("Error fetching parent profile:", error);
      return res.status(500).json({ message: "Failed to fetch parent profile" });
    }
  });

  app.post("/api/profile/parent", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      // Validate fullName
      if (!req.body.fullName || req.body.fullName.length < 2) {
        return res.status(400).json({ message: "To'liq ism kamida 2 ta harfdan iborat bo'lishi kerak" });
      }

      // Update user with fullName and phone
      const updateData: any = { fullName: req.body.fullName };
      if (req.body.phoneNumber) {
        updateData.phone = req.body.phoneNumber;
      }

      const updatedUser = await storage.updateUser(req.user!.userId, updateData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'parent');
      await syncService.notifyProfileUpdate(req.user!.userId, updatedUser, 'parent');
      
      return res.status(201).json({
        fullName: updatedUser?.fullName,
        phoneNumber: updatedUser?.phone || null,
      });
    } catch (error) {
      console.error("Error creating parent profile:", error);
      return res.status(500).json({ message: "Failed to create parent profile" });
    }
  });

  app.put("/api/profile/parent", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      // Validate fullName
      if (!req.body.fullName || req.body.fullName.length < 2) {
        return res.status(400).json({ message: "To'liq ism kamida 2 ta harfdan iborat bo'lishi kerak" });
      }

      // Update user with fullName and phone
      const updateData: any = { fullName: req.body.fullName };
      if (req.body.phoneNumber !== undefined) {
        updateData.phone = req.body.phoneNumber;
      }

      const updatedUser = await storage.updateUser(req.user!.userId, updateData);
      
      // Notify bot users and sync with website
      await botNotificationService.notifyProfileUpdated(req.user!.userId, 'parent');
      await syncService.notifyProfileUpdate(req.user!.userId, updatedUser, 'parent');
      
      return res.status(200).json({
        fullName: updatedUser?.fullName,
        phoneNumber: updatedUser?.phone || null,
      });
    } catch (error) {
      console.error("Error updating parent profile:", error);
      return res.status(500).json({ message: "Failed to update parent profile" });
    }
  });

  // Search centers for teachers, students, and parents
  app.get('/api/centers/search', authenticate, async (req, res) => {
    try {
      const { query, city, specialization } = req.query;
      const centers = await storage.searchCenters({
        query: query as string,
        city: city as string,
        specialization: specialization as string
      });
      res.json(centers);
    } catch (error) {
      res.status(500).json({ message: 'Markaz qidirish xatosi' });
    }
  });

  // Teacher Profile Image Upload Route
  app.post("/api/teacher/upload-image", authenticate, authorize(["teacher"]), upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Rasm fayli kiritilmagan" });
      }

      // Get existing teacher profile or create new one
      let profile = await storage.getTeacherProfile(req.user!.userId);
      
      // Create/update profile data with image
      const profileData = {
        userId: req.user!.userId,
        profileImage: `/uploads/${req.file.filename}`,
        phoneNumber: profile?.phoneNumber || '',
        specialty: profile?.specialty || '',
        subjects: profile?.subjects || [],
        bio: profile?.bio || '',
        experience: profile?.experience ?? undefined,
        certificates: profile?.certificates || [],
        centerId: profile?.centerId ?? undefined,
      };

      if (profile) {
        // Update existing profile
        const updatedProfile = await storage.updateTeacherProfile(req.user!.userId, profileData);
        return res.status(200).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      } else {
        // Create new profile
        const newProfile = await storage.createTeacherProfile(profileData);
        return res.status(201).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      }
    } catch (error) {
      console.error("Error uploading teacher profile image:", error);
      return res.status(500).json({ message: "Rasm yuklashda xatolik yuz berdi" });
    }
  });

  // Student Profile Image Upload Route
  app.post("/api/student/upload-image", authenticate, authorize(["student"]), upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Rasm fayli kiritilmagan" });
      }

      // Get existing student profile or create new one
      let profile = await storage.getStudentProfile(req.user!.userId);
      
      // Create/update profile data with image
      const profileData = {
        userId: req.user!.userId,
        profileImage: `/uploads/${req.file.filename}`,
        phoneNumber: profile?.phoneNumber || '',
        grade: profile?.grade || '',
        classroom: profile?.classroom || '',
        certificates: profile?.certificates || [],
        bio: profile?.bio || '',
        parentId: profile?.parentId ?? undefined,
        centerId: profile?.centerId ?? undefined,
      };

      if (profile) {
        // Update existing profile
        const updatedProfile = await storage.updateStudentProfile(req.user!.userId, profileData);
        return res.status(200).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      } else {
        // Create new profile
        const newProfile = await storage.createStudentProfile(profileData);
        return res.status(201).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      }
    } catch (error) {
      console.error("Error uploading student profile image:", error);
      return res.status(500).json({ message: "Rasm yuklashda xatolik yuz berdi" });
    }
  });

  // Parent Profile Image Upload Route - DISABLED
  // Parent users cannot upload profile images as per optimization requirements

  // Center Profile Image Upload Route
  app.post("/api/center/upload-image", authenticate, authorize(["center"]), upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Rasm fayli kiritilmagan" });
      }

      // Get existing center profile or create new one
      let profile = await storage.getCenterProfile(req.user!.userId);
      
      // Create profile data with image
      const profileData = {
        userId: req.user!.userId,
        centerName: profile?.centerName || '',
        address: profile?.address || '',
        phoneNumber: profile?.phoneNumber || '',
        email: profile?.email || '',
        website: profile?.website || '',
        description: profile?.description || '',
        director: profile?.director || '',
        establishedYear: profile?.establishedYear ?? undefined,
        capacity: profile?.capacity ?? undefined,
        specializations: profile?.specializations || [],
        facilities: profile?.facilities || [],
        workingHours: profile?.workingHours || '',
        profileImage: `/uploads/${req.file.filename}`
      };

      if (profile) {
        // Update existing profile
        const updatedProfile = await storage.updateCenterProfile(req.user!.userId, profileData);
        return res.status(200).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      } else {
        // Create new profile
        const newProfile = await storage.createCenterProfile(profileData);
        return res.status(201).json({ 
          message: "Rasm muvaffaqiyatli yuklandi",
          profileImage: profileData.profileImage
        });
      }
    } catch (error) {
      console.error("Error uploading center profile image:", error);
      return res.status(500).json({ message: "Rasm yuklashda xatolik yuz berdi" });
    }
  });

  // Parent Children Management Routes
  app.get("/api/parent/children", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      const children = await storage.getChildrenByParentId(req.user!.userId);
      return res.status(200).json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      return res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post("/api/parent/add-child", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      const { childUsername } = req.body;
      
      if (!childUsername || typeof childUsername !== 'string') {
        return res.status(400).json({ message: "Farzand username kiriting" });
      }

      await storage.addChildToParent(req.user!.userId, childUsername);
      return res.status(200).json({ message: "Farzand muvaffaqiyatli qo'shildi" });
    } catch (error: any) {
      console.error("Error adding child:", error);
      return res.status(400).json({ message: error.message || "Farzand qo'shishda xatolik" });
    }
  });

  app.get("/api/parent/test-results", authenticate, authorize(["parent"]), async (req, res) => {
    try {
      // Get children IDs first
      const children = await storage.getChildrenByParentId(req.user!.userId);
      const childrenIds = children.map(child => child.id);
      
      if (childrenIds.length === 0) {
        return res.status(200).json([]);
      }

      // Get test attempts for all children
      const testResults: any[] = [];
      for (const childId of childrenIds) {
        const attempts = await storage.getTestAttemptsByStudentId(childId);
        testResults.push(...attempts);
      }

      return res.status(200).json(testResults);
    } catch (error) {
      console.error("Error fetching test results:", error);
      return res.status(500).json({ message: "Failed to fetch test results" });
    }
  });

  // Sync status endpoint
  app.get("/api/sync/status", authenticate, async (req, res) => {
    try {
      const connectedUsers = syncService.getConnectedUsersCount();
      const connectedByRole = {
        teacher: syncService.getConnectedUsersByRole('teacher').length,
        student: syncService.getConnectedUsersByRole('student').length,
        parent: syncService.getConnectedUsersByRole('parent').length,
        center: syncService.getConnectedUsersByRole('center').length
      };

      return res.status(200).json({
        connectedUsers,
        connectedByRole,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching sync status:", error);
      return res.status(500).json({ message: "Failed to fetch sync status" });
    }
  });

  // Image Upload Routes
  app.post("/api/upload/test-image", authenticate, authorize(["teacher"]), upload.single('testImage'), uploadTestImage);
  app.post("/api/upload/test-images", authenticate, authorize(["teacher"]), upload.array('testImages', 5), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Rasmlar yuklanmadi' });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Autentifikatsiya talab etiladi' });
      }
      
      const files = req.files as Express.Multer.File[];
      const imagePaths = files.map(file => {
        const relativePath = file.path.replace(process.cwd() + '/', '');
        return relativePath;
      });
      
      return res.status(200).json({
        message: 'Test rasmlari muvaffaqiyatli yuklandi',
        imagePaths: imagePaths
      });
    } catch (error) {
      console.error('Test images upload error:', error);
      return res.status(500).json({ message: 'Test rasmlari yuklash xato' });
    }
  });
  app.post("/api/upload/question-image", authenticate, authorize(["teacher"]), upload.single('questionImage'), uploadQuestionImage);

  // Excel Export Routes
  app.get("/api/tests/:testId/export", authenticate, authorize(["teacher"]), async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      if (isNaN(testId)) {
        return res.status(400).json({ message: "Noto'g'ri test ID" });
      }

      // Check if test exists and belongs to the teacher
      const test = await storage.getTestById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test topilmadi" });
      }

      if (test.teacherId !== req.user!.userId) {
        return res.status(403).json({ message: "Ruxsat berilmagan" });
      }

      const buffer = await generateTestReportExcel(testId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="test-report-${testId}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      return res.status(500).json({ message: "Excel fayl yaratishda xatolik" });
    }
  });

  app.get("/api/students/:studentId/progress-export", authenticate, authorize(["teacher", "parent"]), async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Noto'g'ri o'quvchi ID" });
      }

      // Check permissions
      if (req.user?.role === "parent") {
        // Parents can only export their children's progress
        const children = await storage.getChildrenByParentId(req.user.userId);
        const childrenIds = children.map(child => child.id);
        
        if (!childrenIds.includes(studentId)) {
          return res.status(403).json({ message: "Ruxsat berilmagan" });
        }
      }

      const buffer = await generateStudentProgressExcel(studentId);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="student-progress-${studentId}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      return res.status(500).json({ message: "Excel fayl yaratishda xatolik" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket sync service
  syncService.init(httpServer);

  // Initialize Study Room WebSocket Server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/study-room' });
  
  interface StudyRoomClient {
    ws: WebSocket;
    userId: number;
    roomId: number;
    username: string;
  }

  const studyRoomClients = new Map<number, Set<StudyRoomClient>>();

  wss.on('connection', async (ws, req) => {
    try {
      // Extract token from query params
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        ws.close(1008, 'Invalid user');
        return;
      }

      let client: StudyRoomClient | null = null;

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          switch (message.type) {
            case 'join-room':
              const roomId = parseInt(message.roomId);
              if (isNaN(roomId)) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid room ID' }));
                return;
              }

              // Verify user is participant in the room
              const participants = await storage.getStudyRoomParticipants(roomId);
              const isParticipant = participants.some(p => p.userId === user.id);
              
              if (!isParticipant) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this room' }));
                return;
              }

              client = {
                ws,
                userId: user.id,
                roomId,
                username: user.username
              };

              // Add client to room
              if (!studyRoomClients.has(roomId)) {
                studyRoomClients.set(roomId, new Set());
              }
              studyRoomClients.get(roomId)!.add(client);

              // Notify others about new participant
              broadcastToRoom(roomId, {
                type: 'user-joined',
                user: { id: user.id, username: user.username, fullName: user.fullName }
              }, client);

              // Send current participants list
              const currentParticipants = Array.from(studyRoomClients.get(roomId) || [])
                .map(c => ({ id: c.userId, username: c.username }));
              
              ws.send(JSON.stringify({
                type: 'participants-list',
                participants: currentParticipants
              }));
              
              break;

            case 'chat-message':
              if (!client) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not joined to any room' }));
                return;
              }

              // Save message to database
              const newMessage = await storage.createStudyRoomMessage({
                roomId: client.roomId,
                userId: client.userId,
                content: message.content,
                type: 'text'
              });

              // Broadcast message to all room participants
              broadcastToRoom(client.roomId, {
                type: 'chat-message',
                message: {
                  id: newMessage.id,
                  content: newMessage.content,
                  userId: client.userId,
                  username: client.username,
                  createdAt: newMessage.createdAt
                }
              });
              
              break;

            case 'whiteboard-update':
              if (!client) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not joined to any room' }));
                return;
              }

              // Broadcast whiteboard update to others
              broadcastToRoom(client.roomId, {
                type: 'whiteboard-update',
                data: message.data,
                userId: client.userId
              }, client);
              
              break;

            case 'screen-share-start':
              if (!client) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not joined to any room' }));
                return;
              }

              // Create screen sharing session
              const sessionId = `${client.roomId}-${client.userId}-${Date.now()}`;
              await storage.createScreenSharingSession({
                roomId: client.roomId,
                userId: client.userId,
                sessionId
              });

              // Notify all participants
              broadcastToRoom(client.roomId, {
                type: 'screen-share-started',
                userId: client.userId,
                username: client.username,
                sessionId
              });
              
              break;

            case 'screen-share-end':
              if (!client) {
                ws.send(JSON.stringify({ type: 'error', message: 'Not joined to any room' }));
                return;
              }

              // End active screen sharing session
              const activeSession = await storage.getActiveScreenSharingSession(client.roomId);
              if (activeSession && activeSession.userId === client.userId) {
                await storage.endScreenSharingSession(activeSession.id);
                
                broadcastToRoom(client.roomId, {
                  type: 'screen-share-ended',
                  userId: client.userId
                });
              }
              
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        if (client) {
          // Remove client from room
          const roomClients = studyRoomClients.get(client.roomId);
          if (roomClients) {
            roomClients.delete(client);
            if (roomClients.size === 0) {
              studyRoomClients.delete(client.roomId);
            } else {
              // Notify others about user leaving
              broadcastToRoom(client.roomId, {
                type: 'user-left',
                userId: client.userId,
                username: client.username
              });
            }
          }
        }
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  });

  function broadcastToRoom(roomId: number, message: any, exclude?: StudyRoomClient) {
    const roomClients = studyRoomClients.get(roomId);
    if (!roomClients) return;

    const messageStr = JSON.stringify(message);
    roomClients.forEach(client => {
      if (client !== exclude && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  // Forgot password routes
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const result = schema.forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: result.error.errors 
        });
      }

      const { username } = result.data;
      const resetToken = await storage.createResetToken(username);
      
      if (!resetToken) {
        return res.json({ 
          message: 'Foydalanuvchi topilmadi' 
        });
      }

      console.log(`Reset token for ${username}: ${resetToken}`);
      console.log(`Reset URL: ${req.get('origin')}/reset-password?token=${resetToken}`);
      
      res.json({ 
        message: 'Parol tiklash kodi yaratildi',
        resetUrl: `/reset-password?token=${resetToken}`
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Parol tiklashda xatolik yuz berdi' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const result = schema.resetPasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: result.error.errors 
        });
      }

      const { token, password } = result.data;
      
      const bcrypt = await import('bcrypt');
      const newPasswordHash = await bcrypt.hash(password, 10);
      
      const success = await storage.resetPassword(token, newPasswordHash);
      
      if (!success) {
        return res.status(400).json({ 
          error: 'Token yaroqsiz yoki muddati tugagan' 
        });
      }

      res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Parol o\'zgartirishda xatolik yuz berdi' });
    }
  });

  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ 
          error: 'Token yaroqsiz yoki muddati tugagan' 
        });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ error: 'Token tekshirishda xatolik' });
    }
  });

  // Parent notification settings routes
  app.get("/api/parent/notification-settings", authenticate, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'parent') {
        return res.status(403).json({ message: "Faqat ota-onalar uchun" });
      }

      let settings = await storage.getParentNotificationSettings(userId);
      
      // Create default settings if they don't exist
      if (!settings) {
        settings = await storage.createParentNotificationSettings({
          parentId: userId,
          enableTelegram: true,
          enableWebsite: true,
          minScoreNotification: 0,
          maxScoreNotification: 100,
          notifyOnlyFailed: false,
          notifyOnlyPassed: false,
          instantNotification: true,
          dailyDigest: false,
          weeklyDigest: false,
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Get parent notification settings error:', error);
      res.status(500).json({ message: "Sozlamalarni olishda xatolik" });
    }
  });

  app.put("/api/parent/notification-settings", authenticate, async (req, res) => {
    try {
      const userId = req.user!.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'parent') {
        return res.status(403).json({ message: "Faqat ota-onalar uchun" });
      }

      const settingsData = schema.insertParentNotificationSettingsSchema.parse(req.body);
      
      let settings = await storage.getParentNotificationSettings(userId);
      
      if (!settings) {
        // Create new settings
        settings = await storage.createParentNotificationSettings({
          ...settingsData,
          parentId: userId,
        });
      } else {
        // Update existing settings
        settings = await storage.updateParentNotificationSettings(userId, settingsData);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Update parent notification settings error:', error);
      res.status(500).json({ message: "Sozlamalarni yangilashda xatolik" });
    }
  });

  // Study Room Routes
  app.get("/api/study-rooms", authenticate, async (req, res) => {
    try {
      const rooms = await storage.getActiveStudyRooms();
      return res.status(200).json(rooms);
    } catch (error) {
      console.error("Error fetching study rooms:", error);
      return res.status(500).json({ message: "Study xonalarini olishda xatolik" });
    }
  });

  app.post("/api/study-rooms", authenticate, async (req, res) => {
    try {
      // Generate unique room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData = schema.insertStudyRoomSchema.parse({
        ...req.body,
        hostId: req.user!.userId,
        roomCode,
      });

      const newRoom = await storage.createStudyRoom(roomData);
      
      // Automatically join the host to the room
      await storage.joinStudyRoom(newRoom.id, req.user!.userId, 'host');
      
      return res.status(201).json(newRoom);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating study room:", error);
      return res.status(500).json({ message: "Study xonasini yaratishda xatolik" });
    }
  });

  app.get("/api/study-rooms/:id", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const room = await storage.getStudyRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Study xonasi topilmadi" });
      }

      return res.status(200).json(room);
    } catch (error) {
      console.error("Error fetching study room:", error);
      return res.status(500).json({ message: "Study xonasini olishda xatolik" });
    }
  });

  app.get("/api/study-rooms/code/:code", authenticate, async (req, res) => {
    try {
      const { code } = req.params;
      const room = await storage.getStudyRoomByCode(code);
      
      if (!room) {
        return res.status(404).json({ message: "Study xonasi topilmadi" });
      }

      return res.status(200).json(room);
    } catch (error) {
      console.error("Error fetching study room by code:", error);
      return res.status(500).json({ message: "Study xonasini olishda xatolik" });
    }
  });

  app.post("/api/study-rooms/:id/join", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const room = await storage.getStudyRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Study xonasi topilmadi" });
      }

      // Check if room is private and password is required
      if (room.type === 'private' && room.password) {
        const { password } = req.body;
        if (!password || password !== room.password) {
          return res.status(401).json({ message: "Noto'g'ri parol" });
        }
      }

      // Check participant limit
      if ((room.currentParticipants || 0) >= (room.maxParticipants || 50)) {
        return res.status(400).json({ message: "Xona to'lgan" });
      }

      const participant = await storage.joinStudyRoom(roomId, req.user!.userId);
      return res.status(200).json(participant);
    } catch (error) {
      console.error("Error joining study room:", error);
      return res.status(500).json({ message: "Study xonasiga qo'shilishda xatolik" });
    }
  });

  app.post("/api/study-rooms/:id/leave", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const success = await storage.leaveStudyRoom(roomId, req.user!.userId);
      if (!success) {
        return res.status(400).json({ message: "Xonani tark etishda xatolik" });
      }

      return res.status(200).json({ message: "Xonani muvaffaqiyatli tark etdingiz" });
    } catch (error) {
      console.error("Error leaving study room:", error);
      return res.status(500).json({ message: "Xonani tark etishda xatolik" });
    }
  });

  app.get("/api/study-rooms/:id/participants", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const participants = await storage.getStudyRoomParticipants(roomId);
      return res.status(200).json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      return res.status(500).json({ message: "Ishtirokchilarni olishda xatolik" });
    }
  });

  app.get("/api/my-study-rooms", authenticate, async (req, res) => {
    try {
      const rooms = await storage.getUserStudyRooms(req.user!.userId);
      return res.status(200).json(rooms);
    } catch (error) {
      console.error("Error fetching user study rooms:", error);
      return res.status(500).json({ message: "Sizning xonalaringizni olishda xatolik" });
    }
  });

  app.get("/api/study-rooms/:id/messages", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getStudyRoomMessages(roomId, limit);
      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Xabarlarni olishda xatolik" });
    }
  });

  app.post("/api/study-rooms/:id/messages", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const messageData = schema.insertStudyRoomMessageSchema.parse({
        ...req.body,
        roomId,
        userId: req.user!.userId,
      });

      const newMessage = await storage.createStudyRoomMessage(messageData);
      return res.status(201).json(newMessage);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating message:", error);
      return res.status(500).json({ message: "Xabar yuborishda xatolik" });
    }
  });

  app.get("/api/study-rooms/:id/whiteboard", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const sessions = await storage.getWhiteboardSessions(roomId);
      return res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching whiteboard sessions:", error);
      return res.status(500).json({ message: "Whiteboard sessiyalarini olishda xatolik" });
    }
  });

  app.post("/api/study-rooms/:id/whiteboard", authenticate, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      if (isNaN(roomId)) {
        return res.status(400).json({ message: "Noto'g'ri xona ID" });
      }

      const sessionData = schema.insertWhiteboardSessionSchema.parse({
        ...req.body,
        roomId,
        createdBy: req.user!.userId,
      });

      const newSession = await storage.createWhiteboardSession(sessionData);
      return res.status(201).json(newSession);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: fromZodError(error).details,
        });
      }
      console.error("Error creating whiteboard session:", error);
      return res.status(500).json({ message: "Whiteboard sessiyasini yaratishda xatolik" });
    }
  });

  return httpServer;
}
