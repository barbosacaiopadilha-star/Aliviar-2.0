import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import type { ProfileQualityIndicators, ReviewQueueItem, ValidationIssue } from "../types";
import { isProfileComplete } from "../quality/profile-quality";

function createReviewItem(
  doctorId: string,
  reason: string,
  createdAt: string,
  field?: string,
  priority: ReviewQueueItem["priority"] = "medium",
): ReviewQueueItem {
  return {
    id: `review:${doctorId}:${field ?? reason}:${createdAt}`,
    doctorId,
    reason,
    field,
    createdAt,
    status: "open",
    priority,
  };
}

export function buildReviewQueue(
  records: DoctorImportRecord[],
  issues: ValidationIssue[],
  qualities: Map<string, ProfileQualityIndicators>,
  referenceDate: string,
): ReviewQueueItem[] {
  const queue: ReviewQueueItem[] = [];

  records.forEach((record) => {
    const quality = qualities.get(record.id);
    if (!quality) {
      return;
    }

    record.transparency.unverifiedFields.forEach((field) => {
      queue.push(
        createReviewItem(
          record.id,
          `Campo não confirmado: ${field}`,
          referenceDate,
          field,
          "high",
        ),
      );
    });

    if (!isProfileComplete(quality)) {
      queue.push(
        createReviewItem(
          record.id,
          "Perfil abaixo do limiar operacional de completude.",
          referenceDate,
          undefined,
          "medium",
        ),
      );
    }

    if (quality.sourceCount < 2) {
      queue.push(
        createReviewItem(
          record.id,
          "Quantidade de fontes abaixo do mínimo operacional.",
          referenceDate,
          "transparency.sources",
          "high",
        ),
      );
    }
  });

  issues
    .filter((issue) => issue.severity !== "info")
    .forEach((issue) => {
      if (!issue.doctorId) {
        return;
      }

      queue.push(
        createReviewItem(
          issue.doctorId,
          issue.message,
          referenceDate,
          issue.field,
          issue.severity === "error" ? "high" : "medium",
        ),
      );
    });

  const unique = new Map<string, ReviewQueueItem>();
  queue.forEach((item) => {
    unique.set(item.id, item);
  });

  return [...unique.values()];
}

export function countOpenReviewItems(queue: ReviewQueueItem[]): number {
  return queue.filter((item) => item.status === "open").length;
}
