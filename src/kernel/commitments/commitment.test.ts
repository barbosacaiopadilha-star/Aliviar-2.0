import { describe, expect, it } from "vitest";

import { InMemoryCommitmentRepository } from "../infrastructure/in-memory-commitment-repository";

describe("kernel commitments (K03)", () => {
  it("cria compromisso com origem, respons├ível e situa├º├úo inicial", async () => {
    const repo = new InMemoryCommitmentRepository();

    const record = await repo.create({
      journeyId: "j-1",
      title: "Retornar contato ao paciente",
      assignedTo: "staff-1",
      dueDate: "2026-08-01",
      origin: "OPERATION",
      createdBy: "staff-2",
    });

    expect(record.status).toBe("PENDING");
    expect(record.origin).toBe("OPERATION");
    expect(record.assignedTo).toBe("staff-1");
    expect(record.dueDate).toBe("2026-08-01");
  });

  it("rejeita transi├º├úo inv├ílida de status", async () => {
    const repo = new InMemoryCommitmentRepository();
    const record = await repo.create({
      journeyId: "j-1",
      title: "Compromisso de teste",
      assignedTo: "staff-1",
      origin: "MANUAL",
      createdBy: "staff-1",
    });

    await expect(
      repo.updateStatus(record.id, "IN_PROGRESS", "2026-07-22T12:00:00.000Z"),
    ).resolves.toMatchObject({ status: "IN_PROGRESS" });

    await expect(
      repo.updateStatus(record.id, "PENDING", "2026-07-22T12:01:00.000Z"),
    ).rejects.toThrow(/Transi├º├úo inv├ílida/);
  });
});
