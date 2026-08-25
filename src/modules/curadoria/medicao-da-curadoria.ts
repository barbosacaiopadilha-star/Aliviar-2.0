/**
 * QUANTO CUSTA UMA CURADORIA — o cálculo, sem banco.
 *
 * Motivo de existir (ADR-089): a operação inteira nunca foi medida. Sem o
 * tempo de cada etapa, "o Mapa de 29 é demais" e "o Mapa de 29 está certo"
 * são a mesma frase com o sinal trocado — e toda decisão sobre simplificar o
 * Método vira opinião. Este módulo transforma opinião em medição.
 *
 * NADA É INSTRUMENTADO PARA ISTO. Cada ato da Curadoria já grava o próprio
 * carimbo desde que foi construído: os 29 do Mapa em `case_priority_map`, as
 * 15 conversas em `case_needs`, as declarações de área, os juízos técnicos, a
 * emissão, a entrega, a decisão dela. Medir é ler o que já existe — por isso
 * não há tabela nova, coluna nova, nem uma linha de escrita.
 *
 * ---
 *
 * AS DUAS GRANDEZAS, E POR QUE SÃO DUAS
 *
 * Um número só mentiria, e mentiria de um jeito difícil de perceber.
 *
 * - `esperaMs` — **tempo de relógio** entre o fim da etapa anterior e o fim
 *   desta. Inclui noite, fim de semana, e a espera pela paciente. É o tempo
 *   que a pessoa que procurou a Aliviar sente passando. Não é esforço de
 *   ninguém.
 *
 * - `janelaMs` — do PRIMEIRO ao ÚLTIMO registro dentro da etapa. É o mais
 *   perto de "quanto tempo alguém ficou nisso" que este dado permite — e
 *   ainda assim é um **piso, nunca uma medida de esforço**: quem abre a Mesa
 *   e vai almoçar infla a janela; quem prepara tudo no papel e registra de
 *   uma vez a esvazia. Uma etapa de registro único tem janela zero, o que não
 *   quer dizer que foi instantânea.
 *
 * Quem ler estes números precisa ler as duas ressalvas junto. Um relatório de
 * tempo que se apresenta como exato é pior do que nenhum: ele autoriza cortar
 * o Método com falsa confiança.
 *
 * ---
 *
 * ISTO MEDE O MÉTODO, NÃO A PESSOA (ADR-089).
 *
 * Cada Case tem um Curador, então o dado é inevitavelmente atribuível. A
 * escolha de desenho que impede a deriva para vigilância: este módulo não
 * carrega autoria, não ordena por pessoa e não produz nenhum agregado por
 * Curador. A pergunta que ele responde é "quanto custa esta etapa do Método",
 * nunca "quem é lento".
 *
 * Pela mesma razão a superfície é do Administrador e **não do Curador**: um
 * cronômetro à vista de quem exerce juízo clínico pressiona esse juízo, e
 * pressa é exatamente o que o Método não quer comprar. Além disso corromperia
 * a própria medição — ninguém mede bem o que se sabe medido.
 */

export type EtapaId =
  | "ENTRADA"
  | "ACOLHIMENTO"
  | "MAPA"
  | "PROTOCOLO_DA_PESSOA"
  | "REDE"
  | "AVALIACAO"
  | "COMPOSICAO"
  | "RELATORIO"
  | "DECISAO";

export const ETAPA_LABELS: Record<EtapaId, string> = {
  ENTRADA: "Entrada — do Case aberto à história enviada",
  ACOLHIMENTO: "Acolhimento — até ela reconhecer a própria história",
  MAPA: "Mapa de Prioridades — os subcritérios",
  PROTOCOLO_DA_PESSOA: "Protocolo da Pessoa — as conversas",
  REDE: "Rede elegível — as declarações de área",
  AVALIACAO: "Avaliação técnica — os juízos",
  COMPOSICAO: "Composição — os três caminhos",
  RELATORIO: "Relatório — da emissão à entrega",
  DECISAO: "Decisão — da entrega à escolha dela",
};

/**
 * Os carimbos que o banco já tem, agrupados por etapa. Os campos de lista são
 * um carimbo POR ATO — é o que permite medir densidade e janela.
 */
export type AtosDoCase = {
  caseAbertoEm: string | null;
  historiaEnviadaEm: string | null;
  /** Encontro realizado · registro do contexto · reconhecimento da devolução. */
  acolhimento: (string | null)[];
  /** `case_priority_map.created_at`, um por subcritério classificado. */
  mapa: string[];
  /** `case_needs.declared_at`, um por conversa registrada. */
  protocoloDaPessoa: string[];
  /** `area_compatibility_declarations.declared_at`, um por profissional. */
  rede: string[];
  /** `criterion_declarations.declared_at`, um por critério por profissional. */
  avaliacao: string[];
  composicaoEm: string | null;
  relatorioEmitidoEm: string | null;
  relatorioEntregueEm: string | null;
  decisaoEm: string | null;
};

