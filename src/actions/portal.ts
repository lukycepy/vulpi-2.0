"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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
        items: true
      }
    })
    return invoices
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return []
  }
}

export async function createDispute(invoiceId: string, message: string) {
  try {
    const client = await getClientFromToken();
    if (!client) throw new Error("Unauthorized");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true }
    })

    if (!invoice) throw new Error("Faktura nenalezena")
    
    if (invoice.clientId !== client.id) {
      throw new Error("Unauthorized access to invoice");
    }

    await prisma.dispute.create({
      data: {
        invoiceId,
        clientId: invoice.clientId,
        message,
        status: "OPEN"
      }
    })
    
    return { success: true, message: "Reklamace byla odeslána ke zpracování." }
  } catch (error) {
    console.error("Dispute error:", error)
    return { success: false, message: "Chyba při odesílání reklamace." }
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
