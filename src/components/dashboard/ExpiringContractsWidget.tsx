"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Contract {
  id: string;
  title: string;
  validUntil: Date | null;
  client: {
    id: string;
    name: string;
  };
}

interface ExpiringContractsWidgetProps {
  contracts: Contract[];
}

export function ExpiringContractsWidget({ contracts }: ExpiringContractsWidgetProps) {
  if (!contracts || contracts.length === 0) {
    return null;
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-orange-200 bg-orange-50/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
          <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" />
          Končící smlouvy (do 30 dnů)
        </CardTitle>
        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-white">
          {contracts.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between border-b border-orange-100 pb-2 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <Link 
                  href={`/clients/${contract.client.id}?tab=contracts`}
                  className="text-sm font-medium leading-none hover:underline flex items-center"
                >
                  <FileText className="mr-2 h-3 w-3 text-muted-foreground" />
                  {contract.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  Klient: {contract.client.name}
                </p>
              </div>
              <div className="text-sm font-medium text-orange-700">
                {contract.validUntil
                  ? format(new Date(contract.validUntil), "d. M. yyyy", { locale: cs })
                  : "Neznámé datum"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
