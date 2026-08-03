import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

// B-2: este spec deixou de usar a conta permanente compartilhada. O teste de
// conclusão ENVIA a história, e história enviada é imutável (ADR-048) — na
// execução seguinte o autosave da mesma conta era recusado pelo servidor e o
// primeiro teste ficava vermelho para sempre (one-shot disfarçado de suíte).
// A paciente agora nasce aqui, por execução, pela mesma porta administrativa
// real do produto — e é removida ao final.
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createCuradoriaClient } from "../integration/curadoria-client";

const envPath = path.resolve(__dirname, "../../.env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("Persistência de 'Sua História' (autosave, retomada — ÉPICO 1/SPRINT 1)", () => {
  test.describe.configure({ mode: "serial" });

  const adminClient = createAdminSupabaseClient();
  let adminUserId = "";
  let pacienteEmail = "";
  let pacienteSenha = "";
  let pacienteProfileId = "";

  test.beforeAll(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    const adminEmail = unique("historia-e2e-admin") + "@aliviar-conexao.local";
    const adminAuth = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: "senha-temporaria-123",
      email_confirm: true,
    });
    adminUserId = adminAuth.data.user!.id;
    await adminClient.from("user_roles").insert({
      profile_id: adminUserId,
      role_id: (
        await adminClient.from("roles").select("id").eq("slug", "administrador").single()
      ).data!.id,
    });

    const adminSessionClient = createCuradoriaClient(url, anonKey);
    await adminSessionClient.auth.signInWithPassword({
      email: adminEmail,
      password: "senha-temporaria-123",
    });

    pacienteEmail = unique("historia-e2e-paciente") + "@aliviar-conexao.local";
    const conta = await createPatientAccount(
      adminClient,
      adminSessionClient,
      { email: pacienteEmail, displayName: "Paciente E2E Historia" },
      adminUserId,
    );
    pacienteSenha = conta.password;
    pacienteProfileId = conta.profileId;
  });

  test.afterAll(async () => {
    if (pacienteProfileId) {
      for (const [tabela, coluna] of [
        ["patient_stories", "profile_id"],
        ["patient_profiles", "profile_id"],
        ["user_roles", "profile_id"],
      ] as const) {
        await adminClient.from(tabela).delete().eq(coluna, pacienteProfileId);
      }
      await adminClient.auth.admin.deleteUser(pacienteProfileId);
    }
    if (adminUserId) {
      await adminClient.from("user_roles").delete().eq("profile_id", adminUserId);
      await adminClient.auth.admin.deleteUser(adminUserId);
    }
  });

  test("autosave: texto digitado sobrevive a um reload da página", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    await page.goto("/sua-historia/motivo");
    const texto = `Motivo de teste e2e ${Date.now()}`;

    // B-2: espera OBSERVÁVEL, nunca arbitrária — o reload no meio do debounce
    // abortava a gravação em voo e o campo voltava com o valor anterior. O
    // sinal é a resposta da server action de autosave confirmada pelo
    // servidor, identificada pelo CORPO (o texto único desta rodada): a
    // navegação também dispara um save de etapa na mesma rota, e um filtro
    // só por URL aceitava esse POST e liberava o reload cedo demais.
    const autosaveConfirmado = page.waitForResponse(
      (resposta) =>
        resposta.request().method() === "POST" &&
        (resposta.request().postData() ?? "").includes(texto) &&
        resposta.ok(),
    );
    await page.getByLabel("Sua resposta").fill(texto);
    await autosaveConfirmado;
    await page.reload();

    await expect(page.getByLabel("Sua resposta")).toHaveValue(texto);
  });

  test("retomada: '/sua-historia/continuar' leva exatamente à última etapa visitada", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    // B-2: mesma disciplina do teste acima — o registro da etapa é uma server
    // action; espera-se a resposta dela, não um relógio. A visita a /motivo
    // antes garante que a etapa atual NÃO é "preferencias" (o save de etapa
    // só dispara na mudança), inclusive num retry.
    await page.goto("/sua-historia/motivo");
    await expect(page.getByLabel("Sua resposta")).toBeVisible();
    const etapaRegistrada = page.waitForResponse(
      (resposta) =>
        resposta.request().method() === "POST" &&
        resposta.url().includes("/sua-historia/preferencias") &&
        resposta.ok(),
    );
    await page.goto("/sua-historia/preferencias");
    await etapaRegistrada;

    await page.goto("/sua-historia/continuar");
    await expect(page).toHaveURL("/sua-historia/preferencias");
  });

  test("conclusão: copy final não menciona ACE, protocolo ou processamento automático", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    await page.goto("/sua-historia/revisao");
    await page.getByRole("button", { name: "Enviar minha história" }).click();

    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
    await expect(
      page.getByText("Ela ficará disponível para a equipe Aliviar quando a próxima etapa da sua curadoria for iniciada."),
    ).toBeVisible();

    for (const forbidden of ["ACE", "protocolo", "algoritmo automático de decisão"]) {
      await expect(page.getByText(forbidden)).toHaveCount(0);
    }
  });

  test("história enviada não pode mais ser editada — revisitar a etapa não permite salvar", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    // G1/ETAPA-2: oráculo anterior certificava o defeito IM-04/FS-02 (asserção
    // tautológica — aceitava o heading de rascunho OU o de enviada, passando
    // nos dois mundos; AUDITORIA_06 §6); novo oráculo exige o comportamento
    // das ADR-048 (história enviada permanece enviada) e ADR-051 (nenhum
    // rascunho nasce por navegação): revisitar a revisão após o envio mostra
    // SOMENTE o estado enviado, sem botão de envio.
    await page.goto("/sua-historia/revisao");
    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Esta é a sua história." })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Enviar minha história" })).toHaveCount(0);
  });
});
