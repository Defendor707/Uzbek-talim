import { pgTable, text, serial, integer, boolean, jsonb, timestamp, foreignKey, pgEnum, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define user roles enum
export const roleEnum = pgEnum('role', ['teacher', 'student', 'parent', 'center']);

// Define test types enum
export const testTypeEnum = pgEnum('test_type', [
  'simple', // Oddiy test
  'open',   // Ochiq test
  'dtm',    // DTM test
  'certificate', // Sertifikat test
  'disciplinary', // Intizomli test
  'public', // Ommaviy test
  'numerical' // Maxsus raqamli test
]);

// Define test statuses enum
export const testStatusEnum = pgEnum('test_status', ['draft', 'active', 'completed']);



// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  fullName: text("full_name").notNull(),
  profileImage: text("profile_image"),
  phone: text("phone"),
  telegramId: text("telegram_id").unique(),
  resetToken: text("reset_token").unique(),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    usernameIdx: index("idx_users_username").on(table.username),
    roleIdx: index("idx_users_role").on(table.role),
    telegramIdIdx: index("idx_users_telegram_id").on(table.telegramId),
    resetTokenIdx: index("idx_users_reset_token").on(table.resetToken),
    activeUsersIdx: index("idx_users_active_role").on(table.isActive, table.role),
    createdAtIdx: index("idx_users_created_at").on(table.createdAt),
    fullTextSearchIdx: index("idx_users_fullname_search").on(table.fullName),
  };
});

// Student profile info
export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileImage: text("profile_image"), // Profil rasmi
  phoneNumber: text("phone_number"), // Telefon raqam
  grade: text("grade"), // O'quv darajasi
  classroom: text("classroom"), // O'quv bosqichi
  certificates: text("certificates").array(),
  bio: text("bio"),
  parentId: integer("parent_id").references(() => users.id),
  centerId: integer("center_id").references(() => users.id),
});

// Teacher profile info
export const teacherProfiles = pgTable("teacher_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileImage: text("profile_image"),
  phoneNumber: text("phone_number"), // Telefon raqam
  specialty: text("specialty"), // Mutaxassislik (max 20 characters)
  subjects: text("subjects").array(), // Fanlar
  bio: text("bio"), // Haqida (max 200 characters)
  experience: integer("experience"), // Tajriba yillarda
  certificates: text("certificates").array(),
  centerId: integer("center_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Center profile info
export const centerProfiles = pgTable("center_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  centerName: text("center_name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number"),
  email: text("email"),
  website: text("website"),
  description: text("description"),
  director: text("director"), // Markaz direktori
  establishedYear: integer("established_year"),
  capacity: integer("capacity"), // O'quvchilar sig'imi
  specializations: text("specializations").array(), // Mutaxassisliklar
  facilities: text("facilities").array(), // Imkoniyatlar
  workingHours: text("working_hours"),
  profileImage: text("profile_image"), // Markaz profil rasmi
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"), // Cover image for the lesson
  subjectId: integer("subject_id").references(() => subjects.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  topic: text("topic"), // Lesson topic/chapter
  learningObjectives: text("learning_objectives").array(), // What students will learn
  keywords: text("keywords").array(), // Search keywords
  
  // Pricing and scheduling fields
  price: numeric("price"), // Lesson price
  duration: integer("duration"), // Total course duration in days
  weeklyHours: integer("weekly_hours"), // How many hours per week
  dailySchedule: text("daily_schedule").array(), // Array of time slots like ["09:00-10:00", "14:00-15:00"]
  dailyLessonDuration: integer("daily_lesson_duration"), // How many hours per day
  
  status: text("status").notNull().default('active'),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table for lesson attachments
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: 'cascade' }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tests table
export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  testImages: text("test_images").array(), // Test uchun rasmlar (maksimal 5 ta)
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  lessonId: integer("lesson_id").references(() => lessons.id),
  grade: text("grade").notNull(),
  classroom: text("classroom"),
  type: testTypeEnum("type").notNull(),
  testCode: text("test_code").unique(), // Maxsus raqamli testlar uchun 6 xonali kod
  duration: integer("duration").notNull(), // in minutes
  totalQuestions: integer("total_questions").notNull(),
  passingScore: integer("passing_score"), // percentage
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: testStatusEnum("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    teacherIdIdx: index("idx_tests_teacher_id").on(table.teacherId),
    gradeIdx: index("idx_tests_grade").on(table.grade),
    testCodeIdx: index("idx_tests_test_code").on(table.testCode),
    statusIdx: index("idx_tests_status").on(table.status),
    typeIdx: index("idx_tests_type").on(table.type),
    activeTestsIdx: index("idx_tests_active").on(table.status, table.startDate, table.endDate),
    teacherStatusIdx: index("idx_tests_teacher_status").on(table.teacherId, table.status),
    gradeTypeIdx: index("idx_tests_grade_type").on(table.grade, table.type),
    dateRangeIdx: index("idx_tests_date_range").on(table.startDate, table.endDate),
    createdAtIdx: index("idx_tests_created_at").on(table.createdAt),
  };
});

// Questions table
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: 'cascade' }),
  questionText: text("question_text").notNull(),
  questionImage: text("question_image"), // Savol uchun rasm URL yoki fayl yo'li
  questionType: testTypeEnum("question_type").notNull(),
  options: jsonb("options"), // Array of options for multiple choice
  correctAnswer: text("correct_answer").notNull(), // Single letter answer: A, B, C, or D
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
}, (table) => {
  return {
    testIdIdx: index("idx_questions_test_id").on(table.testId),
    orderIdx: index("idx_questions_order").on(table.order),
  };
});

