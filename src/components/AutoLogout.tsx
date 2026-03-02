"use client";

import { useEffect, useRef } from "react";
import { logoutWithReason } from "@/actions/auth";
import { useRouter } from "next/navigation";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function AutoLogout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_MS);
  };

  const handleLogout = async () => {
    try {
      await logoutWithReason("timeout");
      router.push("/login?reason=timeout");
      router.refresh();
    } catch (error) {
      console.error("Auto logout failed:", error);
    }
  };

  useEffect(() => {
    // Initial setup
    resetTimeout();

    // Events to listen for
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
