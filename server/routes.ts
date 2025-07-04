import type { Express } from "express";
import { createServer, type Server } from "http";
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
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Apply middleware for request logging and auto-save
  app.use(requestLogger);
  app.use(autoSaveMiddleware);

  // General user statistics
  app.get("/api/stats", statisticsCache, async (req, res) => {
    try {
      const stats = await storage.getGeneralStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Test routes
  app.get("/api/tests", authenticate, testsCache, async (req, res) => {
    try {
      const tests = await storage.getTestsByUserId(req.user!.userId);
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ error: "Failed to fetch tests" });
    }
  });

  app.get("/api/tests/:id", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const test = await storage.getTestById(testId);
      
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error fetching test:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

  app.post("/api/tests", authenticate, uploadLimiter.middleware, async (req, res) => {
    try {
      const testData = schema.insertTestSchema.parse({
        ...req.body,
        userId: req.user!.userId
      });
      
      const newTest = await storage.createTest(testData);
      invalidateTestsCache();
      res.status(201).json(newTest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error creating test:", error);
      res.status(500).json({ error: "Failed to create test" });
    }
  });

  app.put("/api/tests/:id", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const testData = schema.insertTestSchema.parse(req.body);
      
      const updatedTest = await storage.updateTest(testId, testData);
      invalidateTestsCache();
      res.json(updatedTest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error updating test:", error);
      res.status(500).json({ error: "Failed to update test" });
    }
  });

  app.delete("/api/tests/:id", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      await storage.deleteTest(testId);
      invalidateTestsCache();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting test:", error);
      res.status(500).json({ error: "Failed to delete test" });
    }
  });

  // Question routes
  app.post("/api/tests/:id/questions", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const questionData = schema.insertQuestionSchema.parse({
        ...req.body,
        testId
      });
      
      const newQuestion = await storage.createQuestion(questionData);
      invalidateTestsCache();
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.get("/api/tests/:id/questions", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const questions = await storage.getQuestionsByTestId(testId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.delete("/api/questions/:id", authenticate, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      await storage.deleteQuestion(questionId);
      invalidateTestsCache();
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Test attempt routes
  app.post("/api/tests/:id/attempts", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const attemptData = schema.insertTestAttemptSchema.parse({
        testId,
        userId: req.user!.userId,
        startTime: new Date(),
        status: 'in_progress'
      });
      
      const newAttempt = await storage.createTestAttempt(attemptData);
      res.status(201).json(newAttempt);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error creating test attempt:", error);
      res.status(500).json({ error: "Failed to create test attempt" });
    }
  });

  app.get("/api/attempts/:id", authenticate, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attempt = await storage.getTestAttemptById(attemptId);
      
      if (!attempt) {
        return res.status(404).json({ error: "Test attempt not found" });
      }
      
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching test attempt:", error);
      res.status(500).json({ error: "Failed to fetch test attempt" });
    }
  });

  app.put("/api/attempts/:id", authenticate, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedAttempt = await storage.updateTestAttempt(attemptId, updateData);
      res.json(updatedAttempt);
    } catch (error) {
      console.error("Error updating test attempt:", error);
      res.status(500).json({ error: "Failed to update test attempt" });
    }
  });

  // Student answer routes
  app.post("/api/attempts/:id/answers", authenticate, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const answerData = schema.insertStudentAnswerSchema.parse({
        ...req.body,
        attemptId
      });
      
      const newAnswer = await storage.createStudentAnswer(answerData);
      res.status(201).json(newAnswer);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error creating student answer:", error);
      res.status(500).json({ error: "Failed to create student answer" });
    }
  });

  app.get("/api/attempts/:id/answers", authenticate, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const answers = await storage.getStudentAnswersByAttemptId(attemptId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching student answers:", error);
      res.status(500).json({ error: "Failed to fetch student answers" });
    }
  });

  // Profile routes
  app.get("/api/profile", authenticate, profileCache, async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticate, async (req, res) => {
    try {
      const profileData = req.body;
      const updatedProfile = await storage.updateUserProfile(req.user!.userId, profileData);
      invalidateUserCache(req.user!.userId);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Lesson routes
  app.get("/api/lessons", authenticate, lessonsCache, async (req, res) => {
    try {
      const searchQuery = req.query.q as string;
      const lessons = await storage.getLessons(searchQuery);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons", authenticate, uploadLimiter.middleware, async (req, res) => {
    try {
      const lessonData = schema.insertLessonSchema.parse({
        ...req.body,
        userId: req.user!.userId
      });
      
      const newLesson = await storage.createLesson(lessonData);
      invalidateLessonsCache();
      res.status(201).json(newLesson);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error creating lesson:", error);
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  // File upload routes
  app.post("/api/upload/test-image", authenticate, uploadTestImage, (req, res) => {
    res.json({ filename: req.file?.filename });
  });

  app.post("/api/upload/question-image", authenticate, uploadQuestionImage, (req, res) => {
    res.json({ filename: req.file?.filename });
  });

  app.post("/api/upload/lesson-file", authenticate, uploadLessonFile, (req, res) => {
    res.json({ filename: req.file?.filename });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Notification routes
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Excel export routes
  app.get("/api/export/test-report/:testId", authenticate, async (req, res) => {
    try {
      const testId = parseInt(req.params.testId);
      const buffer = await generateTestReportExcel(testId);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="test-report-${testId}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating test report:", error);
      res.status(500).json({ error: "Failed to generate test report" });
    }
  });

  app.get("/api/export/student-progress/:studentId", authenticate, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const buffer = await generateStudentProgressExcel(studentId);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="student-progress-${studentId}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating student progress report:", error);
      res.status(500).json({ error: "Failed to generate student progress report" });
    }
  });

  // Role-specific routes
  
  // Teacher routes
  app.get("/api/teacher/profile", authenticate, authorize(['teacher']), async (req, res) => {
    try {
      const profile = await storage.getTeacherProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching teacher profile:", error);
      res.status(500).json({ error: "Failed to fetch teacher profile" });
    }
  });

  app.put("/api/teacher/profile", authenticate, authorize(['teacher']), async (req, res) => {
    try {
      const profileData = schema.insertTeacherProfileSchema.parse(req.body);
      const updatedProfile = await storage.updateTeacherProfile(req.user!.userId, profileData);
      invalidateUserCache(req.user!.userId);
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error updating teacher profile:", error);
      res.status(500).json({ error: "Failed to update teacher profile" });
    }
  });

  app.post("/api/teacher/upload-image", authenticate, authorize(['teacher']), uploadProfileImage, async (req, res) => {
    try {
      const filename = req.file?.filename;
      if (!filename) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      await storage.updateTeacherProfileImage(req.user!.userId, filename);
      invalidateUserCache(req.user!.userId);
      res.json({ filename });
    } catch (error) {
      console.error("Error uploading teacher profile image:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  // Student routes
  app.get("/api/student/profile", authenticate, authorize(['student']), async (req, res) => {
    try {
      const profile = await storage.getStudentProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ error: "Failed to fetch student profile" });
    }
  });

  app.put("/api/student/profile", authenticate, authorize(['student']), async (req, res) => {
    try {
      const profileData = schema.insertStudentProfileSchema.parse(req.body);
      const updatedProfile = await storage.updateStudentProfile(req.user!.userId, profileData);
      invalidateUserCache(req.user!.userId);
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error updating student profile:", error);
      res.status(500).json({ error: "Failed to update student profile" });
    }
  });

  app.post("/api/student/upload-image", authenticate, authorize(['student']), uploadProfileImage, async (req, res) => {
    try {
      const filename = req.file?.filename;
      if (!filename) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      await storage.updateStudentProfileImage(req.user!.userId, filename);
      invalidateUserCache(req.user!.userId);
      res.json({ filename });
    } catch (error) {
      console.error("Error uploading student profile image:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  // Parent routes
  app.get("/api/parent/profile", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const profile = await storage.getParentProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching parent profile:", error);
      res.status(500).json({ error: "Failed to fetch parent profile" });
    }
  });

  app.put("/api/parent/profile", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const profileData = req.body;
      const updatedProfile = await storage.updateParentProfile(req.user!.userId, profileData);
      invalidateUserCache(req.user!.userId);
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating parent profile:", error);
      res.status(500).json({ error: "Failed to update parent profile" });
    }
  });

  app.get("/api/parent/children", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const children = await storage.getParentChildren(req.user!.userId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching parent children:", error);
      res.status(500).json({ error: "Failed to fetch children" });
    }
  });

  app.post("/api/parent/children", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const { childUsername } = req.body;
      const result = await storage.addParentChild(req.user!.userId, childUsername);
      res.json(result);
    } catch (error) {
      console.error("Error adding parent child:", error);
      res.status(500).json({ error: "Failed to add child" });
    }
  });

  app.get("/api/parent/test-results", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const results = await storage.getParentTestResults(req.user!.userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching parent test results:", error);
      res.status(500).json({ error: "Failed to fetch test results" });
    }
  });

  app.get("/api/parent/notification-settings", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const settings = await storage.getParentNotificationSettings(req.user!.userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching parent notification settings:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/parent/notification-settings", authenticate, authorize(['parent']), async (req, res) => {
    try {
      const settingsData = schema.insertParentNotificationSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateParentNotificationSettings(req.user!.userId, settingsData);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error updating parent notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  });

  // Center routes
  app.get("/api/center/profile", authenticate, authorize(['center']), async (req, res) => {
    try {
      const profile = await storage.getCenterProfile(req.user!.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching center profile:", error);
      res.status(500).json({ error: "Failed to fetch center profile" });
    }
  });

  app.put("/api/center/profile", authenticate, authorize(['center']), async (req, res) => {
    try {
      const profileData = schema.insertCenterProfileSchema.parse(req.body);
      const updatedProfile = await storage.updateCenterProfile(req.user!.userId, profileData);
      invalidateUserCache(req.user!.userId);
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation error",
          details: fromZodError(error).details
        });
      }
      console.error("Error updating center profile:", error);
      res.status(500).json({ error: "Failed to update center profile" });
    }
  });

  app.post("/api/center/upload-image", authenticate, authorize(['center']), uploadProfileImage, async (req, res) => {
    try {
      const filename = req.file?.filename;
      if (!filename) {
        return res.status(400).json({ error: "No image uploaded" });
      }
      
      await storage.updateCenterProfileImage(req.user!.userId, filename);
      invalidateUserCache(req.user!.userId);
      res.json({ filename });
    } catch (error) {
      console.error("Error uploading center profile image:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  // Public test routes
  app.get("/api/public-tests", authenticate, async (req, res) => {
    try {
      const tests = await storage.getPublicTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching public tests:", error);
      res.status(500).json({ error: "Failed to fetch public tests" });
    }
  });

  app.get("/api/tests/code/:code", authenticate, async (req, res) => {
    try {
      const code = req.params.code;
      const test = await storage.getTestByCode(code);
      
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }
      
      res.json(test);
    } catch (error) {
      console.error("Error fetching test by code:", error);
      res.status(500).json({ error: "Failed to fetch test" });
    }
  });

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

  // Error handling middleware
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket sync service
  syncService.init(httpServer);

  return httpServer;
}