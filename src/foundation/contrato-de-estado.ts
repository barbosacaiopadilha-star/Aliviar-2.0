/**
 * FUNDAÇÃO · CONTRATO APRESENTACIONAL DE ESTADO.
 *
 * @metodo docs/repaginacao/13_MODELO_DE_ESTADOS.md — o catálogo e a regra
 * @metodo docs/repaginacao/06_HANDOFFS.md — "de quem é a vez?"
 *
 * O defeito que este módulo existe para fechar não é de dado: é de leitura.
 * A auditoria encontrou a Home dizendo *"você ainda não contou sua história"*
 * enquanto a Curadoria já estava entregue; Documentos vazio com relatório
 * entregue; Caso "concluída" e Mesa "aguarda você" ao mesmo tempo. Nenhum
 * desses é um bug de banco — **é cada tela deduzindo o estado por conta
 * própria, a partir do pedaço de fato que tinha à mão.**
 *
 * A regra desta camada, então:
 *
 * > **Um estado tem uma origem de dado e duas traduções. Nenhuma tela deduz;
 * > toda tela lê.**
 *
 * O que este módulo **não** é, e não pode virar:
 *
 * - não é máquina de estado de domínio — não decide nada, só descreve;
 * - não cria enum novo no banco, não persiste campo, não gera migration;
 * - não infere conclusão que o dado não sustenta;
 * - não transforma ausência de dado em sucesso;
 * - não diz "entregue" porque foi emitido;
 * - não diz "decidiu" porque sinalizou.
 *
 * Quando os fatos não bastam para determinar o estado, a resposta é
 * `INDETERMINADO` com tom neutro e nenhuma ação — nunca um palpite bem
 * apresentado.
 */

import type { PapelVisual } from "@/foundation/estado-visual";

// ---------------------------------------------------------------------------
// De quem é a vez
// ---------------------------------------------------------------------------

/**
 * Quem deve agir agora. `INDETERMINADO` é resposta legítima e obrigatória
 * quando os fatos não permitem dizer — inventar aqui seria transformar
 * heurística em regra.
 */
export type QuemAge = "PACIENTE" | "CURADOR" | "EQUIPE" | "SISTEMA" | "NINGUEM" | "INDETERMINADO";

// ---------------------------------------------------------------------------
// Os fatos — e só os que existem de verdade
// ---------------------------------------------------------------------------

/**
 * O que a aplicação sabe, vindo das colunas que já existem. Nenhum campo aqui
 * é novo: `submitted_at`, `emitted_at`, `delivered_at`, responsável do Caso e
 * conclusão do Caso já são lidos pelo produto hoje — o que faltava era lê-los
 * **juntos**, num lugar só.
 *
 * `null` significa "não sei", e é diferente de `false`. A distinção é o que
 * impede esta camada de transformar ausência de dado em afirmação.
 */
export type FatosDoCaso = {
  /** `patient_stories`: existe rascunho? foi enviada? */
  historia: {
    existe: boolean;
    /** `submitted_at` — nulo enquanto não enviada. */
    enviadaEm: string | null;
  } | null;
  /** O Caso aberto a partir da história. */
  caso: {
    /** Responsável definido = saiu da fila. */
    curadorResponsavel: string | null;
    /**
     * `closed_at` do Caso. **Encerramento, não conclusão** — e a diferença não
     * é semântica fina: o gatilho do banco grava esta coluna para `CLOSED`
     * **e para `CANCELLED`**, então ela sozinha não distingue as duas coisas.
     *
     * ```
     * if new.status in ('CLOSED','CANCELLED')
     *   then new.closed_at := coalesce(new.closed_at, now())
     * ```
     */
    encerradoEm: string | null;
    /**
     * `status = 'CANCELLED'` — lido do estado real, nunca inferido de
     * `closed_at`. `null` é "não sei" e continua significando isso; `false` é
     * a afirmação explícita de que o Caso **não** foi cancelado.
     */
    cancelado: boolean | null;
  } | null;
  /** O Relatório da Curadoria. */
  relatorio: {
    existe: boolean;
    /** `emitted_at` — emitir NÃO é entregar. */
    emitidoEm: string | null;
    /** `delivered_at` — só isto significa que a pessoa recebeu. */
    entregueEm: string | null;
  } | null;
  /** Pendência registrada que aguarda alguém. `null` = não sabemos. */
  pendencia: {
    aberta: boolean;
    /** Quem deve resolver, quando o dado permite dizer. */
    aguardando: QuemAge;
  } | null;
};

// ---------------------------------------------------------------------------
// Os macroestados
// ---------------------------------------------------------------------------

export type EstadoCanonico =
  | "HISTORIA_NAO_INICIADA"
  | "HISTORIA_EM_PREENCHIMENTO"
  | "HISTORIA_ENVIADA"
  | "CASO_AGUARDANDO_CURADOR"
  | "CASO_EM_CURADORIA"
  | "RELATORIO_EMITIDO"
  | "CURADORIA_ENTREGUE"
  | "CASO_CONCLUIDO"
  /**
   * Projeções apresentacionais de encerramento. **Não são enum de domínio, não
   * são persistidas e não criam regra clínica**: existem porque `closed_at`
   * sozinho é ambíguo, e a interface precisa dizer algo verdadeiro nos dois
   * casos que ele cobre.
   */
  | "CASO_CANCELADO"
  | "CASO_ENCERRADO_SEM_ENTREGA"
  | "INDETERMINADO";

