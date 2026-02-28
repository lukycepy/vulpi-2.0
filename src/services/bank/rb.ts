import { BankMovement } from "@prisma/client";

interface RbTransaction {
  entryReference: string; // ID
  amount: {
    value: number;
    currency: string;
  };
  bookingDate: string;
  creditDebitIndicator: "CRDT" | "DBIT";
  remittanceInformation?: {
    unstructured?: string;
    structured?: {
        creditorReferenceInformation?: {
            reference?: string; // VS
        }
    }
  };
  entryDetails?: {
      transactionDetails?: {
          relatedParties?: {
              counterParty?: {
                  name?: string;
                  account?: {
                      iban?: string;
                  }
              }
          }
      }
  }
}

interface RbResponse {
  account: {
      transactions: RbTransaction[];
  }
}

export async function fetchRbMovements(token: string, dateFrom: string, dateTo: string): Promise<Partial<BankMovement>[]> {
  // Raiffeisenbank Premium API implementation (Simplified)
  // Note: Real RB Premium API requires mTLS (Client Certificate). 
  // This implementation assumes a hypothetical Gateway or simplified Token access.
  // For production, you would need to use an Agent with certs or a specialized proxy.

  // If token is "TEST", return mock data
  if (token === "TEST") {
      return [
          {
              transactionId: `RB-TEST-${Date.now()}`,
              amount: 1234.56,
              currency: "CZK",
              date: new Date(),
              variableSymbol: "1234567890",
              accountName: "Test Client RB",
              message: "Test transaction RB",
              status: "UNMATCHED"
          }
      ];
  }

  // Placeholder URL - replace with actual RB API endpoint
  const url = `https://api.rb.cz/premium/v1/accounts/statements?from=${dateFrom}&to=${dateTo}`;

  try {
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "X-Request-ID": crypto.randomUUID(),
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        // If 401/403, it might be cert issue.
        console.warn(`RB API returned ${response.status}. Ensure mTLS is configured or Token is valid.`);
        return [];
    }

    const data = await response.json();
    // Transform RB format to our BankMovement
    // This mapping depends on the exact RB API version (PSD2 vs Premium)
    // Assuming a generic PSD2-like structure for this example:
    
    // @ts-ignore - Mocking the response structure mapping
    const transactions = data.transactions || [];

    return transactions.map((t: any) => {
        const amountVal = t.amount?.value || 0;
        const isCredit = t.creditDebitIndicator === "CRDT";
        const amount = isCredit ? Math.abs(amountVal) : -Math.abs(amountVal);
        
        return {
            transactionId: t.entryReference || `RB-${Date.now()}-${Math.random()}`,
            amount: amount,
            currency: t.amount?.currency || "CZK",
            date: new Date(t.bookingDate),
            variableSymbol: t.remittanceInformation?.structured?.creditorReferenceInformation?.reference || null,
            constantSymbol: null,
            specificSymbol: null,
            accountName: t.entryDetails?.transactionDetails?.relatedParties?.counterParty?.name || null,
            accountInfo: t.entryDetails?.transactionDetails?.relatedParties?.counterParty?.account?.iban || null,
            message: t.remittanceInformation?.unstructured || null,
            status: "UNMATCHED"
        };
    });

  } catch (error) {
      console.error("RB API Fetch Error:", error);
      // Return empty to avoid crashing the sync job
      return [];
  }
}
