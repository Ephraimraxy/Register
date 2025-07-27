# Training Management System

## Overview

This is a comprehensive training management system built with React, TypeScript, Express.js, and PostgreSQL. The application handles multi-role registration (trainees, staff, and resource persons), room allocation, and verification-based authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and React Hook Form for form state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

### Database Schema
The system uses PostgreSQL with the following key entities:
- **Users**: Base user table with role-based identification
- **Trainees**: Extended user data with accommodation details
- **Staff**: Administrative personnel with department/position info
- **Resource Persons**: Training facilitators with specialization data
- **Verification Codes**: Time-limited codes for identity verification

## Key Components

### Authentication & Verification
- Code-based verification system (email/SMS)
- Multi-role user registration (trainee, staff, resource person)
- Session-based authentication with PostgreSQL storage

### Room Allocation System
- Automatic room assignment based on gender
- Block and room number tracking
- Availability checking for accommodation

### Registration Flow
- Multi-step form for trainee registration
- Real-time form validation using Zod schemas
- Verification code generation and validation
- Automatic tag number generation

### Data Management
- CRUD operations for all user types
- Search and filtering capabilities
- Export functionality for trainee data

## Data Flow

1. **User Registration**: Multi-step form → validation → verification code → database storage
2. **Verification**: Code generation → delivery (email/SMS) → validation → user activation
3. **Room Allocation**: Gender-based assignment → availability check → room assignment
4. **Data Retrieval**: Database queries → API responses → React Query caching → UI updates

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle with drizzle-kit for migrations
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: TanStack Query for API state management

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Strict mode with path mapping
- **Linting**: ESLint configuration
- **Styling**: PostCSS with Tailwind CSS

### Future Integrations
- Email service (Nodemailer or similar) for verification codes
- SMS service for phone verification
- File upload for document management

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Database migrations via drizzle-kit push

### Production Build
- Vite builds optimized React bundle to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving through Express in production
- Database schema management through Drizzle migrations

### Environment Configuration
- `DATABASE_URL` required for PostgreSQL connection
- `NODE_ENV` for environment-specific behavior
- Session configuration for production security

### Hosting Considerations
- Serverless-compatible architecture
- Static assets served from Express
- Database connection pooling via Neon
- Environment variables for sensitive configuration

The application is designed for scalability with a clear separation between client and server code, type-safe database operations, and a component-based UI architecture that supports both development and production deployments.