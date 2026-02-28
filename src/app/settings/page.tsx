import Link from "next/link";
import { Users, Settings, Shield, FileText, Activity, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Nastavení</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/settings/organization" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Organizace</h3>
            <p className="text-sm text-muted-foreground mt-1">Nastavení firmy, DPH, bankovní účty</p>
          </div>
        </Link>
        
        <Link href="/settings/users" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Uživatelé</h3>
            <p className="text-sm text-muted-foreground mt-1">Správa uživatelů a přístupů</p>
          </div>
        </Link>
        
        <Link href="/settings/roles" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Role a oprávnění</h3>
            <p className="text-sm text-muted-foreground mt-1">Definice rolí a práv (RBAC)</p>
          </div>
        </Link>
        
        <Link href="/settings/templates" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
           <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Šablony</h3>
            <p className="text-sm text-muted-foreground mt-1">Vzhled faktur a emailů</p>
          </div>
        </Link>
        
         <Link href="/settings/custom-fields" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Vlastní pole</h3>
            <p className="text-sm text-muted-foreground mt-1">Definice vlastních polí</p>
          </div>
        </Link>
        
        <Link href="/settings/health" className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col items-center text-center gap-4 group">
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">System Health</h3>
            <p className="text-sm text-muted-foreground mt-1">Stav systému a diagnostika</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
