
"use client";

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Coffee, TrendingUp, User, Calendar, Award } from "lucide-react";
import { useFoxConfetti } from "@/hooks/use-fox-confetti";
import html2canvas from "html2canvas";

interface YearStats {
  year: number;
  totalRevenue: number;
  currency: string;
  bestMonth: { name: string; amount: number };
  bestClient: { name: string; amount: number };
  coffeeCount: number;
  invoiceCount: number;
}

export function YearInReview({ stats }: { stats: YearStats }) {
  const { triggerCelebration } = useFoxConfetti();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    try {
      const options: any = {
        scale: 2,
        backgroundColor: "#ffffff", // Ensure white background
        useCORS: true
      };
      const canvas = await html2canvas(reportRef.current, options);
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Vulpi-YearInReview-${stats.year}.png`;
      link.click();
      
      triggerCelebration();
    } catch (err) {
      console.error("Failed to generate image:", err);
      alert("Nepodařilo se stáhnout obrázek.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', { 
      style: 'currency', 
      currency: stats.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Váš rok {stats.year} ve Vulpi</h1>
          <p className="text-muted-foreground mt-2">
            Podívejte se, jak se vám dařilo. Gratulujeme k úspěšnému roku!
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Stáhnout jako obrázek
          </Button>
        </div>
      </div>

      <div 
        ref={reportRef} 
        className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-background p-8 rounded-xl border shadow-lg relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10 text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-full mb-4">
             <Award className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-4xl font-extrabold text-orange-900 dark:text-orange-100 mb-2">Vulpi Year in Review</h2>
          <p className="text-xl text-orange-700/80 dark:text-orange-200/80">{stats.year}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          
          {/* Total Revenue Card */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-green-100 rounded-full mb-4 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Celkový obrat</h3>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-muted-foreground mt-2">Z {stats.invoiceCount} faktur</p>
          </div>

          {/* Coffee Count */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center">
             <div className="p-3 bg-brown-100 rounded-full mb-4 text-amber-700">
              <Coffee className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Energie pro práci</h3>
            <p className="text-4xl font-bold text-foreground">~{stats.coffeeCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Vypitých šálků kávy (odhad)</p>
          </div>

          {/* Best Month */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center">
             <div className="p-3 bg-blue-100 rounded-full mb-4 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Nejúspěšnější měsíc</h3>
            <p className="text-3xl font-bold text-foreground">{stats.bestMonth.name}</p>
            <p className="text-sm text-muted-foreground mt-2">{formatCurrency(stats.bestMonth.amount)}</p>
          </div>

          {/* Best Client */}
          <div className="bg-white/80 dark:bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/50 flex flex-col items-center justify-center text-center">
             <div className="p-3 bg-purple-100 rounded-full mb-4 text-purple-600">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Top Klient</h3>
            <p className="text-3xl font-bold text-foreground truncate max-w-full px-2">{stats.bestClient.name}</p>
            <p className="text-sm text-muted-foreground mt-2">{formatCurrency(stats.bestClient.amount)}</p>
          </div>

        </div>

        <div className="mt-12 text-center relative z-10">
          <p className="text-orange-800/60 dark:text-orange-200/60 text-sm font-medium">
            Vygenerováno s ❤️ aplikací Vulpi
          </p>
        </div>
      </div>
    </div>
  );
}