/**
 * As ações que a Fundação sabe oferecer.
 *
 * `RESPONDER_PENDENCIA` **foi removida**: nenhum ramo a produzia, porque o dado
 * que a justificaria — pendência estruturada com destinatário — ainda não
 * existe (nível C/D no modelo de estados). Manter uma ação pública sem produtor
 * convida a primeira trilha que a encontrar a fabricar um CTA para preenchê-la.
 * Quando a pendência estruturada existir, a trilha pede extensão da Fundação.
 */
export type AcaoPermitida =
  | "PREENCHER_HISTORIA"
  | "CONTINUAR_HISTORIA"
  | "REVER_HISTORIA"
  | "ASSUMIR_CASO"
  | "TRABALHAR_NO_CASO"
  | "ENTREGAR_CURADORIA"
  | "VER_CURADORIA";

export type LeituraDeEstado = {
  estado: EstadoCanonico;
  /** O que a pessoa lê. Nunca expõe enum, id de Caso ou detalhe interno. */
  rotuloPaciente: string;
  /** O que o Curador lê. Densidade diferente, mesmo fato. */
  rotuloCurador: string;
  /** Papel cromático — da gramática certificada, nunca cor avulsa. */
  tom: PapelVisual;
  quemAge: QuemAge;
  temPendencia: boolean;
  /** Existe algo para a pessoa abrir agora? Só verdadeiro quando entregue. */
  temConteudoParaPaciente: boolean;
  acoesPaciente: readonly AcaoPermitida[];
  acoesCurador: readonly AcaoPermitida[];
};

/** A resposta segura. Toda ambiguidade termina aqui, e nunca num palpite. */
const INDETERMINADO: LeituraDeEstado = {
  estado: "INDETERMINADO",
  rotuloPaciente: "Estamos organizando esta etapa.",
  rotuloCurador: "Estado não determinável com os dados disponíveis.",
  tom: "neutro",
  quemAge: "INDETERMINADO",
  temPendencia: false,
  temConteudoParaPaciente: false,
  acoesPaciente: [],
  acoesCurador: [],
};

/**
 * Lê o estado do Caso a partir dos fatos.
 *
 * A ordem importa e é deliberada: **do fato mais avançado para o menos**. É
 * isso que impede a contradição que a auditoria encontrou — uma vez que
 * `delivered_at` existe, nenhuma superfície pode voltar a dizer que a história
 * não foi contada, porque não há caminho de código que chegue lá.
 */
