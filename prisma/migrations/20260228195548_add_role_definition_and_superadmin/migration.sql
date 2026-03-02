/*
  Warnings:

  - You are about to drop the column `matchedInvoiceId` on the `BankMovement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Client" ADD COLUMN "mailingAddress" TEXT;
ALTER TABLE "Client" ADD COLUMN "mailingCity" TEXT;
ALTER TABLE "Client" ADD COLUMN "mailingCountry" TEXT;
ALTER TABLE "Client" ADD COLUMN "mailingZip" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "archiveEmail" TEXT;
ALTER TABLE "Organization" ADD COLUMN "primaryColor" TEXT;
ALTER TABLE "Organization" ADD COLUMN "secondaryColor" TEXT;

-- CreateTable
CREATE TABLE "ClientTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactPerson_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "depreciationYears" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "expirationDate" DATETIME,
    "serialNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ClientToClientTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClientToClientTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClientToClientTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ClientTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "variableSymbol" TEXT,
    "counterAccount" TEXT,
    "accountName" TEXT,
    "invoiceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankMovement_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "BankIntegration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BankMovement" ("amount", "counterAccount", "createdAt", "currency", "date", "description", "id", "integrationId", "variableSymbol") SELECT "amount", "counterAccount", "createdAt", "currency", "date", "description", "id", "integrationId", "variableSymbol" FROM "BankMovement";
DROP TABLE "BankMovement";
ALTER TABLE "new_BankMovement" RENAME TO "BankMovement";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FAKTURA',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuedAt" DATETIME NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "taxDate" DATETIME,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "exchangeRate" REAL NOT NULL DEFAULT 1.0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "totalVat" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL DEFAULT 0,
    "overpaymentAmount" REAL DEFAULT 0,
    "notes" TEXT,
    "variableSymbol" TEXT,
    "constantSymbol" TEXT,
    "specificSymbol" TEXT,
    "bankDetailId" TEXT,
    "vatMode" TEXT NOT NULL DEFAULT 'STANDARD',
    "projectId" TEXT,
    "recurringInvoiceId" TEXT,
    "relatedId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isVatInclusive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_bankDetailId_fkey" FOREIGN KEY ("bankDetailId") REFERENCES "BankDetail" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("bankDetailId", "clientId", "constantSymbol", "createdAt", "currency", "discount", "dueAt", "exchangeRate", "id", "isLocked", "isVatInclusive", "issuedAt", "notes", "number", "organizationId", "projectId", "recurringInvoiceId", "relatedId", "specificSymbol", "status", "taxDate", "totalAmount", "totalVat", "type", "updatedAt", "variableSymbol") SELECT "bankDetailId", "clientId", "constantSymbol", "createdAt", "currency", "discount", "dueAt", "exchangeRate", "id", "isLocked", "isVatInclusive", "issuedAt", "notes", "number", "organizationId", "projectId", "recurringInvoiceId", "relatedId", "specificSymbol", "status", "taxDate", "totalAmount", "totalVat", "type", "updatedAt", "variableSymbol" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_organizationId_number_key" ON "Invoice"("organizationId", "number");
CREATE TABLE "new_Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "roleDefinitionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Membership_roleDefinitionId_fkey" FOREIGN KEY ("roleDefinitionId") REFERENCES "RoleDefinition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Membership" ("createdAt", "id", "organizationId", "role", "updatedAt", "userId") SELECT "createdAt", "id", "organizationId", "role", "updatedAt", "userId" FROM "Membership";
DROP TABLE "Membership";
ALTER TABLE "new_Membership" RENAME TO "Membership";
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "ean" TEXT,
    "price" REAL NOT NULL,
    "buyPrice" REAL NOT NULL DEFAULT 0,
    "sellPrice" REAL NOT NULL DEFAULT 0,
    "vatRate" REAL NOT NULL DEFAULT 21,
    "stockQuantity" REAL NOT NULL DEFAULT 0,
    "minStockLevel" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'ks',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "name", "organizationId", "price", "sku", "stockQuantity", "unit", "updatedAt", "vatRate") SELECT "createdAt", "description", "id", "name", "organizationId", "price", "sku", "stockQuantity", "unit", "updatedAt", "vatRate" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ClientTag_organizationId_name_key" ON "ClientTag"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_ClientToClientTag_AB_unique" ON "_ClientToClientTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientToClientTag_B_index" ON "_ClientToClientTag"("B");
