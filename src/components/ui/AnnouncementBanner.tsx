
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Info, XCircle } from "lucide-react";

export async function AnnouncementBanner() {
  // @ts-ignore - Prisma types might be out of sync
  const activeAnnouncement = await prisma.globalAnnouncement.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" }
  });

  if (!activeAnnouncement) return null;

  const styles = {
    INFO: "bg-blue-600 text-white",
    WARNING: "bg-yellow-500 text-white",
    ERROR: "bg-red-600 text-white"
  };

  const icons = {
    INFO: <Info className="h-4 w-4" />,
    WARNING: <AlertTriangle className="h-4 w-4" />,
    ERROR: <XCircle className="h-4 w-4" />
  };

  // @ts-ignore
  const style = styles[activeAnnouncement.type] || styles.INFO;
  // @ts-ignore
  const icon = icons[activeAnnouncement.type] || icons.INFO;

  return (
    <div className={`${style} px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium`}>
      {icon}
      <span>{activeAnnouncement.message}</span>
    </div>
  );
}