// Test attempts by students
export const testAttempts = pgTable("test_attempts", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  score: numeric("score"),
  correctAnswers: integer("correct_answers").default(0),
  totalQuestions: integer("total_questions").notNull(),
  status: text("status").notNull().default('in_progress'), // in_progress, completed
  completed: boolean("completed").default(false),
}, (table) => {
  return {
    studentIdIdx: index("idx_test_attempts_student_id").on(table.studentId),
    testIdIdx: index("idx_test_attempts_test_id").on(table.testId),
    startTimeIdx: index("idx_test_attempts_start_time").on(table.startTime),
    statusIdx: index("idx_test_attempts_status").on(table.status),
  };
});

// Student answers for each question
export const studentAnswers = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => testAttempts.id, { onDelete: 'cascade' }),
  questionId: integer("question_id").notNull().references(() => questions.id),
  answer: jsonb("answer"),
  isCorrect: boolean("is_correct"),
  pointsEarned: numeric("points_earned"),
}, (table) => {
  return {
    attemptIdIdx: index("idx_student_answers_attempt_id").on(table.attemptId),
    questionIdIdx: index("idx_student_answers_question_id").on(table.questionId),
  };
});

// Schedule for teachers and students
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id),
  className: text("class_name"),
  subjectId: integer("subject_id").references(() => subjects.id),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 for Monday-Sunday
  startTime: text("start_time").notNull(), // format: 'HH:MM'
  endTime: text("end_time").notNull(), // format: 'HH:MM'
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parent notification settings table
export const parentNotificationSettings = pgTable("parent_notification_settings", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enableTelegram: boolean("enable_telegram").default(true),
  enableWebsite: boolean("enable_website").default(true),
  minScoreNotification: integer("min_score_notification").default(0),
  maxScoreNotification: integer("max_score_notification").default(100),
  notifyOnlyFailed: boolean("notify_only_failed").default(false),
  notifyOnlyPassed: boolean("notify_only_passed").default(false),
  instantNotification: boolean("instant_notification").default(true),
  dailyDigest: boolean("daily_digest").default(false),
  weeklyDigest: boolean("weekly_digest").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Schema for inserting student profiles
export const insertStudentProfileSchema = createInsertSchema(studentProfiles)
  .omit({ id: true })
  .extend({
    phoneNumber: z.string().optional().or(z.literal('')),
    bio: z.string()
      .max(200, 'Haqida bo\'limi 200 ta harfdan oshmasligi kerak')
      .optional()
      .or(z.literal('')),
  });

// Schema for inserting teacher profiles
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    specialty: z.union([
      z.string()
        .min(2, 'Mutaxassislik kamida 2 ta harfdan iborat bo\'lishi kerak')
        .max(20, 'Mutaxassislik 20 ta harfdan oshmasligi kerak')
        .regex(/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/, 'Mutaxassislikda faqat harflar bo\'lishi mumkin'),
      z.literal('')
    ]).optional(),
    bio: z.string()
      .max(200, 'Haqida bo\'limi 200 ta harfdan oshmasligi kerak')
      .optional(),
    experience: z.number().min(0, 'Tajriba manfiy bo\'lishi mumkin emas').optional(),
  });

