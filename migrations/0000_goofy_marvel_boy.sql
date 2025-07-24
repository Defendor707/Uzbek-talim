CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('teacher', 'student', 'parent', 'center');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."test_type" AS ENUM('simple', 'open', 'dtm', 'certificate', 'disciplinary', 'public', 'numerical');--> statement-breakpoint
CREATE TABLE "center_member_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"center_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"user_role" "role" NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "center_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"center_name" text NOT NULL,
	"address" text NOT NULL,
	"phone_number" text,
	"email" text,
	"website" text,
	"description" text,
	"director" text,
	"established_year" integer,
	"capacity" integer,
	"specializations" text[],
	"facilities" text[],
	"working_hours" text,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"lesson_id" integer,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image" text,
	"subject_id" integer,
	"teacher_id" integer NOT NULL,
	"topic" text,
	"learning_objectives" text[],
	"keywords" text[],
	"price" numeric,
	"duration" integer,
	"weekly_hours" integer,
	"daily_schedule" text[],
	"daily_lesson_duration" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parent_notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer NOT NULL,
	"enable_telegram" boolean DEFAULT true,
	"enable_website" boolean DEFAULT true,
	"min_score_notification" integer DEFAULT 0,
	"max_score_notification" integer DEFAULT 100,
	"notify_only_failed" boolean DEFAULT false,
	"notify_only_passed" boolean DEFAULT false,
	"instant_notification" boolean DEFAULT true,
	"daily_digest" boolean DEFAULT false,
	"weekly_digest" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_image" text,
	"question_type" "test_type" NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"teacher_id" integer,
	"class_name" text,
	"subject_id" integer,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" jsonb,
	"is_correct" boolean,
	"points_earned" numeric
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"profile_image" text,
	"phone_number" text,
	"grade" text,
	"classroom" text,
	"certificates" text[],
	"bio" text,
	"parent_id" integer,
	"center_id" integer
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "teacher_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"profile_image" text,
	"phone_number" text,
	"specialty" text,
	"subjects" text[],
	"bio" text,
	"experience" integer,
	"certificates" text[],
	"center_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "test_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"score" numeric,
	"correct_answers" integer DEFAULT 0,
	"total_questions" integer NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"test_images" text[],
	"teacher_id" integer NOT NULL,
	"subject_id" integer,
	"lesson_id" integer,
	"grade" text NOT NULL,
	"classroom" text,
	"type" "test_type" NOT NULL,
	"test_code" text,
	"duration" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"passing_score" integer,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" "test_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tests_test_code_unique" UNIQUE("test_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"full_name" text NOT NULL,
	"profile_image" text,
	"phone" text,
	"telegram_id" text,
	"reset_token" text,
	"reset_token_expiry" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id"),
	CONSTRAINT "users_reset_token_unique" UNIQUE("reset_token")
);
--> statement-breakpoint
ALTER TABLE "center_member_requests" ADD CONSTRAINT "center_member_requests_center_id_users_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_member_requests" ADD CONSTRAINT "center_member_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_profiles" ADD CONSTRAINT "center_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_notification_settings" ADD CONSTRAINT "parent_notification_settings_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_center_id_users_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_center_id_users_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_center_requests_center_id" ON "center_member_requests" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_center_requests_user_id" ON "center_member_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_center_requests_status" ON "center_member_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_questions_test_id" ON "questions" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_questions_order" ON "questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_student_answers_attempt_id" ON "student_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_student_answers_question_id" ON "student_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_student_id" ON "test_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_test_id" ON "test_attempts" USING btree ("test_id");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_start_time" ON "test_attempts" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_test_attempts_status" ON "test_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tests_teacher_id" ON "tests" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_tests_grade" ON "tests" USING btree ("grade");--> statement-breakpoint
CREATE INDEX "idx_tests_test_code" ON "tests" USING btree ("test_code");--> statement-breakpoint
CREATE INDEX "idx_tests_status" ON "tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tests_type" ON "tests" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_tests_active" ON "tests" USING btree ("status","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_tests_teacher_status" ON "tests" USING btree ("teacher_id","status");--> statement-breakpoint
CREATE INDEX "idx_tests_grade_type" ON "tests" USING btree ("grade","type");--> statement-breakpoint
CREATE INDEX "idx_tests_date_range" ON "tests" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_tests_created_at" ON "tests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_telegram_id" ON "users" USING btree ("telegram_id");--> statement-breakpoint
CREATE INDEX "idx_users_reset_token" ON "users" USING btree ("reset_token");--> statement-breakpoint
CREATE INDEX "idx_users_active_role" ON "users" USING btree ("is_active","role");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_fullname_search" ON "users" USING btree ("full_name");