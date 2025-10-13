import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function generateApplicationPDF(res: Response) {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'Ankylo Gaming - Gaming Center POS System Documentation',
      Author: 'Ankylo Gaming',
      Subject: 'Complete Feature Documentation'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=ankylo-gaming-features.pdf');
  
  doc.pipe(res);

  // Title Page
  doc.fontSize(28).font('Helvetica-Bold').text('ANKYLO GAMING', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(20).font('Helvetica').text('Gaming Center POS System', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text('Complete Feature Documentation', { align: 'center' });
  doc.moveDown(2);

  // Introduction
  doc.fontSize(18).font('Helvetica-Bold').text('Overview', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica').text(
    'Ankylo Gaming POS is a comprehensive local admin panel web application designed for managing gaming centers. ' +
    'It provides real-time tracking of gaming sessions, handles bookings, manages inventory, tracks expenses, and ' +
    'improves customer service in a gaming center environment.',
    { align: 'justify' }
  );
  doc.moveDown(1);

  // Technology Stack Section
  doc.fontSize(18).font('Helvetica-Bold').text('Technology Stack', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(12).font('Helvetica-Bold').text('Frontend:');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'React 18+ with TypeScript',
    'Vite for development and build',
    'Wouter for client-side routing',
    'TanStack React Query for server state management',
    'Radix UI & shadcn/ui components',
    'Tailwind CSS with gaming-themed dark mode',
    'React Hook Form with Zod validation'
  ], { bulletRadius: 2 });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Backend:');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Express.js with TypeScript',
    'PostgreSQL via Neon serverless',
    'Drizzle ORM for type-safe database',
    'RESTful API design',
    'Bcrypt for password hashing',
    'Express-session for authentication'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Core Features Section
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Core Features', { underline: true });
  doc.moveDown(0.5);

  // 1. Real-time Session Management
  doc.fontSize(14).font('Helvetica-Bold').text('1. Real-time Session Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Live tracking of gaming sessions across multiple device types (PC, PS5, VR, car simulators)',
    'Real-time countdown timers for active sessions',
    'Visual and audio notifications for expired sessions',
    'Dynamic seat availability display',
    'Category-based device organization',
    'Session pause and resume functionality',
    'Automatic session status updates'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 2. Booking Management
  doc.fontSize(14).font('Helvetica-Bold').text('2. Booking Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Walk-in booking creation with instant seat allocation',
    'Advance booking system with date/time selection',
    'Smart conflict detection to prevent double bookings',
    'Customer information management (name, WhatsApp number)',
    'Booking extension during active sessions',
    'Bulk booking operations (complete, delete multiple)',
    'Session history archival for completed bookings',
    'Filter and search capabilities'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 3. Inventory & Food Management
  doc.fontSize(14).font('Helvetica-Bold').text('3. Inventory & Food Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Food and beverage item catalog',
    'Dynamic pricing configuration',
    'Add food orders to active bookings',
    'Order quantity and price tracking',
    'Real-time order total calculation',
    'Food revenue analytics',
    'Item creation, editing, and deletion'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 4. Financial Management
  doc.fontSize(14).font('Helvetica-Bold').text('4. Financial Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Comprehensive expense tracking system',
    'Multiple expense categories (Rent, Utilities, Maintenance, Food & Beverages, Marketing, Equipment, Staff, Miscellaneous)',
    'Date-based expense recording',
    'Expense filtering by category and date range',
    'CSV export for accounting integration',
    'PDF export for expense reports',
    'Monthly and yearly expense summaries',
    'Revenue tracking from bookings and food orders'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Advanced Features
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Advanced Features', { underline: true });
  doc.moveDown(0.5);

  // 5. Analytics & Reporting
  doc.fontSize(14).font('Helvetica-Bold').text('5. Analytics & Reporting');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Real-time occupancy monitoring',
    'Category-wise usage statistics',
    'Hourly booking patterns and trends',
    'Daily, weekly, and monthly revenue reports',
    'Unique customer tracking',
    'Average session duration analysis',
    'Food order statistics',
    'Capacity utilization metrics',
    'Interactive charts and visualizations',
    'Historical data comparison'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 6. Loyalty Program
  doc.fontSize(14).font('Helvetica-Bold').text('6. Loyalty Program');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Customer loyalty tier system (Bronze, Silver, Gold, Platinum)',
    'Points accumulation based on spending',
    'Automatic tier upgrades',
    'Redemption history tracking',
    'Visit count monitoring',
    'Total spend tracking per member',
    'WhatsApp-based member identification',
    'Configurable points per currency ratio',
    'Customizable tier thresholds',
    'Member analytics and insights'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 7. Device Configuration
  doc.fontSize(14).font('Helvetica-Bold').text('7. Device Configuration & Pricing');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Dynamic device category management',
    'Custom seat naming (e.g., "PC-1", "PS5-Pro", "VR-1")',
    'Flexible pricing rules per category',
    'Duration-based pricing (30 min, 1 hour, 2 hours, etc.)',
    'Real-time seat availability updates',
    'Category-wise capacity configuration',
    'Pricing rule updates without downtime'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Customer-Facing Features
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Customer-Facing Features', { underline: true });
  doc.moveDown(0.5);

  // 8. Public Status Board
  doc.fontSize(14).font('Helvetica-Bold').text('8. Public Status Board');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Real-time device availability display',
    'No authentication required (accessible at /status)',
    'Auto-refresh every 10 seconds',
    'Visual indicators (available/occupied)',
    'Category-wise seat counts',
    'Large display format for customer screens',
    'Gaming-themed interface'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 9. WhatsApp Bot Integration
  doc.fontSize(14).font('Helvetica-Bold').text('9. WhatsApp Bot Integration');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Automated device availability queries',
    'Twilio WhatsApp API integration',
    'Real-time availability responses',
    'Customer inquiry handling',
    'Webhook-based message processing',
    '24/7 automated customer service'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 10. Consumer Website
  doc.fontSize(14).font('Helvetica-Bold').text('10. Consumer Website Pages');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Home page with gaming center information',
    'Photo gallery showcase',
    'Facilities and amenities display',
    'Available games catalog',
    'Contact information and hours',
    'Gaming-themed UI design'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Security & Access Control
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Security & Access Control', { underline: true });
  doc.moveDown(0.5);

  // 11. Authentication & Authorization
  doc.fontSize(14).font('Helvetica-Bold').text('11. Authentication & Authorization');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Secure user authentication system',
    'Role-based access control (Admin and Staff roles)',
    'Bcrypt password hashing',
    'Session-based authentication',
    'Password strength validation',
    'Username uniqueness enforcement',
    'Secure login/logout functionality'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 12. Device-Based Access Control
  doc.fontSize(14).font('Helvetica-Bold').text('12. Device-Based Access Control');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'PC/Desktop: Full access with all editing capabilities',
    'Mobile/Tablet (< 1024px): View-only mode for security',
    'Automatic device detection',
    'Visual alerts for restricted access',
    'Prevents accidental changes from mobile devices',
    'Optimized UX for different screen sizes'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 13. Security Features
  doc.fontSize(14).font('Helvetica-Bold').text('13. Security Features');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Rate limiting on public APIs',
    'Helmet.js security headers',
    'CORS configuration',
    'SQL injection prevention via ORM',
    'XSS protection',
    'Secure session storage',
    'Environment variable protection for secrets'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Admin Management
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Administrative Features', { underline: true });
  doc.moveDown(0.5);

  // 14. User Management
  doc.fontSize(14).font('Helvetica-Bold').text('14. User Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Admin user creation and management',
    'Staff user creation and management',
    'Role assignment (Admin/Staff)',
    'User activity logging',
    'Login history tracking'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 15. Activity Logging
  doc.fontSize(14).font('Helvetica-Bold').text('15. Activity Logging & Audit Trail');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Comprehensive activity logging system',
    'User action tracking (create, update, delete, login)',
    'Entity-specific logging (bookings, food items, configs)',
    'Timestamp recording for all activities',
    'User role and username tracking',
    'Audit trail for accountability'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 16. Game Updates Management
  doc.fontSize(14).font('Helvetica-Bold').text('16. Game Updates Management');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Track latest game updates and patches',
    'Event announcements',
    'News and updates display',
    'Image and description support',
    'Source and URL tracking',
    'Publication date management',
    'Update type categorization'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // User Interface
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('User Interface & Experience', { underline: true });
  doc.moveDown(0.5);

  // 17. UI/UX Features
  doc.fontSize(14).font('Helvetica-Bold').text('17. UI/UX Features');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Gaming-themed dark mode with cyan/teal accents',
    'Light/dark theme toggle with persistence',
    'Responsive design for all screen sizes',
    'Accessible components via Radix UI',
    'Smooth animations and transitions',
    'Toast notifications for user feedback',
    'Loading states and skeleton screens',
    'Intuitive navigation with sidebar',
    'Status-based color coding (running, paused, expired)',
    'Icon-based visual cues (Lucide icons)'
  ], { bulletRadius: 2 });
  doc.moveDown(0.8);

  // 18. Data Visualization
  doc.fontSize(14).font('Helvetica-Bold').text('18. Data Visualization');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Real-time charts and graphs (Recharts)',
    'Occupancy rate visualizations',
    'Revenue trend analysis',
    'Category usage breakdown',
    'Hourly booking patterns',
    'Interactive data exploration',
    'Export capabilities (CSV, PDF)'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Database Schema
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Database Schema', { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica').text(
    'The application uses PostgreSQL with the following main entities:',
    { align: 'justify' }
  );
  doc.moveDown(0.5);

  const tables = [
    { name: 'Bookings', desc: 'Active gaming sessions with status, timing, pricing, and food orders' },
    { name: 'Booking History', desc: 'Archived bookings for historical analysis' },
    { name: 'Users', desc: 'Admin and staff user accounts with role-based access' },
    { name: 'Device Configs', desc: 'Dynamic device categories and seat configurations' },
    { name: 'Pricing Configs', desc: 'Pricing rules per category and duration' },
    { name: 'Food Items', desc: 'Available food and beverage catalog' },
    { name: 'Expenses', desc: 'Operational cost tracking by category' },
    { name: 'Activity Logs', desc: 'User action audit trail' },
    { name: 'Loyalty Members', desc: 'Customer loyalty program participants' },
    { name: 'Loyalty Events', desc: 'Points and tier change history' },
    { name: 'Loyalty Config', desc: 'Loyalty program settings and thresholds' },
    { name: 'Game Updates', desc: 'Latest game news and updates' },
    { name: 'Gaming Center Info', desc: 'Center details and contact information' },
    { name: 'Gallery Images', desc: 'Photo gallery for consumer website' },
    { name: 'Facilities', desc: 'Amenities and facilities information' },
    { name: 'Games', desc: 'Available games catalog' }
  ];

  tables.forEach(table => {
    doc.fontSize(11).font('Helvetica-Bold').text(`• ${table.name}: `, { continued: true });
    doc.font('Helvetica').text(table.desc);
  });
  doc.moveDown(1);

  // API Endpoints
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('API Endpoints Overview', { underline: true });
  doc.moveDown(0.5);

  const apiSections = [
    {
      title: 'Authentication',
      endpoints: ['POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/me']
    },
    {
      title: 'Bookings',
      endpoints: ['GET /api/bookings', 'POST /api/bookings', 'PATCH /api/bookings/:id', 
                 'DELETE /api/bookings/:id', 'GET /api/bookings/available-seats',
                 'POST /api/bookings/archive']
    },
    {
      title: 'Analytics',
      endpoints: ['GET /api/analytics/usage', 'GET /api/reports/stats', 'GET /api/reports/history']
    },
    {
      title: 'Configuration',
      endpoints: ['GET /api/device-config', 'POST /api/device-config', 'DELETE /api/device-config/:category',
                 'GET /api/pricing-config', 'POST /api/pricing-config']
    },
    {
      title: 'Food & Inventory',
      endpoints: ['GET /api/food-items', 'POST /api/food-items', 'PATCH /api/food-items/:id',
                 'DELETE /api/food-items/:id']
    },
    {
      title: 'Expenses',
      endpoints: ['GET /api/expenses', 'POST /api/expenses', 'PATCH /api/expenses/:id',
                 'DELETE /api/expenses/:id']
    },
    {
      title: 'Loyalty Program',
      endpoints: ['GET /api/loyalty/members', 'POST /api/loyalty/members', 
                 'GET /api/loyalty/config', 'POST /api/loyalty/config']
    },
    {
      title: 'Public APIs',
      endpoints: ['GET /api/public/status', 'GET /api/whatsapp/availability', 
                 'POST /api/whatsapp/webhook']
    }
  ];

  apiSections.forEach(section => {
    doc.fontSize(12).font('Helvetica-Bold').text(`${section.title}:`);
    doc.fontSize(10).font('Helvetica');
    section.endpoints.forEach(endpoint => {
      doc.text(`  • ${endpoint}`);
    });
    doc.moveDown(0.5);
  });
  doc.moveDown(1);

  // Deployment & Setup
  doc.addPage();
  doc.fontSize(18).font('Helvetica-Bold').text('Deployment & Setup', { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Environment Requirements:');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Node.js 20+',
    'PostgreSQL database (via Replit/Neon)',
    'Environment variables: ADMIN_USERNAME, ADMIN_PASSWORD, DATABASE_URL'
  ], { bulletRadius: 2 });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Running the Application:');
  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Development: npm run dev (runs on port 5000)',
    'Build: npm run build',
    'Production: npm run start',
    'Database Push: npm run db:push'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Benefits Section
  doc.fontSize(18).font('Helvetica-Bold').text('Key Benefits', { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica');
  doc.list([
    'Streamlined Operations: Centralized management of all gaming center activities',
    'Real-time Monitoring: Live tracking of sessions and availability',
    'Financial Control: Comprehensive expense and revenue tracking',
    'Customer Satisfaction: Automated WhatsApp bot and public status board',
    'Data-Driven Decisions: Analytics and reporting for business insights',
    'Scalability: Flexible device and pricing configuration',
    'Security: Role-based access and device-based restrictions',
    'Loyalty Building: Integrated customer loyalty program',
    'Professional Interface: Modern, gaming-themed UI/UX',
    'Type Safety: Full-stack TypeScript for reliable code'
  ], { bulletRadius: 2 });
  doc.moveDown(1);

  // Conclusion
  doc.fontSize(18).font('Helvetica-Bold').text('Conclusion', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica').text(
    'Ankylo Gaming POS is a comprehensive, modern solution for gaming center management. ' +
    'Built with cutting-edge technologies and following best practices, it provides all the tools ' +
    'necessary to run a successful gaming center efficiently. From real-time session tracking to ' +
    'financial management, customer loyalty programs, and automated customer service, this application ' +
    'covers every aspect of gaming center operations.',
    { align: 'justify' }
  );
  doc.moveDown(0.5);
  doc.text(
    'The application is designed to be user-friendly for staff while providing powerful administrative ' +
    'capabilities for management. With its responsive design, security features, and extensive analytics, ' +
    'Ankylo Gaming POS empowers gaming center owners to make data-driven decisions and provide ' +
    'exceptional customer experiences.',
    { align: 'justify' }
  );

  // Footer
  doc.moveDown(2);
  doc.fontSize(10).font('Helvetica').fillColor('gray').text(
    'Generated on: ' + new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    { align: 'center' }
  );

  doc.end();
}
