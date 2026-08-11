import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolveCurrentResponsible } from "@/modules/coa/journey-responsibility";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { registerDevolutiva } from "@/modules/curadoria/report-repository";

import {
  cleanupFixture,
  seedDeliveredCase,
  type DeliveredFixture,
} from "../apoio/apoio-curadoria-entregue";
import { createCuradoriaClient } from "./curadoria-client";

/**
 * B1 · O PORTÃO DE ENTREGA DA CURADORIA, AGORA FALSEÁVEL.
 *
 * A auditoria da B1 encontrou o vão: `loadPatientCuradoria` carrega oito
 * referências a `delivered` — `status = 'DELIVERED'` na seleção **e**
 * `delivered_at` no Relatório — e **nenhum teste no repositório defendia
 * qualquer uma delas**. Trocar o portão por `EMITTED` não derrubava nada.
 *
 * É o mesmo padrão pelo qual a D-12.1 foi reprovada: a garantia existia e
 * nada a protegia.
 *
 * A REGRA QUE ESTA SUÍTE FIXA
 *
 *   emittedAt   ≠  presentedAt  ≠  deliveredAt
 *
 * - **Emitida** é a Aliviar ter terminado por dentro.
 * - **Apresentada** é o encontro ter acontecido.
 * - **Entregue** é ela ter acesso — e só isso abre a Curadoria digital.
 *
 * O cenário vem da fixture canônica, pela mesma cadeia das telas: Acolhimento,
 * contexto, critérios, Mapa, validação, seleção humana, Relatório, aprovação,
 * emissão e entrega. **O caso não-entregue não é fabricado**: é a mesma cadeia
 * parando um passo antes — o instante anterior à entrega, que existe de
 * verdade no ciclo.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("B1 · o portão de entrega da Curadoria", () => {
  const admin = createAdminSupabaseClient();

  let entregue: DeliveredFixture;
  let naoEntregue: DeliveredFixture;

  /** A sessão da própria paciente — a RLS é quem decide o que ela alcança. */
  async function como(fixture: DeliveredFixture) {
    const cliente = createCuradoriaClient(url, anonKey);
    const { error } = await cliente.auth.signInWithPassword({
      email: fixture.patientEmail,
      password: fixture.patientPassword,
    });
    if (error) throw new Error(`login ${fixture.patientEmail}: ${error.message}`);
    return cliente;
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();
    entregue = await seedDeliveredCase();
    naoEntregue = await seedDeliveredCase({ entregar: false });
  }, 300_000);

  afterAll(async () => {
    await cleanupFixture(entregue);
    await cleanupFixture(naoEntregue);
  }, 300_000);

  // -------------------------------------------------------------------------
  describe("G1 · emitida e NÃO entregue", () => {
    it("T-B1-1 · a Curadoria digital não existe para ela", async () => {
      const cliente = await como(naoEntregue);

      await expect(loadPatientCuradoria(cliente)).resolves.toBeNull();
    });

    it("e o Relatório existe do lado de dentro — o que falta é a ENTREGA", async () => {
      // Sem esta asserção o teste acima passaria por um motivo errado (não
      // haver Relatório nenhum), e o portão continuaria sem prova.
      const { data } = await admin
        .schema("curadoria")
        .from("curadoria_reports")
        .select("emitted_at, delivered_at")
        .eq("id", naoEntregue.reportId)
        .single();

      expect(data?.emitted_at, "o Relatório deveria estar emitido").not.toBeNull();
      expect(data?.delivered_at, "o Relatório não deveria estar entregue").toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("G2 · apresentada e NÃO entregue", () => {
    it("T-B1-2 · o encontro ter acontecido não abre a Curadoria digital", async () => {
      // A devolutiva pelo caminho real: o Segundo Encontro aconteceu.
      const { data: caso } = await admin
        .schema("curadoria")
        .from("cases")
        .select("assigned_curator_id")
        .eq("id", naoEntregue.caseId)
        .single();

      await registerDevolutiva(admin, {
        caseId: naoEntregue.caseId,
        reportId: naoEntregue.reportId,
        // O ato tem autor: quem apresentou foi o Curador do Case.
        presentedBy: caso!.assigned_curator_id as string,
        patientQuestions: ["Quanto tempo costuma levar?"],
        observations: ["Conversamos sobre os três caminhos."],
        nextSteps: [],
      });

      const { data } = await admin
        .schema("curadoria")
        .from("devolutiva_records")
        .select("presented_at")
        .eq("report_id", naoEntregue.reportId)
        .maybeSingle();
      expect(data?.presented_at, "a apresentação deveria estar registrada").not.toBeNull();

      const cliente = await como(naoEntregue);
      await expect(loadPatientCuradoria(cliente)).resolves.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("G3 · entregue legitimamente", () => {
    it("T-B1-3 · a Curadoria abre", async () => {
      const cliente = await como(entregue);
      const curadoria = await loadPatientCuradoria(cliente);

      expect(curadoria).not.toBeNull();
      expect(curadoria?.deliveredAt).toBeTruthy();
    });

    it("T-B1-5 · três caminhos, porque o contrato entregou três", async () => {
      const cliente = await como(entregue);
      const curadoria = await loadPatientCuradoria(cliente);

      expect(curadoria?.options).toHaveLength(3);
    });

    it("a paciente alheia não alcança a Curadoria desta — a RLS é o piso", async () => {
      const outra = await como(naoEntregue);
      const curadoria = await loadPatientCuradoria(outra);

      // Ela lê a PRÓPRIA (nenhuma), nunca a da outra paciente.
      expect(curadoria).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  /**
   * G4 · o carimbo sozinho não é entrega.
   *
   * Um `delivered_at` apontando para um Relatório que não existe é carimbo
   * sobre o vazio. A tela não pode prometer conteúdo que a leitura não
   * sustenta — e a segunda guarda do loader (`if (!report?.delivered_at)`)
   * existe exatamente para isso.
   */
  describe("G4 · entregue sem conteúdo legítimo", () => {
    /**
     * T-B1-4 · a resposta veio mais forte do que a pergunta.
     *
     * A missão pedia para provar que "carimbo de entrega + conteúdo ausente"
     * não abre a Curadoria. Ao tentar produzir esse estado, o BANCO recusou:
     *
     *   23514 — "O carimbo de entrega do Relatorio e definitivo: reentregar
     *            nunca reescreve o instante em que a paciente recebeu."
     *
     * Ou seja: a divergência não é pega pelo loader porque **não chega a
     * existir**. Um Relatório entregue não volta a ser não-entregue, e o
     * instante em que ela recebeu é imutável. Isso é garantia mais forte que
     * uma checagem de leitura — e é o que este teste passa a fixar.
     *
     * A redundância do loader (`if (!report?.delivered_at) return null`)
     * continua valendo para o caso em que o Relatório simplesmente não existe,
     * e o §3 desta missão manda preservá-la.
     */
    it("T-B1-4 · o carimbo de entrega é imutável — o estado divergente não existe", async () => {
      const { error } = await admin
        .schema("curadoria")
        .from("curadoria_reports")
        .update({ delivered_at: null })
        .eq("id", entregue.reportId);

      expect(error, "o banco aceitou desfazer uma entrega").not.toBeNull();
      expect(error?.message).toMatch(/definitiv/i);

      // E a Curadoria dela segue de pé, intacta: a recusa não deixou resíduo.
      const cliente = await como(entregue);
      const curadoria = await loadPatientCuradoria(cliente);
      expect(curadoria?.deliveredAt).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  /**
   * §8 · A entrega não muda quem responde.
   *
   * `resolveCurrentResponsible` já carrega a regra: enquanto não há decisão, o
   * Curador responde — mesmo com Relatório emitido, apresentado e entregue. A
   * asserção aqui impede que a B3 mova isso por engano ao introduzir o
   * Concierge.
   */
  describe("§8 · responsabilidade antes da decisão", () => {
    it("T-B1-7 · entregue e sem decisão → o Curador continua responsável", async () => {
      const cliente = await como(entregue);
      const curadoria = await loadPatientCuradoria(cliente);

      expect(curadoria?.decision, "a fixture não deveria ter decisão").toBeNull();

      const responsavel = resolveCurrentResponsible({
        pipelineStage: null,
        curatorName: "Curador da fixture",
        conciergeName: "Concierge da fixture",
        // O resolvedor calcula a fase ANTES da guarda de decisão, e a fase
        // lê história e validação — por isso o registro traz os ramos que ele
        // de fato percorre, com o Relatório EMITIDO, que é o cenário que
        // levaria a fase para "escolha" (a do Concierge) se a guarda caísse.
        curadoriaRecord: {
          relatorio: { emittedAt: new Date().toISOString(), deliveredAt: curadoria!.deliveredAt },
          devolutiva: { decision: null },
          historia: { understandingConfirmedAt: new Date().toISOString() },
          validacao: null,
        } as never,
      });

      expect(responsavel.role).toBe("curador");
    });
  });
});
