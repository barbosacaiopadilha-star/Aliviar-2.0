import type { MotorParticipation } from "./evidencias-pratica";

/**
 * A CAMADA DE DERIVAÇÃO — a função pura (Item 1.A · Onda 2).
 *
 * @metodo ADR-066 (=ADR-A) §1 — o oferecimento, e os cinco elementos que o
 *         constituem
 * @metodo ADR-066 §2 — o que um oferecimento NÃO é: nunca declaração
 * @metodo DP-1 ratificada — conceito `MOTOR_PARTICIPATION = NUNCA` exige juízo
 *         humano e não é derivado
 * @metodo DT-91 — este pacote cria a função e nada além dela
 *
 * Por que existe: a Camada de Derivação é a peça que transforma o que alguém
 * declarou numa SUGESTÃO para um campo cuja autoridade é humana. A ADR-066 é
 * explícita sobre a natureza do ato — "um ato do sistema dirigido a um humano",
 * um fato sobre o SISTEMA, nunca sobre a pessoa. É essa distinção que impede
 * que a sugestão seja lida, um dia, como se fosse a verdade que ela apenas
 * ofereceu.
 *
 * O QUE ESTA FUNÇÃO NÃO FAZ, e por decisão, não por falta de tempo:
 *
 *   - não persiste, não consulta banco, não emite identidade;
 *   - não carimba data nem lê o relógio;
 *   - não nomeia regra nem versão — quem oferece precisa dizer QUAL regra e
 *     QUAL versão usou (ADR-066 §14, itens 8 e 9), e isso é da 2.1;
 *   - não registra auditoria;
 *   - não decide `INDIRETO`.
 *
 * Sem essas cinco coisas, o que sai daqui **não é uma proposta** no sentido da
 * ADR-066 — é o conteúdo do oferecimento, e só. Nomeá-lo "proposta" seria
 * prometer autoridade que ele não tem.
 *
 * TODA DEPENDÊNCIA É EXPLÍCITA (A5). A participação no Motor CHEGA como
 * entrada; esta função não consulta o Catálogo. O motivo é de contrato, não de
 * estilo: uma função que lê catálogo global deixa de ser determinística sobre
 * as próprias entradas — o mesmo input passaria a dar outro output quando o
 * catálogo mudasse, e a auditoria retroativa da ADR-066 §14.11 ficaria
 * impossível de reproduzir.
 *
 * Puro: sem React, sem banco, sem relógio, sem aleatoriedade.
 */

// ---------------------------------------------------------------------------
// Entradas — tudo explícito, nada global
// ---------------------------------------------------------------------------

/**
 * A declaração de origem (ADR-066 §14, itens 4 a 7).
 *
 * Ela ENTRA identificada e datada; nada aqui é inventado. `declaradoEm` é a
 * data em que a pessoa declarou — jamais "agora": a Fronteira Humana mostra
 * *"você respondeu isto em 10/03"*, e um carimbo de execução mentiria sobre
 * quando ela falou.
 */
export type DeclaracaoDeOrigem = {
  /** Referência estável do registro de origem. */
  registro: string;
  /** Versão da declaração usada — permite detectar S1 (ADR-066 §14.5). */
  versao: string;
  /** Quem declarou: a pessoa ou o profissional, nunca o sistema. */
  autor: string;
  /** Quando a pessoa declarou. Nunca a data de execução desta função. */
  declaradoEm: string;
  /** Os valores canônicos declarados — códigos, nunca rótulos (I-2). */
  valores: readonly string[];
};

/**
 * O conceito e o campo que receberia a sugestão.
 *
 * `escalaFechada` chega junto de propósito: o valor sugerido tem de pertencer à
 * escala do campo (ADR-066 §14.3), e verificar isso lendo o Catálogo por dentro
 * quebraria A5.
 */
export type ConceitoAlvo = {
  /** Código canônico — nunca rótulo (I-2). */
  code: string;
  /** Qual campo receberia a sugestão. */
  campo: string;
  /** A escala fechada do campo alvo. */
  escalaFechada: readonly string[];
  /** Catálogo vigente no momento do oferecimento (ADR-066 §14.11). */
  catalogVersion: string;
};

/**
 * O mapeamento declarado → sugerido, como DADO.
 *
 * Não é regra e não vira regra: é a tabela que quem chama informa, e esta
 * função apenas a aplica. Nomear e versionar a regra é da 2.1 (ADR-066 §14,
 * itens 8 e 9) — inventá-la aqui seria decidir domínio por conta própria.
 *
 * Ser dado, e não função, é deliberado: uma função recebida poderia ler
 * relógio, sortear ou consultar banco, e a pureza desta camada deixaria de ser
 * verificável olhando para ela.
 */
export type MapeamentoDeclarado = Readonly<Record<string, string>>;

