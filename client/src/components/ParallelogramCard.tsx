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
        "relative group bg-card border border-border/40 rounded-xl p-6 md:p-8 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300",
        className
      )}
      data-testid={testId}
    >
      <div className="space-y-6">
        <div className={cn("p-3 rounded-xl bg-primary/10 w-fit group-hover:scale-110 transition-transform duration-300", iconColor)}>
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            {icon}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl md:text-2xl font-bold text-foreground uppercase tracking-wide">
            {title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}