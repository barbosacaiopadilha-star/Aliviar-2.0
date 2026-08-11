// =============================================================================
// REGRESSÃO — anexar documento à própria história (Release de Reconstrução).
//
// O defeito: duas policies se protegiam em círculo. Inserir em
// `patient_story_attachments` consultava `patient_documents`, cuja policy de
// leitura do Curador consultava `patient_story_attachments` de volta —
// PostgreSQL respondia 42P17, "infinite recursion detected in policy".
//
// Consequência para quem usava: o upload aparentava falhar ("Não foi possível
// anexar o documento."), embora o documento fosse criado. O vínculo com a
// história nunca acontecia — nenhuma paciente conseguia anexar nada.
//
// Este teste faz o caminho real, com a sessão da paciente e RLS ligada. Se o
// ciclo voltar, ele falha aqui com o mesmo 42P17.
// =============================================================================
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { uploadPatientDocument } from "@/modules/profiles/patient-document-repository";
import { attachDocumentToStory } from "@/modules/story/attachment-repository";

import { createCuradoriaClient } from "./curadoria-client";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const admin = createAdminSupabaseClient();
const paciente = createCuradoriaClient(url, anonKey);

let profileId: string;
let storyId: string;
let documentId: string;

beforeAll(async () => {
  const sufixo = randomUUID().slice(0, 8);
  const email = "anexo-" + sufixo + "@aliviar-conexao.local";
  const password = "Senha-" + sufixo + "-Ok!";

  const { data: criado, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Paciente do Anexo" },
  });
  if (error || !criado?.user) throw new Error("fixture: " + (error?.message ?? "sem usuário"));
  profileId = criado.user.id;

  const { data: papel } = await admin.from("roles").select("id").eq("slug", "paciente").single();
  await admin.from("user_roles").insert({ profile_id: profileId, role_id: papel!.id });

  const { data: story } = await admin
    .from("patient_stories")
    .insert({ profile_id: profileId, created_by: profileId })
    .select("id")
    .single();
  storyId = story!.id as string;

  const { data: documento } = await admin
    .from("patient_documents")
    .insert({
      profile_id: profileId,
      uploaded_by: profileId,
      file_path: profileId + "/laudo.txt",
      file_name: "laudo.txt",
    })
    .select("id")
    .single();
  documentId = documento!.id as string;

  const { error: authErr } = await paciente.auth.signInWithPassword({ email, password });
  if (authErr) throw new Error("fixture: login — " + authErr.message);
});

afterAll(async () => {
  await admin.from("patient_story_attachments").delete().eq("story_id", storyId);
  await admin.from("patient_documents").delete().eq("profile_id", profileId);
  await admin.from("patient_stories").delete().eq("profile_id", profileId);
  await admin.auth.admin.deleteUser(profileId);
});

