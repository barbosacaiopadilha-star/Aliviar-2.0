import type { PipelineReviewCase, PipelineResult } from "./types";
import type { PublicationPipeline } from "./pipeline";

export function collectPipelineReviewCases(results: PipelineResult[]): PipelineReviewCase[] {
  return results
    .map((result) => result.reviewCase)
    .filter((reviewCase): reviewCase is PipelineReviewCase => Boolean(reviewCase));
}

export function runPipelineForAutoPublishCandidates(
  pipeline: PublicationPipeline,
  items: Array<{
    input: Parameters<PublicationPipeline["execute"]>[0];
  }>,
): { results: PipelineResult[]; reviewCases: PipelineReviewCase[] } {
  const results = items.map((item) => pipeline.execute(item.input));
  return {
    results,
    reviewCases: collectPipelineReviewCases(results),
  };
}
