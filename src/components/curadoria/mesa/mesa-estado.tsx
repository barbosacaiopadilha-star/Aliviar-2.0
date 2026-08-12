"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

import {
  emptyParecer,
  logEntry,
  type MesaLogEntry,
  type ParecerDraft,
} from "@/modules/curadoria/mesa";

/**
 * D-6 · O ESTADO DA MESA, ACIMA DO QUE DESMONTA.
 *
 * A rota monta `conteudo: Record<MesaEtapaId, ReactNode>` e `MesaShell`
 * renderiza **apenas** `conteudo[etapaAtual]`. Como `MesaWorkspace` mora
 * dentro de um desses slots, trocar de etapa o DESMONTA — e o `useReducer`
 * que guardava seleção, pareceres e justificativa do conjunto morria junto.
 *
 * D-6 nunca foi uma tabela que falta. Era um `unmount`.
 *
 * A correção é de posição, não de domínio: o reducer passa a viver num limite
 * de cliente que **envolve** `MesaShell`. Trocar de etapa deixa de poder
 * destruí-lo, porque ele mora acima da coisa que desmonta.
 *
 * ## O que este estado NÃO é
 *
 * Não é fato canônico. Não vai para o banco, não tem action, não tem RPC —
 * `saveSelectionAction` continua sendo o único writer, e continua
 * all-or-nothing: `curated_selections` exige `composition_rationale` não
 * vazio, `selected_by` e exatamente três opções. Gravar rascunho ali criaria
 * um fato a partir de um esboço.
 *
 * E **não vai para `localStorage`**. Os rascunhos de parecer são texto de
 * juízo clínico: `localStorage` não é criptografado, sobrevive ao logout e é
 * por dispositivo. O precedente do `CaminhosPanel` vale para memória de
 * navegação, nunca para conteúdo.
 *
 * **Limite honesto, e ele é dito:** recarregar a página ou sair da rota ainda
 * perde o rascunho. O botão de encerrar, sempre visível, nomeia o que falta
 * para o trabalho virar registro.
 */

/**
 * Estado da Mesa em um único átomo, com reducer puro.
 *
 * Por que reducer e não vários `useState`: a Memória precisa ser escrita na
 * mesma transição que a mudança que ela registra. Com setters separados, três
 * seleções no mesmo tick liam o mesmo valor de `selectedIds` e só a última
 * sobrevivia — e registrar a Memória de dentro de um updater duplicava a
 * entrada. Um reducer puro resolve os dois: correto sob batching, e sem efeito
 * colateral dentro de função de atualização.
 */
type MesaState = {
  comparisonIds: string[];
  selectedIds: string[];
  pareceres: ParecerDraft[];
  compositionRationale: string;
  log: MesaLogEntry[];
  closed: boolean;
};

type MesaAction =
  | { type: "TOGGLE_COMPARISON"; id: string; name: string; actor: string }
  | { type: "TOGGLE_SELECTION"; id: string; name: string; actor: string }
  | { type: "UPDATE_PARECER"; id: string; field: keyof Omit<ParecerDraft, "professionalId">; value: string }
  | { type: "SET_COMPOSITION"; value: string }
  | { type: "RECORD_JUSTIFICATION"; description: string; actor: string }
  | { type: "MOVE_SELECTION"; id: string; direction: -1 | 1; name: string; actor: string }
  | { type: "CLOSE"; actor: string }
  | { type: "REOPEN" };

const INITIAL_STATE: MesaState = {
  comparisonIds: [],
  selectedIds: [],
  pareceres: [],
  compositionRationale: "",
  log: [],
  closed: false,
};

function append(log: MesaLogEntry[], entry: MesaLogEntry): MesaLogEntry[] {
  const last = log[0];
  if (last?.kind === entry.kind && last.description === entry.description) return log;
  return [entry, ...log];
}

