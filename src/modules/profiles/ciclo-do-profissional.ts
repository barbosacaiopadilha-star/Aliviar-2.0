/**
 * O CICLO DE VIDA DO PROFISSIONAL — puro, sem I/O.
 *
 * O ciclo era um toggle binário sem memória: `status` virava `inativo` e
 * pronto. Não dava para saber se a pessoa tinha pedido uma pausa, se havia um
 * impedimento regulatório ou se ela simplesmente encerrou a atuação — e as três
 * coisas exigem atos diferentes de quem cuida da Rede.
 *
 * São quatro estados e seis passagens. Toda passagem tem motivo de vocabulário
 * fechado, autor e instante — e a trilha vai para `audit_logs`, gravada pelo
 * banco, não por quem opera.
 *
 * ⛔ **Este módulo não decide publicação.** As exigências de publicar — CRM/UF,
 * registro regular, área verificada, sem divergência crítica, não-DEMO — vivem
 * em `assert_publication_requirements` desde a migration `20260727071000`, e
 * continuam lá. Duplicá-las aqui criaria duas verdades sobre a mesma porta.
 *
 * A matriz abaixo é espelho de `curadoria.motivos_da_transicao`. Um teste
 * compara as duas caso a caso: se divergirem, a interface ofereceria um motivo
 * que o banco recusa — e o Admin descobriria isso no meio do ato.
 */

export const CICLOS = ["PREPARACAO", "PUBLICADO_ATIVO", "PAUSADO", "RETIRADO_ARQUIVADO"] as const;
export type CicloDoProfissional = (typeof CICLOS)[number];

export const MOTIVOS = [
  "CADASTRO_VALIDADO",
  "REATIVACAO_VALIDADA",
  "INDISPONIBILIDADE_TEMPORARIA",
  "REVISAO_CADASTRAL",
  "ENCERRAMENTO_DA_ATUACAO",
  "IMPEDIMENTO_REGULATORIO",
  "DIVERGENCIA_CRITICA",
  "RETORNO_SOLICITADO",
  "REGULARIZACAO_CONCLUIDA",
  "REVISAO_CONCLUIDA",
  "SOLICITACAO_DO_PROFISSIONAL",
  "OUTRO",
] as const;
export type MotivoDoCiclo = (typeof MOTIVOS)[number];

/** O motivo é código; isto é o que a pessoa lê. */
export const ROTULO_DO_CICLO: Record<CicloDoProfissional, string> = {
  PREPARACAO: "Em preparação",
  PUBLICADO_ATIVO: "Publicado e ativo",
  PAUSADO: "Pausado",
  RETIRADO_ARQUIVADO: "Retirado da rede",
};

export const ROTULO_DO_MOTIVO: Record<MotivoDoCiclo, string> = {
  CADASTRO_VALIDADO: "Cadastro validado",
  REATIVACAO_VALIDADA: "Reativação validada",
  INDISPONIBILIDADE_TEMPORARIA: "Indisponibilidade temporária",
  REVISAO_CADASTRAL: "Revisão cadastral",
  ENCERRAMENTO_DA_ATUACAO: "Encerramento da atuação",
  IMPEDIMENTO_REGULATORIO: "Impedimento regulatório",
  DIVERGENCIA_CRITICA: "Divergência crítica",
  RETORNO_SOLICITADO: "Retorno solicitado",
  REGULARIZACAO_CONCLUIDA: "Regularização concluída",
  REVISAO_CONCLUIDA: "Revisão concluída",
  SOLICITACAO_DO_PROFISSIONAL: "Solicitação do profissional",
  OUTRO: "Outro",
};

/**
 * AS SEIS PASSAGENS PERMITIDAS, com os motivos que cabem em cada uma.
 *
 * O que **não** está aqui é proibido — inclusive, e principalmente,
 * `RETIRADO_ARQUIVADO → PUBLICADO_ATIVO`. Quem foi arquivado volta por
 * `PREPARACAO`, onde as verificações de publicação são feitas de novo. Voltar
 * direto seria reentrar na Rede sem que ninguém tornasse a olhar.
 */
