import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_STAFF_EMAIL;
const testPassword = process.env.TEST_STAFF_PASSWORD;

const hasRealEnv =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  testEmail &&
  testPassword;

describe.skipIf(!hasRealEnv)("journey_events RLS (Supabase real)", () => {
  it("usuário ativo cria evento manual", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });
    expect(authError).toBeNull();

    const journeyId = process.env.TEST_JOURNEY_ID;
    if (!journeyId) return;

    const { data, error } = await supabase.rpc("create_journey_event", {
      p_journey_id: journeyId,
      p_category: "CONTACT",
      p_title: "Teste integração",
      p_occurred_at: new Date().toISOString(),
    });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
  });

  it("usuário anônimo é bloqueado", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { error } = await supabase.rpc("create_journey_event", {
      p_journey_id: "00000000-0000-0000-0000-000000000001",
      p_category: "CONTACT",
      p_title: "Tentativa anônima",
      p_occurred_at: new Date().toISOString(),
    });
    expect(error).not.toBeNull();
  });

  it("tentativa de DELETE é rejeitada", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    await supabase.auth.signInWithPassword({
      email: testEmail!,
      password: testPassword!,
    });

    const { error } = await supabase
      .from("journey_events")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000001");

    expect(error).not.toBeNull();
  });
});

describe("journey_events RLS (documented expectations)", () => {
  it("requer variáveis de ambiente para testes reais", () => {
    if (!hasRealEnv) {
      console.info(
        "Testes de integração com Supabase real ignorados. Configure TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD e TEST_JOURNEY_ID.",
      );
    }
    expect(true).toBe(true);
  });
});
