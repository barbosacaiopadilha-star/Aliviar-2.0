import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { providePatientDocument, uploadPatientDocument } from "@/modules/profiles/patient-document-repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * D-12.2 · O DEPÓSITO DA ALIVIAR, PONTA A PONTA.
 *
 * A D-12.1 provou as POLICIES. Esta suíte prova o WRITER que passa por elas —
 * e as três coisas que só aparecem quando ele existe de verdade:
 *
 * - **T-D12-11.** O documento cai na pasta DELA e ela consegue lê-lo. Sem
 *   isto, a feature "funciona" no banco e falha na leitura — era o bloqueio 3
 *   do §B, e é o teste que prova o bloqueio resolvido.
 * - **A trilha.** Depositar deixa `patient_document_provided` em
 *   `audit_logs`, gravado por TRIGGER: nenhum caminho de código pode
 *   esquecer, porque quem grava é o banco.
 * - **Compensação NÃO é revogação.** O writer apaga o objeto órfão que ele
 *   mesmo deixou; não apaga documento entregue. A cláusula que separa as duas
 *   coisas é a ausência de linha, e ela é medida aqui.
 *
 * Método herdado da D-12.1F, porque o ciclo o ensinou: **DELETE e `remove`
 * não levantam erro sem permissão** — a RLS apenas não encontra o alvo. Toda
 * prova de recusa aqui é feita LENDO DEPOIS, nunca por `error !== null`.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const BUCKET = "patient-documents";
const SENHA = "D12-Fixture-Local-2026!";

/** %PDF-1.7 — assinatura real, para o `content_type` não ser ficção. */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a]);