export const TRANSICOES: ReadonlyArray<{
  de: CicloDoProfissional;
  para: CicloDoProfissional;
  motivos: readonly MotivoDoCiclo[];
}> = [
  { de: "PREPARACAO", para: "PUBLICADO_ATIVO", motivos: ["CADASTRO_VALIDADO", "REATIVACAO_VALIDADA"] },
  { de: "PAUSADO", para: "PUBLICADO_ATIVO", motivos: ["CADASTRO_VALIDADO", "REATIVACAO_VALIDADA"] },
  {
    de: "PUBLICADO_ATIVO",
    para: "PAUSADO",
    motivos: ["INDISPONIBILIDADE_TEMPORARIA", "REVISAO_CADASTRAL", "SOLICITACAO_DO_PROFISSIONAL", "OUTRO"],
  },
  {
    de: "PUBLICADO_ATIVO",
    para: "RETIRADO_ARQUIVADO",
    motivos: ["ENCERRAMENTO_DA_ATUACAO", "SOLICITACAO_DO_PROFISSIONAL", "IMPEDIMENTO_REGULATORIO", "DIVERGENCIA_CRITICA", "OUTRO"],
  },
  {
    de: "PAUSADO",
    para: "RETIRADO_ARQUIVADO",
    motivos: ["ENCERRAMENTO_DA_ATUACAO", "SOLICITACAO_DO_PROFISSIONAL", "IMPEDIMENTO_REGULATORIO", "DIVERGENCIA_CRITICA", "OUTRO"],
  },
  {
    de: "RETIRADO_ARQUIVADO",
    para: "PREPARACAO",
    motivos: ["RETORNO_SOLICITADO", "REGULARIZACAO_CONCLUIDA", "REVISAO_CONCLUIDA", "OUTRO"],
  },
];

export function motivosDaTransicao(
  de: CicloDoProfissional,
  para: CicloDoProfissional,
): readonly MotivoDoCiclo[] {
  return TRANSICOES.find((t) => t.de === de && t.para === para)?.motivos ?? [];
}

/**
 * Para onde dá para ir a partir daqui. A interface oferece exatamente isto —
 * nem um destino a mais —, para que a recusa não seja uma surpresa depois do
 * clique. Legado sem ciclo não vai a lugar nenhum: a revisão vem antes.
 */
export function destinosPossiveis(de: CicloDoProfissional | null): CicloDoProfissional[] {
  if (de === null) return [];
  return TRANSICOES.filter((t) => t.de === de).map((t) => t.para);
}

export function transicaoPermitida(de: CicloDoProfissional, para: CicloDoProfissional): boolean {
  return motivosDaTransicao(de, para).length > 0;
}

export const NOTA_MINIMA = 10;
export const NOTA_MAXIMA = 280;

export type PedidoDeTransicao = {
  de: CicloDoProfissional | null;
  para: CicloDoProfissional;
  motivo: MotivoDoCiclo | null;
  nota: string | null;
  autorId: string | null;
  quando: string | null;
  /** Vem da fonte canônica de `connection_records`, nunca de uma segunda definição. */
  temConexaoAtiva: boolean;
};

export type Recusa = { ok: false; mensagem: string };
export type Aceite = { ok: true };
export type Veredito = Aceite | Recusa;

/**
 * A MESMA RÉGUA DO BANCO, dita antes do envio.
 *
 * O trigger é a verdade — sobrevive a qualquer writer futuro, inclusive um que
 * ainda não existe. Isto aqui é a explicação: nomeia o que falta enquanto a
 * pessoa ainda está na tela, em vez de devolver um erro depois do clique.
 */
