import { eq, and, inArray, like, desc, sql, or, ilike, gt } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import bcrypt from 'bcrypt';

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined>;
  getUsersByRole(role: string): Promise<schema.User[]>;

  // Password reset methods
  createResetToken(username: string): Promise<string | null>;
  getUserByResetToken(token: string): Promise<schema.User | undefined>;
  resetPassword(token: string, newPasswordHash: string): Promise<boolean>;

  // Profile related methods
  createStudentProfile(profile: schema.InsertStudentProfile): Promise<schema.StudentProfile>;
  getStudentProfile(userId: number): Promise<schema.StudentProfile | undefined>;
  updateStudentProfile(userId: number, profileData: Partial<schema.InsertStudentProfile>): Promise<schema.StudentProfile | undefined>;
  createTeacherProfile(profile: schema.InsertTeacherProfile): Promise<schema.TeacherProfile>;
  getTeacherProfile(userId: number): Promise<schema.TeacherProfile | undefined>;
  updateTeacherProfile(userId: number, profileData: Partial<schema.InsertTeacherProfile>): Promise<schema.TeacherProfile | undefined>;
  createCenterProfile(profile: schema.InsertCenterProfile): Promise<schema.CenterProfile>;
  getCenterProfile(userId: number): Promise<schema.CenterProfile | undefined>;
  updateCenterProfile(userId: number, profileData: Partial<schema.InsertCenterProfile>): Promise<schema.CenterProfile | undefined>;

  // Center management methods
  getTeachersByCenter(centerId: number): Promise<schema.User[]>;
  getStudentsByCenter(centerId: number): Promise<schema.User[]>;
  assignTeacherToCenter(teacherId: number, centerId: number): Promise<boolean>;
  assignStudentToCenter(studentId: number, centerId: number): Promise<boolean>;

  // Lesson related methods
  createLesson(lesson: schema.InsertLesson): Promise<schema.Lesson>;
  getLessonById(id: number): Promise<schema.Lesson | undefined>;
  updateLesson(id: number, lesson: Partial<schema.InsertLesson>): Promise<schema.Lesson | undefined>;
  deleteLessonById(id: number): Promise<boolean>;
  getLessonsByTeacherId(teacherId: number): Promise<schema.Lesson[]>;
  getLessonsByGrade(grade: string): Promise<schema.Lesson[]>;
  searchLessons(query: string): Promise<schema.Lesson[]>;
  getLessons(): Promise<schema.Lesson[]>;


  // Test related methods
  createTest(test: schema.InsertTest): Promise<schema.Test>;
  getTestById(id: number): Promise<schema.Test | undefined>;
  getTestByCode(testCode: string): Promise<schema.Test | undefined>;
  updateTest(id: number, test: Partial<schema.InsertTest>): Promise<schema.Test | undefined>;
  deleteTestById(id: number): Promise<boolean>;
  getTestsByTeacherId(teacherId: number): Promise<schema.Test[]>;
  getTestsByGradeAndClassroom(grade: string, classroom?: string): Promise<schema.Test[]>;
  getActiveTestsForStudent(grade: string, classroom?: string): Promise<schema.Test[]>;
  getAllPublicTests(): Promise<schema.Test[]>;
  getTestsByUserId(userId: string): Promise<schema.Test[]>;

  // Question related methods
  createQuestion(question: schema.InsertQuestion): Promise<schema.Question>;
  getQuestionsByTestId(testId: number): Promise<schema.Question[]>;
  deleteQuestionById(id: number): Promise<boolean>;

  // Test attempt related methods
  createTestAttempt(attempt: schema.InsertTestAttempt): Promise<schema.TestAttempt>;
  getTestAttemptById(id: number): Promise<schema.TestAttempt | undefined>;
  updateTestAttempt(id: number, attempt: Partial<schema.TestAttempt>): Promise<schema.TestAttempt | undefined>;
  getTestAttemptsByStudentId(studentId: number): Promise<schema.TestAttempt[]>;
  getTestAttemptsByTestId(testId: number): Promise<schema.TestAttempt[]>;

  // Student answer related methods
  createStudentAnswer(answer: schema.InsertStudentAnswer): Promise<schema.StudentAnswer>;
  getStudentAnswersByAttemptId(attemptId: number): Promise<schema.StudentAnswer[]>;

  // Schedule related methods
  createSchedule(schedule: schema.InsertSchedule): Promise<schema.Schedule>;
  getSchedulesByTeacherId(teacherId: number): Promise<schema.Schedule[]>;
  getSchedulesByClassName(className: string): Promise<schema.Schedule[]>;

  // Parent-child relationship methods
  addChildToParent(parentId: number, childUsername: string): Promise<boolean>;
  getChildrenByParentId(parentId: number): Promise<any[]>;

  // Parent notification settings methods
  createParentNotificationSettings(settings: schema.InsertParentNotificationSettings): Promise<schema.ParentNotificationSettings>;
  getParentNotificationSettings(parentId: number): Promise<schema.ParentNotificationSettings | undefined>;
  updateParentNotificationSettings(parentId: number, settings: Partial<schema.InsertParentNotificationSettings>): Promise<schema.ParentNotificationSettings | undefined>;

  // Center search methods
  searchCenters(filters: { query?: string; city?: string; specialization?: string }): Promise<any[]>;

  // Missing methods from routes.ts
  getUserProfile(userId: number): Promise<any | undefined>;
  updateUserProfile(userId: number, profileData: any): Promise<any | undefined>;
  getNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  updateTeacherProfileImage(userId: number, profileImage: string): Promise<boolean>;
  updateStudentProfileImage(userId: number, profileImage: string): Promise<boolean>;
  getParentProfile(userId: number): Promise<any | undefined>;
  updateParentProfile(userId: number, profileData: any): Promise<any | undefined>;
  getParentChildren(parentId: number): Promise<any[]>;
  addParentChild(parentId: number, childUsername: string): Promise<boolean>;
  getParentTestResults(parentId: number): Promise<any[]>;
  updateCenterProfileImage(userId: number, profileImage: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User related methods
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }



  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async createUser(user: any): Promise<schema.User> {
    // Hash the password before storing
    const passwordToHash = user.password || user.passwordHash;
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    const userData = { 
      username: user.username,
      passwordHash: hashedPassword,
      role: user.role,
      fullName: user.fullName,
      profileImage: user.profileImage,
      phone: user.phone,
      telegramId: user.telegramId,
      isActive: true
    };

    const [newUser] = await db.insert(schema.users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, userData: any): Promise<schema.User | undefined> {
    const updateData: any = { ...userData };

    // If updating password, hash it
    if (userData.password) {
      updateData.passwordHash = await bcrypt.hash(userData.password, 10);
      delete updateData.password;
    }

    updateData.updatedAt = new Date();

    const [updatedUser] = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning();

    return updatedUser;
  }

  async getUsersByRole(role: string): Promise<schema.User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, role as any));
  }

  // Profile related methods
  async createStudentProfile(profile: schema.InsertStudentProfile): Promise<schema.StudentProfile> {
    const [newProfile] = await db.insert(schema.studentProfiles).values(profile).returning();
    return newProfile;
  }

  async getStudentProfile(userId: number): Promise<schema.StudentProfile | undefined> {
    const [profile] = await db.select().from(schema.studentProfiles).where(eq(schema.studentProfiles.userId, userId));
    return profile;
  }

  async updateStudentProfile(userId: number, profileData: Partial<schema.InsertStudentProfile>): Promise<schema.StudentProfile | undefined> {
    const [updatedProfile] = await db
      .update(schema.studentProfiles)
      .set(profileData)
      .where(eq(schema.studentProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  async createTeacherProfile(profile: schema.InsertTeacherProfile): Promise<schema.TeacherProfile> {
    const [newProfile] = await db.insert(schema.teacherProfiles).values(profile).returning();
    return newProfile;
  }

  async getTeacherProfile(userId: number): Promise<schema.TeacherProfile | undefined> {
    const [profile] = await db.select().from(schema.teacherProfiles).where(eq(schema.teacherProfiles.userId, userId));
    return profile;
  }

  async updateTeacherProfile(userId: number, profileData: Partial<schema.InsertTeacherProfile>): Promise<schema.TeacherProfile | undefined> {
    const [updatedProfile] = await db
      .update(schema.teacherProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(schema.teacherProfiles.userId, userId))
      .returning();

    return updatedProfile;
  }

  async createCenterProfile(profile: schema.InsertCenterProfile): Promise<schema.CenterProfile> {
    const [newProfile] = await db.insert(schema.centerProfiles).values(profile).returning();
    return newProfile;
  }

  async getCenterProfile(userId: number): Promise<schema.CenterProfile | undefined> {
    const [profile] = await db.select().from(schema.centerProfiles).where(eq(schema.centerProfiles.userId, userId));
    return profile;
  }

  async updateCenterProfile(userId: number, profileData: Partial<schema.InsertCenterProfile>): Promise<schema.CenterProfile | undefined> {
    const [updatedProfile] = await db
      .update(schema.centerProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(schema.centerProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Center management methods
  async getTeachersByCenter(centerId: number): Promise<any[]> {
    const results = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
      fullName: schema.users.fullName,
      profileImage: schema.users.profileImage,
      phone: schema.users.phone,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
      // Teacher profile fields
      phoneNumber: schema.teacherProfiles.phoneNumber,
      specialty: schema.teacherProfiles.specialty,
      subjects: schema.teacherProfiles.subjects,
      bio: schema.teacherProfiles.bio,
      experience: schema.teacherProfiles.experience,
      certificates: schema.teacherProfiles.certificates,
    })
    .from(schema.users)
    .innerJoin(schema.teacherProfiles, eq(schema.users.id, schema.teacherProfiles.userId))
    .where(and(
      eq(schema.users.role, 'teacher'),
      eq(schema.teacherProfiles.centerId, centerId)
    ));
    return results;
  }

  async getStudentsByCenter(centerId: number): Promise<any[]> {
    const results = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      role: schema.users.role,
      fullName: schema.users.fullName,
      profileImage: schema.users.profileImage,
      phone: schema.users.phone,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
      // Student profile fields
      phoneNumber: schema.studentProfiles.phoneNumber,
      grade: schema.studentProfiles.grade,
      classroom: schema.studentProfiles.classroom,
      certificates: schema.studentProfiles.certificates,
      bio: schema.studentProfiles.bio,
    })
    .from(schema.users)
    .innerJoin(schema.studentProfiles, eq(schema.users.id, schema.studentProfiles.userId))
    .where(and(
      eq(schema.users.role, 'student'),
      eq(schema.studentProfiles.centerId, centerId)
    ));
    return results;
  }

  async assignTeacherToCenter(teacherId: number, centerId: number): Promise<boolean> {
    try {
      await db.update(schema.teacherProfiles)
        .set({ centerId })
        .where(eq(schema.teacherProfiles.userId, teacherId));
      return true;
    } catch (error) {
      console.error('Error assigning teacher to center:', error);
      return false;
    }
  }

  async assignStudentToCenter(studentId: number, centerId: number): Promise<boolean> {
    try {
      await db.update(schema.studentProfiles)
        .set({ centerId })
        .where(eq(schema.studentProfiles.userId, studentId));
      return true;
    } catch (error) {
      console.error('Error assigning student to center:', error);
      return false;
    }
  }

  // Lesson related methods
  async createLesson(lesson: schema.InsertLesson): Promise<schema.Lesson> {
    const lessonData = {
      ...lesson,
      price: lesson.price?.toString() // Convert number to string for numeric type
    };
    const [newLesson] = await db.insert(schema.lessons).values(lessonData).returning();
    return newLesson;
  }

  async getLessonById(id: number): Promise<schema.Lesson | undefined> {
    const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id));
    return lesson;
  }

  async updateLesson(id: number, lessonData: Partial<schema.InsertLesson>): Promise<schema.Lesson | undefined> {
    const updateData = {
      ...lessonData,
      price: lessonData.price?.toString(), // Convert number to string for numeric type
      updatedAt: new Date()
    };

    const [updatedLesson] = await db
      .update(schema.lessons)
      .set(updateData)
      .where(eq(schema.lessons.id, id))
      .returning();

    return updatedLesson;
  }

  async deleteLessonById(id: number): Promise<boolean> {
    const result = await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
    return true;
  }

  async getLessonsByTeacherId(teacherId: number): Promise<schema.Lesson[]> {
    return await db.select().from(schema.lessons).where(eq(schema.lessons.teacherId, teacherId));
  }

  async getLessonsByGrade(grade: string): Promise<schema.Lesson[]> {
    return await db.select()
      .from(schema.lessons)
      .where(eq(schema.lessons.status, 'active'))
      .orderBy(desc(schema.lessons.createdAt));
  }

  async searchLessons(query: string): Promise<schema.Lesson[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db.select()
      .from(schema.lessons)
      .where(and(
        eq(schema.lessons.status, 'active'),
        or(
          sql`LOWER(${schema.lessons.title}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.lessons.description}) LIKE ${searchPattern}`,
          sql`LOWER(${schema.lessons.topic}) LIKE ${searchPattern}`
        )
      ))
      .orderBy(desc(schema.lessons.createdAt));
  }

  // Test related methods
  async createTest(test: schema.InsertTest): Promise<schema.Test> {
    const [newTest] = await db.insert(schema.tests).values(test).returning();
    return newTest;
  }

  async getTestById(id: number): Promise<schema.Test | undefined> {
    const [test] = await db.select().from(schema.tests).where(eq(schema.tests.id, id));
    return test;
  }

  async getTestByCode(testCode: string): Promise<schema.Test | undefined> {
    const [test] = await db.select().from(schema.tests).where(eq(schema.tests.testCode, testCode));
    return test;
  }

  async updateTest(id: number, testData: Partial<schema.InsertTest>): Promise<schema.Test | undefined> {
    const [updatedTest] = await db
      .update(schema.tests)
      .set({ ...testData, updatedAt: new Date() })
      .where(eq(schema.tests.id, id))
      .returning();

    return updatedTest;
  }

  async deleteTestById(id: number): Promise<boolean> {
    const result = await db.delete(schema.tests).where(eq(schema.tests.id, id));
    return true;
  }

  // Get tests by teacher ID
  async getTestsByTeacherId(teacherId: number): Promise<schema.Test[]> {
    try {
      const tests = await db
        .select()
        .from(schema.tests)
        .where(eq(schema.tests.teacherId, teacherId))
        .orderBy(desc(schema.tests.createdAt));

      return tests;
    } catch (error) {
      console.error('Error fetching tests by teacher ID:', error);
      throw error;
    }
  }

  // Get tests by user ID (for different roles)
  async getTestsByUserId(userId: string): Promise<schema.Test[]> {
    try {
      const userIdNum = parseInt(userId);
      const user = await this.getUser(userIdNum);
      
      if (!user) return [];

      if (user.role === 'teacher') {
        // Teachers see their own tests
        return await this.getTestsByTeacherId(userIdNum);
      } else {
        // Students and others see all active tests
        const tests = await db
          .select()
          .from(schema.tests)
          .where(eq(schema.tests.status, 'active'))
          .orderBy(desc(schema.tests.createdAt));
        return tests;
      }
    } catch (error) {
      console.error('Error fetching tests by user ID:', error);
      return [];
    }
  }

  // Get all lessons (for general access)
  async getLessons(): Promise<schema.Lesson[]> {
    try {
      const lessons = await db
        .select()
        .from(schema.lessons)
        .where(eq(schema.lessons.status, 'published'))
        .orderBy(desc(schema.lessons.createdAt));

      return lessons;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  async getTestsByGradeAndClassroom(grade: string, classroom?: string): Promise<schema.Test[]> {
    if (classroom) {
      return await db.select().from(schema.tests).where(
        and(
          eq(schema.tests.grade, grade),
          eq(schema.tests.classroom, classroom)
        )
      );
    } else {
      return await db.select().from(schema.tests).where(eq(schema.tests.grade, grade));
    }
  }

  async getActiveTestsForStudent(grade: string, classroom?: string): Promise<schema.Test[]> {
    const now = new Date();

    if (classroom) {
      return await db.select().from(schema.tests).where(
        and(
          eq(schema.tests.grade, grade),
          eq(schema.tests.status, 'active'),
          eq(schema.tests.classroom, classroom)
        )
      );
    } else {
      return await db.select().from(schema.tests).where(
        and(
          eq(schema.tests.grade, grade),
          eq(schema.tests.status, 'active')
        )
      );
    }
  }

  // Question related methods
  async createQuestion(question: schema.InsertQuestion): Promise<schema.Question> {
    const [newQuestion] = await db.insert(schema.questions).values(question).returning();
    return newQuestion;
  }

  async getQuestionsByTestId(testId: number): Promise<schema.Question[]> {
    return await db
      .select()
      .from(schema.questions)
      .where(eq(schema.questions.testId, testId))
      .orderBy(schema.questions.order);
  }

  async deleteQuestionById(id: number): Promise<boolean> {
    try {
      await db.delete(schema.questions).where(eq(schema.questions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting question:", error);
      return false;
    }
  }

  // Test attempt related methods
  async createTestAttempt(attempt: schema.InsertTestAttempt): Promise<schema.TestAttempt> {
    const [newAttempt] = await db.insert(schema.testAttempts).values(attempt).returning();
    return newAttempt;
  }

  async getTestAttemptById(id: number): Promise<schema.TestAttempt | undefined> {
    const [attempt] = await db.select().from(schema.testAttempts).where(eq(schema.testAttempts.id, id));
    return attempt;
  }

  async updateTestAttempt(id: number, attemptData: Partial<schema.TestAttempt>): Promise<schema.TestAttempt | undefined> {
    const [updatedAttempt] = await db
      .update(schema.testAttempts)
      .set(attemptData)
      .where(eq(schema.testAttempts.id, id))
      .returning();

    return updatedAttempt;
  }

  async getTestAttemptsByStudentId(studentId: number): Promise<schema.TestAttempt[]> {
    return await db.select().from(schema.testAttempts).where(eq(schema.testAttempts.studentId, studentId));
  }

  async getTestAttemptsByTestId(testId: number): Promise<schema.TestAttempt[]> {
    return await db.select().from(schema.testAttempts).where(eq(schema.testAttempts.testId, testId));
  }

  // Student answer related methods
  async createStudentAnswer(answer: schema.InsertStudentAnswer): Promise<schema.StudentAnswer> {
    // First, delete any existing answer for this question in this attempt
    await db.delete(schema.studentAnswers)
      .where(
        and(
          eq(schema.studentAnswers.attemptId, answer.attemptId),
          eq(schema.studentAnswers.questionId, answer.questionId)
        )
      );

    // Then insert the new answer
    const [newAnswer] = await db.insert(schema.studentAnswers).values(answer).returning();
    return newAnswer;
  }

  async getStudentAnswersByAttemptId(attemptId: number): Promise<schema.StudentAnswer[]> {
    return await db.select().from(schema.studentAnswers).where(eq(schema.studentAnswers.attemptId, attemptId));
  }

  // Schedule related methods
  async createSchedule(schedule: schema.InsertSchedule): Promise<schema.Schedule> {
    const [newSchedule] = await db.insert(schema.schedules).values(schedule).returning();
    return newSchedule;
  }

  async getSchedulesByTeacherId(teacherId: number): Promise<schema.Schedule[]> {
    return await db.select().from(schema.schedules).where(eq(schema.schedules.teacherId, teacherId));
  }

  async getSchedulesByClassName(className: string): Promise<schema.Schedule[]> {
    return await db.select().from(schema.schedules).where(eq(schema.schedules.className, className));
  }

  // Parent-child relationship methods
  async addChildToParent(parentId: number, childUsername: string): Promise<boolean> {
    try {
      // Find the child user by username
      const child = await this.getUserByUsername(childUsername);
      if (!child) {
        throw new Error('Farzand foydalanuvchi topilmadi');
      }

      // Check if child is a student
      if (child.role !== 'student') {
        throw new Error('Farzand o\'quvchi rolida bo\'lishi kerak');
      }

      // Check if child already has a parent using raw SQL for reliability
      const existingParentCheck = await db.execute(sql`
        SELECT parent_id FROM student_profiles WHERE user_id = ${child.id} AND parent_id IS NOT NULL
      `);

      if (existingParentCheck.rows.length > 0) {
        throw new Error('Bu farzand allaqachon boshqa ota-onaga bog\'langan');
      }

      // Get existing student profile
      const existingProfile = await this.getStudentProfile(child.id);

      if (existingProfile) {
        // Update existing profile with parent relationship
        await db.execute(sql`
          UPDATE student_profiles SET parent_id = ${parentId} WHERE user_id = ${child.id}
        `);
      } else {
        // Create new student profile with parent relationship
        await db.execute(sql`
          INSERT INTO student_profiles (user_id, parent_id, grade, phone_number, bio)
          VALUES (${child.id}, ${parentId}, '10', '', '')
        `);
      }

      return true;
    } catch (error) {
      console.error("Error adding child to parent:", error);
      throw error;
    }
  }

  async getChildrenByParentId(parentId: number): Promise<any[]> {
    console.log('Getting children for parent ID:', parentId);

    try {
      // Use raw SQL directly for reliability - removed email column as it doesn't exist
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.full_name as "fullName",
          u.username,
          sp.phone_number as "phoneNumber",
          sp.bio,
          sp.grade
        FROM users u
        INNER JOIN student_profiles sp ON u.id = sp.user_id
        WHERE sp.parent_id = ${parentId}
      `);

      console.log('Found children:', result.rows.length);

      return result.rows.map((child: any) => ({
        ...child,
        firstName: child.fullName?.split(' ')[0] || child.username,
        lastName: child.fullName?.split(' ').slice(1).join(' ') || ''
      }));
    } catch (error) {
      console.error('Error in getChildrenByParentId:', error);
      return [];
    }
  }

  async createResetToken(username: string): Promise<string | null> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) {
        return null;
      }

      // Generate reset token
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await db
        .update(schema.users)
        .set({ 
          resetToken, 
          resetTokenExpiry,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, user.id));

      return resetToken;
    } catch (error) {
      console.error('Error creating reset token:', error);
      return null;
    }
  }

  async getUserByResetToken(token: string): Promise<schema.User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.resetToken, token),
            gt(schema.users.resetTokenExpiry, new Date())
          )
        );
      return user;
    } catch (error) {
      console.error('Error getting user by reset token:', error);
      return undefined;
    }
  }

  async resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
    try {
      const user = await this.getUserByResetToken(token);
      if (!user) {
        return false;
      }

      await db
        .update(schema.users)
        .set({ 
          passwordHash: newPasswordHash,
          resetToken: null,
          resetTokenExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, user.id));

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.telegramId, telegramId));
    return user;
  }

  async getAllPublicTests(): Promise<schema.Test[]> {
    const tests = await db.select()
      .from(schema.tests)
      .where(and(
        eq(schema.tests.status, 'active'),
        eq(schema.tests.type, 'public')
      ))
      .orderBy(desc(schema.tests.createdAt));
    return tests;
  }

  // Parent notification settings methods
  async createParentNotificationSettings(settings: schema.InsertParentNotificationSettings): Promise<schema.ParentNotificationSettings> {
    const result = await db.insert(schema.parentNotificationSettings).values(settings).returning();
    return result[0];
  }

  async getParentNotificationSettings(parentId: number): Promise<schema.ParentNotificationSettings | undefined> {
    const result = await db.select().from(schema.parentNotificationSettings)
      .where(eq(schema.parentNotificationSettings.parentId, parentId))
      .limit(1);
    return result[0];
  }

  async updateParentNotificationSettings(parentId: number, settings: Partial<schema.InsertParentNotificationSettings>): Promise<schema.ParentNotificationSettings | undefined> {
    const result = await db.update(schema.parentNotificationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(schema.parentNotificationSettings.parentId, parentId))
      .returning();
    return result[0];
  }

  async searchCenters(filters: { query?: string; city?: string; specialization?: string }): Promise<any[]> {
    try {
      // Build where conditions array
      let whereConditions = [eq(schema.users.role, 'center')];

      if (filters.query) {
        const queryCondition = or(
          ilike(schema.centerProfiles.centerName, `%${filters.query}%`),
          ilike(schema.centerProfiles.description, `%${filters.query}%`),
          ilike(schema.centerProfiles.director, `%${filters.query}%`)
        );
        if (queryCondition) {
          whereConditions.push(queryCondition);
        }
      }

      if (filters.city) {
        whereConditions.push(ilike(schema.centerProfiles.address, `%${filters.city}%`));
      }

      if (filters.specialization) {
        whereConditions.push(
          sql`${schema.centerProfiles.specializations} @> ${JSON.stringify([filters.specialization])}`
        );
      }

      const result = await db.select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.users.fullName,
        centerName: schema.centerProfiles.centerName,
        address: schema.centerProfiles.address,
        phoneNumber: schema.centerProfiles.phoneNumber,
        email: schema.centerProfiles.email,
        website: schema.centerProfiles.website,
        description: schema.centerProfiles.description,
        director: schema.centerProfiles.director,
        establishedYear: schema.centerProfiles.establishedYear,
        capacity: schema.centerProfiles.capacity,
        specializations: schema.centerProfiles.specializations,
        facilities: schema.centerProfiles.facilities,
        workingHours: schema.centerProfiles.workingHours,
        profileImage: schema.centerProfiles.profileImage,
      })
      .from(schema.users)
      .innerJoin(schema.centerProfiles, eq(schema.users.id, schema.centerProfiles.userId))
      .where(and(...whereConditions));

      return result;
    } catch (error) {
      console.error('Error searching centers:', error);
      return [];
    }
  }

  // Missing methods implementation
  async getUserProfile(userId: number): Promise<any | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;

      switch (user.role) {
        case 'student':
          return await this.getStudentProfile(userId);
        case 'teacher':
          return await this.getTeacherProfile(userId);
        case 'parent':
          return user; // Parents don't have separate profiles
        case 'center':
          return await this.getCenterProfile(userId);
        default:
          return user;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      return undefined;
    }
  }

  async updateUserProfile(userId: number, profileData: any): Promise<any | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) return undefined;

      switch (user.role) {
        case 'student':
          return await this.updateStudentProfile(userId, profileData);
        case 'teacher':
          return await this.updateTeacherProfile(userId, profileData);
        case 'center':
          return await this.updateCenterProfile(userId, profileData);
        default:
          return undefined;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return undefined;
    }
  }

  async getNotifications(userId: number): Promise<any[]> {
    try {
      const notifications = await db.select()
        .from(schema.notifications)
        .where(eq(schema.notifications.userId, userId))
        .orderBy(desc(schema.notifications.createdAt));
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.id, notificationId));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async updateTeacherProfileImage(userId: number, profileImage: string): Promise<boolean> {
    try {
      await db.update(schema.teacherProfiles)
        .set({ profileImage })
        .where(eq(schema.teacherProfiles.userId, userId));
      return true;
    } catch (error) {
      console.error('Error updating teacher profile image:', error);
      return false;
    }
  }

  async updateStudentProfileImage(userId: number, profileImage: string): Promise<boolean> {
    try {
      await db.update(schema.studentProfiles)
        .set({ profileImage })
        .where(eq(schema.studentProfiles.userId, userId));
      return true;
    } catch (error) {
      console.error('Error updating student profile image:', error);
      return false;
    }
  }

  async getParentProfile(userId: number): Promise<any | undefined> {
    try {
      const user = await this.getUser(userId);
      return user;
    } catch (error) {
      console.error('Error getting parent profile:', error);
      return undefined;
    }
  }

  async updateParentProfile(userId: number, profileData: any): Promise<any | undefined> {
    try {
      const [updatedUser] = await db.update(schema.users)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating parent profile:', error);
      return undefined;
    }
  }

  async getParentChildren(parentId: number): Promise<any[]> {
    return await this.getChildrenByParentId(parentId);
  }

  async addParentChild(parentId: number, childUsername: string): Promise<boolean> {
    return await this.addChildToParent(parentId, childUsername);
  }

  async getParentTestResults(parentId: number): Promise<any[]> {
    try {
      const children = await this.getChildrenByParentId(parentId);
      const childIds = children.map(child => child.id);
      
      if (childIds.length === 0) return [];

      const testResults = await db.select({
        attemptId: schema.testAttempts.id,
        testId: schema.testAttempts.testId,
        studentId: schema.testAttempts.studentId,
        startTime: schema.testAttempts.startTime,
        endTime: schema.testAttempts.endTime,
        score: schema.testAttempts.score,
        correctAnswers: schema.testAttempts.correctAnswers,
        totalQuestions: schema.testAttempts.totalQuestions,
        completed: schema.testAttempts.completed,
        testTitle: schema.tests.title,
        testType: schema.tests.type,
        studentName: schema.users.fullName
      })
      .from(schema.testAttempts)
      .innerJoin(schema.tests, eq(schema.testAttempts.testId, schema.tests.id))
      .innerJoin(schema.users, eq(schema.testAttempts.studentId, schema.users.id))
      .where(inArray(schema.testAttempts.studentId, childIds))
      .orderBy(desc(schema.testAttempts.startTime));

      return testResults;
    } catch (error) {
      console.error('Error getting parent test results:', error);
      return [];
    }
  }

  async updateCenterProfileImage(userId: number, profileImage: string): Promise<boolean> {
    try {
      await db.update(schema.centerProfiles)
        .set({ profileImage })
        .where(eq(schema.centerProfiles.userId, userId));
      return true;
    } catch (error) {
      console.error('Error updating center profile image:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();