import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import VehicleForm from "@/components/inventory/VehicleForm";
import VehicleLogForm from "@/components/inventory/VehicleLogForm";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Car, Fuel, MapPin, Navigation } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Kilometrovník | Vulpi",
  description: "Evidence vozidel a knihy jízd",
};

export default async function VehiclesPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Nejste členem žádné organizace.
        </div>
      </div>
    );
  }
  
  const orgId = membership.organizationId;
  const canManageInventory = await hasPermission(user.id, orgId, "manage_inventory");

  if (!canManageInventory) {
     return (
      <div className="container mx-auto p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Chyba: Nemáte oprávnění pro správu vozidel.
        </div>
      </div>
    );
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  const logs = await prisma.vehicleLog.findMany({
    where: { vehicle: { organizationId: orgId } },
    include: { vehicle: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Kilometrovník</h1>
          </div>
          <p className="text-muted-foreground">
            Evidence firemních vozidel a knihy jízd.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Kniha jízd
            </h2>
            <VehicleLogForm vehicles={vehicles} />
          </div>

          <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Datum</th>
                    <th className="px-4 py-3">Vozidlo</th>
                    <th className="px-4 py-3">Trasa</th>
                    <th className="px-4 py-3">Účel</th>
                    <th className="px-4 py-3 text-right">Vzdálenost</th>
                    <th className="px-4 py-3 text-right">Stav km</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Zatím žádné záznamy o jízdách.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {formatDate(log.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{log.vehicle.plate}</div>
                          <div className="text-xs text-muted-foreground">{log.vehicle.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {log.from} <ArrowLeft className="h-3 w-3 rotate-180" /> {log.to}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.purpose || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {log.distance} km
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground text-xs font-mono">
                          {log.endKm}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vozový park
            </h2>
            <VehicleForm />
          </div>

          <div className="grid gap-4">
            {vehicles.length === 0 ? (
              <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground text-sm">
                Žádná evidovaná vozidla.
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.plate}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.name}</p>
                    </div>
                    <div className="bg-secondary p-2 rounded-full text-secondary-foreground">
                      <Car className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {vehicle.fuelType && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Fuel className="h-3 w-3" />
                      <span>{vehicle.fuelType}</span>
                    </div>
                  )}
                  
                  {/* Calculate total distance from logs if needed, but simplistic view for now */}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
