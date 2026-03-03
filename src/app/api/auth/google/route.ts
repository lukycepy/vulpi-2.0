
import { redirect } from "next/navigation";
import { getGoogleAuthUrl } from "@/lib/google";

export async function GET() {
  const url = getGoogleAuthUrl();
  return redirect(url);
}
