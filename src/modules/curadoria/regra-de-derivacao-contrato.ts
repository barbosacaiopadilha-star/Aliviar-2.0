/**
 * O CONTRATO DA REGRA DE DERIVAÇÃO — Item 2.2A.
 *
 * @metodo Arquitetura §10.5 — autoridade e governança da regra (bloqueador B5)
 * @metodo ADR-066 §14 — a proposta guarda o identificador e a versão da regra
 * @metodo Congelamento I-7 — histórico imutável: alterar é versionar
 *
 * Por que existe: a v1.0 descrevia a forma da regra sem dizer quem responde por
 * ela. A frase do §10.5 é o pacote inteiro — "uma regra sem dono é a pior forma
 * de automação: ninguém a propôs, ninguém a aprovou, ninguém pode suspendê-la,
 * e, quando errar, ninguém responde".
 *
 * ESTE ARQUIVO É TIPO, E SÓ. Nenhuma função de acesso, nenhum cliente, nenhuma
 * emissão. Ele descreve a forma da estrutura criada pela migration
 * 20260805170000 para que quem um dia abrir a escrita não precise redescobri-la
 * — e para que a divergência entre banco e código apareça em `tsc`.
 *
 * INÉRCIA POR DESENHO. A estrutura existe; nada a alcança. RLS habilitada com
 * ZERO políticas e nenhum grant a papel de aplicação — nem `service_role` lê.
 * Nenhuma proposta pode nascer daqui porque daqui não nasce nada.
 *
 * O nome físico da tabela não aparece neste arquivo, pelo mesmo motivo da 2.1:
 * a prova de que nenhum módulo de `src/` alcança a estrutura vale mais do que a
 * conveniência de repetir o nome. Quem abrir a escrita atravessa essa fronteira
 * explicitamente.
 *
 * Puro: sem React, sem banco, sem execução.
 */

/**
 * Os quatro estados do §10.5. Lista fechada.
 *
 * `PROPOSTA` é onde toda regra nasce: alguém sugeriu, ninguém aprovou ainda.
 * `VIGENTE` exige a Autoridade de Método e uma ADR — e o banco recusa a
 * transição sem as duas, por CHECK, não por convenção.
 * `SUSPENSA` é reversível e pode ser ato do Curador do Case (§5.4 condição 7);
 * `REVOGADA` é da Autoridade, por ADR, e não volta.
 */
export const ESTADOS_DA_REGRA = ["PROPOSTA", "VIGENTE", "SUSPENSA", "REVOGADA"] as const;

export type EstadoDaRegra = (typeof ESTADOS_DA_REGRA)[number];

/** Onde toda regra nasce — sugerida, ainda sem dono que responda por ela. */
export const ESTADO_INICIAL_DA_REGRA: EstadoDaRegra = "PROPOSTA";

/** Fora da vigência, não propõe (§10.5). */
export type VigenciaDaRegra = {
  readonly inicio: string | null;
  readonly fim: string | null;
};

/**
 * Quem sugeriu e quem respondeu — duas pessoas diferentes por desenho.
 *
 * Propor é de qualquer papel interno; aprovar é da **Autoridade de Método sobre
 * Regras de Derivação**, que o §10.5 define como função de governança, nunca
 * posto de trabalho: "quem a exerce é decisão do Fundador, não desta
 * arquitetura".
 *
 * `aprovadaPor` e `adrDeAprovacao` são nulos enquanto a regra é só proposta —
 * e é justamente isso que o banco exige preencher antes de deixá-la vigorar.
 */
export type AutoridadeDaRegra = {
  readonly propostaPor: string;
  readonly aprovadaPor: string | null;
  /** A ADR que aprovou. Sem ela, aprovação é opinião. */
  readonly adrDeAprovacao: string | null;
};

/**
 * Uma versão da regra, como o domínio a lê.
 *
 * `readonly` em tudo não é estilo: o §10.5 e a I-7 exigem histórico append-only.
 * Alterar uma regra é criar VERSÃO NOVA — a anterior permanece legível. Quem
 * tentar reescrever um campo cai em `tsc`, antes de chegar ao banco.
 */
export type VersaoDaRegra = {
  /** Identificador estável, nunca reutilizado. */
  readonly identificador: string;
  /** A proposta guarda a versão que a gerou (ADR-066 §14.9). */
  readonly versao: number;
  readonly estado: EstadoDaRegra;
  readonly vigencia: VigenciaDaRegra;
  readonly autoridade: AutoridadeDaRegra;
  /** Por que a regra existe. */
  readonly justificativa: string;
  /**
   * O que a sustenta. Hoje a resposta honesta pode ser "nenhuma operação real"
   * (§10.5) — a Rede real não existe (RI10), e declarar a ausência é melhor do
   * que fabricar evidência.
   */
  readonly evidencia: string;
  /** Quando deixou de valer. */
  readonly encerradaEm: string | null;
  readonly criadaEm: string;
};

/**
 * A condição que o banco impõe (constraint `..._vigente_exige_autoridade`).
 *
 * Existe aqui para que a mesma verdade possa ser lida sem ir ao banco — nunca
 * para substituí-la. A autoridade real é o CHECK: esta função não é chamada por
 * ninguém que escreva, porque ninguém escreve.
 */
export function podeVigorar(versao: VersaoDaRegra): boolean {
  return (
    versao.autoridade.aprovadaPor !== null &&
    versao.autoridade.adrDeAprovacao !== null &&
    versao.vigencia.inicio !== null
  );
}

/** Estado que já não propõe — por fim de vigência, suspensão ou revogação. */
export function deixouDeValer(estado: EstadoDaRegra): boolean {
  return estado === "SUSPENSA" || estado === "REVOGADA";
}
