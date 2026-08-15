import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { argumentosPsql } from "../apoio/stack-local";

/**
 * T-7R-11/12 · OPS-G5 · CORTE 7 (remediação final) — a autoria vem da sessão.
 *
 * O Verificador registrou que o trigger exigia autor NÃO NULO mas não o
 * conferia contra a sessão: um writer podia gravar o UUID de terceiro. Desde
 * 20260815021141, o banco decide a autoria; o payload é descartado.
 *
 * As sessões são simuladas por `set role` + `request.jwt.claims` no psql — o
 * mesmo mecanismo que o PostgREST usa —, porque só assim se mede o papel
 * efetivo de verdade, inclusive `service_role` e `anon`.
 */

const service = createAdminSupabaseClient();
const MARCA = "ZZC7RA";
let admin: string;
let outroPerfil: string;
const criados: string[] = [];

function psql(sql: string): string {
  const argumentos = argumentosPsql("");
  const semComando = argumentos.slice(0, argumentos.indexOf("-c"));
  semComando.splice(1, 0, "-i");
  semComando.push("-v", "ON_ERROR_STOP=1");
  try {
    return execFileSync("docker", semComando, { encoding: "utf8", input: sql }).trim();
  } catch (erro) {
    const e = erro as { stderr?: Buffer | string };
    throw new Error("psql: " + (e.stderr ? e.stderr.toString().slice(0, 300) : String(erro)));
  }
}

/** Roda `sql` sob um papel efetivo, com claims JWT como o PostgREST monta. */
function comoSessao(role: "authenticated" | "anon" | "service_role", sub: string | null, sql: string): string {
  const claims = JSON.stringify({ sub: sub ?? undefined, role });
  return psql(
    `begin;
     select set_config('request.jwt.claims', '${claims}', true);
     set local role ${role};
     ${sql}
     commit;`,
  );
}

