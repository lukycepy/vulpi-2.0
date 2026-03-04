"use client";

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download, Trash2, Edit, Send } from "lucide-react";
import { exportClientData } from "@/actions/gdpr";
import { deleteClient } from "@/actions/client";
import { sendPortalLink } from "@/actions/portal";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ClientActions({ clientId, isLegalHold }: { clientId: string, isLegalHold?: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Opravdu chcete smazat tohoto klienta?")) return;
    setLoading(true);
    try {
        await deleteClient(clientId);
        toast({
            title: "Klient smazán",
            description: "Klient byl úspěšně odstraněn.",
        });
        router.push("/clients");
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Chyba",
            description: error instanceof Error ? error.message : "Nepodařilo se smazat klienta.",
        });
    } finally {
        setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportClientData(clientId);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `client-${clientId}-gdpr.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export hotov",
        description: "Data klienta byla stažena.",
      });
    } catch (error) {
        console.error(error);
      toast({
        variant: "destructive",
        title: "Chyba",
        description: "Export se nezdařil.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPortalLink = async () => {
      setLoading(true);
      try {
          await sendPortalLink(clientId);
          toast({
              title: "Odesláno",
              description: "Přístupové údaje byly odeslány na email klienta.",
          });
      } catch (error) {
          toast({
              variant: "destructive",
              title: "Chyba",
              description: error instanceof Error ? error.message : "Nepodařilo se odeslat email.",
          });
      } finally {
          setLoading(false);
      }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
            <Link href={`/clients/${clientId}/edit`} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Upravit klienta
            </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleSendPortalLink} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            Poslat přístup do portálu
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleExport} disabled={loading}>
          <Download className="mr-2 h-4 w-4" />
          GDPR Export
        </DropdownMenuItem>
        
        {!isLegalHold && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} disabled={loading} className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Smazat klienta
                </DropdownMenuItem>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
