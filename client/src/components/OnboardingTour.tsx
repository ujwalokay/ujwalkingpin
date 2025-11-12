import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  LayoutDashboard, 
  Settings, 
  UtensilsCrossed, 
  TrendingUp,
  Plus,
  Clock,
  Users,
  IndianRupee,
  Calendar,
  PlayCircle,
  PauseCircle,
  Power,
  ShoppingCart,
  Receipt,
  Laptop,
  Gamepad2,
  BarChart3,
  Wallet
} from "lucide-react";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
  features?: Array<{
    icon: React.ReactNode;
    text: string;
  }>;
  tips?: string[];
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to Airavoto Gaming! 🎮",
    description: "Your complete gaming center management solution",
    icon: <Sparkles className="h-12 w-12 text-purple-500" />,
    content: "Airavoto Gaming is designed to help you efficiently run your gaming center. From tracking gaming sessions in real-time to managing bookings, food orders, and revenue - everything you need is in one place.",
    tips: [
      "💡 All features are accessible from the sidebar on the left",
      "💡 Use the dashboard for day-to-day operations",
      "💡 Your changes are saved automatically"
    ]
  },
  {
    title: "Dashboard - Your Control Center 📊",
    description: "Everything you need at your fingertips",
    icon: <LayoutDashboard className="h-12 w-12 text-blue-500" />,
    content: "The Dashboard shows your gaming devices organized by category (PC, PS5, VR, etc.). Each card shows available seats, occupied seats, and lets you add new bookings instantly.",
    features: [
      { icon: <Plus className="h-5 w-5 text-green-500" />, text: "Add Booking - Create walk-in or advance bookings" },
      { icon: <Clock className="h-5 w-5 text-orange-500" />, text: "Real-time Timers - Watch session countdowns live" },
      { icon: <Users className="h-5 w-5 text-blue-500" />, text: "Booking Types - Walk-in, Advance, or Happy Hours" }
    ],
    tips: [
      "📌 Walk-in bookings start immediately",
      "📌 Advance bookings let customers reserve seats ahead",
      "📌 Happy Hours bookings use special time-based pricing"
    ]
  },
  {
    title: "Creating a Booking 🎯",
    description: "Step-by-step booking process",
    icon: <Plus className="h-12 w-12 text-green-500" />,
    content: "Click '+' on any device card to create a booking. You can choose between walk-in (starts now), advance (future date/time), or happy hours (special pricing).",
    features: [
      { icon: <Users className="h-5 w-5 text-blue-500" />, text: "Enter customer name and phone (optional)" },
      { icon: <Laptop className="h-5 w-5 text-purple-500" />, text: "Select device category and available seats" },
      { icon: <Clock className="h-5 w-5 text-orange-500" />, text: "Choose duration and pricing tier" },
      { icon: <Gamepad2 className="h-5 w-5 text-pink-500" />, text: "For PS5: Select number of persons playing" }
    ],
    tips: [
      "💡 Pricing comes from your Settings page",
      "💡 Multiple seats can be booked at once",
      "💡 Walk-in starts immediately, Advance needs date/time"
    ]
  },
  {
    title: "Managing Active Sessions ⏱️",
    description: "Control bookings in real-time",
    icon: <PlayCircle className="h-12 w-12 text-green-500" />,
    content: "Once a session starts, you have full control. You can extend time, pause/resume, add food orders, or end the session early.",
    features: [
      { icon: <Clock className="h-5 w-5 text-blue-500" />, text: "Extend Time - Add more minutes using configured pricing" },
      { icon: <PauseCircle className="h-5 w-5 text-orange-500" />, text: "Pause/Resume - Stop timer temporarily without ending" },
      { icon: <ShoppingCart className="h-5 w-5 text-green-500" />, text: "Add Food - Attach food orders to booking" },
      { icon: <Power className="h-5 w-5 text-red-500" />, text: "End Session - Complete or delete booking" }
    ],
    tips: [
      "🔔 Timer turns red when expired - automatic alert",
      "🔔 Paused sessions retain remaining time",
      "🔔 Food orders add to total booking amount"
    ]
  },
  {
    title: "Payment Processing 💳",
    description: "Record payments for completed sessions",
    icon: <IndianRupee className="h-12 w-12 text-green-500" />,
    content: "Use the Calculate and Payment buttons to process customer payments. Select completed bookings from the table, calculate the total, then record how they paid.",
    features: [
      { icon: <Users className="h-5 w-5 text-blue-500" />, text: "Select Bookings - Check boxes on completed sessions" },
      { icon: <Receipt className="h-5 w-5 text-purple-500" />, text: "Calculate - Get total amount including food orders" },
      { icon: <Wallet className="h-5 w-5 text-green-500" />, text: "Payment - Mark as Cash, UPI, or Credit payment" },
      { icon: <IndianRupee className="h-5 w-5 text-orange-500" />, text: "Split Payment - Combine Cash and UPI if needed" }
    ],
    tips: [
      "💰 Select multiple bookings to process payments together",
      "💰 Calculate shows total including all food orders",
      "💰 Split payment lets you record Cash + UPI combinations"
    ]
  },
  {
    title: "Refresh & Archive 🔄",
    description: "Keep your dashboard clean and organized",
    icon: <Clock className="h-12 w-12 text-blue-500" />,
    content: "After marking payments, click the Refresh button to archive completed bookings and move them to the History page. This keeps your dashboard showing only active sessions.",
    features: [
      { icon: <Receipt className="h-5 w-5 text-green-500" />, text: "Archive Completed - Moves paid bookings to history" },
      { icon: <Calendar className="h-5 w-5 text-blue-500" />, text: "Clean Dashboard - Shows only active sessions" },
      { icon: <Clock className="h-5 w-5 text-orange-500" />, text: "Auto-Cleanup - Daily cleanup at 2 AM" },
      { icon: <Settings className="h-5 w-5 text-purple-500" />, text: "Ctrl+R Shortcut - Quick data refresh (no archive)" }
    ],
    tips: [
      "🔄 Click Refresh button after processing payments to archive",
      "🔄 Archived bookings move to History page",
      "🔄 Ctrl+R refreshes data without archiving"
    ]
  },
  {
    title: "Food Orders & Revenue 🍕",
    description: "Boost income with food service",
    icon: <UtensilsCrossed className="h-12 w-12 text-orange-500" />,
    content: "Add food items to your menu from the Food page. Then attach food orders to any active booking to track everything together.",
    features: [
      { icon: <Plus className="h-5 w-5 text-green-500" />, text: "Food Page - Add snacks, drinks, meals to menu" },
      { icon: <ShoppingCart className="h-5 w-5 text-blue-500" />, text: "Order from Booking - Select items and quantity" },
      { icon: <Receipt className="h-5 w-5 text-purple-500" />, text: "Auto-Calculate - Price updates automatically" },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Track Revenue - See food sales in reports" }
    ],
    tips: [
      "💰 Food orders increase booking total amount",
      "💰 All orders are tracked in booking history",
      "💰 You can delete individual food items if needed"
    ]
  },
  {
    title: "Settings & Configuration ⚙️",
    description: "Customize your gaming center setup",
    icon: <Settings className="h-12 w-12 text-indigo-500" />,
    content: "The Settings page is where you configure everything. Add device categories, set pricing tiers, configure happy hours, and manage your gaming center details.",
    features: [
      { icon: <Laptop className="h-5 w-5 text-blue-500" />, text: "Device Categories - Add PC, PS5, VR, Xbox, etc." },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Pricing Tiers - Set prices for different durations" },
      { icon: <Clock className="h-5 w-5 text-orange-500" />, text: "Happy Hours - Special time-based pricing" },
      { icon: <Users className="h-5 w-5 text-purple-500" />, text: "Person Count - PS5 can have multi-person pricing" }
    ],
    tips: [
      "🎯 Each device type can have unique pricing",
      "🎯 Happy Hours need both time slots AND pricing",
      "🎯 Changes apply to new bookings immediately"
    ]
  },
  {
    title: "Happy Hours Feature ⏰",
    description: "Special pricing for specific time windows",
    icon: <Clock className="h-12 w-12 text-yellow-500" />,
    content: "Happy Hours let you offer special rates during specific times. Configure time slots (e.g., 2 PM-6 PM) and pricing tiers, then customers can book at discounted rates during those hours.",
    features: [
      { icon: <Clock className="h-5 w-5 text-blue-500" />, text: "Time Slots - Define when happy hours are active" },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Special Pricing - Set discounted rates" },
      { icon: <Calendar className="h-5 w-5 text-purple-500" />, text: "Category-Based - Each device can have different hours" },
      { icon: <PlayCircle className="h-5 w-5 text-orange-500" />, text: "Instant Start - Happy Hours bookings start immediately" }
    ],
    tips: [
      "⚡ Great for filling seats during off-peak hours",
      "⚡ Can run all day or specific time windows",
      "⚡ Pricing is separate from regular pricing"
    ]
  },
  {
    title: "Analytics & Reports 📈",
    description: "Track performance and make smart decisions",
    icon: <BarChart3 className="h-12 w-12 text-blue-500" />,
    content: "View detailed analytics about revenue, device usage, customer behavior, and more. Export reports to CSV/PDF for accounting or business analysis.",
    features: [
      { icon: <TrendingUp className="h-5 w-5 text-green-500" />, text: "Revenue Analytics - Daily, weekly, monthly trends" },
      { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, text: "Device Usage - See which devices are most popular" },
      { icon: <Users className="h-5 w-5 text-purple-500" />, text: "Customer Stats - Unique customers, session duration" },
      { icon: <Receipt className="h-5 w-5 text-orange-500" />, text: "Food Revenue - Track snacks and drinks sales" }
    ],
    tips: [
      "📊 Reports page has export options (CSV/PDF)",
      "📊 Analytics show walk-in booking data only",
      "📊 Use data to optimize pricing and hours"
    ]
  },
  {
    title: "Expense Tracking 💸",
    description: "Monitor your costs and profits",
    icon: <Receipt className="h-12 w-12 text-red-500" />,
    content: "Track all your gaming center expenses in one place. Record electricity bills, game purchases, maintenance, salaries, and more. See profit vs expenses to understand your business health.",
    features: [
      { icon: <Plus className="h-5 w-5 text-red-500" />, text: "Add Expenses - Record all costs with categories" },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Profit Calculation - Revenue minus expenses" },
      { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, text: "Category Breakdown - See where money goes" },
      { icon: <Receipt className="h-5 w-5 text-purple-500" />, text: "Export Reports - CSV/PDF for accounting" }
    ],
    tips: [
      "💡 Categories: Electricity, Games, Maintenance, Salary, etc.",
      "💡 Keep receipts and add expenses regularly",
      "💡 Monthly reports help with tax preparation"
    ]
  },
  {
    title: "Timeline View 📅",
    description: "Visual calendar of all bookings",
    icon: <Calendar className="h-12 w-12 text-blue-500" />,
    content: "The Timeline page shows a visual calendar of all your bookings. Great for planning and seeing your gaming center's schedule at a glance.",
    features: [
      { icon: <Calendar className="h-5 w-5 text-blue-500" />, text: "Calendar View - See all bookings by date" },
      { icon: <Clock className="h-5 w-5 text-orange-500" />, text: "Advance Bookings - View upcoming reservations" },
      { icon: <Users className="h-5 w-5 text-purple-500" />, text: "Customer Names - Quick identification" },
      { icon: <Laptop className="h-5 w-5 text-green-500" />, text: "Device Breakdown - See which devices are booked" }
    ],
    tips: [
      "📅 Click on dates to see all bookings for that day",
      "📅 Shows both walk-in and advance bookings"
    ]
  },
  {
    title: "Reports & Exports 📄",
    description: "Professional reports for your business",
    icon: <Receipt className="h-12 w-12 text-indigo-500" />,
    content: "Generate comprehensive reports for accounting or business analysis. Export data to CSV or PDF formats for easy sharing and record-keeping.",
    features: [
      { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, text: "Booking Reports - See all sessions and revenue" },
      { icon: <Receipt className="h-5 w-5 text-green-500" />, text: "Expense Reports - Track all costs" },
      { icon: <Calendar className="h-5 w-5 text-purple-500" />, text: "Date Filters - Custom report periods" },
      { icon: <IndianRupee className="h-5 w-5 text-orange-500" />, text: "Export Options - CSV and PDF formats" }
    ],
    tips: [
      "📊 Reports page has export buttons for CSV/PDF",
      "📊 Use date filters to customize report periods",
      "📊 Great for accounting and tax preparation"
    ]
  },
  {
    title: "Notifications & Alerts 🔔",
    description: "Stay informed about important events",
    icon: <Clock className="h-12 w-12 text-yellow-500" />,
    content: "The notification center keeps you updated about expired sessions and other important events in your gaming center.",
    features: [
      { icon: <Clock className="h-5 w-5 text-red-500" />, text: "Session Expiry - Alerts when time runs out" },
      { icon: <Calendar className="h-5 w-5 text-blue-500" />, text: "Booking Updates - Track booking changes" },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Payment Alerts - Payment confirmations" }
    ],
    tips: [
      "🔔 Click the bell icon to view notifications",
      "🔔 Important alerts help you stay on top of operations"
    ]
  },
  {
    title: "History & Activity Logs 📚",
    description: "Complete audit trail of all operations",
    icon: <Clock className="h-12 w-12 text-cyan-500" />,
    content: "View complete history of all bookings, payments, and system activities. The Activity Logs page shows who did what and when - perfect for accountability.",
    features: [
      { icon: <Calendar className="h-5 w-5 text-blue-500" />, text: "Booking History - All past sessions archived" },
      { icon: <Users className="h-5 w-5 text-purple-500" />, text: "Customer History - Track repeat customers" },
      { icon: <Receipt className="h-5 w-5 text-green-500" />, text: "Payment Records - Complete transaction log" },
      { icon: <Settings className="h-5 w-5 text-orange-500" />, text: "Activity Logs - Admin/staff actions tracked" }
    ],
    tips: [
      "📝 Search and filter by date, customer, device",
      "📝 Activity logs help identify who made changes",
      "📝 Export history for business records"
    ]
  },
  {
    title: "Ready to Get Started! 🚀",
    description: "You're all set to manage your gaming center",
    icon: <Sparkles className="h-12 w-12 text-purple-500" />,
    content: "You now know all the key features! Start by configuring your devices in Settings, set up pricing, then create your first booking. The system will guide you along the way.",
    features: [
      { icon: <Settings className="h-5 w-5 text-blue-500" />, text: "Step 1: Go to Settings → Add your devices" },
      { icon: <IndianRupee className="h-5 w-5 text-green-500" />, text: "Step 2: Configure pricing for each device" },
      { icon: <Plus className="h-5 w-5 text-purple-500" />, text: "Step 3: Create your first booking from Dashboard" },
      { icon: <BarChart3 className="h-5 w-5 text-orange-500" />, text: "Step 4: Watch your revenue grow in Analytics!" }
    ],
    tips: [
      "🎉 Need help? Use this tour anytime from the header",
      "🎉 All data is saved automatically - no worries",
      "🎉 Explore and experiment - you can always undo"
    ]
  }
];

