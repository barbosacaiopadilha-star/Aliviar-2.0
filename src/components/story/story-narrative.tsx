import Link from "next/link";

import type { SuaHistoriaData } from "@/modules/story/types";

// Apresentação exclusiva da etapa de revisão do paciente — nunca reaproveitada
// pelo Portal do Curador/Administrativo (que continua usando StorySummary/
// ReviewItem, intocados). O objetivo aqui é leitura, não conferência de
// formulário: cada resposta lida como um trecho da própria história, não como
// um par rótulo/valor.
const PARA_QUEM_LABELS: Record<string, string> = {
  "para-mim": "para você mesmo",
  "para-outra-pessoa": "para alguém que você acompanha",
};

const MODALIDADE_LABELS: Record<string, string> = {
  online: "online",
  presencial: "presencial",
  "tanto-faz": "tanto faz",
};

type NarrativePassageProps = {
  question: string;
  answer: string;
  editHref: string;
};

function NarrativePassage({ question, answer, editHref }: NarrativePassageProps) {
  if (!answer) {
    return null;
  }

  return (
    <div className="border-b border-border py-8 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-gold">{question}</p>
        <Link
          href={editHref}
          className="link-underline shrink-0 text-sm font-medium text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Editar
        </Link>
      </div>
      <p className="mt-4 whitespace-pre-line font-serif text-xl leading-relaxed text-ink">{answer}</p>
    </div>
  );
}

type StoryNarrativeProps = {
  data: SuaHistoriaData;
};

export function StoryNarrative({ data }: StoryNarrativeProps) {
  const paraQuem = data.paraQuem ? PARA_QUEM_LABELS[data.paraQuem] : null;
  const modalidade = data.preferenciaModalidade ? MODALIDADE_LABELS[data.preferenciaModalidade] : null;

  return (
    <div>
      {paraQuem || modalidade ? (
        <p className="border-b border-border pb-8 text-lg leading-relaxed text-ink-muted">
          {paraQuem ? <>Você está buscando este cuidado {paraQuem}</> : null}
          {paraQuem && modalidade ? ", " : null}
          {modalidade ? <>e prefere se conectar de forma {modalidade}.</> : paraQuem ? "." : null}
          {!paraQuem && !modalidade ? null : (
            <Link
              href="/sua-historia/para-quem"
              className="link-underline ml-2 text-sm font-medium text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Editar
            </Link>
          )}
        </p>
      ) : null}

      <NarrativePassage
        question="O que motivou esta busca"
        answer={data.motivo ?? ""}
        editHref="/sua-historia/motivo"
      />
      <NarrativePassage
        question="Sua história"
        answer={data.historia ?? ""}
        editHref="/sua-historia/historia"
      />
      <NarrativePassage
        question="Informações importantes"
        answer={data.informacoesImportantes ?? ""}
        editHref="/sua-historia/informacoes"
      />
    </div>
  );
}
