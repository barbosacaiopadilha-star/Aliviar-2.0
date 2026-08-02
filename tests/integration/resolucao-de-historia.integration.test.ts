// =============================================================================
// REGRESSÃO — qual história "Minha História" abre (Release de Reconstrução).
//
// O defeito que motivou: depois de ENVIAR, a paciente clicava em "Minha
// história" e ganhava um rascunho novo em branco — a história que ela acabara
// de contar sumia da vista. `getOrCreateActiveStory` só procurava rascunho, e
// quem enviou não tem rascunho.
//
// A regra vigente, provada aqui:
//   1. rascunho ativo existente;
//   2. sem rascunho → última história ENVIADA;
//   3. criar somente quando não existe história nenhuma;
//   4. segunda história somente por ação explícita — nunca por navegação.
// =============================================================================
import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, afterAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getLatestStory, getOrCreateActiveStory } from "@/modules/story/repository";

const admin = createAdminSupabaseClient();
let profileId: string;

async function limparHistorias() {
  await admin.from("patient_story_attachments").delete().neq("story_id", randomUUID());
  await admin.from("patient_stories").delete().eq("profile_id", profileId);
}

async function criar(status: "rascunho" | "enviada", data: Record<string, unknown>, criadoEm: string) {
  const id = randomUUID();
  const { error } = await admin.from("patient_stories").insert({
    id,
    profile_id: profileId,
    created_by: profileId,
    status,
    data,
    created_at: criadoEm,
  });
  if (error) throw new Error("fixture: " + error.message);
  return id;
}

beforeAll(async () => {
  const sufixo = randomUUID().slice(0, 8);
  const { data: criado, error } = await admin.auth.admin.createUser({
    email: "resolucao-" + sufixo + "@aliviar-conexao.local",
    password: "Senha-" + sufixo + "-Ok!",
    email_confirm: true,
    user_metadata: { display_name: "Resolução de História" },
  });
  if (error || !criado?.user) throw new Error("fixture: " + (error?.message ?? "sem usuário"));
  profileId = criado.user.id;
});

afterEach(limparHistorias);

afterAll(async () => {
  await limparHistorias();
  await admin.auth.admin.deleteUser(profileId);
});

describe("resolução de 'Minha História'", () => {
  it("paciente sem história: cria exatamente um rascunho", async () => {
    expect(await getLatestStory(admin, profileId)).toBeNull();

    const criada = await getOrCreateActiveStory(admin, profileId);
    expect(criada.status).toBe("rascunho");

    const { data } = await admin.from("patient_stories").select("id").eq("profile_id", profileId);
    expect(data ?? []).toHaveLength(1);
  });

  it("paciente com rascunho: abre o MESMO rascunho, nunca outro", async () => {
    const rascunhoId = await criar("rascunho", { paraQuem: "para-mim" }, "2026-08-01T00:00:00Z");

    const resolvida = await getLatestStory(admin, profileId);
    expect(resolvida?.id).toBe(rascunhoId);

    const deNovo = await getOrCreateActiveStory(admin, profileId);
    expect(deNovo.id).toBe(rascunhoId);

    const { data } = await admin.from("patient_stories").select("id").eq("profile_id", profileId);
    expect(data ?? []).toHaveLength(1);
  });

  it("história enviada e sem rascunho: abre a ENVIADA e não cria rascunho", async () => {
    const enviadaId = await criar("enviada", { historia: "minha história completa" }, "2026-08-01T00:00:00Z");

    const resolvida = await getLatestStory(admin, profileId);
    expect(resolvida?.id).toBe(enviadaId);
    expect(resolvida?.status).toBe("enviada");

    // getLatestStory é leitura pura — nada nasce por resolver.
    const { data } = await admin
      .from("patient_stories")
      .select("id, status")
      .eq("profile_id", profileId);
    expect(data ?? []).toHaveLength(1);
    expect(data![0]!.status).toBe("enviada");
  });

  it("enviada + rascunho deliberado: abre o rascunho e preserva a enviada", async () => {
    const enviadaId = await criar("enviada", { historia: "primeira história" }, "2026-08-01T00:00:00Z");
    const rascunhoId = await criar("rascunho", { paraQuem: "para-mim" }, "2026-08-02T00:00:00Z");

    const resolvida = await getLatestStory(admin, profileId);
    expect(resolvida?.id).toBe(rascunhoId);

    const { data } = await admin
      .from("patient_stories")
      .select("id")
      .eq("profile_id", profileId)
      .order("created_at");
    expect((data ?? []).map((linha) => linha.id)).toEqual([enviadaId, rascunhoId]);
  });

  it("acesso concorrente após envio: todas as chamadas devolvem a MESMA enviada, zero rascunhos", async () => {
    const enviadaId = await criar("enviada", { historia: "história enviada" }, "2026-08-01T00:00:00Z");

    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => getLatestStory(admin, profileId)),
    );

    for (const resultado of resultados) {
      expect(resultado?.id).toBe(enviadaId);
    }

    const { data } = await admin
      .from("patient_stories")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "rascunho");
    expect(data ?? [], "navegar depois de enviar criou rascunho").toHaveLength(0);
  });
});
