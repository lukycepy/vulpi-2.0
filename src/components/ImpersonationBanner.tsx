import { cookies } from "next/headers";
import { stopImpersonation } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle } from "lucide-react";

export function ImpersonationBanner() {
  const isImpersonating = cookies().has("impersonated_user_id");

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Právě jste přihlášeni v režimu impersonace. Vaše akce jsou prováděny jménem jiného uživatele.
        </span>
      </div>
      <form action={stopImpersonation}>
        <Button 
          type="submit"
          variant="outline" 
          size="sm" 
          className="bg-white border-amber-300 text-amber-900 hover:bg-amber-50 h-8"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Ukončit impersonaci
        </Button>
      </form>
    </div>
  );
}
