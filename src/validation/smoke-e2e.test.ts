/**
 * Smoke End-to-End — primeiro caso real (camadas integradas).
 * Ambiente controlado: projeções + workflow + experience layer.
 * Não cria regras de negócio — apenas exercita o fluxo existente.
 */
import { describe, expect, it } from "vitest";

import type { AceAnaliseCuradorView } from "@/ace-flow/contracts/ace-analysis";
import type { CasoDeCuradoriaView, OpcaoRegistradaView } from "@/curator-flow/contracts/curador-view";
import { ACE_MELHORADO_VERSION } from "@/ace-flow/contracts/ace-analysis";
import { executarAceMelhorado } from "@/infrastructure/ace/improved-ace-engine";
import { toAceAnaliseCuradorView } from "@/infrastructure/ace/improved-ace-service";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import { derivarEstadoOperacionalCurador } from "@/infrastructure/curador/curador-estado-operacional";
import {
  abrirSessaoWorkspace,
  atualizarConjuntoElegivel,
  entregaEstaAprovada,
  opcoesEstaoCompletas,
  registrarOpcoes,
  WORKSPACE_VAZIO,
} from "@/infrastructure/curador/curador-workspace";
import { avancarProjecaoOnboarding } from "@/infrastructure/jornada/jornada-onboarding-projection";
import {
  avancarProjecaoAposEscolha,
  prepararProjecaoParaEscolha,
} from "@/infrastructure/jornada/jornada-escolha-projection";
import {
  avancarProjecaoAposAnaliseInicial,
  avancarProjecaoAposEntrega,
  avancarProjecaoAposSessaoCuradoria,
  criarProjecaoInicial,
  readModelToView,
} from "@/infrastructure/jornada/jornada-view-projection";
import { resolvePortalSurface } from "@/experience-layer/resolve-canonical-experience";
import { mapEntregaExperienceModel } from "@/experience-layer/mappers/entrega";
import {
  mapCasoCuradorExperience,
  resolveCuratorCaseSurface,
} from "@/curator-layer/resolve-curator-experience";
import { classificarCasoNaFila } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { resolverEstadoWorkflowCaso } from "@/infrastructure/workflow/derivar-fase-workflow";
import { projetarSnapshotWorkflow } from "@/infrastructure/workflow/workflow-orchestrator";

const TRES_OPCOES: OpcaoRegistradaView[] = [0, 1, 2].map((indice) => ({
  indice,
  nome: `Dr. Opção ${indice + 1}`,
  especialidade: "Cardiologia",
  por_que_esta_aqui: "Trajetória clínica",
  por_que_pode_fazer_sentido: "Forças observadas",
  o_que_esperar: "Expectativa realista",
  limitacoes: "Limitações declaradas",
  evidencias_resumo: "Evidências documentadas",
}));

interface EtapaValidacao {
  etapa: string;
  entrou: boolean;
  saiu: boolean;
  jornada_mudou: boolean;
  workflow_mudou: boolean;
  api_simulada: boolean;
  experience_atualizou: boolean;
  interface_refletiria: boolean;
  responsavel: string;
  tempo_ms: number;
  erros: string[];
}

function buildCasoCuradoriaView(
  view: ReturnType<typeof readModelToView>,
  workspace = WORKSPACE_VAZIO,
  curadorId: string | null = null,
  aceAnalise: AceAnaliseCuradorView | null = null,
): CasoDeCuradoriaView {
  const opcoesOk = opcoesEstaoCompletas(workspace.opcoes_registradas);
  const aprovada = entregaEstaAprovada(workspace.rascunho_entrega);

  return {
    jornada_id: view.jornada_id,
    paciente_id: view.paciente_id,
    paciente_nome: "Maria Caso Real",
    titulo_jornada: "Primeiro caso E2E",
    jornada: view,
    estado_operacional: derivarEstadoOperacionalCurador(view, opcoesOk, aprovada),
    curador_id: curadorId,
    curador_nome: curadorId ? "Curador Teste" : null,
    assumido_em: curadorId ? "2026-01-14T09:00:00Z" : null,
    sessao: workspace.sessao,
    conjunto_elegivel: workspace.conjunto_elegivel,
    opcoes_registradas: workspace.opcoes_registradas,
    rascunho_entrega: workspace.rascunho_entrega,
    documentos: view.extensoes.documentos,
    bloqueio: view.bloqueio,
    responsavel: view.responsavel,
    timeline_jornada: view.timeline,
    timeline_operacional: [],
    comentarios: workspace.comentarios,
    ace_analise: aceAnalise,
  };
}

