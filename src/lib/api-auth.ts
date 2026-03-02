import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function verifyApiKey(req: Request) {
  const apiKeyHeader = req.headers.get("X-API-Key");
  
  if (!apiKeyHeader) {
    return null;
  }

  // The key format is sk_vulpi_...
  // We need to hash it to compare with stored hash
  const keyHash = createHash("sha256").update(apiKeyHeader).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash },
    include: { organization: true }
  });

  if (!apiKey) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return apiKey.organization;
}
