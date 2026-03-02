
import { prisma } from "@/lib/prisma";
import { Badge, Award, Trophy, Star } from "lucide-react";

// Helper to check badges
async function getUserBadges(userId: string, orgId: string) {
    const badges = [];

    // 1. "První krok" - First invoice created
    const invoiceCount = await prisma.invoice.count({
        where: { organizationId: orgId }
    });
    if (invoiceCount > 0) {
        badges.push({
            id: "first-invoice",
            name: "První krok",
            description: "Vystavili jste první fakturu",
            icon: <Star className="h-5 w-5 text-yellow-500" />,
            color: "bg-yellow-100 text-yellow-800"
        });
    }

    // 2. "Milionář" - Revenue > 1M
    const revenue = await prisma.invoice.aggregate({
        where: { 
            organizationId: orgId,
            status: { not: "CANCELLED" }
        },
        _sum: { totalAmount: true }
    });
    if ((revenue._sum.totalAmount || 0) > 1000000) {
        badges.push({
            id: "millionaire",
            name: "Milionář",
            description: "Obrat přesáhl 1 milion",
            icon: <Trophy className="h-5 w-5 text-amber-600" />,
            color: "bg-amber-100 text-amber-800"
        });
    }

    // 3. "Poctivý plátce" - Check expenses paid on time (mock logic for now as we track expense payment date vs due date)
    // Let's use "Aktivní uživatel" - 100 invoices
    if (invoiceCount >= 100) {
        badges.push({
            id: "power-user",
            name: "Power User",
            description: "Vystaveno 100+ faktur",
            icon: <Award className="h-5 w-5 text-purple-600" />,
            color: "bg-purple-100 text-purple-800"
        });
    }

    return badges;
}

export async function BadgesWidget({ userId, orgId }: { userId: string, orgId: string }) {
    const badges = await getUserBadges(userId, orgId);

    if (badges.length === 0) return null;

    return (
        <div className="bg-card rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Moje úspěchy
            </h3>
            <div className="flex flex-wrap gap-3">
                {badges.map(badge => (
                    <div key={badge.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`} title={badge.description}>
                        {badge.icon}
                        {badge.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
