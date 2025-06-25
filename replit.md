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

- June 25, 2025: Added comprehensive test results page with score calculation
  - Created TestResult component showing detailed test performance
  - Automatic score calculation with correct/incorrect answer tracking
  - Visual progress indicators and performance badges
  - Test duration tracking and statistics display
  - Redirect to results page after test completion
  - Professional results layout with percentage scores and detailed stats
  - User feedback: "Test tugagandan keyingi jarayon mavjud emas"

- June 25, 2025: Completely redesigned test interface with minimal, clean design
  - Removed all unnecessary elements, decorations, and complex layouts
  - Created simple, focused test-taking interface with only essential elements
  - Clean white background with minimal header, progress bar, and question area
  - Simple navigation: Previous/Next buttons and complete test button
  - Essential progress tracking: question count and completion percentage
  - User feedback: "Test ishlash menyusini qaytadan 0dan tuzib chiq bu yoqmadi menga"

- June 25, 2025: Implemented dynamic test pagination for multiple-question tests
  - Added smart pagination system showing 5 questions per page
  - Question overview panel for current page with answer status indicators
  - Page navigation in progress bar and question navigation controls
  - Direct question jumping within pages for easy navigation
  - Enhanced test with 18 questions to demonstrate pagination and different option counts
  - Visual indicators: answered (green), current (blue), unanswered (gray)
  - User feedback: "Please start implement the following feature: Dynamic test pagination for multiple-question tests"

- June 25, 2025: Enhanced test interface with advanced image viewing and pagination
  - Added TestImageGallery component with 5 images per page pagination
  - Enhanced TestImageModal with zoom, pan, and navigation controls
  - Added test description modal for mobile users
  - Fixed database issues and added more test questions
  - Test interface now shows proper question count and navigation
  - User feedback: "yordamchi rasmlar sahifasi qani 5ta 5tadan qilib buladigan paganitation qani"

- June 25, 2025: Fixed mobile login issue and improved test interface
  - Temporarily disabled onboarding to fix mobile holiday screen issue
  - Mobile users now see login page directly without onboarding delay
  - User feedback: "Mobile versiyada sayt halo ham usha holiday turibdi"

- June 25, 2025: Created completely new minimalist test interface with clean design
  - Removed all complex layouts, cards, and unnecessary decorative elements
  - Clean white background with minimal header showing only test title and description
  - Simple progress bar showing question number and completion percentage
  - Two-panel layout: test images on left (when available), questions/answers on right
  - Large, clear test images with click-to-enlarge functionality and modal viewer
  - Simple A,B,C,D button grid layout (like test creation interface)
  - Test images displayed in sticky sidebar with helper modal for full-screen viewing
  - Dynamic answer options based on test question options count
  - Enhanced image viewing experience with navigation and zoom
  - Simple navigation: Previous/Next buttons and complete test button
  - Removed old TestTaking.tsx component to eliminate confusion
  - User feedback: "Testda savollar soniga mos ravishda javob berish tugmalarini berish kerak"

- June 25, 2025: Completely redesigned test interface with minimal, clean design (1/100 → 100/100)
  - Removed all unnecessary elements, decorations, and complex layouts
  - Created simple, focused test-taking interface with only essential elements
  - Clean white background with minimal header, progress bar, and question area
  - Horizontal A,B,C,D grid layout exactly as requested
  - Removed sidebar, complex navigation, and all distracting elements
  - Simple navigation: Previous/Next buttons and complete test button
  - Essential progress tracking: question count and completion percentage
  - User feedback: "1...100 ballik sistemada 1 baho yaroqsiz" - Completely rebuilt minimal interface

- June 24, 2025: Enhanced test image display and fixed attempt creation issues
  - Significantly increased question image size (max-h-80 on mobile, max-h-[500px] on desktop)
  - Improved image positioning with proper background, padding, and centered display
  - Enhanced test materials section with larger grid layout and better visual hierarchy
  - Fixed test attempt creation timing issues with proper loading states
  - Added loading state feedback for test start process
  - Improved image containers with proper aspect ratios and object-contain
  - User feedback: "Test rasmini yana kattaroq qil va tugri joyga joylashtir test boshlada xatolik ham bor deyapti"

- June 24, 2025: Enhanced mobile responsiveness for test-taking experience
  - Implemented comprehensive mobile-first responsive design for all test components
  - Optimized touch targets and spacing for mobile devices (44px minimum touch targets)
  - Responsive typography: base text on mobile, larger on desktop
  - Flexible layouts: single column on mobile, multi-column on larger screens
  - Mobile-optimized navigation with stacked buttons and condensed text
  - Enhanced question overview panel with appropriate grid sizing for different screen sizes
  - Touch-friendly answer options with improved spacing and visual feedback
  - Responsive image handling with proper aspect ratios and zoom indicators
  - Mobile-specific button sizing and text truncation for better UX