async function novoProfissional(ciclo?: "PUBLICADO_ATIVO"): Promise<string> {
  const { data, error } = await service
    .from("professional_profiles")
    .insert({
      display_name: "Autoria C7R",
      professional_identifier: `${MARCA}-${randomUUID().slice(0, 12)}`,
      created_by: outroPerfil,
      crm: "000000",
      crm_uf: "SP",
      registration_status: "regular",
      registration_source: "Autoria C7R",
      registration_verified_at: new Date().toISOString(),
      registration_verified_by: outroPerfil,
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture: ${error.message}`);
  const id = data!.id as string;
  criados.push(id);
  await service.from("professional_practice_areas").insert({
    professional_profile_id: id,
    raw_text: "Área da autoria",
    verification_status: "verificado",
    source: "Autoria C7R",
    verified_at: new Date().toISOString(),
    verified_by: outroPerfil,
  });
  if (ciclo === "PUBLICADO_ATIVO") {
    const { error: e2 } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", {
      p_profissional: id,
      p_para: "PUBLICADO_ATIVO",
      p_motivo: "CADASTRO_VALIDADO",
      p_ator: outroPerfil,
    });
    if (e2) throw new Error(`ponto de partida: ${e2.message}`);
  }
  return id;
}

async function lerAutoria(id: string) {
  const { data } = await service
    .from("professional_profiles")
    .select("ciclo_de_vida, ciclo_alterado_por, updated_by")
    .eq("id", id)
    .single();
  return data as { ciclo_de_vida: string; ciclo_alterado_por: string | null; updated_by: string | null };
}

beforeAll(async () => {
  // O admin de verdade: quem tem o papel `administrador` em user_roles — é ele
  // que a policy `professional_profiles_update_admin_only` reconhece.
  const { data: papel } = await service.from("roles").select("id").eq("slug", "administrador").single();
  const { data: vinculo } = await service
    .from("user_roles")
    .select("profile_id")
    .eq("role_id", papel!.id)
    .limit(1);
  admin = vinculo?.[0]?.profile_id as string;
  if (!admin) throw new Error("Nenhum administrador no banco local.");

  const { data: outros } = await service.from("profiles").select("id").neq("id", admin).limit(1);
  outroPerfil = outros?.[0]?.id as string;
  if (!outroPerfil) throw new Error("Só existe um profile no banco local.");
});

afterAll(async () => {
  if (criados.length === 0) return;
  await service.from("professional_practice_areas").delete().in("professional_profile_id", criados);
  await service.from("audit_logs").delete().in("metadata->>professional_profile_id", criados);
  await service.from("professional_profiles").delete().in("id", criados);
});

describe("T-7R-11 · sessão autenticada: a autoria é auth.uid(), sempre", () => {
  it("admin transiciona linha cujo updated_by pertence a outro — e o banco sobrescreve os dois campos", async () => {
    const id = await novoProfissional();
    // A linha nasce com updated_by de OUTRO perfil (o serviço a criou assim).
    // A tentativa de falsificação vai no próprio UPDATE: o payload manda o
    // OUTRO perfil como autor e updated_by — e o banco descarta os dois.
    comoSessao(
      "authenticated",
      admin,
      `update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO',
              ciclo_alterado_por='${outroPerfil}', updated_by='${outroPerfil}'
        where id='${id}';`,
    );

    const linha = await lerAutoria(id);
    expect(linha.ciclo_de_vida).toBe("PUBLICADO_ATIVO");
    expect(linha.ciclo_alterado_por, "a autoria não veio da sessão").toBe(admin);
    expect(linha.updated_by, "updated_by não foi sobrescrito com auth.uid()").toBe(admin);
  });

  it("autenticado comum (sem papel de admin) é recusado pela RLS — a linha não muda", async () => {
    const id = await novoProfissional();
    comoSessao(
      "authenticated",
      outroPerfil,
      `update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
        where id='${id}';`,
    );
    const linha = await lerAutoria(id);
    expect(linha.ciclo_de_vida, "um autenticado sem papel transicionou").toBe("PREPARACAO");
  });

  it("anon é recusado — a linha não muda", async () => {
    const id = await novoProfissional();
    let recusou = false;
    try {
      comoSessao(
        "anon",
        null,
        `update curadoria.professional_profiles
            set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
          where id='${id}';`,
      );
    } catch {
      recusou = true; // sem privilégio de UPDATE, o erro é imediato
    }
    const linha = await lerAutoria(id);
    expect(recusou || linha.ciclo_de_vida === "PREPARACAO", "anon transicionou").toBe(true);
  });

  it("authenticated não aproveita a GUC: define curadoria.actor_id e a autoria segue sendo a própria", async () => {
    const id = await novoProfissional();
    comoSessao(
      "authenticated",
      admin,
      `select set_config('curadoria.actor_id', '${outroPerfil}', true);
       update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
        where id='${id}';`,
    );
    const linha = await lerAutoria(id);
    expect(linha.ciclo_alterado_por, "a GUC valeu para uma sessão autenticada").toBe(admin);
    expect(linha.updated_by).toBe(admin);
  });
});

describe("T-7R-12 · service_role: nunca anônimo, sempre auditado", () => {
  it("sem curadoria.actor_id, o serviço é recusado", async () => {
    const id = await novoProfissional();
    let mensagem = "";
    try {
      comoSessao(
        "service_role",
        null,
        `update curadoria.professional_profiles
            set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
          where id='${id}';`,
      );
    } catch (erro) {
      mensagem = String(erro);
    }
    expect(mensagem, "serviço sem ator transicionou").toContain("ator técnico");
    expect((await lerAutoria(id)).ciclo_de_vida).toBe("PREPARACAO");
  });

  it("com actor_id inválido (não-UUID) é recusado", async () => {
    const id = await novoProfissional();
    let mensagem = "";
    try {
      comoSessao(
        "service_role",
        null,
        `select set_config('curadoria.actor_id', 'nao-e-uuid', true);
         update curadoria.professional_profiles
            set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
          where id='${id}';`,
      );
    } catch (erro) {
      mensagem = String(erro);
    }
    expect(mensagem).toContain("UUID");
  });

  it("com ator desconhecido (UUID sem perfil) é recusado", async () => {
    const id = await novoProfissional();
    let mensagem = "";
    try {
      comoSessao(
        "service_role",
        null,
        `select set_config('curadoria.actor_id', '${randomUUID()}', true);
         update curadoria.professional_profiles
            set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
          where id='${id}';`,
      );
    } catch (erro) {
      mensagem = String(erro);
    }
    expect(mensagem).toContain("nenhum perfil");
  });

  it("com ator válido funciona, grava a autoria declarada e audita ator_tecnico", async () => {
    const id = await novoProfissional();
    comoSessao(
      "service_role",
      null,
      `select set_config('curadoria.actor_id', '${admin}', true);
       update curadoria.professional_profiles
          set ciclo_de_vida='PUBLICADO_ATIVO', ciclo_motivo='CADASTRO_VALIDADO'
        where id='${id}';`,
    );

    const linha = await lerAutoria(id);
    expect(linha.ciclo_de_vida).toBe("PUBLICADO_ATIVO");
    expect(linha.ciclo_alterado_por).toBe(admin);
    expect(linha.updated_by).toBe(admin);

    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata")
      .eq("metadata->>professional_profile_id", id);
    const doCiclo = (trilha ?? []).find(
      (t) => (t.metadata as { ator_tecnico?: boolean }).ator_tecnico !== undefined,
    );
    expect(doCiclo, "a trilha do ciclo não existe").toBeTruthy();
    expect(doCiclo!.actor_id).toBe(admin);
    expect((doCiclo!.metadata as { ator_tecnico: boolean }).ator_tecnico, "não auditou o ator técnico").toBe(
      true,
    );
  });

  it("a RPC do serviço faz o mesmo pela mesma porta — e o carimbo do chamador é ignorado", async () => {
    const id = await novoProfissional();
    const { error } = await service.schema("curadoria").rpc("transicionar_ciclo_como_servico", {
      p_profissional: id,
      p_para: "PUBLICADO_ATIVO",
      p_motivo: "CADASTRO_VALIDADO",
      p_ator: admin,
      p_quando: "2020-01-01T00:00:00.000Z",
    });
    expect(error, `a RPC falhou: ${error?.message}`).toBeNull();

    const linha = await lerAutoria(id);
    expect(linha.ciclo_alterado_por).toBe(admin);
    const { data } = await service
      .from("professional_profiles")
      .select("ciclo_alterado_em")
      .eq("id", id)
      .single();
    expect(new Date(data!.ciclo_alterado_em as string).getFullYear(), "o carimbo de 2020 valeu").toBeGreaterThan(
      2020,
    );
  });
});
