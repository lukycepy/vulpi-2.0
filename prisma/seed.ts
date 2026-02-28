import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_ROLES: Record<string, string[]> = {
  ADMIN: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_users", "manage_roles", "manage_settings", "impersonate_users"],
  MANAGER: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory"],
  USER: ["view_dashboard", "manage_invoices"],
  WAREHOUSEMAN: ["manage_inventory"],
  ACCOUNTANT: ["view_dashboard", "manage_invoices"],
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
  let user = await prisma.user.findFirst();
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
          description: `System role: ${roleName}`,
          permissions: JSON.stringify(permissions),
          isSystem: true,
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
