"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageInventory = await hasPermission(user.id, orgId, "manage_inventory");
  if (!canManageInventory) {
    throw new Error("Nemáte oprávnění pro správu skladu.");
  }

  const canViewMargins = await hasPermission(user.id, orgId, "view_margins");

  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const ean = formData.get("ean") as string;
  const unit = formData.get("unit") as string;
  let buyPrice = parseFloat(formData.get("buyPrice") as string);
  const sellPrice = parseFloat(formData.get("sellPrice") as string);
  const minStockLevel = parseFloat(formData.get("minStockLevel") as string);
  const stockQuantity = parseFloat(formData.get("stockQuantity") as string);
  const initialStock = isNaN(stockQuantity) ? 0 : stockQuantity;

  // If user cannot view margins, they cannot set buy price
  if (!canViewMargins) {
    buyPrice = 0;
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        organizationId: orgId,
        name,
        sku: sku || null,
        ean: ean || null,
        unit: unit || "ks",
        buyPrice: isNaN(buyPrice) ? 0 : buyPrice,
        sellPrice: isNaN(sellPrice) ? 0 : sellPrice,
        minStockLevel: isNaN(minStockLevel) ? 0 : minStockLevel,
        stockQuantity: initialStock,
      }
    });

    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: initialStock,
          note: "Počáteční stav",
        }
      });
    }
  });

  revalidatePath("/inventory");
}

export async function createStockMovement(formData: FormData) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;
  
  const canManageInventory = await hasPermission(user.id, orgId, "manage_inventory");
  if (!canManageInventory) {
    throw new Error("Nemáte oprávnění pro správu skladu.");
  }

  const productId = formData.get("productId") as string;
  const type = formData.get("type") as string; // "IN" | "OUT"
  const quantity = parseFloat(formData.get("quantity") as string);
  const note = formData.get("note") as string;

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  // Transaction to ensure stock is updated correctly
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found");

    if (product.organizationId !== orgId) {
      throw new Error("Product not found in this organization");
    }

    // Update stock
    const newStock = type === "IN" 
      ? product.stockQuantity + quantity 
      : product.stockQuantity - quantity;

    if (newStock < 0) {
      throw new Error("Nedostatek zboží na skladě");
    }

    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newStock }
    });

    await tx.stockMovement.create({
      data: {
        productId: productId,
        type: type as "IN" | "OUT",
        quantity: quantity,
        note: note || null,
      }
    });
  });

  revalidatePath("/inventory");
}

export async function createVehicle(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id }
  });
  
  if (!membership) throw new Error("Membership not found");
  const orgId = membership.organizationId;

  const canManageInventory = await hasPermission(user.id, orgId, "manage_inventory");
  if (!canManageInventory) {
    throw new Error("Nemáte oprávnění pro správu skladu.");
  }

  const name = formData.get("name") as string;
  const plate = formData.get("plate") as string;
  const fuelType = formData.get("fuelType") as string;

  await prisma.vehicle.create({
    data: {
      organizationId: orgId,
      name,
      plate,
      fuelType: fuelType || null,
    }
  });

  revalidatePath("/inventory/vehicles");
}

export async function createVehicleLog(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const vehicleId = formData.get("vehicleId") as string;
  
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId }
  });

  if (!vehicle) throw new Error("Vehicle not found");

  const canManageInventory = await hasPermission(user.id, vehicle.organizationId, "manage_inventory");
  if (!canManageInventory) {
    throw new Error("Nemáte oprávnění pro správu vozového parku.");
  }

  const date = new Date(formData.get("date") as string);
  const startKm = parseFloat(formData.get("startKm") as string);
  const endKm = parseFloat(formData.get("endKm") as string);
  const purpose = formData.get("purpose") as string;
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;

  const distance = endKm - startKm;

  if (distance < 0) {
    throw new Error("Konečný stav tachometru musí být vyšší než počáteční");
  }

  await prisma.vehicleLog.create({
    data: {
      vehicleId,
      date,
      startKm,
      endKm,
      distance,
      purpose: purpose || null,
      from,
      to
    }
  });

  revalidatePath("/inventory/vehicles");
}
