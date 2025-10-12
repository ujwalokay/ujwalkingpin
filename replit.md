# Gaming Center POS Admin Panel

## Overview

This project is a local admin panel web application designed for managing a gaming center's Point-of-Sale (POS) system. It facilitates real-time tracking of gaming sessions across various device types (PC, PS5, VR, car simulators), handles both walk-in and advance bookings, and provides comprehensive reporting, including an expense tracker. The application is a full-stack TypeScript project, running locally on the shop's computer, and features a gaming-themed dark mode UI inspired by Discord and Steam. Its primary purpose is to streamline operations, manage inventory, track expenses, and improve customer service in a gaming center environment.

## Recent Changes

**October 12, 2025:**
- Updated Analytics Dashboard to display only walk-in booking data (excludes upcoming bookings)
- Analytics API endpoint now filters for `bookingType === "walk-in"` and `status !== "upcoming"`
- All metrics (occupancy, revenue, hourly usage) now reflect active walk-in sessions only
- **Enhanced Analytics Page with Gaming Cafe Metrics:**
  - Added unique customer tracking for walk-ins
  - Added average session duration calculation
  - Added food order statistics (total orders and revenue)
  - Improved layout with two-row metric cards for better visibility
  - All metrics now properly calculate from walk-in bookings only
- **Removed Unused Chat Functionality:**
  - Removed chat sessions and chat messages from database schema
  - Dropped chat_sessions and chat_messages tables from database
  - Cleaned up storage.ts to remove chat-related interfaces and methods

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript
- Vite for development and build
- Wouter for client-side routing
- TanStack React Query for server state management and caching

**UI/UX Decisions:**
- Radix UI primitives and shadcn/ui (New York style) for accessible components.
- Tailwind CSS with a custom, gaming-themed dark mode color palette (cyan/teal accents).
- Theme toggle for light/dark mode persistence via localStorage.

**State Management:**
- React Query for server state caching and synchronization.
- Local component state with React hooks.

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript.
- RESTful API design with JSON communication.

**Database Layer:**
- PostgreSQL via Neon serverless provider.
- Drizzle ORM for type-safe database interactions.
- Schema-first approach with Zod validation.

**Data Models:**
- `Bookings`: Manages active sessions, status, timing, and pricing.
- `Booking History`: Archives completed/expired bookings for audit.
- `Device Configs`: Stores dynamic device categories and seat configurations.
- `Pricing Configs`: Defines pricing rules per category and duration.
- `Food Items`: Stores available food and beverage options.
- `Settings`: General admin configurations (e.g., delete PIN).
- `Expenses`: Tracks operational costs by category, description, amount, and date.

### Key Architectural Decisions

**Monorepo Structure:**
- Shared TypeScript schema definitions between client and server for full-stack type safety.

**Real-time Features:**
- Client-side interval timers for session countdowns.
- Polling for updates (no WebSockets for simplicity).
- Audio/visual notifications for expired sessions.

**Styling Architecture:**
- CSS custom properties for theme tokens.
- Tailwind utility classes and `clsx`/`tailwind-merge` for styling.
- Gaming aesthetic with neon accents and status-based color coding.

**Form Handling:**
- React Hook Form for form state and validation.
- Zod schemas for robust input validation.

**Key Features Implemented:**
- Dynamic Device Category Management: Add/delete device types, affecting dashboard and pricing.
- Smart Upcoming Booking Flow: Date/time-based seat availability, preventing conflicts.
- Booking History Archival: Dedicated storage for past bookings.
- Pause/Resume Timer Functionality: For active gaming sessions.
- Expense Tracker: Comprehensive system for operational costs with CSV/PDF export.
- WhatsApp Bot Integration: Automated device availability queries via Twilio WhatsApp API.
- Public Status Board: Customer-facing real-time availability display at `/status` route (no authentication required). Auto-refreshes with visual indicators.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database.

### UI Component Libraries
- **Radix UI**: Accessible React primitives.
- **shadcn/ui**: Component library built on Radix UI.
- **Lucide React**: Icon library.

### Development Tools
- **Drizzle Kit**: Database migration and schema management.
- **Vite**: Frontend build tool.
- **TypeScript**: Language.

### Validation & Schema
- **Zod**: Runtime type validation.
- **drizzle-zod**: Integration between Drizzle and Zod.

### Utility Libraries
- **date-fns**: Date manipulation.
- **clsx & tailwind-merge**: Conditional CSS class composition.
- **class-variance-authority**: Type-safe variant API for components.

### Communication
- **Twilio**: For WhatsApp bot integration (sending and receiving messages).

## Setup Requirements

### Environment Variables
The following environment variables need to be configured:
- `ADMIN_USERNAME`: Initial admin account username
- `ADMIN_PASSWORD`: Initial admin account password
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)