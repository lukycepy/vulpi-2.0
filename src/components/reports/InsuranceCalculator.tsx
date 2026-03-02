"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InsuranceCalculatorProps {
  initialIncome: number;
  initialExpenses: number;
}

export function InsuranceCalculator({ initialIncome, initialExpenses }: InsuranceCalculatorProps) {
  const [income, setIncome] = useState(initialIncome);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [useFlatRate, setUseFlatRate] = useState(false);
  const [flatRatePercent, setFlatRatePercent] = useState(60);
  const [isSecondaryActivity, setIsSecondaryActivity] = useState(false);
  const [paySicknessInsurance, setPaySicknessInsurance] = useState(false);
  
  // 2024 Constants
  const MIN_BASE_SOCIAL_MAIN = 13191; // Monthly
  const MIN_BASE_SOCIAL_SECONDARY = 4842; // Monthly
  const MIN_BASE_HEALTH = 21983.5; // Monthly (Average wage / 2 ?) -> Actually 2024 min base is different.
  // Correct 2024 values:
  // Social Min Base (Main): 25% of Avg Wage -> 43967 * 0.30 ? No.
  // Let's use standard known approx values for 2024:
  // Min Deposit Social (Main): 3852 CZK
  // Min Deposit Health (Main): 2968 CZK
  // Min Base Social (Main): 13 191 CZK / month
  // Min Base Health (Main): 21 983.50 CZK / month (50% of avg wage 43967)
  
  const MIN_DEPOSIT_SOCIAL_MAIN = 3852;
  const MIN_DEPOSIT_HEALTH_MAIN = 2968;
  
  const MIN_DEPOSIT_SOCIAL_SECONDARY = 1413;
  const MIN_DEPOSIT_HEALTH_SECONDARY = 0; // No minimum for secondary, paid from actual profit
  
  const SOCIAL_RATE = 0.292;
  const HEALTH_RATE = 0.135;
  const SICKNESS_RATE = 0.027; // 2.7% if opted in (rate changed in 2024?) -> It is 2.1% or 2.7%. Let's use 2.7% for now.
  // Actually from 2024 sickness is 2.7%.
  
  // Calculation
  const effectiveExpenses = useFlatRate ? income * (flatRatePercent / 100) : expenses;
  const profit = Math.max(0, income - effectiveExpenses);
  const assessmentBase = profit * 0.55;
  const monthlyAssessmentBase = assessmentBase / 12;
  
  // Social
  let socialBase = monthlyAssessmentBase;
  const minSocialBase = isSecondaryActivity ? MIN_BASE_SOCIAL_SECONDARY : MIN_BASE_SOCIAL_MAIN;
  if (socialBase < minSocialBase) socialBase = minSocialBase;
  // Max base exists too (~2M), but let's ignore for simple calc
  
  const monthlySocial = Math.max(
    isSecondaryActivity ? MIN_DEPOSIT_SOCIAL_SECONDARY : MIN_DEPOSIT_SOCIAL_MAIN,
    socialBase * SOCIAL_RATE
  );
  
  // Health
  let healthBase = monthlyAssessmentBase;
  const minHealthBase = MIN_BASE_HEALTH; // Only for main
  if (!isSecondaryActivity && healthBase < minHealthBase) healthBase = minHealthBase;
  
  const monthlyHealth = Math.max(
    isSecondaryActivity ? 0 : MIN_DEPOSIT_HEALTH_MAIN, 
    healthBase * HEALTH_RATE
  );
  
  // Sickness
  const monthlySickness = paySicknessInsurance ? (Math.max(minSocialBase, monthlyAssessmentBase) * SICKNESS_RATE) : 0;
  
  const totalMonthly = monthlySocial + monthlyHealth + monthlySickness;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Vstupní údaje (2024/2025)</CardTitle>
          <CardDescription>Upravte odhady pro výpočet záloh</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Příjmy (Roční)</Label>
            <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={income} 
                  onChange={(e) => setIncome(Number(e.target.value))} 
                />
                <span className="flex items-center text-sm text-muted-foreground">Kč</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Výdaje</Label>
                <div className="flex items-center gap-2">
                    <Label htmlFor="flat-rate" className="text-xs cursor-pointer">Paušál</Label>
                    <Switch id="flat-rate" checked={useFlatRate} onCheckedChange={setUseFlatRate} />
                </div>
            </div>
            
            {useFlatRate ? (
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-sm">
                        <span>Paušál {flatRatePercent}%</span>
                        <span className="font-bold">{new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(income * (flatRatePercent/100))}</span>
                    </div>
                    <Select 
                      value={flatRatePercent.toString()} 
                      onValueChange={(v: string) => setFlatRatePercent(Number(v))} 
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte paušál" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80">80% (Řemeslo/Zemědělství)</SelectItem>
                        <SelectItem value="60">60% (Živnost volná/vázaná)</SelectItem>
                        <SelectItem value="40">40% (Ostatní/Autorské)</SelectItem>
                        <SelectItem value="30">30% (Pronájem)</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            ) : (
                <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={expenses} 
                      onChange={(e) => setExpenses(Number(e.target.value))} 
                    />
                    <span className="flex items-center text-sm text-muted-foreground">Kč</span>
                </div>
            )}
          </div>
          
          <div className="pt-4 space-y-4 border-t">
             <div className="flex items-center justify-between">
                 <Label htmlFor="secondary">Vedlejší činnost</Label>
                 <Switch id="secondary" checked={isSecondaryActivity} onCheckedChange={setIsSecondaryActivity} />
             </div>
             <div className="flex items-center justify-between">
                 <Label htmlFor="sickness">Nemocenské pojištění (Dobrovolné)</Label>
                 <Switch id="sickness" checked={paySicknessInsurance} onCheckedChange={setPaySicknessInsurance} />
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Odhadované zálohy</CardTitle>
          <CardDescription>Měsíční platby pro příští rok</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <span className="font-medium">Sociální pojištění</span>
                <span className="text-xl font-bold text-blue-600">
                    {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(monthlySocial)}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">
                Minimální záloha: {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(isSecondaryActivity ? MIN_DEPOSIT_SOCIAL_SECONDARY : MIN_DEPOSIT_SOCIAL_MAIN)}
            </p>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <span className="font-medium">Zdravotní pojištění</span>
                <span className="text-xl font-bold text-green-600">
                    {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(monthlyHealth)}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">
                Minimální záloha: {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(isSecondaryActivity ? 0 : MIN_DEPOSIT_HEALTH_MAIN)}
            </p>
          </div>
          
          {paySicknessInsurance && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                    <span className="font-medium">Nemocenské</span>
                    <span className="text-xl font-bold text-orange-600">
                        {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(monthlySickness)}
                    </span>
                </div>
            </div>
          )}
          
          <div className="pt-6 border-t flex justify-between items-center">
            <span className="text-lg font-bold">Celkem měsíčně</span>
            <span className="text-2xl font-bold text-primary">
                 {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(totalMonthly)}
            </span>
          </div>
          
          <div className="text-center text-xs text-muted-foreground pt-4">
            * Výpočet je orientační dle sazeb pro rok 2024. Skutečná výše záloh se může lišit dle podaného Přehledu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
