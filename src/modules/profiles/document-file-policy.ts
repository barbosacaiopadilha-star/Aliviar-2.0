/**
 * D-12.2 · A REGRA ÚNICA DE QUAIS ARQUIVOS ENTRAM NA CENTRAL DE DOCUMENTOS.
 *
 * Antes desta fatia não havia regra nenhuma: os writers aceitavam qualquer
 * `File` com `size > 0`, e `content_type` era gravado direto de `file.type`.
 * O único teto existente era o `file_size_limit` global da stack local — não
 * do bucket, e nenhuma garantia em produção.
 *
 * DE ONDE VÊM OS VALORES
 *
 * A **ADR-054 — Política de documentos clínicos** (2026-08-02, decisão D-08)
 * já fixava *MIME allowlist (PDF, JPG, PNG, WEBP) e teto de 20 MB*. Não é
 * regra nova: é a regra aprovada, finalmente aplicada.
 *
 * A ADR manda aplicá-la em TRÊS camadas — bucket, action e config do
 * framework. Aqui existe **só a da action**: os buckets seguem com
 * `file_size_limit`/`allowed_mime_types` nulos. Registrado, não resolvido.
 *
 * O ALCANCE (decidido na D-12.2): a regra vale para os DOIS writers. O §28
 * exigia que o writer novo fosse igual ou mais restritivo que o dela; assim
 * eles são idênticos por construção, porque leem daqui.
 *
 * FONTE ÚNICA, NÃO POR CONVENÇÃO: duas listas de MIME divergiriam na primeira
 * vez que alguém acrescentasse um tipo em um lado só. Quem valida é este
 * módulo; os writers não conhecem a lista.
 *
 * POR QUE OS BYTES, E NÃO SÓ `file.type`
 *
 * `file.type` é declarado pelo cliente. Um `.exe` renomeado e anunciado como
 * `application/pdf` passaria por qualquer allowlist que só lesse esse campo —
 * e o valor ainda seria gravado em `content_type`, virando a base do
 * `Content-Type` servido no download depois. Conferir a assinatura real do
 * arquivo é o que transforma a allowlist em garantia, e não em etiqueta.
 * Mesmo princípio das policies da D-12.1: a recusa vem do fato, não da
 * afirmação de quem escreve.
 */

/** 20 MB. Cabe exame escaneado multipágina e foto de celular sem recorte. */
export const TAMANHO_MAXIMO_DOCUMENTO_BYTES = 20 * 1024 * 1024;

/**
 * Os tipos aceitos, cada um com o reconhecedor da própria assinatura.
 *
 * ⚠️ **D-12-FILE-POLICY — DECISÃO PENDENTE.** HEIC/HEIF **não constam da
 * ADR-054**: são ampliação feita por engenharia. O motivo é real (HEIC é o
 * padrão do iPhone, e sem ele a foto do exame é recusada), mas motivo não é
 * autoridade — a própria ADR diz que ampliar é ato de revisitá-la. Fica
 * preservado e **explicitamente não congelado** até essa revisão.
 */
