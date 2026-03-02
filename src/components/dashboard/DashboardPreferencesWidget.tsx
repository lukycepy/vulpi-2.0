
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { updateDashboardPreferences } from "@/actions/profile";

interface Preferences {
    showCashflow: boolean;
    showClientShare: boolean;
    showHeatmap: boolean;
    showLimits: boolean;
    showNetProfit: boolean;
    showTips: boolean;
    showForgotten: boolean;
    showContracts: boolean;
    [key: string]: boolean;
}

export function DashboardPreferencesWidget({ preferences }: { preferences: Preferences }) {
    const [prefs, setPrefs] = useState<Preferences>(preferences);
    const [open, setOpen] = useState(false);

    const handleToggle = async (key: keyof Preferences) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        
        // Save to DB
        try {
            await updateDashboardPreferences(newPrefs);
        } catch (e) {
            console.error("Failed to save dashboard preferences", e);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Upravit zobrazení</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none mb-2">Viditelnost widgetů</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                        Vyberte, které části dashboardu chcete zobrazovat.
                    </p>
                    
                    <div className="space-y-3">
                        <PreferenceToggle 
                            id="showCashflow" 
                            label="Cashflow graf" 
                            checked={prefs.showCashflow} 
                            onCheckedChange={() => handleToggle("showCashflow")} 
                        />
                        <PreferenceToggle 
                            id="showClientShare" 
                            label="Podíl klientů" 
                            checked={prefs.showClientShare} 
                            onCheckedChange={() => handleToggle("showClientShare")} 
                        />
                        <PreferenceToggle 
                            id="showHeatmap" 
                            label="Prodejní aktivita" 
                            checked={prefs.showHeatmap} 
                            onCheckedChange={() => handleToggle("showHeatmap")} 
                        />
                        <PreferenceToggle 
                            id="showLimits" 
                            label="DPH Limity (OSVČ)" 
                            checked={prefs.showLimits} 
                            onCheckedChange={() => handleToggle("showLimits")} 
                        />
                        <PreferenceToggle 
                            id="showNetProfit" 
                            label="Čistý zisk" 
                            checked={prefs.showNetProfit} 
                            onCheckedChange={() => handleToggle("showNetProfit")} 
                        />
                        <PreferenceToggle 
                            id="showTips" 
                            label="Lišákovy tipy" 
                            checked={prefs.showTips} 
                            onCheckedChange={() => handleToggle("showTips")} 
                        />
                        <PreferenceToggle 
                            id="showForgotten" 
                            label="Zapomenuté faktury" 
                            checked={prefs.showForgotten} 
                            onCheckedChange={() => handleToggle("showForgotten")} 
                        />
                        <PreferenceToggle 
                            id="showContracts" 
                            label="Končící smlouvy" 
                            checked={prefs.showContracts} 
                            onCheckedChange={() => handleToggle("showContracts")} 
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function PreferenceToggle({ id, label, checked, onCheckedChange }: { id: string, label: string, checked: boolean, onCheckedChange: () => void }) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
            <Label htmlFor={id} className="cursor-pointer font-normal">{label}</Label>
        </div>
    );
}
