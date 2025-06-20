# O'zbek Talim - Educational Platform

## Overview

O'zbek Talim is a comprehensive educational management platform designed for the Uzbekistan education system. It serves four main user types: teachers, students, parents, and educational centers. The platform enables test creation, lesson management, student progress tracking, and parent-child educational oversight.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom mobile-first responsive utilities
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: JWT-based authentication with role-based access control

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon serverless)
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Handling**: Multer for multipart form data and file uploads
- **Real-time Communication**: WebSocket integration for live updates
- **External Integration**: Telegram Bot API for notifications

### Database Design
- **User Management**: Role-based user system (teacher, student, parent, center)
- **Profile System**: Separate profile tables for each user type with specific attributes
- **Test Management**: Comprehensive test creation with multiple question types and images
- **Assessment Tracking**: Test attempts, scoring, and progress monitoring
- **Content Management**: Lesson storage with file attachments

## Key Components

### Authentication & Authorization
- Multi-role authentication system supporting four user types
- JWT-based session management with automatic token refresh
- Protected routes with role-based access control
- Telegram integration for alternative login methods

### Test Management System
- Multiple test types: simple, open, DTM, certificate, disciplinary, public, numerical
- Image upload support for test materials and questions
- Batch question creation with pagination
- Real-time test taking with progress tracking
- Automated scoring and result generation
- Excel export functionality for test results

### User Profile Management
- Role-specific profile forms with validation
- Profile image uploads and management
- Parent-child relationship management
- Teacher specialty and experience tracking
- Student grade and classroom assignment

### File Management
- Secure file upload system with type validation
- Static file serving for uploaded content
- Image optimization and storage
- Support for various document formats (PDF, DOC, XLS, PPT)

## Data Flow

### User Registration & Authentication
1. User selects role and provides registration details
2. Password is hashed using bcrypt before storage
3. JWT token is generated upon successful login
4. Token is validated on each protected request
5. User data is cached client-side with React Query

### Test Creation & Management
1. Teacher creates test with basic information
2. Images are uploaded and stored in uploads directory
3. Questions are created in batches with answer options
4. Test is published with unique access code
5. Students access test using code or direct assignment

### Assessment Flow
1. Student starts test attempt (creates attempt record)
2. Answers are collected and stored incrementally
3. Timer tracks elapsed time and enforces limits
4. Test is auto-submitted when time expires
5. Scoring is calculated and results are stored
6. Notifications are sent via Telegram bot

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for type-safe database operations
- **Authentication**: jsonwebtoken and bcrypt for security
- **File Handling**: multer for uploads
- **Validation**: zod for runtime type checking
- **UI Components**: @radix-ui/* for accessible component primitives

### Development Dependencies
- **Build Tools**: vite, esbuild for bundling
- **TypeScript**: Full TypeScript support across frontend and backend
- **Development Server**: tsx for TypeScript execution
- **CSS Processing**: postcss, tailwindcss, autoprefixer

### External Services
- **Telegram Bot API**: For notifications and alternative user interface
- **Neon Database**: Serverless PostgreSQL hosting
- **File Storage**: Local file system with static serving

## Deployment Strategy

### Development Environment
- Concurrent frontend (Vite) and backend (tsx) execution
- Hot module replacement for frontend development
- Database migrations using Drizzle Kit
- Environment variable configuration for database connection

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles Node.js application
- Static file serving through Express
- Database schema deployment through migration system

### Hosting Configuration
- Replit deployment with autoscale configuration
- PostgreSQL module integration
- Port configuration for external access
- WebSocket support for real-time features

## User Preferences

Preferred communication style: Simple, everyday language.
Dashboard design: User requested improved navigation without dropdown menus for better usability.

## Recent Changes

- June 20, 2025: Created modern onboarding experience with fully responsive design
  - Developed stunning slide presentation showcasing each user role and benefits
  - Automatic progression every 5 seconds with manual controls (play/pause, next/previous, skip)
  - Dynamic gradient backgrounds with smooth animations for each role
  - Features beautiful icons, typography, and glassmorphism design effects
  - Fully responsive layout: mobile-first design with desktop enhancements
  - Touch-friendly navigation with 44px minimum touch targets for mobile
  - Adaptive typography and spacing across all screen sizes
  - First-time visitors see onboarding, returning users go directly to login
  - Added option to replay onboarding from login page
  - Maintains simple, convenient login form after onboarding completion
  - Perfect blend of marketing appeal and practical functionality

- June 20, 2025: Added educational centers count to platform statistics
  - Enhanced Telegram bot statistics to include O'quv markazlari (educational centers) count
  - Platform statistics now shows complete breakdown: teachers, students, parents, and centers
  - Maintains consistency across all statistical displays in the bot interface

- June 20, 2025: Fixed navigation badges and bot statistics completely
  - Added dynamic test/lesson count badges to navigation (updates when new content created)
  - Fixed bot statistics button to show user information instead of generic message
  - Statistics now shows platform stats for non-logged users and personal stats for logged users
  - Navigation badges persist across all pages and update automatically

- June 20, 2025: Fixed Telegram bot registration system completely
  - Corrected password/passwordHash field mapping in bot.ts and storage.ts
  - Fixed createUser method to properly handle password hashing
  - Updated login flow to use passwordHash field correctly
  - Resolved TypeScript errors in error handling
  - Bot registration now works seamlessly with website authentication
  - Telegram bot token verified and functional

- June 20, 2025: Complete responsive design system with 100% mobile/PC optimization
  - Created unified ResponsiveDashboard component replacing all separate mobile/desktop components
  - Desktop layout: Full sidebar navigation with user profile section
  - Mobile layout: Sticky header with profile dropdown + bottom navigation (3 main sections)
  - Moved profile and logout functionality to header dropdown menu only
  - Removed ALL separate logout buttons from sidebar, pages, and other locations
  - Applied ResponsiveDashboard to all pages (Tests, Lessons, Dashboard, etc.)
  - Bottom navigation persists across all pages and contains only 3 essential sections per role
  - Fixed navigation disappearing issue when moving between pages
  - Added comprehensive CSS utility classes for responsive grids and layouts
  - Implemented touch-friendly interactive elements with proper sizing (44px minimum)
  - Enhanced mobile navigation with visual feedback and smooth transitions
  - Safe area handling for modern mobile devices with notches
  - Optimized typography scaling across screen sizes
  - Applied responsive-grid-2-4 pattern: 2 columns mobile, 4 columns desktop
  - All user roles (Teacher, Student, Parent, Center) now use unified responsive system
  - Eliminated code duplication and improved maintainability
  - Centralized user account management in profile dropdown only

## Changelog

Changelog:
- June 20, 2025: Dashboard navigation system completely redesigned for better usability
- June 16, 2025: Initial setup