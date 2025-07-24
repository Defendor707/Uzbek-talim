# O'zbek Talim - Educational Platform

## Overview

O'zbek Talim is a comprehensive educational management platform designed for the Uzbekistan education system. It serves four main user types: teachers, students, parents, and educational centers.

## Features

### 🎓 Multi-Role System
- **Teachers**: Create tests, manage lessons, track student progress
- **Students**: Take tests, access lessons, view results
- **Parents**: Monitor children's progress, receive notifications
- **Educational Centers**: Manage teachers and students

### 📱 Modern Interface
- Responsive mobile-first design
- Progressive Web App (PWA) support
- Uzbek language interface
- Real-time notifications

### 🔐 Advanced Authentication
- JWT-based authentication system
- Role-based access control
- Telegram bot integration
- Session persistence

### 📊 Test Management
- Multiple test types (simple, DTM, certificate, etc.)
- Image upload support
- Real-time test taking
- Automatic scoring

### 📚 Lesson System
- Lesson creation and management
- Cover image support
- Progress tracking
- Learning objectives

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build system
- TailwindCSS for styling
- Radix UI components
- TanStack Query for state management

### Backend
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- JWT authentication
- File upload support

### External Services
- Telegram Bot API
- Neon serverless PostgreSQL

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Defendor707/Uzbek-talim.git
cd Uzbek-talim
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
```

4. Run the development server:
```bash
npm run dev
```

## Database Schema

The platform uses PostgreSQL with the following main tables:
- `users` - User accounts with role management
- `tests` - Test definitions and metadata
- `questions` - Test questions and answers
- `test_attempts` - Student test submissions
- `lessons` - Educational content
- `notifications` - User notifications

## Contributing

This is an educational platform project. Contributions are welcome following the coding standards established in the project.

## License

This project is developed for educational purposes in Uzbekistan.

## Support

For technical support or questions about the platform, please contact the development team.