export function lerEstado(fatos: FatosDoCaso): LeituraDeEstado {
  const pendencia = fatos.pendencia?.aberta === true;
  const comPendencia = <T extends LeituraDeEstado>(leitura: T): LeituraDeEstado =>
    pendencia
      ? {
          ...leitura,
          temPendencia: true,
          // Pendência aberta não apaga o estado — mas manda em quem age, e a
          // tela não pode escondê-la atrás do progresso.
          quemAge: fatos.pendencia?.aguardando ?? "INDETERMINADO",
          tom: "atencao",
        }
      : leitura;

  // A prova de conteúdo é uma só, e é a entrega. Nem emissão, nem encerramento,
  // nem conclusão abrem a Curadoria para a pessoa: só `delivered_at`.
  const entregue = Boolean(fatos.relatorio?.entregueEm);

  // 1. Cancelamento — o fato mais específico, e o que vence todos os outros.
  //    Precisa vir primeiro justamente porque `closed_at` também é gravado
  //    aqui: se a conclusão fosse avaliada antes, um Caso cancelado seria
  //    anunciado como Curadoria concluída, com conteúdo que não existe.
  if (fatos.caso?.cancelado === true) {
    return comPendencia({
      estado: "CASO_CANCELADO",
      // Verdadeiro sem inventar próximo passo e sem prometer canal que a
      // Fundação ainda não tem.
      rotuloPaciente: "Esta Curadoria foi encerrada.",
      rotuloCurador: "Cancelado.",
      tom: "neutro",
      quemAge: "NINGUEM",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: [],
      acoesCurador: [],
    });
  }

  // 2. Encerramento registrado. Conclusão só é dita quando houve ENTREGA;
  //    encerrar sem entregar é outra coisa, e a interface diz outra coisa.
  if (fatos.caso?.encerradoEm) {
    if (entregue) {
      return comPendencia({
        estado: "CASO_CONCLUIDO",
        rotuloPaciente: "Sua Curadoria está concluída.",
        rotuloCurador: "Concluído.",
        tom: "resolvido",
        quemAge: "NINGUEM",
        temPendencia: false,
        temConteudoParaPaciente: true,
        acoesPaciente: ["VER_CURADORIA"],
        acoesCurador: [],
      });
    }
    return comPendencia({
      estado: "CASO_ENCERRADO_SEM_ENTREGA",
      // Encerrado é verdade; concluído não seria. E com `cancelado` em `null`
      // não sabemos sequer por qual dos dois caminhos ele fechou — mais uma
      // razão para a frase não afirmar desfecho.
      rotuloPaciente: "Esta Curadoria foi encerrada.",
      rotuloCurador: "Encerrado sem entrega.",
      tom: "neutro",
      quemAge: "NINGUEM",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: [],
      acoesCurador: [],
    });
  }

  // 2. Entregue — e só aqui a pessoa tem o que abrir.
  if (fatos.relatorio?.entregueEm) {
    return comPendencia({
      estado: "CURADORIA_ENTREGUE",
      rotuloPaciente: "Sua Curadoria está pronta.",
      rotuloCurador: "Entregue.",
      tom: "resolvido",
      quemAge: "PACIENTE",
      temPendencia: false,
      temConteudoParaPaciente: true,
      acoesPaciente: ["VER_CURADORIA"],
      acoesCurador: [],
    });
  }

  // 3. Emitido e NÃO entregue. O ato que falta é da equipe, não da pessoa —
  //    e ela não pode ver isto como algo que já recebeu.
  if (fatos.relatorio?.emitidoEm) {
    return comPendencia({
      estado: "RELATORIO_EMITIDO",
      rotuloPaciente: "A Aliviar está preparando sua Curadoria.",
      rotuloCurador: "Emitido — ainda não entregue.",
      tom: "atencao",
      quemAge: "EQUIPE",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: [],
      acoesCurador: ["ENTREGAR_CURADORIA"],
    });
  }

  // 4. Caso em curso.
  if (fatos.caso) {
    if (fatos.caso.curadorResponsavel) {
      return comPendencia({
        estado: "CASO_EM_CURADORIA",
        rotuloPaciente: "Sua Curadoria está em andamento.",
        rotuloCurador: "Em curadoria.",
        tom: "neutro",
        quemAge: "CURADOR",
        temPendencia: false,
        temConteudoParaPaciente: false,
        acoesPaciente: [],
        acoesCurador: ["TRABALHAR_NO_CASO"],
      });
    }
    return comPendencia({
      estado: "CASO_AGUARDANDO_CURADOR",
      rotuloPaciente: "Estamos organizando sua Curadoria.",
      rotuloCurador: "Disponível na fila.",
      tom: "neutro",
      quemAge: "EQUIPE",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: [],
      acoesCurador: ["ASSUMIR_CASO"],
    });
  }

  // 5. História — o começo. Só se chega aqui quando não há Caso nem relatório.
  if (fatos.historia?.enviadaEm) {
    return comPendencia({
      estado: "HISTORIA_ENVIADA",
      rotuloPaciente: "Recebemos sua história.",
      rotuloCurador: "História recebida.",
      tom: "resolvido",
      quemAge: "EQUIPE",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: ["REVER_HISTORIA"],
      acoesCurador: [],
    });
  }

  if (fatos.historia?.existe) {
    return comPendencia({
      estado: "HISTORIA_EM_PREENCHIMENTO",
      rotuloPaciente: "Continue de onde parou.",
      rotuloCurador: "História em preenchimento.",
      tom: "atencao",
      quemAge: "PACIENTE",
      temPendencia: false,
      temConteudoParaPaciente: false,
      acoesPaciente: ["CONTINUAR_HISTORIA"],
      acoesCurador: [],
    });
  }

  // `historia: null` é "não sei", e não autoriza dizer que ela não começou.
  if (fatos.historia === null) return INDETERMINADO;

  return comPendencia({
    estado: "HISTORIA_NAO_INICIADA",
    rotuloPaciente: "Conte sua história.",
    rotuloCurador: "Sem história.",
    tom: "atencao",
    quemAge: "PACIENTE",
    temPendencia: false,
    temConteudoParaPaciente: false,
    acoesPaciente: ["PREENCHER_HISTORIA"],
    acoesCurador: [],
  });
}

/**
 * A pergunta que toda superfície precisa saber responder (§06 dos handoffs).
 * Existe separada porque é consultada sozinha — na fila, no cabeçalho, no
 * cartão — e ninguém deveria reimplementá-la para isso.
 */
export function deQuemEAVez(fatos: FatosDoCaso): QuemAge {
  return lerEstado(fatos).quemAge;
}

/**
 * A preferência da paciente **não** é decisão.
 *
 * O catálogo (`13_MODELO_DE_ESTADOS.md` §5) deixa esta linha explicitamente
 * indefinida, à espera de [D-2]. Enquanto isso, sinalizar é sinalizar: esta
 * função existe para que nenhuma tela precise inventar a diferença, e para
 * que a resposta segura seja a única disponível.
 */
export function decisaoDaPaciente(): { registrada: false; motivo: "AGUARDA_DECISAO_D2" } {
  return { registrada: false, motivo: "AGUARDA_DECISAO_D2" };
}
