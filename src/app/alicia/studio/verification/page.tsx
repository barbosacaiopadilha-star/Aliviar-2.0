import { getVerificationCenterSnapshot } from "@/alicia/verification/studio-adapter";
import { VerificationCenter } from "@/components/alicia/studio/VerificationCenter";

export default async function AliciaStudioVerificationPage() {
  const snapshot = await getVerificationCenterSnapshot();
  return <VerificationCenter snapshot={snapshot} />;
}
