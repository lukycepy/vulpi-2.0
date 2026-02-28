"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function InvoiceStatusFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const currentStatus = searchParams.get("status") || "ALL";

  const statuses = [
    { value: "ALL", label: "Vše" },
    { value: "DRAFT", label: "Návrh" },
    { value: "ISSUED", label: "Vystaveno" },
    { value: "PAID", label: "Zaplaceno" },
    { value: "PARTIAL", label: "Částečně" },
    { value: "OVERDUE", label: "Po splatnosti" }, // Special handling needed in query
    { value: "CANCELLED", label: "Zrušeno" },
  ];

  return (
    <div className="flex gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => handleFilter(status.value)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            currentStatus === status.value
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
