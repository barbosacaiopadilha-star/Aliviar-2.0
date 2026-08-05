import type { CadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";

/**
 * O CONTRATO DO RECONHECIMENTO — o que a tela recebe, e de onde vem.
 *
 * @metodo Arquitetura §6.2.1 — reconhecimento em duas colunas (ressalva RS-01)
 * @metodo Congelamento I-8 — ausência de informação nunca vira ausência da
 *         característica
 * @metodo DT-37 — a capacidade começa pelo modelo; a interface apenas consome
 *
 * Por que existe: até a Etapa 2A estes tipos moravam dentro do componente, e a
 * camada de dados importava um `.tsx` para saber o que produzir — dependência
 * invertida. Aqui eles ficam entre os dois: o modelo os produz, a tela os lê, e
 * nenhum dos dois depende do outro.
 *
 * Regra que atravessa todos os campos: **nada é inventado**. Autor ausente
 * permanece `null`, data ausente permanece `null`, e é a tela que diz a lacuna
 * por nome — nunca um valor de enfeite no lugar do que não se sabe.
 */

/** COLUNA 1 — a fala dela, literal, com quem a registrou e quando. */
export type DeclaracaoDaPessoa = {
  grau: string;
  opcoes: string[];
  /** `declared_at` — quando ela disse. Nunca preenchido por aproximação. */
  em: string | null;
  /** Quem registrou a fala dela. Ausente permanece ausente. */
  autor: string | null;
};

/** COLUNA 2 — o que ficou registrado a partir dela, e por quem. */
export type RegistroDaCuradoria = {
  importancia: string;
  autor: string | null;
  /** Quando entrou no Mapa de Prioridades. */
  registradoEm: string | null;
};

/**
 * O ESTADO DO ATO DELA SOBRE A TRADUÇÃO — Etapa 2C.
 *
 * Os quatro desfechos do DT-22 são POR CONCEITO, e só existem onde houve
 * tradução: onde ela respondeu direto, não há leitura de terceiro sobre a qual
 * concordar ou discordar. Estes campos já vinham de `case_needs` no mesmo
 * `loadCaseNeeds` da Etapa 2A — não há consulta nova aqui, só o contrato
 * completando o que a tela precisa para saber o que oferecer.
 */
export type AtoSobreATraducao = {
  /** Só `TRADUCAO` admite desfecho. `DIRETO` e `DECLARACAO_CLINICA` não. */
  houveTraducao: boolean;
  /** O desfecho já praticado. `PENDENTE` é a ausência de ato, não um ato. */
  desfecho: "PENDENTE" | "RECONHECIDA" | "CORRIGIDA" | "RECUSADA";
  /** O que o Curador entendeu — o objeto sobre o qual ela se manifesta. */
  leituraProposta: string | null;
  /** O texto dela, quando já corrigiu ou discordou. */
  correcao: string | null;
};

export type LinhaDoReconhecimento = {
  subcriterionCode: string;
  /** O rótulo do conceito, como ela o lê. Nunca o código. */
  label: string;
  declaracao: DeclaracaoDaPessoa | null;
  registro: RegistroDaCuradoria | null;
  /** A cadeia do Item 1.9 — a fonte única do que falta e por quê. */
  cadeia: CadeiaDeProveniencia;
  ato: AtoSobreATraducao;
};

/**
 * O TERCEIRO BLOCO — os conceitos técnicos (§6.2.1).
 *
 * Formação, experiência e histórico não têm lado da pessoa: ela não declara
 * preferência por fellowship. Quem os declara é o Curador, contra este caso.
 * Por isso vivem em bloco **separado**, e nunca dentro da comparação: misturá-los
 * com a fala dela sugeriria que ela disse algo que não disse.
 *
 * Não há cadeia de proveniência aqui, e isso é deliberado (B3): a cadeia do
 * Item 1.9 tem dois lados, e um deles é a fala dela. Fabricar uma cadeia para
 * algo que ela nunca disse produziria proveniência falsa. O que este bloco
 * carrega é a procedência real — quem registrou, quando — e a lacuna dita por
 * nome quando não se sabe.
 */
export type LinhaTecnica = {
  subcriterionCode: string;
  label: string;
  importancia: string;
  autor: string | null;
  registradoEm: string | null;
};

/**
 * O objeto inteiro que a tela recebe. Mora aqui, e não no loader, porque o
 * loader é `server-only`: um componente que precisasse do tipo teria de
 * importar o módulo do servidor só para tipá-lo.
 */
export type ModeloDoReconhecimento = {
  caseId: string;
  /** Conceitos com lado da pessoa — vão para as duas colunas. */
  linhas: LinhaDoReconhecimento[];
  /** Conceitos técnicos — vão para o terceiro bloco, separados por construção. */
  tecnicos: LinhaTecnica[];
};
