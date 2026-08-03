import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import { listAreaDeclarations } from "@/modules/curadoria/area-repository";
import { resetPatientPassword } from "@/modules/profiles/patient-account-repository";

import { createCuradoriaCertificationFixture } from "../integration/certificacao-fixture";
import { createCuradoriaClient } from "../integration/curadoria-client";

import {
  anonKey,
  casoComCurador,
  entrarComo,
  novaPaciente,
  perfilDePrioridades,
  profissionaisSinteticos,
  relatorioDaSelecao,
  selecaoComOpcoes,
  serviceClient,
  url,
  type Sessao,
} from "./apoio";

/**
 * =============================================================================
 * GATES DA FRENTE 2 DO BLOCO C — ERRATA, REDECLARAÇÃO, TRILHAS E COMPETÊNCIAS
 * =============================================================================
 *
 * Complementam os gates C5/C6/C9 de `imutabilidade.integration.test.ts` e os
 * da Frente 1 com os contratos das Etapas 6 (errata do Relatório entregue),
 * 8 (remoção explícita de competências), 9 (redeclaração de área versionada)
 * e 10/11 (trilhas de atos sensíveis + testes negativos de autorização por
 * RELAÇÃO: curador não-atribuído, outra paciente, conta sem papel, anon,
 * PostgREST direto). A supersessão do Perfil já foi coberta pela Frente 1 —
 * nada dela é duplicado aqui.
 *
 * Mesmo padrão da casa: estado preparado com service_role (fixture), ato com
 * sessão REAL do papel — login de verdade, RLS de verdade.
 */

const service = serviceClient();

let curador: Sessao;
let admin: Sessao;
/** Papel de equipe SEM relação com os Cases destes gates. */
let concierge: Sessao;
/** Três profissionais sintéticos comuns (nunca publicados, nunca fixture). */
let profissionais: string[];
/** Um profissional de certificação PUBLICADO — para os gates de competência. */
let profissionalPublicado: string;

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
  admin = await entrarComo("administrador");
  concierge = await entrarComo("concierge");
  profissionais = await profissionaisSinteticos(service, 3, curador.userId, "f2");
  const fixture = await createCuradoriaCertificationFixture(service);
  profissionalPublicado = fixture.professionalIds["fixture-a"];
});

/** Conta real SEM papel nenhum — o "sem papel" da Etapa 11. */
async function contaSemPapel(prefixo: string): Promise<Sessao> {
  const sufixo = randomUUID().slice(0, 8);
  const email = `${prefixo}-${sufixo}@aliviar-conexao.local`;
  const password = `Senha-${sufixo}-Ok!`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data?.user) throw new Error(`fixture conta sem papel: ${error?.message ?? "?"}`);
  const client = createCuradoriaClient(url(), anonKey());
  const { error: loginError } = await client.auth.signInWithPassword({ email, password });
  if (loginError) throw new Error(`login conta sem papel: ${loginError.message}`);
  return { client, userId: data.user.id };
}

function anonClient() {
  return createCuradoriaClient(url(), anonKey());
}

/** Cadeia completa com Relatório ENTREGUE, pelo caminho real das fixtures. */
async function cadeiaEntregue(prefixo: string) {
  const { caseId, paciente } = await casoComCurador(service, curador.userId, prefixo);
  const profileId = await perfilDePrioridades(service, caseId, curador.userId);
  const selectionId = await selecaoComOpcoes(service, caseId, profileId, curador.userId, profissionais, {
    entregue: true,
  });
  const reportId = await relatorioDaSelecao(service, caseId, selectionId, curador.userId, profissionais, {
    emitido: true,
    entregue: true,
  });
  return { caseId, paciente, selectionId, reportId };
}

// ---------------------------------------------------------------------------
// ERRATA (Etapa 6, ADR-050)
// ---------------------------------------------------------------------------

