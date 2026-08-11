import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * D-12.1F · O PISO DE SEGURANÇA DA CENTRAL DE DOCUMENTOS, EM FORMA DE CÓDIGO.
 *
 * A D-12.1 foi provada por um script descartável e reprovada por isso: as
 * garantias existiam no banco e **nada no repositório as defendia**. Seis
 * mutações abriram buracos reais e nenhuma suíte piscou.
 *
 * O que esta suíte protege — e o que ela quebra se alguém afrouxar:
 *
 * - **Case específico.** `pode_depositar_no_caso` exige que ESTE Case seja
 *   desta paciente E que o ator seja o curador atribuído. "Existe algum Case
 *   dela com este curador" é o modelo rejeitado, e a matriz de dois Casos
 *   (A1→Curador1, A2→Curador2) existe justamente para detectá-lo.
 * - **Autoria real.** A paciente não escolhe `uploaded_by` nem `case_id`.
 * - **Origem derivada.** `uploaded_by = profile_id` é dela; diferente é da
 *   Aliviar. Nunca uma coluna que se possa declarar.
 * - **DELETE.** Ela apaga o que enviou; não apaga o que recebeu. Medido por
 *   **contagem de linhas**, nunca por ausência de exceção — RLS não levanta
 *   erro no DELETE, ela simplesmente não encontra a linha.
 * - **UPDATE.** Não existe policy, e a ausência é a regra.
 * - **Storage.** A policy da linha não pode ser mais forte que a do objeto.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const BUCKET = "patient-documents";
const SENHA = "D12-Fixture-Local-2026!";

function unico(prefixo: string): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Ator = { id: string; email: string };

