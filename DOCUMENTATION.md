# ANKYLO GAMING
## Gaming Center POS System - Complete Feature Documentation

---

## 📋 Overview

**Ankylo Gaming POS** is a comprehensive local admin panel web application designed for managing gaming centers. It provides real-time tracking of gaming sessions, handles bookings, manages inventory, tracks expenses, and improves customer service in a gaming center environment.

---

## 🛠 Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for development and build
- **Wouter** for client-side routing
- **TanStack React Query** for server state management
- **Radix UI & shadcn/ui** components
- **Tailwind CSS** with gaming-themed dark mode
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** via Neon serverless
- **Drizzle ORM** for type-safe database
- **RESTful API** design
- **Bcrypt** for password hashing
- **Express-session** for authentication

---

## 🎮 Core Features

### 1. Real-time Session Management
- ✅ Live tracking of gaming sessions across multiple device types (PC, PS5, VR, car simulators)
- ✅ Real-time countdown timers for active sessions
- ✅ Visual and audio notifications for expired sessions
- ✅ Dynamic seat availability display
- ✅ Category-based device organization
- ✅ Session pause and resume functionality
- ✅ Automatic session status updates

### 2. Booking Management
- ✅ Walk-in booking creation with instant seat allocation
- ✅ Advance booking system with date/time selection
- ✅ Smart conflict detection to prevent double bookings
- ✅ Customer information management (name, WhatsApp number)
- ✅ Booking extension during active sessions
- ✅ Bulk booking operations (complete, delete multiple)
- ✅ Session history archival for completed bookings
- ✅ Filter and search capabilities

### 3. Inventory & Food Management
- ✅ Food and beverage item catalog
- ✅ Dynamic pricing configuration
- ✅ Add food orders to active bookings
- ✅ Order quantity and price tracking
- ✅ Real-time order total calculation
- ✅ Food revenue analytics
- ✅ Item creation, editing, and deletion

### 4. Financial Management
- ✅ Comprehensive expense tracking system
- ✅ Multiple expense categories:
  - Rent
  - Utilities
  - Maintenance
  - Food & Beverages
  - Marketing
  - Equipment
  - Staff
  - Miscellaneous
- ✅ Date-based expense recording
- ✅ Expense filtering by category and date range
- ✅ CSV export for accounting integration
- ✅ PDF export for expense reports
- ✅ Monthly and yearly expense summaries
- ✅ Revenue tracking from bookings and food orders

---

## 🚀 Advanced Features

### 5. Analytics & Reporting
- 📊 Real-time occupancy monitoring
- 📊 Category-wise usage statistics
- 📊 Hourly booking patterns and trends
- 📊 Daily, weekly, and monthly revenue reports
- 📊 Unique customer tracking
- 📊 Average session duration analysis
- 📊 Food order statistics
- 📊 Capacity utilization metrics
- 📊 Interactive charts and visualizations
- 📊 Historical data comparison

### 6. Loyalty Program
- 🎁 Customer loyalty tier system (Bronze, Silver, Gold, Platinum)
- 🎁 Points accumulation based on spending
- 🎁 Automatic tier upgrades
- 🎁 Redemption history tracking
- 🎁 Visit count monitoring
- 🎁 Total spend tracking per member
- 🎁 WhatsApp-based member identification
- 🎁 Configurable points per currency ratio
- 🎁 Customizable tier thresholds
- 🎁 Member analytics and insights

### 7. Device Configuration & Pricing
- ⚙️ Dynamic device category management
- ⚙️ Custom seat naming (e.g., "PC-1", "PS5-Pro", "VR-1")
- ⚙️ Flexible pricing rules per category
- ⚙️ Duration-based pricing (30 min, 1 hour, 2 hours, etc.)
- ⚙️ Real-time seat availability updates
- ⚙️ Category-wise capacity configuration
- ⚙️ Pricing rule updates without downtime

---

## 👥 Customer-Facing Features

### 8. Public Status Board
- 📺 Real-time device availability display
- 📺 No authentication required (accessible at `/status`)
- 📺 Auto-refresh every 10 seconds
- 📺 Visual indicators (available/occupied)
- 📺 Category-wise seat counts
- 📺 Large display format for customer screens
- 📺 Gaming-themed interface

### 9. WhatsApp Bot Integration
- 💬 Automated device availability queries
- 💬 Twilio WhatsApp API integration
- 💬 Real-time availability responses
- 💬 Customer inquiry handling
- 💬 Webhook-based message processing
- 💬 24/7 automated customer service

### 10. Consumer Website Pages
- 🏠 Home page with gaming center information
- 🖼️ Photo gallery showcase
- 🎯 Facilities and amenities display
- 🎮 Available games catalog
- 📞 Contact information and hours
- 🎨 Gaming-themed UI design

---

## 🔒 Security & Access Control

### 11. Authentication & Authorization
- 🔐 Secure user authentication system
- 🔐 Role-based access control (Admin and Staff roles)
- 🔐 Bcrypt password hashing
- 🔐 Session-based authentication
- 🔐 Password strength validation
- 🔐 Username uniqueness enforcement
- 🔐 Secure login/logout functionality

### 12. Device-Based Access Control
- 💻 **PC/Desktop**: Full access with all editing capabilities
- 📱 **Mobile/Tablet** (< 1024px): View-only mode for security
- 💻 Automatic device detection
- 💻 Visual alerts for restricted access
- 💻 Prevents accidental changes from mobile devices
- 💻 Optimized UX for different screen sizes

