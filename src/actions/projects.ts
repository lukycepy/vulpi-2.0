"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { organizationId: true }
  });

  if (!membership) throw new Error("Nejste členem žádné organizace");

  const hasAccess = await hasPermission(user.id, membership.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  const name = formData.get("name") as string;
  const clientId = formData.get("clientId") as string || null;
  const hourlyRateStr = formData.get("hourlyRate") as string;
  const budgetStr = formData.get("budget") as string;
  
  if (!name) throw new Error("Název projektu je povinný");

  await prisma.project.create({
    data: {
      organizationId: membership.organizationId,
      name,
      clientId: clientId || undefined,
      hourlyRate: hourlyRateStr ? parseFloat(hourlyRateStr) : null,
      budget: budgetStr ? parseFloat(budgetStr) : null,
      status: "ACTIVE"
    }
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function createTask(projectId: string, data: { title: string; description?: string; assignedToUserId?: string; dueDate?: Date }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (!project) throw new Error("Projekt nenalezen");

  const hasAccess = await hasPermission(user.id, project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  if (!data.title) throw new Error("Název úkolu je povinný");

  await prisma.task.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      assignedToUserId: data.assignedToUserId,
      dueDate: data.dueDate,
      status: "TODO"
    }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(taskId: string, data: { title?: string; description?: string; assignedToUserId?: string; dueDate?: Date }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  });

  if (!task) throw new Error("Úkol nenalezen");

  const hasAccess = await hasPermission(user.id, task.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      assignedToUserId: data.assignedToUserId,
      dueDate: data.dueDate
    }
  });

  revalidatePath(`/projects/${task.projectId}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  });

  if (!task) throw new Error("Úkol nenalezen");

  const hasAccess = await hasPermission(user.id, task.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.task.update({
    where: { id: taskId },
    data: { status }
  });

  revalidatePath(`/projects/${task.projectId}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  });

  if (!task) throw new Error("Úkol nenalezen");

  const hasAccess = await hasPermission(user.id, task.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.task.delete({
    where: { id: taskId }
  });

  revalidatePath(`/projects/${task.projectId}`);
  return { success: true };
}

export async function createMilestone(projectId: string, data: { name: string; amount: number }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { organizationId: true }
  });

  if (!project) throw new Error("Projekt nenalezen");

  const hasAccess = await hasPermission(user.id, project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.projectMilestone.create({
    data: {
      projectId,
      title: data.name,
      amount: data.amount,
    }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateMilestone(milestoneId: string, data: { name?: string; amount?: number }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: true }
  });

  if (!milestone) throw new Error("Milník nenalezen");

  const hasAccess = await hasPermission(user.id, milestone.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      title: data.name,
      amount: data.amount,
    }
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true };
}

export async function deleteMilestone(milestoneId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: true }
  });

  if (!milestone) throw new Error("Milník nenalezen");
  if (milestone.isBilled) throw new Error("Nelze smazat vyfakturovaný milník");

  const hasAccess = await hasPermission(user.id, milestone.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.projectMilestone.delete({
    where: { id: milestoneId }
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true };
}

export async function toggleMilestoneCompletion(milestoneId: string, isCompleted: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId },
    include: { project: true }
  });

  if (!milestone) throw new Error("Milník nenalezen");

  const hasAccess = await hasPermission(user.id, milestone.project.organizationId, "manage_projects");
  if (!hasAccess) throw new Error("Nemáte oprávnění spravovat projekty");

  await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: { isCompleted }
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true };
}

export async function billMilestone(milestoneId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Nejste přihlášen");

  const milestone = await prisma.projectMilestone.findUnique({
    where: { id: milestoneId },
    include: { 
        project: {
            include: {
                client: true,
                organization: true
            }
        } 
    }
  });

  if (!milestone) throw new Error("Milník nenalezen");
  if (milestone.isBilled) throw new Error("Milník již byl vyfakturován");
  if (!milestone.isCompleted) throw new Error("Milník není dokončen");

  const hasAccess = await hasPermission(user.id, milestone.project.organizationId, "manage_invoices");
  if (!hasAccess) throw new Error("Nemáte oprávnění vytvářet faktury");

  const orgId = milestone.project.organizationId;
  const clientId = milestone.project.client?.id;
  
  if (!clientId) throw new Error("Projekt nemá přiřazeného klienta, nelze fakturovat. Přiřaďte klienta v nastavení projektu.");

  // Generate a temp number or use a service to get next number
  // For DRAFT, we can use a placeholder or auto-generate
  const number = `DRAFT-${Date.now()}`; 

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: orgId,
      clientId: clientId,
      projectId: milestone.projectId,
      number: number,
      type: "FAKTURA",
      status: "DRAFT",
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      currency: "CZK",
      vatMode: milestone.project.organization.vatPayerStatus === "PAYER" ? "STANDARD" : "NON_PAYER",
      items: {
        create: {
          description: `Fakturace milníku: ${milestone.title}`,
          quantity: 1,
          unit: "ks",
          unitPrice: milestone.amount,
          totalAmount: milestone.amount,
          vatRate: 21 // Default VAT
        }
      },
      totalAmount: milestone.amount, // Stored as net in our engine; VAT tracked separately
      totalVat: milestone.project.organization.vatPayerStatus === "PAYER" ? milestone.amount * 0.21 : 0,
    }
  });

  // Mark milestone as billed
  await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: { isBilled: true }
  });

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true, invoiceId: invoice.id };
}
