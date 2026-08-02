// =============================================================================
// REGRESSÃO — uma paciente, um rascunho (Release de Reconstrução, ETAPA 9).
//
// O defeito real, capturado no E2E do fluxo completo: a paciente terminou com
// DUAS histórias, criadas com 47 microssegundos de diferença. `/sua-historia/
// continuar` é um GET que grava, e o prefetch do Next.js o executa sem clique;
// a leitura-depois-escrita de getOrCreateActiveStory não tinha trava.
//
// Este teste chama a função em paralelo — a corrida de verdade, não uma
// simulação — e exige uma única história. Se o índice parcial cair, ele falha.
// =============================================================================
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getOrCreateActiveStory } from "@/modules/story/repository";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const supabase = createAdminSupabaseClient();
let profileId: string;

beforeAll(async () => {
  // A pessoa precisa existir de verdade: profiles.id referencia auth.users.
  const sufixo = randomUUID().slice(0, 8);
  const { data: criado, error } = await supabase.auth.admin.createUser({
    email: "corrida-historia-" + sufixo + "@aliviar-conexao.local",
    password: "Senha-" + sufixo + "-Ok!",
    email_confirm: true,
    user_metadata: { display_name: "Corrida de História" },
  });
  if (error || !criado?.user) throw new Error("fixture: " + (error?.message ?? "sem usuário"));
  profileId = criado.user.id;
});

afterAll(async () => {
  await supabase.from("patient_stories").delete().eq("profile_id", profileId);
  await supabase.auth.admin.deleteUser(profileId);
});

describe("uma história em rascunho por paciente", () => {
  it("chamadas concorrentes devolvem a MESMA história — nunca duas", async () => {
    const resultados = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateActiveStory(supabase, profileId)),
    );

    const ids = new Set(resultados.map((story) => story.id));
    expect(ids.size, "cada chamada criou a sua própria história").toBe(1);

    const { data } = await supabase
      .from("patient_stories")
      .select("id")
      .eq("profile_id", profileId)
      .eq("status", "rascunho");

    expect(data ?? []).toHaveLength(1);
  });

  it("o banco recusa um segundo rascunho, mesmo por escrita direta", async () => {
    const { error } = await supabase
      .from("patient_stories")
      .insert({ profile_id: profileId, created_by: profileId });

    expect(error, "o índice parcial deixou passar um segundo rascunho").not.toBeNull();
    expect((error as { code?: string } | null)?.code).toBe("23505");
  });
});