describe("D-12.1 · Central de Documentos — autoria, Case e origem", () => {
  const admin = createAdminSupabaseClient();
  const criados: string[] = [];

  let pacienteA: Ator;
  let pacienteB: Ator;
  let curador1: Ator;
  let curador2: Ator;
  let curador3: Ator;
  let caseA1: string;
  let caseA2: string;
  let caseB1: string;

  async function conta(papel: "paciente" | "curador_medico", rotulo: string): Promise<Ator> {
    const email = `${unico(`d12-${rotulo}`)}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: SENHA,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`conta ${rotulo}: ${error?.message}`);
    criados.push(data.user.id);

    await admin.schema("curadoria").from("profiles").insert({
      id: data.user.id,
      full_name: `D12 ${rotulo}`,
      email,
    });
    await admin
      .schema("curadoria")
      .from("user_roles")
      .insert({ profile_id: data.user.id, role: papel });

    return { id: data.user.id, email };
  }

  /** Um Case real da paciente, conduzido pelo curador indicado. */
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
    const { error } = await cliente.auth.signInWithPassword({
      email: ator.email,
      password: SENHA,
    });
    if (error) throw new Error(`login ${ator.email}: ${error.message}`);
    return cliente;
  }

  /** Uma linha de documento, com os campos que a policy inspeciona. */
  function linha(over: Record<string, unknown> = {}) {
    return {
      profile_id: pacienteA.id,
      uploaded_by: pacienteA.id,
      case_id: null as string | null,
      file_name: "documento.pdf",
      file_path: `${pacienteA.id}/${unico("doc")}.pdf`,
      ...over,
    };
  }

  beforeAll(async () => {
    expect(url, "NEXT_PUBLIC_SUPABASE_URL ausente").toBeTruthy();

    // A matriz exigida: a paciente A tem DUAS Curadorias simultâneas, com
    // curadores diferentes. É ela que distingue "este Case" de "algum Case".
    [pacienteA, pacienteB, curador1, curador2, curador3] = await Promise.all([
      conta("paciente", "pac-a"),
      conta("paciente", "pac-b"),
      conta("curador_medico", "cur-1"),
      conta("curador_medico", "cur-2"),
      conta("curador_medico", "cur-3"),
    ]);

    caseA1 = await caso(pacienteA, curador1);
    caseA2 = await caso(pacienteA, curador2);
    caseB1 = await caso(pacienteB, curador3);
  }, 60_000);

  afterAll(async () => {
    for (const id of criados) {
      await admin.schema("curadoria").from("patient_documents").delete().eq("profile_id", id);
      await admin.auth.admin.deleteUser(id).catch(() => undefined);
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  describe("INSERT da paciente — ela não escolhe autoria nem contexto", () => {
    it("deposita para si, como autora, sem Case", async () => {
      const cliente = await como(pacienteA);
      const { data, error } = await cliente
        .from("patient_documents")
        .insert(linha())
        .select("id")
        .maybeSingle();

      expect(error, error?.message).toBeNull();
      expect(data?.id).toBeTruthy();
    });

    it("NÃO associa o próprio upload a um Case", async () => {
      const cliente = await como(pacienteA);
      const { error } = await cliente.from("patient_documents").insert(linha({ case_id: caseA1 }));
      expect(error, "paciente conseguiu declarar case_id").not.toBeNull();
    });

    it("NÃO forja a autoria", async () => {
      const cliente = await como(pacienteA);
      const { error } = await cliente
        .from("patient_documents")
        .insert(linha({ uploaded_by: curador1.id }));
      expect(error, "paciente conseguiu forjar uploaded_by").not.toBeNull();
    });

    it("NÃO deposita para outra paciente", async () => {
      const cliente = await como(pacienteA);
      const { error } = await cliente
        .from("patient_documents")
        .insert(linha({ profile_id: pacienteB.id, file_path: `${pacienteB.id}/${unico("x")}.pdf` }));
      expect(error, "paciente depositou na conta alheia").not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("INSERT da Aliviar — case-específico, nunca 'algum Case'", () => {
    const deposito = (paciente: Ator, curador: Ator, caseId: string) => ({
      profile_id: paciente.id,
      uploaded_by: curador.id,
      case_id: caseId,
      file_name: "laudo.pdf",
      file_path: `${paciente.id}/received/${caseId}/${unico("laudo")}.pdf`,
    });

    it("Curador 1 deposita para A pelo Case A1", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente
        .from("patient_documents")
        .insert(deposito(pacienteA, curador1, caseA1));
      expect(error, error?.message).toBeNull();
    });

    it("Curador 1 NÃO deposita pelo Case A2 — que é do Curador 2", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente
        .from("patient_documents")
        .insert(deposito(pacienteA, curador1, caseA2));
      expect(error, "'algum Case da paciente' seria suficiente — e não pode ser").not.toBeNull();
    });

    it("Curador 2 deposita pelo SEU Case A2", async () => {
      const cliente = await como(curador2);
      const { error } = await cliente
        .from("patient_documents")
        .insert(deposito(pacienteA, curador2, caseA2));
      expect(error, error?.message).toBeNull();
    });

    it("Curador 2 NÃO deposita pelo Case A1", async () => {
      const cliente = await como(curador2);
      const { error } = await cliente
        .from("patient_documents")
        .insert(deposito(pacienteA, curador2, caseA1));
      expect(error).not.toBeNull();
    });

    it("Curador 1 NÃO deposita para a paciente B", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente
        .from("patient_documents")
        .insert(deposito(pacienteB, curador1, caseB1));
      expect(error).not.toBeNull();
    });

    it("Case de uma paciente NÃO autoriza depósito na conta de outra", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente.from("patient_documents").insert({
        profile_id: pacienteB.id,
        uploaded_by: curador1.id,
        case_id: caseA1,
        file_name: "cruzado.pdf",
        file_path: `${pacienteB.id}/received/${caseA1}/${unico("x")}.pdf`,
      });
      expect(error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("SELECT", () => {
    it("a paciente lê o que enviou e o que recebeu", async () => {
      const cliente = await como(pacienteA);
      const { data } = await cliente.from("patient_documents").select("id,uploaded_by,case_id");

      const proprios = (data ?? []).filter((d) => d.uploaded_by === pacienteA.id);
      const recebidos = (data ?? []).filter((d) => d.uploaded_by !== pacienteA.id);
      expect(proprios.length).toBeGreaterThan(0);
      expect(recebidos.length).toBeGreaterThan(0);
      // Origem é derivada da autoria — nunca de uma coluna declarável.
      expect(recebidos.every((d) => d.case_id !== null)).toBe(true);
    });

    it("a paciente B não lê nada da paciente A", async () => {
      const cliente = await como(pacienteB);
      const { data } = await cliente.from("patient_documents").select("id,profile_id");
      expect((data ?? []).some((d) => d.profile_id === pacienteA.id)).toBe(false);
    });

    it("o Curador lê os documentos do Case que conduz — e só", async () => {
      // Esta policy nasceu durante a implementação: sem ela o depósito grava e
      // o depositante não lê de volta. Por ter nascido depois, é a que mais
      // precisa de guarda.
      const cliente = await como(curador1);
      const { data } = await cliente.from("patient_documents").select("id,case_id");
      const vistos = data ?? [];

      expect(vistos.some((d) => d.case_id === caseA1), "não lê o próprio Case").toBe(true);
      expect(vistos.some((d) => d.case_id === caseA2), "leu documento de Case alheio").toBe(false);
    });

    it("um Curador sem Case desta paciente não lê nada dela", async () => {
      const cliente = await como(curador3);
      const { data } = await cliente.from("patient_documents").select("id,profile_id");
      expect((data ?? []).some((d) => d.profile_id === pacienteA.id)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe("DELETE — medido por linhas removidas, não por ausência de erro", () => {
    it("a paciente apaga o próprio upload", async () => {
      const cliente = await como(pacienteA);
      const { data: criado } = await cliente
        .from("patient_documents")
        .insert(linha())
        .select("id")
        .single();

      const { data: removidas } = await cliente
        .from("patient_documents")
        .delete()
        .eq("id", criado!.id)
        .select("id");

      expect(removidas ?? []).toHaveLength(1);
    });

    it("a paciente NÃO apaga o que recebeu da Aliviar", async () => {
      const curador = await como(curador1);
      const { data: recebido } = await curador
        .from("patient_documents")
        .insert({
          profile_id: pacienteA.id,
          uploaded_by: curador1.id,
          case_id: caseA1,
          file_name: "protegido.pdf",
          file_path: `${pacienteA.id}/received/${caseA1}/${unico("prot")}.pdf`,
        })
        .select("id")
        .single();

      const paciente = await como(pacienteA);
      const { data: removidas } = await paciente
        .from("patient_documents")
        .delete()
        .eq("id", recebido!.id)
        .select("id");

      // RLS não levanta erro no DELETE: ela não encontra a linha. Contar é a
      // única forma de saber.
      expect(removidas ?? [], "a paciente apagou um documento recebido").toHaveLength(0);

      const { data: aindaLa } = await paciente
        .from("patient_documents")
        .select("id")
        .eq("id", recebido!.id)
        .maybeSingle();
      expect(aindaLa?.id).toBe(recebido!.id);
    });
  });

  // -------------------------------------------------------------------------
  describe("UPDATE — a ausência de policy é a regra", () => {
    it("a paciente não reescreve autoria nem contexto", async () => {
      const cliente = await como(pacienteA);
      const { data: criado } = await cliente
        .from("patient_documents")
        .insert(linha())
        .select("id")
        .single();

      for (const patch of [
        { uploaded_by: curador1.id },
        { case_id: caseA1 },
        { profile_id: pacienteB.id },
      ]) {
        const { data: alteradas } = await cliente
          .from("patient_documents")
          .update(patch)
          .eq("id", criado!.id)
          .select("id");
        expect(alteradas ?? [], `UPDATE passou: ${JSON.stringify(patch)}`).toHaveLength(0);
      }
    });

    it("o Curador não reescreve o documento que depositou", async () => {
      const curador = await como(curador1);
      const { data: recebido } = await curador
        .from("patient_documents")
        .insert({
          profile_id: pacienteA.id,
          uploaded_by: curador1.id,
          case_id: caseA1,
          file_name: "imutavel.pdf",
          file_path: `${pacienteA.id}/received/${caseA1}/${unico("imut")}.pdf`,
        })
        .select("id")
        .single();

      const { data: alteradas } = await curador
        .from("patient_documents")
        .update({ case_id: caseA2 })
        .eq("id", recebido!.id)
        .select("id");
      expect(alteradas ?? []).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("STORAGE — o objeto não pode ser mais frouxo que a linha", () => {
    const arquivo = () => new Blob([new Uint8Array([37, 80, 68, 70])], { type: "application/pdf" });

    it("Curador 1 grava sob a pasta da paciente, no Case dele", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/received/${caseA1}/${unico("s")}.pdf`, arquivo());
      expect(error, error?.message).toBeNull();
    });

    it("Curador 1 NÃO grava no namespace do Case A2", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/received/${caseA2}/${unico("s")}.pdf`, arquivo());
      expect(error).not.toBeNull();
    });

    it("Curador 2 grava no namespace do SEU Case", async () => {
      const cliente = await como(curador2);
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/received/${caseA2}/${unico("s")}.pdf`, arquivo());
      expect(error, error?.message).toBeNull();
    });

    it("Curador NÃO grava na pasta de outra paciente", async () => {
      const cliente = await como(curador1);
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteB.id}/received/${caseA1}/${unico("s")}.pdf`, arquivo());
      expect(error).not.toBeNull();
    });

    it("a paciente grava o próprio arquivo, mas NÃO dentro de received/", async () => {
      const cliente = await como(pacienteA);
      const proprio = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/${unico("meu")}.pdf`, arquivo());
      expect(proprio.error, proprio.error?.message).toBeNull();

      const invadindo = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/received/${caseA1}/${unico("falso")}.pdf`, arquivo());
      expect(invadindo.error, "a paciente escreveu em received/").not.toBeNull();
    });

    it("path malformado não passa", async () => {
      const cliente = await como(curador1);
      // Sem o namespace, e sem Case verificável.
      const { error } = await cliente.storage
        .from(BUCKET)
        .upload(`${pacienteA.id}/${unico("solto")}.pdf`, arquivo());
      expect(error).not.toBeNull();
    });

    it("a paciente lê o recebido; a outra paciente não", async () => {
      const curador = await como(curador1);
      const caminho = `${pacienteA.id}/received/${caseA1}/${unico("lido")}.pdf`;
      await curador.storage.from(BUCKET).upload(caminho, arquivo());

      const dona = await como(pacienteA);
      const alheia = await como(pacienteB);
      expect((await dona.storage.from(BUCKET).download(caminho)).error).toBeNull();
      expect((await alheia.storage.from(BUCKET).download(caminho)).error).not.toBeNull();
    });

    it("a paciente NÃO apaga o objeto recebido, e apaga o próprio", async () => {
      const curador = await como(curador1);
      const recebido = `${pacienteA.id}/received/${caseA1}/${unico("fixo")}.pdf`;
      await curador.storage.from(BUCKET).upload(recebido, arquivo());

      const dona = await como(pacienteA);
      const proprio = `${pacienteA.id}/${unico("descartavel")}.pdf`;
      await dona.storage.from(BUCKET).upload(proprio, arquivo());

      // O storage não devolve erro no remove sem permissão — o arquivo
      // simplesmente continua lá. A prova é a leitura depois.
      await dona.storage.from(BUCKET).remove([recebido]);
      expect(
        (await dona.storage.from(BUCKET).download(recebido)).error,
        "o objeto recebido foi apagado pela paciente",
      ).toBeNull();

      await dona.storage.from(BUCKET).remove([proprio]);
      expect((await dona.storage.from(BUCKET).download(proprio)).error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe("ON DELETE SET NULL — o documento sobrevive ao Case", () => {
    it("apagar o Case preserva o documento e zera o contexto", async () => {
      const efemero = await caso(pacienteA, curador1);
      const curador = await como(curador1);
      const { data: recebido } = await curador
        .from("patient_documents")
        .insert({
          profile_id: pacienteA.id,
          uploaded_by: curador1.id,
          case_id: efemero,
          file_name: "sobrevive.pdf",
          file_path: `${pacienteA.id}/received/${efemero}/${unico("sob")}.pdf`,
        })
        .select("id")
        .single();

      await admin.schema("curadoria").from("cases").delete().eq("id", efemero);

      const { data: depois } = await admin
        .schema("curadoria")
        .from("patient_documents")
        .select("id,case_id")
        .eq("id", recebido!.id)
        .maybeSingle();

      expect(depois?.id, "o documento foi apagado junto com o Case").toBe(recebido!.id);
      expect(depois?.case_id, "o contexto deveria ter sido zerado").toBeNull();

      // A dona continua lendo; o Curador perde o acesso case-específico.
      const dona = await como(pacienteA);
      const { data: pelaDona } = await dona
        .from("patient_documents")
        .select("id")
        .eq("id", recebido!.id)
        .maybeSingle();
      expect(pelaDona?.id).toBe(recebido!.id);

      const { data: peloCurador } = await curador
        .from("patient_documents")
        .select("id")
        .eq("id", recebido!.id)
        .maybeSingle();
      expect(peloCurador ?? null, "o Curador manteve acesso sem Case").toBeNull();
    });
  });
});
