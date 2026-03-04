"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPS = [
  "Liška radí: Nezapomeňte si dát do nákladů internet! Každá koruna se počítá.",
  "Liška radí: Faktury vystavujte hned po dokončení práce, ať máte peníze dříve na účtu.",
  "Liška radí: Používejte paušální výdaje, pokud máte nízké reálné náklady.",
  "Liška radí: Zálohujte si účetnictví. Vulpi to dělá za vás, ale jistota je jistota.",
  "Liška radí: Kontrolujte splatnost faktur. Upomínky posílejte s grácií.",
  "Liška radí: Oddělte osobní a firemní finance. Ušetříte si spoustu starostí.",
  "Liška radí: Využijte QR kódy na fakturách. Klienti platí rychleji.",
  "Liška radí: Sledujte své cashflow. Přehled je základ úspěchu.",
  "Liška radí: Nebojte se říct si o zálohu u větších projektů.",
  "Liška radí: Odpočívejte. Vyhořelý podnikatel nic nevydělá.",
];

export function FoxTip() {
  const [isVisible, setIsVisible] = useState(true);
  const [tip, setTip] = useState("");

  useEffect(() => {
    // Pick a random tip only on client side to avoid hydration mismatch
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  if (!isVisible || !tip) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500 dark:bg-orange-950/20 dark:border-orange-900/50">
      <div className="bg-orange-100 p-2 rounded-full dark:bg-orange-900/50">
        <span className="text-2xl">🦊</span> 
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-orange-800 flex items-center gap-2 dark:text-orange-300">
          Liščí tip
          <Lightbulb className="h-4 w-4 text-orange-500" />
        </h4>
        <p className="text-sm text-orange-700 mt-1 dark:text-orange-400">
          {tip}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-orange-400 hover:text-orange-600 hover:bg-orange-100 absolute top-2 right-2 dark:text-orange-500 dark:hover:text-orange-300 dark:hover:bg-orange-900/50"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