describe("GATE-F2-ERR [Bloco C/Frente 2] errata: correção pós-entrega com original intacto", () => {
  it("o Curador atribuído cria errata versionada de Relatório ENTREGUE — e o original fica byte-intacto, com trilha", async () => {
    const { reportId } = await cadeiaEntregue("f2-err");

    const { data: antes } = await service
      .from("curadoria_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    const { data: errata, error } = await curador.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Corrigir o telefone de contato da opção 2.",
      _content: { correcoes: [{ campo: "contato", opcao: 2 }] },
    });
    expect(error, `errata oficial precisa nascer: ${error?.message}`).toBeNull();

    const criada = errata as { id: string; version: number; reason: string; author_id: string };
    expect(criada.version, "a primeira errata é a versão 1").toBe(1);
    expect(criada.author_id, "a autoria é do Curador que emitiu a errata").toBe(curador.userId);
    expect(criada.reason).toBe("Corrigir o telefone de contato da opção 2.");

    // Repetir é ATO novo (contrato documentado): versão seguinte, nunca
    // sobrescrita nem deduplicação silenciosa.
    const segunda = await curador.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Segunda correção, ato próprio.",
    });
    expect(segunda.error, `segunda errata: ${segunda.error?.message}`).toBeNull();
    expect((segunda.data as { version: number }).version, "cada ato é a versão seguinte").toBe(2);

    // O original não mudou em NADA — nem carimbo, nem conteúdo, nem updated_at.
    const { data: depois } = await service
      .from("curadoria_reports")
      .select("*")
      .eq("id", reportId)
      .single();
    expect(depois, "o Relatório original permanece byte-intacto").toEqual(antes);

    // A trilha nomeia o ato.
    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata")
      .eq("action", "report_errata_created")
      .contains("metadata", { errata_id: criada.id });
    expect(trilha ?? [], "audit_log report_errata_created do ato").toHaveLength(1);
    expect(trilha![0]!.actor_id).toBe(curador.userId);
  });

  it("errata de Relatório NÃO-entregue é recusada — antes da entrega o caminho é revisar o documento", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f2-err-nao-entregue");
    const profileId = await perfilDePrioridades(service, caseId, curador.userId);
    const selectionId = await selecaoComOpcoes(service, caseId, profileId, curador.userId, profissionais, {
      entregue: false,
    });
    const reportId = await relatorioDaSelecao(service, caseId, selectionId, curador.userId, profissionais, {
      emitido: true,
      entregue: false,
    });

    const { error } = await curador.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Tentativa sobre documento não entregue.",
    });
    expect(error, "sem entrega não existe errata").not.toBeNull();

    const { count } = await service
      .from("curadoria_report_erratas")
      .select("*", { count: "exact", head: true })
      .eq("report_id", reportId);
    expect(count, "nenhuma errata nasce da recusa").toBe(0);
  });

  it("autorização é por RELAÇÃO (Etapa 11): papel sem atribuição, outra paciente, sem papel, anon e PostgREST direto — todos recusados", async () => {
    const { reportId, caseId } = await cadeiaEntregue("f2-err-auth");

    // Papel de equipe SEM relação com o Case.
    const semRelacao = await concierge.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Não conduzo este Case.",
    });
    expect(semRelacao.error, "papel sem atribuição ao Case não emite errata").not.toBeNull();

    // OUTRA paciente (nem é a do Case).
    const outra = await novaPaciente(service, "f2-err-outra");
    const daOutra = await outra.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Não é o meu Case.",
    });
    expect(daOutra.error, "outra paciente não emite errata").not.toBeNull();

    // Conta autenticada SEM papel nenhum.
    const semPapel = await contaSemPapel("f2-err-sempapel");
    const doSemPapel = await semPapel.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Conta sem papel.",
    });
    expect(doSemPapel.error, "conta sem papel não emite errata").not.toBeNull();

    // Anon, sem login nenhum.
    const doAnon = await anonClient().rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Anon.",
    });
    expect(doAnon.error, "anon não emite errata").not.toBeNull();

    // PostgREST direto: a tabela não tem grant de escrita — a RPC é o único caminho.
    const direto = await curador.client.from("curadoria_report_erratas").insert({
      report_id: reportId,
      version: 99,
      reason: "Insert direto.",
      author_id: curador.userId,
    });
    expect(direto.error, "INSERT direto na tabela de erratas é recusado").not.toBeNull();

    const { count } = await service
      .from("curadoria_report_erratas")
      .select("*", { count: "exact", head: true })
      .eq("report_id", reportId);
    expect(count, `nenhuma recusa deixou errata no Case ${caseId}`).toBe(0);
  });

  it("a própria errata é imutável: editar e apagar são recusados", async () => {
    const { reportId } = await cadeiaEntregue("f2-err-imut");
    const { data: errata, error } = await curador.client.rpc("create_report_errata", {
      _report_id: reportId,
      _reason: "Errata que ninguém reescreve.",
    });
    expect(error, `pré-condição: ${error?.message}`).toBeNull();
    const errataId = (errata as { id: string }).id;

    // UPDATE recusado até para o service (trigger, não só grant).
    const doServico = await service
      .from("curadoria_report_erratas")
      .update({ reason: "Reescrita da errata." })
      .eq("id", errataId);
    expect(doServico.error, "errata não se edita — nem pelo bastidor").not.toBeNull();

    // Sessão real: sem grant de UPDATE/DELETE, e com o trigger atrás.
    const doAdmin = await admin.client
      .from("curadoria_report_erratas")
      .update({ reason: "Reescrita por admin." })
      .eq("id", errataId);
    expect(doAdmin.error, "sessão real não edita errata").not.toBeNull();

    const remocao = await admin.client
      .from("curadoria_report_erratas")
      .delete()
      .eq("id", errataId);
    expect(remocao.error, "sessão real não apaga errata").not.toBeNull();

    const { data: sobrevive } = await service
      .from("curadoria_report_erratas")
      .select("reason")
      .eq("id", errataId)
      .single();
    expect(sobrevive!.reason, "a errata original sobrevive intacta").toBe(
      "Errata que ninguém reescreve.",
    );
  });
});

