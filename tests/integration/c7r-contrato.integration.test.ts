import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { listApprovedProviders } from "@/modules/curadoria/repository";

import { argumentosPsql } from "../apoio/stack-local";
import { despublicarPeloCiclo, publicarPeloCiclo } from "../apoio/publicacao";

/**
 * T-7R · OPS-G5 · CORTE 7 (remediação) — o contrato, formalizado.
 *
 * Cada bloco carrega o número do plano do 02 ARQUITETO. T-7R-1/3 vivem em
 * `c7r-paridade`; T-7R-7 (carimbo do cliente ignorado, 2020 recusado) e
 * T-7R-17/18 (guarda 11, exclusão com história) vivem em `c7-ciclo`;
 * T-7R-19 em `c7r-container`. Aqui entram os que faltavam.
 *
 * ⛔ T-7R-11/12 (autoria forçada por `auth.uid()`, GUC de `service_role`) NÃO
 * estão aqui: exigiriam nova migration, e isso é decisão fora desta passagem.
 */

const service = createAdminSupabaseClient();
const MARCA = "ZZC7RC";
let autor: string;
const criados: string[] = [];

function psql(sql: string): string {
  // O SQL entra por STDIN, não por argumento: no Windows, argumento multi-linha
  // de `docker exec` chega truncado ao psql. Pelo stdin não há mangling nenhum.
  const argumentos = argumentosPsql("");
  const semComando = argumentos.slice(0, argumentos.indexOf("-c"));
  semComando.splice(1, 0, "-i");
  semComando.push("-v", "ON_ERROR_STOP=1");
  try {
    return execFileSync("docker", semComando, { encoding: "utf8", input: sql }).trim();
  } catch (erro) {
    const e = erro as { stderr?: Buffer | string };
    const detalhe = e.stderr ? e.stderr.toString().slice(0, 400) : String(erro);
    throw new Error("psql: " + detalhe);
  }
}

