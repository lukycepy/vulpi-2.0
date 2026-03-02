
import { Invoice, Organization, Client } from "@prisma/client";

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
    await simulateUpload("Google Drive", filename);
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
    console.log(`[Cloud Sync] Faktura ${invoice.number} byla synchronizována do: ${integrations.join(", ")}`);
  }
}

async function simulateUpload(provider: string, filename: string) {
  // Simulace asynchronní operace (network request)
  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log(`[${provider}] Simulace: Upload souboru ${filename} dokončen.`);
}
