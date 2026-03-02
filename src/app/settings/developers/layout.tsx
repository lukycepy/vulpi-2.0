import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Code, Webhook, Key } from "lucide-react";

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Code className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Pro vývojáře</h1>
          <p className="text-muted-foreground">Správa API klíčů a webhooků pro integraci s Vulpi.</p>
        </div>
      </div>

      <div className="mb-8">
        <Tabs defaultValue="webhooks">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <Link href="/settings/developers/webhooks" passHref legacyBehavior>
              <TabsTrigger value="webhooks" className="flex items-center gap-2 cursor-pointer">
                <Webhook className="h-4 w-4" />
                Webhooky
              </TabsTrigger>
            </Link>
            <Link href="/settings/developers/api-keys" passHref legacyBehavior>
              <TabsTrigger value="api-keys" className="flex items-center gap-2 cursor-pointer">
                <Key className="h-4 w-4" />
                API klíče
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>

      <div>{children}</div>
    </div>
  );
}
