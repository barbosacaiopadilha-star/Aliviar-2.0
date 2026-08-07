import { CATALOGO_GERADO } from "./catalogo-gerado";
import type {
  FichaDeExplicacao,
  GrauDeConfianca,
  MotivoDeNaoInfluencia,
  NaturezaDeLacuna,
} from "./ficha-de-explicacao";

/**
 * OS TRÊS VOCABULÁRIOS DA FICHA — Arquitetura §11.5.
 *
 * A mesma Ficha, três linguagens. Não são três verdades: é uma verdade dita
 * três vezes, para quem precisa auditar, para quem precisa explicar e para
 * quem precisa entender.
 *
 * A regra de cada resposta mora na Ficha (§11.2). Aqui só se traduz — nenhum
 * adaptador recalcula lacuna, confiança ou correspondência, porque três cópias
 * da mesma regra divergem em silêncio.
 *
 * @metodo §11.5 — Mesa técnica · Relatório verbalizado · paciente sem mecanismo
 * @metodo I-5 — confiança é sobre a INFORMAÇÃO, nunca sobre a pessoa
 */

const NOME_DO_CONCEITO = new Map(CATALOGO_GERADO.map((c) => [c.code, c.name]));

function nome(code: string): string {
  return NOME_DO_CONCEITO.get(code) ?? code;
}

// ---------------------------------------------------------------------------
// Mesa do Curador — técnico completo
// ---------------------------------------------------------------------------

export type FichaNaMesa = {
  readonly profissional: string;
  readonly porQueFoiEscolhida: readonly string[];
  readonly porQueNestaPosicao: string;
  readonly criteriosQueInfluenciaram: readonly string[];
  readonly criteriosQueNaoInfluenciaram: readonly string[];
  readonly lacunas: readonly string[];
  readonly grauDeConfianca: string;
  readonly proveniencia: readonly string[];
};

/**
 * A SUPRESSÃO NOMEADA (§13/§20). Afirmação bloqueada não some em silêncio e
 * não ganha texto de reserva: a superfície recebe UMA linha dizendo que aquela
 * afirmação específica não é exibível. O detalhe técnico (conceito, motivo,
 * contradição) vive em `ResultadoDaFicha.bloqueios`, que a Mesa/Auditoria leem
 * ao lado — a paciente nunca.
 */
const AFIRMACAO_SUPRIMIDA_MESA = "AFIRMACAO_NAO_EXIBIVEL — ver bloqueios da leitura" as const;

export function paraMesa(ficha: FichaDeExplicacao): FichaNaMesa {
  const r = ficha.respostas;
  const s = ficha.status;
  return {
    profissional: ficha.professionalProfileId,
    // "MODELO_COMUNICACAO · ESSENCIAL × CONFIRMADO → ALTA" (§11.5)
    porQueFoiEscolhida: s.R1.exibivel
      ? r.porQueFoiEscolhida.map(
          (c) => `${c.subcriterionCode} · ${c.degreeDela} × ${c.estadoDele} → ${c.resultado}`,
        )
      : [AFIRMACAO_SUPRIMIDA_MESA],
    porQueNestaPosicao:
      "Não há posição. A ordem é a neutra da Rede e não afirma nada sobre ninguém.",
    criteriosQueInfluenciaram: s.R3.exibivel
      ? r.criteriosQueInfluenciaram.map((c) => `${c.subcriterionCode} → ${c.resultado}`)
      : [AFIRMACAO_SUPRIMIDA_MESA],
    criteriosQueNaoInfluenciaram: r.criteriosQueNaoInfluenciaram.map(
      (c) => `${c.subcriterionCode} · ${c.motivo}`,
    ),
    lacunas: s.R5.exibivel
      ? r.lacunas.map((l) => `${l.subcriterionCode} · ${l.natureza}`)
      : [AFIRMACAO_SUPRIMIDA_MESA],
    grauDeConfianca: s.R6.exibivel ? r.grauDeConfianca : AFIRMACAO_SUPRIMIDA_MESA,
    // A árvore do §11.4, sem prosa: identificadores, versões, autores, datas —
    // lida DIRETO das cadeias canônicas que a Ficha carrega (A2). Nenhum fato
    // é copiado para um segundo formato antes de virar linha.
    proveniencia: ficha.cadeias.map((c) => {
      const f = c.fatos;
      const origem = f.declaracao
        ? `${c.subcriterionCode} ← case_needs(${f.declaracao.degree}, ${f.declaracao.declaredAt ?? "sem data"}, ${f.declaracao.declaredBy ?? "anterior ao regime de autoria"})`
        : `${c.subcriterionCode} ← (sem declaração original)`;
      const regra = f.proposta
        ? ` ← regra ${f.proposta.ruleId} v${f.proposta.ruleVersion} ← proposta ${f.proposta.propostaId}`
        : " ← declaração direta do Curador (sem regra)";
      const evidencia = f.evidencia
        ? ` ⇄ evidência v${f.evidencia.version} (${f.evidencia.sourceTier} · ${f.evidencia.source})`
        : "";
      return `${origem}${regra}${evidencia}`;
    }),
  };
}

