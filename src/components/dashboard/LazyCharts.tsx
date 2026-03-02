
"use client";

import dynamic from "next/dynamic";

export const LazyCashflowChart = dynamic(() => import("@/components/dashboard/CashflowChart"), { 
    ssr: false, 
    loading: () => <p className="text-sm text-muted-foreground p-4">Načítání grafu...</p> 
});

export const LazyClientShareChart = dynamic(() => import("@/components/dashboard/ClientShareChart"), { 
    ssr: false, 
    loading: () => <p className="text-sm text-muted-foreground p-4">Načítání grafu...</p> 
});

export const LazySalesHeatmap = dynamic(() => import("@/components/dashboard/SalesHeatmap"), { 
    ssr: false, 
    loading: () => <p className="text-sm text-muted-foreground p-4">Načítání mapy...</p> 
});
