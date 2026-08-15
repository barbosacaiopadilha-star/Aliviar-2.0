// =============================================================================
// SEGURANÇA DA FUNÇÃO QUE QUEBROU A RECURSÃO (Release de Reconstrução).
//
// `documento_esta_em_case_do_curador` é SECURITY DEFINER — roda com os
// privilégios de quem a criou, e por isso atravessa a RLS de
// `patient_story_attachments`. Isso é o que resolve o 42P17, e é exatamente
// o que exige prova: uma função assim mal escrita vira uma porta lateral.
//
// Este arquivo cobre as duas metades: as propriedades da função (search_path
// fixo, grants mínimos, só leitura, devolve só booleano) e o comportamento
// das policies com atores reais — inclusive quem NÃO pode ver.
// =============================================================================
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { createCuradoriaClient } from "./curadoria-client";
import { containerDoBanco } from "../apoio/stack-local";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const admin = createAdminSupabaseClient();

function psql(query: string): string {
  return execFileSync(
    "docker",
    ["exec", containerDoBanco(), "psql", "-U", "postgres", "-t", "-A", "-c", query],
    { encoding: "utf-8" },
  ).trim();
}

type Ator = {
  id: string;
  email: string;
  password: string;
  client: ReturnType<typeof createCuradoriaClient>;
};

const criados: string[] = [];

async function criarAtor(papel: string | null, nome: string): Promise<Ator> {
  const sufixo = randomUUID().slice(0, 8);
  const email = "seg-" + sufixo + "@aliviar-conexao.local";
  const password = "Senha-" + sufixo + "-Ok!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: nome },
  });
  if (error || !data?.user) throw new Error("fixture: " + (error?.message ?? "sem usuário"));
  criados.push(data.user.id);

  if (papel) {
    const { data: linha } = await admin.from("roles").select("id").eq("slug", papel).single();
    await admin.from("user_roles").insert({ profile_id: data.user.id, role_id: linha!.id });
  }

  const client = createCuradoriaClient(url, anonKey);
  await client.auth.signInWithPassword({ email, password });
  return { id: data.user.id, email, password, client };
}

let dona: Ator;
let outraPaciente: Ator;
let curadorDoCase: Ator;
let curadorAlheio: Ator;
let semPapel: Ator;
let storyId: string;
let documentId: string;

beforeAll(async () => {
  dona = await criarAtor("paciente", "Dona do Documento");
  outraPaciente = await criarAtor("paciente", "Outra Paciente");
  curadorDoCase = await criarAtor("curador_medico", "Curador do Case");
  curadorAlheio = await criarAtor("curador_medico", "Curador de Outro Case");
  semPapel = await criarAtor(null, "Sem Papel");

  const { data: story } = await admin
    .from("patient_stories")
    .insert({ profile_id: dona.id, created_by: dona.id, status: "enviada" })
    .select("id")
    .single();
  storyId = story!.id as string;

  const { data: documento } = await admin
    .from("patient_documents")
    .insert({
      profile_id: dona.id,
      uploaded_by: dona.id,
      file_path: dona.id + "/exame.txt",
      file_name: "exame.txt",
    })
    .select("id")
    .single();
  documentId = documento!.id as string;

  await admin.from("patient_story_attachments").insert({ story_id: storyId, document_id: documentId });

  // O Case que dá ao curadorDoCase — e só a ele — acesso a este documento.
  await admin.from("patient_profiles").insert({ profile_id: dona.id });

  await admin.from("cases").insert({
    patient_profile_id: dona.id,
    source_story_id: storyId,
    assigned_curator_id: curadorDoCase.id,
    created_by: curadorDoCase.id,
  });
});