function mesaReducer(state: MesaState, action: MesaAction): MesaState {
  switch (action.type) {
    case "TOGGLE_COMPARISON": {
      const has = state.comparisonIds.includes(action.id);
      return {
        ...state,
        comparisonIds: has
          ? state.comparisonIds.filter((entry) => entry !== action.id)
          : [...state.comparisonIds, action.id],
        log: append(
          state.log,
          logEntry(
            has ? "COMPARACAO_REMOVIDA" : "COMPARACAO_ADICIONADA",
            `${action.name} ${has ? "saiu da" : "entrou na"} comparação.`,
            action.actor,
          ),
        ),
      };
    }

    case "TOGGLE_SELECTION": {
      const has = state.selectedIds.includes(action.id);
      // A Curadoria apresenta sempre exatamente três — nunca uma quarta.
      if (!has && state.selectedIds.length >= 3) return state;

      return {
        ...state,
        selectedIds: has
          ? state.selectedIds.filter((entry) => entry !== action.id)
          : [...state.selectedIds, action.id],
        pareceres: has
          ? state.pareceres.filter((draft) => draft.professionalId !== action.id)
          : state.pareceres.some((draft) => draft.professionalId === action.id)
            ? state.pareceres
            : [...state.pareceres, emptyParecer(action.id)],
        log: append(
          state.log,
          logEntry(
            has ? "OPCAO_REMOVIDA" : "OPCAO_SELECIONADA",
            `${action.name} ${has ? "saiu da" : "entrou na"} seleção.`,
            action.actor,
          ),
        ),
      };
    }

    case "UPDATE_PARECER":
      return {
        ...state,
        pareceres: state.pareceres.map((draft) =>
          draft.professionalId === action.id ? { ...draft, [action.field]: action.value } : draft,
        ),
      };

    case "SET_COMPOSITION":
      return { ...state, compositionRationale: action.value };

    case "RECORD_JUSTIFICATION":
      return {
        ...state,
        log: append(
          state.log,
          logEntry("JUSTIFICATIVA_REGISTRADA", action.description, action.actor),
        ),
      };

    case "MOVE_SELECTION": {
      // A ordem das três é ORDEM DE APRESENTAÇÃO, nunca colocação (Ontologia
      // §3.13). Ela existe porque a conversa tem uma sequência que faz sentido
      // — começar pelo caminho mais próximo do que ela pediu, por exemplo —
      // e essa sequência é julgamento do Curador, não de resultado nenhum.
      const from = state.selectedIds.indexOf(action.id);
      const to = from + action.direction;
      if (from < 0 || to < 0 || to >= state.selectedIds.length) return state;

      const reordered = [...state.selectedIds];
      [reordered[from], reordered[to]] = [reordered[to]!, reordered[from]!];

      return {
        ...state,
        selectedIds: reordered,
        log: append(
          state.log,
          logEntry(
            "OPCAO_SELECIONADA",
            `${action.name} passou a ser apresentada em ${to + 1}º na ordem da conversa.`,
            action.actor,
          ),
        ),
      };
    }

    case "REOPEN":
      // Reabrir não apaga o que foi escrito — só devolve a edição.
      return { ...state, closed: false };

    case "CLOSE":
      return {
        ...state,
        closed: true,
        log: append(
          state.log,
          logEntry(
            "SELECAO_FECHADA",
            "Curadoria Técnica encerrada com três opções e pareceres completos.",
            action.actor,
          ),
        ),
      };
  }
}

/**
 * A identidade do estado é o **Case**, e nunca a posição na árvore.
 *
 * Sem isto, navegar de um Caso para outro dentro da mesma montagem levaria
 * junto a seleção e os pareceres do anterior — e o Curador escreveria sobre a
 * pessoa errada sem que nada avisasse. O provider recusa consumo cruzado em
 * vez de confiar num `key` que alguém pode esquecer de passar.
 *
 * Os pareceres já são isolados **por profissional** por construção: cada
 * `ParecerDraft` carrega o próprio `professionalId`, e o reducer só mexe na
 * entrada cujo id bate.
 */
type MesaEstadoContexto = {
  caseId: string;
  state: MesaState;
  dispatch: Dispatch<MesaAction>;
};

const MesaEstadoContext = createContext<MesaEstadoContexto | null>(null);

export type MesaEstadoInicial = {
  selectedIds: string[];
  pareceres: ParecerDraft[];
  compositionRationale: string;
  closed: boolean;
};

export function MesaEstadoProvider({
  caseId,
  persisted,
  children,
}: {
  caseId: string;
  /** O que o servidor já gravou — a Mesa reabre onde parou. */
  persisted?: MesaEstadoInicial;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(mesaReducer, {
    ...INITIAL_STATE,
    selectedIds: persisted?.selectedIds ?? [],
    pareceres: persisted?.pareceres ?? [],
    compositionRationale: persisted?.compositionRationale ?? "",
    closed: persisted?.closed ?? false,
  });

  return (
    <MesaEstadoContext.Provider value={{ caseId, state, dispatch }}>
      {children}
    </MesaEstadoContext.Provider>
  );
}

/**
 * Consumir fora do provider é erro de composição, não estado vazio: devolver
 * um estado neutro faria a Mesa parecer funcionar e perder tudo em silêncio —
 * exatamente o defeito que esta extração existe para acabar.
 */
export function useMesaEstado(caseId: string): MesaEstadoContexto {
  const contexto = useContext(MesaEstadoContext);
  if (!contexto) {
    throw new Error(
      "useMesaEstado foi chamado fora de <MesaEstadoProvider>. O estado da Mesa precisa " +
        "viver ACIMA de MesaShell — dentro do slot da etapa ele morre ao trocar de etapa.",
    );
  }
  if (contexto.caseId !== caseId) {
    throw new Error(
      `Estado da Mesa do Case ${contexto.caseId} consumido pelo Case ${caseId}. ` +
        "Rascunho de um Caso nunca atravessa para outro.",
    );
  }
  return contexto;
}

export type { MesaState, MesaAction };
export { mesaReducer, INITIAL_STATE };
