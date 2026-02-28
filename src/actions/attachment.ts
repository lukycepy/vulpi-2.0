"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadAttachment(formData: FormData) {
  const user = await getCurrentUser();
  const file = formData.get("file") as File;
  const invoiceId = formData.get("invoiceId") as string;

  if (!file || !invoiceId) {
    throw new Error("Missing file or invoice ID");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Check permission
  const canManageInvoices = await hasPermission(user.id, invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) {
    throw new Error("Nemáte oprávnění spravovat faktury.");
  }

  if (invoice.isLocked) {
    throw new Error("Cannot add attachment to locked invoice");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload directory if not exists
  const uploadDir = join(process.cwd(), "public", "uploads", "attachments");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate unique filename to avoid collisions
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = file.name.split('.').pop();
  const filename = `${invoiceId}-${uniqueSuffix}.${extension}`;
  const filepath = join(uploadDir, filename);
  const fileUrl = `/uploads/attachments/${filename}`;

  // Save file
  await writeFile(filepath, buffer);

  // Save to DB
  await prisma.attachment.create({
    data: {
      invoiceId,
      fileName: file.name,
      fileType: file.type,
      fileUrl,
      fileSize: file.size,
    },
  });

  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deleteAttachment(attachmentId: string) {
  const user = await getCurrentUser();
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { invoice: true },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  // Check permission
  const canManageInvoices = await hasPermission(user.id, attachment.invoice.organizationId, "manage_invoices");
  if (!canManageInvoices) {
    throw new Error("Nemáte oprávnění spravovat faktury.");
  }

  if (attachment.invoice.isLocked) {
    throw new Error("Cannot delete attachment from locked invoice");
  }

  // Delete file from disk
  // Construct absolute path from relative URL
  // fileUrl: /uploads/attachments/filename.ext
  const relativePath = attachment.fileUrl.startsWith("/") ? attachment.fileUrl.slice(1) : attachment.fileUrl;
  const absolutePath = join(process.cwd(), "public", relativePath);

  try {
    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // Proceed to delete DB record even if file deletion fails
  }

  // Delete from DB
  await prisma.attachment.delete({
    where: { id: attachmentId },
  });

  revalidatePath(`/invoices/${attachment.invoiceId}`);
}