// Schema for inserting center profiles
export const insertCenterProfileSchema = createInsertSchema(centerProfiles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    centerName: z.string().min(2, "Markaz nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
    address: z.string().min(10, "Manzil kamida 10 ta belgidan iborat bo'lishi kerak"),
    phoneNumber: z.string().optional(),
    email: z.string().email("Noto'g'ri email format").optional().or(z.literal("")),
    website: z.string().url("Noto'g'ri veb-sayt URL").optional().or(z.literal("")),
    description: z.string().optional(),
    director: z.string().optional(),
    establishedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
    capacity: z.number().min(1).optional(),
    specializations: z.array(z.string()).optional(),
    facilities: z.array(z.string()).optional(),
    workingHours: z.string().optional(),
  });

// Schema for inserting lessons
export const insertLessonSchema = createInsertSchema(lessons)
  .omit({ id: true, createdAt: true, updatedAt: true, viewCount: true, likeCount: true })
  .extend({
    learningObjectives: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    price: z.number().min(0).optional(),
    duration: z.number().min(1).optional(),
    weeklyHours: z.number().min(1).max(168).optional(),
    dailySchedule: z.array(z.string()).optional(),
    dailyLessonDuration: z.number().min(1).max(24).optional(),
  });

// Schema for inserting tests
export const insertTestSchema = createInsertSchema(tests)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    testImages: z.array(z.string()).max(5, 'Maksimal 5 ta rasm yuklash mumkin').optional(),
  });

// Schema for inserting questions
export const insertQuestionSchema = createInsertSchema(questions)
  .omit({ id: true });

// Schema for inserting test attempts
export const insertTestAttemptSchema = createInsertSchema(testAttempts)
  .omit({ id: true, startTime: true, endTime: true });

// Schema for inserting student answers
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers)
  .omit({ id: true });

// Schema for inserting schedules
export const insertScheduleSchema = createInsertSchema(schedules);
export const insertParentNotificationSettingsSchema = createInsertSchema(parentNotificationSettings)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Simplified registration schema with only required fields
export const registerUserSchema = z.object({
  fullName: z.string()
    .min(4, "To'liq ism kamida 4 ta harfdan iborat bo'lishi kerak")
    .max(20, "To'liq ism 20 ta harfdan oshmasligi kerak")
    .regex(/^[a-zA-ZўқғҳҚҒҲЎ\s]+$/, "To'liq ismda faqat harflar va bo'sh joy bo'lishi mumkin"),
  username: z.string()
    .min(3, "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak")
    .max(20, "Foydalanuvchi nomi 20 ta belgidan oshmasligi kerak")
    .regex(/^[a-zA-Z0-9_]+$/, "Foydalanuvchi nomida faqat harflar, raqamlar va pastki chiziq bo'lishi mumkin"),
  password: z.string()
    .min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak")
    .refine((password) => {
      // O'rtacha darajada parol: kamida 6 belgi va kamida bitta harf yoki raqam
      return password.length >= 6 && (/[a-zA-Z]/.test(password) || /\d/.test(password));
    }, "Parol kamida 6 ta belgi va kamida bitta harf yoki raqam bo'lishi kerak"),
  confirmPassword: z.string(),
  role: z.enum(['teacher', 'student', 'parent', 'center'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Parol va takroriy parol bir xil bo'lishi kerak",
  path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, "Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, 'Foydalanuvchi nomini kiriting'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token majburiy'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parollar mos kelmadi',
  path: ['confirmPassword'],
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;

export type CenterProfile = typeof centerProfiles.$inferSelect;
export type InsertCenterProfile = z.infer<typeof insertCenterProfileSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Test = typeof tests.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type ParentNotificationSettings = typeof parentNotificationSettings.$inferSelect;
export type InsertParentNotificationSettings = z.infer<typeof insertParentNotificationSettingsSchema>;





// Center request status enum
export const requestStatusEnum = pgEnum('request_status', ['pending', 'accepted', 'rejected']);

// Center member requests table
export const centerMemberRequests = pgTable("center_member_requests", {
  id: serial("id").primaryKey(),
  centerId: integer("center_id").notNull().references(() => users.id),
  userId: integer("user_id").notNull().references(() => users.id),
  userRole: roleEnum("user_role").notNull(), // teacher or student
  status: requestStatusEnum("status").notNull().default('pending'),
  message: text("message"), // Optional message from center
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => {
  return {
    centerIdIdx: index("idx_center_requests_center_id").on(table.centerId),
    userIdIdx: index("idx_center_requests_user_id").on(table.userId),
    statusIdx: index("idx_center_requests_status").on(table.status),
  };
});

export const insertCenterMemberRequestSchema = createInsertSchema(centerMemberRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type CenterMemberRequest = typeof centerMemberRequests.$inferSelect;
export type InsertCenterMemberRequest = z.infer<typeof insertCenterMemberRequestSchema>;

