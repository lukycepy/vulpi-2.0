
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, FileText, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-permissions";
import { redirect } from "next/navigation";

import { Search } from "@/components/ui/Search";
import { InvoiceStatusFilter } from "@/components/invoices/InvoiceStatusFilter";
import { BulkExportButton } from "@/components/invoices/BulkExportButton";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    status?: string;
  }>;
}

export default async function InvoicesPage(props: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    select: { organizationId: true, role: true }
  });

  if (!membership) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Nemáte přiřazenou žádnou organizaci.
        </div>
      </div>
    );
  }

  // Department Isolation
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { department: true }
  });

  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  const status = searchParams.status || "ALL";

  const where: any = {
    organizationId: membership.organizationId
  };

  // If user has a department and is NOT Admin/Manager, filter by department
  // Assuming roles: ADMIN, MANAGER see all. USER, ACCOUNTANT, etc. see only their department if set.
  // Ideally, this logic should be in a centralized permission service or Policy.
  // For now:
  if (currentUser?.department && !["ADMIN", "MANAGER", "SUPERADMIN"].includes(membership.role)) {
      where.department = currentUser.department;
  }

  if (query) {
    where.OR = [
      { number: { contains: query } },
      { client: { name: { contains: query } } },
    ];
  }

  if (status && status !== "ALL") {
    if (status === "OVERDUE") {
      where.status = { notIn: ["PAID", "CANCELLED"] };
      where.dueAt = { lt: new Date() };
    } else {
      where.status = status;
    }
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: true,
    },
    orderBy: [
        { isPinned: "desc" },
        { issuedAt: "desc" }
      ],
  });

  const getStatusBadge = (status: string, dueAt: Date) => {
    const isOverdue = new Date() > new Date(dueAt) && status !== "PAID" && status !== "CANCELLED";
    
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Po splatnosti
        </span>
      );
    }

    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="w-3 h-3 mr-1" />
            Návrh
          </span>
        );
      case "ISSUED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Vystaveno
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Zaplaceno
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Zrušeno
          </span>
        );
      case "PARTIAL":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Částečně
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faktury</h1>
          <p className="text-muted-foreground mt-2">Přehled všech vystavených faktur a jejich stavů.</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nová faktura
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="w-full md:w-1/3">
          <Search placeholder="Hledat faktury..." />
        </div>
        <div className="flex gap-2">
          <InvoiceStatusFilter />
          <BulkExportButton searchParams={searchParams} organizationId={membership.organizationId} />
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Číslo</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Klient</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vystaveno</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Splatnost</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Částka</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Stav</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Akce</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState 
                      title="Žádné faktury"
                      description={
                        query || status !== "ALL" 
                          ? "Pro zadané filtry nebyly nalezeny žádné faktury." 
                          : "Zatím nebyly vytvořeny žádné faktury."
                      }
                      action={
                        !(query || status !== "ALL") ? {
                          label: "Vytvořit první fakturu",
                          href: "/invoices/new"
                        } : undefined
                      }
                      className="border-0 bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-4 align-middle font-medium flex items-center gap-2">
                      <PinInvoiceButton id={invoice.id} isPinned={invoice.isPinned} />
                      {invoice.number}
                    </td>
                    <td className="p-4 align-middle">{invoice.client.name}</td>
                    <td className="p-4 align-middle">{formatDate(invoice.issuedAt)}</td>
                    <td className="p-4 align-middle">{formatDate(invoice.dueAt)}</td>
                    <td className="p-4 align-middle text-right font-medium">
                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                      {invoice.status === "PARTIAL" && (invoice.paidAmount ?? 0) > 0 && (
                        <div className="text-xs text-orange-600">
                          Zbývá: {formatCurrency(invoice.totalAmount - (invoice.paidAmount ?? 0), invoice.currency)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle text-center">
                      {getStatusBadge(invoice.status, invoice.dueAt)}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
