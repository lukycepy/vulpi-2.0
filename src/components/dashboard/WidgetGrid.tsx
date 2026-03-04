"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";

// In a real app, we might use 'react-grid-layout' or 'dnd-kit'
// For now, let's implement a simple swappable grid or just a list of widgets that can be toggled.

interface Widget {
  id: string;
  title: string;
  content: React.ReactNode;
  visible: boolean;
  size: "small" | "medium" | "large";
}

interface WidgetGridProps {
  initialWidgets: Widget[];
}

export function WidgetGrid({ initialWidgets }: WidgetGridProps) {
  const [widgets, setWidgets] = useState(initialWidgets);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {widgets.map(w => (
          <Button 
            key={w.id} 
            variant={w.visible ? "default" : "outline"} 
            size="sm"
            onClick={() => toggleWidget(w.id)}
          >
            {w.title}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.filter(w => w.visible).map(widget => (
          <Card key={widget.id} className={`
            ${widget.size === "large" ? "md:col-span-2 lg:col-span-3" : ""}
            ${widget.size === "medium" ? "md:col-span-2 lg:col-span-2" : ""}
          `}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {widget.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                 <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                 <button onClick={() => toggleWidget(widget.id)}>
                   <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                 </button>
              </div>
            </CardHeader>
            <CardContent>
              {widget.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}