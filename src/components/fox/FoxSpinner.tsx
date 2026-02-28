import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface FoxSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FoxSpinner({ className, size = "md" }: FoxSpinnerProps) {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className={cn("animate-bounce", sizeClasses[size])}>
        🦊
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Pracuji na tom...</span>
      </div>
    </div>
  );
}
