/**
 * A BIBLIOTECA DETERMINÍSTICA DE REDAÇÃO do Juízo do Curador.
 *
 * @metodo CONTRATO_BIBLIOTECA_DE_REDACAO v1.0 §2–§6, §10
 * @metodo ADR-067 §8.3 — técnico nunca fala de relação; relacional nunca
 *         fala de mérito
 * @metodo G-2.3-5 (emendada 2026-08-09) — alternativa de redação pedida pelo
 *         Curador, exibida FORA do campo e inserida só por ato dele, não é
 *         pré-preenchimento
 *
 * Vinte e quatro textos canônicos — quatro situações × seis conceitos —
 * escritos por pessoas, versionados em Git e **cegos ao caso**: nunca recebem
 * Case, profissional, evidência ou paciente. Não há prompt, não há
 * fornecedor, não há rede, não há latência e não há saída a validar.
 *
 * "Aponta, nunca copia" fica preservada POR CONSTRUÇÃO: um texto que nunca
 * viu a evidência não tem como transcrevê-la. O Curador contextualiza
 * editando — e só o texto final do campo vira ato.
 *
 * Dado declarativo puro: sem React, sem banco, sem rede, sem condicional
 * espalhada na UI.
 */

/** O limite REAL do textarea da conclusão (painel-de-juizo.tsx). */
export const LIMITE_DE_CARACTERES = 280;

/**
 * A união FECHADA dos seis conceitos com biblioteca. `AREA` não é membro
 * deste tipo — a sua ausência é erro de compilação, não teste esquecido.
 */
export type ConceitoElegivel =
  | "FORMACAO"
  | "EXPERIENCIA"
  | "HISTORICO"
  | "MODELO_DECISAO_COMPARTILHADA"
  | "MODELO_PREFERENCIAS_E_RESTRICOES"
  | "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS";

/**
 * As quatro situações do julgamento — as MESMAS nos seis conceitos. O eixo é
 * a situação em que o Curador se encontra, nunca o tom do texto: consistência
 * entre cartões vale mais do que taxonomia própria por conceito.
 */
export type SituacaoDoJulgamento =
  | "ELEMENTOS_SUFICIENTES"
  | "ELEMENTOS_PARCIAIS"
  | "INFORMACAO_INSUFICIENTE"
  | "COM_RESSALVA";

export const SITUACOES: readonly SituacaoDoJulgamento[] = [
  "ELEMENTOS_SUFICIENTES",
  "ELEMENTOS_PARCIAIS",
  "INFORMACAO_INSUFICIENTE",
  "COM_RESSALVA",
];

/** O título de cada situação na interface (contrato §2). */
export const TITULO_DA_SITUACAO: Record<SituacaoDoJulgamento, string> = {
  ELEMENTOS_SUFICIENTES: "Elementos suficientes",
  ELEMENTOS_PARCIAIS: "Elementos parciais",
  INFORMACAO_INSUFICIENTE: "Informação insuficiente",
  COM_RESSALVA: "Com ressalva",
};

export type ModeloDeRedacao = {
  /** Estável e legível — usado como chave de render, nunca persistido. */
  id: string;
  situacao: SituacaoDoJulgamento;
  /** ≤ 280 caracteres. Transcrição literal do contrato §3. */
  texto: string;
};

/**
 * Os 24 textos canônicos, transcritos LITERALMENTE do contrato §3. Nenhuma
 * paráfrase, nenhum texto novo, nenhuma frase universal cruzando naturezas —
 * as bibliotecas são separadas por natureza e não compartilham texto.
 *
 * A QUARTA opção de cada conceito não é decoração: é onde mora o risco
 * daquele conceito (contrato §3.7). Editá-la sem lavratura é remover a guarda
 * que impede a leitura fácil e errada.
 */
