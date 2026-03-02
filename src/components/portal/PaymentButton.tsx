
"use client";

import { payInvoice } from "@/actions/portal";
import { CreditCard, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import confetti from "canvas-confetti";
import { formatCurrency } from "@/lib/format";

interface PaymentButtonProps {
  invoiceId: string;
  amount: number;
  currency: string;
}

export default function PaymentButton({ invoiceId, amount, currency }: PaymentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    // 1. Mock processing dialog
    setProcessing(true);
    
    // 2. Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Server action
    startTransition(async () => {
      const res = await payInvoice(invoiceId);
      
      if (res.success) {
        // 4. Confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
      setProcessing(false);
    });
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={isPending || processing}
        className="w-full md:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        {processing || isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Zpracovávám...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Zaplatit online ({formatCurrency(amount, currency)})
          </>
        )}
      </button>

      {/* Mock Payment Dialog Overlay - Simple Implementation */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-sm w-full mx-4 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Probíhá platba...</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Prosím neopouštějte stránku
              </p>
            </div>
            {/* TODO: Stripe/GoPay integration will be hooked here */}
          </div>
        </div>
      )}
    </>
  );
}
