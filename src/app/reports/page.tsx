import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calculator, FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporty a Analytika</h1>
        <p className="text-muted-foreground mt-2">
          Přehledy vaší podnikatelské činnosti.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/reports/insurance">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 w-fit rounded-md mb-2">
                <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Pojištění OSVČ</CardTitle>
              <CardDescription>
                Kalkulačka a přehled záloh na sociální a zdravotní pojištění.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/year-in-review">
          <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 w-fit rounded-md mb-2">
                <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Shrnutí roku</CardTitle>
              <CardDescription>
                Infografika vašich úspěchů za uplynulý rok.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        {/* Placeholder for future reports */}
        <Card className="h-full opacity-50">
            <CardHeader>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 w-fit rounded-md mb-2">
                <FileText className="h-6 w-6 text-gray-500" />
              </div>
              <CardTitle>Daňové přiznání</CardTitle>
              <CardDescription>
                Podklady pro DPPO/DPFO (Připravujeme).
              </CardDescription>
            </CardHeader>
        </Card>
      </div>
    </div>
  );
}
