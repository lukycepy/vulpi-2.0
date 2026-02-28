import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/inventory/ProductForm";
import StockMovementForm from "@/components/inventory/StockMovementForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { AlertTriangle, Archive, ArrowDown, ArrowUp, Car, Package } from "lucide-react";
import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export const metadata = {
  title: "Sklad | Vulpi",
  description: "Skladové hospodářství a evidence majetku",
};

export default async function InventoryPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: currentUser.id },
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
  const canViewMargins = await hasPermission(currentUser.id, orgId, "view_margins");

  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  const recentMovements = await prisma.stockMovement.findMany({
    where: { product: { organizationId: orgId } },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);

  // Sanitize products for client component to prevent data leak (buyPrice)
  const safeProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    stockQuantity: p.stockQuantity,
    unit: p.unit
  }));

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skladové hospodářství</h1>
          <p className="text-muted-foreground mt-2">
            Evidence zboží, pohyby na skladě a sledování zásob.
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            href="/inventory/vehicles" 
            className="flex items-center gap-2 bg-outline border px-4 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <Car className="h-4 w-4" />
            Kilometrovník
          </Link>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Upozornění na nízký stav zásob</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Následující produkty jsou pod minimálním limitem:{" "}
              {lowStockProducts.map(p => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Skladové karty
            </h2>
            <ProductForm canViewMargins={canViewMargins} />
          </div>

          <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Produkt</th>
                    <th className="px-4 py-3">SKU / EAN</th>
                    <th className="px-4 py-3 text-right">Cena (bez DPH)</th>
                    {canViewMargins && <th className="px-4 py-3 text-right">Marže</th>}
                    <th className="px-4 py-3 text-right">Skladem</th>
                    <th className="px-4 py-3">Stav</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Zatím nemáte žádné produkty.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const margin = product.buyPrice > 0 
                        ? ((product.sellPrice - product.buyPrice) / product.buyPrice) * 100 
                        : 0;
                        
                      return (
                        <tr key={product.id} className="hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                            {product.sku || product.ean || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(product.sellPrice)}
                          </td>
                          {canViewMargins && (
                            <td className="px-4 py-3 text-right text-xs">
                              <span className={margin > 0 ? "text-green-600" : "text-muted-foreground"}>
                                {margin.toFixed(0)}%
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right font-medium">
                            {product.stockQuantity} {product.unit}
                          </td>
                          <td className="px-4 py-3">
                            {product.stockQuantity <= product.minStockLevel ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Nízký stav
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Pohyby
            </h2>
            <StockMovementForm products={safeProducts} />
          </div>

          <div className="bg-card border rounded-lg shadow-sm divide-y">
            {recentMovements.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Žádné pohyby.
              </div>
            ) : (
              recentMovements.map((movement) => (
                <div key={movement.id} className="p-4 flex items-start gap-3 hover:bg-muted/5 transition-colors">
                  <div className={`mt-1 p-1.5 rounded-full ${
                    movement.type === "IN" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {movement.type === "IN" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{movement.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(movement.createdAt)} • {movement.note || "Bez poznámky"}
                    </p>
                  </div>
                  <div className={`font-mono font-medium text-sm ${
                    movement.type === "IN" ? "text-green-600" : "text-red-600"
                  }`}>
                    {movement.type === "IN" ? "+" : "-"}{movement.quantity} {movement.product.unit}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
