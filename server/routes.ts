import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, authorize, login, register } from "./utils/auth";
import { upload, uploadLessonFile, uploadProfileImage } from "./utils/upload";
import express from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as schema from "@shared/schema";

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
      const { password, ...userData } = user;
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
        const { password, ...userData } = user;
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

      const { password, ...userData } = updatedUser;
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
        if (!profile) {
          return res.status(404).json({ message: "Student profile not found" });
        }
        lessons = await storage.getLessonsByGrade(profile.grade);
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

  app.get("/api/tests", authenticate, async (req, res) => {
    try {
      let tests;

      if (req.user?.role === "teacher") {
        // Teachers see their own tests
        tests = await storage.getTestsByTeacherId(req.user.userId);
      } else if (req.user?.role === "student") {
        // Students see active tests for their grade and class
        const profile = await storage.getStudentProfile(req.user.userId);
        if (!profile) {
          return res.status(404).json({ message: "Student profile not found" });
        }
        tests = await storage.getActiveTestsForStudent(
          profile.grade,
          profile.classroom
        );
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

  // Test Attempt Routes
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
