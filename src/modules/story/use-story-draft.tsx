"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { saveStoryDraftAction, submitStoryAction } from "./actions";
import { clearStoryCache, loadStoryCache, saveStoryCache } from "./storage";
import { STORY_STEPS, type PatientStory, type StoryStatus, type StoryStep, type SuaHistoriaData } from "./types";

const AUTOSAVE_DEBOUNCE_MS = 600;

// Derivado da própria action em vez de importar de "./repository" (que tem
// `import "server-only"` — só o tipo atravessa a fronteira client/server,
// nunca o módulo em si).
type SaveResult = Awaited<ReturnType<typeof saveStoryDraftAction>>;

/**
 * A recusa do servidor quando a história já foi enviada.
 *
 * Exportada a partir da A5.1: ela **não é uma falha de gravação**, e a
 * superfície precisa poder distinguir. Enquanto era privada, o indicador de
 * autosave a tratava como erro qualquer e a emoldurava com "sua última
 * resposta ainda não foi salva" — duas afirmações incompatíveis na mesma
 * frase. Comparar contra a constante é o que evita voltar a discriminar por
 * substring.
 */
export const STORY_ALREADY_SUBMITTED_ERROR =
  "Esta história já foi enviada e não pode mais ser editada.";

type StoryDraftContextValue = {
  data: SuaHistoriaData;
  update: (patch: Partial<SuaHistoriaData>) => void;
  status: StoryStatus;
  storyId: string;
  isSaving: boolean;
  hasConflict: boolean;
  /**
   * Bloco D (gate D22 / FS-02): a última gravação foi RECUSADA e o texto só
   * existe neste dispositivo. `null` quando a última gravação confirmou.
   * Estado observável DIFERENTE do sucesso — a superfície nunca mais diz
   * "salvo" com a gravação recusada (ADR-064 §4).
   */
  saveError: string | null;
  /**
   * Sessão expirada como estado de 1ª classe: detectada pelo `outcome`
   * discriminado da action ("unauthenticated"), nunca por substring de
   * mensagem. O texto permanece no cache local (pending) até a reentrada.
   */
  sessionExpired: boolean;
  dismissConflict: () => void;
  submit: () => Promise<{ success: boolean; error?: string }>;
};

const StoryDraftContext = createContext<StoryDraftContextValue | null>(null);

function stepFromPathname(pathname: string): StoryStep | null {
  const segment = pathname.split("/").pop() ?? "";
  return (STORY_STEPS as readonly string[]).includes(segment) ? (segment as StoryStep) : null;
}

type StoryDraftProviderProps = {
  story: PatientStory;
  children: ReactNode;
};

