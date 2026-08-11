import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { resolveCurrentResponsible } from "@/modules/coa/journey-responsibility";
import { getPatientDecision, registerPatientDecision } from "@/modules/curadoria/repository";

import {
  cleanupFixture,
  seedDeliveredCase,
  type DeliveredFixture,
} from "../apoio/apoio-curadoria-entregue";
import { createCuradoriaClient } from "./curadoria-client";

/**
 * B3 · §1 — A TAREFA-GATE: PROVAR A HIPÓTESE ANTES DE MEXER EM PRODUÇÃO.
 *
 * A missão instrui a NÃO alterar nada até reproduzir o fluxo atual e olhar
 * `patient_curadoria_decisions` antes e depois. A hipótese do Arquiteto é que
 * a linha **persiste** e o defeito é de feedback — não de perda de dado.
 *
 * Se a linha não persistir, a natureza da B3 muda e a missão manda PARAR.
 *
 * O oráculo é o fato canônico. `connection_records` **não** participa: é
 * continuidade/conexão, não o domínio da decisão (§2).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("B3 · §1 · a decisão persiste?", () => {
  const admin = createAdminSupabaseClient();

  let entregue: DeliveredFixture;
  const outrasFixtures: DeliveredFixture[] = [];

  async function comoPaciente(fixture: DeliveredFixture) {
    const cliente = createCuradoriaClient(url, anonKey);
    const { error } = await cliente.auth.signInWithPassword({
      email: fixture.patientEmail,
      password: fixture.patientPassword,
    });
    if (error) throw new Error(`login: ${error.message}`);
    return cliente;
  }

  /** Contagem direta no fato canônico — nunca por tabela vizinha. */
  async function decisoesDaSelecao(selectionId: string): Promise<number> {
    const { count } = await admin
      .schema("curadoria")
      .from("patient_curadoria_decisions")
      .select("id", { count: "exact", head: true })
      .eq("curated_selection_id", selectionId);
    return count ?? 0;
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();
    entregue = await seedDeliveredCase();
  }, 300_000);

  afterAll(async () => {
    await cleanupFixture(entregue);
    for (const f of outrasFixtures) await cleanupFixture(f);
  }, 300_000);

  it("T-B3-1 · ANTES 0 · escrita · DEPOIS 1 — a linha persiste", async () => {
    const antes = await decisoesDaSelecao(entregue.curatedSelectionId);
    expect(antes, "a fixture não deveria nascer com decisão").toBe(0);

    const cliente = await comoPaciente(entregue);
    const curadoria = await loadPatientCuradoria(cliente);
    expect(curadoria, "a Curadoria entregue deveria estar acessível").not.toBeNull();
    expect(curadoria?.decision, "não deveria haver decisão ainda").toBeNull();

    // O writer real da paciente, com a opção que pertence à SUA seleção.
    await registerPatientDecision(
      cliente,
      entregue.caseId,
      entregue.curatedSelectionId,
      "CHOSEN",
      curadoria!.options[0]!.id,
      null,
    );

    const depois = await decisoesDaSelecao(entregue.curatedSelectionId);
    expect(depois, "a decisão NÃO persistiu — a natureza da B3 muda").toBe(1);
  }, 120_000);

  it("e a decisão é legível de volta pela própria paciente", async () => {
    const cliente = await comoPaciente(entregue);

    const decisao = await getPatientDecision(cliente, entregue.curatedSelectionId);
    expect(decisao, "a paciente não relê a própria decisão").not.toBeNull();
    expect(decisao?.outcome).toBe("CHOSEN");
  }, 120_000);

  /**
   * A leitura que a PÁGINA faz. Se `loadPatientCuradoria` devolvesse
   * `decision: null` depois do INSERT, a tela renderizaria o formulário
   * inicial de novo — e o sintoma "o formulário resetou" teria causa na
   * leitura, não no feedback.
   */
  it("T-B3-3 · a projeção da página enxerga a decisão — o refresh tem o que consumir", async () => {
    const cliente = await comoPaciente(entregue);

    const curadoria = await loadPatientCuradoria(cliente);
    expect(curadoria?.decision, "a página não enxerga a decisão registrada").not.toBeNull();
    expect(curadoria?.decision?.outcome).toBe("CHOSEN");
  }, 120_000);

  it("T-B3-10 · decidir de novo não cria segunda linha", async () => {
    const cliente = await comoPaciente(entregue);
    const curadoria = await loadPatientCuradoria(cliente);

    await registerPatientDecision(
      cliente,
      entregue.caseId,
      entregue.curatedSelectionId,
      "CHOSEN",
      curadoria!.options[0]!.id,
      null,
    );

    expect(await decisoesDaSelecao(entregue.curatedSelectionId)).toBe(1);
  }, 120_000);

  // ---------------------------------------------------------------------------
  describe("T-B3-11 · a decisão deixa trilha, gravada pelo banco", () => {
    it("um INSERT legítimo produz exatamente uma entrada patient_curadoria_decided", async () => {
      const { data } = await admin
        .schema("curadoria")
        .from("audit_logs")
        .select("actor_id, target_profile_id, metadata")
        .eq("action", "patient_curadoria_decided")
        .eq("target_profile_id", entregue.patientProfileId);

      const desta = (data ?? []).filter(
        (l) => (l.metadata as Record<string, unknown>)?.curated_selection_id === entregue.curatedSelectionId,
      );

      expect(desta).toHaveLength(1);
      expect(desta[0].actor_id).toBe(entregue.patientProfileId);
      expect((desta[0].metadata as Record<string, unknown>).outcome).toBe("CHOSEN");
    });

    it("a trilha não carrega a nota que ela escreveu", async () => {
      const { data } = await admin
        .schema("curadoria")
        .from("audit_logs")
        .select("metadata")
        .eq("action", "patient_curadoria_decided")
        .eq("target_profile_id", entregue.patientProfileId);

      for (const linha of data ?? []) {
        expect(Object.keys(linha.metadata as object)).not.toContain("note");
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe("T-B3-4 / T-B3-5 · o handoff deriva da decisão, e só dela", () => {
    const base = {
      historia: { understandingConfirmedAt: new Date().toISOString() },
      validacao: null,
    };

    it("T-B3-5 · entregue e SEM decisão → Curador", () => {
      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: "Equipe Aliviar",
        curadoriaRecord: {
          ...base,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
          devolutiva: { presentedAt: new Date().toISOString(), decision: null },
        } as never,
      });

      // Entregue E apresentada, e ainda assim o Curador: nenhum carimbo faz
      // handoff — só a decisão faz.
      expect(responsavel.role).toBe("curador");
    });

    it("T-B3-4 · com decisão → Concierge", () => {
      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: null,
        curadoriaRecord: {
          ...base,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
          devolutiva: {
            presentedAt: null,
            decision: { outcome: "CHOSEN", chosenProfessionalId: "x", justification: null, decidedAt: new Date().toISOString() },
          },
        } as never,
      });

      expect(responsavel.role).toBe("concierge");
      // Sem identidade persistida de Concierge, o fallback é institucional —
      // nunca um nome inventado (§10 da B3, GAP-D12-C1 preservado).
      expect(responsavel.name).toBe("Equipe Aliviar");
    });
  });

  // ---------------------------------------------------------------------------
  describe("T-B3-8 / T-B3-9 · quem NÃO decide", () => {
    it("T-B3-9 · a paciente não decide seleção alheia", async () => {
      const outra = await seedDeliveredCase();
      outrasFixtures.push(outra);

      const cliente = await comoPaciente(entregue);
      await expect(
        registerPatientDecision(cliente, outra.caseId, outra.curatedSelectionId, "NONE_OF_THEM", null, null),
      ).rejects.toThrow();

      expect(await decisoesDaSelecao(outra.curatedSelectionId)).toBe(0);
    }, 300_000);
  });

  // ---------------------------------------------------------------------------
  it("T-B3-12 · Minha Curadoria continua consultável depois da decisão", async () => {
    const cliente = await comoPaciente(entregue);
    const curadoria = await loadPatientCuradoria(cliente);

    expect(curadoria).not.toBeNull();
    expect(curadoria?.options).toHaveLength(3);
    expect(curadoria?.decision).not.toBeNull();
  }, 120_000);

  // ---------------------------------------------------------------------------
  /**
   * T-B3-R6/R7/R8 · a fronteira entre os dois fatos.
   *
   * A conexão guarda o que a decisão não sabe (modo de contato, primeiro
   * atendimento, Relationship). A decisão guarda o que a conexão não consegue
   * expressar — a recusa legítima e o handoff. Nenhum dos dois substitui o
   * outro, e é isto que estes três testes fixam.
   */
  describe("T-B3-R6/R7/R8 · decisão × conexão", () => {
    it("T-B3-R6 · criar conexão NÃO cria decisão canônica", async () => {
      const semDecisao = await seedDeliveredCase();
      outrasFixtures.push(semDecisao);

      // A Curadoria está entregue e a paciente não decidiu. Toda a superfície
      // de conexão existe para ela a partir daqui — e nada nesse domínio pode
      // produzir o fato canônico.
      expect(await decisoesDaSelecao(semDecisao.curatedSelectionId)).toBe(0);

      // A prova estrutural: o único writer de `patient_curadoria_decisions`
      // em `src/` é o da decisão. Se um dia o domínio da conexão passar a
      // gravar o fato canônico, este teste cai.
      const { readFileSync } = await import("node:fs");
      const conexao = readFileSync("src/modules/connection/repository.ts", "utf8");
      expect(
        conexao,
        "o domínio da conexão passou a escrever no fato canônico da decisão",
      ).not.toContain("patient_curadoria_decisions");
    }, 300_000);

    it("T-B3-R7 · conexão sem decisão canônica NÃO faz handoff", () => {
      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: "Equipe Aliviar",
        curadoriaRecord: {
          historia: { understandingConfirmedAt: new Date().toISOString() },
          validacao: null,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
          devolutiva: { presentedAt: new Date().toISOString(), decision: null },
        } as never,
      });

      // `resolveCurrentResponsible` sequer LÊ connection_records — e é por isso
      // que existir conexão não move ninguém. A prova é o Curador permanecer.
      expect(responsavel.role).toBe("curador");
    });

    it("T-B3-R8 · decisão SEM conexão já faz handoff", () => {
      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: null,
        curadoriaRecord: {
          historia: { understandingConfirmedAt: new Date().toISOString() },
          validacao: null,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
          devolutiva: {
            presentedAt: null,
            decision: {
              outcome: "CHOSEN",
              chosenProfessionalId: "x",
              justification: null,
              decidedAt: new Date().toISOString(),
            },
          },
        } as never,
      });

      // A conexão não é pré-requisito do handoff.
      expect(responsavel.role).toBe("concierge");
      expect(responsavel.name).toBe("Equipe Aliviar");
    });

    /**
     * ⚠️ ACHADO — a recusa legítima NÃO leva ao Concierge.
     *
     * O contrato B3-A diz "decision presente → Concierge responsável". O
     * código faz outra coisa para `NONE_OF_THEM`: `inferPhaseFromCuradoria`
     * devolve a fase `curadoria`, e o responsável permanece o **Curador**.
     *
     * E faz sentido: ninguém foi escolhido, então não há acompanhamento a
     * conduzir — quem retoma é quem conduz a Curadoria. O contrato é que fala
     * em "decisão" sem distinguir os dois desfechos.
     *
     * Fixo o comportamento REAL, e registro a divergência em vez de "corrigir"
     * produção com base numa leitura minha do contrato. **Decisão do
     * Arquiteto**, não do Engenheiro.
     */
    it("a recusa legítima mantém o Curador — divergência registrada", () => {
      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: null,
        curadoriaRecord: {
          historia: { understandingConfirmedAt: new Date().toISOString() },
          validacao: null,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
          devolutiva: {
            presentedAt: null,
            decision: {
              outcome: "NONE_OF_THEM",
              chosenProfessionalId: null,
              justification: null,
              decidedAt: new Date().toISOString(),
            },
          },
        } as never,
      });

      // Comportamento vigente, fixado como está: ninguém escolhido, ninguém
      // a acompanhar — o Curador permanece.
      expect(responsavel.role).toBe("curador");
    });

    it("a fixture consegue nascer JÁ decidida, pelo writer real", async () => {
      const decidida = await seedDeliveredCase({ decidir: "CHOSEN" });
      outrasFixtures.push(decidida);

      expect(await decisoesDaSelecao(decidida.curatedSelectionId)).toBe(1);
    }, 300_000);
  });
});
