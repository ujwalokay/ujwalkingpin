# Airavoto Gaming Center POS Admin Panel

## Overview

This project is a local admin panel web application for managing Airavoto Gaming Center's Point-of-Sale (POS) system. It tracks gaming sessions across various device types (PC, PS5, VR, car simulators), handles walk-in and advance bookings, and provides comprehensive reporting, including an expense tracker. The application is a full-stack TypeScript project, running locally, designed to streamline operations, manage inventory, track expenses, and improve customer service in a gaming center environment. It features a gaming-themed dark mode UI inspired by Discord and Steam.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 11, 2025
- **Unified Payment Dialog with Split Payment Support**: Streamlined credit balance payment system with comprehensive validation:
  - **Single Payment Dialog**: Combined "Record Payment" and "Mark as Paid" functionality into one unified form
  - **Three Payment Methods**: Cash, UPI/Online, and Split Payment (Cash + UPI)
  - **Smart Auto-Calculation**: When split payment is selected, UPI amount automatically calculates as (payment amount - cash amount)
  - **Comprehensive Validation**:
    - Payment amount must be positive and cannot exceed outstanding balance
    - For split payments: both cash and UPI must be greater than zero
    - Split payment total (cash + UPI) must equal payment amount (0.01 tolerance)
    - Split payment total cannot exceed outstanding balance
  - **Enhanced Payment History**: Split payments display inline breakdown showing "Cash: ₹X • UPI: ₹Y"
  - **Cleaned Up UI**: Removed duplicate "Mark as Paid" action buttons and dialogs
  - **Data Structure**: creditPayments table includes optional cashAmount and upiAmount fields for split payment tracking
  - **Proper State Management**: All form fields reset correctly on dialog close and after successful payment

### November 7, 2025
- **Removed Payment Logs Feature**: Completely removed the Payment Reconciliation/Payment Logs functionality from the application, including:
  - Removed "Payment Logs" navigation item from sidebar
  - Removed `/payment-reconciliation` route from frontend router
  - Removed `/api/payment-logs` API endpoint from backend
  - Note: PaymentReconciliation.tsx component file still exists but is no longer used
  
- **Enhanced Credit Balance Management**: Improved credit tracking with mark-as-paid functionality:
  - Credit balance viewing requires authentication (secured endpoints)
  - Added new PATCH endpoint `/api/credits/entries/:id/mark-paid` to mark credit entries as paid
  - Added "Mark as Paid" button in Credit Balances UI for pending credit entries
  - Paid credit entries now appear with green "Completed" status
  - Activity logging for all credit entry status changes
  