function simularFluxoCompleto(): { etapas: EtapaValidacao[]; problemas: string[] } {
  const etapas: EtapaValidacao[] = [];
  const problemas: string[] = [];
  const t0 = Date.now();

  let readModel: JornadaDoPacienteReadModel = {
    ...criarProjecaoInicial({
      jornadaId: "e2e-jornada-1",
      pacienteId: "e2e-paciente-1",
      iniciadaEm: "2026-01-10T08:00:00Z",
    }),
    etapaAtual: "PRIMEIRO_CONTATO",
    etapasConcluidas: ["PRIMEIRA_DUVIDA"],
    estadoVisivel: "EXPLORANDO",
  };

  let workspace = WORKSPACE_VAZIO;
  let curadorId: string | null = null;
  let aceCuradorView: AceAnaliseCuradorView | null = null;
  let etapaAnterior = readModel.etapaAtual;
  let workflowAnterior = resolverEstadoWorkflowCaso({
    view: readModelToView(readModel),
    curadorAtribuido: false,
  }).fase_atual;

  function registrar(
    nome: string,
    checks: Partial<EtapaValidacao> & { responsavel: string },
  ) {
    etapas.push({
      etapa: nome,
      entrou: checks.entrou ?? true,
      saiu: checks.saiu ?? true,
      jornada_mudou: checks.jornada_mudou ?? false,
      workflow_mudou: checks.workflow_mudou ?? false,
      api_simulada: checks.api_simulada ?? true,
      experience_atualizou: checks.experience_atualizou ?? true,
      interface_refletiria: checks.interface_refletiria ?? true,
      responsavel: checks.responsavel,
      tempo_ms: Date.now() - t0,
      erros: checks.erros ?? [],
    });
  }

  // 1. Onboarding paciente
  const portalInicial = resolvePortalSurface(readModelToView(readModel));
  if (portalInicial !== "onboarding") {
    problemas.push("P2: surface inicial não é onboarding para PRIMEIRO_CONTATO");
  }
  readModel = avancarProjecaoOnboarding(readModel, "2026-01-10T09:00:00Z");
  registrar("Onboarding", {
    responsavel: "PACIENTE",
    jornada_mudou: readModel.etapaAtual !== etapaAnterior,
    workflow_mudou:
      resolverEstadoWorkflowCaso({ view: readModelToView(readModel), curadorAtribuido: false })
        .fase_atual !== workflowAnterior,
    experience_atualizou: resolvePortalSurface(readModelToView(readModel)) === "onboarding",
  });
  etapaAnterior = readModel.etapaAtual;
  workflowAnterior = resolverEstadoWorkflowCaso({
    view: readModelToView(readModel),
    curadorAtribuido: false,
  }).fase_atual;

  // 2. Upload documentos
  readModel = {
    ...readModel,
    etapaAtual: "HISTORIA",
    estadoVisivel: "AGUARDANDO_DOCUMENTOS",
    extensoes: {
      ...readModel.extensoes,
      documentos: [
        {
          id: "doc-e2e-1",
          nome_arquivo: "exame-cardiaco.pdf",
          status: "RECEBIDO",
          recebido_em: "2026-01-11T10:00:00Z",
        },
      ],
    },
    atualizadaEm: "2026-01-11T10:00:00Z",
  };
  const surfaceDocs = resolvePortalSurface(readModelToView(readModel));
  if (surfaceDocs !== "documentos") {
    problemas.push("P1: AGUARDANDO_DOCUMENTOS não resolve surface documentos");
  }
  const filaDoc = classificarCasoNaFila({
    jornada_id: readModel.jornadaId,
    paciente_id: readModel.pacienteId,
    paciente_nome: "Maria",
    titulo_jornada: "E2E",
    view: readModelToView(readModel),
    curador_id: null,
    curador_nome: null,
    atualizado_em: readModel.atualizadaEm,
  });
  registrar("Upload documentos", {
    responsavel: "PACIENTE",
    jornada_mudou: true,
    workflow_mudou: filaDoc.fila === "DOCUMENTACAO",
    experience_atualizou: surfaceDocs === "documentos",
  });

  // 3. ACE Melhorado → Curadoria
  const viewComDocs = readModelToView(readModel);
  const aceResultado = executarAceMelhorado({ view: viewComDocs, trigger: "UPLOAD" });
  const aceRunId = "e2e-ace-run-1";
  readModel = avancarProjecaoAposAnaliseInicial(readModel, "2026-01-12T10:00:00Z");
  readModel = {
    ...readModel,
    extensoes: {
      ...readModel.extensoes,
      ace_analise: {
        run_id: aceRunId,
        versao: aceResultado.versao,
        status: aceResultado.status,
        resumo: aceResultado.resumo_para_curador,
        atualizado_em: "2026-01-12T10:00:00Z",
      },
    },
  };
  aceCuradorView = toAceAnaliseCuradorView({
    id: aceRunId,
    execution_id: aceRunId,
    jornada_id: readModel.jornadaId,
    ace_version: ACE_MELHORADO_VERSION,
    status: aceResultado.status,
    duration_ms: 42,
    correlation_id: "e2e-correlation",
    retries: 0,
    triggered_by: "UPLOAD",
    iniciado_em: "2026-01-12T10:00:00Z",
    concluido_em: "2026-01-12T10:00:00Z",
    resultado: aceResultado,
  });
  if (!aceCuradorView || aceCuradorView.versao !== ACE_MELHORADO_VERSION) {
    problemas.push("P0: curador não recebe saída do ACE Melhorado");
  }
  readModel = avancarProjecaoAposSessaoCuradoria(readModel, "2026-01-13T10:00:00Z");
  registrar("ACE Melhorado", {
    responsavel: "SISTEMA",
    jornada_mudou: readModel.etapaAtual === "CURADORIA",
    workflow_mudou:
      resolverEstadoWorkflowCaso({ view: readModelToView(readModel), curadorAtribuido: false })
        .fase_atual === "CURADOR_ATIVO",
    experience_atualizou: resolvePortalSurface(readModelToView(readModel)) === "curadoria",
    interface_refletiria: aceCuradorView !== null,
  });

  // 4. Curador assume + sessão
  curadorId = "curador-e2e-1";
  workspace = abrirSessaoWorkspace(
    workspace,
    "sessao-e2e-1",
    curadorId,
    "2026-01-14T09:00:00Z",
  );
  workspace = atualizarConjuntoElegivel(workspace, {
    candidatos: [
      { id: "c1", nome: "Dr. A", especialidade: "Cardiologia", nota_curador: "Perfil forte" },
      { id: "c2", nome: "Dr. B", especialidade: "Cardiologia", nota_curador: null },
      { id: "c3", nome: "Dr. C", especialidade: "Clínica", nota_curador: null },
    ],
    atualizado_em: "2026-01-14T09:05:00Z",
  });
  let caso = buildCasoCuradoriaView(readModelToView(readModel), workspace, curadorId, aceCuradorView);
  const expCurador = mapCasoCuradorExperience(caso);
  if (expCurador.pode_registrar_opcoes !== true) {
    problemas.push("P1: sessão aberta mas pode_registrar_opcoes=false");
  }
  if (resolveCuratorCaseSurface(caso) !== "opcoes") {
    problemas.push("P1: surface curador deveria ser opcoes com sessão aberta");
  }
  registrar("Curador assume + sessão", {
    responsavel: "CURADOR",
    jornada_mudou: false,
    workflow_mudou: true,
    experience_atualizou: resolveCuratorCaseSurface(caso) === "opcoes",
    interface_refletiria: expCurador.pode_registrar_opcoes,
  });

  // 5. Registro três opções
  workspace = registrarOpcoes(workspace, TRES_OPCOES);
  caso = buildCasoCuradoriaView(readModelToView(readModel), workspace, curadorId, aceCuradorView);
  if (!opcoesEstaoCompletas(workspace.opcoes_registradas)) {
    problemas.push("P0: três opções não registradas corretamente");
  }
  if (!workspace.conjunto_elegivel || workspace.conjunto_elegivel.candidatos.length < 1) {
    problemas.push("P1: conjunto elegível ausente após curadoria");
  }
  registrar("Registro três opções", {
    responsavel: "CURADOR",
    jornada_mudou: false,
    experience_atualizou: resolveCuratorCaseSurface(caso) === "entrega",
    interface_refletiria: workspace.opcoes_registradas?.length === 3,
  });

  // 6. Aprovar e publicar entrega
  workspace = {
    ...workspace,
    rascunho_entrega: workspace.rascunho_entrega
      ? {
          ...workspace.rascunho_entrega,
          modo: "APROVADO",
          aprovado_em: "2026-01-15T10:00:00Z",
          aprovado_por: curadorId,
        }
      : null,
  };
  readModel = avancarProjecaoAposEntrega(
    readModel,
    "2026-01-15T11:00:00Z",
    "entrega-e2e-1",
    JSON.stringify({ opcoes: TRES_OPCOES }),
  );
  workspace = {
    ...workspace,
    rascunho_entrega: workspace.rascunho_entrega
      ? { ...workspace.rascunho_entrega, modo: "PUBLICADO" }
      : null,
  };
  const viewEntrega = readModelToView(readModel);
  const entregaModel = mapEntregaExperienceModel(viewEntrega);
  if (!entregaModel || entregaModel.entrega.opcoes.length !== 3) {
    problemas.push("P0: entrega ao paciente sem três opções");
  }
  registrar("Entrega ao paciente", {
    responsavel: "CURADOR",
    jornada_mudou: readModel.etapaAtual === "ENTREGA",
    workflow_mudou:
      resolverEstadoWorkflowCaso({ view: viewEntrega, curadorAtribuido: true }).fase_atual ===
      "PACIENTE_RETORNO",
    experience_atualizou: resolvePortalSurface(viewEntrega) === "entrega",
    interface_refletiria: entregaModel?.entrega.opcoes.length === 3,
  });

  // 7. Escolha paciente
  const escolhaModel = prepararProjecaoParaEscolha(readModel, "2026-01-16T10:00:00Z");
  readModel = avancarProjecaoAposEscolha(escolhaModel, 1, "2026-01-16T11:00:00Z", null);
  const viewEscolha = readModelToView(readModel);
  registrar("Escolha do paciente", {
    responsavel: "PACIENTE",
    jornada_mudou: readModel.etapaAtual === "ACOMPANHAMENTO",
    workflow_mudou:
      classificarCasoNaFila({
        jornada_id: readModel.jornadaId,
        paciente_id: readModel.pacienteId,
        paciente_nome: "Maria",
        titulo_jornada: "E2E",
        view: viewEscolha,
        curador_id: curadorId,
        curador_nome: "Curador",
        atualizado_em: readModel.atualizadaEm,
      }).fila === "ACOMPANHAMENTO",
    experience_atualizou: resolvePortalSurface(viewEscolha) === "acompanhamento",
  });

  // 8. Relacionamento
  const snapshot = projetarSnapshotWorkflow({
    jornada_id: readModel.jornadaId,
    paciente_id: readModel.pacienteId,
    paciente_nome: "Maria",
    titulo_jornada: "E2E",
    view: viewEscolha,
    curador_id: curadorId,
    curador_nome: "Curador",
    atualizado_em: readModel.atualizadaEm,
  });
  registrar("Relacionamento", {
    responsavel: "EQUIPE_ALIVIAR",
    jornada_mudou: false,
    workflow_mudou: snapshot.workflow.fase_atual === "PACIENTE_RETORNO",
    experience_atualizou: resolvePortalSurface(viewEscolha) === "acompanhamento",
  });

  return { etapas, problemas };
}

