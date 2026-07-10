import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_STAFF_EMAIL;
const testPassword = process.env.TEST_STAFF_PASSWORD;
const testJourneyId = process.env.TEST_JOURNEY_ID;
const testAssigneeId = process.env.TEST_ASSIGNEE_ID;

const hasRealEnv =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  testEmail &&
  testPassword &&
  testJourneyId &&
  testAssigneeId;

describe.skipIf(!hasRealEnv)("journey_commitments RLS (Supabase real)", () => {
  it("usuário ativo cria compromisso", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    await supabase.auth.signInWithPassword({ email: testEmail!, password: testPassword! });

    const { data, error } = await supabase
      .from("journey_commitments")
      .insert({
        journey_id: testJourneyId!,
        title: "Teste integração compromisso",
        assigned_to: testAssigneeId!,
        created_by: (await supabase.auth.getUser()).data.user!.id,
      })
      .select("id")
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeTruthy();
  });

  it("usuário anônimo é bloqueado", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { error } = await supabase.from("journey_commitments").select("*").limit(1);
    expect(error).not.toBeNull();
  });

  it("tentativa de DELETE é rejeitada", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    await supabase.auth.signInWithPassword({ email: testEmail!, password: testPassword! });

    const { error } = await supabase
      .from("journey_commitments")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000001");

    expect(error).not.toBeNull();
  });
});

describe("journey_commitments RLS (documented expectations)", () => {
  it("requer variáveis de ambiente para testes reais", () => {
    if (!hasRealEnv) {
      console.info(
        "Testes RLS de compromissos ignorados. Configure TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD, TEST_JOURNEY_ID e TEST_ASSIGNEE_ID.",
      );
    }
    expect(true).toBe(true);
  });
});
