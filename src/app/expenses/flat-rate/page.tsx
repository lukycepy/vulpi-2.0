import { Suspense } from "react";
import FlatRateCalculator from "@/components/expenses/FlatRateCalculator";

export default function FlatRatePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Paušální výdaje</h1>
      <div className="max-w-2xl">
        <Suspense fallback={<div>Loading...</div>}>
          <FlatRateCalculator />
        </Suspense>
      </div>
    </div>
  );
}
