
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { saveImapIntegration } from "@/actions/banking";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

interface BankIntegrationFormProps {
  organizationId: string;
  existingIntegration?: boolean;
}

export function BankIntegrationForm({ organizationId, existingIntegration = false }: BankIntegrationFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    server: "imap.seznam.cz",
    port: 993,
    email: "",
    password: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await saveImapIntegration({
        ...formData,
        port: Number(formData.port),
        organizationId
      });

      // Handle potential returned error from action
      if (typeof result === 'object' && 'error' in result && result.error) {
          throw new Error(result.error);
      }

      toast({
        title: "Banka úspěšně napojena",
        description: "Nastavení IMAP bylo uloženo.",
        variant: "default",
      });
      
      // Clear sensitive data
      setFormData(prev => ({ ...prev, password: "" }));
      
    } catch (error: any) {
      toast({
        title: "Chyba při ukládání",
        description: error.message || "Nepodařilo se uložit nastavení.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Bankovní integrace (IMAP)
        </CardTitle>
        <CardDescription>
          Připojte svou banku čtením e-mailových notifikací. Vulpi bude automaticky stahovat pohyby a párovat je s fakturami.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="server">IMAP Server</Label>
              <Input 
                id="server" 
                name="server" 
                value={formData.server} 
                onChange={handleChange} 
                placeholder="imap.seznam.cz" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                name="port" 
                type="number" 
                value={formData.port} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mailová adresa</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="faktury@mojefirma.cz" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Heslo k e-mailu</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="********" 
              required 
            />
            <p className="text-xs text-muted-foreground">
              Heslo je uloženo v šifrované podobě. Doporučujeme použít aplikační heslo (pokud to váš poskytovatel podporuje).
            </p>
          </div>

          {existingIntegration && (
             <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded border border-green-100">
                <CheckCircle2 className="h-4 w-4" />
                Integrace je aktivní
             </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Uložit nastavení
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
