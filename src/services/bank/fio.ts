import { BankMovement } from "@prisma/client";

interface FioTransaction {
  column0?: { value: string };
  column1?: { value: number };
  column2?: { value: string };
  column8?: { value: string };
  column14?: { value: string };
  column22?: { value: string };
  column25?: { value: string };
  column5?: { value: string };
  column6?: { value: string };
  column7?: { value: string };
  column17?: { value: string };
}

interface FioResponse {
  accountStatement: {
    info: {
      accountId: string;
      bankId: string;
      currency: string;
      iban: string;
      bic: string;
      openingBalance: number;
      closingBalance: number;
      dateStart: string;
      dateEnd: string;
      idFrom: number;
      idTo: number;
    };
    transactionList: {
      transaction: FioTransaction[];
    };
  };
}

export async function fetchFioMovements(token: string, dateFrom: string, dateTo: string): Promise<Partial<BankMovement>[]> {
  const url = `https://www.fio.cz/ib_api/rest/periods/${token}/${dateFrom}/${dateTo}/transactions.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fio API error: ${response.status} ${response.statusText}`);
  }

  const data: FioResponse = await response.json();
  const txs = data.accountStatement?.transactionList?.transaction ?? [];

  return txs.map((t) => {
    const amount = t.column1?.value ?? 0;
    const variableSymbol = t.column5?.value ?? null;
    const constantSymbol = t.column6?.value ?? null;
    const specificSymbol = t.column7?.value ?? null;
    const date = t.column0?.value ? new Date(t.column0.value) : new Date();
    const transactionId = t.column22?.value ?? t.column17?.value ?? `${date.getTime()}-${Math.random()}`;

    return {
      transactionId,
      amount,
      currency: t.column14?.value ?? "CZK",
      date,
      variableSymbol,
      constantSymbol,
      specificSymbol,
      accountName: t.column8?.value ?? null,
      accountInfo: null,
      message: t.column25?.value ?? t.column2?.value ?? null,
      status: "UNMATCHED",
    };
  });
}