// ---------------------------------------------------------------------------
// Relatório — verbalização com proveniência
// ---------------------------------------------------------------------------

const MOTIVO_VERBALIZADO: Record<MotivoDeNaoInfluencia, string> = {
  FORA_DO_MOTOR_POR_METODO: "fica fora da leitura automática por decisão de Método",
  SEM_IMPORTANCIA_DECLARADA_PELO_CASE: "ainda não foi classificado neste caso",
  GRAU_SEM_PREFERENCIA: "foi classificado como sem preferência",
};

const LACUNA_VERBALIZADA: Record<NaturezaDeLacuna, string> = {
  NINGUEM_OLHOU: "ainda não foi levantado no cadastro do profissional",
  OLHARAM_E_NAO_SOUBERAM: "foi analisado e não há informação suficiente disponível",
  EVIDENCIA_VENCIDA: "tem informação registrada, mas ela precisa ser reconfirmada",
  JUIZO_HUMANO_PENDENTE: "depende de uma leitura humana ainda não feita",
  DIVERGENCIA_ABERTA: "tem uma divergência em aberto, ainda não resolvida",
};

const CONFIANCA_VERBALIZADA: Record<GrauDeConfianca, string> = {
  LEITURA_COMPLETA: "A leitura deste profissional está completa para o que foi classificado.",
  LEITURA_COM_LACUNAS:
    "A leitura tem lacunas, listadas uma a uma. Lacuna é informação que falta no cadastro, não defeito de quem é lido.",
  LEITURA_INSUFICIENTE:
    "A leitura ainda não alcança o que foi classificado como essencial. O caminho é verificar o cadastro.",
};

export type FichaNoRelatorio = {
  readonly porQueFoiEscolhida: readonly string[];
  readonly porQueNestaPosicao: string;
  readonly criteriosQueInfluenciaram: readonly string[];
  readonly criteriosQueNaoInfluenciaram: readonly string[];
  readonly lacunas: readonly string[];
  readonly grauDeConfianca: string;
};

const AFIRMACAO_SUPRIMIDA_RELATORIO =
  "Esta parte ainda não pode ser exibida: a proveniência que a sustentaria está incompleta ou incoerente.";

export function paraRelatorio(ficha: FichaDeExplicacao): FichaNoRelatorio {
  const r = ficha.respostas;
  const s = ficha.status;
  // A regra vem da cadeia canônica — `fatos.proposta` é `null` no caminho
  // manual, e a frase diz "declarada pelo Curador" em vez de citar regra.
  const regraPorConceito = new Map(
    ficha.cadeias.map((c) => [c.subcriterionCode, c.fatos.proposta]),
  );

  return {
    porQueFoiEscolhida: s.R1.exibivel
      ? r.porQueFoiEscolhida.map((c) => {
          const regra = regraPorConceito.get(c.subcriterionCode);
          const origem = regra
            ? ` A classificação veio da regra ${regra.ruleId}, versão ${regra.ruleVersion}.`
            : " A classificação foi declarada pelo Curador.";
          return `${nome(c.subcriterionCode)} foi classificado neste caso, e este profissional tem a característica registrada.${origem}`;
        })
      : [AFIRMACAO_SUPRIMIDA_RELATORIO],
    porQueNestaPosicao:
      "Não há posição: a ordem em que os profissionais aparecem não afirma nada sobre nenhum deles.",
    criteriosQueInfluenciaram: s.R3.exibivel
      ? r.criteriosQueInfluenciaram.map((c) => `${nome(c.subcriterionCode)} entrou na leitura.`)
      : [AFIRMACAO_SUPRIMIDA_RELATORIO],
    criteriosQueNaoInfluenciaram: r.criteriosQueNaoInfluenciaram.map(
      (c) => `${nome(c.subcriterionCode)} não entrou na leitura: ${MOTIVO_VERBALIZADO[c.motivo]}.`,
    ),
    lacunas: s.R5.exibivel
      ? r.lacunas.map((l) => `${nome(l.subcriterionCode)} ${LACUNA_VERBALIZADA[l.natureza]}.`)
      : [AFIRMACAO_SUPRIMIDA_RELATORIO],
    grauDeConfianca: s.R6.exibivel
      ? CONFIANCA_VERBALIZADA[r.grauDeConfianca]
      : AFIRMACAO_SUPRIMIDA_RELATORIO,
  };
}

