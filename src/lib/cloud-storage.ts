import { Invoice, Organization, Client } from "@prisma/client";
import { google } from "googleapis";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";

/**
 * Simulace služby pro synchronizaci s cloudovými úložišti.
 * V budoucnu zde bude implementace OAuth2 a uploadu souborů.
 */
export async function syncInvoiceToCloud(
  invoice: Invoice & { organization: Organization; client: Client },
  pdfBuffer: Buffer
) {
  const { organization } = invoice;
  const filename = `Faktura_${invoice.number}.pdf`;

  const integrations = [];

  if (organization.cloudIntegrationGoogleDrive) {
    integrations.push("Google Drive");
    await uploadInvoiceToGoogleDrive(organization, pdfBuffer, filename, "application/pdf");
  }

  if (organization.cloudIntegrationDropbox) {
    integrations.push("Dropbox");
    await simulateUpload("Dropbox", filename);
  }

  if (organization.cloudIntegrationOneDrive) {
    integrations.push("OneDrive");
    await simulateUpload("OneDrive", filename);
  }

  if (integrations.length > 0) {
    void integrations;
  }
}

async function simulateUpload(provider: string, filename: string) {
  // Simulace asynchronní operace (network request)
  await new Promise((resolve) => setTimeout(resolve, 1500));
  void provider;
  void filename;
}

export async function uploadInvoiceToGoogleDrive(
  organization: Organization,
  pdfBuffer: Buffer,
  fileName: string,
  mimeType: string
) {
  if (!organization.googleDriveCredentials) {
    return;
  }

  try {
    const credentials = JSON.parse(organization.googleDriveCredentials);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: fileName,
      // parents: ['folderId'] // Optional: if we want to put it in a specific folder
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(pdfBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        action: "CLOUD_UPLOAD_SUCCESS",
        entity: "Invoice",
        details: JSON.stringify({ provider: "Google Drive", fileId: file.data.id }),
      }
    });

    return file.data.id;

  } catch (error: any) {
    console.error('[Google Drive] Upload failed:', error);

    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        action: "CLOUD_UPLOAD_FAILED",
        entity: "Invoice",
        details: JSON.stringify({ provider: "Google Drive", error: error.message }),
      }
    });
  }
}