export const MODELOS_DE_REDACAO: Record<ConceitoElegivel, readonly ModeloDeRedacao[]> = {
  // ---------------------------------------------------------------- TÉCNICO
  FORMACAO: [
    {
      id: "formacao-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      texto:
        "A formação está documentada nos registros referenciados e é pertinente ao aspecto avaliado. Concluo com base neles.",
    },
    {
      id: "formacao-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "Há formação documentada, mas parte dos registros não cobre o período ou o escopo necessários. Concluo com essa limitação à vista.",
    },
    {
      id: "formacao-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "A documentação disponível não permite firmar conclusão sobre a formação neste momento. A ausência de registro não afirma ausência de formação.",
    },
    {
      id: "formacao-ressalva",
      situacao: "COM_RESSALVA",
      texto:
        "A formação consta e é pertinente, mas os elementos disponíveis não sustentam conclusão mais específica para este aspecto.",
    },
  ],

  EXPERIENCIA: [
    {
      id: "experiencia-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      // Guarda do conceito: tempo de prática NÃO é qualidade (contrato §3.7).
      texto:
        "A experiência descrita está documentada e é pertinente ao aspecto avaliado. Concluo pelo que os registros descrevem, não pelo tempo de prática.",
    },
    {
      id: "experiencia-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "Há experiência documentada, e os registros descrevem parte do que este aspecto envolve. Concluo com essa parcialidade declarada.",
    },
    {
      id: "experiencia-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "Os elementos disponíveis não permitem concluir sobre a experiência neste aspecto. A falta de registro não afirma falta de prática.",
    },
    {
      id: "experiencia-ressalva",
      situacao: "COM_RESSALVA",
      texto:
        "A experiência aparece nos registros, e exige leitura cautelosa: o que está descrito não esclarece a extensão nem o contexto da prática.",
    },
  ],

  HISTORICO: [
    {
      id: "historico-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      texto:
        "O histórico está documentado nos registros referenciados e descreve a trajetória de forma suficiente para este aspecto.",
    },
    {
      id: "historico-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "O histórico documentado cobre parte da trajetória. Concluo sobre o que está registrado, sem estender ao período não coberto.",
    },
    {
      id: "historico-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "A informação disponível não permite conclusão específica sobre o histórico. Trajetória não documentada aqui não é trajetória inexistente.",
    },
    {
      id: "historico-ressalva",
      situacao: "COM_RESSALVA",
      // Guarda do conceito: prestígio institucional NÃO é mérito. "vínculos"
      // aqui é vínculo INSTITUCIONAL (onde a trajetória ocorreu), nunca
      // vínculo com a pessoa — ver a nota de natureza no teste.
      texto:
        "O histórico registra vínculos e instituições. Concluo pelo que a trajetória descreve, não pelo nome das instituições em que ocorreu.",
    },
  ],

  // ------------------------------------------------------------- RELACIONAL
  MODELO_DECISAO_COMPARTILHADA: [
    {
      id: "decisao-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      texto:
        "As condutas declaradas descrevem como as decisões são apresentadas e discutidas, e permitem juízo relacional sobre este aspecto.",
    },
    {
      id: "decisao-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "As condutas declaradas descrevem parte de como a decisão é conduzida. Concluo sobre o que foi declarado, sem supor o restante.",
    },
    {
      id: "decisao-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "Não há elementos suficientes para concluir como a decisão é conduzida. A ausência de declaração não afirma ausência da conduta.",
    },
    {
      id: "decisao-ressalva",
      situacao: "COM_RESSALVA",
      texto:
        "As condutas declaradas indicam a forma de conduzir a decisão, e registro que declaração de conduta não é observação de prática.",
    },
  ],

  MODELO_PREFERENCIAS_E_RESTRICOES: [
    {
      id: "preferencias-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      texto:
        "As condutas declaradas descrevem como preferências e restrições da pessoa são acolhidas na prática relatada.",
    },
    {
      id: "preferencias-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "As condutas declaradas cobrem parte do que este aspecto envolve. Concluo sobre o que consta, sem estender às situações não declaradas.",
    },
    {
      id: "preferencias-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "Não há elementos suficientes para concluir sobre o acolhimento de preferências e restrições. A falta de declaração não afirma recusa.",
    },
    {
      id: "preferencias-ressalva",
      situacao: "COM_RESSALVA",
      // Guarda do conceito: intenção declarada NÃO é garantia (contrato §3.7).
      texto:
        "Há condutas declaradas sobre preferências e restrições. Registro que o declarado descreve intenção de conduta, não garantia de como ocorrerá.",
    },
  ],

  MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS: [
    {
      id: "noticias-suficiente",
      situacao: "ELEMENTOS_SUFICIENTES",
      texto:
        "As condutas declaradas descrevem como notícias difíceis são conduzidas, e permitem juízo relacional sobre este aspecto.",
    },
    {
      id: "noticias-parcial",
      situacao: "ELEMENTOS_PARCIAIS",
      texto:
        "As condutas declaradas descrevem parte da condução de notícias difíceis. Concluo sobre o que está descrito, sem supor o restante.",
    },
    {
      id: "noticias-insuficiente",
      situacao: "INFORMACAO_INSUFICIENTE",
      texto:
        "Não há elementos suficientes para concluir sobre a condução de notícias difíceis. A ausência de declaração não afirma ausência da conduta.",
    },
    {
      id: "noticias-ressalva",
      situacao: "COM_RESSALVA",
      // Guarda do conceito: conduta NÃO é disposição pessoal (contrato §3.7).
      texto:
        "As condutas declaradas descrevem o que se faz ao dar uma notícia difícil. Registro que isso descreve conduta, não disposição pessoal.",
    },
  ],
};

/** A natureza de cada conceito, para a conferência de território (§4). */
export const NATUREZA_DO_CONCEITO: Record<ConceitoElegivel, "TECNICO" | "RELACIONAL"> = {
  FORMACAO: "TECNICO",
  EXPERIENCIA: "TECNICO",
  HISTORICO: "TECNICO",
  MODELO_DECISAO_COMPARTILHADA: "RELACIONAL",
  MODELO_PREFERENCIAS_E_RESTRICOES: "RELACIONAL",
  MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS: "RELACIONAL",
};

export const CONCEITOS_COM_BIBLIOTECA = Object.keys(MODELOS_DE_REDACAO) as ConceitoElegivel[];

/**
 * A ÚNICA pergunta que a interface faz: este conceito tem biblioteca? Recebe
 * o código do cartão — nada de Case, profissional, evidência ou paciente.
 */
export function modelosDoConceito(code: string): readonly ModeloDeRedacao[] {
  return MODELOS_DE_REDACAO[code as ConceitoElegivel] ?? [];
}

export function conceitoTemBiblioteca(code: string): code is ConceitoElegivel {
  return Object.prototype.hasOwnProperty.call(MODELOS_DE_REDACAO, code);
}
