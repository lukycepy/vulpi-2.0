"use server";

import { prisma } from "@/lib/prisma";
import { createCategory, deleteCategory } from "@/actions/expenses";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await prisma.expenseCategory.findMany();

  return (
    <div className="container mx-auto p-8 max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/expenses" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Kategorie výdajů</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Nová kategorie</h2>
            <form action={async (formData: FormData) => {
                "use server";
                const name = formData.get("name") as string;
                const color = formData.get("color") as string;
                await createCategory(name, color);
            }} className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Název</label>
                    <input name="name" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Např. Kancelář" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Barva</label>
                    <div className="flex gap-2">
                        <input type="color" name="color" defaultValue="#3b82f6" className="h-10 w-20 p-1 rounded-md border cursor-pointer" />
                        <span className="text-xs text-muted-foreground self-center">Vyberte barvu pro štítek</span>
                    </div>
                </div>
                <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md font-medium">
                    Přidat kategorii
                </button>
            </form>
        </div>

        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Existující kategorie</h2>
            <div className="bg-card rounded-lg border shadow-sm divide-y">
                {categories.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">Žádné kategorie</div>
                ) : (
                    categories.map((cat) => (
                        <div key={cat.id} className="p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color || '#ccc' }} />
                                <span className="font-medium">{cat.name}</span>
                            </div>
                            <form action={async () => {
                                "use server";
                                await deleteCategory(cat.id);
                            }}>
                                <button className="text-red-500 hover:text-red-700 p-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
