"use client";

import { useState } from "react";
import { createClient, validateVatNumber } from "@/actions/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash, Check, X, Search, Loader2 } from "lucide-react";

interface NewClientFormProps {
  availableTags?: { id: string; name: string; color: string }[];
}

export default function NewClientForm({ availableTags = [] }: NewClientFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viesStatus, setViesStatus] = useState<{ valid: boolean; message: string; name?: string; address?: string } | null>(null);
  const [checkingVies, setCheckingVies] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    taxId: "",
    vatId: "",
    address: "",
    mailingAddress: "",
    mailingCity: "",
    mailingZip: "",
    mailingCountry: "CZ",
    email: "",
    phone: "",
    notes: "",
    language: "cs",
  });

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<{ name: string; email: string; phone: string; position: string; isPrimary: boolean }[]>([]);

  const handleViesCheck = async () => {
    if (!formData.vatId) return;
    setCheckingVies(true);
    setViesStatus(null);
    try {
      const result = await validateVatNumber(formData.vatId);
      setViesStatus(result);
      if (result.valid) {
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
          address: result.address || prev.address
        }));
      }
    } catch (e) {
      console.error(e);
      setViesStatus({ valid: false, message: "Chyba při ověřování" });
    } finally {
      setCheckingVies(false);
    }
  };

  const addContact = () => {
    setContacts([...contacts, { name: "", email: "", phone: "", position: "", isPrimary: false }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: string, value: any) => {
    const newContacts = [...contacts];
    // @ts-ignore
    newContacts[index][field] = value;
    if (field === 'isPrimary' && value === true) {
       // Unset others
       newContacts.forEach((c, i) => {
         if (i !== index) c.isPrimary = false;
       });
    }
    setContacts(newContacts);
  };

  const toggleTag = (tagId: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagId)) newTags.delete(tagId);
    else newTags.add(tagId);
    setSelectedTags(newTags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (formData.mailingCountry === "US" && !/^\d{5}(-\d{4})?$/.test(formData.mailingZip)) {
      alert("Neplatný formát PSČ pro USA (12345 nebo 12345-6789).");
      setLoading(false);
      return;
    }

    try {
      await createClient({
        ...formData,
        tagIds: Array.from(selectedTags),
        contacts: contacts.map(c => ({
            name: c.name,
            email: c.email || undefined,
            phone: c.phone || undefined,
            position: c.position || undefined,
            isPrimary: c.isPrimary
        }))
      });
      setOpen(false);
      // Reset form
      setFormData({
        name: "", taxId: "", vatId: "", address: "", 
        mailingAddress: "", mailingCity: "", mailingZip: "", mailingCountry: "",
        email: "", phone: "", notes: "", language: "cs"
      });
      setSelectedTags(new Set());
      setContacts([]);
      setViesStatus(null);
    } catch (err) {
      console.error(err);
      alert("Chyba při ukládání klienta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nový klient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vytvořit nového klienta</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Základní údaje</TabsTrigger>
              <TabsTrigger value="address">Adresy</TabsTrigger>
              <TabsTrigger value="contacts">Kontakty</TabsTrigger>
              <TabsTrigger value="tags">Štítky</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 pt-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>IČO</Label>
                    <div className="flex gap-2">
                        <Input 
                            value={formData.taxId} 
                            onChange={e => setFormData({...formData, taxId: e.target.value})}
                            placeholder="12345678"
                        />
                        {/* ARES placeholder */}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>DIČ</Label>
                    <div className="flex gap-2">
                        <Input 
                            value={formData.vatId} 
                            onChange={e => setFormData({...formData, vatId: e.target.value})}
                            placeholder="CZ12345678"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleViesCheck} disabled={checkingVies}>
                            {checkingVies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </div>
                    {viesStatus && (
                        <div className={`text-xs flex items-center gap-1 ${viesStatus.valid ? 'text-green-600' : 'text-red-600'}`}>
                            {viesStatus.valid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {viesStatus.message}
                        </div>
                    )}
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label>Název firmy *</Label>
                 <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label>Výchozí jazyk dokladů</Label>
                 <select 
                    value={formData.language} 
                    onChange={e => setFormData({...formData, language: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                 >
                    <option value="cs">Čeština</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="sk">Slovenčina</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <Label>Poznámky</Label>
                 <Textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                 />
               </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Fakturační adresa</Label>
                    <Textarea 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        placeholder="Ulice, Město, PSČ"
                    />
                </div>
                
                <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Korespondenční adresa (pokud se liší)</h4>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Ulice a číslo</Label>
                            <Input 
                                value={formData.mailingAddress} 
                                onChange={e => setFormData({...formData, mailingAddress: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Město</Label>
                                <Input 
                                    value={formData.mailingCity} 
                                    onChange={e => setFormData({...formData, mailingCity: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>PSČ / ZIP</Label>
                                <Input 
                                    value={formData.mailingZip} 
                                    onChange={e => {
                                        // Basic validation logic for international ZIP
                                        const val = e.target.value;
                                        // Allow alphanumeric for UK/Canada, but warn if too long
                                        setFormData({...formData, mailingZip: val});
                                    }}
                                    placeholder={formData.mailingCountry === "US" ? "12345" : (formData.mailingCountry === "UK" ? "SW1A 1AA" : "110 00")}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Země</Label>
                                <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={formData.mailingCountry} 
                                    onChange={e => setFormData({...formData, mailingCountry: e.target.value})}
                                >
                                    <option value="CZ">Česká republika</option>
                                    <option value="SK">Slovensko</option>
                                    <option value="US">Spojené státy (USA)</option>
                                    <option value="UK">Velká Británie (UK)</option>
                                    <option value="DE">Německo</option>
                                    <option value="PL">Polsko</option>
                                    <option value="AT">Rakousko</option>
                                    <option value="FR">Francie</option>
                                    <option value="Other">Jiná</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 pt-4">
                {contacts.map((contact, index) => (
                    <div key={index} className="flex gap-4 items-start border p-4 rounded-md relative">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-destructive hover:text-destructive"
                            onClick={() => removeContact(index)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                        
                        <div className="grid gap-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Jméno</Label>
                                    <Input 
                                        value={contact.name} 
                                        onChange={e => updateContact(index, 'name', e.target.value)}
                                        placeholder="Jan Novák"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pozice</Label>
                                    <Input 
                                        value={contact.position} 
                                        onChange={e => updateContact(index, 'position', e.target.value)}
                                        placeholder="Jednatel"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input 
                                        value={contact.email} 
                                        onChange={e => updateContact(index, 'email', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefon</Label>
                                    <Input 
                                        value={contact.phone} 
                                        onChange={e => updateContact(index, 'phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="checkbox" 
                                    id={`primary-${index}`}
                                    checked={contact.isPrimary}
                                    onChange={e => updateContact(index, 'isPrimary', e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor={`primary-${index}`}>Hlavní kontakt</Label>
                            </div>
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={addContact} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Přidat kontaktní osobu
                </Button>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4 pt-4">
                <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                        <div 
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`
                                cursor-pointer px-3 py-1 rounded-full border text-sm flex items-center gap-2 select-none transition-colors
                                ${selectedTags.has(tag.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}
                            `}
                        >
                            <div className="w-2 h-2 rounded-full bg-current" style={{ color: selectedTags.has(tag.id) ? 'currentColor' : tag.color }} />
                            {tag.name}
                            {selectedTags.has(tag.id) && <Check className="w-3 h-3 ml-1" />}
                        </div>
                    ))}
                </div>
                {availableTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">Žádné štítky nejsou definovány.</p>
                )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
            <Button type="submit" disabled={loading}>
                {loading ? "Ukládám..." : "Vytvořit klienta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