describe("anexar documento à própria história", () => {
  it("a paciente enxerga a própria história e o próprio documento", async () => {
    const { data: historias } = await paciente.from("patient_stories").select("id").eq("id", storyId);
    const { data: documentos } = await paciente
      .from("patient_documents")
      .select("id")
      .eq("id", documentId);

    expect(historias ?? []).toHaveLength(1);
    expect(documentos ?? []).toHaveLength(1);
  });

  it("o anexo é aceito — nenhuma recursão de policy (42P17)", async () => {
    const { error } = await paciente
      .from("patient_story_attachments")
      .insert({ story_id: storyId, document_id: documentId });

    expect(
      error?.code,
      "as policies voltaram a se consultar em círculo: " + (error?.message ?? ""),
    ).not.toBe("42P17");
    expect(error, "o anexo foi recusado: " + (error?.message ?? "")).toBeNull();
  });

  it("o anexo aparece para a própria paciente depois de criado", async () => {
    const { data } = await paciente
      .from("patient_story_attachments")
      .select("story_id, document_id")
      .eq("story_id", storyId);

    expect(data ?? []).toHaveLength(1);
    expect(data![0]!.document_id).toBe(documentId);
  });

  it("a policy do Curador lê por função SECURITY DEFINER — é o que quebra o ciclo", () => {
    // Se alguém trocar a função por uma subconsulta direta a
    // patient_story_attachments, a recursão volta. O teste olha o mecanismo,
    // não só o sintoma.
    const definicao = execFileSync(
      "docker",
      [
        "exec",
        "supabase_db_aliviar-conexao",
        "psql",
        "-U",
        "postgres",
        "-t",
        "-A",
        "-c",
        `select p.prosecdef::text || '|' ||
                pg_get_expr(pol.polqual, pol.polrelid)
           from pg_policy pol
           join pg_proc p on p.proname = 'documento_esta_em_case_do_curador'
          where pol.polrelid = 'curadoria.patient_documents'::regclass
            and pol.polname = 'patient_documents_select_assigned_curator';`,
      ],
      { encoding: "utf-8" },
    ).trim();

    expect(definicao.startsWith("true"), "a função deixou de ser SECURITY DEFINER").toBe(true);
    expect(definicao).toContain("documento_esta_em_case_do_curador");
    expect(definicao, "a policy voltou a consultar a tabela de anexos direto").not.toContain(
      "patient_story_attachments",
    );
  });

  // ---------------------------------------------------------------------------
  // Bloco B/E8 (gate B16) — a saga documento+vínculo: retry reutiliza, duplo
  // clique não duplica, falha compensa (com guarda) e o resíduo nunca fica
  // invisível.
  // ---------------------------------------------------------------------------

  it("retry/duplo clique do vínculo reutiliza o existente — nunca duplica nem vira erro", async () => {
    // O anexo storyId+documentId já existe (teste anterior). Repetir pelo
    // repositório real é o duplo clique/retry do produto.
    await attachDocumentToStory(paciente, storyId, documentId);
    await attachDocumentToStory(paciente, storyId, documentId);

    const { count } = await admin
      .from("patient_story_attachments")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("document_id", documentId);
    expect(count, "o vínculo continua único").toBe(1);
  });

  it("vínculo recusado compensa o documento recém-criado — banco E storage, sem resíduo", async () => {
    // O caminho completo da saga: arquivo REAL no storage + linha no banco.
    const enviado = await uploadPatientDocument(
      paciente,
      profileId,
      new File(["conteudo do exame"], "exame-compensavel.txt", { type: "text/plain" }),
      // D-12.2: o repositório passou a receber o `content_type` já conferido
      // pela action. Este teste exercita a SAGA, não a allowlist — o tipo vai
      // explícito para manter exatamente o cenário anterior.
      "text/plain",
    );

    // O vínculo falha (história inexistente) — a recusa chega inteira...
    await expect(attachDocumentToStory(paciente, randomUUID(), enviado.id)).rejects.toThrow();

    // ...e o documento foi compensado: nem linha no banco, nem arquivo no
    // storage — nunca uma divergência silenciosa.
    const { data: linha } = await admin
      .from("patient_documents")
      .select("id")
      .eq("id", enviado.id)
      .maybeSingle();
    expect(linha, "a linha do documento foi removida pela compensação").toBeNull();

    const { data: arquivos } = await admin.storage.from("patient-documents").list(profileId);
    const sobrouNoStorage = (arquivos ?? []).some(
      (arquivo) => `${profileId}/${arquivo.name}` === enviado.filePath,
    );
    expect(sobrouNoStorage, "o arquivo foi removido do storage pela compensação").toBe(false);

    // Compensação concluída = nenhum evento de resíduo (o rastro é para
    // quando a compensação FALHA).
    const { count: rastros } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "patient_document_orphaned")
      .contains("metadata", { document_id: enviado.id });
    expect(rastros).toBe(0);
  });

  it("a compensação tem guarda: documento já vinculado a uma história nunca é removido", async () => {
    // documentId está vinculado a storyId. Tentar anexá-lo a uma história
    // inexistente falha — mas a compensação NÃO pode destruir um documento
    // que pertence legitimamente a outra história.
    await expect(attachDocumentToStory(paciente, randomUUID(), documentId)).rejects.toThrow();

    const { data: linha } = await admin
      .from("patient_documents")
      .select("id")
      .eq("id", documentId)
      .maybeSingle();
    expect(linha, "o documento vinculado sobreviveu à falha do novo vínculo").not.toBeNull();

    const { count } = await admin
      .from("patient_story_attachments")
      .select("*", { count: "exact", head: true })
      .eq("story_id", storyId)
      .eq("document_id", documentId);
    expect(count, "o vínculo original permanece intacto").toBe(1);
  });

  it("o rastro do resíduo é gravável pelo dono, recusado para terceiros, vínculo existente e documento inexistente", async () => {
    // Um documento SEM vínculo — o único estado que caracteriza resíduo.
    const { data: docSolto, error: docSoltoError } = await admin
      .from("patient_documents")
      .insert({
        profile_id: profileId,
        uploaded_by: profileId,
        file_path: `${profileId}/residuo-${randomUUID().slice(0, 8)}.txt`,
        file_name: "residuo-prova.txt",
      })
      .select("id")
      .single();
    expect(docSoltoError, `fixture do documento solto: ${docSoltoError?.message}`).toBeNull();
    const docSoltoId = docSolto!.id as string;

    // O mecanismo do evento observável (falha da compensação): a RPC grava em
    // audit_logs — com sessão real, só sobre o próprio documento.
    const { error } = await paciente.rpc("register_patient_document_residue", {
      _document_id: docSoltoId,
      _reason: "Prova de integração do rastro observável (Bloco B/E8).",
    });
    expect(error, `o dono registra o rastro: ${error?.message}`).toBeNull();

    const { count: rastros } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "patient_document_orphaned")
      .contains("metadata", { document_id: docSoltoId });
    expect(rastros, "o evento ficou no ledger").toBe(1);

    // Documento vinculado a uma história NÃO é resíduo: o servidor valida o
    // estado e recusa o registro inventado.
    const { error: vinculadoError } = await paciente.rpc("register_patient_document_residue", {
      _document_id: documentId,
      _reason: "Não é resíduo — está vinculado.",
    });
    expect(vinculadoError, "documento vinculado não é registrável como resíduo").not.toBeNull();

    // Documento inexistente: recusa explícita de domínio, nunca registro
    // inventado.
    const { error: inexistenteError } = await paciente.rpc("register_patient_document_residue", {
      _document_id: randomUUID(),
      _reason: "Não deve registrar nada.",
    });
    expect(inexistenteError).not.toBeNull();

    // Terceiro (autenticado, sem papel de administrador, não dono): recusado.
    const outra = createCuradoriaClient(url, anonKey);
    const sufixo = randomUUID().slice(0, 8);
    const { data: criado } = await admin.auth.admin.createUser({
      email: `anexo-terceira-${sufixo}@aliviar-conexao.local`,
      password: `Senha-${sufixo}-Ok!`,
      email_confirm: true,
    });
    await outra.auth.signInWithPassword({
      email: `anexo-terceira-${sufixo}@aliviar-conexao.local`,
      password: `Senha-${sufixo}-Ok!`,
    });

    const { error: terceiraError } = await outra.rpc("register_patient_document_residue", {
      _document_id: documentId,
      _reason: "Tentativa de terceiro.",
    });
    expect(terceiraError, "terceiro não registra rastro sobre documento alheio").not.toBeNull();

    await outra.auth.signOut();
    await admin.auth.admin.deleteUser(criado!.user!.id);
  });
});