// Fonte da verdade é sempre o servidor (ADR-018) — este Provider mantém uma
// cópia local só para resposta instantânea de UI, autosave debounced, e
// recuperação a partir do cache transitório (storage.ts) quando o servidor
// não confirmou a última escrita (aba fechada, rede caiu).
export function StoryDraftProvider({ story, children }: StoryDraftProviderProps) {
  const pathname = usePathname();
  const [current, setCurrent] = useState(story);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const currentRef = useRef(current);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Corrente de promises: serializa toda gravação (autosave por debounce,
  // por navegação, ou o flush final do submit) para que nunca haja duas em
  // voo ao mesmo tempo. Incidente P0: sem isso, uma gravação atrasada podia
  // pousar depois de outra mais nova e regravar uma etapa já ultrapassada.
  const saveChainRef = useRef<Promise<SaveResult>>(Promise.resolve({ outcome: "saved", story }));
  const recoveredRef = useRef(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const cancelPendingDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  // Única função que de fato grava. Lê `data`/`currentStep`/`revision` de
  // `currentRef` no instante em que executa — nunca de um valor preso em
  // closure no instante em que a gravação foi apenas agendada — para nunca
  // combinar uma revision atual com uma etapa antiga.
  const runPersist = useCallback(async (): Promise<SaveResult> => {
    const snapshot = currentRef.current;
    setIsSaving(true);

    saveStoryCache({
      storyId: snapshot.id,
      revision: snapshot.revision,
      data: snapshot.data,
      currentStep: snapshot.currentStep,
      savedAt: new Date().toISOString(),
      pending: true,
    });

    const result = await saveStoryDraftAction({
      storyId: snapshot.id,
      expectedRevision: snapshot.revision,
      patch: snapshot.data,
      currentStep: snapshot.currentStep,
    });

    if (result.outcome === "saved") {
      // `data` e `currentStep` locais nunca são mais antigos que os enviados
      // nesta gravação (só `update()` e a navegação os alteram, sempre de
      // forma otimista e imediata) — por isso são sempre preservados, nunca
      // sobrescritos pela resposta do servidor. Sem isto: se uma edição ou
      // navegação mais nova acontecesse enquanto esta gravação (mais antiga)
      // ainda estivesse em voo, a confirmação atrasada apagaria essa edição
      // ou regrediria a etapa — o próprio incidente P0, agora prevenido pela
      // fila, mas que ainda podia se manifestar aqui na hora de aplicar o
      // resultado. `revision`/`status`/`submittedAt`/`updatedAt` sempre vêm
      // do servidor — são bookkeeping, nunca "intenção do usuário".
      const localData = currentRef.current.data;
      const localStep = currentRef.current.currentStep;
      const diverged =
        JSON.stringify(localData) !== JSON.stringify(snapshot.data) || localStep !== snapshot.currentStep;
      const merged: PatientStory = { ...result.story, data: localData, currentStep: localStep };

      // Atribuição síncrona antes do `setCurrent`: quem chama `enqueueSave()`
      // (por exemplo o `submit()`, logo depois de aguardar esta promise) lê
      // `currentRef.current` imediatamente — o efeito que sincroniza a ref a
      // partir de `current` só roda depois do próximo render, tarde demais.
      currentRef.current = merged;
      setCurrent(merged);
      setHasConflict(false);
      // Persistência CONFIRMADA — só aqui os sinais de falha se apagam
      // (ADR-064 §4: sucesso exige confirmação, nunca o contrário).
      setSaveError(null);
      setSessionExpired(false);
      saveStoryCache({
        storyId: merged.id,
        revision: merged.revision,
        data: merged.data,
        currentStep: merged.currentStep,
        savedAt: new Date().toISOString(),
        pending: diverged,
      });
    } else if (result.outcome === "conflict") {
      currentRef.current = result.story;
      setCurrent(result.story);
      setHasConflict(true);
      setSaveError(null);
      setSessionExpired(false);
      clearStoryCache(snapshot.id);
    } else if (result.outcome === "unauthenticated") {
      // Sessão expirada (Bloco D / FS-02): estado próprio, detectado pelo
      // outcome discriminado — nunca por substring. O cache local permanece
      // pending:true de propósito: é a promessa "seu texto está guardado
      // neste dispositivo", e o efeito de recuperação reenvia após reentrar.
      setSessionExpired(true);
    } else {
      // A recusa fica VISÍVEL e distinta do sucesso (gate D22): a superfície
      // mostra o erro — com a referência que veio do servidor — em vez de
      // fingir "salvo".
      setSaveError(result.error ?? "Não foi possível salvar agora.");
      if (result.error === STORY_ALREADY_SUBMITTED_ERROR) {
        // Nenhuma tentativa futura desta aba pode ter sucesso — manter
        // pending:true indefinidamente no cache não ajuda em nada.
        clearStoryCache(snapshot.id);
      }
      // Outros erros (rede/servidor indisponível): cache continua pending:true
      // de propósito — é o sinal que o efeito de recuperação usa para tentar
      // de novo na próxima carga de página.
    }

    setIsSaving(false);
    return result;
  }, []);

  // Encadeia: a próxima gravação só começa depois que a anterior (sucesso
  // ou erro) terminar. Um erro nunca trava a fila — a próxima chamada roda
  // do mesmo jeito.
  const enqueueSave = useCallback((): Promise<SaveResult> => {
    const next = saveChainRef.current.then(runPersist, runPersist);
    saveChainRef.current = next;
    return next;
  }, [runPersist]);

  // Recuperação: se o cache local tiver uma edição pendente mais recente do
  // que o que o servidor retornou nesta carga de página, ela nunca chegou a
  // ser confirmada (aba fechada, rede caiu antes do autosave) — reaplica e
  // tenta salvar de novo.
  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;

    const cached = loadStoryCache(story.id);
    if (cached?.pending && new Date(cached.savedAt).getTime() > new Date(story.updatedAt).getTime()) {
      // Mesma razão da navegação: atualiza a ref de forma síncrona antes de
      // enfileirar, para `runPersist` nunca ler o valor pré-recuperação.
      currentRef.current = { ...currentRef.current, data: cached.data, currentStep: cached.currentStep };
      setCurrent((prev) => ({ ...prev, data: cached.data, currentStep: cached.currentStep }));
      void enqueueSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Acompanha a URL para saber em que etapa a pessoa está — nenhuma página
  // do wizard precisa declarar isso manualmente. Cancela qualquer debounce
  // pendente da etapa anterior antes de gravar: sem isso, ele sobrevive à
  // navegação e pode regravar a etapa antiga por cima da nova (achado do
  // incidente P0, comprovado com timestamps reais).
  useEffect(() => {
    const step = stepFromPathname(pathname);
    if (step && step !== currentRef.current.currentStep) {
      cancelPendingDebounce();
      // Atualiza a ref de forma síncrona, não só via `setCurrent` — o then()
      // do enqueueSave() roda como microtask e pode executar antes do efeito
      // de sincronização (currentRef.current = current) processar o
      // re-render. Sem isto, `runPersist` correria risco de ler a etapa
      // antiga na janela entre o clique e o commit do React.
      currentRef.current = { ...currentRef.current, currentStep: step };
      setCurrent((prev) => ({ ...prev, currentStep: step }));
      void enqueueSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Nenhum timer criado por este Provider pode sobreviver a ele.
  useEffect(() => {
    return () => cancelPendingDebounce();
  }, [cancelPendingDebounce]);

  const update = useCallback(
    (patch: Partial<SuaHistoriaData>) => {
      setCurrent((prev) => {
        const nextData = { ...prev.data, ...patch };

        saveStoryCache({
          storyId: prev.id,
          revision: prev.revision,
          data: nextData,
          currentStep: prev.currentStep,
          savedAt: new Date().toISOString(),
          pending: true,
        });

        return { ...prev, data: nextData };
      });

      // Fora do updater de setState de propósito: um updater pode rodar mais
      // de uma vez (StrictMode) — um setTimeout ali dentro chegou a criar
      // dois timers por tecla digitada durante a investigação do incidente.
      cancelPendingDebounce();
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void enqueueSave();
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [cancelPendingDebounce, enqueueSave],
  );

  const submit = useCallback(async () => {
    cancelPendingDebounce();
    // Espera qualquer gravação já em voo e força mais uma com os dados
    // atuais — o submit nunca pode usar uma revision que um autosave ainda
    // pendente possa invalidar.
    const flushResult = await enqueueSave();
    if (flushResult.outcome === "error") {
      return { success: false, error: flushResult.error };
    }
    if (flushResult.outcome === "unauthenticated") {
      return {
        success: false,
        error:
          "Sua sessão expirou. Entre novamente para continuar — seu texto está guardado neste dispositivo.",
      };
    }

    // A revisão vem do RESULTADO do flush, não de `currentRef`.
    //
    // `enqueueSave` grava e chama `setCurrent`, mas `currentRef` só alcança o
    // valor novo no `useEffect` seguinte — que ainda não rodou aqui. Lendo o
    // ref, o submit partia com a revisão ANTERIOR à gravação que ele mesmo
    // acabara de forçar, o banco não encontrava a linha (`revision` não bate)
    // e a pessoa recebia "Sua história foi atualizada em outro lugar" logo
    // depois de clicar em Enviar — sem ninguém ter tocado em nada.
    const snapshot = "story" in flushResult ? flushResult.story : currentRef.current;
    const result = await submitStoryAction({ storyId: snapshot.id, expectedRevision: snapshot.revision });

    if (result.success) {
      cancelPendingDebounce();
      setCurrent(result.story);
      clearStoryCache(snapshot.id);
      return { success: true };
    }

    return { success: false, error: result.error };
  }, [cancelPendingDebounce, enqueueSave]);

  const value: StoryDraftContextValue = {
    data: current.data,
    update,
    status: current.status,
    storyId: current.id,
    isSaving,
    hasConflict,
    saveError,
    sessionExpired,
    dismissConflict: () => setHasConflict(false),
    submit,
  };

  return <StoryDraftContext.Provider value={value}>{children}</StoryDraftContext.Provider>;
}

export function useStoryDraft(): StoryDraftContextValue {
  const context = useContext(StoryDraftContext);
  if (!context) {
    throw new Error("useStoryDraft precisa ser usado dentro de um StoryDraftProvider.");
  }
  return context;
}
