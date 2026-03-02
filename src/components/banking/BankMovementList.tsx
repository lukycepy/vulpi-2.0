"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { confirmMatch, ignoreMovement, unmatchMovement } from "@/actions/banking";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, Search, AlertCircle, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface BankMovementListProps {
  initialMovements: any[];
}

export function BankMovementList({ initialMovements }: BankMovementListProps) {
  const [filter, setFilter] = useState("ALL"); // ALL, UNMATCHED, PROPOSED, MATCHED, IGNORED
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredMovements = initialMovements.filter((m) => {
    if (filter === "ALL") return true;
    if (filter === "PROPOSED") return m.status === "PROPOSED" || m.status === "PROPOSED_MULTI";
    return m.status === filter;
  });

  const { displayedItems, observerTarget } = useInfiniteScroll(filteredMovements);

  const handleConfirm = async (movementId: string, invoiceId: string) => {
    setLoadingId(movementId);
    try {
      await confirmMatch(movementId, invoiceId);
      router.refresh();
    } catch (error) {
      console.error("Failed to confirm match", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleIgnore = async (movementId: string) => {
    setLoadingId(movementId);
    try {
      await ignoreMovement(movementId);
      router.refresh();
    } catch (error) {
      console.error("Failed to ignore movement", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnmatch = async (movementId: string) => {
    setLoadingId(movementId);
    try {
      await unmatchMovement(movementId);
      router.refresh();
    } catch (error) {
      console.error("Failed to unmatch movement", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          size="sm"
        >
          Vše
        </Button>
        <Button
          variant={filter === "UNMATCHED" ? "default" : "outline"}
          onClick={() => setFilter("UNMATCHED")}
          size="sm"
        >
          Nespárované
        </Button>
        <Button
          variant={filter === "PROPOSED" ? "default" : "outline"}
          onClick={() => setFilter("PROPOSED")}
          size="sm"
          className={filter === "PROPOSED" ? "bg-orange-600 hover:bg-orange-700" : "text-orange-600 border-orange-200 hover:bg-orange-50"}
        >
          K potvrzení
        </Button>
        <Button
          variant={filter === "MATCHED" ? "default" : "outline"}
          onClick={() => setFilter("MATCHED")}
          size="sm"
          className={filter === "MATCHED" ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-200 hover:bg-green-50"}
        >
          Spárované
        </Button>
        <Button
          variant={filter === "IGNORED" ? "default" : "outline"}
          onClick={() => setFilter("IGNORED")}
          size="sm"
          className="ml-auto"
        >
          Ignorované
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Datum</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Protiúčet</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Popis</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Částka</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stav</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-24 text-center align-middle text-muted-foreground">
                  Žádné pohyby k zobrazení
                </td>
              </tr>
            ) : (
              <>
              {displayedItems.map((movement) => (
                <tr key={movement.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">
                    {formatDate(movement.date)}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">{movement.accountName || "Neznámý účet"}</span>
                      <span className="text-xs text-muted-foreground">{movement.accountInfo}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="truncate" title={movement.message || ""}>{movement.message || "-"}</span>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {movement.variableSymbol && <span>VS: {movement.variableSymbol}</span>}
                        {movement.specificSymbol && <span>SS: {movement.specificSymbol}</span>}
                      </div>
                    </div>
                  </td>
                  <td className={`p-4 align-middle text-right font-bold ${movement.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(movement.amount, movement.currency)}
                  </td>
                  <td className="p-4 align-middle">
                    {movement.status === "MATCHED" && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                        <Check className="h-3 w-3" />
                        <span className="text-xs font-medium">Spárováno</span>
                        {movement.invoice && (
                            <Link href={`/invoices/${movement.invoice.id}`} className="hover:underline flex items-center gap-1 ml-1 text-xs">
                                {movement.invoice.number}
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        )}
                      </div>
                    )}
                    {movement.status === "UNMATCHED" && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        Nespárováno
                      </span>
                    )}
                    {movement.status === "PROPOSED" && (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Navrženo
                        </span>
                        {movement.invoice && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                K faktuře: 
                                <Link href={`/invoices/${movement.invoice.id}`} className="font-medium hover:underline">
                                    {movement.invoice.number}
                                </Link>
                                ({formatCurrency(movement.invoice.totalAmount, movement.invoice.currency)})
                            </div>
                        )}
                      </div>
                    )}
                     {movement.status === "PROPOSED_MULTI" && (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Více kandidátů
                        </span>
                        {movement.candidates && movement.candidates.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {movement.candidates.length} kandidátů
                            </div>
                        )}
                      </div>
                    )}
                    {movement.status === "IGNORED" && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 opacity-50">
                        Ignorováno
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                        {movement.status === "PROPOSED" && movement.invoice && (
                            <Button 
                                size="sm" 
                                variant="default" 
                                className="h-8 bg-green-600 hover:bg-green-700"
                                onClick={() => handleConfirm(movement.id, movement.invoice.id)}
                                disabled={loadingId === movement.id}
                            >
                                {loadingId === movement.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                Potvrdit
                            </Button>
                        )}
                         {movement.status === "PROPOSED_MULTI" && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="h-8">
                                        <Search className="h-3 w-3 mr-1" />
                                        Vybrat
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Možné faktury</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {movement.candidates?.map((cand: any) => (
                                        <DropdownMenuItem key={cand.id} onClick={() => handleConfirm(movement.id, cand.id)}>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{cand.number}</span>
                                                <span className="text-xs text-muted-foreground">{formatCurrency(cand.totalAmount, cand.currency)} - {cand.clientName}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                             </DropdownMenu>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {movement.status === "MATCHED" && (
                                     <DropdownMenuItem onClick={() => handleUnmatch(movement.id)} className="text-red-600">
                                        <X className="mr-2 h-4 w-4" />
                                        Zrušit spárování
                                     </DropdownMenuItem>
                                )}
                                {(movement.status === "UNMATCHED" || movement.status === "PROPOSED" || movement.status === "PROPOSED_MULTI") && (
                                    <>
                                        <DropdownMenuItem>
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            Ručně spárovat
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleIgnore(movement.id)}>
                                            <X className="mr-2 h-4 w-4" />
                                            Ignorovat pohyb
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {movement.status === "IGNORED" && (
                                    <DropdownMenuItem onClick={() => handleUnmatch(movement.id)}>
                                        <Check className="mr-2 h-4 w-4" />
                                        Obnovit
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
               {/* Loading sentinel */}
               {displayedItems.length < filteredMovements.length && (
                 <tr ref={observerTarget}>
                   <td colSpan={6} className="h-24 text-center align-middle text-muted-foreground">
                     <div className="flex justify-center items-center">
                       <Loader2 className="w-6 h-6 animate-spin mr-2" />
                       Načítám další pohyby...
                     </div>
                   </td>
                 </tr>
               )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
