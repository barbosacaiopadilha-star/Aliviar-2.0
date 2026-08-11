import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
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
});
