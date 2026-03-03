
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Testovací Firma s.r.o.",
      taxId: "12345678",
      vatId: "CZ12345678",
      address: "Testovací 123, Praha",
      email: "info@testovacifirma.cz",
      phone: "+420 123 456 789",
    },
  });
  console.log(`✅ Organization created: ${org.name}`);

  // 2. Create Users
  const passwordHash = await hash("password123", 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.cz",
      passwordHash,
      firstName: "Admin",
      lastName: "Testovací",
      memberships: {
        create: {
          organizationId: org.id,
          role: "ADMIN",
        },
      },
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: "employee@test.cz",
      passwordHash,
      firstName: "Zaměstnanec",
      lastName: "Testovací",
      memberships: {
        create: {
          organizationId: org.id,
          role: "USER",
        },
      },
    },
  });
  console.log(`✅ Users created: ${adminUser.email}, ${employeeUser.email}`);

  // 3. Create Clients
  const client1 = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Dlouhodobý Klient a.s.",
      email: "klient1@example.com",
      taxId: "87654321",
      address: "Klientova 1, Brno",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: "Nový Zákazník s.r.o.",
      email: "klient2@example.com",
      address: "Nová 5, Ostrava",
    },
  });
  console.log(`✅ Clients created: ${client1.name}, ${client2.name}`);

  // 4. Create Products (Inventory)
  const product1 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: "Prémiová Služba",
      buyPrice: 0,
      sellPrice: 5000,
      stockQuantity: 999, // Service
    },
  });

  const product2 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: "Fyzický Produkt A",
      buyPrice: 200,
      sellPrice: 450,
      stockQuantity: 50,
      minStockLevel: 10,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: "Fyzický Produkt B",
      buyPrice: 100,
      sellPrice: 250,
      stockQuantity: 0, // Out of stock
      minStockLevel: 5,
    },
  });
  console.log(`✅ Products created: ${product1.name}, ${product2.name}, ${product3.name}`);

  // 5. Create Invoices
  // Invoice 1: Paid
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      number: "2024001",
      type: "FAKTURA",
      status: "PAID",
      issuedAt: new Date("2024-01-10"),
      dueAt: new Date("2024-01-24"),
      totalAmount: 6050,
      totalVat: 1050,
      paidAmount: 6050,
      items: {
        create: [
          {
            description: "Prémiová Služba - Leden",
            quantity: 1,
            unitPrice: 5000,
            vatRate: 21,
            totalAmount: 6050,
          },
        ],
      },
    },
  });

  // Invoice 2: Issued (Overdue)
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client2.id,
      number: "2024002",
      type: "FAKTURA",
      status: "ISSUED",
      issuedAt: new Date("2024-02-01"),
      dueAt: new Date("2024-02-15"), // Past due if running later
      totalAmount: 2420,
      totalVat: 420,
      paidAmount: 0,
      items: {
        create: [
          {
            description: "Konzultace",
            quantity: 2,
            unitPrice: 1000,
            vatRate: 21,
            totalAmount: 2420,
          },
        ],
      },
    },
  });

  // Invoice 3: Draft
  await prisma.invoice.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      number: "2024003",
      type: "FAKTURA",
      status: "DRAFT",
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      totalAmount: 544.5,
      totalVat: 94.5,
      items: {
        create: [
          {
            description: "Fyzický Produkt A",
            quantity: 1,
            unitPrice: 450,
            vatRate: 21,
            totalAmount: 544.5,
          },
        ],
      },
    },
  });
  console.log("✅ Invoices created");

  // 6. Create Project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      clientId: client1.id,
      name: "Implementace Systému",
      status: "ACTIVE",
      budget: 50000,
      description: "Velký projekt implementace pro klienta 1",
    },
  });
  console.log(`✅ Project created: ${project.name}`);

  // 7. Stock Movements
  await prisma.stockMovement.create({
    data: {
      productId: product2.id,
      type: "IN",
      quantity: 50,
      note: "Počáteční naskladnění",
      date: new Date(),
    },
  });
  console.log("✅ Stock movements created");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
