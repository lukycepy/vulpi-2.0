import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { CheckCircle, XCircle, Database, Server, Activity } from "lucide-react";

export default async function HealthPage() {
  const user = await getCurrentUser();
  if (!user) return <div>Please log in.</div>;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
  });
  
  if (!membership) {
    return <div>Nejste členem žádné organizace.</div>;
  }

  const org = await prisma.organization.findUnique({
    where: { id: membership.organizationId },
  });
  
  if (!org) {
    return <div>Organizace nenalezena.</div>;
  }

  const canManageSettings = await hasPermission(user.id, org.id, "manage_settings");

  if (!canManageSettings) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Nemáte oprávnění zobrazit tuto stránku.
        </div>
      </div>
    );
  }

  // Checks
  let dbStatus = "ok";
  let dbLatency = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - start;
  } catch (e) {
    dbStatus = "error";
  }

  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.invoice.count(),
    prisma.auditLog.count(),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        System Health Dashboard
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DB Status */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Database className="h-8 w-8 text-primary" />
            <h3 className="font-semibold text-lg">Databáze</h3>
          </div>
          <div className="flex items-center gap-2 mb-2">
            {dbStatus === "ok" ? (
              <CheckCircle className="text-green-500 h-5 w-5" />
            ) : (
              <XCircle className="text-red-500 h-5 w-5" />
            )}
            <span className="font-medium text-lg">{dbStatus === "ok" ? "Připojeno" : "Chyba připojení"}</span>
          </div>
          <p className="text-sm text-muted-foreground">Odezva: <span className="font-mono">{dbLatency}ms</span></p>
        </div>

        {/* Stats */}
        <div className="p-6 border rounded-lg bg-card shadow-sm">
           <div className="flex items-center gap-4 mb-4">
            <Server className="h-8 w-8 text-primary" />
            <h3 className="font-semibold text-lg">Statistiky systému</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Uživatelé</span>
              <span className="font-bold font-mono text-lg">{counts[0]}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Faktury</span>
              <span className="font-bold font-mono text-lg">{counts[1]}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Audit Logy</span>
              <span className="font-bold font-mono text-lg">{counts[2]}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Informace o prostředí</h2>
        <div className="p-6 border rounded-lg bg-card shadow-sm">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="block text-sm text-muted-foreground">Node Verze</span>
                    <span className="font-mono">{process.version}</span>
                </div>
                <div>
                    <span className="block text-sm text-muted-foreground">Platforma</span>
                    <span className="font-mono">{process.platform}</span>
                </div>
                 <div>
                    <span className="block text-sm text-muted-foreground">Architektura</span>
                    <span className="font-mono">{process.arch}</span>
                </div>
                <div>
                    <span className="block text-sm text-muted-foreground">Uptime</span>
                    <span className="font-mono">{Math.floor(process.uptime())}s</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