// ---------------------------------------------------------------------------
// REDECLARAÇÃO DE ÁREA (Etapa 9)
// ---------------------------------------------------------------------------

type DeclaracaoRow = {
  id: string;
  compatibility: string;
  superseded_at: string | null;
  superseded_by_declaration: string | null;
  declared_by: string;
  rationale: string | null;
};

async function declaracaoVigente(caseId: string, professionalId: string) {
  const { data } = await service
    .from("area_compatibility_declarations")
    .select("id, compatibility, superseded_at, superseded_by_declaration, declared_by, rationale")
    .eq("case_id", caseId)
    .eq("professional_profile_id", professionalId)
    .is("superseded_at", null);
  return (data ?? []) as DeclaracaoRow[];
}

describe("GATE-F2-RED [Bloco C/Frente 2] redeclaração de área versionada", () => {
  it("juízo terminal NÃO é sobrescrevível por UPDATE direto — nem pelo Curador do próprio Case", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f2-red-term");
    const alvo = profissionais[0];
    const { data: declarada } = await service
      .from("area_compatibility_declarations")
      .insert({
        case_id: caseId,
        professional_profile_id: alvo,
        compatibility: "COMPATIVEL",
        declared_by: curador.userId,
      })
      .select("id")
      .single();

    // ATAQUE: reescrever o juízo em lugar, com sessão real do Curador do Case.
    const { error } = await curador.client
      .from("area_compatibility_declarations")
      .update({ compatibility: "INCOMPATIVEL", rationale: "Mudei de ideia." })
      .eq("id", declarada!.id as string);

    const { data: depois } = await service
      .from("area_compatibility_declarations")
      .select("compatibility")
      .eq("id", declarada!.id as string)
      .single();

    expect(error, "o banco deve RECUSAR a reescrita do juízo declarado").not.toBeNull();
    expect(depois!.compatibility, "o juízo original sobrevive").toBe("COMPATIVEL");
  });

  it("a redeclaração oficial preserva o histórico intacto e vinculado, com trilha — e a leitura da Mesa vê só a vigente", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f2-red-oficial");
    const alvo = profissionais[0];
    const { data: original } = await service
      .from("area_compatibility_declarations")
      .insert({
        case_id: caseId,
        professional_profile_id: alvo,
        compatibility: "COMPATIVEL",
        rationale: null,
        declared_by: curador.userId,
      })
      .select("id")
      .single();
    const originalId = original!.id as string;

    const { data: nova, error } = await curador.client.rpc("redeclare_area_compatibility", {
      _case_id: caseId,
      _professional_profile_id: alvo,
      _compatibility: "INCOMPATIVEL",
      _reason: "Entrevista mostrou que a prática atual não cobre o que o Case exige.",
      _rationale: "Área declarada não responde ao requisito do Case.",
    });
    expect(error, `redeclaração oficial: ${error?.message}`).toBeNull();
    const novaId = (nova as { id: string }).id;

    // O histórico permanece, intacto e vinculado.
    const { data: superada } = await service
      .from("area_compatibility_declarations")
      .select("compatibility, declared_by, superseded_at, superseded_by_declaration")
      .eq("id", originalId)
      .single();
    expect(superada!.compatibility, "o juízo anterior sobrevive como histórico").toBe("COMPATIVEL");
    expect(superada!.declared_by, "a autoria anterior sobrevive").toBe(curador.userId);
    expect(superada!.superseded_at, "carimbo da redeclaração").not.toBeNull();
    expect(superada!.superseded_by_declaration, "vínculo com a sucessora").toBe(novaId);

    // Exatamente UMA vigente — e é a nova.
    const vigentes = await declaracaoVigente(caseId, alvo);
    expect(vigentes).toHaveLength(1);
    expect(vigentes[0]!.id).toBe(novaId);
    expect(vigentes[0]!.compatibility).toBe("INCOMPATIVEL");

    // A leitura da Mesa/cruzamento (repositório real) devolve SÓ a vigente.
    const lidas = await listAreaDeclarations(curador.client, caseId);
    const doPar = lidas.filter((d) => d.professionalProfileId === alvo);
    expect(doPar).toHaveLength(1);
    expect(doPar[0]!.compatibility).toBe("INCOMPATIVEL");

    // A trilha nomeia o ato, com motivo.
    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata")
      .eq("action", "area_redeclared")
      .contains("metadata", { new_declaration_id: novaId });
    expect(trilha ?? [], "audit_log area_redeclared do ato").toHaveLength(1);
    expect(trilha![0]!.actor_id).toBe(curador.userId);
    expect((trilha![0]!.metadata as { reason: string }).reason).toBe(
      "Entrevista mostrou que a prática atual não cobre o que o Case exige.",
    );
  });

  it("autorização é por RELAÇÃO (Etapa 11): papel sem atribuição, paciente, sem papel, anon e segunda vigente direta — todos recusados", async () => {
    const { caseId, paciente } = await casoComCurador(service, curador.userId, "f2-red-auth");
    const alvo = profissionais[1];
    await service.from("area_compatibility_declarations").insert({
      case_id: caseId,
      professional_profile_id: alvo,
      compatibility: "COMPATIVEL",
      declared_by: curador.userId,
    });

    const redeclarar = (sessao: Sessao | { client: ReturnType<typeof anonClient> }) =>
      sessao.client.rpc("redeclare_area_compatibility", {
        _case_id: caseId,
        _professional_profile_id: alvo,
        _compatibility: "INCOMPATIVEL",
        _reason: "Tentativa sem relação com o Case.",
        _rationale: "Justificativa qualquer.",
      });

    const semRelacao = await redeclarar(concierge);
    expect(semRelacao.error, "papel sem atribuição não redeclara").not.toBeNull();

    const daPaciente = await redeclarar(paciente);
    expect(daPaciente.error, "a paciente não redeclara área").not.toBeNull();

    const semPapel = await contaSemPapel("f2-red-sempapel");
    const doSemPapel = await redeclarar(semPapel);
    expect(doSemPapel.error, "conta sem papel não redeclara").not.toBeNull();

    const doAnon = await redeclarar({ client: anonClient() });
    expect(doAnon.error, "anon não redeclara").not.toBeNull();

    // PostgREST direto: segunda vigente do mesmo par morre na unicidade.
    const direta = await curador.client.from("area_compatibility_declarations").insert({
      case_id: caseId,
      professional_profile_id: alvo,
      compatibility: "INCOMPATIVEL",
      rationale: "Segunda vigente forjada.",
      declared_by: curador.userId,
    });
    expect(direta.error, "segunda vigente direta é recusada pelo índice parcial").not.toBeNull();

    const vigentes = await declaracaoVigente(caseId, alvo);
    expect(vigentes, "as recusas não mudam nada").toHaveLength(1);
    expect(vigentes[0]!.compatibility).toBe("COMPATIVEL");
  });

  it("duas redeclarações em PARALELO terminam com exatamente 1 vigente e histórico encadeado", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f2-red-par");
    const alvo = profissionais[2];
    await service.from("area_compatibility_declarations").insert({
      case_id: caseId,
      professional_profile_id: alvo,
      compatibility: "COMPATIVEL",
      declared_by: curador.userId,
    });

    const resultados = await Promise.allSettled([
      curador.client.rpc("redeclare_area_compatibility", {
        _case_id: caseId,
        _professional_profile_id: alvo,
        _compatibility: "INCOMPATIVEL",
        _reason: "Rodada paralela — clique um.",
        _rationale: "Não cobre o requisito.",
      }),
      curador.client.rpc("redeclare_area_compatibility", {
        _case_id: caseId,
        _professional_profile_id: alvo,
        _compatibility: "PARCIALMENTE_COMPATIVEL",
        _reason: "Rodada paralela — clique dois.",
        _rationale: "Cobre parte do requisito.",
      }),
    ]);
    const resumo = resultados
      .map((r) =>
        r.status === "fulfilled" ? (r.value.error?.message ?? "ok") : `rejeitada: ${String(r.reason)}`,
      )
      .join(" | ");

    const vigentes = await declaracaoVigente(caseId, alvo);
    expect(vigentes, `paralelo => exatamente 1 vigente (${resumo})`).toHaveLength(1);

    const { data: todas } = await service
      .from("area_compatibility_declarations")
      .select("id, superseded_at, superseded_by_declaration")
      .eq("case_id", caseId)
      .eq("professional_profile_id", alvo);
    const superadas = (todas ?? []).filter((linha) => linha.superseded_at !== null);
    expect(superadas.length, "todo o resto virou histórico").toBe((todas ?? []).length - 1);
    for (const linha of superadas) {
      expect(linha.superseded_by_declaration, "todo histórico aponta a sucessora").not.toBeNull();
    }
  });

  it("o que NÃO é juízo continua vivo em lugar: INFORMACAO_INSUFICIENTE completa e PARCIAL confirma — mas justificativa de juízo não se troca", async () => {
    const { caseId } = await casoComCurador(service, curador.userId, "f2-red-completa");

    // INFORMACAO_INSUFICIENTE -> juízo, pela via normal (nunca foi julgado).
    const { data: pendente } = await service
      .from("area_compatibility_declarations")
      .insert({
        case_id: caseId,
        professional_profile_id: profissionais[0],
        compatibility: "INFORMACAO_INSUFICIENTE",
        rationale: "Falta confirmar a área no site institucional.",
        declared_by: curador.userId,
      })
      .select("id")
      .single();
    const completar = await curador.client
      .from("area_compatibility_declarations")
      .update({ compatibility: "COMPATIVEL", rationale: null })
      .eq("id", pendente!.id as string);
    expect(completar.error, `completar pendência é a via normal: ${completar.error?.message}`).toBeNull();

    // PARCIALMENTE_COMPATIVEL: o flip de confirmação previsto no DDL passa...
    const { data: parcial } = await service
      .from("area_compatibility_declarations")
      .insert({
        case_id: caseId,
        professional_profile_id: profissionais[1],
        compatibility: "PARCIALMENTE_COMPATIVEL",
        rationale: "Cobre o requisito em parte.",
        confirmed_by_curator: false,
        declared_by: curador.userId,
      })
      .select("id")
      .single();
    const confirmar = await curador.client
      .from("area_compatibility_declarations")
      .update({ confirmed_by_curator: true })
      .eq("id", parcial!.id as string);
    expect(confirmar.error, `confirmar o PARCIAL completa a decisão: ${confirmar.error?.message}`).toBeNull();

    // ...mas reescrever a justificativa do juízo não.
    const trocarJustificativa = await curador.client
      .from("area_compatibility_declarations")
      .update({ rationale: "Justificativa reescrita." })
      .eq("id", parcial!.id as string);
    expect(trocarJustificativa.error, "justificativa de juízo declarado não se troca em lugar").not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TRILHAS (Etapa 10) — conteúdo das trilhas, nunca conteúdo sensível
// ---------------------------------------------------------------------------

describe("GATE-F2-TRI [Bloco C/Frente 2] as trilhas carregam o ato — nunca segredo, nunca conteúdo", () => {
  it("a trilha do reset de senha NUNCA contém a senha — e log_admin_action recusa paciente, anon, ação fora da allowlist e metadata com segredo", async () => {
    const paciente = await novaPaciente(service, "f2-tri-reset");
    const senha = await resetPatientPassword(service, paciente.userId);

    const { data: trilha } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "password_reset")
      .eq("target_profile_id", paciente.userId);
    expect(trilha ?? [], "o ato deixa exatamente uma linha").toHaveLength(1);
    expect(
      JSON.stringify(trilha![0]!.metadata),
      "a metadata carrega identificadores, nunca a senha",
    ).not.toContain(senha);

    // A RPC não é fábrica de trilha: paciente e anon são recusados...
    const daPaciente = await paciente.client.rpc("log_admin_action", {
      _action: "password_reset",
      _target_profile_id: paciente.userId,
      _metadata: {},
    });
    expect(daPaciente.error, "paciente não registra ato administrativo").not.toBeNull();

    const doAnon = await anonClient().rpc("log_admin_action", {
      _action: "password_reset",
      _target_profile_id: paciente.userId,
      _metadata: {},
    });
    expect(doAnon.error, "anon não registra ato administrativo").not.toBeNull();

    // ...ação fora da allowlist morre mesmo para o administrador...
    const foraDaLista = await admin.client.rpc("log_admin_action", {
      _action: "curadoria_delivered",
      _target_profile_id: paciente.userId,
      _metadata: {},
    });
    expect(foraDaLista.error, "log_admin_action não registra qualquer ação").not.toBeNull();

    // ...e metadata com chave de segredo é recusada na porta.
    const comSegredo = await admin.client.rpc("log_admin_action", {
      _action: "password_reset",
      _target_profile_id: paciente.userId,
      _metadata: { password: "vazou" },
    });
    expect(comSegredo.error, "a trilha nunca aceita segredo na metadata").not.toBeNull();
  });

  it("a trilha da despublicação carrega autor, old->new e o perfil — a da emissão do Relatório existe por qualquer via", async () => {
    // Despublicação com sessão real de administrador (o C9b prova o rastro;
    // aqui se prova o CONTEÚDO do rastro).
    const alvo = profissionalPublicado;
    const { error: republicacao } = await service
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", alvo);
    expect(republicacao, `pré-condição (publicar): ${republicacao?.message}`).toBeNull();

    const { error } = await admin.client
      .from("professional_profiles")
      .update({
        publication_status: "nao_publicado",
        updated_by: admin.userId,
        publication_change_reason: "Pausa combinada com o profissional.",
      })
      .eq("id", alvo);
    expect(error, `a despublicação em si: ${error?.message}`).toBeNull();

    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata, created_at")
      .eq("action", "professional_unpublished")
      .contains("metadata", { professional_profile_id: alvo })
      .order("created_at", { ascending: false })
      .limit(1);
    expect(trilha ?? []).toHaveLength(1);
    expect(trilha![0]!.actor_id, "o autor é o administrador da sessão").toBe(admin.userId);
    const metadata = trilha![0]!.metadata as {
      old_status: string;
      new_status: string;
      reason: string | null;
    };
    expect(metadata.old_status).toBe("publicado");
    expect(metadata.new_status).toBe("nao_publicado");
    expect(metadata.reason, "o motivo declarado viaja na trilha").toBe(
      "Pausa combinada com o profissional.",
    );

    // Emissão do Relatório: a trilha nasce na transição, por qualquer via
    // (aqui, a via de fixture — service direto).
    const { reportId } = await cadeiaEntregue("f2-tri-emissao");
    const { data: emissao } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "report_emitted")
      .contains("metadata", { report_id: reportId });
    expect(emissao ?? [], "a emissão deixa exatamente uma linha").toHaveLength(1);
  });

  it("o tombstone do documento apagado tem ids e hash do caminho — nunca o caminho cru nem conteúdo", async () => {
    const paciente = await novaPaciente(service, "f2-tri-doc");
    const caminho = `${paciente.userId}/${randomUUID()}.pdf`;
    const { data: doc } = await paciente.client
      .from("patient_documents")
      .insert({
        profile_id: paciente.userId,
        uploaded_by: paciente.userId,
        file_path: caminho,
        file_name: "exame-sintetico.pdf",
        content_type: "application/pdf",
        file_size: 1234,
      })
      .select("id")
      .single();

    const { error } = await admin.client
      .from("patient_documents")
      .delete()
      .eq("id", doc!.id as string);
    expect(error, `o delete em si: ${error?.message}`).toBeNull();

    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata")
      .eq("action", "patient_document_deleted")
      .contains("metadata", { document_id: doc!.id });
    expect(trilha ?? []).toHaveLength(1);
    expect(trilha![0]!.actor_id, "o autor do delete é o administrador").toBe(admin.userId);

    const metadata = trilha![0]!.metadata as Record<string, unknown>;
    expect(metadata.uploaded_by, "o tombstone nomeia quem subiu").toBe(paciente.userId);
    expect(metadata.file_name).toBe("exame-sintetico.pdf");
    expect(metadata.file_path_hash, "o caminho viaja como hash").toBeTruthy();
    expect(
      JSON.stringify(metadata),
      "o caminho cru do storage não viaja na trilha",
    ).not.toContain(caminho);
  });
});

