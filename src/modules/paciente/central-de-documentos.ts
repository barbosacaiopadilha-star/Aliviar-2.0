import type { StoryStatus } from "@/modules/story/types";

/**
 * D-12.2B · A CENTRAL DE DOCUMENTOS, COMO PROJEÇÃO.
 *
 * **TypeScript, não tabela.** Nenhuma categoria é persistida, nenhum enum
 * novo nasce no banco, nenhuma migration acompanha este arquivo. A Central é
 * uma LEITURA de três fontes que já existem — documentos, Curadoria e Sua
 * História — reunidas na forma que a paciente entende.
 *
 * TRÊS DECISÕES QUE ESTE ARQUIVO CARREGA
 *
 * **1 · A origem não é declarada, é derivada.** `uploaded_by = profile_id` é
 * dela; diferente é da Aliviar. Não existe coluna `source`, e por isso não
 * existe forma de o cliente pedir uma categoria: ele não envia categoria
 * nenhuma. A policy da D-12.1 impede a paciente de gravar
 * `uploaded_by <> auth.uid()`, então nem forjando a linha ela apareceria como
 * "recebido da Aliviar".
 *
 * **2 · O portão da Curadoria é `deliveredAt`, e só ele.** `emittedAt` é a
 * Aliviar tendo terminado por dentro; `presentedAt` é o encontro tendo
 * acontecido. Nenhum dos dois é ela ter acesso. Mostrar a Curadoria antes da
 * entrega seria dizer que ela tem algo que não tem.
 *
 * **3 · Nada interno atravessa.** `file_path`, `uploaded_by`, `case_id` e o
 * bucket ficam deste lado. O que sai é o mínimo para a tela existir, mais uma
 * REFERÊNCIA opaca que um handler autorizado sabe resolver — nunca uma URL
 * assinada materializada aqui, nunca um caminho cru.
 */

export type DocumentCenterCategory =
  | "SENT_BY_PATIENT"
  | "RECEIVED_FROM_ALIVIAR"
  | "HISTORY_OR_FORM";

/**
 * Classe A · arquivo real no storage. Classe B · existe como experiência da
 * plataforma, não como arquivo. Inventar persistência para encaixar a
 * Curadoria na classe A seria mentir sobre o que existe (§G do doc 25).
 */
export type DocumentCenterKind = "FILE" | "PLATFORM_ARTIFACT";

export type DocumentCenterAction =
  | { verb: "DOWNLOAD"; label: string }
  | { verb: "OPEN"; label: string; href: string }
  | { verb: "CONTINUE"; label: string; href: string }
  | { verb: "REVIEW"; label: string; href: string };

/**
 * O download é uma CAPACIDADE, não um botão. Quando ele não existe, a
 * projeção diz por quê — a tela não precisa adivinhar, e o motivo é
 * auditável.
 */
export type DownloadCapability =
  /** Existe objeto no storage. A URL assinada é emitida no clique, não aqui. */
  | { kind: "FILE_DOWNLOAD"; available: true; via: "SIGNED_URL_ON_DEMAND" }
  /**
   * Não há arquivo — há uma tela imprimível que já existe e já é guardada por
   * papel. "Levar em PDF" é isto, e **não** é download de arquivo: a distinção
   * é do tipo, para que nenhuma tela possa confundir as duas coisas.
   */
  | { kind: "PRINTABLE_VIEW"; available: true; href: string }
  | {
      kind: "NONE";
      available: false;
      reason: "PLATFORM_ARTIFACT_HAS_NO_FILE" | "NO_SAFE_PRINTABLE_REPRESENTATION";
    };

/**
 * A referência que sai para a UI. Para arquivo, o id da LINHA — nunca o
 * caminho: é ele que um handler autorizado troca por uma URL assinada de
 * curta validade, no momento do clique. Para artefato, não há id nenhum a
 * dar, porque não há objeto.
 */
export type DocumentCenterReference =
  | { kind: "patient_document"; documentId: string }
  | { kind: "curadoria" }
  | { kind: "story" };

export type DocumentCenterItem = {
  id: string;
  category: DocumentCenterCategory;
  kind: DocumentCenterKind;
  title: string;
  date: string | null;
  primaryAction: DocumentCenterAction;
  downloadCapability: DownloadCapability;
  sourceReference: DocumentCenterReference;
};

// ---------------------------------------------------------------------------
// A entrada — formas estruturais mínimas, para a projeção não se acoplar aos
// registros inteiros nem poder ler campo que não devia.

export type DocumentoDaCentral = {
  id: string;
  profileId: string;
  uploadedBy: string;
  fileName: string;
  createdAt: string | null;
};

export type CuradoriaDaCentral = {
  relatorio: {
    emittedAt: string | null;
    deliveredAt: string | null;
    options: ReadonlyArray<unknown>;
  };
  /**
   * `presentedAt` entra na projeção para poder ser **ignorado de propósito**.
   * Ele e `emittedAt` são os dois carimbos que se parecem com entrega sem
   * serem — e um deles estar aqui é o que permite provar, por mutação, que o
   * portão não os usa.
   */
  devolutiva: { presentedAt: string | null };
};

