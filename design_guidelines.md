# Gaming Center POS Admin Panel - Design Guidelines

## Design Approach
**Selected Approach:** Gaming-Enhanced System Design  
**Primary Inspiration:** Discord dashboard + Steam admin panels + Riot Games interfaces  
**Justification:** Admin dashboard requiring high information density with gaming aesthetic differentiation

## Core Design Elements

### A. Color Palette

**Dark Mode Foundation (Primary):**
- Background Base: 220 15% 8% (deep slate)
- Background Elevated: 220 15% 12% (card surfaces)
- Background Interactive: 220 15% 16% (hover states)

**Gaming Accent Colors:**
- Primary Neon: 170 100% 50% (cyan/teal - for active seats, success states)
- Warning Accent: 30 100% 55% (orange - for expiring timers, alerts)
- Danger Accent: 0 85% 60% (red - for expired sessions)
- Info Accent: 250 80% 65% (purple - for upcoming bookings)

**Semantic Colors:**
- Available: 150 70% 50% (green)
- Running: 200 90% 55% (blue)
- Expired: 0 75% 55% (red)
- Upcoming: 270 70% 60% (violet)

**Text Hierarchy:**
- Primary Text: 0 0% 95%
- Secondary Text: 0 0% 65%
- Muted Text: 0 0% 45%

### B. Typography
**Font Stack:** 'Inter' for UI, 'JetBrains Mono' for timers/numbers  
**Hierarchy:**
- Page Titles: text-2xl font-bold (Inter)
- Section Headers: text-lg font-semibold
- Body Text: text-sm font-medium
- Timer Display: text-3xl font-mono (JetBrains Mono)
- Data Labels: text-xs font-medium uppercase tracking-wide

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12 (p-4, gap-6, mb-8, py-12)  
**Grid System:** 12-column grid with gap-4 to gap-6  
**Container Max-Width:** max-w-7xl with px-6 padding  
**Sidebar Width:** w-64 fixed navigation

### D. Component Library

**Navigation:**
- Fixed left sidebar (w-64) with collapsible option
- Active state: cyan border-l-4 with subtle glow effect
- Icons from Heroicons (solid variants for active, outline for inactive)
- Section dividers with subtle gradient lines

**Seat Status Cards:**
- Grid layout: grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4
- Card size: aspect-square with rounded-lg
- Border: 2px border with status-based color (glowing effect for running)
- Content: Seat name (top), status badge (center), timer (bottom if active)
- Hover: scale-105 transform with transition

**Data Tables:**
- Striped rows with alternating background opacity
- Sticky header with backdrop-blur
- Action buttons in rightmost column
- Status badges with dot indicator and label

**Timer Components:**
- Large monospace display with countdown
- Color transitions: cyan (>30min) → orange (5-30min) → red (<5min)
- Pulse animation when <5 minutes remaining

**Alert System:**
- Toast notifications (top-right corner)
- Session expiry: red background with sound icon
- Upcoming booking: purple background with clock icon
- Duration: 5 seconds auto-dismiss with manual close option

**Buttons:**
- Primary: cyan background with hover glow effect
- Secondary: transparent with cyan border, hover: filled
- Danger: red background for "End Session"
- Size variants: px-4 py-2 (default), px-6 py-3 (large)

**Forms & Settings:**
- Input fields: dark background (220 15% 12%) with cyan focus ring
- Increment/decrement buttons for seat quantities
- Toggle switches for visibility (cyan when active)
- Pricing editor: table layout with inline editing

**Modal/Popup:**
- Backdrop: bg-black/60 with backdrop-blur-sm
- Modal container: rounded-xl with border and shadow-2xl
- Close button: top-right with hover:rotate-90 transition

**Reports Section:**
- Date range picker with calendar dropdown
- Revenue cards: large numbers with trend indicators
- Export buttons: icon + label, cyan hover state
- Chart placeholders: dark grid with cyan/purple gradients

**Status Badges:**
- Pill shape with dot indicator
- Sizes: px-3 py-1 text-xs rounded-full
- Available: green, Running: cyan, Expired: red, Upcoming: purple

### E. Visual Effects
**Subtle Animations:**
- Running seat cards: subtle pulse on border (2s interval)
- Timer countdown: number flip animation on minute change
- Alert entrance: slide-in from top-right
- Button clicks: scale-95 active state

**Glow Effects:**
- Active seats: box-shadow with cyan glow (shadow-[0_0_15px_rgba(0,255,255,0.3)])
- Expiring timers: orange pulsing glow
- Primary buttons: cyan glow on hover

**Transitions:**
- Default: transition-all duration-200
- Hover states: duration-150
- Layout shifts: duration-300

## Page-Specific Layouts

**Settings Page:**
Two-column layout (lg:grid-cols-2 gap-8)  
Left: Device configuration cards (PC, PS5, VR, Car)  
Right: Pricing tables with editable time slots

**Seat Management (Main Dashboard):**
Top: Tab switcher (Walk-in / Upcoming)  
Below tabs: Status filter chips (All, Available, Running, Expired)  
Main area: Seat grid with live status cards  
Right sidebar: Active session details panel

**Reports Page:**
Top: Date range selector and filter controls  
Middle: Revenue summary cards (grid-cols-3)  
Bottom: Booking history table with export buttons

## Critical Guidelines
- Maintain high contrast for readability in bright/dim environments
- Ensure timer visibility from distance (shop staff monitoring multiple screens)
- Status colors must be instantly recognizable (colorblind-safe palette)
- Animations should not distract from critical alerts
- All interactive elements: min-height of 44px for touch targets (tablet use)
- Alert sounds trigger alongside visual notifications (accessibility)

## Images
No hero images required. This is a data-focused admin dashboard. All visual interest comes from the gaming color scheme, status indicators, and live data displays.