export function avaliarTransicao(pedido: PedidoDeTransicao): Veredito {
  if (pedido.de === null) {
    return {
      ok: false,
      mensagem:
        "Este cadastro é legado sem ciclo classificado. A revisão registra o estado com motivo e autoria antes de qualquer transição.",
    };
  }

  if (!transicaoPermitida(pedido.de, pedido.para)) {
    return {
      ok: false,
      mensagem: `Transição de ciclo não permitida: ${ROTULO_DO_CICLO[pedido.de]} para ${ROTULO_DO_CICLO[pedido.para]}.`,
    };
  }

  if (pedido.motivo === null) {
    return { ok: false, mensagem: "Toda mudança de ciclo exige um motivo." };
  }

  if (!motivosDaTransicao(pedido.de, pedido.para).includes(pedido.motivo)) {
    return {
      ok: false,
      mensagem: `O motivo "${ROTULO_DO_MOTIVO[pedido.motivo]}" não vale para esta transição.`,
    };
  }

  if (pedido.motivo === "OUTRO") {
    const nota = (pedido.nota ?? "").trim();
    if (nota.length < NOTA_MINIMA) {
      return {
        ok: false,
        mensagem: `Quando o motivo é Outro, escreva o que aconteceu — pelo menos ${NOTA_MINIMA} caracteres.`,
      };
    }
    if (nota.length > NOTA_MAXIMA) {
      return { ok: false, mensagem: `A nota do motivo tem no máximo ${NOTA_MAXIMA} caracteres.` };
    }
  }

  if (pedido.autorId === null) {
    return { ok: false, mensagem: "Toda mudança de ciclo tem autor." };
  }

  if (pedido.quando === null) {
    return { ok: false, mensagem: "Toda mudança de ciclo tem data própria." };
  }

  // Guarda 11 (D5). A pausa não é bloqueada de propósito: ela tira das
  // composições novas e preserva o acompanhamento em curso.
  if (pedido.para === "RETIRADO_ARQUIVADO" && pedido.temConexaoAtiva) {
    return {
      ok: false,
      mensagem: "Este profissional tem acompanhamento em curso. Encerre ou substitua antes de retirar da rede.",
    };
  }

  return { ok: true };
}

/**
 * ELEGIBILIDADE EFETIVA — **espelho** de `curadoria.elegibilidade_do_profissional`.
 *
 * ⚠️ A autoridade é o SQL. Esta função existe para que a interface possa
 * decidir sem uma ida ao banco por linha, e **nada mais**. Se as duas
 * divergirem, o teste de paridade falha nomeando a combinação — foi exatamente
 * uma divergência dessas (selo lendo o ciclo, Mesa lendo os campos antigos) que
 * reprovou o Corte 7.
 *
 * A ordem dos motivos não é estética: primeiro o que é absoluto (demo, fixture),
 * depois o estado, por último o que é corrigível. É a ordem em que a pessoa
 * precisa ouvir.
 */
export type FatosDeElegibilidade = {
  ciclo: CicloDoProfissional | null;
  isDemo: boolean;
  isTestFixture: boolean;
  /** Divergências críticas em aberto. Ausente conta como zero. */
  divergenciasCriticas?: number;
};

/** Os mesmos códigos que o predicado SQL devolve em `reason_code`. */
export type CodigoDeElegibilidade =
  | "ELEGIVEL"
  | "DEMO"
  | "FIXTURE"
  | "LEGADO_NAO_CLASSIFICADO"
  | "DIVERGENCIA_CRITICA"
  | CicloDoProfissional;

export type Elegibilidade = {
  elegivel: boolean;
  /** Por que não, em português. Vazio quando elegível. */
  motivo: string | null;
  /** O mesmo código do SQL — é por ele que a paridade é comparada. */
  codigo: CodigoDeElegibilidade;
  /** Tudo o que bloqueia, não só o primeiro. */
  bloqueios: string[];
};

export const ROTULO_DO_BLOQUEIO = {
  DEMO: "Perfil de demonstração",
  FIXTURE: "Perfil de teste",
  LEGADO_NAO_CLASSIFICADO: "Legado sem ciclo classificado",
  DIVERGENCIA_CRITICA: "Divergência crítica em aberto",
} as const;

