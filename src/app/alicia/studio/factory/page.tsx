import { getFactoryCenterSnapshot } from "@/alicia/factory/studio-adapter";
import { FactoryCenter } from "@/components/alicia/studio/FactoryCenter";

export default async function AliciaStudioFactoryPage() {
  const snapshot = await getFactoryCenterSnapshot();
  return <FactoryCenter snapshot={snapshot} />;
}
