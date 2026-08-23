/**
 * O EDIFÍCIO DA ALIVIAR — pacote arquitetônico oficial (Master Visual).
 *
 * Quatro ambientes do mesmo prédio, aprovados como fonte de verdade visual.
 * A regra que eles existem para sustentar:
 *
 *   antes do login, a paciente **conhece** a Aliviar;
 *   depois do login, a paciente **entra** na Aliviar.
 *
 * Por isso landing e área autenticada bebem desta mesma tabela: nenhuma
 * superfície escolhe fotografia por conta própria.
 *
 * **As chaves antigas saíram de propósito.** `landingHero`, `landingAtrium`,
 * `patientStudy` e `patientReading` apontavam para um conjunto anterior — e uma
 * delas, `landingAtrium`, para `grand-finale.jpg`, que a auditoria provou não
 * ser sequer o edifício da Aliviar: um apartamento vazio genérico, com luz
 * fria, armários escuros e radiador. Ele chegou a ficar atrás da casa inteira
 * da paciente porque o nome da chave dizia "atrium" e ninguém abriu o arquivo.
 *
 * Remover as chaves em vez de repontá-las é deliberado: o TypeScript passa a
 * recusar qualquer superfície que tente voltar ao conjunto antigo. Os arquivos
 * seguem em `public/scenes/` como legado — o que não sobrevive é o atalho.
 */
export const ALIVIAR_SCENES = {
  /** 01 · Recepção — a chegada. Hero da landing e da Home na Consulta Inicial. */
  recepcao: "/scenes/master/aliviar-01-recepcao.jpg",
  /** 02 · Corredor de consultas — o percurso clínico, com privacidade. */
  consultas: "/scenes/master/aliviar-02-corredor-consultas.jpg",
  /** 03 · Corredor de transição — entre etapas; é o campo atmosférico da casa. */
  transicao: "/scenes/master/aliviar-03-corredor-transicao.jpg",
  /** 04 · Despedida — encerramento de etapa e continuidade do acompanhamento. */
  despedida: "/scenes/master/aliviar-04-despedida.jpg",

  /* —— O Edifício Aliviar (ADR-080) — geração de 22/08, do Fundador. ——
     Três ambientes gerados JÁ com áreas livres planejadas para receber
     texto (a salvaguarda da ADR-080: o espaço negativo nasce no prompt,
     não se improvisa no CSS). Letreiro "Curadoria Médica Independente"
     gravado na própria cena — identidade médica sem jaleco. */
  /** Entrada — o acolhimento: família recebida por uma curadora, sem jaleco. */
  entrada: "/scenes/edificio/entrada.jpg",
  /** Sala de Curadoria — mesas de análise, pastas verdes; parede esquerda livre. */
  curadoria: "/scenes/edificio/sala-curadoria.jpg",
  /** Corredor dos caminhos — três retratos (crânio·coluna·joelho), portas, luz contínua. */
  corredor: "/scenes/edificio/corredor.jpg",
} as const;

export type AliviarSceneKey = keyof typeof ALIVIAR_SCENES;
