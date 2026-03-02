"use client";

import dynamic from "next/dynamic";

// Dynamically import DownloadPDFButton to avoid SSR issues with @react-pdf/renderer
export const DownloadPDFButtonClient = dynamic(
  () => import("@/components/invoices/DownloadPDFButton").then((mod) => mod.DownloadPDFButton),
  { ssr: false }
);

export const DownloadTimeSheetButtonClient = dynamic(
  () => import("@/components/invoices/DownloadTimeSheetButton").then((mod) => mod.DownloadTimeSheetButton),
  { ssr: false }
);
