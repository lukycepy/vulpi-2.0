
"use client";

import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";
import { stopTimer } from "@/actions/time-tracking";
import { useRouter } from "next/navigation";

interface TimerWidgetProps {
  activeEntry: {
    id: string;
    startTime: Date;
    description: string | null;
    project: {
      name: string;
      color: string | null;
    } | null;
  } | null;
}

export default function TimerWidget({ activeEntry }: TimerWidgetProps) {
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }

    const start = new Date(activeEntry.startTime).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    // Initial set
    setElapsed(Math.floor((new Date().getTime() - start) / 1000));

    return () => clearInterval(interval);
  }, [activeEntry]);

  const handleStop = async () => {
    await stopTimer();
    router.refresh();
  };

  if (!activeEntry) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-full px-3 py-1">
        <Play className="h-4 w-4" />
        <span>Žádný aktivní timer</span>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
      <div className="flex flex-col">
        <span className="text-xs font-medium truncate max-w-[150px]">
          {activeEntry.description || "Bez popisu"}
        </span>
        {activeEntry.project && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ backgroundColor: activeEntry.project.color || '#000' }}
            />
            {activeEntry.project.name}
          </span>
        )}
      </div>
      
      <div className="font-mono font-medium text-lg">
        {formatTime(elapsed)}
      </div>

      <button 
        onClick={handleStop}
        className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
        title="Zastavit timer"
      >
        <Square className="h-4 w-4 fill-current" />
      </button>
    </div>
  );
}
