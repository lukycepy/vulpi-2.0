"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-4 bg-white min-h-screen">
      <SwaggerUI url="/openapi.json" />
    </div>
  );
}
