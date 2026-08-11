import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { TAMANHO_MAXIMO_DOCUMENTO_BYTES } from "@/modules/profiles/document-file-policy";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * D-12.3 · ADR-054 NA CAMADA QUE NINGUÉM ATRAVESSA POR FORA.
 *
 * A D-12.2 validava na action. O Verificador provou que isso não bastava: um
 * cliente autenticado subia um `.exe` de 25 MB **direto ao bucket**, sem
 * passar por action nenhuma. A regra existia no caminho educado e não existia
 * no caminho real — e o caminho real é o único que um atacante usa.
 *
 * Esta suíte não testa a action. Ela vai direto ao storage, como o Verificador
 * foi, e exige que o BUCKET recuse sozinho.
 *
 * As três camadas da ADR-054, e onde cada uma é provada:
 *   1 · ACTION     → tests/unit/document-file-policy.test.ts
 *   2 · BUCKET     → **aqui**
 *   3 · FRAMEWORK  → next.config.ts + a prova material do limite
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const BUCKET = "patient-documents";
const SENHA = "ADR054-Fixture-Local-2026!";

const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a];
/** MZ — cabeçalho de executável do Windows. */
const EXE_BYTES = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];

function unico(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * O tipo vai no PRÓPRIO Blob, não só na opção `contentType`: com um Blob sem
 * tipo o storage-js envia `application/octet-stream` e o bucket recusa por
 * motivo errado — o teste passaria verde sem provar o que diz provar.
 */
function corpo(assinatura: number[], mime: string, tamanhoTotal?: number): Blob {
  const bytes = new Uint8Array(tamanhoTotal ?? assinatura.length);
  bytes.set(assinatura, 0);
  return new Blob([bytes], { type: mime });
}

describe("ADR-054 · a terceira camada — o bucket recusa sozinho", () => {
  const admin = createAdminSupabaseClient();
  const criados: string[] = [];
  const objetos: string[] = [];

  let paciente: { id: string; email: string };

  async function como(ator: { email: string }) {
    const cliente = createCuradoriaClient(url, anonKey);
    const { error } = await cliente.auth.signInWithPassword({ email: ator.email, password: SENHA });
    if (error) throw new Error(`login ${ator.email}: ${error.message}`);
    return cliente;
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();

    const email = `${unico("adr054-pac")}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SENHA,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`conta: ${error?.message}`);
    criados.push(data.user.id);

    await admin
      .schema("curadoria")
      .from("profiles")
      .insert({ id: data.user.id, full_name: "ADR054 paciente", email });
    await admin
      .schema("curadoria")
      .from("user_roles")
      .insert({ profile_id: data.user.id, role: "paciente" });

    paciente = { id: data.user.id, email };
  }, 60_000);

  afterAll(async () => {
    if (objetos.length) await admin.storage.from(BUCKET).remove(objetos);
    for (const id of criados) {
      await admin.schema("curadoria").from("patient_documents").delete().eq("profile_id", id);
      await admin.auth.admin.deleteUser(id).catch(() => undefined);
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  describe("o contrato está gravado no bucket, não só no código", () => {
    it("patient-documents carrega o teto e a lista da ADR-054", async () => {
      const { data } = await admin.storage.getBucket(BUCKET);

      expect(data?.file_size_limit).toBe(TAMANHO_MAXIMO_DOCUMENTO_BYTES);
      expect([...(data?.allowed_mime_types ?? [])].sort()).toEqual([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);
    });

    /**
     * §6 · a ADR-054 chama-se "Política de documentos clínicos" e seus itens
     * 2–4 tratam da equipe do Case, da paciente e de documento anexado a Case.
     * Ela **não nomeia** o bucket administrativo do profissional, e aplicar
     * contrato por analogia seria decidir no lugar de quem decide.
     *
     * Este teste fixa o ESCOPO — não é aprovação do estado dele. O achado
     * FUN-02 sobre a action do profissional segue aberto.
     */
    it("professional-documents NÃO foi alcançado — escopo, não descuido", async () => {
      const { data } = await admin.storage.getBucket("professional-documents");

      expect(data?.file_size_limit).toBeNull();
      expect(data?.allowed_mime_types).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("o bypass direto ao storage, fechado", () => {
    it("T-ADR054-7 · `.exe` autenticado, direto no bucket → NEGADO", async () => {
      const cliente = await como(paciente);
      const caminho = `${paciente.id}/${unico("malicioso")}.exe`;

      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminho, corpo(EXE_BYTES, "application/x-msdownload"), { contentType: "application/x-msdownload" });

      expect(error, "o `.exe` entrou no bucket").not.toBeNull();

      // E a prova que não depende da mensagem de erro: não existe nada lá.
      const { data } = await admin.storage.from(BUCKET).download(caminho);
      expect(data, "o objeto ficou no bucket apesar do erro").toBeNull();
    });

    it("T-ADR054-8 · 25 MB autenticado, direto no bucket → NEGADO", async () => {
      const cliente = await como(paciente);
      const caminho = `${paciente.id}/${unico("gigante")}.pdf`;

      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminho, corpo(PDF_BYTES, "application/pdf", 25 * 1024 * 1024), { contentType: "application/pdf" });

      expect(error, "25 MB entraram no bucket").not.toBeNull();

      const { data } = await admin.storage.from(BUCKET).download(caminho);
      expect(data, "o objeto de 25 MB ficou no bucket").toBeNull();
    });

    it("tipo fora da lista também não passa, ainda que inofensivo", async () => {
      const cliente = await como(paciente);
      const caminho = `${paciente.id}/${unico("anotacao")}.txt`;

      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminho, corpo([0x6f, 0x69], "text/plain"), { contentType: "text/plain" });

      expect(error, "text/plain entrou no bucket").not.toBeNull();
    });

    it("o que a ADR permite continua entrando — a camada recusa, não bloqueia tudo", async () => {
      const cliente = await como(paciente);
      const caminho = `${paciente.id}/${unico("exame")}.pdf`;

      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminho, corpo(PDF_BYTES, "application/pdf", 2 * 1024 * 1024), { contentType: "application/pdf" });

      expect(error, error?.message).toBeNull();
      objetos.push(caminho);

      const { data } = await admin.storage.from(BUCKET).download(caminho);
      expect(data).not.toBeNull();
    });

    it("a pasta alheia segue fechada — o bucket não substituiu a RLS", async () => {
      const cliente = await como(paciente);
      const caminho = `${crypto.randomUUID()}/${unico("invasao")}.pdf`;

      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(caminho, corpo(PDF_BYTES, "application/pdf"), { contentType: "application/pdf" });

      expect(error, "gravou na pasta de outra pessoa").not.toBeNull();
    });
  });
});