// ---------------------------------------------------------------------------
// Paciente — explicação, nunca mecanismo
// ---------------------------------------------------------------------------

const CONFIANCA_PARA_PACIENTE: Record<GrauDeConfianca, string> = {
  LEITURA_COMPLETA: "Tudo o que você indicou como importante tem resposta registrada.",
  LEITURA_COM_LACUNAS:
    "Algumas coisas que você indicou ainda não têm resposta registrada. Elas estão listadas para você saber o que perguntar.",
  LEITURA_INSUFICIENTE:
    "Ainda faltam respostas sobre o que você indicou como mais importante. A equipe vai buscar essas informações.",
};

export type FichaParaPaciente = {
  readonly porQueApareceu: readonly string[];
  readonly sobreAOrdem: string;
  readonly oQueFoiConsiderado: readonly string[];
  readonly oQueNaoFoiConsiderado: readonly string[];
  readonly oQueAindaFalta: readonly string[];
  readonly sobreAsInformacoes: string;
};

/**
 * A paciente recebe explicação, não mecanismo. Aqui não entram: código de
 * conceito, identificador de regra, versão, nome de estado interno, resultado
 * nomeado, contagem ou qualquer termo de `PATIENT_FORBIDDEN_TERMS`.
 *
 * O que sobra é o que ela pode usar: o que ela disse ser importante, o que o
 * profissional respondeu sobre isso, e o que ainda não se sabe.
 */
export function paraPaciente(ficha: FichaDeExplicacao): FichaParaPaciente {
  const r = ficha.respostas;
  const s = ficha.status;
  return {
    porQueApareceu: (s.R1.exibivel ? r.porQueFoiEscolhida : []).map(
      (c) =>
        `Você indicou que ${nome(c.subcriterionCode).toLowerCase()} é importante para você, e este profissional tem isso registrado.`,
    ),
    sobreAOrdem:
      "A ordem em que os profissionais aparecem não quer dizer nada. Nenhum está à frente do outro.",
    oQueFoiConsiderado: (s.R3.exibivel ? r.criteriosQueInfluenciaram : []).map(
      (c) => `${nome(c.subcriterionCode)}, que você indicou.`,
    ),
    oQueNaoFoiConsiderado: r.criteriosQueNaoInfluenciaram
      // À paciente interessa o que ELA deixou de fora ou o que o Método não
      // avalia — não o inventário do que o caso ainda não classificou.
      .filter((c) => c.motivo !== "SEM_IMPORTANCIA_DECLARADA_PELO_CASE")
      .map((c) =>
        c.motivo === "GRAU_SEM_PREFERENCIA"
          ? `${nome(c.subcriterionCode)}, porque você disse que não faz diferença para você.`
          : `${nome(c.subcriterionCode)}, porque isso é conversado com você, não decidido por comparação.`,
      ),
    oQueAindaFalta: (s.R5.exibivel ? r.lacunas : []).map(
      (l) => `${nome(l.subcriterionCode)}: ${LACUNA_PARA_PACIENTE[l.natureza]}`,
    ),
    sobreAsInformacoes: s.R6.exibivel
      ? CONFIANCA_PARA_PACIENTE[r.grauDeConfianca]
      : "Parte das informações desta leitura ainda não pode ser mostrada.",
  };
}

const LACUNA_PARA_PACIENTE: Record<NaturezaDeLacuna, string> = {
  NINGUEM_OLHOU: "ainda não temos essa informação. Vale perguntar na conversa.",
  OLHARAM_E_NAO_SOUBERAM: "perguntamos e ainda não há uma resposta registrada.",
  EVIDENCIA_VENCIDA: "temos uma informação antiga, que precisa ser confirmada de novo.",
  JUIZO_HUMANO_PENDENTE: "isso é conversado com você, e a conversa ainda não aconteceu.",
  DIVERGENCIA_ABERTA: "há um ponto em aberto que a equipe ainda está esclarecendo.",
};
