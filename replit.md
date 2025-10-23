# Gaming Center POS Admin Panel

## Overview

This project is a local admin panel web application for managing a gaming center's Point-of-Sale (POS) system. It tracks gaming sessions across various device types (PC, PS5, VR, car simulators), handles walk-in and advance bookings, and provides comprehensive reporting, including an expense tracker. The application is a full-stack TypeScript project, running locally, designed to streamline operations, manage inventory, track expenses, and improve customer service in a gaming center environment. It features a gaming-themed dark mode UI inspired by Discord and Steam.

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
- `Booking History`: Archives completed/expired bookings.
- `Device Configs`: Stores dynamic device categories and seat configurations.
- `Pricing Configs`: Defines pricing rules per category and duration, including person-based pricing for PS5.
- `Food Items`: Stores available food and beverage options with inventory tracking (currentStock, minStockLevel).
- `Settings`: General admin configurations.
- `Expenses`: Tracks operational costs.
- `Happy Hours Configs`: Defines time slots and pricing for special happy hour rates.
- `Retention Config`: Stores data retention policy settings with database persistence.
- `Tournaments`: Stores tournament information (name, game, date, max participants, prize pool, status).
- `Tournament Participants`: Tracks participant registration with status and placement tracking.

### Key Architectural Decisions

**Monorepo Structure:**
- Shared TypeScript schema definitions between client and server for full-stack type safety.

**Real-time Features:**
- Client-side interval timers for session countdowns.
- Polling for updates.
- Audio/visual notifications for expired sessions and all toast messages using Web Audio API.
- Sound alerts for timer expiry, success, error, warning, and info notifications.

**Styling Architecture:**
- CSS custom properties for theme tokens.
- Tailwind utility classes and `clsx`/`tailwind-merge` for styling.
- Gaming aesthetic with neon accents and status-based color coding.
- **Card Design System**: ALL cards use uniform `shape-diagonal-rounded` (top-left and bottom-right corners rounded) for consistent gaming aesthetic across metric cards, chart cards, and category availability cards.

**Form Handling:**
- React Hook Form for form state and validation.
- Zod schemas for robust input validation.

**Feature Specifications:**
- Dynamic Device Category Management: Add/delete device types.
- Smart Upcoming Booking Flow: Date/time-based seat availability.
- Pause/Resume Timer Functionality.
- Expense Tracker: Comprehensive system with CSV/PDF export.
- WhatsApp Bot Integration: Automated device availability queries via Twilio.
- Public Status Board: Customer-facing real-time availability display at `/status`.
- Fully Responsive Design: Admin/staff users can access and edit all features on mobile, tablet, and desktop devices with a responsive, touch-friendly interface.
- Happy Hours Feature: Configurable time-based special pricing.
- Onboarding Tour: Comprehensive step-by-step guide for new users.
- Data Retention Policies: Automatic cleanup of old data with configurable retention periods (default: 2 years bookings, 6 months logs, 7 years expenses). Runs daily at 2:00 AM with admin controls for manual cleanup and configuration.
- Analytics Chart Export: Save as Image functionality for all analytics charts (Occupancy Trend, Category Distribution, Hourly Activity, Revenue & Bookings, Peak Hours) using html2canvas for high-quality PNG exports.
- Ankylo AI System: Custom calculation-based predictive maintenance and traffic forecasting. Uses deterministic risk-score algorithms based on device usage hours, session counts, issue reports, and maintenance history. Traffic predictions use weighted historical patterns with trend detection. No external AI services required - 100% accurate predictions using mathematical formulas.
- Tournament Management: Complete system for organizing gaming tournaments with participant tracking, registration management, status updates (upcoming/ongoing/completed), and winner declarations. Includes real-time participant lists and tournament statistics.
- Food Inventory Management: Track stock levels of consumables (chips, drinks, etc.) with automatic deduction when items are ordered in bookings. Features current stock tracking, minimum stock level alerts, add/remove stock functionality, and low stock warnings with visual indicators. Includes smart delta-based stock adjustment that properly handles quantity changes in booking updates.
- Sound Alert System: Comprehensive audio notification system using Web Audio API for all user feedback including timer expiry alerts, success confirmations, error warnings, and informational messages. Enhances user experience with audio cues for important events.

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
- **Twilio**: For WhatsApp bot integration.