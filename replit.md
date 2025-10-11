# Gaming Center POS Admin Panel

## Overview

This project is a local admin panel web application designed for managing a gaming center's Point-of-Sale (POS) system. It facilitates real-time tracking of gaming sessions across various device types (PC, PS5, VR, car simulators), handles both walk-in and advance bookings, and provides comprehensive reporting, including an expense tracker. The application is a full-stack TypeScript project, running locally on the shop's computer, and features a gaming-themed dark mode UI inspired by Discord and Steam. Its primary purpose is to streamline operations, manage inventory, track expenses, and improve customer service in a gaming center environment.

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
- `Load Metrics`: Real-time system usage data (total capacity, active devices, utilization rate).
- `Load Predictions`: AI-generated forecasts for future system load using OpenAI GPT-5.
- `Loyalty Members`: Customer loyalty program membership data.
- `Loyalty Events`: Historical record of loyalty points and rewards.

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
- Mini Webview Customization: Admin panel at `/mini-webview` for customizing the public status page including branding (business name, logo, colors), header text, contact information, display toggles for pricing/facilities/contact sections, and update intervals. Changes are stored in database and applied dynamically to the consumer-facing page.
- **AI Load Analytics**: Real-time dashboard showing current system usage and AI-powered predictions for future load at `/ai-load-analytics`. Features live metrics, utilization charts, and OpenAI GPT-5 forecasts. Accessible to all authenticated users with real-time updates via React Query polling.
- **AI Loyalty System**: Customer loyalty management at `/ai-loyalty`. Admin-only interface for adding/editing members and managing points/rewards. Staff have read-only access to view member information. Uses role-based access control via `requireAdmin` and `requireAdminOrStaff` middleware.

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

### AI Services
- **OpenAI GPT-5**: For AI-powered load predictions and analytics.

## Setup Requirements

### Environment Variables
The following environment variables need to be configured:
- `OPENAI_API_KEY`: Required for AI load prediction service
- `ADMIN_USERNAME`: Initial admin account username
- `ADMIN_PASSWORD`: Initial admin account password
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)

### AI Prediction Service
To generate load predictions:
1. Ensure `OPENAI_API_KEY` is set in environment variables
2. The prediction service can be triggered via the `/api/load-predictions/generate` endpoint (admin-only)
3. Predictions are based on historical load metrics and displayed in the AI Load Analytics dashboard
4. Consider setting up a cron job or scheduled task to run predictions periodically