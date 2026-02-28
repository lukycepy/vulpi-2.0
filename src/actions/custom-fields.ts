"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

const customFieldSchema = z.object({
  name: z.string().min(1, "Název je povinný"),
  key: z.string().min(1, "Klíč je povinný").regex(/^[a-z0-9_]+$/, "Klíč může obsahovat pouze malá písmena, čísla a podtržítka"),
  type: z.enum(["TEXT", "NUMBER", "DATE", "BOOLEAN"]),
  description: z.string().optional(),
});

export async function getCustomFieldDefinitions(organizationId: string) {
  const user = await getCurrentUser();

  // Basic check: user must belong to the organization
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      organizationId: organizationId,
    },
  });

  if (!membership) {
    throw new Error("Nemáte přístup k této organizaci.");
  }

  return prisma.customFieldDefinition.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCustomFieldDefinition(data: {
  organizationId: string;
  name: string;
  key: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";
  description?: string;
}) {
  const user = await getCurrentUser();

  const canManage = await hasPermission(user.id, data.organizationId, "manage_custom_fields");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat vlastní pole.");
  }

  const validation = customFieldSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  // Check for duplicate key in organization
  const existing = await prisma.customFieldDefinition.findFirst({
    where: {
      organizationId: data.organizationId,
      key: data.key,
    },
  });

  if (existing) {
    throw new Error("Vlastní pole s tímto klíčem již existuje.");
  }

  const field = await prisma.customFieldDefinition.create({
    data,
  });

  revalidatePath("/settings/custom-fields");
  return field;
}

export async function updateCustomFieldDefinition(
  id: string,
  data: {
    name?: string;
    description?: string;
  }
) {
  const user = await getCurrentUser();

  const field = await prisma.customFieldDefinition.findUnique({
    where: { id },
    select: { organizationId: true },
  });

  if (!field) {
    throw new Error("Pole nenalezeno.");
  }

  const canManage = await hasPermission(user.id, field.organizationId, "manage_custom_fields");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat vlastní pole.");
  }

  // Key and Type should ideally not be changed to avoid data inconsistency, or handled carefully
  const updatedField = await prisma.customFieldDefinition.update({
    where: { id },
    data,
  });

  revalidatePath("/settings/custom-fields");
  return updatedField;
}

export async function deleteCustomFieldDefinition(id: string) {
  const user = await getCurrentUser();

  const field = await prisma.customFieldDefinition.findUnique({
    where: { id },
    select: { organizationId: true },
  });

  if (!field) {
    throw new Error("Pole nenalezeno.");
  }

  const canManage = await hasPermission(user.id, field.organizationId, "manage_custom_fields");
  if (!canManage) {
    throw new Error("Nemáte oprávnění spravovat vlastní pole.");
  }

  await prisma.customFieldDefinition.delete({
    where: { id },
  });

  revalidatePath("/settings/custom-fields");
}
