"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { TimeSheetPDF } from "./TimeSheetPDF";
import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Invoice, Organization, Client, Project, TimeEntry, User } from "@prisma/client";

interface DownloadTimeSheetButtonProps {
  invoice: Invoice & {
    organization: Organization;
    client: Client;
  };
  project: Project;
  timeEntries: (TimeEntry & { user: User })[];
}

export function DownloadTimeSheetButton({ invoice, project, timeEntries }: DownloadTimeSheetButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Načítám...
      </button>
    );
  }

  if (timeEntries.length === 0) {
    return null;
  }

  return (
    <PDFDownloadLink
      document={<TimeSheetPDF invoice={invoice} project={project} timeEntries={timeEntries} />}
      fileName={`vykaz-prace-${invoice.number}.pdf`}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generuji...
          </>
        ) : (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Výkaz práce
          </>
        )
      }
    </PDFDownloadLink>
  );
}