export type HistoriaDaCentral = {
  status: StoryStatus;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type EntradaDaCentral = {
  /** A dona da Central. Nada que não seja dela sobrevive à projeção. */
  patientProfileId: string;
  documentos: ReadonlyArray<DocumentoDaCentral>;
  curadoria: CuradoriaDaCentral | null;
  historia: HistoriaDaCentral | null;
};

// ---------------------------------------------------------------------------

// Rotas reais, verificadas em `src/app`. A projeção não inventa endereço:
// href que não existe é 404 na mão da paciente.
export const ROTA_CONTINUAR_HISTORIA = "/sua-historia/continuar";
export const ROTA_REVER_HISTORIA = "/sua-historia/revisao";
export const ROTA_ABRIR_CURADORIA = "/paciente/curadoria";
export const ROTA_IMPRIMIR_CURADORIA = "/paciente/curadoria/imprimir";

/**
 * Monta a Central de uma paciente.
 *
 * A RLS já é a autoridade — as linhas chegam aqui filtradas pelo banco. O
 * descarte por `profileId` abaixo é uma segunda tranca, não a primeira: se um
 * dia uma consulta trouxer linha alheia, ela morre aqui e não na tela. Filtro
 * de segurança não pode viver só do lado do cliente.
 */
export function montarCentralDeDocumentos(entrada: EntradaDaCentral): DocumentCenterItem[] {
  const dela = entrada.documentos.filter((d) => d.profileId === entrada.patientProfileId);

  return [
    ...dela.map(projetarDocumento),
    ...projetarCuradoria(entrada.curadoria),
    ...projetarHistoria(entrada.historia),
  ];
}

function projetarDocumento(documento: DocumentoDaCentral): DocumentCenterItem {
  // A origem NASCE da autoria persistida. O cliente não a informa, e a policy
  // da D-12.1 não o deixaria forjá-la nem gravando a linha à mão.
  const dela = documento.uploadedBy === documento.profileId;

  return {
    id: `documento:${documento.id}`,
    category: dela ? "SENT_BY_PATIENT" : "RECEIVED_FROM_ALIVIAR",
    kind: "FILE",
    // O nome ORIGINAL que ela (ou o Curador) deu — nunca o segmento do
    // caminho, que carrega carimbo de tempo e não diz nada a ninguém.
    title: documento.fileName,
    date: documento.createdAt,
    primaryAction: { verb: "DOWNLOAD", label: "Baixar" },
    // Arquivo real é o único caso em que download DE ARQUIVO existe. A URL não
    // é criada aqui: o handler a emite, assinada e curta, no clique.
    downloadCapability: { kind: "FILE_DOWNLOAD", available: true, via: "SIGNED_URL_ON_DEMAND" },
    sourceReference: { kind: "patient_document", documentId: documento.id },
  };
}

/**
 * A Curadoria entregue — classe B, em *Recebidos da Aliviar*.
 *
 * Duas condições, ambas obrigatórias: o carimbo de ENTREGA e conteúdo de
 * verdade. `deliveredAt` sozinho, sobre um Relatório sem nenhuma opção, seria
 * um carimbo apontando para o vazio — e a tela prometeria algo que a leitura
 * não sustenta.
 */
function projetarCuradoria(curadoria: CuradoriaDaCentral | null): DocumentCenterItem[] {
  if (!curadoria) return [];

  const { deliveredAt, options } = curadoria.relatorio;
  if (!deliveredAt) return [];
  if (options.length === 0) return [];

  return [
    {
      id: "curadoria",
      category: "RECEIVED_FROM_ALIVIAR",
      kind: "PLATFORM_ARTIFACT",
      title: "Sua Curadoria",
      date: deliveredAt,
      primaryAction: { verb: "OPEN", label: "Abrir", href: ROTA_ABRIR_CURADORIA },
      // Não há arquivo no storage — chamar isto de "baixar" inventaria um
      // objeto que não existe. O que existe é a tela imprimível, que já é
      // guardada por papel: "Levar em PDF" é ela, e o tipo diz que não é
      // download de arquivo.
      downloadCapability: {
        kind: "PRINTABLE_VIEW",
        available: true,
        href: ROTA_IMPRIMIR_CURADORIA,
      },
      sourceReference: { kind: "curadoria" },
    },
  ];
}

/**
 * Sua História — terceira área.
 *
 * **Sua História não é questionário**, e o vocabulário aqui é parte do
 * contrato: nenhum título, rótulo ou ação desta projeção usa essa palavra.
 */
function projetarHistoria(historia: HistoriaDaCentral | null): DocumentCenterItem[] {
  if (!historia) return [];

  const enviada = historia.status === "enviada";

  return [
    {
      id: "sua-historia",
      category: "HISTORY_OR_FORM",
      kind: "PLATFORM_ARTIFACT",
      title: "Sua História",
      date: enviada ? historia.submittedAt : historia.updatedAt,
      primaryAction: enviada
        ? { verb: "REVIEW", label: "Rever", href: ROTA_REVER_HISTORIA }
        : { verb: "CONTINUE", label: "Continuar", href: ROTA_CONTINUAR_HISTORIA },
      // GAP-A6-Q1: os textos das perguntas vivem espalhados nas sete páginas
      // do wizard, sem fonte única. Gerar um imprimível hoje exigiria
      // duplicá-los — e duas fontes divergem na primeira pergunta que mudar.
      // Enquanto não houver representação canônica, não há download.
      downloadCapability: {
        kind: "NONE",
        available: false,
        reason: "NO_SAFE_PRINTABLE_REPRESENTATION",
      },
      sourceReference: { kind: "story" },
    },
  ];
}
