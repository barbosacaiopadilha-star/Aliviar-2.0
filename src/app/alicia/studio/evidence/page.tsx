import { getEvidenceExplorerSnapshot } from "@/alicia/evidence-acquisition/studio-adapter";
import { EvidenceExplorer } from "@/components/alicia/studio/EvidenceExplorer";

export default async function AliciaStudioEvidencePage() {
  const snapshot = await getEvidenceExplorerSnapshot();
  return <EvidenceExplorer snapshot={snapshot} />;
}
