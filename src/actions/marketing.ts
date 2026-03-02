
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { sendNewsletterEmail } from "@/services/email";
import { revalidatePath } from "next/cache";

export async function sendBulkNewsletter(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) throw new Error("Nejste členem žádné organizace");

  // Check permissions - assuming manage_clients or a new manage_marketing permission
  // For now, let's use manage_clients or just assume admin if manage_settings
  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_clients");
  if (!hasAccess) throw new Error("Nemáte oprávnění");

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const clientIdsJson = formData.get("clientIds") as string;
  
  if (!subject || !body || !clientIdsJson) {
    throw new Error("Chybí povinné údaje");
  }

  const clientIds = JSON.parse(clientIdsJson) as string[];

  if (clientIds.length === 0) {
    throw new Error("Nebyli vybráni žádní klienti");
  }

  // Send emails in background (or await if few)
  // For better UX, we might want to use a queue, but here we'll just loop
  let successCount = 0;
  let failCount = 0;

  for (const clientId of clientIds) {
    try {
      await sendNewsletterEmail(clientId, subject, body);
      successCount++;
    } catch (e) {
      console.error(`Failed to send newsletter to client ${clientId}`, e);
      failCount++;
    }
  }

  revalidatePath("/marketing/newsletter");
  return { success: true, sent: successCount, failed: failCount };
}