export function elegibilidadeEfetiva(fatos: FatosDeElegibilidade): Elegibilidade {
  const criticas = fatos.divergenciasCriticas ?? 0;

  const bloqueios: string[] = [];
  if (fatos.isDemo) bloqueios.push(ROTULO_DO_BLOQUEIO.DEMO);
  if (fatos.isTestFixture) bloqueios.push(ROTULO_DO_BLOQUEIO.FIXTURE);
  if (fatos.ciclo === null) bloqueios.push(ROTULO_DO_BLOQUEIO.LEGADO_NAO_CLASSIFICADO);
  if (fatos.ciclo !== null && fatos.ciclo !== "PUBLICADO_ATIVO") {
    bloqueios.push(`Ciclo em ${fatos.ciclo}`);
  }
  if (criticas > 0) bloqueios.push(ROTULO_DO_BLOQUEIO.DIVERGENCIA_CRITICA);

  const elegivel =
    !fatos.isDemo && !fatos.isTestFixture && fatos.ciclo === "PUBLICADO_ATIVO" && criticas === 0;

  if (fatos.isDemo) {
    return { elegivel, motivo: ROTULO_DO_BLOQUEIO.DEMO, codigo: "DEMO", bloqueios };
  }
  if (fatos.isTestFixture) {
    return { elegivel, motivo: ROTULO_DO_BLOQUEIO.FIXTURE, codigo: "FIXTURE", bloqueios };
  }
  if (fatos.ciclo === null) {
    return {
      elegivel,
      motivo: "Legado sem ciclo classificado — pendente de revisão",
      codigo: "LEGADO_NAO_CLASSIFICADO",
      bloqueios,
    };
  }
  if (fatos.ciclo !== "PUBLICADO_ATIVO") {
    return { elegivel, motivo: ROTULO_DO_CICLO[fatos.ciclo], codigo: fatos.ciclo, bloqueios };
  }
  if (criticas > 0) {
    return {
      elegivel,
      motivo: ROTULO_DO_BLOQUEIO.DIVERGENCIA_CRITICA,
      codigo: "DIVERGENCIA_CRITICA",
      bloqueios,
    };
  }
  return { elegivel: true, motivo: null, codigo: "ELEGIVEL", bloqueios };
}

/**
 * A PRÉVIA DE IMPACTO — o que muda se esta transição acontecer.
 *
 * Mostrada **antes** da confirmação. Não é aviso genérico: cada linha é uma
 * consequência que a pessoa pode conferir depois. E há uma que precisa ser dita
 * sempre, porque é a que mais assusta: **relatório entregue não muda**.
 */
export type ImpactoDaTransicao = {
  /** Impede a transição. Quando presente, a confirmação nem é oferecida. */
  bloqueio: string | null;
  consequencias: string[];
  preservado: string[];
};

export function preverImpacto(pedido: {
  de: CicloDoProfissional;
  para: CicloDoProfissional;
  conexoesAtivas: number;
}): ImpactoDaTransicao {
  const preservado = [
    "Relatórios já emitidos e entregues permanecem exatamente como estão.",
    "Seleções e Curadorias anteriores não são alteradas.",
  ];

  if (pedido.para === "RETIRADO_ARQUIVADO" && pedido.conexoesAtivas > 0) {
    return {
      bloqueio:
        pedido.conexoesAtivas === 1
          ? "Há 1 acompanhamento em curso com este profissional. Encerre ou substitua antes de retirar da rede."
          : `Há ${pedido.conexoesAtivas} acompanhamentos em curso com este profissional. Encerre ou substitua antes de retirar da rede.`,
      consequencias: [],
      preservado,
    };
  }

  if (pedido.para === "PUBLICADO_ATIVO") {
    return {
      bloqueio: null,
      consequencias: [
        "Passa a aparecer na Rede e pode entrar em novas Curadorias.",
        "As exigências de publicação são verificadas de novo no momento da gravação.",
      ],
      preservado,
    };
  }

  if (pedido.para === "PAUSADO") {
    return {
      bloqueio: null,
      consequencias: [
        "Sai das próximas composições — não entra em Curadoria nova.",
        "Acompanhamentos em curso continuam normalmente.",
      ],
      preservado,
    };
  }

  if (pedido.para === "RETIRADO_ARQUIVADO") {
    return {
      bloqueio: null,
      consequencias: [
        "Sai das próximas composições — não entra em Curadoria nova.",
        "Para voltar à Rede, passa antes por preparação e nova publicação.",
      ],
      preservado,
    };
  }

  return {
    bloqueio: null,
    consequencias: [
      "Volta para preparação e sai da Rede.",
      "Publicar de novo exige passar outra vez pelas verificações.",
    ],
    preservado,
  };
}