const ASSINATURAS: ReadonlyArray<{
  readonly mime: string;
  readonly reconhece: (bytes: Uint8Array) => boolean;
}> = [
  // "%PDF"
  { mime: "application/pdf", reconhece: (b) => casa(b, 0, [0x25, 0x50, 0x44, 0x46]) },
  // SOI + marcador
  { mime: "image/jpeg", reconhece: (b) => casa(b, 0, [0xff, 0xd8, 0xff]) },
  { mime: "image/png", reconhece: (b) => casa(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  // RIFF....WEBP — o tamanho ocupa os quatro bytes do meio.
  {
    mime: "image/webp",
    reconhece: (b) => texto(b, 0, 4) === "RIFF" && texto(b, 8, 4) === "WEBP",
  },
  // ISO-BMFF: "ftyp" na posição 4, marca da variante logo depois.
  { mime: "image/heic", reconhece: ehHeif },
  { mime: "image/heif", reconhece: ehHeif },
];

export const TIPOS_DE_DOCUMENTO_ACEITOS: readonly string[] = ASSINATURAS.map((a) => a.mime);

/** Para o atributo `accept` do input — a UI não mantém lista própria. */
export const ACCEPT_DE_DOCUMENTO = TIPOS_DE_DOCUMENTO_ACEITOS.join(",");

const MARCAS_HEIF = new Set([
  "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1",
]);

function casa(bytes: Uint8Array, inicio: number, esperado: readonly number[]): boolean {
  if (bytes.length < inicio + esperado.length) return false;
  return esperado.every((valor, i) => bytes[inicio + i] === valor);
}

function texto(bytes: Uint8Array, inicio: number, comprimento: number): string {
  if (bytes.length < inicio + comprimento) return "";
  return String.fromCharCode(...bytes.subarray(inicio, inicio + comprimento));
}

function ehHeif(bytes: Uint8Array): boolean {
  return texto(bytes, 4, 4) === "ftyp" && MARCAS_HEIF.has(texto(bytes, 8, 4));
}

export type ValidacaoDeArquivo =
  | { readonly aceito: true; readonly contentType: string }
  | { readonly aceito: false; readonly erro: string };

/**
 * Decide se o arquivo entra. Devolve o `content_type` já confirmado pelos
 * bytes — os writers gravam ESTE valor, nunca `file.type` cru, para que o
 * banco nunca carregue um tipo que o conteúdo desminta.
 *
 * A ordem importa: tamanho antes dos bytes, porque recusar 300 MB não deve
 * exigir ler o arquivo.
 */
export async function validarArquivoDeDocumento(file: File): Promise<ValidacaoDeArquivo> {
  if (file.size === 0) {
    return { aceito: false, erro: "Selecione um arquivo para enviar." };
  }

  if (file.size > TAMANHO_MAXIMO_DOCUMENTO_BYTES) {
    return {
      aceito: false,
      erro: `O arquivo passa de ${formatarMb(TAMANHO_MAXIMO_DOCUMENTO_BYTES)}. Envie uma versão menor.`,
    };
  }

  // Recusar o tipo vazio é decisão do DT-01: sem tipo declarado não há o que
  // conferir contra os bytes, e aceitar às cegas devolveria a ausência de
  // regra que esta fatia existe para encerrar.
  const declarado = file.type?.trim().toLowerCase() ?? "";
  if (declarado === "") {
    return { aceito: false, erro: TIPO_NAO_ACEITO };
  }

  const assinatura = ASSINATURAS.find((a) => a.mime === declarado);
  if (!assinatura) {
    return { aceito: false, erro: TIPO_NAO_ACEITO };
  }

  // 12 bytes bastam para todas as assinaturas acima; 16 dá folga sem custo.
  const cabecalho = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!assinatura.reconhece(cabecalho)) {
    return {
      aceito: false,
      erro: "O arquivo não parece ser do tipo que o nome indica. Envie o original.",
    };
  }

  return { aceito: true, contentType: assinatura.mime };
}

const TIPO_NAO_ACEITO =
  "Envie um PDF ou uma imagem (JPEG, PNG, HEIC ou WebP).";

function formatarMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * O nome do arquivo entra no CAMINHO do objeto no storage, e o caminho é o
 * que as policies leem: `foldername(name)[1]` é a dona, `[2]` o namespace,
 * `[3]` o Case. Um nome com barra deslocaria essas posições.
 *
 * O deslocamento falharia fechado — a policy simplesmente não reconheceria o
 * caminho e recusaria a escrita —, mas depender disso é depender de acidente
 * feliz. Aqui o nome deixa de ser capaz de mexer na estrutura, e a policy
 * volta a decidir só o que ela existe para decidir.
 *
 * Acentos são preservados: o nome é da paciente, e o writer dela sempre os
 * aceitou.
 */
export function nomeDeArquivoParaCaminho(nome: string): string {
  const semDiretorio = nome.split(/[\\/]/).pop() ?? "";
  const limpo = semDiretorio
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    // Um nome iniciado por ponto é oculto; por hífen, confunde com opção.
    .replace(/^[.\-]+/, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);

  return limpo || "documento";
}
