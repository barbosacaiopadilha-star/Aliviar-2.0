/**
 * O CONTRATO DA ESTRUTURA DA CAMADA DE DERIVAÇÃO — Item 2.1.
 *
 * @metodo ADR-066 (=ADR-A) §11 — cinco estados, lista fechada
 * @metodo ADR-066 §14 — os doze itens que obrigatoriamente acompanham um
 *         oferecimento
 * @metodo Arquitetura §15.0 — nenhuma derivação persistida ou consumida antes
 *         das dez dependências
 *
 * ESTE ARQUIVO É TIPO, E SÓ. Nenhuma função, nenhum cliente, nenhum acesso.
 * Ele descreve a forma da estrutura criada pela migration 20260805090000, para
 * que o pacote que um dia abrir a escrita não precise redescobri-la — e para
 * que a divergência entre o que o banco tem e o que o código espera apareça em
 * `tsc`, não em produção.
 *
 * INÉRCIA POR DESENHO. A estrutura existe; nada a alcança. Não há repositório,
 * action, RPC, endpoint, loader, hook ou serviço — e há guarda que falha se
 * algum nascer. A tabela está com RLS habilitada e ZERO políticas: `anon` e
 * `authenticated` não leem nem escrevem uma linha, e nenhum grant foi dado a
 * papel de aplicação. A fronteira é do banco, não da disciplina de quem
 * programa.
 *
 * O nome físico da tabela NÃO aparece neste arquivo, deliberadamente: a guarda
 * C-01 continua provando que nenhum módulo de `src/` a conhece, e essa prova é
 * mais valiosa do que a conveniência de repetir o nome aqui. Quem for abrir a
 * escrita, na 2.C, é que passará por essa fronteira — explicitamente, e com a
 * guarda sendo revista junto.
 *
 * Puro: sem React, sem banco, sem execução.
 */

/**
 * ADR-066 §11 — cinco estados, lista fechada. Estado que não está aqui não
 * existe no domínio.
 *
 * `PENDENTE` NÃO é estado, por decisão expressa da ADR: é a *leitura
 * operacional* de um oferecimento em `PROPOSTA`. Criá-lo abriria a porta para
 * "pendente há muito tempo → confirmar automaticamente", que o §6 proíbe.
 *
 * `RETIRADA` descreve mudança na REGRA; `SUPERADA`, mudança no FATO. Fundi-las
 * apagaria a diferença entre "a pessoa corrigiu o que disse" e "a Autoridade de
 * Método suspendeu a regra" — duas causas com implicações opostas para a
 * calibração.
 */
export const ESTADOS_DO_OFERECIMENTO = [
  "PROPOSTA",
  "CONFIRMADA",
  "RECUSADA",
  "SUPERADA",
  "RETIRADA",
] as const;

export type EstadoDoOferecimento = (typeof ESTADOS_DO_OFERECIMENTO)[number];

/** O único estado não terminal (§11). */
export const ESTADO_INICIAL: EstadoDoOferecimento = "PROPOSTA";

/**
 * Os doze itens obrigatórios da ADR-066 §14, na forma da estrutura.
 *
 * Não há campo opcional nesta lista: oferecimento sem qualquer um deles não
 * nasce (§10, etapa 2), e a tabela impõe isso em `not null`.
 *
 * O alvo é UM — ou um Case, ou um profissional. "Nenhum" seria oferecimento sem
 * a quem oferecer; "os dois" seria autoridade ambígua, e o §14.2 é claro que é
 * o alvo que define de quem é a autoridade para confirmar. A união discriminada
 * abaixo torna isso impossível de escrever errado em TypeScript, do mesmo jeito
 * que o CHECK torna impossível de gravar errado no banco.
 */
export type AlvoDoOferecimento =
  | { tipo: "CASE"; caseId: string }
  | { tipo: "PROFISSIONAL"; professionalProfileId: string };

export type ProvenienciaDaOrigem = {
  /** Item 4 — qual declaração, identificada. Primeiro elo da cadeia. */
  registro: string;
  /** Item 5 — a versão da declaração usada; permite detectar S1. */
  versao: string;
  /** Item 6 — quando a PESSOA declarou. Nunca quando o sistema ofereceu. */
  declaradoEm: string;
  /** Item 7 — quem declarou; fecha a autoridade sobre o fato de origem. */
  autor: string;
};

export type RegraAplicada = {
  /** Item 8 — qual regra. Sem ela, o valor é mágico. */
  identificador: string;
  /**
   * Item 9 — chave da calibração e da auditoria retroativa.
   *
   * NÚMERO, não texto (MR1.0). Nasceu `string` aqui e `integer` do lado da
   * Regra (§10.5: versão ordinal, `>= 1`), e a divergência só apareceu quando a
   * FK composta a tornou impossível de ignorar. O tipo certo é o da Regra: é
   * ela quem versiona, e a proposta apenas guarda qual versão a gerou.
   */
  versao: number;
};

/**
 * Uma linha da estrutura, como o domínio a lê.
 *
 * Tudo aqui é IMUTÁVEL depois da emissão (§12): uma vez nascido, nenhum
 * atributo do oferecimento muda. O tipo declara isso com `readonly` — quem
 * tentar reescrever um campo cai em `tsc`, antes de chegar ao banco.
 */
export type OferecimentoRegistrado = {
  /** Item 1 — referência estável e única. */
  readonly id: string;
  /** Item 2 — alvo, conceito (por código canônico, I-2) e campo. */
  readonly alvo: AlvoDoOferecimento;
  readonly subcriterionCode: string;
  readonly campo: string;
  /** Item 3 — o valor sugerido, da escala fechada do campo. */
  readonly valorSugerido: string;
  /** Itens 4 a 7. */
  readonly origem: ProvenienciaDaOrigem;
  /** Itens 8 e 9. */
  readonly regra: RegraAplicada;
  /** Item 10 — quando o sistema ofereceu. */
  readonly emitidoEm: string;
  /** Item 11 — catálogo vigente na emissão; permite reler sem reinterpretar. */
  readonly catalogVersion: string;
  /** Item 12 — grau de consequência, pela régua da DP-5. */
  readonly grauDeConsequencia: string;
  /** §11 — o estado, que é a única coisa que se move ao longo do ciclo. */
  readonly estado: EstadoDoOferecimento;
};

/** Terminal = não há mais ato a praticar sobre o oferecimento (§11). */
export function ehEstadoTerminal(estado: EstadoDoOferecimento): boolean {
  return estado !== "PROPOSTA";
}
