import { FoxSpinner } from "@/components/fox/FoxSpinner";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <FoxSpinner size="lg" />
    </div>
  );
}
