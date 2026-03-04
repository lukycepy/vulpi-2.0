
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Moon } from "lucide-react";

export function ZenModeButton() {
    const [zenMode, setZenMode] = useState(false);

    if (zenMode) {
        return (
            <div className="fixed inset-0 bg-background/95 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="text-center space-y-6 max-w-md p-6">
                    <div className="h-32 w-32 bg-primary/20 rounded-full mx-auto flex items-center justify-center animate-pulse">
                         <Moon className="h-16 w-16 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Dobrá práce!</h2>
                    <p className="text-xl text-muted-foreground">
                        Účetnictví je vyřešeno. Zítra je taky den.
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                        &quot;Odpočívej, aby tvá mysl byla zítra opět ostrá jako liščí zrak.&quot;
                    </p>
                    <Button onClick={() => setZenMode(false)} variant="outline" size="lg" className="mt-8">
                        Zpět do práce
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => setZenMode(true)}
            title="Mám hotovo (Zen Mode)"
        >
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Mám hotovo</span>
        </Button>
    );
}
