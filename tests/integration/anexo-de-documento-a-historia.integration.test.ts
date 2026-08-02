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
});
