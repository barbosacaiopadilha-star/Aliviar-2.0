import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  chaveDeDuplicidade,
  validarCandidato,
  type CandidatoDeFormacao,
  type Descarte,
} from "@/modules/profiles/formacao-academica-extracao-validacao";
import {
  isFormacaoKind,
  type FormacaoKind,
} from "@/modules/profiles/formacao-academica";

/**
 * EXTRAÇÃO ASSISTIDA DO CURRÍCULO — o caminho sem redigitação.
 *
 * O desenho é um funil com uma só saída possível: candidato em
 * `nao_verificado`. Este módulo é ESTRUTURALMENTE incapaz de confirmar — não
 * existe linha aqui que escreva `verificado`, e o teste de integração
 * falseia isso. A confirmação é sempre um ato humano individual, em outra
 * porta (`formacao-academica-repository.confirmarFormacao`).
 *
 * Segurança de conteúdo: o texto extraído vive só na memória desta execução.
 * O que persiste é o hash do texto (dedup de reprocessamento), contagens e o
 * erro em CLASSE (`extracao_vazia`, `pdf_ilegivel`…) — nunca uma linha do
 * currículo, nem em log, nem em coluna.
 */

export const EXTRATOR_B1 = "b1-deterministico@1";

/** Menos que isto por página = currículo visual — pedimos PDF textual/DOCX. */
export const LIMIAR_CHARS_POR_PAGINA = 100;

/**
 * F-3 · LIMITES DE RECURSO, EM UM LUGAR SÓ.
 *
 * Por que cada número é este, e não um palpite redondo:
 *
 * - `MAX_BYTES` = 20 MiB, exatamente o teto do bucket `professional-documents`
 *   (`file_size_limit = 20971520`, migration do bucket). Acima disso o arquivo
 *   não existe legitimamente; recusar antes de ler é recusar o impossível.
 * - `MAX_PAGINAS` = 60. Um currículo médico real cabe com folga; 60 páginas de
 *   PDF textual já são ~10× o maior caso plausível.
 * - `MAX_CHARS_TEXTO` = 400 000. Teto de memória do texto em trânsito: 60
 *   páginas densas somam ~200 mil caracteres, e o dobro disso é margem.
 * - `PRAZO_MS` = 9 000. Fica ABAIXO do menor teto de duração de função Node da
 *   Vercel (10 s no padrão mais restritivo), para que a recusa seja NOSSA, com
 *   erro nomeado e run registrado, em vez de um 504 mudo da plataforma.
 *
 * Honestidade sobre a página e o texto: só se conhecem DEPOIS de abrir o PDF.
 * Por isso são conferidos imediatamente após a leitura, antes de qualquer
 * candidato — e a recusa vale para os dois casos.
 */
export const LIMITES = {
  MAX_BYTES: 20 * 1024 * 1024,
  MAX_PAGINAS: 60,
  MAX_CHARS_TEXTO: 400_000,
  PRAZO_MS: 9_000,
} as const;

/** Erros de recurso — classe, nunca conteúdo. */
export const ERRO_ARQUIVO_GRANDE = "arquivo_excede_limite";
export const ERRO_PAGINAS = "paginas_excedem_limite";
export const ERRO_TEXTO_GRANDE = "texto_excede_limite";
export const ERRO_PRAZO = "prazo_excedido";
export const ERRO_DOCUMENTO_DE_OUTRO = "documento_de_outro_profissional";

// ---------------------------------------------------------------------------
// Leitura do PDF — unpdf (PDF.js puro, empacotável no runtime Node da Vercel)
// com CANCELAMENTO REAL por prazo (F-3, correção da auditoria)
// ---------------------------------------------------------------------------

/**
 * O contrato mínimo da tarefa de carregamento do PDF.js que o cancelamento
 * usa. `destroyed` é a evidência falseável: neutralizar o destroy deixa a
 * flag em `false`, e a suíte derruba.
 */
export type TarefaDePdf = {
  promise: Promise<DocumentoDePdf>;
  destroy: () => Promise<void>;
  destroyed?: boolean;
};

/** O item de texto como o PDF.js o entrega — só o que a montagem usa. */
export type ItemDeTexto = { str?: string | null; hasEOL?: boolean };

type DocumentoDePdf = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getTextContent: () => Promise<{ items: ItemDeTexto[] }>;
  }>;
};

