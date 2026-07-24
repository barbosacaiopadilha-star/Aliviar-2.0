import { getOperationsCenterSnapshot } from "@/alicia/operations/studio-adapter";
import { OperationsCenter } from "@/components/alicia/studio/OperationsCenter";

export default async function AliciaStudioOperationsPage() {
  const snapshot = await getOperationsCenterSnapshot();
  return <OperationsCenter snapshot={snapshot} />;
}