afterAll(async () => {
  await admin.from("patient_story_attachments").delete().eq("story_id", storyId);
  await admin.from("cases").delete().eq("source_story_id", storyId);
  await admin.from("patient_documents").delete().eq("profile_id", dona.id);
  await admin.from("patient_stories").delete().eq("profile_id", dona.id);
  await admin.from("patient_profiles").delete().eq("profile_id", dona.id);
  for (const id of criados) await admin.auth.admin.deleteUser(id);
});

describe("propriedades da função SECURITY DEFINER", () => {
  it("tem search_path fixado — não confia no search_path de quem chama", () => {
    const config = psql(
      `select coalesce(array_to_string(p.proconfig, ','), '')
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'curadoria' and p.proname = 'documento_esta_em_case_do_curador';`,
    );
    expect(config).toContain("search_path=");
    expect(config).toContain("curadoria");
  });

  it("é SECURITY DEFINER, estável e devolve apenas booleano", () => {
    const forma = psql(
      `select p.prosecdef::text || '|' || p.provolatile::text || '|' || pg_catalog.format_type(p.prorettype, null)
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'curadoria' and p.proname = 'documento_esta_em_case_do_curador';`,
    );
    const [definer, volatilidade, retorno] = forma.split("|");
    expect(definer).toBe("true");
    // `s` = STABLE: não escreve. Uma função SECURITY DEFINER que pudesse
    // gravar seria uma porta lateral de escrita.
    expect(volatilidade).toBe("s");
    expect(retorno).toBe("boolean");
  });

  it("não é executável por public nem por anon — só por quem tem sessão", () => {
    const publico = psql(
      `select has_function_privilege('public', 'curadoria.documento_esta_em_case_do_curador(uuid)', 'EXECUTE')::text;`,
    );
    const anon = psql(
      `select has_function_privilege('anon', 'curadoria.documento_esta_em_case_do_curador(uuid)', 'EXECUTE')::text;`,
    );
    const autenticado = psql(
      `select has_function_privilege('authenticated', 'curadoria.documento_esta_em_case_do_curador(uuid)', 'EXECUTE')::text;`,
    );

    expect(publico).toBe("false");
    expect(anon).toBe("false");
    expect(autenticado).toBe("true");
  });
});

describe("autorização de leitura do documento — quem pode e quem não pode", () => {
  it("a paciente dona lê o próprio documento", async () => {
    const { data } = await dona.client.from("patient_documents").select("id").eq("id", documentId);
    expect(data ?? []).toHaveLength(1);
  });

  it("outra paciente NÃO lê o documento alheio", async () => {
    const { data } = await outraPaciente.client
      .from("patient_documents")
      .select("id")
      .eq("id", documentId);
    expect(data ?? [], "a correção da recursão abriu acesso lateral").toHaveLength(0);
  });

  it("o Curador do Case lê o documento anexado à história dele", async () => {
    const { data } = await curadorDoCase.client
      .from("patient_documents")
      .select("id")
      .eq("id", documentId);
    expect(data ?? [], "o Curador designado perdeu o acesso legítimo").toHaveLength(1);
  });

  it("Curador NÃO atribuído a este Case não lê o documento", async () => {
    const { data } = await curadorAlheio.client
      .from("patient_documents")
      .select("id")
      .eq("id", documentId);
    expect(data ?? [], "papel de curador virou passe livre").toHaveLength(0);
  });

  it("usuário sem papel algum não lê o documento", async () => {
    const { data } = await semPapel.client
      .from("patient_documents")
      .select("id")
      .eq("id", documentId);
    expect(data ?? []).toHaveLength(0);
  });

  it("a função não permite escrever nada — nem a quem pode ler", async () => {
    const { error } = await curadorDoCase.client
      .from("patient_documents")
      .update({ file_name: "renomeado-indevidamente.txt" })
      .eq("id", documentId);

    const { data: depois } = await admin
      .from("patient_documents")
      .select("file_name")
      .eq("id", documentId)
      .single();

    expect(depois!.file_name, "leitura virou permissão de escrita").toBe("exame.txt");
    void error;
  });
});
