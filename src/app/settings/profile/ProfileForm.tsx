
"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/profile";
import { uploadAvatar } from "@/actions/upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Chrome, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    username: user.username || "",
    avatarUrl: user.avatarUrl || "",
    password: "",
    confirmPassword: "",
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      
      const result = await uploadAvatar(data);
      if (result.success) {
        setFormData(prev => ({ ...prev, avatarUrl: result.url }));
        toast({ title: "Nahráno", description: "Profilová fotka byla aktualizována." });
        router.refresh();
      }
    } catch (error: any) {
      toast({ title: "Chyba nahrávání", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
        toast({ title: "Chyba", description: "Hesla se neshodují", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
      await updateProfile(formData);
      toast({ title: "Uloženo", description: "Profil byl aktualizován." });
      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      router.refresh();
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = () => {
      window.location.href = "/api/auth/google";
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {/* Avatar Section */}
      <div className="bg-card p-6 rounded-lg border space-y-6">
        <h3 className="text-lg font-medium">Profilový obrázek</h3>
        <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatarUrl} />
              <AvatarFallback className="text-2xl">{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 w-full space-y-4">
              
              <div 
                className="border-2 border-dashed border-input hover:border-primary rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                )}
                <p className="text-sm font-medium">Klikněte pro nahrání nebo přetáhněte obrázek sem</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF do 5MB</p>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase bg-muted px-2 py-1 rounded">NEBO</span>
                <div className="flex-1 flex gap-2">
                    <Input 
                    id="avatarUrl" 
                    value={formData.avatarUrl} 
                    onChange={handleChange} 
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1"
                    />
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="bg-card p-6 rounded-lg border space-y-6">
        <h3 className="text-lg font-medium">Osobní údaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Jméno</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Příjmení</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="flex gap-2">
            <Input 
              id="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Uživatelské jméno (Login)</Label>
          <div className="flex gap-2">
            <Input 
              id="username" 
              value={formData.username} 
              onChange={handleChange} 
              placeholder="Volitelné přihlašovací jméno"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Slouží jako alternativa k emailu pro přihlášení. Musí být unikátní.
          </p>
        </div>

        <div className="space-y-2">
            <Label htmlFor="timezone">Časové pásmo</Label>
            <Input id="timezone" value={formData.timezone} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">Detekováno automaticky z vašeho prohlížeče.</p>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-card p-6 rounded-lg border space-y-6">
        <h3 className="text-lg font-medium">Změna hesla</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="password">Nové heslo</Label>
                <Input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="Nechte prázdné pro zachování" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrzení hesla</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Zadejte znovu" />
            </div>
        </div>
      </div>

      {/* Connections Section */}
      <div className="bg-card p-6 rounded-lg border space-y-6">
        <h3 className="text-lg font-medium">Propojené účty</h3>
        <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border">
                    <Chrome className="h-6 w-6 text-red-500" />
                </div>
                <div>
                    <p className="font-medium">Google</p>
                    <p className="text-sm text-muted-foreground">Použít Google pro přihlášení</p>
                </div>
            </div>
            <Button type="button" variant="outline" onClick={handleGoogleConnect}>
                Propojit účet
            </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Uložit změny
        </Button>
      </div>
    </form>
  );
}
