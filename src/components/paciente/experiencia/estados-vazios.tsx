import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";

/**
 * Estados vazios — acolhimento, nunca erro.
 *
 * Tela vazia é o momento em que a pessoa mais precisa de contexto, e é
 * justamente onde a maioria dos produtos entrega uma caixa cinza. Cada estado
 * aqui responde três coisas: o que está acontecendo, por que está assim, e o
 * que vem depois. Nenhum usa ícone de alerta, cor de erro ou a palavra
 * "nenhum" isolada.
 */
function Vazio({ titulo, corpo, rodape }: { titulo: string; corpo: string; rodape?: string }) {
  return (
    <PatientCard variant="note">
      <h2 className="font-serif text-xl font-medium leading-snug text-[var(--patient-ink)]">
        {titulo}
      </h2>
      <p className="p-read-deep mt-3">{corpo}</p>
      {rodape ? <p className="p-read-fast mt-3">{rodape}</p> : null}
    </PatientCard>
  );
}

/** Antes de a Curadoria começar. */
export function CuradoriaNaoIniciada({ curatorName }: { curatorName?: string }) {
  return (
    <Vazio
      titulo="Sua Curadoria ainda não começou."
      corpo={`Ela começa pela conversa em que ${curatorName ?? "seu Curador"} ouve a sua história inteira. Nada aqui depende de você agora — quando for a sua vez, esta tela vai dizer.`}
      rodape="Você pode fechar esta página com tranquilidade."
    />
  );
}

/** A equipe trabalha; não há novidade desde a última visita. */
export function AguardandoAtualizacao({ ultimaAtualizacao }: { ultimaAtualizacao?: string }) {
  return (
    <Vazio
      titulo="Ainda não há novidades por aqui."
      corpo="A Aliviar segue trabalhando no seu caso. Quando houver algo novo para você ver, aparece nesta tela — e você não precisa ficar conferindo."
      rodape={ultimaAtualizacao ? `Última atualização: ${ultimaAtualizacao}.` : undefined}
    />
  );
}

/**
 * A Curadoria está em andamento e ainda não fechou os três caminhos. Nunca
 * dizer "faltam X" — contagem vira cobrança para quem está esperando.
 */
export function CaminhosAindaNaoProntos() {
  return (
    <Vazio
      titulo="Os caminhos ainda estão sendo preparados."
      corpo="A Curadoria só apresenta as opções quando as três estiverem prontas e sustentadas. É por isso que ela leva o tempo que leva."
      rodape="Avisaremos você assim que estiverem."
    />
  );
}

/* CORTE DE 23/08 · `ComparacaoNaoIniciada` morava aqui. A comparação deixou
   de ter estado vazio porque deixou de ter gesto: o painel mostra os três
   caminhos direto, uma dimensão por vez. */
