"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NetProfitWidgetProps {
  income: number;
  expenses: number; // Current recorded expenses
}

export function NetProfitWidget({ income, expenses }: NetProfitWidgetProps) {
  // Toggle between "Recorded Expenses" and "Flat Rate 60%"
  const [useFlatRate, setUseFlatRate] = useState(false);

  // Constants (Simplified for 2024/2025)
  const FLAT_RATE_EXPENSES = 0.60;
  
  // Tax constants
  const TAX_BASE_COEFF = 0.55; // 55% of Profit for Social/Health base
  const SOCIAL_RATE = 0.292;
  const HEALTH_RATE = 0.135;
  const INCOME_TAX_RATE = 0.15;
  
  // Tax Discounts (Sleva na poplatníka) - approx 30,840 / year
  const TAX_DISCOUNT_PER_YEAR = 30840;

  const currentExpenses = useFlatRate ? income * FLAT_RATE_EXPENSES : expenses;
  const profit = Math.max(0, income - currentExpenses);
  
  // Tax Base
  const taxBase = profit; // For Income Tax
  const insuranceBase = profit * TAX_BASE_COEFF;
  
  // Insurance
  const socialInsurance = insuranceBase * SOCIAL_RATE;
  const healthInsurance = insuranceBase * HEALTH_RATE;
  
  // Income Tax
  const rawTax = taxBase * INCOME_TAX_RATE;
  const incomeTax = Math.max(0, rawTax - TAX_DISCOUNT_PER_YEAR); // Apply discount
  
  const totalDeductions = socialInsurance + healthInsurance + incomeTax;
  const netProfit = profit - totalDeductions;
  
  const netProfitMargin = income > 0 ? (netProfit / income) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Odhad čistého zisku</CardTitle>
          <Badge variant={netProfitMargin > 50 ? "default" : "secondary"}>
            {netProfitMargin.toFixed(0)}% marže
          </Badge>
        </div>
        <CardDescription>Kolik vám zůstane "v kapse"</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
           <Button 
             variant={!useFlatRate ? "default" : "outline"} 
             size="sm" 
             onClick={() => setUseFlatRate(false)}
             className="text-xs h-7"
           >
             Reálné výdaje
           </Button>
           <Button 
             variant={useFlatRate ? "default" : "outline"} 
             size="sm" 
             onClick={() => setUseFlatRate(true)}
             className="text-xs h-7"
           >
             Paušál 60%
           </Button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Příjmy (rok)</span>
            <span className="font-medium text-green-600">
              +{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(income)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Výdaje ({useFlatRate ? "60%" : "skutečné"})</span>
            <span className="font-medium text-red-400">
              -{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(currentExpenses)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashed">
            <span className="text-sm text-muted-foreground">Odhad daní a poj.</span>
            <span className="font-medium text-red-600">
              -{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(totalDeductions)}
            </span>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t font-bold text-lg">
            <span>Čistý zisk</span>
            <span className="text-primary">
              {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(netProfit)}
            </span>
          </div>
          
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            * Odhad zahrnuje slevu na poplatníka. Nezahrnuje bonusy na děti či slevu na manželku.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
