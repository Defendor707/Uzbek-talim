# Database Schema Documentation

## Complete Table Structure (15 Tables)

### User Management System

#### 1. users
Main user table with role-based access control
```sql
- id: serial PRIMARY KEY
- username: text UNIQUE NOT NULL
- passwordHash: text NOT NULL
- role: enum('teacher', 'student', 'parent', 'center')
- fullName: text NOT NULL
- profileImage: text
- phone: text
- telegramId: text UNIQUE
- resetToken: text UNIQUE
- resetTokenExpiry: timestamp
- isActive: boolean DEFAULT true
- createdAt: timestamp DEFAULT NOW()
- updatedAt: timestamp DEFAULT NOW()
```

#### 2. student_profiles
Student-specific profile information
```sql
- id: serial PRIMARY KEY
- userId: integer → users.id CASCADE
- profileImage: text
- phoneNumber: text
- grade: text
- classroom: text
- certificates: text[]
- bio: text
- parentId: integer → users.id
- centerId: integer → users.id
```

#### 3. teacher_profiles
Teacher-specific profile information
```sql
- id: serial PRIMARY KEY
- userId: integer → users.id CASCADE
- profileImage: text
- phoneNumber: text
- specialty: text (max 20 chars)
- subjects: text[]
- bio: text (max 200 chars)
- experience: integer
- certificates: text[]
- centerId: integer → users.id
- createdAt: timestamp
- updatedAt: timestamp
```

#### 4. center_profiles
Educational center information
```sql
- id: serial PRIMARY KEY
- userId: integer → users.id CASCADE
- centerName: text NOT NULL
- address: text NOT NULL
- phoneNumber: text
- email: text
- website: text
- description: text
- director: text
- establishedYear: integer
- capacity: integer
- specializations: text[]
- facilities: text[]
- workingHours: text
- profileImage: text
- createdAt: timestamp
- updatedAt: timestamp
```

### Testing System

#### 5. tests
Test definitions and configuration
```sql
- id: serial PRIMARY KEY
- title: text NOT NULL
- description: text
- teacherId: integer → users.id NOT NULL
- subjectId: integer → subjects.id
- grade: text
- classroom: text
- difficulty: text
- duration: integer (minutes)
- passingScore: integer
- questionCount: integer
- testType: enum('simple', 'open', 'dtm', 'certificate', 'disciplinary', 'public', 'numerical')
- status: enum('draft', 'active', 'completed')
- testCode: text UNIQUE
- startTime: timestamp
- endTime: timestamp
- allowRetake: boolean
- isPublic: boolean
- coverImage: text
- createdAt: timestamp
- updatedAt: timestamp
```

#### 6. questions
Individual test questions
```sql
- id: serial PRIMARY KEY
- testId: integer → tests.id CASCADE
- questionText: text NOT NULL
- questionImage: text
- questionType: test_type NOT NULL
- options: jsonb (array of options)
- correctAnswer: text NOT NULL
- points: integer DEFAULT 1
- order: integer NOT NULL
```

#### 7. test_attempts
Student test session records
```sql
- id: serial PRIMARY KEY
- testId: integer → tests.id
- studentId: integer → users.id
- startTime: timestamp
- endTime: timestamp
- score: numeric
- totalQuestions: integer
- correctAnswers: integer
- isPassed: boolean
- timeSpent: integer (seconds)
- status: text DEFAULT 'in_progress'
- createdAt: timestamp
```

#### 8. student_answers
Individual question responses
```sql
- id: serial PRIMARY KEY
- attemptId: integer → test_attempts.id CASCADE
- questionId: integer → questions.id
- answer: jsonb
- isCorrect: boolean
- pointsEarned: numeric
```

### Learning System

#### 9. lessons
Educational content and courses
```sql
- id: serial PRIMARY KEY
- title: text NOT NULL
- description: text
- coverImage: text
- subjectId: integer → subjects.id
- teacherId: integer → users.id NOT NULL
- topic: text
- learningObjectives: text[]
- keywords: text[]
- price: numeric
- duration: integer (total course duration in days)
- weeklyHours: integer
- dailySchedule: text[]
- dailyLessonDuration: integer
- status: text DEFAULT 'active'
- viewCount: integer DEFAULT 0
- likeCount: integer DEFAULT 0
- createdAt: timestamp
- updatedAt: timestamp
```

#### 10. subjects
Academic subject categories
```sql
- id: serial PRIMARY KEY
- name: text NOT NULL
- description: text
```

#### 11. schedules
Class and lesson scheduling
```sql
- id: serial PRIMARY KEY
- teacherId: integer → users.id
- className: text
- subjectId: integer → subjects.id
- dayOfWeek: integer (1-7 for Monday-Sunday)
- startTime: text (format: 'HH:MM')
- endTime: text (format: 'HH:MM')
```

### Communication & Management

#### 12. notifications
System notifications
```sql
- id: serial PRIMARY KEY
- userId: integer → users.id CASCADE
- title: text NOT NULL
- message: text NOT NULL
- isRead: boolean DEFAULT false
- createdAt: timestamp
```

#### 13. parent_notification_settings
Parent alert preferences
```sql
- id: serial PRIMARY KEY
- parentId: integer → users.id CASCADE
- enableTelegram: boolean DEFAULT true
- enableWebsite: boolean DEFAULT true
- minScoreNotification: integer DEFAULT 0
- maxScoreNotification: integer DEFAULT 100
- notifyOnlyFailed: boolean DEFAULT false
- notifyOnlyPassed: boolean DEFAULT false
- instantNotification: boolean DEFAULT true
- dailyDigest: boolean DEFAULT false
- weeklyDigest: boolean DEFAULT false
- createdAt: timestamp
- updatedAt: timestamp
```

#### 14. center_member_requests
Center membership requests
```sql
- id: serial PRIMARY KEY
- centerId: integer → users.id NOT NULL
- userId: integer → users.id NOT NULL
- userRole: role NOT NULL
- status: enum('pending', 'accepted', 'rejected') DEFAULT 'pending'
- message: text
- createdAt: timestamp
- respondedAt: timestamp
```

#### 15. files
Uploaded file metadata
```sql
- id: serial PRIMARY KEY
- filename: text NOT NULL
- path: text NOT NULL
- mimeType: text NOT NULL
- size: integer NOT NULL
- lessonId: integer → lessons.id
- uploadedBy: integer → users.id
- createdAt: timestamp
```

## Database Enums

### role
```sql
'teacher', 'student', 'parent', 'center'
```

### test_type
```sql
'simple', 'open', 'dtm', 'certificate', 'disciplinary', 'public', 'numerical'
```

### test_status
```sql
'draft', 'active', 'completed'
```

### request_status
```sql
'pending', 'accepted', 'rejected'
```

## Key Relationships

- **Users → Profiles**: One-to-one relationships with role-specific profile tables
- **Users → Tests**: Teachers create tests, students take them
- **Tests → Questions**: One-to-many relationship
- **Tests → Attempts**: One-to-many relationship
- **Attempts → Answers**: One-to-many relationship
- **Parents → Students**: One-to-many relationship for family oversight
- **Centers → Members**: Many-to-many through membership requests
- **Lessons → Files**: One-to-many for educational materials

## Version Control Strategy

All schema changes are tracked through:
1. **Migration Files** (`migrations/*.sql`) - Applied database changes
2. **Schema Definition** (`shared/schema.ts`) - TypeScript schema source
3. **Migration Metadata** (`migrations/meta/*.json`) - Drizzle tracking files

This ensures complete reproducibility across environments.