
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Starting cleanup...");

  // Delete in reverse order of dependencies to avoid foreign key constraints

  // 1. Delete dependent operational data
  await prisma.stockMovement.deleteMany({});
  console.log("Deleted StockMovements");
  
  await prisma.invoiceItem.deleteMany({});
  console.log("Deleted InvoiceItems");
  
  await prisma.attachment.deleteMany({});
  console.log("Deleted Attachments");
  
  await prisma.emailLog.deleteMany({});
  console.log("Deleted EmailLogs");

  await prisma.bankMovement.deleteMany({});
  console.log("Deleted BankMovements");

  await prisma.timeEntry.deleteMany({});
  console.log("Deleted TimeEntries");

  await prisma.vehicleLog.deleteMany({});
  console.log("Deleted VehicleLogs");

  await prisma.approvalRequest.deleteMany({});
  console.log("Deleted ApprovalRequests");
  
  await prisma.invoiceCustomFieldValue.deleteMany({});
  console.log("Deleted InvoiceCustomFieldValues");

  // 2. Delete main entities
  await prisma.invoice.deleteMany({});
  console.log("Deleted Invoices");

  await prisma.expense.deleteMany({});
  console.log("Deleted Expenses");

  await prisma.task.deleteMany({});
  console.log("Deleted Tasks");
  
  await prisma.projectMilestone.deleteMany({});
  console.log("Deleted ProjectMilestones");

  await prisma.project.deleteMany({});
  console.log("Deleted Projects");

  await prisma.product.deleteMany({});
  console.log("Deleted Products");

  await prisma.vehicle.deleteMany({});
  console.log("Deleted Vehicles");
  
  await prisma.contract.deleteMany({});
  console.log("Deleted Contracts");
  
  await prisma.dispute.deleteMany({});
  console.log("Deleted Disputes");

  // 3. Delete Clients and Settings
  await prisma.client.deleteMany({});
  console.log("Deleted Clients");

  await prisma.bankDetail.deleteMany({});
  console.log("Deleted BankDetails");
  
  await prisma.bankIntegration.deleteMany({});
  console.log("Deleted BankIntegrations");
  
  await prisma.invoiceTemplate.deleteMany({});
  console.log("Deleted InvoiceTemplates");
  
  await prisma.customFieldDefinition.deleteMany({});
  console.log("Deleted CustomFieldDefinitions");
  
  await prisma.roleDefinition.deleteMany({});
  console.log("Deleted RoleDefinitions");

  // 4. Delete Users and Organizations (and links)
  await prisma.membership.deleteMany({});
  console.log("Deleted Memberships");

  await prisma.account.deleteMany({});
  console.log("Deleted Accounts");
  
  // Note: We might want to keep some users or handle them carefully if they are used elsewhere
  // But this script assumes we want to wipe "test" data. 
  // In a real scenario, we might want to filter by specific email domain or Organization ID.
  // Here we delete EVERYTHING.
  
  await prisma.auditLog.deleteMany({});
  console.log("Deleted AuditLogs");

  await prisma.user.deleteMany({
      where: {
          email: {
              endsWith: "@test.cz" // Only delete test users created by seed
          }
      }
  });
  console.log("Deleted Test Users (@test.cz)");
  
  // Delete organizations created by seed (or all if desired, but let's be safe and delete only if they have no users now?)
  // Or just delete the one we know:
  await prisma.organization.deleteMany({
      where: {
          email: "info@testovacifirma.cz"
      }
  });
  console.log("Deleted Test Organization");

  // Optional: Delete ALL organizations if that's the goal
  // await prisma.organization.deleteMany({});

  console.log("✨ Cleanup completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
