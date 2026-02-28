import { NextResponse } from "next/server";
import { syncBankMovements } from "@/services/bank/sync";
import { matchPayments } from "@/services/bank/matching";

export async function GET() {
  try {
    const results = await syncBankMovements();
    const matched = await matchPayments();
    return NextResponse.json({ success: true, results, matched });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
