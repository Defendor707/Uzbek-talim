# Database Management Guide

## Overview
This project uses PostgreSQL with Drizzle ORM for database management. All database schema changes are tracked through migrations stored in the `migrations/` folder.

## Database Configuration
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit
- **Environment Variables**: DATABASE_URL, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGHOST

## Important Commands

### Development
```bash
# Push schema changes directly to database (development only)
npm run db:push

# Generate migration files from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Open database studio for visual management
npx drizzle-kit studio
```

### Version Control Best Practices

#### ✅ What to commit to Git:
- `shared/schema.ts` - Database schema definitions
- `migrations/*.sql` - Generated migration files
- `migrations/meta/*.json` - Migration metadata
- `drizzle.config.ts` - Drizzle configuration

#### ❌ What NOT to commit:
- `.env` files with actual database credentials
- Local database files
- Connection strings or passwords

## Database Tables (15 core tables)

### User Management
- `users` - Main user accounts with roles
- `student_profiles` - Student-specific information
- `teacher_profiles` - Teacher-specific information  
- `center_profiles` - Educational center information

### Testing System
- `tests` - Test definitions and configuration
- `questions` - Individual test questions
- `test_attempts` - Student test session records
- `student_answers` - Individual question responses

### Learning System
- `lessons` - Educational content and courses
- `subjects` - Academic subject categories
- `schedules` - Class and lesson scheduling

### Communication & Management
- `notifications` - System notifications
- `parent_notification_settings` - Parent alert preferences
- `center_member_requests` - Center membership requests
- `files` - Uploaded file metadata

## Migration Workflow

1. **Make Schema Changes**: Edit `shared/schema.ts`
2. **Generate Migration**: Run `npx drizzle-kit generate`
3. **Review Migration**: Check generated SQL in `migrations/`
4. **Apply to Database**: Run `npx drizzle-kit migrate` (production) or `npm run db:push` (development)
5. **Commit Changes**: Add both schema and migration files to Git

## Environment Setup

Make sure these environment variables are set:
```bash
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-host
PGPORT=5432
PGDATABASE=your-database
PGUSER=your-username
PGPASSWORD=your-password
```

## Backup Strategy

The database schema is preserved through:
- Version-controlled migration files in `migrations/`
- Schema definitions in `shared/schema.ts`
- Drizzle Kit metadata in `migrations/meta/`

This ensures the database structure can be recreated on any environment by applying the migrations in order.