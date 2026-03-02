
"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAvatar } from "@/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [loading, setLoading] = useState(false);

  // In a real app, this would be a file upload to S3/Blob storage
  // For this demo, we'll just input a URL or use a placeholder service
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAvatar(avatarUrl);
      // Success toast
    } catch (error) {
      console.error(error);
      // Error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 bg-card p-6 rounded-lg border">
      
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-2xl">{user.firstName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <Label htmlFor="avatar">URL Profilového obrázku</Label>
          <div className="flex gap-2">
            <Input 
              id="avatar" 
              value={avatarUrl} 
              onChange={(e) => setAvatarUrl(e.target.value)} 
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Zadejte veřejnou URL obrázku (např. z Gravatar nebo LinkedIn).
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jméno</Label>
            <Input value={user.firstName || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Příjmení</Label>
            <Input value={user.lastName || ""} disabled />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>

        <div className="space-y-2">
            <Label>Časové pásmo</Label>
            {/* @ts-ignore - Prisma types might be out of sync */}
            <Input value={user.timezone || "Nedetekováno"} disabled />
            <p className="text-xs text-muted-foreground">Detekováno automaticky z vašeho prohlížeče.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Uložit změny
        </Button>
      </div>
    </form>
  );
}
