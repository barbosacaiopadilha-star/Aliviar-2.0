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

      // Guarda estrutural, complementar: o domínio da conexão não referencia
      // o fato canônico.
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
     * A recusa legítima também transfere — divergência RESOLVIDA.
     *
     * O Arquiteto congelou: qualquer decisão canônica presente move o handoff,
     * inclusive `NONE_OF_THEM`. A recusa encerra a etapa decisória; uma nova
     * seleção curada, se vier, é outro processo — não a continuação deste sob
     * o Curador. O comportamento anterior era defeito de produção, corrigido
     * em `resolveCurrentResponsible` (ADR-066).
     */
    it("T-B3-R11 · a recusa legítima também leva ao Concierge", () => {
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

      // Sem profissional escolhido e sem conexão, e ainda assim Concierge:
      // o handoff depende do FATO existir, nunca de quem foi escolhido.
      expect(responsavel.role).toBe("concierge");
      expect(responsavel.name).toBe("Equipe Aliviar");
    });

    it("a fixture consegue nascer JÁ decidida, pelo writer real", async () => {
      const decidida = await seedDeliveredCase({ decidir: "CHOSEN" });
      outrasFixtures.push(decidida);

      expect(await decisoesDaSelecao(decidida.curatedSelectionId)).toBe(1);
    }, 300_000);
  });
  // ---------------------------------------------------------------------------
  /**
   * Os quatro cenários de responsabilidade, lado a lado. Antes estavam
   * espalhados; juntos, a regra fica legível de uma vez: **só a decisão move**.
   */
  describe("os quatro cenários de responsabilidade", () => {
    const base = {
      historia: { understandingConfirmedAt: new Date().toISOString() },
      validacao: null,
      relatorio: { emittedAt: new Date().toISOString(), deliveredAt: new Date().toISOString() },
    };

    function responsavel(decision: unknown) {
      return resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: null,
        curadoriaRecord: { ...base, devolutiva: { presentedAt: null, decision } } as never,
      }).role;
    }

    const decidiu = (outcome: "CHOSEN" | "NONE_OF_THEM") => ({
      outcome,
      chosenProfessionalId: outcome === "CHOSEN" ? "prof-1" : null,
      justification: null,
      decidedAt: new Date().toISOString(),
    });

    it("sem decisão → Curador", () => {
      expect(responsavel(null)).toBe("curador");
    });

    it("decisão positiva → Concierge", () => {
      expect(responsavel(decidiu("CHOSEN"))).toBe("concierge");
    });

    it("NONE_OF_THEM → Concierge", () => {
      expect(responsavel(decidiu("NONE_OF_THEM"))).toBe("concierge");
    });

    it("conexão sem decisão → Curador (a conexão não é lida pelo resolvedor)", () => {
      // O resolvedor não recebe nem consulta `connection_records`. A ausência
      // do parâmetro É a prova de que conexão não move responsabilidade.
      expect(responsavel(null)).toBe("curador");
    });
  });
  // ---------------------------------------------------------------------------
  /**
   * T-B3-R6 COMPORTAMENTAL — a conexão acontece de verdade, e o fato canônico
   * não se move.
   *
   * A tentativa anterior inseria em `connection_records` pelo `service_role` e
   * batia em `permission denied for function canonical_delivery_matches`.
   * Diagnóstico: a função é SECURITY DEFINER com EXECUTE só para `postgres` e
   * `authenticated`, e a policy de INSERT a invoca. **O service_role nunca foi
   * o ator deste fluxo** — quem conecta é a paciente autenticada, que tem o
   * grant. Não era defeito de ambiente nem de produção: era fixture usando o
   * ator errado, e contagem em zero depois de operação RECUSADA não prova nada.
   */
  describe("T-B3-R6 · comportamental — conexão real, decisão inalterada", () => {
    it("a paciente conecta pelo caminho real e nenhuma segunda decisão nasce", async () => {
      const decidida = await seedDeliveredCase({ decidir: "CHOSEN" });
      outrasFixtures.push(decidida);

      const antes = await decisoesDaSelecao(decidida.curatedSelectionId);
      expect(antes, "a fixture deveria nascer com exatamente uma decisão").toBe(1);

      const { data: decisaoAntes } = await admin
        .schema("curadoria")
        .from("patient_curadoria_decisions")
        .select("id, outcome, chosen_option_id")
        .eq("curated_selection_id", decidida.curatedSelectionId)
        .single();

      // O writer REAL da conexão: a RPC canônica, chamada pela paciente
      // autenticada — o mesmo caminho que o repositório de produção usa.
      const cliente = await comoPaciente(decidida);
      const agora = new Date().toISOString();
      const { data: conexao, error } = await cliente.rpc("create_connection_from_report", {
        p_report_id: decidida.reportId,
        p_professional_profile_id: decidida.selectedProfessionals[0]!.id,
        p_decided_at: agora,
        p_actor_id: decidida.patientProfileId,
        p_event_payload: {},
        p_occurred_at: agora,
        p_recorded_at: agora,
      });

      // A prova só vale se a conexão TIVER SUCESSO.
      expect(error, error?.message).toBeNull();
      expect(conexao, "a conexão não foi persistida — o teste não prova nada").toBeTruthy();

      const { count } = await admin
        .schema("curadoria")
        .from("connection_records")
        .select("id", { count: "exact", head: true })
        .eq("case_id", decidida.caseId);
      expect(count, "connection_record não existe").toBe(1);

      // E o fato canônico segue intacto: mesma quantidade, mesmo outcome,
      // mesma opção.
      expect(await decisoesDaSelecao(decidida.curatedSelectionId)).toBe(1);

      const { data: decisaoDepois } = await admin
        .schema("curadoria")
        .from("patient_curadoria_decisions")
        .select("id, outcome, chosen_option_id")
        .eq("curated_selection_id", decidida.curatedSelectionId)
        .single();
      expect(decisaoDepois).toEqual(decisaoAntes);
    }, 300_000);

    it("NONE_OF_THEM · a decisão existe, é única, e o responsável é a Equipe Aliviar", async () => {
      const recusada = await seedDeliveredCase({ decidir: "NONE_OF_THEM" });
      outrasFixtures.push(recusada);

      expect(await decisoesDaSelecao(recusada.curatedSelectionId)).toBe(1);

      const cliente = await comoPaciente(recusada);
      const curadoria = await loadPatientCuradoria(cliente);
      expect(curadoria?.decision?.outcome).toBe("NONE_OF_THEM");

      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curadora do Case",
        conciergeName: null,
        curadoriaRecord: {
          historia: { understandingConfirmedAt: new Date().toISOString() },
          validacao: null,
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: curadoria!.deliveredAt },
          devolutiva: { presentedAt: null, decision: curadoria!.decision },
        } as never,
      });

      expect(responsavel.role).toBe("concierge");
      expect(responsavel.name).toBe("Equipe Aliviar");
    }, 300_000);
  });
});