/**
 * R-1 · Monta o texto de UMA página com a MESMA semântica do `extractText`
 * do unpdf@1.8.1 instalado (`getPageText`, node_modules/unpdf/dist/index.mjs):
 * item sem `str` é ignorado; `hasEOL` vira quebra de linha; e o join é VAZIO —
 * o espaçamento pertence ao próprio `str`. O `join(" ")` anterior injetava
 * espaço entre TODOS os itens e apagava as quebras: título, instituição e
 * período de linhas vizinhas se contaminavam.
 *
 * Fallback por coordenada Y: NÃO implementado, por decisão medida — a sonda
 * da missão verificou `hasEOL` presente como boolean em TODOS os itens deste
 * build (PDF.js 6.1.200). Fallback sem caso real seria caminho morto sem
 * prova; se um build futuro deixar `hasEOL` indisponível, o oráculo de
 * linhas desta suíte acusa antes de qualquer contaminação chegar à equipe.
 */
export function montarTextoDaPagina(itens: ReadonlyArray<ItemDeTexto>): string {
  return itens
    .filter((item) => item.str != null)
    .map((item) => item.str + (item.hasEOL ? "\n" : ""))
    .join("");
}

/**
 * R-1 · Junta as páginas com a MESMA normalização do `normalizeMergedText`
 * do unpdf@1.8.1: quebra entre páginas, espaço colapsado SEM destruir linha,
 * e no máximo uma linha em branco consecutiva.
 */