- **Reports Integration for Paid Credits**: Revenue reports now include paid credit balances:
  - Added `creditRevenue` field to BookingStats interface
  - Reports page now calculates and displays revenue from paid credit entries
  - Total revenue includes cash, UPI/online, and paid credit transactions
  - Credit entries are included in reports only after being marked as "paid"

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
- `Notifications`: Stores system notifications with type, title, message, entity linkage, read status, and creation timestamp.
- `Customer Loyalty`: Tracks customer spending and points (simplified system).
- `Loyalty Rewards`: Catalog of redeemable rewards.
- `Reward Redemptions`: History of customer reward redemptions.

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
- Happy Hours Feature: Configurable time-based special pricing integrated as checkbox option in Walk-In and Upcoming bookings (no separate booking type).
- Onboarding Tour: Comprehensive step-by-step guide for new users.
- Data Retention Policies: Automatic cleanup of old data with configurable retention periods (default: 2 years bookings, 6 months logs, 7 years expenses). Runs daily at 2:00 AM with admin controls for manual cleanup and configuration.
- Analytics Chart Export: Save as Image functionality for all analytics charts (Occupancy Trend, Category Distribution, Hourly Activity, Revenue & Bookings, Peak Hours) using html2canvas for high-quality PNG exports.
- Ankylo AI System: Custom calculation-based predictive maintenance and traffic forecasting. Uses deterministic risk-score algorithms based on device usage hours, session counts, issue reports, and maintenance history. Traffic predictions use weighted historical patterns with trend detection. No external AI services required - 100% accurate predictions using mathematical formulas.
- Tournament Management: Complete system for organizing gaming tournaments with participant tracking, registration management, status updates (upcoming/ongoing/completed), and winner declarations. Includes real-time participant lists and tournament statistics.
- Food & Inventory Management: Dual-page system with Food page (master catalog of all available items) and Inventory page (selected items currently in stock). Food page allows creating, editing, and deleting items from the master catalog. Inventory page shows only selected items with the ability to add items from the Food catalog or remove them from inventory (without deleting from master catalog). Features stock level tracking, minimum stock level alerts, and automatic stock deduction when items are ordered in bookings. Includes smart delta-based stock adjustment that properly handles quantity changes in booking updates.
- Sound Alert System: Comprehensive audio notification system using Web Audio API for all user feedback including timer expiry alerts, success confirmations, error warnings, and informational messages. Enhances user experience with audio cues for important events.
- Unsaved Changes Protection: Settings page detects unsaved changes and shows confirmation dialog when navigating away, preventing accidental data loss. Uses browser beforeunload event for tab/window close and custom navigation blocking for internal links.
- **Notification System**: Comprehensive notification center with real-time notifications for key events (new bookings, expenses, low inventory alerts, activity logs). Features include:
  - Bell icon in header with unread count badge
  - Notification panel with All/Unread tabs
  - Grouped notifications by time (Today/Yesterday/Older)
  - Mark as read/delete actions for individual notifications
  - Mark all as read functionality
  - Automatic notification triggers via dedicated notification service module
  - Emoji icons for different notification types (📅 bookings, 💰 payments, 📦 inventory, 📝 activity, 💳 expenses, ⚠️ alerts)
- **Categorized Sidebar**: Reorganized navigation sidebar with four categories (Main Menu, Operations, Management, Tools) and count badges showing pending items (e.g., low stock count).
- **Enhanced Activity Logs**: Comprehensive, detailed activity logging across all operations with rich contextual information:
  - Booking logs: Include price, duration (hours/minutes), time ranges, food orders count, and payment method
  - Device config logs: Show total capacity, seat lists (auto-numbered or custom), and configuration timestamps
  - Pricing config logs: Display all price tiers with durations and person counts, formatted for easy reading
  - Happy hours logs: Include time slots with enabled/disabled status and active slot counts
  - Food inventory logs: Display before/after stock levels, supplier info, expiry dates, low stock warnings, and batch tracking notes
  - All logs formatted with Indian locale timestamps (en-IN) and currency (₹) for consistency
- **Simplified Loyalty & Rewards System**: Easy-to-use customer loyalty program with automatic point earning and reward redemption:
  - Customers automatically earn 1 point per ₹1 spent (no complex configuration needed)
  - Points are awarded when bookings are completed/expired
  - Two main features: Rewards Catalog (define redeemable rewards) and Customer Management (track customer spending and points)
  - Simplified from complex 4-tab system (Point Rules, Tier Cards, Rewards, Customers) to just 2 tabs (Rewards, Customers)
  - Removed: Point Earning Rules configuration, Loyalty Tiers/Levels, Tier Card Claims
  - Focus on simplicity and ease of use for staff members
- **Seat Change Feature**: Quick seat reassignment for active bookings without affecting session data:
  - Available for running and paused bookings via action dropdown menu
  - Shows only available seats in the same device category
  - Preserves all booking data (remaining time, food orders, prices, customer information)
  - Backend validation prevents double-booking conflicts
  - Automatic activity logging for all seat changes
- **Manual Adjustments for Bookings**: Staff can apply manual discounts and bonus hours to bookings:
  - Manual discount percentage can be applied during booking creation
  - Manual free/bonus hours can be added to extend session duration
  - These adjustments are preserved when editing or changing seats in existing bookings
  - Useful for providing custom pricing adjustments and customer satisfaction

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