export type EtapaMedida = {
  id: EtapaId;
  label: string;
  /** Primeiro registro da etapa. `null` quando a etapa fecha num ato único. */
  iniciadaEm: string | null;
  /** Quando a etapa se fechou. `null` = ainda não fechou. */
  concluidaEm: string | null;
  /** Relógio desde o fim da etapa anterior. Inclui espera e noite. */
  esperaMs: number | null;
  /** Do primeiro ao último registro DENTRO da etapa. Piso, nunca esforço. */
  janelaMs: number | null;
  /** Quantos atos foram registrados nesta etapa. */
  registros: number;
};

export type MedicaoDaCuradoria = {
  etapas: EtapaMedida[];
  /** Do Case aberto à decisão dela. `null` enquanto não houver decisão. */
  totalMs: number | null;
  /**
   * União das janelas de registro — o piso do trabalho concentrado.
   * União e não soma: etapas intercaladas se sobrepõem, e somar faria o
   * relógio andar mais rápido que o relógio.
   */
  janelaTotalMs: number;
  /** Quantos atos a Curadoria inteira exigiu. É o número da carga. */
  registrosTotais: number;
  /** `true` quando a jornada chegou à decisão; medição parcial avisa. */
  completa: boolean;
};

// ---------------------------------------------------------------------------
// Utilitários — deliberadamente estritos com data inválida
// ---------------------------------------------------------------------------

function ms(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const t = Date.parse(valor);
  // `NaN` seria propagado silenciosamente por toda a aritmética e sairia como
  // um tempo plausível na tela. Data ilegível é ausência, e diz isso.
  return Number.isNaN(t) ? null : t;
}

function ordenados(carimbos: readonly (string | null | undefined)[]): number[] {
  return carimbos
    .map(ms)
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b);
}

/** Diferença nunca negativa: relógio para trás é dado torto, não tempo. */
function intervalo(de: number | null, ate: number | null): number | null {
  if (de === null || ate === null) return null;
  const d = ate - de;
  return d < 0 ? null : d;
}

/**
 * Uma etapa cujo trabalho é uma sequência de registros (Mapa, Protocolo,
 * Rede, Avaliação). Fecha no último registro; a janela é do primeiro ao
 * último.
 */
function etapaPorRegistros(
  id: EtapaId,
  carimbos: readonly string[],
  anterior: number | null,
): EtapaMedida {
  const t = ordenados(carimbos);
  const primeiro = t.length > 0 ? t[0]! : null;
  const ultimo = t.length > 0 ? t[t.length - 1]! : null;

  // ETAPA SALVA EM LOTE NÃO TEM JANELA — e "0s" seria a pior das respostas.
  //
  // Descoberto percorrendo a Mesa em 25/08: os 29 subcritérios do Mapa são
  // gravados numa transação só (o botão diz "Salvar 29 alterações"), então os
  // 29 carimbos são IDÊNTICOS. A janela dava zero, e zero na tela lê-se como
  // "classificar 29 subcritérios levou tempo nenhum" — exatamente a mentira
  // que a regra do travessão existe para impedir, escapando pelo caso que eu
  // não tinha previsto.
  //
  // Quando todos os registros caem no mesmo instante, o que se sabe é que
  // foram gravados juntos, e NADA sobre quanto tempo o trabalho levou. Isso é
  // ausência de medida, não medida de zero. A espera da etapa continua
  // valendo — ela é o único sinal que sobra para trabalho gravado em lote.
  const houveIntervalo = primeiro !== null && ultimo !== null && ultimo > primeiro;

  return {
    id,
    label: ETAPA_LABELS[id],
    iniciadaEm: primeiro === null ? null : new Date(primeiro).toISOString(),
    concluidaEm: ultimo === null ? null : new Date(ultimo).toISOString(),
    esperaMs: intervalo(anterior, ultimo),
    janelaMs: houveIntervalo ? intervalo(primeiro, ultimo) : null,
    registros: t.length,
  };
}

/** Uma etapa que fecha num ato único, sem janela interna a medir. */
function etapaPorMarco(
  id: EtapaId,
  marco: string | null,
  anterior: number | null,
  registros = marco ? 1 : 0,
): EtapaMedida {
  const t = ms(marco);
  return {
    id,
    label: ETAPA_LABELS[id],
    iniciadaEm: null,
    concluidaEm: t === null ? null : new Date(t).toISOString(),
    esperaMs: intervalo(anterior, t),
    janelaMs: null,
    registros,
  };
}

