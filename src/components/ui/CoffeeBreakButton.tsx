
"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CoffeeBreakButtonProps {
  className?: string;
  variant?: "icon" | "nav-item";
  label?: string;
}

export function CoffeeBreakButton({ className, variant = "icon", label = "Pauza" }: CoffeeBreakButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "nav-item" ? (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center space-y-1 w-full h-full text-xs font-medium text-muted-foreground hover:text-primary transition-colors",
            className
          )}
        >
          <Coffee className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ) : (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpen(true)}
            className={cn("text-muted-foreground hover:text-primary", className)}
            title="Potřebuji pauzu"
        >
          <Coffee className="h-5 w-5" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-none">
            <div className="relative pt-[56.25%]">
              <iframe 
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" 
                title="Lofi Girl Radio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="absolute top-4 right-4 z-10">
                {/* Close button is provided by DialogContent usually, but we might want custom styling for video */}
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
