
import { DashboardMetrics } from "@/services/dashboard";
import { formatCurrency } from "@/lib/format";

interface VatLimitProps {
  metrics: DashboardMetrics;
}

export default function VatLimit({ metrics }: VatLimitProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-row items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Limit DPH (12 měsíců)</h3>
        <span className="text-sm text-muted-foreground">
          {metrics.vatLimitPercentage.toFixed(1)}% z 2 mil. Kč
        </span>
      </div>
      <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            metrics.vatLimitPercentage > 85 ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(metrics.vatLimitPercentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
        <span>0 Kč</span>
        <span>{formatCurrency(metrics.vatLimit)}</span>
        <span>2 000 000 Kč</span>
      </div>
      {metrics.vatLimitPercentage > 85 && (
        <p className="text-sm text-red-500 mt-2 font-medium">
          Pozor: Blížíte se k limitu pro povinnou registraci DPH!
        </p>
      )}
    </div>
  );
}