function unico(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pdf(nome: string): File {
  return new File([PDF_BYTES], nome, { type: "application/pdf" });
}

type Ator = { id: string; email: string };

describe("D-12.2 · o depósito da Aliviar", () => {
  const admin = createAdminSupabaseClient();
  const criados: string[] = [];
  const objetos: string[] = [];

  let pacienteA: Ator;
  let pacienteB: Ator;
  let curador1: Ator;
  let curador2: Ator;
  let caseA1: string;
  let caseA2: string;

  async function conta(papel: "paciente" | "curador_medico", rotulo: string): Promise<Ator> {
    const email = `${unico(`d122-${rotulo}`)}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SENHA,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`conta ${rotulo}: ${error?.message}`);
    criados.push(data.user.id);

    await admin
      .schema("curadoria")
      .from("profiles")
      .insert({ id: data.user.id, full_name: `D122 ${rotulo}`, email });
    await admin
      .schema("curadoria")
      .from("user_roles")
      .insert({ profile_id: data.user.id, role: papel });

    return { id: data.user.id, email };
  }

  async function caso(paciente: Ator, curador: Ator): Promise<string> {
    const { data: story, error: e1 } = await admin
      .schema("curadoria")
      .from("patient_stories")
      .insert({ profile_id: paciente.id, created_by: paciente.id, status: "enviada" })
      .select("id")
      .single();
    if (e1) throw new Error(`história: ${e1.message}`);

    const { data: kase, error: e2 } = await admin
      .schema("curadoria")
      .from("cases")
      .insert({
        patient_profile_id: paciente.id,
        source_story_id: story.id,
        assigned_curator_id: curador.id,
        created_by: paciente.id,
        status: "NEW",
      })
      .select("id")
      .single();
    if (e2) throw new Error(`case: ${e2.message}`);
    return kase.id as string;
  }

  async function como(ator: Ator) {
    const cliente = createCuradoriaClient(url, anonKey);
    const { error } = await cliente.auth.signInWithPassword({ email: ator.email, password: SENHA });
    if (error) throw new Error(`login ${ator.email}: ${error.message}`);
    return cliente;
  }

  /** Um depósito real, pelo writer de produção. */
  async function depositar(curador: Ator, caseId: string, paciente: Ator, nome = "exame.pdf") {
    const cliente = await como(curador);
    const doc = await providePatientDocument(cliente, {
      caseId,
      patientProfileId: paciente.id,
      curatorId: curador.id,
      file: pdf(nome),
      contentType: "application/pdf",
    });
    objetos.push(doc.filePath);
    return doc;
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();

    [pacienteA, pacienteB, curador1, curador2] = await Promise.all([
      conta("paciente", "pac-a"),
      conta("paciente", "pac-b"),
      conta("curador_medico", "cur-1"),
      conta("curador_medico", "cur-2"),
    ]);

    // As duas Curadorias simultâneas de A continuam sendo o coração: elas
    // distinguem "ESTE Case" de "algum Case dela".
    caseA1 = await caso(pacienteA, curador1);
    caseA2 = await caso(pacienteA, curador2);
  }, 60_000);

  afterAll(async () => {
    if (objetos.length) await admin.storage.from(BUCKET).remove(objetos);
    for (const id of criados) {
      await admin.schema("curadoria").from("patient_documents").delete().eq("profile_id", id);
      await admin.auth.admin.deleteUser(id).catch(() => undefined);
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  describe("o writer grava o que a Central precisa derivar", () => {
    it("deposita com autoria da Aliviar, para a paciente do Case, no Case que autorizou", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      // A origem NÃO é declarada por coluna: ela é esta desigualdade.
      expect(doc.uploadedBy).toBe(curador1.id);
      expect(doc.uploadedBy).not.toBe(pacienteA.id);

      const { data } = await admin
        .schema("curadoria")
        .from("patient_documents")
        .select("profile_id, case_id, content_type")
        .eq("id", doc.id)
        .single();

      expect(data?.profile_id).toBe(pacienteA.id);
      expect(data?.case_id).toBe(caseA1);
      expect(data?.content_type).toBe("application/pdf");
    });

    it("o objeto cai na pasta DELA, sob o Case — nunca na pasta do Curador", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const [dona, namespace, kase] = doc.filePath.split("/");
      expect(dona).toBe(pacienteA.id);
      expect(namespace).toBe("received");
      expect(kase).toBe(caseA1);
      expect(doc.filePath).not.toContain(curador1.id);
    });

    it("T-D12-11 · ela consegue LER o que recebeu — o bloqueio 3, resolvido", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const dela = await como(pacienteA);
      const { data, error } = await dela.storage.from(BUCKET).download(doc.filePath);

      expect(error, "a dona não conseguiu baixar o que recebeu").toBeNull();
      expect(await data?.text()).toContain("%PDF");
    });

    it("paciente alheia não lê o objeto", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const outra = await como(pacienteB);
      const { data } = await outra.storage.from(BUCKET).download(doc.filePath);

      expect(data, "paciente B baixou objeto da paciente A").toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("a autorização continua sendo do Case, não do papel", () => {
    it("Curador de OUTRO Case da MESMA paciente é recusado", async () => {
      // curador1 conduz A1; A2 é do curador2. Ser curador dela não basta.
      await expect(depositar(curador1, caseA2, pacienteA)).rejects.toThrow();
    });

    it("Curador sem Case desta paciente é recusado", async () => {
      await expect(depositar(curador2, caseA1, pacienteA)).rejects.toThrow();
    });

    it("nenhum resíduo sobra no storage quando a linha é recusada", async () => {
      const cliente = await como(curador1);
      const caminho = `${pacienteA.id}/received/${caseA2}/${unico("recusado")}.pdf`;

      // O upload em si já é barrado pela policy de storage — a linha nem
      // chega a ser tentada. Provado LENDO: nada existe naquele caminho.
      await cliente.storage.from(BUCKET).upload(caminho, pdf("x.pdf"));

      const { data } = await admin.storage.from(BUCKET).download(caminho);
      expect(data, "objeto foi gravado em Case alheio").toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("a trilha — gravada pelo banco, não pelo writer", () => {
    it("depositar deixa exatamente uma entrada patient_document_provided", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const { data } = await admin
        .schema("curadoria")
        .from("audit_logs")
        .select("actor_id, target_profile_id, metadata")
        .eq("action", "patient_document_provided")
        .eq("target_profile_id", pacienteA.id);

      const desteDoc = (data ?? []).filter(
        (l) => (l.metadata as Record<string, unknown>)?.document_id === doc.id,
      );

      expect(desteDoc).toHaveLength(1);
      expect(desteDoc[0].actor_id).toBe(curador1.id);
      expect((desteDoc[0].metadata as Record<string, unknown>).case_id).toBe(caseA1);
    });

    it("a trilha guarda o HASH do caminho, nunca o caminho em claro", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const { data } = await admin
        .schema("curadoria")
        .from("audit_logs")
        .select("metadata")
        .eq("action", "patient_document_provided")
        .eq("target_profile_id", pacienteA.id);

      const meta = (data ?? [])
        .map((l) => l.metadata as Record<string, unknown>)
        .find((m) => m?.document_id === doc.id);

      expect(meta?.file_path_hash).toBeTruthy();
      expect(JSON.stringify(meta)).not.toContain(doc.filePath);
    });

    it("o upload da PRÓPRIA paciente não entra na trilha — origem já é derivável", async () => {
      const dela = await como(pacienteA);
      const doc = await uploadPatientDocument(dela, pacienteA.id, pdf("meu-exame.pdf"), "application/pdf");
      objetos.push(doc.filePath);

      const { data } = await admin
        .schema("curadoria")
        .from("audit_logs")
        .select("metadata")
        .eq("action", "patient_document_provided")
        .eq("target_profile_id", pacienteA.id);

      const desteDoc = (data ?? []).filter(
        (l) => (l.metadata as Record<string, unknown>)?.document_id === doc.id,
      );

      expect(desteDoc).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  /**
   * A distinção que a policy de compensação existe para manter. Sem a
   * cláusula "objeto sem linha", esta seção viraria revogação — que o §N do
   * doc 25 recusa por falta de precedente.
   */
  describe("compensação sim, revogação não", () => {
    it("o writer apaga o órfão que ele mesmo deixou", async () => {
      const cliente = await como(curador1);
      const caminho = `${pacienteA.id}/received/${caseA1}/${unico("orfao")}.pdf`;

      const { error: erroUpload } = await cliente.storage.from(BUCKET).upload(caminho, pdf("o.pdf"));
      expect(erroUpload, erroUpload?.message).toBeNull();

      await cliente.storage.from(BUCKET).remove([caminho]);

      // Medido pela LEITURA depois, nunca pela ausência de erro no remove.
      const { data } = await admin.storage.from(BUCKET).download(caminho);
      expect(data, "o órfão sobreviveu à compensação").toBeNull();
    });

    it("documento COM linha é intocável pelo depositante — não há revogação", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const cliente = await como(curador1);
      await cliente.storage.from(BUCKET).remove([doc.filePath]);

      const { data } = await admin.storage.from(BUCKET).download(doc.filePath);
      expect(data, "o Curador revogou um documento entregue").not.toBeNull();
    });

    it("ela também não apaga o que recebeu — nem a linha, nem o objeto", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const dela = await como(pacienteA);
      await dela.from("patient_documents").delete().eq("id", doc.id);
      await dela.storage.from(BUCKET).remove([doc.filePath]);

      const { count } = await admin
        .schema("curadoria")
        .from("patient_documents")
        .select("id", { count: "exact", head: true })
        .eq("id", doc.id);
      const { data: objeto } = await admin.storage.from(BUCKET).download(doc.filePath);

      expect(count, "a paciente apagou a linha do que recebeu").toBe(1);
      expect(objeto, "a paciente apagou o objeto do que recebeu").not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  /**
   * S-2, aberto na D-12.1F e fechado aqui por EXPERIMENTO.
   *
   * A pergunta era se o writer precisaria de SELECT de storage. A resposta
   * veio de um teste que falhou: `remove()` busca o objeto sob a RLS de quem
   * chama antes de apagar, então sem SELECT o depositante nunca alcança o
   * DELETE — e a compensação não acontecia, em silêncio.
   *
   * O que se concedeu é a visibilidade mínima para o writer desfazer o
   * próprio ato, com o MESMO recorte do INSERT. Os dois testes abaixo fixam
   * os dois lados dessa fronteira.
   */
  describe("S-2 · o alcance da leitura do Curador", () => {
    it("enxerga o que está sob `received/` do Case que conduz — sem isso não há compensação", async () => {
      const doc = await depositar(curador1, caseA1, pacienteA);

      const cliente = await como(curador1);
      const { data } = await cliente.storage.from(BUCKET).download(doc.filePath);

      expect(data, "o depositante não enxerga o próprio depósito").not.toBeNull();
    });

    it("NÃO enxerga os uploads da própria paciente — eles vivem fora de `received/`", async () => {
      const dela = await como(pacienteA);
      const dela1 = await uploadPatientDocument(dela, pacienteA.id, pdf("particular.pdf"), "application/pdf");
      objetos.push(dela1.filePath);

      const cliente = await como(curador1);
      const { data } = await cliente.storage.from(BUCKET).download(dela1.filePath);

      // A concessão do S-2 é recortada por `received/`. Se este teste passar
      // a devolver conteúdo, o recorte caiu e a leitura virou geral.
      expect(data, "o Curador alcançou um upload particular da paciente").toBeNull();
    });
  });
});
