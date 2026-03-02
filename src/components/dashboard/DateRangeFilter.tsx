"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears, format } from "date-fns";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPeriod = searchParams.get("period") || "this_month";
  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");

  const [period, setPeriod] = useState(currentPeriod);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(currentFrom || "");
  const [customTo, setCustomTo] = useState(currentTo || "");

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    
    if (value === "custom") {
      setIsCustomDialogOpen(true);
      return;
    }

    const now = new Date();
    let from: Date;
    let to: Date;

    switch (value) {
      case "this_month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case "this_year":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case "last_year":
        const lastYear = subYears(now, 1);
        from = startOfYear(lastYear);
        to = endOfYear(lastYear);
        break;
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
    }

    applyFilter(value, from, to);
  };

  const applyCustomFilter = () => {
    if (!customFrom || !customTo) return;
    applyFilter("custom", new Date(customFrom), new Date(customTo));
    setIsCustomDialogOpen(false);
  };

  const applyFilter = (p: string, from: Date, to: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    params.set("from", format(from, "yyyy-MM-dd"));
    params.set("to", format(to, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="w-[180px]">
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Období" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">Tento měsíc</SelectItem>
            <SelectItem value="last_month">Minulý měsíc</SelectItem>
            <SelectItem value="this_year">Letos</SelectItem>
            <SelectItem value="last_year">Loni</SelectItem>
            <SelectItem value="custom">Vlastní rozsah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vlastní rozsah</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="from">Od</Label>
              <Input
                id="from"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to">Do</Label>
              <Input
                id="to"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>Zrušit</Button>
            <Button onClick={applyCustomFilter}>Použít</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
