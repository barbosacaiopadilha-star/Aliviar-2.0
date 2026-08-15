import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  CICLOS,
  elegibilidadeEfetiva,
  type CicloDoProfissional,
} from "@/modules/profiles/ciclo-do-profissional";

/**
 * T-7R-1 · OPS-G5 · CORTE 7 (remediação) — SQL e TypeScript dizem o mesmo.
 *
 * O Corte 7 foi reprovado porque duas réguas mediam a mesma coisa e discordavam.
 * A régua passa a ser `curadoria.elegibilidade_do_profissional`; o módulo TS é
 * espelho, e existe só para a interface não precisar de uma ida ao banco por
 * linha.
 *
 * Este teste percorre **todas** as combinações de (ciclo × demo × fixture ×
 * divergência crítica) contra o banco real e falha **nomeando** a combinação
 * divergente. ⛔ Nada aqui é amostra.
 */

const service = createAdminSupabaseClient();
const MARCA = "ZZC7R";

let autor: string;
const criados: string[] = [];

type Combinacao = {
  ciclo: CicloDoProfissional | null;
  isDemo: boolean;
  isTestFixture: boolean;
  critica: boolean;
};

/**
 * 5 estados (4 + nulo) × demo × fixture × divergência.
 *
 * `demo ∧ fixture` é excluída porque o banco a proíbe por CHECK
 * (`fixture_nao_e_demonstracao`): uma linha não é as duas coisas. Forçá-la seria
 * medir um mundo que não existe. Sobram 30 combinações possíveis.
 */
const COMBINACOES: Combinacao[] = [];
for (const ciclo of [...CICLOS, null] as (CicloDoProfissional | null)[]) {
  for (const isDemo of [false, true]) {
    for (const isTestFixture of [false, true]) {
      if (isDemo && isTestFixture) continue;
      for (const critica of [false, true]) {
        COMBINACOES.push({ ciclo, isDemo, isTestFixture, critica });
      }
    }
  }
}

/**
 * Monta a linha no estado pedido. Demo e fixture não chegam a `PUBLICADO_ATIVO`
 * — a exclusão é absoluta e o banco a impõe —, então essas combinações são
 * montadas por escrita direta com o gatilho de nascimento respeitado e o ciclo
 * posto no `insert`, que é o único caminho que não passa pela transição.
 */
