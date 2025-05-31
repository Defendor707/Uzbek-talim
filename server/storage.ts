import { eq, and, inArray, like } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import bcrypt from 'bcrypt';

export interface IStorage {
  // User related methods
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getUserByUsername(username: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined>;
  getUsersByRole(role: string): Promise<schema.User[]>;
  
  // Profile related methods
  createStudentProfile(profile: schema.InsertStudentProfile): Promise<schema.StudentProfile>;
  getStudentProfile(userId: number): Promise<schema.StudentProfile | undefined>;
  createTeacherProfile(profile: schema.InsertTeacherProfile): Promise<schema.TeacherProfile>;
  getTeacherProfile(userId: number): Promise<schema.TeacherProfile | undefined>;
  updateTeacherProfile(userId: number, profileData: Partial<schema.InsertTeacherProfile>): Promise<schema.TeacherProfile | undefined>;
  createCenterProfile(profile: schema.InsertCenterProfile): Promise<schema.CenterProfile>;
  getCenterProfile(userId: number): Promise<schema.CenterProfile | undefined>;
  
  // Lesson related methods
  createLesson(lesson: schema.InsertLesson): Promise<schema.Lesson>;
  getLessonById(id: number): Promise<schema.Lesson | undefined>;
  updateLesson(id: number, lesson: Partial<schema.InsertLesson>): Promise<schema.Lesson | undefined>;
  deleteLessonById(id: number): Promise<boolean>;
  getLessonsByTeacherId(teacherId: number): Promise<schema.Lesson[]>;
  getLessonsByGrade(grade: string): Promise<schema.Lesson[]>;
  
  // Test related methods
  createTest(test: schema.InsertTest): Promise<schema.Test>;
  getTestById(id: number): Promise<schema.Test | undefined>;
  updateTest(id: number, test: Partial<schema.InsertTest>): Promise<schema.Test | undefined>;
  deleteTestById(id: number): Promise<boolean>;
  getTestsByTeacherId(teacherId: number): Promise<schema.Test[]>;
  getTestsByGradeAndClassroom(grade: string, classroom?: string): Promise<schema.Test[]>;
  getActiveTestsForStudent(grade: string, classroom?: string): Promise<schema.Test[]>;
  
  // Question related methods
  createQuestion(question: schema.InsertQuestion): Promise<schema.Question>;
  getQuestionsByTestId(testId: number): Promise<schema.Question[]>;
  
  // Test attempt related methods
  createTestAttempt(attempt: schema.InsertTestAttempt): Promise<schema.TestAttempt>;
  getTestAttemptById(id: number): Promise<schema.TestAttempt | undefined>;
  updateTestAttempt(id: number, attempt: Partial<schema.TestAttempt>): Promise<schema.TestAttempt | undefined>;
  getTestAttemptsByStudentId(studentId: number): Promise<schema.TestAttempt[]>;
  
  // Student answer related methods
  createStudentAnswer(answer: schema.InsertStudentAnswer): Promise<schema.StudentAnswer>;
  getStudentAnswersByAttemptId(attemptId: number): Promise<schema.StudentAnswer[]>;
  
  // Schedule related methods
  createSchedule(schedule: schema.InsertSchedule): Promise<schema.Schedule>;
  getSchedulesByTeacherId(teacherId: number): Promise<schema.Schedule[]>;
  getSchedulesByClassName(className: string): Promise<schema.Schedule[]>;
}

export class DatabaseStorage implements IStorage {
  // User related methods
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }
  
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userData = { ...user, password: hashedPassword };
    
    const [newUser] = await db.insert(schema.users).values(userData).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    // If updating password, hash it
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    
    const [updatedUser] = await db
      .update(schema.users)
      .set({ ...userData, updatedAt: new Date() })
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
  
  // Lesson related methods
  async createLesson(lesson: schema.InsertLesson): Promise<schema.Lesson> {
    const [newLesson] = await db.insert(schema.lessons).values(lesson).returning();
    return newLesson;
  }
  
  async getLessonById(id: number): Promise<schema.Lesson | undefined> {
    const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id));
    return lesson;
  }
  
  async updateLesson(id: number, lessonData: Partial<schema.InsertLesson>): Promise<schema.Lesson | undefined> {
    const [updatedLesson] = await db
      .update(schema.lessons)
      .set({ ...lessonData, updatedAt: new Date() })
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
    return await db.select().from(schema.lessons).where(eq(schema.lessons.grade, grade));
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
  
  async getTestsByTeacherId(teacherId: number): Promise<schema.Test[]> {
    return await db.select().from(schema.tests).where(eq(schema.tests.teacherId, teacherId));
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
  
  // Student answer related methods
  async createStudentAnswer(answer: schema.InsertStudentAnswer): Promise<schema.StudentAnswer> {
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
}

export const storage = new DatabaseStorage();
