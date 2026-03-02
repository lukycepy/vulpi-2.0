import { getAssets } from "@/actions/assets";
import AssetList from "@/components/expenses/AssetList";

export default async function AssetsPage() {
  const assets = await getAssets();
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Evidence majetku</h1>
      <AssetList initialAssets={assets} />
    </div>
  );
}
