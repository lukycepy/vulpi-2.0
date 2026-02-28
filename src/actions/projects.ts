
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });

  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageProjects = await hasPermission(user.id, orgId, "manage_projects");
  if (!canManageProjects) throw new Error("Nemáte oprávnění spravovat projekty.");

  const name = formData.get("name") as string;
  const clientId = formData.get("clientId") as string;

  if (clientId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client || client.organizationId !== orgId) {
      throw new Error("Klient nebyl nalezen nebo k němu nemáte přístup.");
    }
  }

  const description = formData.get("description") as string;
  const hourlyRate = parseFloat(formData.get("hourlyRate") as string);
  const budget = parseFloat(formData.get("budget") as string);
  const color = formData.get("color") as string;

  await prisma.project.create({
    data: {
      organizationId: orgId,
      name,
      clientId: clientId || null,
      description,
      hourlyRate: isNaN(hourlyRate) ? null : hourlyRate,
      budget: isNaN(budget) ? null : budget,
      color: color || "#000000",
    }
  });

  revalidatePath("/projects");
  redirect("/projects");
}
