import { CandidateDetail } from "@/components/alicia/studio/CandidateDetail";

export default async function AliciaStudioCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CandidateDetail candidateId={id} />;
}
