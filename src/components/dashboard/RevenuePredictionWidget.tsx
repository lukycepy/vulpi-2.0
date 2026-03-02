
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { predictFutureRevenue } from "@/actions/ai";
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface RevenuePredictionWidgetProps {
  organizationId: string;
}

export function RevenuePredictionWidget({ organizationId }: RevenuePredictionWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<{ predictedAmount: number, reasoning: string } | null>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const data = await predictFutureRevenue(organizationId);
      setPrediction(data);
    } catch (error) {
      console.error("Failed to fetch prediction", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [organizationId]);

  return (
    <Card className="h-full bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            AI Predikce
          </CardTitle>
          {prediction && (
             <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                BETA
             </Badge>
          )}
        </div>
        <CardDescription>Odhad obratu na příští měsíc</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-indigo-400">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <span className="text-xs">Analyzuji trendy...</span>
          </div>
        ) : prediction ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-indigo-700">
                {new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(prediction.predictedAmount)}
              </span>
            </div>
            
            <p className="text-sm text-indigo-800/80 bg-indigo-50/50 p-3 rounded-md border border-indigo-100 italic">
              "{prediction.reasoning}"
            </p>

            <div className="text-xs text-muted-foreground flex justify-between items-center pt-2">
                <span>Na základě dat za 6 měsíců</span>
                <button onClick={fetchPrediction} className="hover:text-indigo-600">
                    <RefreshCw className="h-3 w-3" />
                </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <p>Nedostatek dat pro predikci.</p>
            <p className="text-xs mt-1">Potřebujeme alespoň pár zaplacených faktur.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