### 13. Security Features
- 🛡️ Rate limiting on public APIs
- 🛡️ Helmet.js security headers
- 🛡️ CORS configuration
- 🛡️ SQL injection prevention via ORM
- 🛡️ XSS protection
- 🛡️ Secure session storage
- 🛡️ Environment variable protection for secrets

---

## 👨‍💼 Administrative Features

### 14. User Management
- 👤 Admin user creation and management
- 👤 Staff user creation and management
- 👤 Role assignment (Admin/Staff)
- 👤 User activity logging
- 👤 Login history tracking

### 15. Activity Logging & Audit Trail
- 📝 Comprehensive activity logging system
- 📝 User action tracking (create, update, delete, login)
- 📝 Entity-specific logging (bookings, food items, configs)
- 📝 Timestamp recording for all activities
- 📝 User role and username tracking
- 📝 Audit trail for accountability

### 16. Game Updates Management
- 🎮 Track latest game updates and patches
- 🎮 Event announcements
- 🎮 News and updates display
- 🎮 Image and description support
- 🎮 Source and URL tracking
- 🎮 Publication date management
- 🎮 Update type categorization

---

## 🎨 User Interface & Experience

### 17. UI/UX Features
- 🌙 Gaming-themed dark mode with cyan/teal accents
- ☀️ Light/dark theme toggle with persistence
- 📱 Responsive design for all screen sizes
- ♿ Accessible components via Radix UI
- ✨ Smooth animations and transitions
- 🔔 Toast notifications for user feedback
- ⏳ Loading states and skeleton screens
- 🧭 Intuitive navigation with sidebar
- 🎨 Status-based color coding (running, paused, expired)
- 🔣 Icon-based visual cues (Lucide icons)

### 18. Data Visualization
- 📈 Real-time charts and graphs (Recharts)
- 📈 Occupancy rate visualizations
- 📈 Revenue trend analysis
- 📈 Category usage breakdown
- 📈 Hourly booking patterns
- 📈 Interactive data exploration
- 📈 Export capabilities (CSV, PDF)

---

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

| Table | Description |
|-------|-------------|
| **Bookings** | Active gaming sessions with status, timing, pricing, and food orders |
| **Booking History** | Archived bookings for historical analysis |
| **Users** | Admin and staff user accounts with role-based access |
| **Device Configs** | Dynamic device categories and seat configurations |
| **Pricing Configs** | Pricing rules per category and duration |
| **Food Items** | Available food and beverage catalog |
| **Expenses** | Operational cost tracking by category |
| **Activity Logs** | User action audit trail |
| **Loyalty Members** | Customer loyalty program participants |
| **Loyalty Events** | Points and tier change history |
| **Loyalty Config** | Loyalty program settings and thresholds |
| **Game Updates** | Latest game news and updates |
| **Gaming Center Info** | Center details and contact information |
| **Gallery Images** | Photo gallery for consumer website |
| **Facilities** | Amenities and facilities information |
| **Games** | Available games catalog |

---

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Bookings
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`
- `DELETE /api/bookings/:id`
- `GET /api/bookings/available-seats`
- `POST /api/bookings/archive`

### Analytics
- `GET /api/analytics/usage`
- `GET /api/reports/stats`
- `GET /api/reports/history`

### Configuration
- `GET /api/device-config`
- `POST /api/device-config`
- `DELETE /api/device-config/:category`
- `GET /api/pricing-config`
- `POST /api/pricing-config`

### Food & Inventory
- `GET /api/food-items`
- `POST /api/food-items`
- `PATCH /api/food-items/:id`
- `DELETE /api/food-items/:id`

### Expenses
- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Loyalty Program
- `GET /api/loyalty/members`
- `POST /api/loyalty/members`
- `GET /api/loyalty/config`
- `POST /api/loyalty/config`

### Public APIs
- `GET /api/public/status`
- `GET /api/whatsapp/availability`
- `POST /api/whatsapp/webhook`

---

## 🚀 Deployment & Setup

### Environment Requirements
- Node.js 20+
- PostgreSQL database (via Replit/Neon)
- Environment variables:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `DATABASE_URL`

### Running the Application
```bash
# Development
npm run dev          # Runs on port 5000

# Build
npm run build

# Production
npm run start

# Database Push
npm run db:push
```

---

## 💡 Key Benefits

✨ **Streamlined Operations** - Centralized management of all gaming center activities

📊 **Real-time Monitoring** - Live tracking of sessions and availability

💰 **Financial Control** - Comprehensive expense and revenue tracking

😊 **Customer Satisfaction** - Automated WhatsApp bot and public status board

📈 **Data-Driven Decisions** - Analytics and reporting for business insights

⚡ **Scalability** - Flexible device and pricing configuration

🔒 **Security** - Role-based access and device-based restrictions

🎁 **Loyalty Building** - Integrated customer loyalty program

🎨 **Professional Interface** - Modern, gaming-themed UI/UX

🛡️ **Type Safety** - Full-stack TypeScript for reliable code

---

## 📝 Conclusion

**Ankylo Gaming POS** is a comprehensive, modern solution for gaming center management. Built with cutting-edge technologies and following best practices, it provides all the tools necessary to run a successful gaming center efficiently.

From real-time session tracking to financial management, customer loyalty programs, and automated customer service, this application covers every aspect of gaming center operations.

The application is designed to be user-friendly for staff while providing powerful administrative capabilities for management. With its responsive design, security features, and extensive analytics, Ankylo Gaming POS empowers gaming center owners to make data-driven decisions and provide exceptional customer experiences.

---

**Generated on:** October 13, 2025
