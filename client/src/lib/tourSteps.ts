import { Step } from "react-joyride";

export const dashboardTourSteps: Step[] = [
  {
    target: '[data-joyride="take-tour-button"]',
    content: 'Welcome to Airavoto Gaming! This interactive tour will guide you through all the key features. You can start the tour anytime by clicking this button.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '[data-joyride="sidebar-toggle"]',
    content: 'Click here to toggle the sidebar navigation. The sidebar gives you access to all pages like Dashboard, Timeline, Analytics, Settings, and more.',
    placement: 'right',
  },
  {
    target: '[data-joyride="sidebar-dashboard"]',
    content: 'The Dashboard is your control center. Here you can see all gaming devices organized by category (PC, PS5, VR, etc.) and manage bookings in real-time.',
    placement: 'right',
  },
  {
    target: '[data-joyride="category-cards"]',
    content: 'These category cards show your gaming devices. Each card displays available and occupied seats. Green means available, and you\'ll see real-time session timers for active bookings.',
    placement: 'bottom',
  },
  {
    target: '[data-joyride="add-booking-button"]',
    content: 'Click the "+" button on any category card to create a new booking. You can create walk-in bookings (start now), advance bookings (future), or happy hours bookings (special pricing).',
    placement: 'right',
  },
  {
    target: '[data-joyride="view-toggle"]',
    content: 'Switch between table view and card view to see your bookings in different layouts. Table view is great for detailed information, while card view is more visual.',
    placement: 'bottom',
  },
  {
    target: '[data-joyride="booking-table"]',
    content: 'The booking table shows all active sessions with real-time countdown timers. You can extend time, pause/resume sessions, add food orders, or end sessions from here.',
    placement: 'top',
  },
  {
    target: '[data-joyride="sidebar-settings"]',
    content: 'Visit Settings to configure your gaming devices, pricing tiers, happy hours, and more. This is where you customize everything for your gaming center.',
    placement: 'right',
  },
  {
    target: '[data-joyride="sidebar-analytics"]',
    content: 'Analytics shows revenue trends, device usage statistics, and customer insights. Export reports to CSV/PDF for accounting or business analysis.',
    placement: 'right',
  },
  {
    target: '[data-joyride="theme-toggle"]',
    content: 'Toggle between light and dark mode to match your preference. Your choice is saved automatically!',
    placement: 'bottom',
  },
  {
    target: '[data-joyride="notification-center"]',
    content: 'Stay updated with system notifications. Get alerts for expired sessions, low stock items, and important events.',
    placement: 'bottom',
  },
];

export const settingsTourSteps: Step[] = [
  {
    target: '[data-joyride="settings-devices"]',
    content: 'Configure your gaming device categories here. Add PC, PS5, VR, Xbox, and any other gaming devices you have. Set how many seats each category has.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-joyride="settings-pricing"]',
    content: 'Set up pricing tiers for each device category. Configure prices for different duration options (30 min, 1 hour, 2 hours, etc.). PS5 can have multi-person pricing!',
    placement: 'bottom',
  },
  {
    target: '[data-joyride="settings-happy-hours"]',
    content: 'Configure Happy Hours - special time-based pricing to attract customers during off-peak hours. Set time slots (e.g., 2-6 PM) and discounted rates for each category.',
    placement: 'bottom',
  },
  {
    target: '[data-joyride="add-category-button"]',
    content: 'Click here to add a new device category to your gaming center. You can add unlimited categories to match your setup!',
    placement: 'left',
  },
];

export const combinedTourSteps: Step[] = [
  ...dashboardTourSteps,
];
