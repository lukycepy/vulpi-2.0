"use client";

import { useState } from "react";
import { Membership, RoleDefinition, User } from "@prisma/client";
import { updateUserRole, removeUserFromOrganization, inviteUserToOrganization } from "@/actions/users";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Search, LogIn, Loader2, Lock } from "lucide-react";
import { adminResetPassword, adminUpdateUserProfile } from "@/actions/admin-users";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";

interface UserManagerProps {
  memberships: (Membership & { user: User; roleDefinition: RoleDefinition | null })[];
  roles: RoleDefinition[];
  currentUserId: string;
  canImpersonate?: boolean;
}

export function UserManager({ memberships, roles, currentUserId, canImpersonate = false }: UserManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  // Invite state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Edit User State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      timezone: "",
      password: ""
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  const handleEditClick = (user: User) => {
      setEditingUser(user);
      setEditFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email,
          username: user.username || "",
          timezone: user.timezone || "",
          password: ""
      });
      setIsEditOpen(true);
  };

  const handleEditSave = async () => {
      if (!editingUser) return;
      
      const orgId = memberships[0]?.organizationId;
      if (!orgId) return;

      setIsSavingUser(true);
      try {
          await adminUpdateUserProfile(editingUser.id, orgId, editFormData);
          toast({ title: "Uloženo", description: "Profil uživatele byl aktualizován." });
          setIsEditOpen(false);
      } catch (error: any) {
          toast({ title: "Chyba", description: error.message, variant: "destructive" });
      } finally {
          setIsSavingUser(false);
      }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({ title: "Chyba", description: "Vyplňte email a roli.", variant: "destructive" });
      return;
    }

    const orgId = memberships[0]?.organizationId;
    if (!orgId) {
        toast({ title: "Chyba", description: "Organizace nenalezena.", variant: "destructive" });
        return;
    }

    setIsInviting(true);
    try {
      await inviteUserToOrganization(orgId, inviteEmail, inviteRole);
      toast({ title: "Pozvánka odeslána", description: "Uživatel byl přidán do organizace." });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteRole("");
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setIsInviting(false);
    }
  };

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

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Opravdu chcete vyresetovat heslo tomuto uživateli?")) return;

    const orgId = memberships[0]?.organizationId;
    if (!orgId) {
        toast({ title: "Chyba", description: "Organizace nenalezena.", variant: "destructive" });
        return;
    }
    
    try {
        const result = await adminResetPassword(userId, orgId);
        if (result.success) {
            alert(`Heslo bylo resetováno. Nové heslo: ${result.password}\n\n(V produkci by bylo odesláno na email)`);
        }
    } catch (error: any) {
        toast({ title: "Chyba", description: error.message, variant: "destructive" });
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
        <Button onClick={() => setIsInviteOpen(true)}>
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
              <TableHead className="text-right">Akce</TableHead>
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
                    <span className="text-xs text-muted-foreground">{membership.user.email}</span>
                    {membership.user.id === currentUserId && (
                        <Badge variant="outline" className="w-fit mt-1">Já</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    // Try to find roleDefId, if null, try to find a role definition that matches the legacy 'role' string
                    defaultValue={membership.roleDefId || roles.find(r => r.name === membership.role)?.id || undefined} 
                    onValueChange={(val: string) => handleRoleChange(membership.id, val)}
                    disabled={membership.user.id === currentUserId} // Prevent changing own role effectively locking self out
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={membership.role || "Vyberte roli"} />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditClick(membership.user)}
                        title="Upravit profil"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {canImpersonate && membership.user.id !== currentUserId && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleImpersonate(membership.user.id)}
                            title="Přihlásit se jako tento uživatel"
                        >
                            <LogIn className="h-4 w-4 text-blue-600" />
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleResetPassword(membership.user.id)} 
                        title="Resetovat heslo"
                    >
                        <Lock className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveUser(membership.id)}
                        disabled={membership.user.id === currentUserId}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pozvat nového uživatele</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="jan.novak@firma.cz"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={setInviteRole} value={inviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte roli" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)} disabled={isInviting}>
              Zrušit
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pozvat uživatele
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upravit uživatele</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-firstName">Jméno</Label>
                    <Input 
                        id="edit-firstName" 
                        value={editFormData.firstName} 
                        onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Příjmení</Label>
                    <Input 
                        id="edit-lastName" 
                        value={editFormData.lastName} 
                        onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                    id="edit-email" 
                    type="email"
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-username">Uživatelské jméno</Label>
                <Input 
                    id="edit-username" 
                    value={editFormData.username} 
                    onChange={(e) => setEditFormData({...editFormData, username: e.target.value})} 
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit-timezone">Časové pásmo</Label>
                <Input 
                    id="edit-timezone" 
                    value={editFormData.timezone} 
                    onChange={(e) => setEditFormData({...editFormData, timezone: e.target.value})} 
                />
            </div>
            <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="edit-password">Nové heslo (nevyplňujte, pokud nechcete měnit)</Label>
                <Input 
                    id="edit-password" 
                    type="password"
                    value={editFormData.password} 
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})} 
                    placeholder="Nové heslo"
                />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Zrušit</Button>
            <Button onClick={handleEditSave} disabled={isSavingUser}>
                {isSavingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
