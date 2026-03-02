"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LimitsWidgetProps {
  vatTurnover12m: number;
  vatLimit: number; // 2,000,000
  incomeThisYear: number;
}

export function LimitsWidget({ vatTurnover12m, vatLimit, incomeThisYear }: LimitsWidgetProps) {
  const vatPercentage = Math.min((vatTurnover12m / vatLimit) * 100, 100);
  const flatTaxLimit1 = 1500000;
  const flatTaxLimit2 = 2000000;
  
  // Flat tax logic: 
  // Band 1: up to 1.5M
  // Band 2: up to 2M
  // We use incomeThisYear for flat tax bands
  const flatTaxPercentage = Math.min((incomeThisYear / flatTaxLimit2) * 100, 100);
  
  const isApproachingVatLimit = vatPercentage >= 85;
  const isOverVatLimit = vatPercentage >= 100;
  
  const isApproachingFlatTaxLimit1 = incomeThisYear >= flatTaxLimit1 * 0.85 && incomeThisYear < flatTaxLimit1;
  const isOverFlatTaxLimit1 = incomeThisYear >= flatTaxLimit1;
  const isApproachingFlatTaxLimit2 = incomeThisYear >= flatTaxLimit2 * 0.85;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moje limity (OSVČ)</CardTitle>
        <CardDescription>Sledování obratu pro DPH a paušální daň</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* VAT Limit */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Limit pro DPH (12 měs.)</span>
            <span className="text-muted-foreground">
              {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(vatTurnover12m)} / 2 mil. Kč
            </span>
          </div>
          <Progress value={vatPercentage} className={`h-2 ${isOverVatLimit ? "bg-red-200" : ""}`} indicatorClassName={isOverVatLimit ? "bg-red-500" : (isApproachingVatLimit ? "bg-amber-500" : "bg-green-500")} />
          
          {isOverVatLimit ? (
            <div className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 text-destructive mt-2">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <h5 className="font-medium text-sm">Limit překročen!</h5>
                <p className="text-xs opacity-90">
                  Překročili jste limit 2 mil. Kč za 12 měsíců. Musíte se registrovat k DPH.
                </p>
              </div>
            </div>
          ) : isApproachingVatLimit ? (
            <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200 mt-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
              <div>
                <h5 className="font-medium text-sm">Blížíte se hranici DPH</h5>
                <p className="text-xs opacity-90">
                  Jste na {vatPercentage.toFixed(1)} % limitu pro povinnou registraci.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Flat Tax Bands */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Pásma paušální daně (rok)</span>
            <span className="text-muted-foreground">
              {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(incomeThisYear)}
            </span>
          </div>
          <div className="relative pt-1">
             <Progress value={flatTaxPercentage} className="h-2" indicatorClassName={flatTaxPercentage > 75 ? "bg-amber-500" : "bg-blue-500"} />
             {/* Marker for 1.5M */}
             <div className="absolute top-0 left-[75%] w-0.5 h-4 bg-gray-400 -mt-1" title="Hranice 1. pásma (1.5 mil.)"></div>
             <div className="absolute top-4 left-[75%] text-[10px] text-gray-500 -translate-x-1/2">1.5M</div>
             <div className="absolute top-4 right-0 text-[10px] text-gray-500">2M</div>
          </div>
          
          {isOverFlatTaxLimit1 ? (
             <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
               <AlertTriangle className="h-3 w-3" />
               Překročeno 1. pásmo (1.5 mil. Kč). Pro příští rok spadáte do vyššího pásma.
             </p>
          ) : isApproachingFlatTaxLimit1 ? (
             <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
               <CheckCircle2 className="h-3 w-3" />
               Blížíte se hranici 1. pásma (1.5 mil. Kč).
             </p>
          ) : (
             <p className="text-xs text-muted-foreground mt-1">
               Aktuálně v 1. pásmu (do 1.5 mil. Kč).
             </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
