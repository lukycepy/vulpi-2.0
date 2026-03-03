
"use server";

import { getCurrentUser } from "@/lib/auth-permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadAvatar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file uploaded");

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please upload an image.");
  }

  // Validate file size (e.g. 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Max size is 5MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Ensure upload directory exists
  // We'll store in public/uploads/avatars
  // Note: In Vercel/Serverless this won't persist. 
  // But for VPS/Local (c:\Users\Lukas...) it works.
  const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
  const filePath = join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  const publicUrl = `/uploads/avatars/${fileName}`;

  // Update user profile
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: publicUrl }
  });

  revalidatePath("/settings/profile");
  revalidatePath("/", "layout"); // Update header

  return { success: true, url: publicUrl };
}
