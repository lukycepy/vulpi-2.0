import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_ROLES: Record<string, string[]> = {
  SUPERADMIN: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_users", "manage_roles", "manage_settings", "impersonate_users", "manage_bank", "manage_expenses", "manage_clients", "manage_projects", "manage_templates", "manage_custom_fields"],
  ADMIN: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_users", "manage_roles", "manage_settings", "impersonate_users", "manage_bank", "manage_expenses", "manage_clients", "manage_projects", "manage_templates", "manage_custom_fields"],
  MANAGER: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_bank", "manage_expenses", "manage_clients", "manage_projects"],
  USER: ["view_dashboard", "manage_invoices", "manage_clients"],
  WAREHOUSEMAN: ["manage_inventory"],
  ACCOUNTANT: ["view_dashboard", "manage_invoices", "manage_bank", "manage_expenses", "manage_clients"],
};

async function main() {
  let org = await prisma.organization.findFirst();
  
  if (!org) {
    console.log("Creating default organization...");
    org = await prisma.organization.create({
      data: {
        name: "Moje Firma s.r.o.",
        taxId: "12345678",
        vatId: "CZ12345678",
        address: "Hlavní 1, 110 00 Praha, CZ",
        email: "info@mojefirma.cz",
        phone: "+420123456789",
        web: "www.mojefirma.cz",
        vatPayerStatus: "PAYER",
        bankDetails: {
          create: {
            bankName: "Fio banka",
            accountNumber: "123456789/2010",
            currency: "CZK",
            isDefault: true
          }
        }
      },
    });
    console.log(`Created organization: ${org.name}`);
  }

  // Ensure default user exists
  let user = await prisma.user.findFirst({ where: { email: "admin@mojefirma.cz" } });
  if (!user) {
    console.log("Creating default admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    user = await prisma.user.create({
      data: {
        email: "admin@mojefirma.cz",
        passwordHash: hashedPassword,
        firstName: "Admin",
        lastName: "User",
      },
    });
    console.log(`Created user: ${user.email}`);

    // Assign membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });
  }

  // Create requested superadmin
  const superAdminEmail = "admin@vulpi.cz";
  let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  
  if (!superAdmin) {
    console.log("Creating superadmin user...");
    const hashedPassword = await bcrypt.hash("1234", 10);
    superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
      },
    });
    
    // Assign membership to the first organization found
    await prisma.membership.create({
      data: {
        userId: superAdmin.id,
        organizationId: org.id,
        role: "SUPERADMIN",
      },
    });
    console.log(`Created superadmin: ${superAdminEmail}`);
  } else {
      // Update password just in case
      const hashedPassword = await bcrypt.hash("1234", 10);
      await prisma.user.update({
          where: { id: superAdmin.id },
          data: { passwordHash: hashedPassword }
      });
      
      // Update role to SUPERADMIN if not already
      const membership = await prisma.membership.findFirst({
        where: { userId: superAdmin.id, organizationId: org.id }
      });
      
      if (membership && membership.role !== "SUPERADMIN") {
        await prisma.membership.update({
          where: { id: membership.id },
          data: { role: "SUPERADMIN" }
        });
        console.log(`Updated superadmin role to SUPERADMIN`);
      }
      
      console.log(`Updated superadmin password: ${superAdminEmail}`);
  }

  console.log(`Seeding roles for organization: ${org.name} (${org.id})`);

  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES)) {
    const existing = await prisma.roleDefinition.findFirst({
      where: {
        organizationId: org.id,
        name: roleName,
      },
    });

    if (!existing) {
      await prisma.roleDefinition.create({
        data: {
          organizationId: org.id,
          name: roleName,
          permissions: JSON.stringify(permissions),
        },
      });
      console.log(`Created system role: ${roleName}`);
    } else {
      // console.log(`Role ${roleName} already exists.`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