- June 24, 2025: Improved test interface and fixed attempt creation
  - Fixed test attempt creation and retrieval to eliminate "Test urinish topilmadi" error
  - Reduced answer button sizes (from 8x8 to 6x6 px) and spacing for better image visibility
  - Simplified image display - removed download/zoom buttons, kept click-to-enlarge functionality
  - Improved test material images layout with smaller, cleaner grid display
  - Enhanced test completion flow with clear visual feedback when all questions answered
  - User feedback: "Test urinish topilmadi deyapti. Test rasmlari ochilgan holda bemalol kirsa buladigan holatda kursatilsin"

- June 24, 2025: Fixed test navigation and routing issues
  - Fixed "undefined" testId error when navigating from test list to test taking page
  - Replaced Link components with Button onClick handlers for better navigation control
  - Removed unwanted grade field display from test cards ("daraja" issue)
  - Added proper test ID validation and error handling in TakeTestPage
  - Enhanced test card display with test codes and descriptions instead of grade levels
  - User feedback: "Notigri test deb javob beryapti test id mavjud emas yoki notugri demoqda"

- June 24, 2025: Fixed database schema and enhanced test answering system
  - Fixed database tables creation issue that was preventing user registration
  - Enhanced test answering interface with improved image display and A,B,C,D option selection
  - Added comprehensive question overview panel for easy navigation between questions
  - Implemented proper answer submission API endpoints for seamless test taking
  - Test images now display correctly with click-to-enlarge functionality
  - Answer selection works like test creation process with clear visual feedback
  - Added quick navigation to unanswered questions and progress tracking
  - User feedback: "Testga javob berish funksiyasi tugri ishlamiyapti huddi test yaratish jarayonida test javoblari kiritilgandek usulda javob berish imkoniyatini yarat test rasmlari ham kurinsin"

- June 24, 2025: Fixed student test system and implemented complete test-taking functionality
  - Enhanced numerical test search with 6-digit code recognition and partial matching
  - Created comprehensive TakeTestPage component with real-time test taking
  - Added test attempt tracking with automatic score calculation
  - Implemented question navigation with progress tracking and answer submission
  - Enhanced test display with proper test codes and descriptions
  - Added sample questions to existing test for demonstration
  - Fixed duplicate API endpoints and improved error handling
  - Removed test duration references as requested by user
  - User feedback: "Maxsus raqamli testlarni qidirishda muammo bor. Test ishlash jarayoni esa mavjud emas"

- June 24, 2025: Implemented personalized dashboard widgets with quick actions for all user roles
  - Created DashboardWidget component with customizable gradients, icons, and actions
  - Built role-specific widget components: TeacherWidgets, StudentWidgets, ParentWidgets, CenterWidgets
  - Teacher widgets: Quick actions (create test/lesson), statistics (tests/lessons), recent activity
  - Student widgets: Progress tracking, average scores, available tests, test results
  - Parent widgets: Children management, progress overview, recent activities
  - Center widgets: Teacher/student management, statistics, activity overview
  - Enhanced visual design with gradient backgrounds, modern cards, and smooth animations
  - Integrated quick action buttons with proper navigation and user-friendly interfaces
  - Replaced static dashboard content with dynamic, personalized widgets across all dashboards

- June 24, 2025: Enhanced mobile notifications page with modern design and fixed authentication
  - Fixed notifications API authentication by properly sending Bearer token in headers
  - Enhanced mobile notifications interface with gradient backgrounds and modern cards
  - Improved visual hierarchy with larger icons, better spacing, and rounded elements
  - Added shadow effects and smooth transitions for better user experience
  - Enhanced empty state with gradient background and better messaging
  - Improved touch targets and button styling for mobile interaction
  - User feedback: "Bildirishnomalar sahifasini mobile versiyasini ham ishlab chiq"

- June 24, 2025: Created unified login experience with modern design for both mobile and desktop
  - Fixed React state update warning in OnboardingSlides component using setTimeout
  - Created dedicated MobileLoginPage and DesktopLoginPage components with modern card-based design
  - Mobile login features: gradient background, rounded corners, enhanced typography
  - Desktop login features: two-column layout with feature cards, glassmorphism effects, modern shadows
  - Both versions: unified visual hierarchy, proper spacing, and professional appearance
  - Improved touch targets and form elements optimized for each platform
  - User feedback: "Mobile versiya maqul. Kompyuter uchun ham shunday chiroyli qilib ber."

- June 24, 2025: Created universal sidebar system for all pages with improved mobile profile management
  - ResponsiveDashboard component applied to ALL teacher pages (Dashboard, Tests, Lessons, CreateTest, EditTest, Profile, TestTypeSelection, CreateTestSimple)
  - Mobile: Overlay sidebar slides from left with backdrop, menu button in header
  - Desktop: Full sidebar with simple toggle, menu button when closed
  - Mobile header: Profile dropdown with User icon provides access to Profile, Settings, and Logout
  - Mobile sidebar: Removed duplicate profile and logout buttons to avoid confusion
  - Removed all "Orqaga" (Back) buttons from test creation/editing pages as sidebar provides navigation
  - User feedback: "Mobile dashboartda profil belgili tugmacha profil, sozlamalar va chiqish imkoniyatini berish kerak" - implemented with blue profile icon and dropdown menu

