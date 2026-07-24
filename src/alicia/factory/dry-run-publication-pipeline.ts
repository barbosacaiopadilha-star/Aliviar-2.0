import type { PipelineInput, PipelineResult } from "@/alicia/publication-pipeline";
import { PublicationPipeline } from "@/alicia/publication-pipeline";

/**
 * Wrapper que simula publicação sem persistir — usado em Dry Run.
 * Não altera o PublicationPipeline original.
 */
export class DryRunPublicationPipeline extends PublicationPipeline {
  execute(input: PipelineInput): PipelineResult {
    if (input.decision.outcome !== "AUTO_PUBLISH") {
      return super.execute(input);
    }

    return {
      status: "NO_CHANGE",
      message: "Dry run — publicação simulada, nenhum dado persistido.",
      snapshotId: `dry-run-${input.candidate.id}`,
      updateClassification: "NO_CHANGE",
    };
  }
}