export type EntradaDaDerivacao = {
  declaracao: DeclaracaoDeOrigem;
  conceito: ConceitoAlvo;
  /** Explícita, sempre. Esta função NÃO consulta o Catálogo (A5). */
  participacaoNoMotor: MotorParticipation;
  mapeamento: MapeamentoDeclarado;
};

// ---------------------------------------------------------------------------
// Saída — a estrutura derivada, e o motivo quando não há
// ---------------------------------------------------------------------------

/**
 * Por que não houve derivação. Cada motivo tem nome porque "não derivou" sem
 * causa é indistinguível de erro — e quem consome precisa saber se está diante
 * de uma decisão de Método, de um dado faltante ou de um contrato rompido.
 */
export const MOTIVOS_DE_NAO_DERIVAR = [
  /** DP-1: o conceito exige juízo humano. Nunca será derivado. */
  "EXIGE_JUIZO_HUMANO",
  /** A pessoa não declarou nada — não há origem. */
  "SEM_DECLARACAO",
  /** Nenhum valor declarado tem correspondência no mapeamento informado. */
  "SEM_CORRESPONDENCIA",
  /** O declarado corresponde a mais de um valor alvo, e escolher seria decidir. */
  "CORRESPONDENCIA_AMBIGUA",
  /** O valor mapeado não pertence à escala fechada do campo alvo. */
  "FORA_DA_ESCALA_DO_CAMPO",
] as const;

export type MotivoDeNaoDerivar = (typeof MOTIVOS_DE_NAO_DERIVAR)[number];

/**
 * O conteúdo do oferecimento — sem identidade, sem data de emissão, sem regra.
 *
 * A proveniência da ORIGEM viaja junto (itens 4 a 7 da ADR-066 §14) porque ela
 * já existe na entrada: repassá-la não é inventar nada, e sem ela o valor
 * sugerido não teria de onde vir. Os itens 1, 8, 9 e 10 — identidade, regra,
 * versão da regra e data de emissão — pertencem a quem persiste.
 */
export type Derivacao =
  | {
      derivou: true;
      subcriterionCode: string;
      campo: string;
      valorSugerido: string;
      catalogVersion: string;
      origem: DeclaracaoDeOrigem;
    }
  | {
      derivou: false;
      subcriterionCode: string;
      campo: string;
      motivo: MotivoDeNaoDerivar;
    };

// ---------------------------------------------------------------------------
// A função
// ---------------------------------------------------------------------------

/**
 * Deriva o conteúdo de um oferecimento a partir de uma declaração.
 *
 * Determinística e idempotente por construção: só olha para os argumentos,
 * não guarda estado entre chamadas, e não tem nada mutável ao seu redor.
 *
 * A ordem das recusas importa. `EXIGE_JUIZO_HUMANO` vem primeiro porque é
 * decisão de Método, e não consequência de dado: um conceito `NUNCA` não deve
 * sequer ser examinado quanto a ter declaração ou correspondência — dizer
 * "sem declaração" sobre ele sugeriria que, havendo declaração, haveria
 * derivação. Não haveria.
 */
export function derivar(entrada: EntradaDaDerivacao): Derivacao {
  const { declaracao, conceito, participacaoNoMotor, mapeamento } = entrada;
  const naoDerivou = (motivo: MotivoDeNaoDerivar): Derivacao => ({
    derivou: false,
    subcriterionCode: conceito.code,
    campo: conceito.campo,
    motivo,
  });

  // A3 · DP-1 — antes de qualquer outra pergunta.
  if (participacaoNoMotor === "NUNCA") return naoDerivou("EXIGE_JUIZO_HUMANO");

  if (declaracao.valores.length === 0) return naoDerivou("SEM_DECLARACAO");

  // Ordem de leitura estável: o resultado não pode depender da ordem em que os
  // valores foram declarados nem de como o objeto foi montado.
  const sugeridos = [
    ...new Set(
      [...declaracao.valores]
        .sort()
        .map((valor) => mapeamento[valor])
        .filter((valor): valor is string => valor !== undefined),
    ),
  ];

  if (sugeridos.length === 0) return naoDerivou("SEM_CORRESPONDENCIA");

  // Dois valores alvo distintos para a mesma declaração: escolher um seria o
  // sistema decidindo, e a ADR-066 §2 é explícita — oferece, não declara.
  if (sugeridos.length > 1) return naoDerivou("CORRESPONDENCIA_AMBIGUA");

  const valorSugerido = sugeridos[0]!;
  if (!conceito.escalaFechada.includes(valorSugerido)) {
    return naoDerivou("FORA_DA_ESCALA_DO_CAMPO");
  }

  return {
    derivou: true,
    subcriterionCode: conceito.code,
    campo: conceito.campo,
    valorSugerido,
    catalogVersion: conceito.catalogVersion,
    origem: declaracao,
  };
}