export function normalizarTextoDasPaginas(
  paginas: ReadonlyArray<string>,
): string {
  return paginas
    .join("\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

export type OpcoesDeExtracao = {
  prazoMs?: number;
  /** Gancho de TESTE: recebe a tarefa para inspecionar `destroyed`. */
  observarTarefa?: (tarefa: TarefaDePdf) => void;
  /** Gancho de TESTE: substitui o `getDocument` real do build serverless. */
  obterGetDocument?: () => Promise<
    (params: Record<string, unknown>) => TarefaDePdf
  >;
};

async function getDocumentDoBuildServerless(): Promise<
  (params: Record<string, unknown>) => TarefaDePdf
> {
  const { getResolvedPDFJS } = await import("unpdf");
  const pdfjs = await getResolvedPDFJS();
  return pdfjs.getDocument as unknown as (
    params: Record<string, unknown>,
  ) => TarefaDePdf;
}

/**
 * Extrai o texto página a página SOB CANCELAMENTO REAL.
 *
 * O que a medição empírica deste build ensinou, e o desenho obedece:
 *
 * 1. O parse roda numa cascata de microtasks que MONOPOLIZA o event loop — um
 *    vigia de `setTimeout` sozinho nunca dispara antes do fim (medido:
 *    destroy@100ms chegava com as 4000 páginas prontas). Por isso o laço CEDE
 *    a vez (`setImmediate`) a cada página: o yield é parte do cancelamento,
 *    não cosmética.
 * 2. Com o yield, `loadingTask.destroy()` interrompe DE VERDADE: 0 páginas
 *    avançam após o corte, e o fluxo fecha em ~100 ms contra 9 s de baseline
 *    (sondas registradas na evidência da missão).
 * 3. Granularidade residual DECLARADA: dentro de UMA página o build não cede o
 *    loop, então uma página patológica corre inteira antes do corte (~2 s num
 *    stream de 8,9 MiB; o teto de 20 MiB do bucket limita o pior caso). Não é
 *    espera infinita: é o átomo do cancelamento neste runtime.
 * 4. O build TRANSFERE o buffer de entrada (structuredClone com transfer): a
 *    cópia `bytes.slice()` protege o chamador de ficar com ArrayBuffer
 *    destacado.
 *
 * Garantias estruturais: `destroy()` é chamado NO MÁXIMO uma vez (trava),
 * SEMPRE (sucesso, erro e prazo — `finally`), e é AGUARDADO antes de o fluxo
 * concluir. Depois do prazo nada mais nasce: o transporte morto rejeita
 * qualquer página seguinte, e o erro vira `ERRO_PRAZO` nomeado.
 */
export async function extrairTextoDePdf(
  bytes: Uint8Array,
  opcoes: OpcoesDeExtracao = {},
): Promise<{ texto: string; paginas: number }> {
  const prazoMs = opcoes.prazoMs ?? LIMITES.PRAZO_MS;
  const getDocument = await (
    opcoes.obterGetDocument ?? getDocumentDoBuildServerless
  )();

  const tarefa = getDocument({
    data: bytes.slice(),
    useWorkerFetch: false,
    isEvalSupported: false,
  });
  opcoes.observarTarefa?.(tarefa);

  let destruicao: Promise<void> | null = null;
  const destruir = (): Promise<void> => {
    // Trava de unicidade: vigia e `finally` compartilham a MESMA promessa —
    // destroy roda uma vez, e quem chegar depois aguarda a mesma destruição.
    destruicao ??= tarefa.destroy().catch(() => {});
    return destruicao;
  };

  const limite = Date.now() + prazoMs;
  let estourou = false;
  const vigia = setTimeout(() => {
    estourou = true;
    void destruir();
  }, prazoMs);

  try {
    const pdf = await tarefa.promise;
    if (pdf.numPages > LIMITES.MAX_PAGINAS) throw new Error(ERRO_PAGINAS);

    const textosDasPaginas: string[] = [];
    let acumulado = 0;
    for (let i = 1; i <= pdf.numPages; i += 1) {
      if (estourou || Date.now() > limite) throw new Error(ERRO_PRAZO);
      const pagina = await pdf.getPage(i);
      const conteudo = await pagina.getTextContent();
      const textoDaPagina = montarTextoDaPagina(conteudo.items);
      textosDasPaginas.push(textoDaPagina);
      acumulado += textoDaPagina.length;
      if (acumulado > LIMITES.MAX_CHARS_TEXTO)
        throw new Error(ERRO_TEXTO_GRANDE);
      // O yield que torna o vigia capaz de disparar (ver medição no docstring).
      await new Promise<void>((resolver) => {
        setImmediate(resolver);
      });
    }
    return {
      texto: normalizarTextoDasPaginas(textosDasPaginas),
      paginas: pdf.numPages,
    };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "";
    const limiteProprio =
      mensagem === ERRO_PAGINAS || mensagem === ERRO_TEXTO_GRANDE;
    if ((estourou || Date.now() > limite) && !limiteProprio) {
      // Erro pós-corte (transporte destruído) É o prazo — com nome, nunca
      // o detalhe interno do PDF.js.
      throw new Error(ERRO_PRAZO);
    }
    throw erro;
  } finally {
    clearTimeout(vigia);
    // Sucesso E erro liberam os recursos, e a destruição é AGUARDADA antes
    // de o resultado sair daqui.
    await destruir();
  }
}

// ---------------------------------------------------------------------------
// B1 · seccionador determinístico
// ---------------------------------------------------------------------------

const PALAVRAS_DE_TIPO: ReadonlyArray<{ kind: FormacaoKind; padrao: RegExp }> =
  [
    { kind: "residencia", padrao: /resid[eê]ncia/i },
    { kind: "fellowship", padrao: /fellow(ship)?/i },
    {
      kind: "especializacao",
      padrao: /especializa[cç][aã]o|t[ií]tulo de especialista/i,
    },
    {
      kind: "pos_graduacao",
      padrao: /p[oó]s[- ]?gradua[cç][aã]o|mestrado|doutorado/i,
    },
    { kind: "graduacao", padrao: /gradua[cç][aã]o|medicina|bacharel/i },
    {
      kind: "curso",
      padrao:
        /curso|aperfei[cç]oamento|atualiza[cç][aã]o|capacita[cç][aã]o|educa[cç][aã]o continuada/i,
    },
  ];

const PADRAO_INSTITUICAO =
  /(universidade|faculdade|hospital|instituto|centro|funda[cç][aã]o|escola|santa casa|unifesp|usp|unicamp|ufmg|ufrj|puc)[^,;•\n]*/i;

const PADRAO_ANOS =
  /(19[4-9]\d|20[0-4]\d)(?:\s*[–—-]\s*(19[4-9]\d|20[0-4]\d))?/;

const PADRAO_CABECALHO_FORMACAO = /^forma[cç][aã]o acad[eê]mica$/i;
const PADRAO_PROXIMA_SECAO =
  /^(experi[eê]ncia profissional|atua[cç][aã]o profissional|hist[oó]rico profissional|[aá]reas? de atua[cç][aã]o|limites? de atua[cç][aã]o|modelo de atendimento|publica[cç][oõ]es?|idiomas?|contato|refer[eê]ncias?)$/i;

function tipoDaFormacao(texto: string) {
  return PALAVRAS_DE_TIPO.find((tipo) => tipo.padrao.test(texto));
}

/**
 * PDFs em tabela frequentemente entregam uma linha visual como três blocos:
 * ano, título e instituição. Títulos quebrados ainda chegam em uma linha
 * intermediária. Aqui reconstruímos somente esses blocos, delimitados por
 * tipo acadêmico, instituição literal ou próxima seção — sem completar texto.
 */
function agruparRegistrosAcademicos(texto: string): string[] {
  const todas = texto
    .split(/\n|•|;/)
    .map((linha) => linha.replace(/\s+/g, " ").trim())
    .filter((linha) => linha.length >= 2);

  const inicioFormacao = todas.findIndex((linha) =>
    PADRAO_CABECALHO_FORMACAO.test(linha),
  );
  const linhas = inicioFormacao >= 0 ? todas.slice(inicioFormacao + 1) : todas;
  const registros: string[] = [];
  let atual: string[] = [];

  const concluir = () => {
    if (atual.length > 0) registros.push(atual.join(" "));
    atual = [];
  };

  for (const linha of linhas) {
    if (PADRAO_PROXIMA_SECAO.test(linha)) {
      concluir();
      if (inicioFormacao >= 0) break;
      continue;
    }

    const temTipo = Boolean(tipoDaFormacao(linha));
    if (temTipo) {
      concluir();
      atual.push(linha);
      if (PADRAO_INSTITUICAO.test(linha)) concluir();
      continue;
    }

    if (atual.length === 0) continue;

    // Um novo ano sem tipo pertence a outro bloco (por exemplo, experiência),
    // não à formação anterior.
    if (/^(19[4-9]\d|20[0-4]\d)\b/.test(linha)) {
      concluir();
      continue;
    }

    atual.push(linha);
    if (PADRAO_INSTITUICAO.test(linha)) concluir();
  }

  concluir();
  return registros;
}

/**
 * Lê o texto por linhas e propõe candidatos APENAS do que está escrito:
 * o tipo vem de palavra do próprio texto, a instituição de um trecho literal,
 * os anos de dígitos presentes. Linha sem tipo reconhecível não vira nada —
 * menos candidatos é o custo aceito para nunca haver candidato errado.
 */
export function seccionarFormacao(texto: string): unknown[] {
  const candidatos: unknown[] = [];
  const linhas = agruparRegistrosAcademicos(texto);

  for (const linha of linhas) {
    const tipo = tipoDaFormacao(linha);
    if (!tipo) continue;

    const semAnos = linha.replace(PADRAO_ANOS, "").replace(/\s+/g, " ").trim();
    const trechoDaInstituicao = semAnos.match(PADRAO_INSTITUICAO);
    const instituicao = trechoDaInstituicao?.[0]?.trim() ?? null;
    const anos = linha.match(PADRAO_ANOS);
    const inicio = anos ? Number(anos[1]) : null;
    const fim = anos?.[2] ? Number(anos[2]) : null;

    // Em tabela, a instituição pode estar na mesma linha extraída. Ela é
    // separada do título pelo ponto literal onde o padrão foi localizado.
    const title = semAnos
      .slice(0, trechoDaInstituicao?.index ?? semAnos.length)
      .replace(/^[|,;·–—-]+\s*/, "")
      .replace(/[|,;·–—-]+\s*$/, "")
      .trim()
      .slice(0, 200);
    if (title.length < 2) continue;

    candidatos.push({
      kind: tipo.kind,
      title,
      institution: instituicao ? instituicao.slice(0, 200) : null,
      city: null,
      country: null,
      periodStart: inicio,
      periodEnd: fim ?? (inicio !== null ? null : null),
    });
  }
  return candidatos;
}

// ---------------------------------------------------------------------------
// B2 · adaptador de modelo — DESATIVADO por padrão
// ---------------------------------------------------------------------------

export type ExtratorDeCandidatos = (texto: string) => Promise<unknown[]>;

/**
 * O B2 só liga com `FORMACAO_EXTRACAO_B2=habilitada` — e essa flag NÃO deve
 * ser ligada sem o gate de governança/privacidade registrado pelo Caio: a
 * existência da CLAUDE_API_KEY não é autorização de envio de currículo.
 * Desligado, recusa com erro claro antes de qualquer chamada de rede.
 */
export function extratorB2({
  chamarModelo,
}: { chamarModelo?: ExtratorDeCandidatos } = {}): ExtratorDeCandidatos {
  return async (texto: string) => {
    if (process.env.FORMACAO_EXTRACAO_B2 !== "habilitada") {
      throw new Error("extracao_b2_desativada");
    }
    if (!chamarModelo) throw new Error("extracao_b2_sem_modelo_configurado");
    return chamarModelo(texto);
  };
}

// ---------------------------------------------------------------------------
// O writer do pipeline — uma execução, concluída ou falha, nunca meia-formação
// ---------------------------------------------------------------------------

export type ResultadoDaExtracao = {
  runId: string | null;
  status: "concluida" | "falha";
  erro: string | null;
  criadas: number;
  descartadas: number;
  puladasPorDuplicidade: number;
  preservadasPorEdicaoHumana: number;
  requerPdfTextual: boolean;
};

type Deps = {
  supabase: SupabaseClient;
  professionalProfileId: string;
  documentId: string;
  actorId: string;
  /** Injetável nos testes; padrão = B1. */
  extrator?: ExtratorDeCandidatos;
  /** Injetável nos testes para não depender de storage. */
  baixarPdf?: () => Promise<Uint8Array>;
  /** Injetável nos testes; padrão = unpdf sobre os bytes reais. */
  lerPdf?: (bytes: Uint8Array) => Promise<{ texto: string; paginas: number }>;
};

export async function processarCurriculo(
  deps: Deps,
): Promise<ResultadoDaExtracao> {
  const { supabase, professionalProfileId, documentId, actorId } = deps;

  const registrarRun = async (
    status: "concluida" | "falha",
    campos: Partial<{
      text_hash: string;
      total_candidatos: number;
      descartados: number;
      erro: string;
    }>,
  ) => {
    const { data } = await supabase
      .from("professional_education_extraction_runs")
      .insert({
        professional_profile_id: professionalProfileId,
        document_id: documentId,
        status,
        extractor: EXTRATOR_B1,
        created_by: actorId,
        ...campos,
      })
      .select("id")
      .single();
    return (data?.id as string) ?? null;
  };

  const inicio = Date.now();
  const restante = () => LIMITES.PRAZO_MS - (Date.now() - inicio);

  // 0 · F-1 · O DOCUMENTO É DESTE PROFISSIONAL? A pergunta vem ANTES de
  //     qualquer escrita: pedir o currículo de B como formação de A é pedido
  //     REJEITADO, não extração que falhou. Por isso não nasce run, não nasce
  //     vínculo e não nasce formação — nem parcial.
  if (!deps.baixarPdf) {
    const { data: dono } = await supabase
      .from("professional_documents")
      .select("id")
      .eq("id", documentId)
      .eq("professional_profile_id", professionalProfileId)
      .maybeSingle();
    if (!dono) {
      return {
        runId: null,
        status: "falha",
        erro: ERRO_DOCUMENTO_DE_OUTRO,
        criadas: 0,
        descartadas: 0,
        puladasPorDuplicidade: 0,
        preservadasPorEdicaoHumana: 0,
        requerPdfTextual: false,
      };
    }
  }

  // 1 · bytes do currículo (nunca persistidos fora do storage de origem)
  let bytes: Uint8Array;
  try {
    if (deps.baixarPdf) {
      bytes = await deps.baixarPdf();
    } else {
      const { data: doc } = await supabase
        .from("professional_documents")
        .select("file_path")
        .eq("id", documentId)
        .eq("professional_profile_id", professionalProfileId)
        .single();
      if (!doc) throw new Error("documento_nao_encontrado");
      const { data: blob, error } = await supabase.storage
        .from("professional-documents")
        .download(doc.file_path as string);
      if (error || !blob) throw new Error("download_falhou");
      bytes = new Uint8Array(await blob.arrayBuffer());
    }
    if (bytes.byteLength > LIMITES.MAX_BYTES)
      throw new Error(ERRO_ARQUIVO_GRANDE);
  } catch (e) {
    const runId = await registrarRun("falha", {
      erro: (e as Error).message.slice(0, 80),
    });
    return {
      runId,
      status: "falha",
      erro: (e as Error).message.slice(0, 80),
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }

  // 2 · texto — currículo visual é FALHA declarada, nunca invenção. A leitura
  //     corre sob CANCELAMENTO real: no prazo, o vigia destrói a tarefa do
  //     PDF.js e o trabalho para (F-3) — erro NOMEADO, não 504 da plataforma.
  let texto = "";
  let paginas = 0;
  try {
    ({ texto, paginas } = await (deps.lerPdf
      ? deps.lerPdf(bytes)
      : extrairTextoDePdf(bytes, { prazoMs: Math.max(restante(), 1) })));
  } catch (e) {
    const classe =
      (e as Error).message === ERRO_PRAZO ? ERRO_PRAZO : "pdf_ilegivel";
    const runId = await registrarRun("falha", { erro: classe });
    return {
      runId,
      status: "falha",
      erro: classe,
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: classe === "pdf_ilegivel",
    };
  }

  // 2.1 · limites que só existem depois de abrir o PDF (F-3)
  const textHashParcial = createHash("sha256").update(texto).digest("hex");
  if (paginas > LIMITES.MAX_PAGINAS) {
    const runId = await registrarRun("falha", {
      erro: ERRO_PAGINAS,
      text_hash: textHashParcial,
    });
    return {
      runId,
      status: "falha",
      erro: ERRO_PAGINAS,
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }
  if (texto.length > LIMITES.MAX_CHARS_TEXTO) {
    const runId = await registrarRun("falha", {
      erro: ERRO_TEXTO_GRANDE,
      text_hash: textHashParcial,
    });
    return {
      runId,
      status: "falha",
      erro: ERRO_TEXTO_GRANDE,
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }
  if (restante() <= 0) {
    const runId = await registrarRun("falha", {
      erro: ERRO_PRAZO,
      text_hash: textHashParcial,
    });
    return {
      runId,
      status: "falha",
      erro: ERRO_PRAZO,
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }

  const chars = texto.replace(/\s+/g, " ").trim().length;
  const textHash = textHashParcial;
  if (paginas === 0 || chars / Math.max(paginas, 1) < LIMIAR_CHARS_POR_PAGINA) {
    const runId = await registrarRun("falha", {
      erro: "requer_pdf_textual",
      text_hash: textHash,
    });
    return {
      runId,
      status: "falha",
      erro: "requer_pdf_textual",
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: true,
    };
  }

  // 3 · candidatos pelos dois portões
  const extrator = deps.extrator ?? (async (t: string) => seccionarFormacao(t));
  let brutos: unknown[];
  try {
    brutos = await extrator(texto);
  } catch (e) {
    const runId = await registrarRun("falha", {
      erro: (e as Error).message.slice(0, 80),
      text_hash: textHash,
    });
    return {
      runId,
      status: "falha",
      erro: (e as Error).message.slice(0, 80),
      criadas: 0,
      descartadas: 0,
      puladasPorDuplicidade: 0,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }

  const validos: CandidatoDeFormacao[] = [];
  const descartes: Descarte[] = [];
  for (const bruto of brutos) {
    const { candidato, descarte } = validarCandidato(bruto, texto);
    if (candidato) validos.push(candidato);
    else if (descarte) descartes.push(descarte);
  }

  // 4 · estado atual — para dedup e para as travas do item 5
  const { data: existentes } = await supabase
    .from("professional_education_entries")
    .select(
      "id, kind, title, institution, period_start, period_end, verification_status",
    )
    .eq("professional_profile_id", professionalProfileId);
  const { data: vinculos } = await supabase
    .from("professional_education_extraction_links")
    .select("entry_id, document_id, human_edited");

  const vinculoPorEntry = new Map(
    (vinculos ?? []).map((v) => [v.entry_id as string, v]),
  );
  const chavesExistentes = new Set(
    (existentes ?? []).map((e) =>
      chaveDeDuplicidade({
        kind: e.kind as string,
        title: e.title as string,
        institution: (e.institution as string | null) ?? null,
        periodStart: (e.period_start as number | null) ?? null,
        periodEnd: (e.period_end as number | null) ?? null,
      }),
    ),
  );

  // Substituíveis: candidatos ANTERIORES deste documento que continuam
  // nao_verificado E que nenhuma pessoa tocou. `verificado` e editado-por-
  // humano são intocáveis por construção.
  const substituiveis = (existentes ?? []).filter((e) => {
    const v = vinculoPorEntry.get(e.id as string);
    return (
      v &&
      v.document_id === documentId &&
      !v.human_edited &&
      (e.verification_status as string) === "nao_verificado"
    );
  });

  const chavesSubstituiveis = new Set(
    substituiveis.map((e) =>
      chaveDeDuplicidade({
        kind: e.kind as string,
        title: e.title as string,
        institution: (e.institution as string | null) ?? null,
        periodStart: (e.period_start as number | null) ?? null,
        periodEnd: (e.period_end as number | null) ?? null,
      }),
    ),
  );

  let puladas = 0;
  const aCriar: CandidatoDeFormacao[] = [];
  const chavesNoLote = new Set<string>();
  for (const c of validos) {
    const chave = chaveDeDuplicidade(c);
    // Duplicata de algo que NÃO vamos substituir (confirmado, editado ou de
    // outro documento) — pula. Duplicata dentro do próprio lote — pula.
    if (
      (chavesExistentes.has(chave) && !chavesSubstituiveis.has(chave)) ||
      chavesNoLote.has(chave)
    ) {
      puladas += 1;
      continue;
    }
    chavesNoLote.add(chave);
    aCriar.push(c);
  }

  // 5 · escrita: substituíveis saem, candidatos entram, run por último.
  //     Falha em qualquer passo → compensação (nada deste run sobrevive) e
  //     run gravado como `falha`. Não há transação multi-tabela via PostgREST;
  //     a compensação + RLS de admin + volume pequeno seguram o invariante, e
  //     o teste de integração prova o caminho de falha sem meia-formação.
  const inseridas: string[] = [];
  try {
    if (substituiveis.length > 0) {
      const ids = substituiveis.map((e) => e.id as string);
      await supabase
        .from("professional_education_entries")
        .delete()
        .in("id", ids);
    }

    const runId = await registrarRun("concluida", {
      text_hash: textHash,
      total_candidatos: brutos.length,
      descartados: descartes.length,
    });
    if (!runId) throw new Error("run_nao_registrado");

    for (const c of aCriar) {
      const { data: linha, error } = await supabase
        .from("professional_education_entries")
        .insert({
          professional_profile_id: professionalProfileId,
          kind: c.kind,
          title: c.title,
          institution: c.institution,
          city: c.city,
          country: c.country,
          period_start: c.periodStart,
          period_end: c.periodEnd,
          source: "extracao_assistida",
          // O pipeline nasce e morre em nao_verificado — default da coluna;
          // declarado aqui para o leitor ver que NÃO existe outro valor.
          verification_status: "nao_verificado",
        })
        .select("id")
        .single();
      if (error || !linha) throw new Error("insercao_falhou");
      inseridas.push(linha.id as string);
      const { error: erroVinculo } = await supabase
        .from("professional_education_extraction_links")
        .insert({
          entry_id: linha.id as string,
          run_id: runId,
          document_id: documentId,
        });
      if (erroVinculo) throw new Error("vinculo_falhou");
    }

    return {
      runId,
      status: "concluida",
      erro: null,
      criadas: aCriar.length,
      descartadas: descartes.length,
      puladasPorDuplicidade: puladas,
      preservadasPorEdicaoHumana: (vinculos ?? []).filter(
        (v) => v.document_id === documentId && v.human_edited,
      ).length,
      requerPdfTextual: false,
    };
  } catch (e) {
    if (inseridas.length > 0) {
      await supabase
        .from("professional_education_entries")
        .delete()
        .in("id", inseridas);
    }
    const runId = await registrarRun("falha", {
      erro: (e as Error).message.slice(0, 80),
      text_hash: textHash,
    });
    return {
      runId,
      status: "falha",
      erro: (e as Error).message.slice(0, 80),
      criadas: 0,
      descartadas: descartes.length,
      puladasPorDuplicidade: puladas,
      preservadasPorEdicaoHumana: 0,
      requerPdfTextual: false,
    };
  }
}

export function ehTipoDeFormacaoValido(kind: string): boolean {
  return isFormacaoKind(kind);
}
