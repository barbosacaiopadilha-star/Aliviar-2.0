import { execFileSync } from "node:child_process";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { processarCurriculo } from "@/modules/profiles/formacao-academica-extracao";
import {
  confirmarFormacao,
  salvarEdicaoDeFormacao,
} from "@/modules/profiles/formacao-academica-repository";

import { argumentosPsql } from "../apoio/stack-local";
import { seedDeliveredCase, type DeliveredFixture } from "../apoio/apoio-curadoria-entregue";

/**
 * FORMAÇÃO ACADÊMICA — as garantias que vivem no banco.
 *
 * 1. A tripla restrição da RLS do paciente: verificado ∧ opção ENTREGUE ∧
 *    titular do Case — cada perna falseada individualmente.
 * 2. O pipeline: incapaz de confirmar; idempotente; incapaz de tocar linha
 *    editada por gente ou verificada; falha sem meia-formação.
 * 3. A confirmação: instituição obrigatória, ou justificativa gravada.
 * 4. O índice reverso aprovado: EXPLAIN prova que ele é usável.
 */

const admin = createAdminSupabaseClient();

const TEXTO_FICTICIO = [
  "Formação Acadêmica",
  "Graduação em Medicina — Universidade Sintética de Testes, 2004-2010",
  "Residência em Clínica Médica — Hospital Sintético Central, 2010-2013",
].join("\n");
const PAGINAS = 1;

const lerPdfFicticio = async () => ({ texto: TEXTO_FICTICIO, paginas: PAGINAS });
const baixarPdfFicticio = async () => new Uint8Array([37, 80, 68, 70]);

let fx: DeliveredFixture;
let profissionalEntregue: string;
let profissionalForaDaEntrega: string;
let documentId: string;
let paciente: SupabaseClient<any, any, any, any, any>;

async function contarEntradas(professionalId: string): Promise<number> {
  const { count } = await admin
    .from("professional_education_entries")
    .select("id", { count: "exact", head: true })
    .eq("professional_profile_id", professionalId);
  return count ?? 0;
}

beforeAll(async () => {
  fx = await seedDeliveredCase();
  profissionalEntregue = fx.selectedProfessionals[0]!.id;

  // Um profissional VERIFICÁVEL mas fora de qualquer entrega — a perna (ii).
  const { data: fora } = await admin
    .from("professional_profiles")
    .insert({
      display_name: "Fora da Entrega",
      professional_identifier: `FORM-FORA-${Date.now()}`,
      created_by: fx.adminUserId,
    })
    .select("id")
    .single();
  profissionalForaDaEntrega = fora!.id as string;

  // O documento que o pipeline lê (metadado real; bytes injetados nos testes).
  const { data: doc } = await admin
    .from("professional_documents")
    .insert({
      professional_profile_id: profissionalEntregue,
      file_path: `formacao-teste/${Date.now()}.pdf`,
      file_name: "curriculo-sintetico.pdf",
      content_type: "application/pdf",
      uploaded_by: fx.adminUserId,
    })
    .select("id")
    .single();
  documentId = doc!.id as string;

  paciente = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: "curadoria" } },
  );
  const { error } = await paciente.auth.signInWithPassword({
    email: fx.patientEmail,
    password: fx.patientPassword,
  });
  if (error) throw new Error(`login da paciente falhou: ${error.message}`);
}, 300_000);

describe("RLS · a tripla restrição, perna a perna", () => {
  it("a paciente lê APENAS o verificado do profissional entregue do próprio Case", async () => {
    // Três entradas: verificada no entregue; não-verificada no entregue;
    // verificada num profissional fora de entrega.
    const { error: erroInsert } = await admin.from("professional_education_entries").insert([
      {
        professional_profile_id: profissionalEntregue,
        kind: "residencia",
        title: "Residência RLS Visível",
        institution: "Hospital Sintético Central",
        source: "fixture_rls",
        verification_status: "verificado",
        verified_at: new Date().toISOString(),
        verified_by: fx.adminUserId,
      },
      {
        professional_profile_id: profissionalEntregue,
        kind: "curso",
        title: "Curso RLS Invisível (não verificado)",
        // PostgREST em lote não aplica DEFAULT a chave ausente — explícito.
        verification_status: "nao_verificado",
      },
      {
        professional_profile_id: profissionalForaDaEntrega,
        kind: "graduacao",
        title: "Graduação RLS Invisível (fora da entrega)",
        source: "fixture_rls",
        verification_status: "verificado",
        verified_at: new Date().toISOString(),
        verified_by: fx.adminUserId,
      },
    ]);
    expect(erroInsert?.message ?? null).toBeNull();

    const { data: visiveis, error: erroSelect } = await paciente
      .from("professional_education_entries")
      .select("title, verification_status, professional_profile_id");

    expect(erroSelect?.message ?? null).toBeNull();
    const linhas = (visiveis ?? []) as Array<Record<string, unknown>>;
    const titulos = linhas.map((v) => v.title);
    expect(titulos).toContain("Residência RLS Visível");
    expect(titulos).not.toContain("Curso RLS Invisível (não verificado)");
    expect(titulos).not.toContain("Graduação RLS Invisível (fora da entrega)");
    for (const v of linhas) {
      expect(v.verification_status).toBe("verificado");
      expect(v.professional_profile_id).toBe(profissionalEntregue);
    }
  });

  it("outra pessoa autenticada como paciente NÃO lê a formação de um Case alheio", async () => {
    const outra = await seedDeliveredCase();
    const clienteAlheio = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { db: { schema: "curadoria" } },
    );
    await clienteAlheio.auth.signInWithPassword({
      email: outra.patientEmail,
      password: outra.patientPassword,
    });
    const { data } = await clienteAlheio
      .from("professional_education_entries")
      .select("title")
      .eq("professional_profile_id", profissionalEntregue);
    expect(data ?? []).toEqual([]);
  }, 300_000);

  it("as tabelas de rastro (runs/links) são MUDAS para a paciente", async () => {
    const { data: runs } = await paciente
      .from("professional_education_extraction_runs")
      .select("id");
    const { data: links } = await paciente
      .from("professional_education_extraction_links")
      .select("entry_id");
    expect(runs ?? []).toEqual([]);
    expect(links ?? []).toEqual([]);
  });
});

