import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Sparkles, LayoutDashboard, Settings, UtensilsCrossed, TrendingUp } from "lucide-react";

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    title: "Welcome to Ankylo Gaming! 🎮",
    description: "Your complete gaming center management solution. Let's take a quick tour to help you get started.",
    icon: <Sparkles className="h-12 w-12 text-purple-500" />,
    content: "Ankylo Gaming helps you manage bookings, track sessions, handle payments, and grow your business - all in one place."
  },
  {
    title: "Dashboard Overview 📊",
    description: "Your command center for real-time operations",
    icon: <LayoutDashboard className="h-12 w-12 text-blue-500" />,
    content: "Monitor active sessions, create walk-in bookings, manage advance reservations, and view today's revenue at a glance. Everything you need is right here."
  },
  {
    title: "Device & Pricing Settings ⚙️",
    description: "Configure your gaming devices and pricing",
    icon: <Settings className="h-12 w-12 text-green-500" />,
    content: "Add device categories (PC, PS5, Xbox), set seat counts, configure pricing tiers, and manage happy hours for special promotions."
  },
  {
    title: "Food Orders & Loyalty 🎁",
    description: "Boost revenue and customer retention",
    icon: <UtensilsCrossed className="h-12 w-12 text-orange-500" />,
    content: "Manage food menu items, track orders with bookings, and reward loyal customers with a tier-based loyalty program (Bronze to Platinum)."
  },
  {
    title: "Analytics & Reports 📈",
    description: "Track performance and make data-driven decisions",
    icon: <TrendingUp className="h-12 w-12 text-indigo-500" />,
    content: "View revenue trends, analyze device usage, track expenses, and export reports. Access detailed activity logs and customer analytics."
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
            <DialogTitle className="text-center text-2xl">Welcome to Ankylo Gaming! 🎮</DialogTitle>
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
          <div className="py-4">
            <p className="text-center text-muted-foreground">{step.content}</p>
          </div>
          <div className="flex justify-center mb-4">
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
