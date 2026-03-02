"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";

export async function getAssets() {
  const user = await getCurrentUser();
  if (!user) return [];

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  if (!membership) return [];

  // Raw SQL
  const assets = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Asset" WHERE "organizationId" = ${membership.organizationId} ORDER BY "purchaseDate" DESC
  `;
  return assets;
}

export async function createAsset(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  if (!membership) throw new Error("No membership");

  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("purchasePrice") as string);
  const dateStr = formData.get("purchaseDate") as string;
  const years = parseInt(formData.get("depreciationYears") as string);

  const date = new Date(dateStr).toISOString();
  const id = "asset_" + Math.random().toString(36).substr(2, 9); // Simple ID gen since we can't use cuid() easily in raw sql without library or prisma default

  // We need a proper CUID or UUID.
  // SQLite supports randomblob but let's just use crypto or similar if available, or just random string.
  // Better: import { createId } from '@paralleldrive/cuid2'; but I don't know if it's installed.
  // I'll use a simple random string or rely on DB default if I could... but raw insert needs ID usually if not autoincrement.
  // Prisma default is cuid().
  // I will use a simple implementation of ID.
  
  await prisma.$executeRaw`
    INSERT INTO "Asset" ("id", "organizationId", "name", "purchasePrice", "purchaseDate", "depreciationYears", "createdAt", "updatedAt")
    VALUES (${id}, ${membership.organizationId}, ${name}, ${price}, ${date}, ${years}, ${new Date().toISOString()}, ${new Date().toISOString()})
  `;

  revalidatePath("/expenses/assets");
}

export async function deleteAsset(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  
  // Verify ownership?
  // Ideally yes.
  const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
  if (!membership) throw new Error("No membership");

  await prisma.$executeRaw`
    DELETE FROM "Asset" WHERE "id" = ${id} AND "organizationId" = ${membership.organizationId}
  `;

  revalidatePath("/expenses/assets");
}
