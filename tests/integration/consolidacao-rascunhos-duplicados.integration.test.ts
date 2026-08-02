// =============================================================================
// A LÓGICA DE CONSOLIDAÇÃO DA MIGRATION 20260802120000, exercitada de verdade.
//
// Por que existe: a primeira versão da regra preservava o rascunho MAIS
// ANTIGO — e nos dados reais o mais antigo era justamente o vazio criado pelo
// prefetch, enquanto o mais novo tinha as respostas da paciente. A regra
// errada teria descartado o que ela escreveu.
//
// "Conteúdo relevante" é definido como: `data` cujo texto, depois de aparado,
// não é vazio, `{}` nem `null`. Ou seja — qualquer resposta gravada, mesmo uma
// só ("paraQuem"), torna o rascunho digno de sobreviver. O critério é
// CONTEÚDO; `created_at` só desempata entre dois vazios.
//
// Cada cenário roda a MESMA expressão SQL da migration, sobre linhas criadas
// aqui, e confere quem sobrou.
// =============================================================================
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const supabase = createAdminSupabaseClient();
let profileId: string;

/** A cláusula exata da migration, aplicada a um paciente. */
const SQL_CONSOLIDACAO = `
delete from curadoria.patient_stories vazio
where vazio.status = 'rascunho'
  and vazio.profile_id = $1
  and coalesce(btrim(vazio.data::text), '') in ('', '{}', 'null')
  and exists (
    select 1 from curadoria.patient_stories manter
     where manter.profile_id = vazio.profile_id
       and manter.status = 'rascunho'
       and manter.id <> vazio.id
       and (coalesce(btrim(manter.data::text), '') not in ('', '{}', 'null')
            or manter.created_at < vazio.created_at
            or (manter.created_at = vazio.created_at and manter.id < vazio.id))
  );`;

/** A guarda da migration: aborta se houver mais de um rascunho com conteúdo. */
const SQL_GUARDA = `
select count(*)::int as duplicados
from (
  select profile_id
  from curadoria.patient_stories
  where status = 'rascunho'
    and coalesce(btrim(data::text), '') not in ('', '{}', 'null')
    and profile_id = $1
  group by profile_id
  having count(*) > 1
) t;`;

/**
 * SQL cru contra a stack local.
 *
 * A migration é DDL + DELETE: não há como exercitá-la pelo PostgREST, que não
 * expõe DDL nem deixa violar o índice para montar o cenário "banco já sujo" —
 * que é exatamente o estado que a migration encontra em produção. Este teste
 * fala com o mesmo container que `supabase start` sobe.
 */
async function sql(query: string, params: (string | null)[] = []): Promise<string[]> {
  const substituido = params.reduce<string>(
    (texto, valor, indice) =>
      texto.replaceAll(
        "$" + (indice + 1),
        valor === null ? "null" : "'" + String(valor).replaceAll("'", "''") + "'",
      ),
    query,
  );

  const saida = execFileSync(
    "docker",
    ["exec", "supabase_db_aliviar-conexao", "psql", "-U", "postgres", "-t", "-A", "-c", substituido],
    { encoding: "utf-8" },
  );

  return saida.split(/\r?\n/).filter((linha) => linha.trim() !== "");
}

/**
 * O índice único impede inserir dois rascunhos pela via normal — e é ele que
 * estamos validando. Para montar o cenário "banco já sujo" (o estado que a
 * migration encontra em produção), o índice é derrubado e recriado ao final.
 */
async function comIndiceSuspenso<T>(fn: () => Promise<T>): Promise<T> {
  await sql("drop index if exists curadoria.patient_stories_um_rascunho_por_paciente;", []);
  try {
    return await fn();
  } finally {
    // A limpeza vem ANTES de recriar o índice: os cenários que exigem decisão
    // humana terminam de propósito com dois rascunhos vivos, e o índice não
    // nasceria sobre eles. Limpar aqui é do teste, não da migration — em
    // produção, esses casos param a migration e esperam uma pessoa.
    await sql("delete from curadoria.patient_stories where profile_id = $1;", [profileId]);
    await sql(
      `create unique index if not exists patient_stories_um_rascunho_por_paciente
         on curadoria.patient_stories (profile_id) where status = 'rascunho';`,
      [],
    );
  }
}

async function criarRascunho(data: Record<string, unknown>, criadoEm?: string): Promise<string> {
  const id = randomUUID();
  await sql(
    `insert into curadoria.patient_stories (id, profile_id, created_by, data, status, created_at)
     values ($1, $2, $2, $3::jsonb, 'rascunho', coalesce($4::timestamptz, now()));`,
    [id, profileId, JSON.stringify(data), criadoEm ?? null],
  );
  return id;
}

async function rascunhosVivos(): Promise<string[]> {
  const { data } = await supabase
    .from("patient_stories")
    .select("id")
    .eq("profile_id", profileId)
    .eq("status", "rascunho");
  return (data ?? []).map((row) => row.id as string);
}

