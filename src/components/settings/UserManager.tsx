"use client";

import { useState } from "react";
import { Membership, RoleDefinition, User } from "@prisma/client";
import { updateUserRole, removeUserFromOrganization } from "@/actions/users";
import { impersonateUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserManagerProps {
  memberships: (Membership & { user: User; roleDefinition: RoleDefinition | null })[];
  roles: RoleDefinition[];
  currentUserId: string;
  canImpersonate?: boolean;
}

export function UserManager({ memberships, roles, currentUserId, canImpersonate = false }: UserManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleImpersonate = async (userId: string) => {
    if (!confirm("Opravdu se chcete přihlásit jako tento uživatel?")) return;
    try {
      await impersonateUser(userId);
      toast({ title: "Přihlášení úspěšné", description: "Nyní vystupujete jako vybraný uživatel." });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message || "Nepodařilo se přihlásit.", variant: "destructive" });
    }
  };

  const handleRoleChange = async (membershipId: string, roleDefId: string) => {
    try {
      await updateUserRole(membershipId, roleDefId);
      toast({ title: "Role změněna", description: "Uživatelská role byla aktualizována." });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se změnit roli.", variant: "destructive" });
    }
  };

  const handleRemoveUser = async (membershipId: string) => {
    if (!confirm("Opravdu chcete odebrat tohoto uživatele z organizace?")) return;
    try {
      await removeUserFromOrganization(membershipId);
      toast({ title: "Uživatel odebrán", description: "Uživatel byl úspěšně odebrán z organizace." });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se odebrat uživatele.", variant: "destructive" });
    }
  };

  const filteredMemberships = memberships.filter(m => 
    m.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.user.firstName && m.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.user.lastName && m.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Správa uživatelů</h2>
          <p className="text-muted-foreground">Přehled a správa členů týmu.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Pozvat uživatele
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Hledat podle jména nebo emailu..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Uživatel</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMemberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {membership.user.firstName} {membership.user.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">{membership.user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    defaultValue={membership.roleDefId || undefined} 
                    onValueChange={(val) => handleRoleChange(membership.id, val)}
                    disabled={membership.userId === currentUserId} // Prevent changing own role (basic safety)
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Vyberte roli" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{role.name}</span>
                            {role.isSystem && <Badge variant="secondary" className="text-[10px] h-4 px-1">System</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {canImpersonate && membership.userId !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleImpersonate(membership.userId)}
                      title="Přihlásit se jako uživatel"
                    >
                      <LogIn className="h-4 w-4" />
                    </Button>
                  )}
                  {membership.userId !== currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveUser(membership.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Odebrat uživatele"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredMemberships.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Žádní uživatelé nenalezeni.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
