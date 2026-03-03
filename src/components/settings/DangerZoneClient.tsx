
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadDatabaseBackup, purgeTestData } from "@/actions/admin";
import { Loader2, Download, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DangerZoneClientProps {
    organizationId: string;
}

export function DangerZoneClient({ organizationId }: DangerZoneClientProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!confirm("Stahujete citlivá data (celou databázi). Ujistěte se, že soubor uložíte na bezpečné místo. Pokračovat?")) {
        return;
    }

    setLoading(true);
    try {
      const base64Data = await downloadDatabaseBackup();
      
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/x-sqlite3" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-vulpi-${new Date().toISOString().split('T')[0]}.sqlite`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePurge = async () => {
      setLoading(true);
      try {
          await purgeTestData(organizationId);
          toast({ 
              title: "Data smazána", 
              description: "Všechna testovací data byla úspěšně odstraněna.",
              variant: "default"
          });
      } catch (error: any) {
          toast({ title: "Chyba", description: error.message, variant: "destructive" });
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Pokročilé administrátorské operace. Buďte opatrní.
        </p>
      </div>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Záloha databáze
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Stáhne kompletní kopii databáze (SQLite).
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button 
                variant="destructive" 
                onClick={handleDownload} 
                disabled={loading}
                className="gap-2"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Stáhnout zálohu databáze
            </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Smazat testovací data
          </CardTitle>
          <CardDescription className="text-red-600/80">
            Nenávratně smaže faktury, výdaje, bankovní pohyby a časové záznamy.
            Klienti a produkty zůstanou zachováni.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button 
                        variant="destructive" 
                        disabled={loading}
                        className="gap-2 w-full sm:w-auto"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Smazat všechna testovací data
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Opravdu smazat data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tuto akci <strong>nelze vzít zpět</strong>.
                            Trvale odstraníte všechny faktury, položky, výdaje, bankovní pohyby a záznamy práce pro tuto organizaci.
                            <br /><br />
                            Používejte pouze pokud chcete začít "načisto" po testování.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Zrušit</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePurge} className="bg-red-600 hover:bg-red-700">
                            Ano, smazat vše
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