// ---------------------------------------------------------------------------
// COMPETÊNCIAS (Etapa 8)
// ---------------------------------------------------------------------------

describe("GATE-F2-COMP [Bloco C/Frente 2] esvaziamento de competências é ato explícito", () => {
  it("DELETE em massa via PostgREST em perfil PUBLICADO é recusado; a RPC com motivo remove com trilha; sem motivo/sem papel são recusados", async () => {
    const alvo = profissionalPublicado;

    // Auto-suficiência com resíduo local: garante o perfil publicado e ao
    // menos uma competência (o mesmo formato que a fixture de certificação usa).
    await service
      .from("professional_profiles")
      .update({ publication_status: "publicado" })
      .eq("id", alvo);
    await service.from("professional_competency_areas").upsert(
      { professional_profile_id: alvo, domain: "saude_fisica", focus: "acompanhamento_continuo" },
      { onConflict: "professional_profile_id,domain,focus", ignoreDuplicates: true },
    );

    // ATAQUE: o mesmo desastre dos 158-a-zero, pela porta do PostgREST, com
    // sessão real de administrador.
    const emMassa = await admin.client
      .from("professional_competency_areas")
      .delete()
      .eq("professional_profile_id", alvo);
    expect(emMassa.error, "esvaziar perfil publicado por DELETE direto é recusado").not.toBeNull();

    const { count: sobreviventes } = await service
      .from("professional_competency_areas")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", alvo);
    expect(sobreviventes, "nada foi removido pela recusa").toBeGreaterThan(0);

    // Recusas do caminho oficial: sem motivo; papel errado; anon.
    const semMotivo = await admin.client.rpc("remove_professional_competencies", {
      _professional_profile_id: alvo,
      _reason: "   ",
    });
    expect(semMotivo.error, "remoção sem motivo não existe").not.toBeNull();

    const doCurador = await curador.client.rpc("remove_professional_competencies", {
      _professional_profile_id: alvo,
      _reason: "Papel errado.",
    });
    expect(doCurador.error, "curador não esvazia competências").not.toBeNull();

    const doAnon = await anonClient().rpc("remove_professional_competencies", {
      _professional_profile_id: alvo,
      _reason: "Anon.",
    });
    expect(doAnon.error, "anon não esvazia competências").not.toBeNull();

    // O ato oficial: administrador, com motivo — remove e deixa trilha com a lista.
    const oficial = await admin.client.rpc("remove_professional_competencies", {
      _professional_profile_id: alvo,
      _reason: "Descadastro combinado com o profissional.",
    });
    expect(oficial.error, `remoção oficial: ${oficial.error?.message}`).toBeNull();
    expect(oficial.data as number, "devolve quantas linhas saíram").toBeGreaterThan(0);

    const { count: depois } = await service
      .from("professional_competency_areas")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", alvo);
    expect(depois, "o conjunto foi removido pelo ato").toBe(0);

    const { data: trilha } = await service
      .from("audit_logs")
      .select("actor_id, metadata, created_at")
      .eq("action", "competencies_removed_explicit")
      .contains("metadata", { professional_profile_id: alvo })
      .order("created_at", { ascending: false })
      .limit(1);
    expect(trilha ?? []).toHaveLength(1);
    expect(trilha![0]!.actor_id, "o autor do esvaziamento é nomeado").toBe(admin.userId);
    const metadata = trilha![0]!.metadata as { reason: string; removed: string[] };
    expect(metadata.reason).toBe("Descadastro combinado com o profissional.");
    expect(metadata.removed, "a trilha lista o que saiu").toContain(
      "saude_fisica/acompanhamento_continuo",
    );

    // Repetir sobre perfil já vazio é no-op documentado: devolve 0, sem
    // segunda trilha do MESMO instante em diante.
    const repeticao = await admin.client.rpc("remove_professional_competencies", {
      _professional_profile_id: alvo,
      _reason: "Repetição do mesmo ato.",
    });
    expect(repeticao.error).toBeNull();
    expect(repeticao.data as number, "perfil vazio => no-op").toBe(0);

    // Devolve a fixture como estava (competência recolocada pelo bastidor).
    await service.from("professional_competency_areas").insert({
      professional_profile_id: alvo,
      domain: "saude_fisica",
      focus: "acompanhamento_continuo",
    });
  });
});