describe("pipeline · idempotência, travas humanas e falha sem meia-formação", () => {
  const extrator = async () => [
    {
      kind: "graduacao",
      title: "Graduação em Medicina — Universidade Sintética de Testes",
      institution: "Universidade Sintética de Testes",
      city: null,
      country: null,
      periodStart: 2004,
      periodEnd: 2010,
    },
    {
      kind: "residencia",
      title: "Residência em Clínica Médica — Hospital Sintético Central",
      institution: "Hospital Sintético Central",
      city: null,
      country: null,
      periodStart: 2010,
      periodEnd: 2013,
    },
  ];

  it("o pipeline cria SÓ nao_verificado — não existe autoconfirmação", async () => {
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator,
    });
    expect(r.status).toBe("concluida");
    expect(r.criadas).toBe(2);

    const { data } = await admin
      .from("professional_education_entries")
      .select("verification_status, source")
      .eq("professional_profile_id", profissionalEntregue)
      .eq("source", "extracao_assistida");
    expect(data!.length).toBe(2);
    for (const linha of data!) expect(linha.verification_status).toBe("nao_verificado");
  });

  it("reprocessar o MESMO documento substitui, nunca duplica", async () => {
    const antes = await contarEntradas(profissionalEntregue);
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator,
    });
    expect(r.status).toBe("concluida");
    expect(await contarEntradas(profissionalEntregue)).toBe(antes);
  });

  it("candidato EDITADO por gente sobrevive ao reprocessamento, mesmo nao_verificado", async () => {
    const { data: candidata } = await admin
      .from("professional_education_entries")
      .select("id")
      .eq("professional_profile_id", profissionalEntregue)
      .eq("kind", "graduacao")
      .eq("source", "extracao_assistida")
      .single();
    const editada = candidata!.id as string;

    const edicao = await salvarEdicaoDeFormacao(admin, editada, {
      kind: "graduacao",
      title: "Graduação em Medicina — Universidade Sintética de Testes",
      institution: "Universidade Sintética de Testes",
      city: "Cidade Sintética",
      country: "Brasil",
      periodStart: 2004,
      periodEnd: 2010,
      notes: null,
    });
    expect(edicao.ok).toBe(true);

    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator: async () => [],
    });
    expect(r.status).toBe("concluida");

    const { data: sobrevivente } = await admin
      .from("professional_education_entries")
      .select("id, city")
      .eq("id", editada)
      .maybeSingle();
    expect(sobrevivente?.id).toBe(editada);
    expect(sobrevivente?.city).toBe("Cidade Sintética");
  });

  it("entrada VERIFICADA é intocável pelo pipeline", async () => {
    // O run vazio do caso anterior substituiu (corretamente) a residência
    // não-editada; recria-se o candidato pelo próprio pipeline antes de
    // confirmar — o teste usa o caminho real, não um atalho.
    await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator,
    });
    const { data: residencia } = await admin
      .from("professional_education_entries")
      .select("id")
      .eq("professional_profile_id", profissionalEntregue)
      .eq("kind", "residencia")
      .eq("source", "extracao_assistida")
      .single();
    const confirmada = await confirmarFormacao(admin, residencia!.id as string, fx.adminUserId);
    expect(confirmada).toEqual({ ok: true });

    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator: async () => [],
    });
    expect(r.status).toBe("concluida");

    const { data: aindaLa } = await admin
      .from("professional_education_entries")
      .select("verification_status")
      .eq("id", residencia!.id as string)
      .single();
    expect(aindaLa!.verification_status).toBe("verificado");
  });

  it("falha do extrator: run 'falha', ZERO formação nova, existentes intactas", async () => {
    const antes = await contarEntradas(profissionalEntregue);
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
      extrator: async () => {
        throw new Error("extrator_sintetico_quebrado");
      },
    });
    expect(r.status).toBe("falha");
    expect(r.criadas).toBe(0);
    expect(await contarEntradas(profissionalEntregue)).toBe(antes);

    const { data: run } = await admin
      .from("professional_education_extraction_runs")
      .select("status, erro")
      .eq("id", r.runId!)
      .single();
    expect(run!.status).toBe("falha");
  });

  it("currículo visual: falha declarada 'requer_pdf_textual', sem invenção", async () => {
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: async () => ({ texto: "", paginas: 0 }),
      extrator,
    });
    expect(r.status).toBe("falha");
    expect(r.erro).toBe("requer_pdf_textual");
    expect(r.requerPdfTextual).toBe(true);
    expect(r.criadas).toBe(0);
  });
});