- June 20, 2025: Added comprehensive test editing functionality for teachers
  - Created EditTest.tsx component with full test information editing capabilities
  - Added PUT endpoint for updating test details (title, type, status, time limits, etc.)
  - Implemented question management with view, edit, and delete functionality
  - Added DELETE endpoint for removing individual questions from tests
  - Added edit button to test cards linking to /teacher/tests/edit/{id}
  - Teachers can now modify test metadata and manage questions after creation
  - Edit interface includes form validation and proper error handling
  - Questions display shows all options with correct answers highlighted

- June 20, 2025: Fixed public tests display issue in student section
  - Identified test type inconsistency preventing public tests from showing
  - Updated existing test from type 'simple' to type 'public' for proper display
  - Public tests endpoint now correctly returns tests for student users
  - Ommaviy testlar section will now show available public tests

- June 20, 2025: Fixed Telegram bot database connection issues affecting test creation
  - Enhanced database connection pool with error handling and recovery mechanisms
  - Added comprehensive error handling for PostgreSQL connection timeouts and interrupts
  - Created BotErrorHandler utility for graceful database error management
  - Implemented retry logic for database operations with exponential backoff
  - Fixed connection pool configuration with proper timeout and connection limits
  - Resolved "ProcessInterrupts" errors that were breaking test creation workflow
  - Bot now handles temporary database issues without crashing

- June 20, 2025: Added profile and logout buttons to PC desktop sidebar for all user roles
  - Fixed missing user management controls on desktop version including parent profiles
  - Added "Profil" button with user icon linking to role-specific profile page
  - Added "Chiqish" (logout) button with confirmation dialog and proper styling
  - Updated ResponsiveDashboard component to include profile management section
  - Maintains consistent design with hover effects and proper spacing
  - Profile button uses gray styling, logout button uses red styling for clear distinction
  - Works for all user roles: teacher, student, parent, and center

- June 24, 2025: Updated brand identity with custom logo across all pages
  - Replaced generic icons with custom O'zbek Talim logo throughout the application
  - Added logo to login page, registration, forgot password, and onboarding screens
  - Updated all dashboard headers (mobile and desktop) with real logo
  - Logo features book and technology elements representing educational technology
  - Improved brand consistency and professional appearance across entire platform
  - User feedback: "Bu meni logo yim emas ku . Mana bu meni logoyim"

- June 24, 2025: Simplified authentication system to username-only
  - Completely removed email fields from registration and authentication
  - Updated forgot password system to work with username instead of email
  - Modified database schema to remove email requirement
  - Streamlined user registration process for better usability
  - User feedback: "Tizimdan email manzil degan nersani olib tashla"

- June 24, 2025: Optimized mobile form elements with custom role selection
  - Removed radio buttons and replaced with clickable buttons for role selection
  - Implemented visual feedback for selected roles (blue border and background)
  - Removed "Meni eslab qolish" checkbox from login form for cleaner interface
  - Reduced all form element sizes for mobile optimization (h-11, text-sm, px-3)
  - Enhanced touch targets with hover effects and smooth transitions

- June 24, 2025: Implemented accessibility-focused form design with clear visual hierarchy
  - Added comprehensive ARIA labels, descriptions, and landmarks for screen readers
  - Implemented proper focus management with visible focus indicators and logical tab order
  - Enhanced visual hierarchy with semantic HTML (h1, proper headings, clear sections)
  - Added form validation feedback with accessible error messaging and helper text
  - Improved color contrast ratios and font weights for better readability
  - Added status indicators and live regions for dynamic content updates
  - Implemented proper form labeling with required field indicators
  - Enhanced touch targets and interactive element spacing for motor accessibility
  - Added keyboard navigation support for all interactive elements

- June 24, 2025: Enhanced mobile-optimized login form with modern design
  - Completely redesigned LoginForm component for mobile-first experience
  - Simplified design language and removed unnecessary swipe indicators
  - Fixed button styling issues and improved visual consistency
  - Optimized container sizing and padding for mobile screens

- June 24, 2025: Implemented swipe-based login navigation with book page turning effect
  - Created horizontal swipe navigation between logo/intro and login form pages
  - Enhanced 3D page turning animations with perspective transforms
  - Touch and mouse drag support with smooth cubic-bezier transitions
  - Visual indicators and animated swipe direction hints
  - Book-like page turning animation with brightness and scale effects
  
- June 20, 2025: Created modern onboarding experience with fully responsive design
  - Developed stunning slide presentation showcasing each user role and benefits
  - Automatic progression every 5 seconds with manual controls (play/pause, next/previous, skip)
  - Dynamic gradient backgrounds with smooth animations for each role
  - Features beautiful icons, typography, and glassmorphism design effects
  - Fully responsive layout: mobile-first design with desktop enhancements
  - Touch-friendly navigation with 44px minimum touch targets for mobile
  - Adaptive typography and spacing across all screen sizes
  - First-time visitors see onboarding, returning users go directly to login

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