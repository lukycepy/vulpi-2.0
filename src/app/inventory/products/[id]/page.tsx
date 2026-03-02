import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return <div>Not authenticated</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  if (!membership) return <div>No membership</div>;

  // Use Raw SQL to get product to be safe
  const products = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Product" WHERE "id" = ${params.id} AND "organizationId" = ${membership.organizationId}
  `;
  const product = products[0];

  if (!product) notFound();

  // Use Raw SQL to get movements with new fields
  const movements = await prisma.$queryRaw<any[]>`
    SELECT * FROM "StockMovement" 
    WHERE "productId" = ${params.id} 
    ORDER BY "date" DESC
  `;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/inventory" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Zpět na sklad
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <div className="text-muted-foreground flex gap-4 mt-2">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.ean && <span>EAN: {product.ean}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Aktuální stav</h3>
          <p className="text-3xl font-bold text-primary">{Number(product.stockQuantity)} <span className="text-lg text-muted-foreground font-normal">{product.unit}</span></p>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-sm font-medium text-muted-foreground mb-2">Prodejní cena</h3>
           <p className="text-3xl font-bold">{Number(product.sellPrice || product.price || 0).toLocaleString("cs-CZ")} <span className="text-lg text-muted-foreground font-normal">{product.currency || "CZK"}</span></p>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-sm">
           <h3 className="text-sm font-medium text-muted-foreground mb-2">Nákupní cena</h3>
           <p className="text-3xl font-bold">{Number(product.buyPrice || 0).toLocaleString("cs-CZ")} <span className="text-lg text-muted-foreground font-normal">{product.currency || "CZK"}</span></p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Historie pohybů</h2>
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Datum</th>
                <th className="p-4 font-medium text-muted-foreground">Typ</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Množství</th>
                <th className="p-4 font-medium text-muted-foreground">Sériové číslo</th>
                <th className="p-4 font-medium text-muted-foreground">Expirace</th>
                <th className="p-4 font-medium text-muted-foreground">Poznámka</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 whitespace-nowrap">{new Date(m.date).toLocaleString("cs-CZ")}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      m.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {m.type === 'IN' ? 'Příjem' : 'Výdej'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-medium ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'IN' ? '+' : '-'}{Number(m.quantity)}
                  </td>
                  <td className="p-4 font-mono text-xs">{m.serialNumber || "-"}</td>
                  <td className="p-4 whitespace-nowrap">
                    {m.expirationDate ? new Date(m.expirationDate).toLocaleDateString("cs-CZ") : "-"}
                  </td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate" title={m.note || ""}>{m.note || "-"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted-foreground">
                    Zatím nebyly zaznamenány žádné pohyby zboží.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
