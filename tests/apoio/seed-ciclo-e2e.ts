import { execFileSync } from "node:child_process";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { argumentosPsql, containerDoBanco } from "./stack-local";

/**
 * C7R · SEED DETERMINÍSTICO DOS CENÁRIOS VISUAIS — só para stack isolada.
 *
 * Oito profissionais sintéticos `EV-C7-*`, nenhum dado pessoal real, nos
 * estados que os sete cenários da evidência exigem. As seis contas de teste
 * vêm do bootstrap oficial — foi a ausência delas que produziu as 202 falhas
 * da primeira verificação.
 *
 * ⛔ TRAVA: recusa rodar sem `SUPABASE_DB_CONTAINER` apontando para uma stack
 * que não seja a padrão. A stack original nunca recebe este seed.
 */

const RAIZ = path.resolve(__dirname, "..", "..");

export type SeedCiclo = { ids: Record<string, string>; adminId: string };

function psql(sql: string): string {
  const argumentos = argumentosPsql("");
  const semComando = argumentos.slice(0, argumentos.indexOf("-c"));
  semComando.splice(1, 0, "-i");
  semComando.push("-v", "ON_ERROR_STOP=1");
  return execFileSync("docker", semComando, { encoding: "utf8", input: sql }).trim();
}

export async function semearCicloE2E(): Promise<SeedCiclo> {
  const container = containerDoBanco();
  if (container === "supabase_db_aliviar-conexao") {
    throw new Error(
      "Este seed é exclusivo de stack isolada. Aponte SUPABASE_DB_CONTAINER para ela — a stack original não o recebe.",
    );
  }

  // 1 · As seis contas de bootstrap, pelo script oficial.
  execFileSync(
    "node",
    [path.join(RAIZ, "scripts", "with-local-supabase.mjs"), "node", path.join(RAIZ, "scripts", "bootstrap-local-test-users.mjs")],
    { cwd: RAIZ, encoding: "utf8", env: process.env },
  );

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { db: { schema: "curadoria" } },
  );

  const { data: papel } = await service.from("roles").select("id").eq("slug", "administrador").single();
  const { data: vinculo } = await service
    .from("user_roles")
    .select("profile_id")
    .eq("role_id", papel!.id)
    .limit(1);
  const adminId = vinculo?.[0]?.profile_id as string;
  if (!adminId) throw new Error("bootstrap não criou administrador");

  /** Perfil publicável completo; o estado final vem depois, pela porta certa. */
  async function criar(sufixo: string, sobre: { completo?: boolean; cicloNulo?: boolean } = {}) {
    const identificador = `EV-C7-${sufixo}`;
    const { data: existente } = await service
      .from("professional_profiles")
      .select("id")
      .eq("professional_identifier", identificador)
      .limit(1);
    // Tentativas abortadas podem ter deixado duplicatas; a primeira vale, e o
    // seed não multiplica.
    if (existente && existente.length > 0) return existente[0]!.id as string;

    const completo = sobre.completo !== false;
    const { data, error } = await service
      .from("professional_profiles")
      .insert({
        display_name: `Profissional Sintético ${sufixo}`,
        professional_identifier: identificador,
        created_by: adminId,
        professional_summary: "Perfil sintético de evidência visual. Não representa pessoa real.",
        ...(sobre.cicloNulo ? { ciclo_de_vida: null } : {}),
        ...(completo
          ? {
              crm: `EV-${sufixo}`,
              crm_uf: "SP",
              registration_status: "regular",
              registration_source: "Evidência sintética C7R",
              registration_verified_at: new Date().toISOString(),
              registration_verified_by: adminId,
            }
          : {}),
      })
      .select("id")
      .single();
    if (error) throw new Error(`seed ${identificador}: ${error.message}`);
    const id = data!.id as string;

    if (completo) {
      const { error: eArea } = await service.from("professional_practice_areas").insert({
        professional_profile_id: id,
        raw_text: "Área sintética de evidência",
        verification_status: "verificado",
        source: "Evidência sintética C7R",
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      });
      if (eArea) throw new Error(`seed área ${identificador}: ${eArea.message}`);
    }
    return id;
  }

  async function publicar(id: string) {
    const { error } = await service.rpc("transicionar_ciclo_como_servico", {
      p_profissional: id,
      p_para: "PUBLICADO_ATIVO",
      p_motivo: "CADASTRO_VALIDADO",
      p_ator: adminId,
    });
    if (error && !error.message.includes("não permitida")) {
      throw new Error(`seed publicar: ${error.message}`);
    }
  }

  const ids: Record<string, string> = {};
  for (const sufixo of ["01", "02", "03", "04", "06"]) {
    ids[sufixo] = await criar(sufixo);
    await publicar(ids[sufixo]);
  }
  // 05 · publicação bloqueada: PREPARACAO, sem CRM/área — as pendências reais.
  ids["05"] = await criar("05", { completo: false });
  // 08 · pausado: publica e pausa, tudo pela porta da frente.
  ids["08"] = await criar("08");
  await publicar(ids["08"]);
  await service.rpc("transicionar_ciclo_como_servico", {
    p_profissional: ids["08"],
    p_para: "PAUSADO",
    p_motivo: "REVISAO_CADASTRAL",
    p_ator: adminId,
  });

  // 07 · legado NULL. O default é PREPARACAO e o nascimento espelha; o único
  // jeito honesto de reproduzir um legado é o mesmo da ressincronização: os
  // DOIS triggers suspensos e restaurados NA MESMA transação, sem motivo,
  // autoria ou data — e provado ao final.
  ids["07"] = await criar("07", { cicloNulo: true });
  psql(
    `begin;
     alter table curadoria.professional_profiles disable trigger assert_ciclo_do_profissional;
     alter table curadoria.professional_profiles disable trigger registrar_trilha_do_ciclo;
     update curadoria.professional_profiles
        set ciclo_de_vida = null, ciclo_motivo = null, ciclo_alterado_por = null, ciclo_alterado_em = null
      where professional_identifier = 'EV-C7-07';
     alter table curadoria.professional_profiles enable trigger assert_ciclo_do_profissional;
     alter table curadoria.professional_profiles enable trigger registrar_trilha_do_ciclo;
     commit;`,
  );
  const prova = psql(
    `select (select count(*) from pg_trigger t where t.tgrelid='curadoria.professional_profiles'::regclass and t.tgname in ('assert_ciclo_do_profissional','registrar_trilha_do_ciclo') and t.tgenabled = 'O')
      || '|' || (select coalesce(ciclo_de_vida::text,'NULO') || coalesce(ciclo_motivo::text,'') || coalesce(ciclo_alterado_por::text,'') from curadoria.professional_profiles where professional_identifier='EV-C7-07' limit 1);`,
  );
  if (prova !== "2|NULO") {
    throw new Error(`legado 07 inconsistente ou trigger não restaurado: "${prova}"`);
  }

  return { ids, adminId };
}