async function novoProfissionalPublicavel(): Promise<string> {
  const { data, error } = await service
    .from("professional_profiles")
    .insert({
      display_name: "Contrato C7R",
      professional_identifier: `${MARCA}-${randomUUID().slice(0, 12)}`,
      created_by: autor,
      crm: "000000",
      crm_uf: "SP",
      registration_status: "regular",
      registration_source: "Contrato C7R",
      registration_verified_at: new Date().toISOString(),
      registration_verified_by: autor,
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture: ${error.message}`);
  const id = data!.id as string;
  criados.push(id);
  const { error: eArea } = await service.from("professional_practice_areas").insert({
    professional_profile_id: id,
    raw_text: "Área do contrato",
    verification_status: "verificado",
    source: "Contrato C7R",
    verified_at: new Date().toISOString(),
    verified_by: autor,
  });
  if (eArea) throw new Error(`fixture da área: ${eArea.message}`);
  return id;
}

beforeAll(async () => {
  const { data } = await service.from("profiles").select("id").limit(1);
  autor = data?.[0]?.id as string;
  if (!autor) throw new Error("Nenhum profile no banco local.");
});

afterAll(async () => {
  if (criados.length === 0) return;
  await service.from("professional_practice_areas").delete().in("professional_profile_id", criados);
  await service.from("audit_logs").delete().in("metadata->>professional_profile_id", criados);
  await service.from("professional_profiles").delete().in("id", criados);
});

describe("T-7R-2 · linha ressincronizada é reconhecível, sem história fabricada", () => {
  it("todo PUBLICADO_ATIVO tem ato completo ou ato nenhum — nunca meio ato", async () => {
    // A ressincronização deixa motivo, autoria e data NULOS; a porta da frente
    // preenche os três. Um estado intermediário seria história pela metade —
    // fabricada ou perdida. O invariante vale em qualquer stack, com ou sem
    // linhas ressincronizadas.
    const { data } = await service
      .from("professional_profiles")
      .select("id, ciclo_motivo, ciclo_alterado_por, ciclo_alterado_em")
      .eq("ciclo_de_vida", "PUBLICADO_ATIVO");

    const meioAto = (data ?? []).filter((l) => {
      const nulos = [l.ciclo_motivo, l.ciclo_alterado_por, l.ciclo_alterado_em].filter(
        (v) => v === null,
      ).length;
      return nulos !== 0 && nulos !== 3;
    });
    expect(meioAto, "linhas com história pela metade").toEqual([]);
  });
});

describe("T-7R-4 · os campos antigos não mudam sem o ciclo mudar", () => {
  it("status e publication_status são recusados um a um", async () => {
    const id = await novoProfissionalPublicavel();
    for (const campo of [{ status: "inativo" }, { publication_status: "publicado" }]) {
      const { error } = await service.from("professional_profiles").update(campo).eq("id", id);
      expect(error, `${JSON.stringify(campo)} passou sem o ciclo`).not.toBeNull();
      expect(error!.message).toContain("mudanças de ciclo");
    }
  });
});

describe("T-7R-5/6 · publicar é transição, e o espelho é atômico", () => {
  it("publicar espelha ativo/publicado; despublicar espelha inativo/nao_publicado", async () => {
    const id = await novoProfissionalPublicavel();

    expect(
      (await publicarPeloCiclo(service, id, autor))
        .error,
    ).toBeNull();
    let { data: linha } = await service
      .from("professional_profiles")
      .select("ciclo_de_vida, status, publication_status")
      .eq("id", id)
      .single();
    expect(linha).toMatchObject({
      ciclo_de_vida: "PUBLICADO_ATIVO",
      status: "ativo",
      publication_status: "publicado",
    });

    expect(
      (
        await despublicarPeloCiclo(service, id, autor)
      ).error,
    ).toBeNull();
    ({ data: linha } = await service
      .from("professional_profiles")
      .select("ciclo_de_vida, status, publication_status")
      .eq("id", id)
      .single());
    expect(linha).toMatchObject({
      ciclo_de_vida: "PAUSADO",
      status: "inativo",
      publication_status: "nao_publicado",
    });
  });
});

describe("T-7R-8/9/10 · o relógio do banco, na mesma transação", () => {
  it("duas transições do MESMO profissional na mesma transação: crescentes", async () => {
    const id = await novoProfissionalPublicavel();
    // O supabase-js não abre transação; o psql abre. É exatamente o cenário que
    // `now()` reprovaria — e que `greatest(clock_timestamp(), anterior+1µs)`
    // resolve. O DO roda como uma transação única.
    psql(
      `do $$
       declare t1 timestamptz; t2 timestamptz;
       begin
         update curadoria.professional_profiles
            set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO', ciclo_alterado_por='${autor}'
          where id='${id}';
         select ciclo_alterado_em into t1 from curadoria.professional_profiles where id='${id}';
         update curadoria.professional_profiles
            set ciclo_de_vida='PAUSADO', ciclo_motivo='REVISAO_CADASTRAL', ciclo_alterado_por='${autor}'
          where id='${id}';
         select ciclo_alterado_em into t2 from curadoria.professional_profiles where id='${id}';
         if t2 > t1 then raise notice 'CRESCENTE'; else raise notice 'EMPATOU % %', t1, t2; end if;
       end $$;`,
    );
    // Se o instante tivesse empatado, o segundo UPDATE teria levantado exceção
    // (a guarda antiga) ou o greatest teria resolvido; o estado final PAUSADO
    // prova que as duas transições aconteceram, e a consulta abaixo confere a
    // monotonicidade de verdade.
    const { data } = await service
      .from("professional_profiles")
      .select("ciclo_de_vida")
      .eq("id", id)
      .single();
    expect(data!.ciclo_de_vida, "a transação não completou").toBe("PAUSADO");

    // A trilha do ciclo tem 2 linhas; a de publicação, disparada pelo espelho,
    // soma mais 2 — e isso é o desenho: a publicação virou consequência.
    const { data: trilha } = await service
      .from("audit_logs")
      .select("action, metadata")
      .eq("metadata->>professional_profile_id", id)
      .order("id");
    const instantes = (trilha ?? [])
      .filter((t) => String(t.action).startsWith("professional_ciclo_"))
      .map((t) => new Date((t.metadata as { em: string }).em).getTime());
    expect(instantes.length).toBe(2);
    expect(instantes[1]!, "o segundo instante não é estritamente maior").toBeGreaterThan(instantes[0]!);
  });

  it("lote de profissionais distintos na mesma transação: todos passam", async () => {
    const a = await novoProfissionalPublicavel();
    const b = await novoProfissionalPublicavel();
    psql(
      `begin;
       update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO', ciclo_alterado_por='${autor}'
        where id in ('${a}','${b}');
       commit;`,
    );
    const { data } = await service
      .from("professional_profiles")
      .select("id, ciclo_de_vida")
      .in("id", [a, b]);
    expect((data ?? []).every((l) => l.ciclo_de_vida === "PUBLICADO_ATIVO"), "o lote não passou inteiro").toBe(
      true,
    );
  });
});

describe("T-7R-13/14 · classificação de legado", () => {
  async function legadoNulo(): Promise<string> {
    const { data, error } = await service
      .from("professional_profiles")
      .insert({
        display_name: "Legado C7R",
        professional_identifier: `${MARCA}-${randomUUID().slice(0, 12)}`,
        created_by: autor,
        ciclo_de_vida: null,
      })
      .select("id")
      .single();
    if (error) throw new Error(`fixture do legado: ${error.message}`);
    criados.push(data!.id as string);
    return data!.id as string;
  }

  it("sai de NULL só com o motivo próprio, justificativa e autoria — e deixa trilha própria", async () => {
    const id = await legadoNulo();

    const { error: semMotivo } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", { p_profissional: id, p_para: "PREPARACAO", p_motivo: "CADASTRO_VALIDADO", p_ator: autor });
    expect(semMotivo?.message).toContain("CLASSIFICACAO_DE_LEGADO");

    const { error: semNota } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", { p_profissional: id, p_para: "PREPARACAO", p_motivo: "CLASSIFICACAO_DE_LEGADO", p_ator: autor });
    expect(semNota?.message).toContain("justificativa");

    const { error } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", { p_profissional: id, p_para: "PREPARACAO", p_motivo: "CLASSIFICACAO_DE_LEGADO", p_ator: autor, p_nota: "revisão documental do cadastro legado" });
    expect(error).toBeNull();

    const { data: trilha } = await service
      .from("audit_logs")
      .select("action")
      .eq("metadata->>professional_profile_id", id);
    expect((trilha ?? []).map((t) => t.action)).toContain("professional_ciclo_classificacao_de_legado");
  });

  it("não reclassifica quem já tem ciclo", async () => {
    const id = await novoProfissionalPublicavel();
    const { error } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", { p_profissional: id, p_para: "PAUSADO", p_motivo: "CLASSIFICACAO_DE_LEGADO", p_ator: autor, p_nota: "tentativa de usar o atalho do legado" });
    expect(error, "o atalho do legado reclassificou uma linha viva").not.toBeNull();
    expect(error!.message).toContain("já tem ciclo classificado");
  });
});

describe("T-7R-15/16 · a composição e o selo leem a mesma régua", () => {
  it("publicar entra na composição; despublicar sai — e o predicado concorda nos dois momentos", async () => {
    const id = await novoProfissionalPublicavel();

    await publicarPeloCiclo(service, id, autor);
    let oferecidos = (await listApprovedProviders(service)).map((p) => p.professionalProfileId);
    expect(oferecidos, "publicado não entrou na composição").toContain(id);
    let { data: veredito } = await service
      .schema("curadoria")
      .rpc("elegibilidade_do_profissional", { p_id: id });
    expect((veredito as { eligible: boolean }[])[0]!.eligible, "composição e predicado divergem").toBe(true);

    await despublicarPeloCiclo(service, id, autor);
    oferecidos = (await listApprovedProviders(service)).map((p) => p.professionalProfileId);
    expect(oferecidos, "despublicado continuou na composição").not.toContain(id);
    ({ data: veredito } = await service
      .schema("curadoria")
      .rpc("elegibilidade_do_profissional", { p_id: id }));
    expect((veredito as { eligible: boolean }[])[0]!.eligible).toBe(false);
  });
});
