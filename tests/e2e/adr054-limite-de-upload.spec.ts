import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TAMANHO_MAXIMO_DOCUMENTO_BYTES } from "@/modules/profiles/document-file-policy";

/**
 * V-1 (D-12.3) · A PROVA MATERIAL DE QUE O FRAMEWORK NÃO CORTA ANTES.
 *
 * O Verificador encontrou o buraco: `bodySizeLimit` das Server Actions vem com
 * **1 MB** por padrão, enquanto a ADR-054 aprova **20 MB**. A regra existia no
 * papel e era inalcançável na prática — qualquer exame escaneado morria no
 * framework, antes de a validação rodar, com erro genérico.
 *
 * **Um teste unitário da função de validação não prova nada aqui.** Ele roda
 * depois do ponto onde o corte acontecia. Por isso este spec sobe o servidor
 * real (`next start` do build), faz login de verdade e envia o arquivo pelo
 * formulário — o mesmo caminho da paciente.
 *
 * As duas pontas que interessam:
 *
 * - **~2 MB passa.** Se o default de 1 MB voltar, este teste cai — é o
 *   canário do V-1.
 * - **Acima de 20 MB é recusado PELA NOSSA REGRA**, com a frase que explica o
 *   motivo, e não por um 413 mudo. É isso que justifica o teto do framework
 *   ficar acima do teto do produto.
 */

const ARQUIVO_DE_USUARIOS = path.resolve(process.cwd(), "test-users.local.json");

type UsuarioDeTeste = { role: string; email: string; password: string };

function pacienteDeTeste(): UsuarioDeTeste {
  if (!existsSync(ARQUIVO_DE_USUARIOS)) {
    throw new Error("test-users.local.json ausente — rode `npm run bootstrap:test-users:local`.");
  }
  const usuarios = JSON.parse(readFileSync(ARQUIVO_DE_USUARIOS, "utf8")) as UsuarioDeTeste[];
  const paciente = usuarios.find((u) => u.role === "paciente");
  if (!paciente) throw new Error("Nenhuma paciente em test-users.local.json.");
  return paciente;
}

/** PDF real o bastante para a validação por assinatura aceitar. */
function pdfDeTamanho(bytes: number): Buffer {
  const conteudo = Buffer.alloc(bytes, 0x20);
  Buffer.from("%PDF-1.7\n").copy(conteudo, 0);
  return conteudo;
}

async function entrarComo(page: Page, { email, password }: UsuarioDeTeste) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

const MARCADOR = "adr054-limite";

test.describe("ADR-054 · o limite de 20 MB é real no fluxo da paciente", () => {
  const paciente = pacienteDeTeste();

  test.afterAll(async () => {
    // O upload de 2 MB é real e persiste. Some com ele pelo bastidor, para a
    // paciente permanente não acumular resíduo de execução em execução.
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .schema("curadoria")
      .from("patient_documents")
      .select("id, file_path")
      .like("file_name", `%${MARCADOR}%`);

    for (const linha of data ?? []) {
      await admin.storage.from("patient-documents").remove([linha.file_path as string]);
      await admin.schema("curadoria").from("patient_documents").delete().eq("id", linha.id);
    }
  });

  test("T-ADR054-9 · um arquivo de ~2 MB atravessa a Server Action", async ({ page }) => {
    await entrarComo(page, paciente);
    await page.goto("/paciente/documentos");

    await page.getByLabel("Selecionar documento").setInputFiles({
      name: `${MARCADOR}-2mb.pdf`,
      mimeType: "application/pdf",
      buffer: pdfDeTamanho(2 * 1024 * 1024),
    });
    await page.getByRole("button", { name: "Enviar documento" }).click();

    // Com o default de 1 MB, a action nem era alcançada: a resposta vinha do
    // framework e esta mensagem nunca aparecia.
    await expect(page.getByText("Documento enviado")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(`${MARCADOR}-2mb.pdf`)).toBeVisible();
  });

  /**
   * A prova mais direta do V-1: quase no teto, e passa. Com o default de 1 MB
   * isto era impensável — e é o tamanho de um exame escaneado de verdade.
   */
  test("perto de 20 MB, abaixo do teto, o envio é aceito", async ({ page }) => {
    test.setTimeout(180_000);

    await entrarComo(page, paciente);
    await page.goto("/paciente/documentos");

    await page.getByLabel("Selecionar documento").setInputFiles({
      name: `${MARCADOR}-quase-no-teto.pdf`,
      mimeType: "application/pdf",
      buffer: pdfDeTamanho(TAMANHO_MAXIMO_DOCUMENTO_BYTES - 512 * 1024),
    });
    await page.getByRole("button", { name: "Enviar documento" }).click();

    await expect(page.getByText("Documento enviado")).toBeVisible({ timeout: 120_000 });
  });

  test("acima de 20 MB quem recusa é a NOSSA regra, com o motivo", async ({ page }) => {
    // Trafegar 20 MB pelo browser leva tempo; 30 s (o padrão) media a rede,
    // não a regra.
    test.setTimeout(180_000);

    await entrarComo(page, paciente);
    await page.goto("/paciente/documentos");

    await page.getByLabel("Selecionar documento").setInputFiles({
      name: `${MARCADOR}-grande.pdf`,
      mimeType: "application/pdf",
      buffer: pdfDeTamanho(TAMANHO_MAXIMO_DOCUMENTO_BYTES + 512 * 1024),
    });
    await page.getByRole("button", { name: "Enviar documento" }).click();

    // A frase é nossa. Um 413 do framework não diria "20 MB" nem o que fazer.
    await expect(page.getByText(/passa de 20 MB/i)).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText("Documento enviado")).toBeHidden();
  });

  test("o seletor de arquivos oferece só o que a ADR-054 aceita", async ({ page }) => {
    await entrarComo(page, paciente);
    await page.goto("/paciente/documentos");

    const accept = await page.getByLabel("Selecionar documento").getAttribute("accept");

    expect(accept).toBe("application/pdf,image/jpeg,image/png,image/webp");
    expect(accept).not.toContain("heic");
  });
});
