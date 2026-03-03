
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { approveDocument } from "@/actions/approvals";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ApproveButtonProps {
  approvalId: string;
  approverId: string;
}

export function ApproveButton({ approvalId, approverId }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveDocument(approvalId, approverId);
      toast({ 
        title: "Schváleno", 
        description: "Faktura byla úspěšně schválena a vystavena.",
        variant: "default" 
      });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="default" 
      size="sm" 
      className="bg-green-600 hover:bg-green-700 gap-2"
      onClick={handleApprove}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Schválit
    </Button>
  );
}
