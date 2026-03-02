"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import QRCode from "qrcode";
import { generateTwoFactorSecret, enableTwoFactor, disableTwoFactor } from "@/actions/security";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  token: z.string().min(6, "Kód musí mít 6 znaků").max(6, "Kód musí mít 6 znaků"),
});

interface TwoFactorSetupProps {
  isEnabled: boolean;
}

export function TwoFactorSetup({ isEnabled }: TwoFactorSetupProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const result = await generateTwoFactorSecret();
      const qrUrl = await QRCode.toDataURL(result.otpauth);
      setQrCodeUrl(qrUrl);
      setSecret(result.secret);
      setIsSettingUp(true);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Chyba",
        description: "Nepodařilo se vygenerovat QR kód.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      const result = await enableTwoFactor(values.token, secret);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Chyba",
          description: result.error,
        });
        return;
      }
      
      toast({
        title: "Úspěch",
        description: "Dvoufázové ověření bylo aktivováno.",
      });
      setIsSettingUp(false);
      // Ideally we would refresh the page or update state, but page refresh happens via server action revalidatePath
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Chyba",
        description: "Něco se pokazilo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm("Opravdu chcete vypnout dvoufázové ověření?")) return;
    
    setLoading(true);
    try {
      await disableTwoFactor();
      toast({
        title: "Vypnuto",
        description: "Dvoufázové ověření bylo deaktivováno.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Chyba",
        description: "Nepodařilo se vypnout 2FA.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Dvoufázové ověření je aktivní
          </CardTitle>
          <CardDescription>
            Váš účet je zabezpečen. Při přihlášení budete vyzváni k zadání kódu z aplikace Google Authenticator (nebo jiné).
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" onClick={handleDisable} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vypnout 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-yellow-500" />
          Dvoufázové ověření (2FA)
        </CardTitle>
        <CardDescription>
          Zvyšte bezpečnost svého účtu přidáním druhého kroku při přihlašování.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSettingUp ? (
          <p className="text-sm text-muted-foreground">
            Po aktivaci budete při každém přihlášení potřebovat kód z ověřovací aplikace ve vašem telefonu.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-white">
              {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}
              <p className="mt-4 text-xs text-center text-muted-foreground break-all max-w-xs">
                Secret: {secret}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token">Ověřovací kód</Label>
              <div className="flex gap-2">
                <Input 
                  id="token" 
                  placeholder="123456" 
                  maxLength={6}
                  {...form.register("token")} 
                />
                <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ověřit a zapnout
                </Button>
              </div>
              {form.formState.errors.token && (
                <p className="text-sm text-destructive">{form.formState.errors.token.message}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {!isSettingUp && (
        <CardFooter>
          <Button onClick={handleStartSetup} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Nastavit 2FA
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
