
"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth-permissions";
import { revalidatePath } from "next/cache";

interface InventoryCheckItem {
  productId: string;
  actualQuantity: number;
}

export async function submitInventoryCheck(organizationId: string, actualStocks: InventoryCheckItem[]) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Nejste přihlášen");
  }

  // Verify permission
  const hasAccess = await hasPermission(user.id, organizationId, "manage_inventory");
  if (!hasAccess) {
    throw new Error("Nemáte oprávnění spravovat sklad");
  }

  // Process all items in a transaction
  await prisma.$transaction(async (tx) => {
    for (const item of actualStocks) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });

      if (!product || product.organizationId !== organizationId) {
        continue; // Skip invalid products
      }

      const diff = item.actualQuantity - product.stockQuantity;

      if (Math.abs(diff) > 0.0001) {
        // Create movement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: diff > 0 ? "IN" : "OUT",
            quantity: Math.abs(diff),
            note: "Inventurní rozdíl",
            date: new Date()
          }
        });

        // Update product stock
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: item.actualQuantity }
        });
      }
    }
  });

  revalidatePath("/inventory");
  return { success: true };
}

export async function createProduct(data: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await hasPermission(user.id, data.organizationId, "manage_inventory");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.product.create({
        data: {
            organizationId: data.organizationId,
            name: data.name,
            sku: data.sku,
            unit: data.unit,
            buyPrice: parseFloat(data.buyPrice),
            sellPrice: parseFloat(data.sellPrice),
            minStockLevel: parseFloat(data.minStockLevel),
            stockQuantity: parseFloat(data.stockQuantity || 0)
        }
    });
    revalidatePath("/inventory");
}

export async function createStockMovement(data: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    
    // We need to fetch product to check org permission
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found");

    const hasAccess = await hasPermission(user.id, product.organizationId, "manage_inventory");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.$transaction(async (tx) => {
        await tx.stockMovement.create({
            data: {
                productId: data.productId,
                type: data.type,
                quantity: parseFloat(data.quantity),
                note: data.note,
                date: new Date()
            }
        });

        const change = data.type === "IN" ? parseFloat(data.quantity) : -parseFloat(data.quantity);
        await tx.product.update({
            where: { id: data.productId },
            data: { stockQuantity: { increment: change } }
        });
    });
    revalidatePath("/inventory");
}

export async function createVehicle(data: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const hasAccess = await hasPermission(user.id, data.organizationId, "manage_inventory");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.vehicle.create({
        data: {
            organizationId: data.organizationId,
            name: data.name,
            plate: data.plate,
            fuelType: data.fuelType
        }
    });
    revalidatePath("/inventory/vehicles");
}

export async function createVehicleLog(data: any) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new Error("Vehicle not found");

    const hasAccess = await hasPermission(user.id, vehicle.organizationId, "manage_inventory");
    if (!hasAccess) throw new Error("Permission denied");

    await prisma.vehicleLog.create({
        data: {
            vehicleId: data.vehicleId,
            date: new Date(data.date),
            startKm: parseFloat(data.startKm),
            endKm: parseFloat(data.endKm),
            distance: parseFloat(data.endKm) - parseFloat(data.startKm),
            purpose: data.purpose,
            from: data.from,
            to: data.to
        }
    });
    revalidatePath("/inventory/vehicles");
}
