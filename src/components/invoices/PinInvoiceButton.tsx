"use client";

import { togglePinInvoice } from "@/actions/invoice";
import { Pin, PinOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinInvoiceButtonProps {
  id: string;
  isPinned: boolean;
}

export function PinInvoiceButton({ id, isPinned: initialPinned }: PinInvoiceButtonProps) {
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    // Optimistic update
    setIsPinned(!isPinned);
    
    try {
      const result = await togglePinInvoice(id);
      if (!result.success) {
        // Revert on error
        setIsPinned(isPinned);
      }
    } catch (error) {
      setIsPinned(isPinned);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "h-8 w-8 transition-colors",
        isPinned ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-muted-foreground hover:text-foreground"
      )}
      title={isPinned ? "Odepnout fakturu" : "Připnout fakturu"}
    >
      {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
    </Button>
  );
}
