"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Filter, Search, MoreHorizontal, FileText, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type ClientWithStats = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  vatId: string | null;
  tags: { id: string; name: string; color: string }[];
  contacts: { id: string; name: string; email: string | null; phone: string | null }[];
  stats: {
    totalTurnover: number;
    unpaidCount: number;
    unpaidAmount: number;
    paymentMorale: number;
  };
};

type ClientListProps = {
  clients: ClientWithStats[];
  availableTags: { id: string; name: string; color: string }[];
};

export default function ClientList({ clients, availableTags }: ClientListProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) ||
                          client.email?.toLowerCase().includes(search.toLowerCase()) ||
                          client.taxId?.includes(search) ||
                          client.vatId?.includes(search);
    
    const matchesTags = selectedTags.size === 0 || 
                        client.tags.some(tag => selectedTags.has(tag.id));
                        
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tagId: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagId)) {
      newTags.delete(tagId);
    } else {
      newTags.add(tagId);
    }
    setSelectedTags(newTags);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat klienta..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filtrovat
              </span>
              {selectedTags.size > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
                  {selectedTags.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Filtrovat podle štítků</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={selectedTags.has(tag.id)}
                onCheckedChange={() => toggleTag(tag.id)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: tag.color }} 
                  />
                  {tag.name}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            {availableTags.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">Žádné štítky k dispozici</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead>Štítky</TableHead>
              <TableHead className="text-right">Obrat</TableHead>
              <TableHead className="text-center">Neuhrazeno</TableHead>
              <TableHead className="text-center">Morálka</TableHead>
              <TableHead className="text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Žádní klienti nenalezeni.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">
                        <Link href={`/clients/${client.id}`} className="hover:underline">
                            {client.name}
                        </Link>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.email || client.phone || client.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">{formatCurrency(client.stats.totalTurnover)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {client.stats.unpaidCount > 0 ? (
                      <div className="flex flex-col items-center text-destructive">
                        <span className="font-bold">{client.stats.unpaidCount}</span>
                        <span className="text-xs">{formatCurrency(client.stats.unpaidAmount)}</span>
                      </div>
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {client.stats.paymentMorale >= 90 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : client.stats.paymentMorale >= 70 ? (
                         <AlertCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                         <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${
                        client.stats.paymentMorale >= 90 ? "text-green-600" : 
                        client.stats.paymentMorale >= 70 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {Math.round(client.stats.paymentMorale)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/clients/${client.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Detail</span>
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