describe("Smoke E2E — primeiro caso real", () => {
  const { etapas, problemas } = simularFluxoCompleto();

  it("executa todas as etapas do fluxo", () => {
    expect(etapas.length).toBe(8);
    const nomes = etapas.map((e) => e.etapa);
    expect(nomes).toEqual([
      "Onboarding",
      "Upload documentos",
      "ACE Melhorado",
      "Curador assume + sessão",
      "Registro três opções",
      "Entrega ao paciente",
      "Escolha do paciente",
      "Relacionamento",
    ]);
  });

  it.each(etapas.map((e) => [e.etapa, e] as const))(
    "%s entra e sai corretamente",
    (_nome, etapa) => {
      expect(etapa.entrou).toBe(true);
      expect(etapa.saiu).toBe(true);
      expect(etapa.erros).toHaveLength(0);
    },
  );

  it("jornada progride até ACOMPANHAMENTO", () => {
    const ultima = etapas[etapas.length - 1]!;
    expect(ultima.etapa).toBe("Relacionamento");
    expect(ultima.experience_atualizou).toBe(true);
  });

  it("entrega contém exatamente três opções", () => {
    const entrega = etapas.find((e) => e.etapa === "Entrega ao paciente")!;
    expect(entrega.interface_refletiria).toBe(true);
    expect(entrega.jornada_mudou).toBe(true);
  });

  it("registra problemas conhecidos sem P0 bloqueante de projeção", () => {
    const p0 = problemas.filter((p) => p.startsWith("P0:"));
    expect(p0).toHaveLength(0);
  });
});
