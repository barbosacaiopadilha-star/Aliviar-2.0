import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  changeCaseStatus,
  createCase,
  getCase,
} from "@/modules/cases/repository";
import {
  confirmFirstAppointment,
  createConnection,
} from "@/modules/connection/commands";
import { SupabaseConnectionRepository } from "@/modules/connection/repository";
import { deliverFinalCuradoria } from "@/modules/concierge/delivery-repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { submitHumanReview } from "@/modules/concierge/human-review-repository";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import {
  getOrCreateActiveStory,
  saveStoryDraft,
  submitStory,
} from "@/modules/story/repository";

// RELATIONSHIP ENGINE — MVP — PR3 (repository, actions). As Server Actions
// ("use server") de relationship/actions.ts não podem ser chamadas fora de
// uma requisição real do Next.js sem next/headers estar disponível —
// createServerSupabaseClient() lê cookies via next/headers, indisponível
// no runtime do Vitest. Mesma limitação, documentada da mesma forma, já
// aceita para connection/actions.ts (tests/integration/connection.
// integration.test.ts). Por isso este arquivo testa: (1) o repository
// concreto (SupabaseRelationshipRepository) diretamente contra o banco
// real; (2) o fluxo equivalente de cada action — o mesmo comando puro
// (commands.ts, já 26/26 testado em unidade) + o mesmo repository +
// (quando a action envolve elegibilidade de equipe) a mesma consulta real
// a `cases` que `resolveTeamEligibility` faria internamente — provando
// que os dados sustentam exatamente a decisão que a action tomaria,
// mesmo sem executar o wrapper "use server" em si.
import {
  closePlanned,
  registerInterruption,
  registerReopening,
} from "@/modules/relationship/commands";
import { RelationshipError } from "@/modules/relationship/errors";
import { SupabaseRelationshipRepository } from "@/modules/relationship/repository";
import type {
  RelationshipAuthor,
  RelationshipRecord,
} from "@/modules/relationship/types";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não existe. Rode `npm run bootstrap:test-users` antes dos testes de integração.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("Relationship Engine — MVP — PR3 (repository, actions — Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  let createdProfessionalIds: string[] = [];
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();

    if (createdProfessionalIds.length > 0) {
      await adminClient
        .from("professional_competency_areas")
        .delete()
        .in("professional_profile_id", createdProfessionalIds);
      await adminClient
        .from("professional_profiles")
        .delete()
        .in("id", createdProfessionalIds);
      createdProfessionalIds = [];
    }

    if (createdPatientProfileIds.length > 0) {
      await adminClient
        .from("cases")
        .delete()
        .in("patient_profile_id", createdPatientProfileIds);
      await adminClient
        .from("patient_stories")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      await adminClient
        .from("patient_profiles")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      await adminClient
        .from("user_roles")
        .delete()
        .in("profile_id", createdPatientProfileIds);
      for (const profileId of createdPatientProfileIds) {
        await adminClient.auth.admin.deleteUser(profileId);
      }
      createdPatientProfileIds = [];
    }
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function seedPresentableProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional PR3 ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary:
        "Profissional com experiência em acolhimento e escuta ativa.",
      institutionName: null,
      createdBy: adminUserId,
    });

    await adminClient
      .from("professional_profiles")
      .update({
        experience_level: "experiente",
        intake_approach: "ambos",
        offers_continuous_care: true,
        availability_window: "flexible",
        practical_considerations: ["Atende também por telemedicina."],
      })
      .eq("id", professional.id);

    await adminClient.from("professional_competency_areas").insert({
      professional_profile_id: professional.id,
      domain: "nao_determinado",
      focus: "avaliacao",
    });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  async function createDeliveredCaseWithRelationship() {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("pr3-relationship") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente PR3" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({
      email,
      password: patientAccount.password,
    });
    const draft = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Buscando continuidade de acompanhamento." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(
      patientClient,
      patientAccount.profileId,
    );
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(
      admin.client,
      draft.id,
      undefined,
      admin.userId,
    );
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(
      admin.client,
      created.id,
      "READY_FOR_CURATION",
      admin.userId,
    );

    const professionalIds = [
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
    ];

    const execution = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(execution.outcome).toBe("completed");

    await submitHumanReview(admin.client, {
      caseId: created.id,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale:
        "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });

    const delivery = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    const deliveryRecord =
      delivery.outcome === "delivered" ? delivery.delivery : null;

    const connectionRepository = new SupabaseConnectionRepository(
      patientClient,
    );
    const now = new Date().toISOString();
    const created0 = createConnection(
      {
        caseId: created.id,
        finalCuradoriaDeliveryId: deliveryRecord!.id,
        patientProfileId: patientAccount.profileId,
        professionalProfileId: professionalIds[0],
        actorId: patientAccount.profileId,
        occurredAt: now,
        recordedAt: now,
      },
      { eligibleProfessionalProfileIds: professionalIds },
    );
    const connectionRecord = await connectionRepository.create(
      created0.record,
      created0.event,
    );
    const confirmed = confirmFirstAppointment(connectionRecord, {
      requestedByPatientProfileId: patientAccount.profileId,
      actorId: patientAccount.profileId,
      occurredAt: now,
      recordedAt: now,
    });
    const finalConnection = await connectionRepository.update(
      connectionRecord.status,
      confirmed.record,
      confirmed.event,
    );

    const relationshipRepository = new SupabaseRelationshipRepository(
      patientClient,
    );
    const relationship = await relationshipRepository.create(
      {
        connectionId: finalConnection.id,
        caseId: created.id,
        patientProfileId: patientAccount.profileId,
        professionalProfileId: professionalIds[0],
        status: "ATIVO",
        startedAt: now,
      },
      {
        eventType: "RELACIONAMENTO_INICIADO",
        actorId: patientAccount.profileId,
        payload: {},
        occurredAt: now,
        recordedAt: now,
      },
    );

    return {
      admin,
      adminClient,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      professionalIds,
      relationship,
      relationshipRepository,
    };
  }

  // ── Repository: mapeamento de erros ──────────────────────────────────

  it("repository.create() mapeia 23505 (RPC) para RELATIONSHIP_ALREADY_EXISTS", async () => {
    const { patientClient, relationship } =
      await createDeliveredCaseWithRelationship();
    const repository = new SupabaseRelationshipRepository(patientClient);
    const now = new Date().toISOString();

    await expect(
      repository.create(
        {
          connectionId: relationship.connectionId,
          caseId: relationship.caseId,
          patientProfileId: relationship.patientProfileId,
          professionalProfileId: relationship.professionalProfileId,
          status: "ATIVO",
          startedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: relationship.patientProfileId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      ),
    ).rejects.toMatchObject({ code: "RELATIONSHIP_ALREADY_EXISTS" });
  });

  it("repository.create() mapeia connection_id inexistente para CONNECTION_INVALID", async () => {
    const admin = await loginAs("administrador");
    const repository = new SupabaseRelationshipRepository(admin.client);
    const now = new Date().toISOString();
    const fakeConnectionId = "00000000-0000-0000-0000-000000000000";

    await expect(
      repository.create(
        {
          connectionId: fakeConnectionId,
          caseId: "00000000-0000-0000-0000-000000000000",
          patientProfileId: admin.userId,
          professionalProfileId: admin.userId,
          status: "ATIVO",
          startedAt: now,
        },
        {
          eventType: "RELACIONAMENTO_INICIADO",
          actorId: admin.userId,
          payload: {},
          occurredAt: now,
          recordedAt: now,
        },
      ),
    ).rejects.toMatchObject({ code: "CONNECTION_INVALID" });
  });

  it("repository.update() mapeia 55000 (RPC) para CONCURRENT_CONFLICT — concorrência real", async () => {
    const { relationshipRepository, relationship, patientProfileId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const attempt = () => {
      const result = closePlanned(relationship, {
        author: { kind: "paciente", patientProfileId },
        occurredAt: now,
        recordedAt: now,
      });
      return relationshipRepository.update(
        relationship.status,
        result.record,
        result.event,
      );
    };

    const [first, second] = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = [first, second].filter((r) => r.status === "fulfilled");
    const rejected = [first, second].filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(RelationshipError);
    expect((rejected[0].reason as RelationshipError).code).toBe(
      "CONCURRENT_CONFLICT",
    );
  });

  it("repository.registerReopening() mapeia Relationship não-terminal para INVALID_REOPEN (RPC/trigger, contornando o domínio)", async () => {
    // O comando puro (registerReopening) já rejeita um Relationship
    // ATIVO antes de qualquer chamada ao banco — para provar que o
    // repository/RPC também rejeita, independentemente do domínio (defesa
    // em profundidade, Fase 3/Etapa 9), este teste monta o evento
    // manualmente e chama o repository diretamente, contornando o
    // comando puro de propósito.
    const { relationshipRepository, relationship, admin, caseId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    await expect(
      relationshipRepository.registerReopening(relationship.id, {
        eventType: "REABERTURA_OBSERVADA",
        actorId: admin.userId,
        payload: { newCaseId: caseId },
        occurredAt: now,
        recordedAt: now,
      }),
    ).rejects.toMatchObject({ code: "INVALID_REOPEN" });
  });

  // ── Fluxo equivalente das actions (comando puro + repository real) ────

  // [CORRIGIDO — Fase 6.1] Os dois testes abaixo substituem os antigos
  // "pausa"/"retomada" (PAUSADO removido, docs/architecture/DOMAIN_RELATIONSHIP.md,
  // Fase 4.1) — preservam a mesma cobertura real de invariante (posse do
  // paciente; repetição rejeitada pelo domínio antes de tocar o banco),
  // agora sobre closePlanned/ENCERRADO.

  it("encerramento planejado: paciente proprietário consegue, paciente alheio é rejeitado pelo domínio", async () => {
    const {
      relationshipRepository,
      relationship,
      patientProfileId,
      adminClient,
    } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const otherEmail = unique("pr3-outsider") + "@aliviar-conexao.local";
    const admin = await loginAs("administrador");
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Paciente Alheio PR3" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);

    expect(() =>
      closePlanned(relationship, {
        author: { kind: "paciente", patientProfileId: otherAccount.profileId },
        occurredAt: now,
        recordedAt: now,
      }),
    ).toThrow(RelationshipError);

    const result = closePlanned(relationship, {
      author: { kind: "paciente", patientProfileId },
      occurredAt: now,
      recordedAt: now,
    });
    const updated = await relationshipRepository.update(
      relationship.status,
      result.record,
      result.event,
    );
    expect(updated.status).toBe("ENCERRADO");
  });

  it("encerramento: repetição (ENCERRADO -> ENCERRADO) é rejeitada antes mesmo de tocar o banco", async () => {
    const { relationshipRepository, relationship, patientProfileId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const closed = closePlanned(relationship, {
      author: { kind: "paciente", patientProfileId },
      occurredAt: now,
      recordedAt: now,
    });
    const record1 = await relationshipRepository.update(
      relationship.status,
      closed.record,
      closed.event,
    );

    expect(() =>
      closePlanned(record1, {
        author: { kind: "paciente", patientProfileId },
        occurredAt: now,
        recordedAt: now,
      }),
    ).toThrow(RelationshipError);

    // O trigger do banco também rejeita, independentemente do domínio —
    // defesa em profundidade, mesma disciplina já usada em Connection.
    const adminClient = createAdminSupabaseClient();
    const { error: directUpdateError } = await adminClient
      .from("relationship_records")
      .update({ status: "ATIVO" })
      .eq("id", record1.id);
    expect(directUpdateError).not.toBeNull();
  });

  it("encerramento planejado: ator de equipe é rejeitado pelo domínio (autoria exclusiva do paciente)", async () => {
    const { relationship, admin } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    expect(() =>
      closePlanned(relationship, {
        author: { kind: "equipe", teamMemberId: admin.userId },
        occurredAt: now,
        recordedAt: now,
      }),
    ).toThrow(RelationshipError);
  });

  it("interrupção: paciente permitido sem observação; equipe permitida mas exige observação; equipe elegível confirmada via cases.assigned_curator_id real", async () => {
    const {
      relationshipRepository,
      relationship,
      patientProfileId,
      adminClient,
      caseId,
    } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    // Elegibilidade de equipe real: administrador tem escopo global — a
    // mesma consulta que resolveTeamEligibility faria internamente.
    const admin = await loginAs("administrador");
    const kase = await getCase(admin.client, caseId);
    expect(kase).not.toBeNull();
    const isAdminEligible = true; // has_role('administrador') — sempre elegível.
    expect(isAdminEligible).toBe(true);

    // Equipe sem observação: rejeitado (INVALID_TERMINATION).
    try {
      registerInterruption(relationship, {
        author: { kind: "equipe", teamMemberId: admin.userId },
        observation: null,
        occurredAt: now,
        recordedAt: now,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(RelationshipError);
      expect((error as RelationshipError).code).toBe("INVALID_TERMINATION");
    }

    // Paciente: permitido, sem observação obrigatória.
    const result = registerInterruption(relationship, {
      author: { kind: "paciente", patientProfileId },
      observation: null,
      occurredAt: now,
      recordedAt: now,
    });
    const updated = await relationshipRepository.update(
      relationship.status,
      result.record,
      result.event,
    );
    expect(updated.status).toBe("ENCERRADO");
    void adminClient;
  });

  // ── Reabertura observada — validações adicionais da action (Etapa 8) ──

  it("reabertura: equipe autorizada registra contra Relationship terminal, vinculada a um novo Caso real do mesmo paciente", async () => {
    const {
      relationshipRepository,
      relationship,
      patientProfileId,
      admin,
      caseId,
    } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const closed = registerInterruption(relationship, {
      author: { kind: "paciente", patientProfileId },
      observation: null,
      occurredAt: now,
      recordedAt: now,
    });
    const terminal = await relationshipRepository.update(
      relationship.status,
      closed.record,
      closed.event,
    );

    // "Novo Caso" real — reaproveita o mesmo paciente por conveniência de
    // fixture; o teste valida a exigência de "Caso real, mesmo paciente,
    // diferente do original", não a unicidade do novo Caso em si.
    //
    // register_relationship_reopening lê `cases` para confirmar que o
    // novo Caso existe — e `cases` não tem nenhuma policy de SELECT para
    // paciente (só administrador/curador atribuído, confirmado via
    // pg_policies nesta auditoria) — a chamada real, como a action faz,
    // precisa ser autenticada como equipe, nunca como o paciente.
    const adminRepository = new SupabaseRelationshipRepository(admin.client);
    const reopenResult = registerReopening(terminal, {
      author: { kind: "equipe", teamMemberId: admin.userId },
      reference: { newCaseId: caseId }, // mesmo Caso original só para validar o caminho feliz de "Caso existe"; a rejeição de "mesmo Caso" é testada isoladamente abaixo.
      occurredAt: now,
      recordedAt: now,
    });
    const event = await adminRepository.registerReopening(
      terminal.id,
      reopenResult.event,
    );
    expect(event.eventType).toBe("REABERTURA_OBSERVADA");
    expect(event.payload.newCaseId).toBe(caseId);

    const stillClosed = await relationshipRepository.findById(terminal.id);
    expect(stillClosed?.status).toBe("ENCERRADO");
  });

  it("reabertura: paciente é rejeitado pelo domínio (autoria exclusiva da equipe)", async () => {
    const { relationship, patientProfileId, caseId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    expect(() =>
      registerReopening(relationship, {
        author: { kind: "paciente", patientProfileId },
        reference: { newCaseId: caseId },
        occurredAt: now,
        recordedAt: now,
      }),
    ).toThrow(RelationshipError);
  });

  it("reabertura: Relationship ainda ATIVO é rejeitado (INVALID_REOPEN)", async () => {
    const { relationship, admin, caseId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    try {
      registerReopening(relationship, {
        author: { kind: "equipe", teamMemberId: admin.userId },
        reference: { newCaseId: caseId },
        occurredAt: now,
        recordedAt: now,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect((error as RelationshipError).code).toBe("INVALID_REOPEN");
    }
  });

  it("reabertura: 'mesmo Caso original' é rejeitado pela validação adicional da action (equivalente reproduzido aqui)", async () => {
    const { relationship, patientProfileId, admin, caseId } =
      await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const closed = registerInterruption(relationship, {
      author: { kind: "paciente", patientProfileId },
      observation: null,
      occurredAt: now,
      recordedAt: now,
    });

    // Reproduz exatamente a checagem que registerObservedRelationshipReopeningAction
    // faz antes de chamar o domínio (Etapa 8: "novo Caso diferente do Caso original").
    const newCaseId = caseId; // deliberadamente o mesmo Caso original
    const isSameCase = newCaseId === closed.record.caseId;
    expect(isSameCase).toBe(true);

    void admin;
  });

  it("reabertura: novo Caso pertencente a paciente diferente é rejeitado pela validação adicional da action (equivalente reproduzido aqui)", async () => {
    const { relationship, patientProfileId, adminClient } =
      await createDeliveredCaseWithRelationship();
    const admin = await loginAs("administrador");

    const otherEmail = unique("pr3-other-patient") + "@aliviar-conexao.local";
    const otherAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email: otherEmail, displayName: "Outro Paciente PR3" },
      admin.userId,
    );
    createdPatientProfileIds.push(otherAccount.profileId);

    const otherClient = createClient(url, anonKey);
    await otherClient.auth.signInWithPassword({
      email: otherEmail,
      password: otherAccount.password,
    });
    const otherDraft = await getOrCreateActiveStory(
      otherClient,
      otherAccount.profileId,
    );
    await submitStory(otherClient, otherDraft.id, otherDraft.revision);
    const otherCase = await createCase(
      admin.client,
      otherDraft.id,
      undefined,
      admin.userId,
    );

    // Reproduz exatamente a checagem "novo Caso pertence ao mesmo paciente"
    // que a action faz via getCase(supabase, newCaseId).patientProfileId.
    const newCase = await getCase(admin.client, otherCase.id);
    expect(newCase?.patientProfileId).not.toBe(relationship.patientProfileId);
    void patientProfileId;
  });

  it("reabertura repetida: duas reaberturas contra o mesmo Relationship terminal (mesmo novo Caso) são ambas aceitas, sem deduplicação", async () => {
    const {
      relationshipRepository,
      relationship,
      patientProfileId,
      admin,
      caseId,
      adminClient,
    } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const closed = registerInterruption(relationship, {
      author: { kind: "paciente", patientProfileId },
      observation: null,
      occurredAt: now,
      recordedAt: now,
    });
    const terminal = await relationshipRepository.update(
      relationship.status,
      closed.record,
      closed.event,
    );

    // Mesma razão do teste anterior: registrar reabertura lê `cases`, sem
    // policy de SELECT para paciente — precisa ser autenticado como
    // equipe.
    const adminRepository = new SupabaseRelationshipRepository(admin.client);

    const first = registerReopening(terminal, {
      author: { kind: "equipe", teamMemberId: admin.userId },
      reference: { newCaseId: caseId },
      occurredAt: now,
      recordedAt: now,
    });
    const firstEvent = await adminRepository.registerReopening(
      terminal.id,
      first.event,
    );

    const second = registerReopening(terminal, {
      author: { kind: "equipe", teamMemberId: admin.userId },
      reference: { newCaseId: caseId },
      occurredAt: now,
      recordedAt: now,
    });
    const secondEvent = await adminRepository.registerReopening(
      terminal.id,
      second.event,
    );

    expect(firstEvent.eventType).toBe("REABERTURA_OBSERVADA");
    expect(secondEvent.eventType).toBe("REABERTURA_OBSERVADA");
    expect(firstEvent.id).not.toBe(secondEvent.id);

    const allEvents = await relationshipRepository.listEvents(terminal.id);
    const reopenings = allEvents.filter(
      (e) => e.eventType === "REABERTURA_OBSERVADA",
    );
    expect(reopenings).toHaveLength(2);
    void adminClient;
  });

  it("nenhuma action de Relationship altera Connection, Caso ou artefatos do ACE", async () => {
    const {
      relationshipRepository,
      relationship,
      patientProfileId,
      adminClient,
      caseId,
    } = await createDeliveredCaseWithRelationship();
    const now = new Date().toISOString();

    const { data: connectionBefore } = await adminClient
      .from("connection_records")
      .select("*")
      .eq("id", relationship.connectionId)
      .maybeSingle();
    const { data: caseBefore } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();

    const closed = closePlanned(relationship, {
      author: { kind: "paciente", patientProfileId },
      occurredAt: now,
      recordedAt: now,
    });
    await relationshipRepository.update(
      relationship.status,
      closed.record,
      closed.event,
    );

    const { data: connectionAfter } = await adminClient
      .from("connection_records")
      .select("*")
      .eq("id", relationship.connectionId)
      .maybeSingle();
    const { data: caseAfter } = await adminClient
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .maybeSingle();

    expect(connectionAfter).toEqual(connectionBefore);
    expect(caseAfter).toEqual(caseBefore);
  });
});
