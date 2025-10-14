# Gaming Center POS Admin Panel

## Overview

This project is a local admin panel web application designed for managing a gaming center's Point-of-Sale (POS) system. It facilitates real-time tracking of gaming sessions across various device types (PC, PS5, VR, car simulators), handles both walk-in and advance bookings, and provides comprehensive reporting, including an expense tracker. The application is a full-stack TypeScript project, running locally on the shop's computer, and features a gaming-themed dark mode UI inspired by Discord and Steam. Its primary purpose is to streamline operations, manage inventory, track expenses, and improve customer service in a gaming center environment.

## Recent Changes

**October 14, 2025:**
- **Implemented Happy Hours Feature:**
  - Added `happy_hours_configs` table to database with category, pricePerHour, startTime, endTime, and enabled fields
  - Created HappyHoursTable component in Settings page for configuring time-based special pricing
  - Added "Happy Hours" tab to Dashboard for viewing Happy Hours bookings
  - Updated AddBookingDialog to support Happy Hours booking type with:
    - Active time validation (only available during configured time windows)
    - Hourly rate pricing display (price per hour × duration in hours)
    - Visual indicators for Happy Hours availability status
  - Happy Hours bookings start immediately (like walk-in) but only during configured time windows
  - Pricing uses hourly rate system: pricePerHour × (duration in hours)
  - All Happy Hours bookings are marked as "running" status when created
  - Flexible system: any device category can have Happy Hours pricing configured

**October 13, 2025:**
- **Implemented Person-Based Pricing System:**
  - Added `personCount` field to pricing configuration schema (database table: pricing_configs)
  - Updated PricingTable component to support person-based pricing input (format: "30 mins + 1 person")
  - Admin can now configure person count for any pricing slot in Settings
  - Person count selector appears in AddBookingDialog when selected pricing slot has personCount > 1
  - Booking price automatically multiplies by person count (e.g., 30 min @ ₹10 × 3 persons = ₹30)
  - Person count defaults to 1 and resets when switching device categories or pricing slots
  - "Persons" column in BookingTable displays person count for all bookings
  - Dashboard properly persists and displays person count for all bookings
  - Flexible system: any device category can now use person-based pricing, not just PS5
- **Removed Mini Webview Feature:**
  - Removed `/mini-webview` public route and related components
  - Removed mini_webview_settings table from database
  - Cleaned up 603 lines of code for simplified codebase
- **Removed Two-Factor Authentication (2FA):**
  - Removed OTP verification system
  - Removed email functionality and Nodemailer dependency
  - Simplified login flow for all users (both admin and staff)
  - No longer requires SMTP configuration or email setup
  - Streamlined authentication without OTP verification
- **Implemented Device-Based Access Control for Mobile/Tablet:**
  - Created device detection hook (`use-device-type.tsx`) to identify PC, mobile, and tablet devices
  - Updated AuthContext with device-aware permissions (`canMakeChanges` flag)
  - Admin/staff users can now only VIEW on mobile and tablet devices (screen width < 1024px)
  - All editing capabilities (Add, Edit, Delete, Settings) are restricted to PC/desktop only
  - Added DeviceRestrictionAlert component to inform users of access limitations
  - Updated all admin pages with device restrictions:
    - Dashboard and BookingTable: Disabled all booking actions on mobile/tablet
    - Settings: Disabled configuration changes on mobile/tablet
    - Food Management: Disabled add/edit/delete food items on mobile/tablet
    - Expense Tracker: Disabled add/edit/delete expenses on mobile/tablet
    - Loyalty Program: Disabled settings configuration on mobile/tablet
    - Game Updates: Added restriction alert for consistency
  - Design decision: Mobile/tablet = read-only for admin/staff, PC = full access

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
- **Fixed Loyalty Settings Save Issue:**
  - Updated insertLoyaltyConfigSchema to use z.coerce.number() for automatic string-to-number conversion
  - Added default values for all tier threshold fields to handle partial payloads
  - Resolved "Failed to update loyalty settings" error

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
- Device-Based Access Control: Admin/staff users restricted to view-only mode on mobile/tablet devices (< 1024px), with full editing capabilities available only on PC/desktop (≥ 1024px).

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