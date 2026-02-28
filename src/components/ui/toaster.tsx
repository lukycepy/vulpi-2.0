"use client"

import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle2, X } from "lucide-react"
import { useEffect, useState } from "react"

export function Toaster() {
  const { toasts } = useToast()
  // We need to trigger re-renders when toasts change, which the hook handles via useState inside it.
  // Wait, the hook uses `listeners` array and `dispatch`.
  // When dispatch is called, it calls all listeners.
  // Each component using useToast adds a listener in useEffect.
  // The listener calls setToasts.
  // So any component using useToast will re-render when a toast is dispatched.
  
  // However, useToast implementation I saw creates a local state `toasts`.
  // When dispatch is called, it updates local state of ALL components using the hook?
  // Yes, because `listeners` is global. Each component instance adds its own listener to the global list.
  // So when dispatch happens, all components update their local state.
  // This is a bit unusual (usually context is used), but it works for simple cases.

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`
            relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5 fade-in duration-300
            ${toast.variant === "destructive" 
              ? "border-destructive bg-destructive text-destructive-foreground" 
              : "border-border bg-background text-foreground"
            }
          `}
        >
          {toast.variant === "destructive" ? (
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-500" />
          )}
          
          <div className="flex-1 grid gap-1">
            {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
            {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