describe("confirmação · decisão vinculante 3", () => {
  it("sem instituição, confirmar exige justificativa — e ela fica nas notas administrativas", async () => {
    const { data: sem } = await admin
      .from("professional_education_entries")
      .insert({
        professional_profile_id: profissionalEntregue,
        kind: "pos_graduacao",
        title: "Pós sem instituição no currículo",
        source: "digitacao_manual",
      })
      .select("id")
      .single();

    const recusa = await confirmarFormacao(admin, sem!.id as string, fx.adminUserId);
    expect(recusa).toEqual({ ok: false, motivo: "instituicao_obrigatoria" });

    const aceita = await confirmarFormacao(admin, sem!.id as string, fx.adminUserId, {
      justificativaSemInstituicao: "O currículo não nomeia a instituição desta formação.",
    });
    expect(aceita).toEqual({ ok: true });

    const { data: conferida } = await admin
      .from("professional_education_entries")
      .select("verification_status, verified_by, notes")
      .eq("id", sem!.id as string)
      .single();
    expect(conferida!.verification_status).toBe("verificado");
    expect(conferida!.verified_by).toBe(fx.adminUserId);
    expect(conferida!.notes).toContain("Confirmada sem instituição");
  });
});

/**
 * F-1 · O VÍNCULO DOCUMENTO ↔ PROFISSIONAL, NO BANCO REAL.
 *
 * O ataque é o do administrador distraído (ou mal-intencionado): mandar o
 * `documentId` do profissional A dizendo que é formação do profissional B. Antes
 * da correção o pipeline obedecia — buscava o documento só por `id`. Agora a
 * consulta exige as DUAS colunas, e a recusa é rejeição: nada é escrito.
 */
describe("F-1 · currículo de um não vira formação de outro", () => {
  it("documento do profissional entregue NÃO é processado como formação de outro", async () => {
    const antesEntradas = await contarEntradas(profissionalForaDaEntrega);
    const { count: antesRuns } = await admin
      .from("professional_education_extraction_runs")
      .select("id", { count: "exact", head: true })
      .eq("professional_profile_id", profissionalForaDaEntrega);
    const { count: antesLinks } = await admin
      .from("professional_education_extraction_links")
      .select("entry_id", { count: "exact", head: true })
      .eq("document_id", documentId);

    // `documentId` pertence a `profissionalEntregue`; pedimos como se fosse do
    // outro. Sem `baixarPdf`: é o caminho real, o único que confere o vínculo.
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalForaDaEntrega,
      documentId,
      actorId: fx.adminUserId,
      lerPdf: lerPdfFicticio,
    });

    expect(r.status).toBe("falha");
    expect(r.erro).toBe("documento_de_outro_profissional");
    expect(r.runId, "rejeição não registra execução").toBeNull();
    expect(r.criadas).toBe(0);

    // Nada nasceu: nem formação, nem run, nem vínculo.
    expect(await contarEntradas(profissionalForaDaEntrega)).toBe(antesEntradas);
    const { count: depoisRuns } = await admin
      .from("professional_education_extraction_runs")
      .select("id", { count: "exact", head: true })
      .eq("professional_profile_id", profissionalForaDaEntrega);
    const { count: depoisLinks } = await admin
      .from("professional_education_extraction_links")
      .select("entry_id", { count: "exact", head: true })
      .eq("document_id", documentId);
    expect(depoisRuns ?? 0).toBe(antesRuns ?? 0);
    expect(depoisLinks ?? 0).toBe(antesLinks ?? 0);
  });

  it("o dono legítimo continua processando o próprio documento", async () => {
    const r = await processarCurriculo({
      supabase: admin,
      professionalProfileId: profissionalEntregue,
      documentId,
      actorId: fx.adminUserId,
      baixarPdf: baixarPdfFicticio,
      lerPdf: lerPdfFicticio,
    });
    expect(r.status, "a correção não fechou a porta certa").toBe("concluida");
    expect(r.runId).not.toBeNull();
  });
});

describe("índice reverso · aprovado sob prova de plano", () => {
  it("com seqscan desligado, a busca por profissional usa curated_selection_options_professional_idx", () => {
    const [cmd, container] = ["docker", argumentosPsql("")[1]!];
    const plano = execFileSync(
      cmd,
      [
        "exec",
        "-i",
        container,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-tAc",
        `set enable_seqscan = off; explain select 1 from curadoria.curated_selection_options where professional_profile_id = '${profissionalEntregue}';`,
      ],
      { encoding: "utf8" },
    );
    expect(plano).toContain("curated_selection_options_professional_idx");
  });
});
