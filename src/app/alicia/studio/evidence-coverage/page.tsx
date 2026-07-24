import { getEvidenceCoverageSnapshot } from "@/alicia/evidence-coverage/studio-adapter";
import { EvidenceCoverageCenter } from "@/components/alicia/studio/EvidenceCoverageCenter";

export default async function AliciaStudioEvidenceCoveragePage() {
  const snapshot = await getEvidenceCoverageSnapshot({ refresh: true });
  return <EvidenceCoverageCenter snapshot={snapshot} />;
}