export function OnboardingTour({ open, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const step = tourSteps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      setCurrentStep(0);
      setShowTour(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleSkip = () => {
    onSkip();
    setCurrentStep(0);
    setShowTour(false);
  };

  const handleClose = () => {
    setCurrentStep(0);
    setShowTour(false);
  };

  return (
    <>
      {/* Welcome Dialog */}
      <Dialog open={open && !showTour} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-onboarding-welcome">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <Sparkles className="h-16 w-16 text-purple-500" />
            </div>
            <DialogTitle className="text-center text-2xl">Welcome to Airavoto Gaming! 🎮</DialogTitle>
            <DialogDescription className="text-center text-base">
              Would you like a quick tour to learn about the key features and get started?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 mt-4">
            <Button 
              onClick={handleStartTour} 
              className="w-full"
              data-testid="button-start-tour"
            >
              Start Tour
            </Button>
            <Button 
              onClick={handleSkip} 
              variant="outline" 
              className="w-full"
              data-testid="button-dont-need-tour"
            >
              Don't Need
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tour Dialog */}
      <Dialog open={showTour} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-onboarding-tour">
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            data-testid="button-close-tour"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <div className="flex justify-center mb-4">
              {step.icon}
            </div>
            <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
            <DialogDescription className="text-center text-base font-medium">
              {step.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-center text-muted-foreground leading-relaxed">{step.content}</p>
            
            {step.features && step.features.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-center">Key Features:</h4>
                  {step.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
                      <p className="text-sm text-muted-foreground flex-1">{feature.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {step.tips && step.tips.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold">💡 Pro Tips:</h4>
                  {step.tips.map((tip, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground pl-2">{tip}</p>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center mb-4 mt-2">
            <div className="flex gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center text-xs text-muted-foreground mb-2">
            Step {currentStep + 1} of {tourSteps.length}
          </div>
          <DialogFooter className="flex flex-row justify-between gap-2">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={isFirstStep}
              data-testid="button-tour-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              data-testid="button-tour-next"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
