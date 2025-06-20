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
import * as schema from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.get("/api/auth/me", authenticate, async (req, res) => {
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

  // Profile image upload
  app.post(
    "/api/users/profile/image",
    authenticate,
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

  app.get("/api/profile/center", authenticate, authorize(["center"]), async (req, res) => {
    try {
      const profile = await storage.getCenterProfile(req.user!.userId);
      if (!profile) {
        return res.status(404).json({ message: "Center profile not found" });
      }
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching center profile:", error);
      return res.status(500).json({ message: "Failed to fetch center profile" });
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
          grade: req.body.grade,
          classroom: req.body.classroom || null,
          duration: parseInt(req.body.duration) || 0,
          totalQuestions: parseInt(req.body.totalQuestions) || 0,
          status: 'active',
        });

        const newTest = await storage.createTest(testData);
        
        // Create questions
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
        
        // Notify bot users and sync with website
        await botNotificationService.notifyTestCreated(newTest);
        await syncService.notifyTestCreated(newTest);
        
        return res.status(201).json(newTest);
      } catch (error) {
        console.error("Error creating test with images:", error);
        return res.status(500).json({ message: "Failed to create test" });
      }
    }
  );

  app.get("/api/tests", authenticate, async (req, res) => {
    try {
      let tests: any[] = [];

      if (req.user?.role === "teacher") {
        // Teachers see their own tests
        tests = await storage.getTestsByTeacherId(req.user.userId);
      } else if (req.user?.role === "student") {
        // Students see active tests for their grade and class
        const profile = await storage.getStudentProfile(req.user.userId);
        if (profile?.grade) {
          tests = await storage.getActiveTestsForStudent(
            profile.grade,
            profile.classroom || undefined
          );
        } else {
          // Return empty array if no profile exists instead of error
          tests = [];
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

  // Public tests endpoint
  app.get("/api/tests/public", authenticate, async (req, res) => {
    try {
      // Get all public tests from all teachers
      const publicTests = await storage.getAllPublicTests();
      return res.status(200).json(publicTests);
    } catch (error) {
      console.error("Error fetching public tests:", error);
      return res.status(500).json({ message: "Failed to fetch public tests" });
    }
  });

  // Universal search endpoint - supports both name and code search
  app.get("/api/tests/search/:query", authenticate, async (req, res) => {
    try {
      const query = req.params.query.toLowerCase().trim();
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // First, try to search by test code (for numerical tests)
      const testByCode = await storage.getTestByCode(query);
      if (testByCode && testByCode.status === 'active') {
        return res.status(200).json([testByCode]);
      }

      // If not found by code, search by title in all public tests
      const publicTests = await storage.getAllPublicTests();
      
      // Search in public tests by title
      const matchingTests = publicTests.filter(test => 
        test.title.toLowerCase().includes(query)
      );

      if (matchingTests.length > 0) {
        return res.status(200).json(matchingTests);
      }

      // No tests found
      return res.status(404).json({ message: "Test topilmadi" });
    } catch (error) {
      console.error("Error searching tests:", error);
      return res.status(500).json({ message: "Failed to search tests" });
    }
  });

  // Public tests endpoint
  app.get("/api/tests/public", authenticate, async (req, res) => {
    try {
      const publicTests = await storage.getAllPublicTests();
      return res.status(200).json(publicTests);
    } catch (error) {
      console.error("Error fetching public tests:", error);
      return res.status(500).json({ message: "Failed to fetch public tests" });
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
    "/api/tests/attempts/:attemptId",
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
          status: "completed",
        });

        return res.status(200).json(updatedAttempt);
      } catch (error) {
        console.error("Error submitting test:", error);
        return res.status(500).json({ message: "Failed to submit test" });
      }
    }
  );

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

  return httpServer;
}