beforeAll(async () => {
  const sufixo = randomUUID().slice(0, 8);
  const { data: criado, error } = await supabase.auth.admin.createUser({
    email: "consolidacao-" + sufixo + "@aliviar-conexao.local",
    password: "Senha-" + sufixo + "-Ok!",
    email_confirm: true,
    user_metadata: { display_name: "Consolidação de Rascunhos" },
  });
  if (error || !criado?.user) throw new Error("fixture: " + (error?.message ?? "sem usuário"));
  profileId = criado.user.id;
});

afterEach(async () => {
  await supabase.from("patient_stories").delete().eq("profile_id", profileId);
});

afterAll(async () => {
  await supabase.auth.admin.deleteUser(profileId);
});

describe("consolidação de rascunhos duplicados (migration 20260802120000)", () => {
  it("vazio + com conteúdo → preserva o que tem conteúdo, mesmo sendo o mais novo", async () => {
    await comIndiceSuspenso(async () => {
      const vazio = await criarRascunho({}, "2026-08-01T00:00:00Z");
      const comConteudo = await criarRascunho({ paraQuem: "para-mim" }, "2026-08-02T00:00:00Z");
      await sql(SQL_CONSOLIDACAO, [profileId]);

      const vivos = await rascunhosVivos();
      expect(vivos).toEqual([comConteudo]);
      expect(vivos).not.toContain(vazio);
    });
  });

  it("com conteúdo + vazio → preserva o que tem conteúdo, mesmo sendo o mais antigo", async () => {
    await comIndiceSuspenso(async () => {
      const comConteudo = await criarRascunho({ paraQuem: "para-mim" }, "2026-08-01T00:00:00Z");
      await criarRascunho({}, "2026-08-02T00:00:00Z");
      await sql(SQL_CONSOLIDACAO, [profileId]);

      expect(await rascunhosVivos()).toEqual([comConteudo]);
    });
  });

  it("vazio + vazio → preserva um só, deterministicamente (o mais antigo)", async () => {
    await comIndiceSuspenso(async () => {
      const antigo = await criarRascunho({}, "2026-08-01T00:00:00Z");
      await criarRascunho({}, "2026-08-02T00:00:00Z");
      await sql(SQL_CONSOLIDACAO, [profileId]);

      expect(await rascunhosVivos()).toEqual([antigo]);
    });
  });

  it("dois com conteúdo → nada é descartado em silêncio, e a guarda acusa", async () => {
    await comIndiceSuspenso(async () => {
      await criarRascunho({ paraQuem: "para-mim" }, "2026-08-01T00:00:00Z");
      await criarRascunho({ paraQuem: "para-outra-pessoa" }, "2026-08-02T00:00:00Z");

      await sql(SQL_CONSOLIDACAO, [profileId]);
      expect(await rascunhosVivos(), "conteúdo foi descartado sem decisão humana").toHaveLength(2);

      const guarda = await sql(SQL_GUARDA, [profileId]);
      expect(Number(guarda[0]), "a migration não abortaria neste banco").toBe(1);
    });
  });

  it("conteúdos idênticos também exigem decisão humana — igualdade não é permissão", async () => {
    await comIndiceSuspenso(async () => {
      await criarRascunho({ paraQuem: "para-mim" }, "2026-08-01T00:00:00Z");
      await criarRascunho({ paraQuem: "para-mim" }, "2026-08-02T00:00:00Z");

      await sql(SQL_CONSOLIDACAO, [profileId]);
      expect(await rascunhosVivos()).toHaveLength(2);

      const guarda = await sql(SQL_GUARDA, [profileId]);
      expect(Number(guarda[0])).toBe(1);
    });
  });

  it("um rascunho só, ou nenhum, atravessa a consolidação intacto", async () => {
    const unico = await criarRascunho({ paraQuem: "para-mim" });
    await sql(SQL_CONSOLIDACAO, [profileId]);
    expect(await rascunhosVivos()).toEqual([unico]);

    await supabase.from("patient_stories").delete().eq("profile_id", profileId);
    await sql(SQL_CONSOLIDACAO, [profileId]);
    expect(await rascunhosVivos()).toEqual([]);
  });

  it("história enviada não entra no índice — uma nova pode nascer depois dela", async () => {
    const enviada = randomUUID();
    await sql(
      `insert into curadoria.patient_stories (id, profile_id, created_by, data, status)
       values ($1, $2, $2, '{"paraQuem":"para-mim"}'::jsonb, 'enviada');`,
      [enviada, profileId],
    );

    const { error } = await supabase
      .from("patient_stories")
      .insert({ profile_id: profileId, created_by: profileId });

    expect(error, "o índice bloqueou um rascunho novo depois de uma história enviada").toBeNull();
    await supabase.from("patient_stories").delete().eq("id", enviada);
  });
});
