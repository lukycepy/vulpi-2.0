"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions"

export async function verifyClientAccess(formData: FormData) {
  const accessCode = formData.get("accessCode") as string

  if (!accessCode) {
    return { error: "Zadejte přístupový kód" }
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        accessCode: accessCode,
        webAccess: true
      }
    })

    if (!client) {
      return { error: "Neplatný přístupový kód nebo přístup není povolen" }
    }

    const cookieStore = await cookies()
    cookieStore.set("client_token", client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

  } catch (error) {
    console.error("Login error:", error)
    return { error: "Chyba při přihlášení" }
  }

  return { success: true }
}

export async function clientLogout() {
  const cookieStore = await cookies()
  cookieStore.delete("client_token")
  redirect("/portal/login")
}

export async function getClientFromToken() {
  const cookieStore = await cookies()
  const token = cookieStore.get("client_token")?.value
  
  if (!token) return null

  try {
    const client = await prisma.client.findUnique({
      where: { id: token },
      include: {
        organization: true
      }
    })
    return client
  } catch (error) {
    return null
  }
}

export async function getClientInvoices(clientId: string) {
  try {
    const client = await getClientFromToken();
    if (!client || client.id !== clientId) {
      throw new Error("Unauthorized");
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: clientId,
        status: { not: "DRAFT" }
      },
      orderBy: {
        issuedAt: 'desc'
      },
      include: {
        items: true,
        organization: true,
        bankDetail: true,
        client: true,
        template: true,
      }
    })
    return invoices
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return []
  }
}

import { sendEmail } from "@/actions/email";

export async function sendPortalLink(clientId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { organization: true }
  });

  if (!client) throw new Error("Client not found");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, organizationId: client.organizationId }
  });

  if (!membership) throw new Error("Unauthorized");

  if (!client.email) {
      throw new Error("Klient nemá vyplněný email.");
  }

  // Ensure access code exists
  let accessCode = client.accessCode;
  if (!accessCode) {
      // Generate simple code if missing
      accessCode = Math.random().toString(36).slice(-8).toUpperCase();
      await prisma.client.update({
          where: { id: clientId },
          data: { accessCode, webAccess: true }
      });
  } else if (!client.webAccess) {
      await prisma.client.update({
          where: { id: clientId },
          data: { webAccess: true }
      });
  }

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/portal/login`;
  
  // Send email
  try {
      await sendEmail({
          to: client.email,
          subject: `Přístup do klientského portálu - ${client.organization.name}`,
          text: `Dobrý den,\n\npro přístup k Vašim fakturám a dokumentům využijte klientský portál.\n\nAdresa: ${portalUrl}\nPřístupový kód: ${accessCode}\n\nS pozdravem,\n${client.organization.name}`
      });
      return { success: true };
  } catch (error: any) {
      console.error("Failed to send portal link:", error);
      throw new Error("Nepodařilo se odeslat email: " + error.message);
  }
}

export async function createDispute(invoiceId: string, message: string) {
  try {
    const client = await getClientFromToken();
    if (!client) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true }
    });

    if (!invoice || invoice.clientId !== client.id) {
      throw new Error("Unauthorized");
    }

    await prisma.dispute.create({
      data: {
        invoiceId,
        clientId: client.id,
        message,
        status: "OPEN"
      }
    });

    revalidatePath(`/portal/invoices/${invoiceId}`);
    return { success: true, message: "Reklamace byla odeslána ke zpracování." };
  } catch (error) {
    console.error("Error creating dispute:", error);
    return { success: false, message: "Chyba při odesílání reklamace." };
  }
}

export async function payInvoice(invoiceId: string) {
  try {
    const client = await getClientFromToken();
    if (!client) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true }
    });

    if (!invoice || invoice.clientId !== client.id) {
      throw new Error("Unauthorized");
    }

    // TODO: Stripe/GoPay integration
    // const paymentIntent = await stripe.paymentIntents.create({...})

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAmount: invoice.totalAmount, // Full payment
        paidAt: new Date(),
        overpaymentAmount: 0
      } as any
    });

    revalidatePath(`/portal/invoices/${invoiceId}`);
    revalidatePath(`/portal`); // Update list as well
    return { success: true };
  } catch (error) {
    console.error("Error paying invoice:", error);
    return { success: false, error: "Platba selhala" };
  }
}

export async function resolveDispute(disputeId: string, response: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { invoice: true }
    });

    if (!dispute) throw new Error("Dispute not found");

    const canManage = await hasPermission(user.id, dispute.invoice.organizationId, "manage_invoices");
    if (!canManage) throw new Error("Nemáte oprávnění.");

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        adminResponse: response
      }
    })
    revalidatePath("/disputes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Chyba při řešení reklamace" }
  }
}

export async function rejectDispute(disputeId: string, response: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { invoice: true }
    });

    if (!dispute) throw new Error("Dispute not found");

    const canManage = await hasPermission(user.id, dispute.invoice.organizationId, "manage_invoices");
    if (!canManage) throw new Error("Nemáte oprávnění.");

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "REJECTED",
        adminResponse: response
      }
    })
    revalidatePath("/disputes")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Chyba při zamítnutí reklamace" }
  }
}
