
import { prisma } from "@/lib/prisma";

export async function getActiveTimeEntry(userId: string) {
  return await prisma.timeEntry.findFirst({
    where: {
      userId,
      endTime: null
    },
    include: {
      project: true
    }
  });
}

export async function getUserProjects(userId: string) {
    // In a real app, check permissions. For now, get all organization projects.
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { memberships: true }});
    if (!user || user.memberships.length === 0) return [];
    
    return await prisma.project.findMany({
        where: {
            organizationId: user.memberships[0].organizationId,
            status: "ACTIVE"
        }
    });
}

export async function getTimeEntries(userId: string, limit: number = 50) {
  return await prisma.timeEntry.findMany({
    where: {
      userId,
      endTime: { not: null }
    },
    orderBy: { startTime: "desc" },
    take: limit,
    include: {
      project: true
    }
  });
}
