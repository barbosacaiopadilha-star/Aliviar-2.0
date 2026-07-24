import { INTERNAL_SENTINELS } from "./constants";
import { hashPayload } from "./hash";
import type { PublicationRepository } from "./ports/publication-repository";
import type { ImmutableSnapshot, PostPublishVerificationResult } from "./types";

export function verifyPublishedProfile(
  repository: PublicationRepository,
  snapshot: ImmutableSnapshot,
): PostPublishVerificationResult {
  const checks: PostPublishVerificationResult["checks"] = [];
  const published = repository.findPublishedByDoctorId(snapshot.doctorId);

  checks.push({
    name: "catalog_retrievable",
    passed: Boolean(published),
    message: published ? undefined : "Perfil não recuperável após publicação.",
  });

  checks.push({
    name: "public_route_resolvable",
    passed: Boolean(published?.id),
    message: "Rota pública depende de id/slug presente.",
  });

  if (published) {
    checks.push({
      name: "specialty_correct",
      passed: published.specialty === snapshot.payload.specialty,
    });
    checks.push({
      name: "city_correct",
      passed: published.location.city === snapshot.payload.location.city,
    });
    checks.push({
      name: "sources_present",
      passed: published.transparency.sources.length >= snapshot.payload.transparency.sources.length,
    });
    checks.push({
      name: "no_internal_sentinel",
      passed: !JSON.stringify(published).match(/__PRIVATE__|__INTERNAL__/),
    });
    checks.push({
      name: "payload_matches_snapshot",
      passed: hashPayload(published) === snapshot.deterministicHash,
      message: "Payload publicado difere do snapshot.",
    });
    checks.push({
      name: "no_private_fields",
      passed: !Object.keys(published as unknown as Record<string, unknown>).some((key) =>
        [...INTERNAL_SENTINELS].includes(key),
      ),
    });
  }

  const failed = checks.filter((check) => !check.passed);
  return {
    status: failed.length === 0 ? "PUBLICATION_VERIFIED" : "PUBLICATION_INCONSISTENT",
    checks,
  };
}