async function montar(c: Combinacao): Promise<string> {
  const { data, error } = await service
    .from("professional_profiles")
    .insert({
      display_name: "Paridade C7R",
      professional_identifier: `${MARCA}-${randomUUID().slice(0, 12)}`,
      created_by: autor,
      is_demo: c.isDemo,
      is_test_fixture: c.isTestFixture,
      ciclo_de_vida: c.ciclo === null ? null : "PREPARACAO",
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture (${JSON.stringify(c)}): ${error.message}`);
  const id = data!.id as string;
  criados.push(id);

  if (c.ciclo !== null && c.ciclo !== "PREPARACAO") {
    // Sem demo/fixture, o caminho é a porta da frente e exige a porta de
    // publicação satisfeita; com demo/fixture, o banco recusa PUBLICADO_ATIVO e
    // o estado é alcançado só até onde ele deixa.
    await service
      .from("professional_profiles")
      .update({
        crm: "000000",
        crm_uf: "SP",
        registration_status: "regular",
        registration_source: "Paridade C7R",
        registration_verified_at: new Date().toISOString(),
        registration_verified_by: autor,
      })
      .eq("id", id);
    await service.from("professional_practice_areas").insert({
      professional_profile_id: id,
      raw_text: "Área de paridade",
      verification_status: "verificado",
      source: "Paridade C7R",
      verified_at: new Date().toISOString(),
      verified_by: autor,
    });

    const passos: Array<[CicloDoProfissional, string]> =
      c.ciclo === "PUBLICADO_ATIVO"
        ? [["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"]]
        : c.ciclo === "PAUSADO"
          ? [
              ["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"],
              ["PAUSADO", "REVISAO_CADASTRAL"],
            ]
          : [
              ["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"],
              ["RETIRADO_ARQUIVADO", "ENCERRAMENTO_DA_ATUACAO"],
            ];

    for (const [destino, motivo] of passos) {
      const { error: ePasso } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", { p_profissional: id, p_para: destino, p_motivo: motivo, p_ator: autor });
      // Falha ALTA: um degrau engolido aqui fez a paridade medir menos estados
      // sem avisar — combinações inteiras viraram PREPARACAO em silêncio.
      // Demo é barrada no ESTADO publicado — a exclusão absoluta funcionando.
      // Para ela, o degrau recusado é o resultado esperado: a linha fica onde
      // o banco deixou, e a paridade mede o estado REALIZADO.
      if (ePasso && c.isDemo) break;
      if (ePasso) {
        throw new Error("paridade (" + JSON.stringify(c) + ") degrau " + destino + ": " + ePasso.message);
      }
    }
  }

  if (c.critica) {
    const { error: eDiv } = await service.from("verification_divergences").insert({
      professional_profile_id: id,
      status: "aberta",
      severity: "critica",
      subject: "crm",
      declared_version: "declarado",
      found_version: "encontrado",
      opened_by: autor,
    });
    if (eDiv) throw new Error(`divergência (${JSON.stringify(c)}): ${eDiv.message}`);
  }

  return id;
}

beforeAll(async () => {
  const { data } = await service.from("profiles").select("id").limit(1);
  autor = data?.[0]?.id as string;
  if (!autor) throw new Error("Nenhum profile no banco local.");
});

afterAll(async () => {
  if (criados.length === 0) return;
  await service.from("verification_divergences").delete().in("professional_profile_id", criados);
  await service.from("professional_practice_areas").delete().in("professional_profile_id", criados);
  await service.from("audit_logs").delete().in("metadata->>professional_profile_id", criados);
  await service.from("professional_profiles").delete().in("id", criados);
});

describe("T-7R-1 · o predicado SQL e o espelho TS não divergem", () => {
  it("todas as combinações de ciclo × demo × fixture × divergência", async () => {
    const divergentes: string[] = [];

    for (const c of COMBINACOES) {
      const id = await montar(c);

      const { data, error } = await service
        .schema("curadoria")
        .rpc("elegibilidade_do_profissional", { p_id: id });
      if (error) throw new Error(`predicado (${JSON.stringify(c)}): ${error.message}`);
      const sql = (data as unknown[])[0] as {
        eligible: boolean;
        reason_code: string;
        blocking_requirements: string[];
        ciclo: string | null;
      };

      // O estado REAL da linha é lido do banco: demo e fixture podem não ter
      // chegado onde a combinação pediu, e comparar contra o pedido em vez do
      // realizado faria o teste medir a fixture, não a regra.
      const { data: linha } = await service
        .from("professional_profiles")
        .select("ciclo_de_vida, is_demo, is_test_fixture")
        .eq("id", id)
        .single();

      const ts = elegibilidadeEfetiva({
        ciclo: linha!.ciclo_de_vida as CicloDoProfissional | null,
        isDemo: linha!.is_demo as boolean,
        isTestFixture: linha!.is_test_fixture as boolean,
        divergenciasCriticas: c.critica ? 1 : 0,
      });

      const rotulo = `ciclo=${linha!.ciclo_de_vida ?? "NULO"} demo=${linha!.is_demo} fixture=${linha!.is_test_fixture} critica=${c.critica}`;
      if (sql.eligible !== ts.elegivel) {
        divergentes.push(`${rotulo}: elegível SQL=${sql.eligible} TS=${ts.elegivel}`);
      }
      if (sql.reason_code !== ts.codigo) {
        divergentes.push(`${rotulo}: código SQL=${sql.reason_code} TS=${ts.codigo}`);
      }
      if ((sql.blocking_requirements ?? []).length !== ts.bloqueios.length) {
        divergentes.push(
          `${rotulo}: bloqueios SQL=[${(sql.blocking_requirements ?? []).join(" | ")}] TS=[${ts.bloqueios.join(" | ")}]`,
        );
      }
    }

    expect(divergentes, `combinações em que as duas réguas discordam:\n${divergentes.join("\n")}`).toEqual([]);
  }, 180_000);
});

describe("T-7R-3 · demo e fixture são exclusão absoluta", () => {
  it("nenhuma delas chega a PUBLICADO_ATIVO por caminho nenhum", async () => {
    for (const marca of [{ is_demo: true }, { is_test_fixture: true }]) {
      const { data } = await service
        .from("professional_profiles")
        .insert({
          display_name: "Exclusão absoluta C7R",
          professional_identifier: `${MARCA}-${randomUUID().slice(0, 12)}`,
          created_by: autor,
          ...marca,
        })
        .select("id")
        .single();
      const id = data!.id as string;
      criados.push(id);

      const { error } = await service
        .from("professional_profiles")
        .update({
          ciclo_de_vida: "PUBLICADO_ATIVO",
          ciclo_motivo: "CADASTRO_VALIDADO",
          ciclo_alterado_por: autor,
        })
        .eq("id", id);

      expect(error, `${JSON.stringify(marca)} entrou na Rede como publicado`).not.toBeNull();
    }
  });
});
