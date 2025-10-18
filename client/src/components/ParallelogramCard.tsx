import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ParallelogramCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  iconColor?: string;
  testId?: string;
}

export function ParallelogramCard({
  icon,
  title,
  description,
  className,
  iconColor = "text-primary",
  testId
}: ParallelogramCardProps) {
  return (
    <div 
      className={cn(
        "relative group overflow-hidden",
        className
      )}
      data-testid={testId}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm border border-border/50 transform skew-x-[-2deg] group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"></div>
      
      <div className="relative p-6 md:p-8 flex flex-col gap-4">
        <div className={cn("w-12 h-12 md:w-14 md:h-14", iconColor)}>
          {icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight uppercase">
            {title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-2xl group-hover:from-primary/20 transition-all duration-300"></div>
    </div>
  );
}