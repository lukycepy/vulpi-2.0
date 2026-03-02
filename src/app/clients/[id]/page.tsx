import { getClient } from "@/actions/client";
import { getContracts } from "@/actions/contracts";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, XCircle, Mail, Phone, MapPin, Building, Edit, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { ClientActions } from "@/components/clients/ClientActions";
import { ClientContracts } from "@/components/clients/ClientContracts";

export default async function ClientDetailPage({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const [client, contracts] = await Promise.all([
    getClient(params.id),
    getContracts(params.id)
  ]);
  
  if (!client) {
    notFound();
  }

  const { stats } = client;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/clients">
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                {client.name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-1 text-sm">
                {client.taxId && <div className="flex items-center gap-1"><Building className="w-3 h-3"/> IČ: {client.taxId}</div>}
                {client.vatId && <div className="flex items-center gap-1"><Building className="w-3 h-3"/> DIČ: {client.vatId}</div>}
            </div>
        </div>
        <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Upravit
        </Button>
        <ClientActions clientId={client.id} isLegalHold={client.organization?.isLegalHold} />
      </div>

      <div className="flex flex-wrap gap-2">
        {client.tags.map(tag => (
            <Badge 
                key={tag.id} 
                variant="secondary"
                style={{ 
                    backgroundColor: tag.color + '20', 
                    color: tag.color, 
                    borderColor: tag.color + '40' 
                }}
            >
                {tag.name}
            </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platební morálka</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
                {stats.paymentMorale >= 90 ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : stats.paymentMorale >= 70 ? (
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                ) : (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                )}
                <div>
                    <div className={`text-2xl font-bold ${
                        stats.paymentMorale >= 90 ? "text-green-600" : 
                        stats.paymentMorale >= 70 ? "text-yellow-600" : "text-red-600"
                    }`}>
                        {Math.round(stats.paymentMorale)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.paymentMorale >= 90 ? "Vzorný plátce" : 
                         stats.paymentMorale >= 70 ? "Občasné zpoždění" : "Problematický plátce"}
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Celkový utracený objem (LTV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalTurnover)}</div>
            <p className="text-xs text-muted-foreground">za celou historii (uhrazené)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Neuhrazené faktury</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-destructive">{stats.unpaidCount}</div>
             <p className="text-xs text-muted-foreground">v celkové výši {formatCurrency(stats.unpaidAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={searchParams.tab || "details"} className="w-full">
        <TabsList>
            <TabsTrigger value="details">Detailní informace</TabsTrigger>
            <TabsTrigger value="contacts">Kontaktní osoby ({client.contacts.length})</TabsTrigger>
            <TabsTrigger value="contracts">Smlouvy a NDA</TabsTrigger>
            <TabsTrigger value="invoices">Faktury</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Adresy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Sídlo / Fakturační adresa</div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="whitespace-pre-wrap">{client.address || "-"}</div>
                            </div>
                        </div>
                        {client.mailingAddress && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Korespondenční adresa</div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                        {client.mailingAddress}<br/>
                                        {client.mailingZip} {client.mailingCity}<br/>
                                        {client.mailingCountry}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Kontakt</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${client.email}`} className="hover:underline text-primary">{client.email || "-"}</a>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Telefon</div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${client.phone}`} className="hover:underline text-primary">{client.phone || "-"}</a>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Poznámky</div>
                            <div className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-md">
                                {client.notes || "Žádné poznámky"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="contacts" className="pt-4">
            <Card>
                <CardContent className="p-0">
                  {client.contacts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                          Žádné kontaktní osoby.
                      </div>
                  ) : (
                      <div className="divide-y">
                          {client.contacts.map(contact => (
                              <div key={contact.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-muted/50 transition-colors">
                                  <div className="mb-2 sm:mb-0">
                                      <div className="font-medium flex items-center gap-2">
                                        {contact.name}
                                        {contact.isPrimary && <Badge variant="secondary" className="text-xs">Hlavní kontakt</Badge>}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{contact.position}</div>
                                  </div>
                                  <div className="text-right text-sm space-y-1 w-full sm:w-auto">
                                      {contact.email && (
                                          <div className="flex items-center sm:justify-end gap-2">
                                              <Mail className="h-3 w-3 text-muted-foreground" />
                                              <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                                          </div>
                                      )}
                                      {contact.phone && (
                                          <div className="flex items-center sm:justify-end gap-2">
                                              <Phone className="h-3 w-3 text-muted-foreground" />
                                              <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="contracts" className="pt-4">
            <ClientContracts clientId={client.id} contracts={contracts} isLegalHold={client.organization?.isLegalHold} />
        </TabsContent>

        <TabsContent value="invoices" className="pt-4">
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Seznam faktur bude implementován v další fázi.
                    {/* Placeholder for invoice list */}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
