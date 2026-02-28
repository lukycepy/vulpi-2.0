import { headers } from "next/headers";

/**
 * Retrieves the current organization ID from the request headers.
 * This ensures that SQL queries can be filtered by organization context.
 * 
 * Usage:
 * const orgId = await getTenantContext();
 * if (orgId) {
 *   const data = await prisma.invoice.findMany({ where: { organizationId: orgId } });
 * }
 */
export async function getTenantContext(): Promise<string | null> {
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");

  // In a real implementation, you would also validate the session here
  // to ensure the user actually belongs to this organization.

  return organizationId;
}
