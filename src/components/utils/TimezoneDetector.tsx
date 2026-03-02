
"use client";

import { useEffect } from "react";
import { updateTimezone } from "@/actions/profile";

export function TimezoneDetector() {
  useEffect(() => {
    // Only run if user is logged in (session check is implicit via action or we could pass prop)
    // For now, we just detect and send. The action handles user check.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Check if we already have it in cookie to avoid spamming action
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("app_timezone="))
      ?.split("=")[1];

    if (cookieValue !== tz) {
      updateTimezone(tz).catch(console.error);
    }
  }, []);

  return null; // Invisible component
}