/**
 * A JANELA TOTAL É UNIÃO, NÃO SOMA.
 *
 * As etapas da Mesa são modeladas em sequência, mas o Curador pode intercalar
 * — registrar um subcritério do Mapa, voltar a uma conversa do Protocolo,
 * declarar uma área. Quando isso acontece, as janelas se SOBREPÕEM, e somá-las
 * produziria um total maior que o tempo que de fato passou: um relógio que
 * anda mais rápido que o relógio.
 *
 * A união trata o trabalho intercalado pelo que ele é — o mesmo período,
 * contado uma vez.
 */
function uniaoDasJanelas(etapas: readonly EtapaMedida[]): number {
  const intervalos = etapas
    .map((e) => [ms(e.iniciadaEm), ms(e.concluidaEm)] as const)
    .filter((par): par is readonly [number, number] => par[0] !== null && par[1] !== null && par[1] > par[0])
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let inicioAtual: number | null = null;
  let fimAtual = 0;

  for (const [inicio, fim] of intervalos) {
    if (inicioAtual === null) {
      inicioAtual = inicio;
      fimAtual = fim;
      continue;
    }
    if (inicio <= fimAtual) {
      // Sobrepõe ou encosta: estende o bloco corrente em vez de contar de novo.
      fimAtual = Math.max(fimAtual, fim);
    } else {
      total += fimAtual - inicioAtual;
      inicioAtual = inicio;
      fimAtual = fim;
    }
  }

  if (inicioAtual !== null) total += fimAtual - inicioAtual;
  return total;
}

// ---------------------------------------------------------------------------
// A medição
// ---------------------------------------------------------------------------

/**
 * A ORDEM DAS ETAPAS É A DA JORNADA, e cada uma parte de onde a anterior
 * terminou — não do início do Case. Uma etapa que ainda não fechou não
 * "empurra" a seguinte: quando falta o fim de uma, a espera da próxima parte
 * do último marco conhecido, para que um buraco no meio não apareça como
 * tempo enorme na etapa seguinte.
 */
export function medirCuradoria(atos: AtosDoCase): MedicaoDaCuradoria {
  const etapas: EtapaMedida[] = [];
  let cursor = ms(atos.caseAbertoEm);

  const avancar = (etapa: EtapaMedida) => {
    etapas.push(etapa);
    const fim = ms(etapa.concluidaEm);
    if (fim !== null) cursor = fim;
  };

  avancar(etapaPorMarco("ENTRADA", atos.historiaEnviadaEm, cursor));

  // O Acolhimento tem três atos e fecha no último deles — o reconhecimento da
  // devolução, que é o marco que o Método define como fim da etapa.
  const acolhimento = ordenados(atos.acolhimento);
  avancar(
    etapaPorRegistros(
      "ACOLHIMENTO",
      acolhimento.map((t) => new Date(t).toISOString()),
      cursor,
    ),
  );

  avancar(etapaPorRegistros("MAPA", atos.mapa, cursor));
  avancar(etapaPorRegistros("PROTOCOLO_DA_PESSOA", atos.protocoloDaPessoa, cursor));
  avancar(etapaPorRegistros("REDE", atos.rede, cursor));
  avancar(etapaPorRegistros("AVALIACAO", atos.avaliacao, cursor));
  avancar(etapaPorMarco("COMPOSICAO", atos.composicaoEm, cursor));

  // O Relatório tem dois marcos e a distância entre eles importa: emitir e
  // entregar são atos separados de propósito, e a entrega acontece na conversa.
  avancar(
    etapaPorRegistros(
      "RELATORIO",
      [atos.relatorioEmitidoEm, atos.relatorioEntregueEm].filter(
        (v): v is string => Boolean(v),
      ),
      cursor,
    ),
  );

  avancar(etapaPorMarco("DECISAO", atos.decisaoEm, cursor));

  const janelaTotalMs = uniaoDasJanelas(etapas);
  const registrosTotais = etapas.reduce((soma, e) => soma + e.registros, 0);

  return {
    etapas,
    totalMs: intervalo(ms(atos.caseAbertoEm), ms(atos.decisaoEm)),
    janelaTotalMs,
    registrosTotais,
    completa: ms(atos.decisaoEm) !== null,
  };
}

// ---------------------------------------------------------------------------
// Apresentação — a duração dita como gente fala
// ---------------------------------------------------------------------------

/**
 * `null` vira "—", nunca "0". São coisas diferentes: uma etapa que não
 * aconteceu e uma que levou tempo nenhum contam histórias opostas, e foi
 * exatamente essa confusão que o achado SIM-14 registrou na Visão geral.
 */
export function duracao(valor: number | null): string {
  if (valor === null) return "—";

  const segundos = Math.round(valor / 1000);
  if (segundos < 60) return `${segundos}s`;

  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} min`;

  const horas = minutos / 60;
  if (horas < 24) {
    const h = Math.floor(horas);
    const m = minutos - h * 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
  }

  const dias = Math.floor(horas / 24);
  const restoH = Math.round(horas - dias * 24);
  return restoH === 0 ? `${dias}d` : `${dias}d ${restoH}h`;
}
