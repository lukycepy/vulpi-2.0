
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);
      
      if (result.error) {
        toast({
          title: "Chyba",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Odesláno",
          description: "Pokud účet existuje, obdržíte email s novým heslem.",
        });
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nastala neočekávaná chyba.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Zapomenuté heslo
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Zadejte svůj email a my vám vygenerujeme nové heslo.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg flex flex-col items-center gap-2">
              <Mail className="h-8 w-8 text-green-600" />
              <p>Zkontrolujte svou emailovou schránku.</p>
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Zpět na přihlášení
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Emailová adresa</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.novak@firma.cz"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Odeslat nové heslo
            </Button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Zpět na přihlášení
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
