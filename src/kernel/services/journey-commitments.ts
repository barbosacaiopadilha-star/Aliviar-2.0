import type { CommitmentRepositoryPort } from "../commitments/commitment-record";
import type { JourneyKernelRepositoryPort } from "../ports/kernel-ports";
import type { KernelActor } from "../rbac/authorization";
import { authorize, authorizePatientOwnership } from "../rbac/authorization";
import type { KernelServiceResult } from "./create-journey";

export interface CreateCommitmentServiceInput {
  journeyId: string;
  actor: KernelActor;
  title: string;
  assignedTo: string;
  dueDate?: string | null;
}

export interface CreateCommitmentServiceOutput {
  commitmentId: string;
}

export interface CommitmentServiceDependencies {
  journeyRepository: JourneyKernelRepositoryPort;
  commitmentRepository: CommitmentRepositoryPort;
}

export async function createCommitment(
  deps: CommitmentServiceDependencies,
  input: CreateCommitmentServiceInput,
): Promise<KernelServiceResult<CreateCommitmentServiceOutput>> {
  const auth = authorize(input.actor, "journey.commitments.create");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const record = await deps.commitmentRepository.create({
    journeyId: input.journeyId,
    title: input.title,
    assignedTo: input.assignedTo,
    dueDate: input.dueDate,
    origin: "MANUAL",
    createdBy: input.actor.id,
  });

  return { ok: true, value: { commitmentId: record.id } };
}

export interface CompleteCommitmentServiceInput {
  journeyId: string;
  commitmentId: string;
  actor: KernelActor;
  occurredAt: string;
}

export interface CompleteCommitmentServiceOutput {
  commitmentId: string;
  status: "COMPLETED";
}

export async function completeCommitment(
  deps: CommitmentServiceDependencies,
  input: CompleteCommitmentServiceInput,
): Promise<KernelServiceResult<CompleteCommitmentServiceOutput>> {
  const auth = authorize(input.actor, "journey.commitments.complete");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const commitment = await deps.commitmentRepository.findById(input.commitmentId);
  if (!commitment || commitment.journeyId !== input.journeyId) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Compromisso n├úo encontrado." } };
  }

  const updated = await deps.commitmentRepository.updateStatus(
    input.commitmentId,
    "COMPLETED",
    input.occurredAt,
  );

  return { ok: true, value: { commitmentId: updated.id, status: "COMPLETED" } };
}

export interface ListCommitmentsInput {
  journeyId: string;
  actor: KernelActor;
}

export async function listCommitments(
  deps: CommitmentServiceDependencies,
  input: ListCommitmentsInput,
): Promise<KernelServiceResult<{ commitments: Awaited<ReturnType<CommitmentRepositoryPort["listByJourney"]>> }>> {
  const auth = authorize(input.actor, "journey.commitments.read");
  if (!auth.ok) {
    return { ok: false, error: { code: "FORBIDDEN", message: auth.message } };
  }

  const snapshot = await deps.journeyRepository.findById(input.journeyId);
  if (!snapshot) {
    return { ok: false, error: { code: "DOMAIN_ERROR", message: "Jornada n├úo encontrada." } };
  }

  const ownership = authorizePatientOwnership(input.actor, snapshot.patientId);
  if (!ownership.ok) {
    return { ok: false, error: { code: "OWNERSHIP_REQUIRED", message: ownership.message } };
  }

  const commitments = await deps.commitmentRepository.listByJourney(input.journeyId);
  return { ok: true, value: { commitments } };
}
