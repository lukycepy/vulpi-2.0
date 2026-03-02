import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="w-64 h-64 mb-8 relative">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-primary">
            <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
            <path fill="currentColor" d="M100 40 L60 110 L40 90 L20 120 L100 180 L180 120 L160 90 L140 110 L100 40 Z" />
            <circle cx="75" cy="100" r="8" fill="white" />
            <circle cx="125" cy="100" r="8" fill="white" />
            <circle cx="75" cy="100" r="3" fill="#0f172a" />
            <circle cx="125" cy="100" r="3" fill="#0f172a" />
            <path d="M85 130 Q100 145 115 130" stroke="white" strokeWidth="3" fill="none" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-primary">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Liška nenašla cestu</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Stránka, kterou hledáte, se pravděpodobně schovala do nory nebo nikdy neexistovala.
      </p>
      
      <Button asChild size="lg">
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          Zpět na nástěnku
        </Link>
      </Button>
    </div>
  );
}
