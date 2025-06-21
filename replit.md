# Wedding Gallery Application

## Overview

This is a modern, Instagram-style wedding gallery application built with React, Express, and PostgreSQL. The application allows wedding guests to upload photos, videos, and notes, share stories, create timeline events, and manage music wishlists. It features a sophisticated admin panel, dark mode support, and real-time collaboration capabilities.

## System Architecture

The application follows a full-stack monorepo structure with clear separation between client and server code:

**Frontend (React/TypeScript)**
- Modern React application using TypeScript
- Vite for development and building
- Tailwind CSS with custom components
- shadcn/ui component library integration
- Mobile-first responsive design

**Backend (Express/Node.js)**
- Express.js server with TypeScript
- RESTful API architecture (routes to be implemented)
- Session management and user identification
- File upload handling

**Database Layer**
- PostgreSQL database with Drizzle ORM
- Type-safe database operations
- Schema-first approach with validation
- Migration support

## Key Components

### Frontend Architecture
- **Component Structure**: Well-organized React components with clear separation of concerns
- **State Management**: React hooks for local state, custom hooks for shared logic
- **Routing**: Client-side routing handled by URL parameters and conditional rendering
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with dark mode support and custom animations

### Backend Architecture
- **API Layer**: Express.js with middleware for logging and error handling
- **Storage Interface**: Abstracted storage layer with both memory and database implementations
- **Development Setup**: Vite integration for hot reloading during development
- **Production Build**: ESBuild for server bundling

### Database Design
- **User Management**: Simple user schema with username/password authentication
- **Type Safety**: Drizzle ORM with Zod validation schemas
- **Migration System**: Database migrations handled by Drizzle Kit

## Data Flow

1. **User Authentication**: Device-based identification with optional username/password for admin functions
2. **Media Upload**: Files processed through Express middleware, stored via Firebase integration
3. **Real-time Updates**: Firebase Firestore for live data synchronization
4. **Comment System**: CRUD operations for comments with user association
5. **Like System**: Toggle-based like functionality with user tracking

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and modern patterns
- **Express**: Backend web framework
- **Drizzle ORM**: Type-safe database operations
- **Vite**: Build tool and development server

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Database and Storage
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **connect-pg-simple**: PostgreSQL session store

### External Services Integration
- **Firebase**: Real-time database and file storage (configured but not in schema)
- **Spotify API**: Music wishlist integration
- **Replit**: Development environment integration

## Deployment Strategy

**Development Environment**
- Replit-based development with hot reloading
- PostgreSQL module enabled
- Port 5000 for local development

**Production Deployment**
- Autoscale deployment target
- Build process: `npm run build`
- Runtime: `npm run start`
- Static file serving from dist/public

**Database Strategy**
- Environment-based DATABASE_URL configuration
- Migration support via `npm run db:push`
- Connection pooling for production

## Changelog

- January 2025: Migration from Replit Agent to Replit environment completed
- January 2025: Firebase configuration updated with live credentials
- January 2025: Multi-user transformation with Firebase Auth fully operational
- January 2025: Profile editing restricted to admin mode only for security
- January 2025: Fixed note creation functionality - notes now appear correctly in feed

## User Preferences

Preferred communication style: German language, technical full-stack developer context.
Security preference: Profile editing only in admin mode
Admin credentials: admin / test123

## Current Status

Multi-user transformation completed:
- Firebase Authentication implemented
- User registration and login system
- Protected routes and user isolation
- Admin panel with user management
- Profile editor with photo upload
- User-specific gallery services
- Test user setup with sample content
- Firebase Security Rules configured for complete data isolation

**URGENT**: Firebase Security Rules must be applied in Firebase Console to resolve permission errors. See FIREBASE_SETUP.md for step-by-step instructions. Without these rules, user registration and gallery functions will not work.