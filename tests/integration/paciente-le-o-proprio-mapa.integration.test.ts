// =============================================================================
// REGRESSÃO — a paciente lê o próprio Mapa, e SÓ o próprio (Release de
// Reconstrução, PASSO 8).
//
// O defeito: case_priority_map só tinha policy de admin/curador. A paciente
// não via prioridade nenhuma, o botão de reconhecimento nunca montava, e o
// ato central da ADR-042 era impossível pela interface — com a tela dizendo
// "sem essa confirmação, nada avança".
// =============================================================================
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const admin = createAdminSupabaseClient();

const criados: string[] = [];
let dona: ReturnType<typeof createCuradoriaClient>;
let intrusa: ReturnType<typeof createCuradoriaClient>;
let caseId: string;
let storyId: string;

async function novaPaciente(nome: string) {
  const sufixo = randomUUID().slice(0, 8);
  const email = "mapa-" + sufixo + "@aliviar-conexao.local";
  const password = "Senha-" + sufixo + "-Ok!";
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { display_name: nome },
  });
  if (error || !data?.user) throw new Error("fixture: " + (error?.message ?? "?"));
  criados.push(data.user.id);
  const { data: papel } = await admin.from("roles").select("id").eq("slug", "paciente").single();
  await admin.from("user_roles").insert({ profile_id: data.user.id, role_id: papel!.id });
  const client = createCuradoriaClient(url, anonKey);
  await client.auth.signInWithPassword({ email, password });
  return { id: data.user.id, client };
}

beforeAll(async () => {
  const a = await novaPaciente("Dona do Mapa");
  const b = await novaPaciente("Outra Paciente");
  dona = a.client;
  intrusa = b.client;

  const { data: story } = await admin
    .from("patient_stories")
    .insert({ profile_id: a.id, created_by: a.id, status: "enviada", data: { historia: "x" } })
    .select("id").single();
  storyId = story!.id as string;
  await admin.from("patient_profiles").insert({ profile_id: a.id });
  const { data: caso } = await admin
    .from("cases")
    .insert({ patient_profile_id: a.id, source_story_id: storyId, created_by: a.id })
    .select("id").single();
  caseId = caso!.id as string;

  const { data: conceito } = await admin
    .from("method_subcriteria").select("id").eq("active", true).limit(1).single();
  await admin.from("case_priority_map").insert({
    case_id: caseId, subcriterion_id: conceito!.id, importance: "IMPORTANTE",
  });
});

afterAll(async () => {
  await admin.from("case_priority_map").delete().eq("case_id", caseId);
  await admin.from("cases").delete().eq("id", caseId);
  await admin.from("patient_stories").delete().eq("id", storyId);
  for (const id of criados) {
    await admin.from("patient_profiles").delete().eq("profile_id", id);
    await admin.auth.admin.deleteUser(id);
  }
});

describe("leitura do Mapa de Prioridades pela paciente", () => {
  it("a dona do Case lê o próprio Mapa — é o que habilita o reconhecimento", async () => {
    const { data, error } = await dona.from("case_priority_map").select("id").eq("case_id", caseId);
    expect(error).toBeNull();
    expect(data ?? [], "o botão de reconhecer voltaria a nunca montar").toHaveLength(1);
  });

  it("outra paciente NÃO lê o Mapa alheio", async () => {
    const { data } = await intrusa.from("case_priority_map").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(0);
  });

  it("a paciente não grava no Mapa — a importância é registrada pelo Curador", async () => {
    const { data: conceito } = await admin
      .from("method_subcriteria").select("id").eq("active", true).neq("code", "x").limit(1).single();
    const { error } = await dona.from("case_priority_map").insert({
      case_id: caseId, subcriterion_id: conceito!.id, importance: "RELEVANTE",
    });
    expect(error, "leitura virou escrita").not.toBeNull();
  });
});
