"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPS = [
  "Nezapomeňte, že faktury po splatnosti můžete exportovat a poslat upomínku.",
  "Nastavte si vlastní šablony faktur v Nastavení -> Šablony pro profesionální vzhled.",
  "Sledujte marže u svých produktů, abyste věděli, co vám nejvíce vydělává.",
  "Můžete přidat logo vaší firmy do nastavení organizace.",
  "Využijte funkci 'Impersonace' pro kontrolu, co vidí vaši zaměstnanci.",
  "Pravidelně kontrolujte stav bankovního účtu v sekci Banka.",
  "Sledujte své výdaje a kategorizujte je pro lepší přehled o cashflow.",
  "Vytvořte si vlastní pole pro faktury, pokud potřebujete evidovat specifické údaje.",
  "Zkuste použít klávesové zkratky pro rychlejší práci.",
  "Můžete filtrovat faktury podle stavu (zaplacené, po splatnosti, atd.).",
  "Liščí tip: Udržujte pořádek ve skladu pomocí inventury.",
  "Liščí tip: Automatizujte opakující se faktury (již brzy!).",
  "Nezapomeňte zálohovat svá data (my to děláme za vás, ale jistota je jistota).",
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
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 shadow-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-orange-100 p-2 rounded-full">
        <span className="text-2xl">🦊</span> 
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-orange-800 flex items-center gap-2">
          Liščí tip
          <Lightbulb className="h-4 w-4 text-orange-500" />
        </h4>
        <p className="text-sm text-orange-700 mt-1">
          {tip}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 text-orange-400 hover:text-orange-600 hover:bg-orange-100 absolute top-2 right-2"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
