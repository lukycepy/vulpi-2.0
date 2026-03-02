"use client";

import { useState, useEffect } from "react";
import { getFlatRateData } from "@/actions/expenses";

export default function FlatRateCalculator() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [rate, setRate] = useState<40 | 60>(60);
  const [data, setData] = useState<{ totalIncome: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await getFlatRateData(year);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [year]);

  const expense = data ? (data.totalIncome * rate) / 100 : 0;
  const taxBase = data ? data.totalIncome - expense : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Kalkulačka paušálních výdajů</h2>
      
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Rok</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border p-2 rounded w-24"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Sazba</label>
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) as 40 | 60)}
            className="border p-2 rounded"
          >
            <option value={60}>60% (Většina živností)</option>
            <option value={40}>40% (Svobodná povolání)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Načítám data...</div>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span>Příjmy (zaplacené faktury):</span>
            <span className="font-semibold">{data.totalIncome.toLocaleString()} Kč</span>
          </div>
          <div className="flex justify-between border-b pb-2 text-red-600">
            <span>Paušální výdaje ({rate}%):</span>
            <span className="font-semibold">-{expense.toLocaleString()} Kč</span>
          </div>
          <div className="flex justify-between pt-2 text-lg font-bold">
            <span>Dílčí základ daně:</span>
            <span>{taxBase.toLocaleString()} Kč</span>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded text-sm">
            Poznámka: Toto je orientační výpočet. Zahrnuje pouze faktury ve stavu PAID v daném roce.
          </div>
        </div>
      ) : null}
    </div>
  );
}
