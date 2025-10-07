# Gaming Center POS Admin Panel

## Overview

This is a local admin panel web application for managing a gaming center's Point-of-Sale (POS) system. The application enables real-time tracking of gaming sessions across multiple device types (PC, PS5, VR simulators, and car simulators), manages walk-in and advance bookings, and provides comprehensive reporting capabilities. Built as a full-stack TypeScript application, it runs locally on the shop's computer and features a gaming-themed dark mode interface inspired by Discord and Steam admin panels.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 7, 2025 - Smart Upcoming Booking Flow with Time-Based Seat Availability**
- Redesigned upcoming booking flow to ask for date/time BEFORE showing available seats
- New flow: Duration → Date → Time Slot → Category → Seats (instead of showing seats first)
- Added GET /api/bookings/available-seats endpoint to check seat availability for specific date/time slots
- Real-time seat availability calculation based on time slot overlaps with existing bookings
- When creating upcoming booking, system now shows only seats that are free during the requested time
- Prevents booking conflicts by filtering out seats already booked during the selected time slot
- Walk-in booking flow remains unchanged (shows currently available seats immediately)
- Improves customer service - staff can instantly tell customers which seats are free at specific times

**October 7, 2025 - Booking History Archive System**
- Implemented separate booking history table to store archived completed/expired bookings
- Added "Refresh List" button functionality to move expired and completed bookings to permanent history
- Created dedicated history storage with archivedAt timestamp for audit trail
- Updated History page to display archived bookings from history table with archive dates
- Backend automatically moves bookings to history table when refresh is clicked
- History records persist independently from active bookings for long-term tracking
- Added POST /api/bookings/archive endpoint to handle archival process
- Added GET /api/booking-history endpoint to fetch archived records
- Query cache invalidation ensures real-time UI updates across Dashboard and History pages

**October 6, 2025 - Pause/Resume Timer Functionality**
- Implemented pause/resume toggle for running gaming sessions
- Added "Pause Timer" button for running bookings to pause the countdown
- Added "Resume Timer" button for paused bookings to continue from where it left off
- Introduced "paused" status with yellow badge indicator
- Added pausedRemainingTime field to booking schema to store remaining time when paused
- Paused seats are still counted as occupied to prevent double booking
- Updated UI to show "Paused" indicator in timer column for paused sessions
- Delete food items functionality - can now remove individual food items from bookings
- Extended delete capability to completed bookings for better history management

**October 5, 2025 - Dynamic Category Management**
- Implemented fully dynamic device category system - users can now add/delete any device type
- Added "Add Category" functionality in Settings with dialog UI for creating new categories
- Added delete buttons to each category card with active booking validation
- Refactored Settings from hardcoded PC/PS5/VR/Car to unified dynamic state management
- Updated Dashboard to dynamically display all categories with auto-assigned icons and colors
- Standardized React Query cache keys across Dashboard and Settings for proper cache invalidation
- Added DELETE API endpoints for device-config and pricing-config in backend
- Implemented storage delete methods (deleteDeviceConfig, deletePricingConfig) in MemStorage
- Categories now persist across page reloads and sync between all views
- Pricing configuration automatically adapts to show all active device categories

**October 4, 2025 - Replit Environment Setup**
- Successfully imported and configured the Gaming Center POS Admin Panel for Replit
- Created PostgreSQL database and pushed schema (users, bookings, settings, device_config, pricing_config tables)
- Configured development workflow to run on port 5000 with Express + Vite
- Verified frontend is properly connected to backend API
- Deployment configuration set for autoscale deployment target
- Application is fully functional with gaming-themed dark mode interface

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type safety
- Vite as build tool and development server
- Wouter for client-side routing (lightweight React Router alternative)
- TanStack React Query for server state management and caching

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York style variant)
- Tailwind CSS for styling with custom gaming-themed design tokens
- Custom color palette optimized for dark mode with gaming aesthetics (cyan/teal accents, status-specific colors)

**State Management:**
- React Query handles all server state with automatic refetching and caching
- Local component state with React hooks for UI interactions
- No global state management library (Redux/Zustand) - keeping architecture simple

**Key Design Patterns:**
- Component composition with Radix UI slot pattern
- Custom hooks for reusable logic (use-toast, use-mobile)
- Real-time timer updates using React useEffect intervals
- Form validation with React Hook Form and Zod schemas

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for REST API
- Native HTTP server (Node.js http module)
- Middleware-based request processing pipeline

**API Design:**
- RESTful endpoints following resource-based URL patterns
- JSON request/response format
- Basic CRUD operations for bookings and settings
- No authentication/authorization (local single-user application)

**Database Layer:**
- Drizzle ORM for type-safe database operations
- PostgreSQL as database (Neon serverless provider with websocket support)
- Schema-first approach with Zod validation
- Migration support via drizzle-kit

**Data Models:**
- Users table (minimal - username/password for potential future auth)
- Bookings table (tracks all active gaming sessions with status, timing, pricing)
- Booking History table (stores archived completed/expired bookings with archive timestamp)
- Device Configs table (stores device categories and their seat configurations)
- Pricing Configs table (stores pricing rules per category and duration)
- Food Items table (stores available food/beverage items)
- Settings table (stores admin configurations like delete PIN)

**Storage Pattern:**
- Interface-based storage abstraction (IStorage)
- DatabaseStorage implementation using Drizzle queries
- Supports booking CRUD, statistics queries, and history retrieval

### Key Architectural Decisions

**Monorepo Structure:**
- Shared schema definitions between client and server (`/shared` directory)
- Type safety across full stack using shared TypeScript types
- Single package.json with unified dependencies

**Development vs Production:**
- Vite dev server with HMR in development
- Static file serving in production
- Environment-based configuration (NODE_ENV)
- Custom error overlay and dev tools for Replit environment

**Real-time Features:**
- Client-side interval timers for countdown displays
- Polling-based updates (no WebSocket implementation)
- Status transitions managed through time comparisons
- Audio/visual notifications for expired sessions

**Styling Architecture:**
- CSS custom properties for theme tokens
- Tailwind utility classes for component styling
- Component-scoped styles using cn() utility (clsx + tailwind-merge)
- Gaming aesthetic with neon accents and status-based color coding

**Form Handling:**
- React Hook Form for form state management
- Zod schemas for validation rules
- @hookform/resolvers for schema integration
- Controlled components with validation feedback

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL with websocket support (@neondatabase/serverless)
- Connection pooling via Neon's Pool implementation
- Environment variable configuration (DATABASE_URL)

### UI Component Libraries
- **Radix UI**: Comprehensive suite of unstyled, accessible React primitives (dialog, dropdown, select, tabs, etc.)
- **shadcn/ui**: Pre-styled component implementations built on Radix UI
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Drizzle Kit**: Database migration and schema management tool
- **Replit Plugins**: Custom Vite plugins for Replit-specific development features (error overlay, cartographer, dev banner)
- **TypeScript**: Full-stack type safety with strict mode enabled

### Validation & Schema
- **Zod**: Runtime type validation and schema definition
- **drizzle-zod**: Bridge between Drizzle schema and Zod validators

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional className composition
- **class-variance-authority**: Type-safe variant API for components

### Build & Bundling
- **Vite**: Frontend build tool and dev server
- **esbuild**: Backend bundling for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express (prepared for future authentication)