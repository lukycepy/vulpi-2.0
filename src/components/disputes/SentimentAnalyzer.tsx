"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { analyzeSentiment } from "@/actions/ai";
import { Loader2, Smile, Frown, Meh, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentimentAnalyzerProps {
  text: string;
  onAnalyze?: (sentiment: string) => void;
}

export function SentimentAnalyzer({ text, onAnalyze }: SentimentAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sentiment: "ANGRY" | "NEUTRAL" | "HAPPY", score: number, priority: "LOW" | "MEDIUM" | "HIGH" } | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const data = await analyzeSentiment(text);
      setResult(data);
      if (onAnalyze) onAnalyze(data.sentiment);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className={cn(
        "flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium animate-in fade-in zoom-in duration-300",
        result.sentiment === "ANGRY" && "bg-red-100 text-red-700 border border-red-200",
        result.sentiment === "NEUTRAL" && "bg-gray-100 text-gray-700 border border-gray-200",
        result.sentiment === "HAPPY" && "bg-green-100 text-green-700 border border-green-200",
      )}>
        <div className="flex items-center gap-1">
            {result.sentiment === "ANGRY" && <Frown className="h-4 w-4" />}
            {result.sentiment === "NEUTRAL" && <Meh className="h-4 w-4" />}
            {result.sentiment === "HAPPY" && <Smile className="h-4 w-4" />}
            <span>
            Nálada: {result.sentiment === "ANGRY" ? "Naštvaný" : result.sentiment === "HAPPY" ? "Spokojený" : "Neutrální"}
            </span>
        </div>
        
        {result.priority === "HIGH" && (
            <span className="flex items-center gap-1 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded ml-2">
                <AlertTriangle className="h-3 w-3" />
                Vysoká priorita
            </span>
        )}
      </div>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleAnalyze} 
      disabled={loading}
      className="gap-2 text-xs h-8 border-dashed border-indigo-300 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      Analyzovat náladu
    </Button>
  );
}
