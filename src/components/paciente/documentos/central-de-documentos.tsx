"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import type { DocumentCenterItem } from "@/modules/paciente/central-de-documentos";
import {
  ACCEPT_DE_DOCUMENTO,
  RESUMO_DA_POLITICA_DE_ARQUIVO,
} from "@/modules/profiles/document-file-policy";
import {
  deletePatientDocumentAction,
  obterLinkDeDocumentoAction,
  uploadPatientDocumentAction,
} from "@/modules/profiles/patient-document-actions";
import type { ActionResult, PatientDocument } from "@/modules/profiles/types";

/**
 * A6 · A CENTRAL DE DOCUMENTOS DA PACIENTE.
 *
 * Esta tela **não classifica nada**. Ela recebe `DocumentCenterItem[]` prontos
 * da projeção da D-12.2 e apenas os apresenta. Não existe aqui comparação de
 * `uploaded_by`, leitura de `case_id`, interpretação de `file_path` nem
 * qualquer reconstrução do portão de `deliveredAt` — e não é disciplina, é
 * tipo: nada disso chega até aqui.
 *
 * O QUE ELA PRECISA RESPONDER EM CINCO SEGUNDOS
 *
 *   o que a Aliviar me entregou · o que eu enviei · onde está minha História
 *   · o que posso abrir ou baixar
 *
 * Por isso são três seções nomeadas, na ordem da utilidade: o que ela RECEBEU
 * vem primeiro quando existe, porque é a resposta que ela veio buscar. Quando
 * não existe, uma área vazia não ocupa o topo — a que tem ação vai à frente.
 *
 * **Não é um gerenciador de arquivos.** Sem tabela, sem grid, sem ícone por
 * extensão, sem contagem. Uma lista editorial: título legível, metadado
 * discreto embaixo, ação à direita, linha fina separando.
 */

type Props = {
  itens: DocumentCenterItem[];
};

type UploadResult = ActionResult | { success: true; document: PatientDocument };

const RECEBIDOS = "RECEIVED_FROM_ALIVIAR";
const ENVIADOS = "SENT_BY_PATIENT";
const HISTORIA = "HISTORY_OR_FORM";

export function CentralDeDocumentos({ itens }: Props) {
  const recebidos = itens.filter((i) => i.category === RECEBIDOS);
  const enviados = itens.filter((i) => i.category === ENVIADOS);
  const historia = itens.filter((i) => i.category === HISTORIA);

  // §17: o que ela recebeu vem primeiro quando existe. Vazio, não domina o
  // topo — quem tem ação sobe.
  const recebidosPrimeiro = recebidos.length > 0;

  const secaoRecebidos = (
    <Secao
      key="recebidos"
      titulo="Recebidos da Aliviar"
      descricao="Documentos e entregas que a Aliviar disponibilizou para você."
      itens={recebidos}
      vazio="Quando a Aliviar disponibilizar um documento para você, ele ficará aqui."
    />
  );

  const secaoEnviados = (
    <Secao
      key="enviados"
      titulo="Enviados por você"
      descricao="Exames, laudos e outros documentos que você compartilhou."
      itens={enviados}
      vazio="Os documentos que você enviar ficam reunidos aqui."
      acessorio={<Envio />}
      removivel
    />
  );

  return (
    <div className="space-y-16">
      {recebidosPrimeiro ? [secaoRecebidos, secaoEnviados] : [secaoEnviados, secaoRecebidos]}

      <Secao
        titulo="Sua História e formulários"
        descricao="O que você contou à Aliviar, no seu tempo."
        itens={historia}
        vazio="Sua História aparece aqui quando você começar a contá-la."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Secao({
  titulo,
  descricao,
  itens,
  vazio,
  acessorio,
  removivel = false,
}: {
  titulo: string;
  descricao: string;
  itens: DocumentCenterItem[];
  vazio: string;
  acessorio?: React.ReactNode;
  removivel?: boolean;
}) {
  return (
    <section className="space-y-5">
      <header className="max-w-2xl space-y-1.5">
        <h2 className="font-serif text-2xl font-medium tracking-tight text-[var(--patient-ink)]">
          {titulo}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">{descricao}</p>
      </header>

      {acessorio}

      {itens.length === 0 ? (
        // Estado vazio é frase, não diagnóstico de sistema. Nunca "nenhum
        // registro encontrado" — ela não está consultando um banco.
        <p className="border-t border-[var(--patient-mist)] pt-5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {vazio}
        </p>
      ) : (
        <ul className="border-t border-[var(--patient-mist)]">
          {itens.map((item) => (
            <Item key={item.id} item={item} removivel={removivel} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Item({ item, removivel }: { item: DocumentCenterItem; removivel: boolean }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, startTransition] = useTransition();

  const ehArquivo = item.sourceReference.kind === "patient_document";
  const documentId = item.sourceReference.kind === "patient_document" ? item.sourceReference.documentId : null;

  function abrir() {
    if (!documentId) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await obterLinkDeDocumentoAction(documentId);
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }
      // O link nasce no clique, vale um minuto e não é guardado em lugar
      // nenhum — nem no estado da tela.
      window.open(resultado.url, "_blank", "noopener,noreferrer");
    });
  }

  function remover() {
    if (!documentId) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await deletePatientDocumentAction(documentId);
      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }
      // A lista volta da projeção, nunca de uma cópia montada aqui.
      router.refresh();
    });
  }

  return (
    <li className="border-b border-[var(--patient-mist)] py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="min-w-0 space-y-1">
          {/* `break-words`, nunca `truncate`: o nome do exame dela não é
              detalhe que se corta para caber. */}
          <p className="break-words font-serif text-lg leading-snug text-[var(--patient-ink)]">
            {item.title}
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
            <Metadados item={item} />
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
          <AcaoPrimaria item={item} ocupado={ocupado} onAbrir={abrir} />
          <AcaoImprimir item={item} />
          {removivel && ehArquivo ? (
            <button
              type="button"
              onClick={remover}
              disabled={ocupado}
              className="inline-flex min-h-11 items-center text-sm text-[var(--color-ink-muted)] underline underline-offset-4 transition-colors hover:text-[var(--patient-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Remover<span className="sr-only"> {item.title}</span>
            </button>
          ) : null}
        </div>
      </div>

      {erro ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {erro}
        </p>
      ) : null}
    </li>
  );
}

/**
 * A linha discreta embaixo do título. Data humana quando existe — nunca
 * timestamp técnico, nunca data inventada quando ausente.
 */
function Metadados({ item }: { item: DocumentCenterItem }) {
  const partes: string[] = [];

  if (item.category === RECEBIDOS) {
    // §19: comunica a origem sem furar a abstração. A projeção não diz qual
    // Curador depositou, e a tela não inventa.
    partes.push("Disponibilizado pela Aliviar");
  }

  if (item.date) partes.push(dataHumana(item.date));

  if (!item.downloadCapability.available && item.kind === "PLATFORM_ARTIFACT") {
    // Dizer o que ainda não dá para fazer é parte do trabalho: o silêncio
    // pareceria descuido.
    partes.push("sem versão para baixar por enquanto");
  }

  return <>{partes.join(" · ")}</>;
}

function AcaoPrimaria({
  item,
  ocupado,
  onAbrir,
}: {
  item: DocumentCenterItem;
  ocupado: boolean;
  onAbrir: () => void;
}) {
  const acao = item.primaryAction;

  if (acao.verb === "DOWNLOAD") {
    return (
      <button
        type="button"
        onClick={onAbrir}
        disabled={ocupado}
        className={LINK_DE_ACAO}
      >
        {ocupado ? "Abrindo…" : acao.label}
        {/* O leitor de tela ouve "Baixar exame.pdf", não só "Baixar". */}
        <span className="sr-only"> {item.title}</span>
      </button>
    );
  }

  return (
    <a href={acao.href} className={LINK_DE_ACAO}>
      {acao.label}
      <span className="sr-only"> {item.title}</span>
    </a>
  );
}

/** "Levar em PDF" só existe quando há tela imprimível de verdade. */
function AcaoImprimir({ item }: { item: DocumentCenterItem }) {
  if (item.downloadCapability.kind !== "PRINTABLE_VIEW") return null;

  return (
    <a href={item.downloadCapability.href} className={LINK_DE_ACAO}>
      Levar em PDF
      <span className="sr-only"> — {item.title}</span>
    </a>
  );
}

const LINK_DE_ACAO =
  "inline-flex min-h-11 items-center text-sm font-medium text-[var(--patient-acento)] underline underline-offset-4 transition-colors hover:text-[var(--patient-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-50";

// ---------------------------------------------------------------------------

/**
 * O envio. Mantido do que existia, com o que faltava: a regra dita ANTES de
 * escolher o arquivo, e o `accept` na mesma lista do servidor.
 */
function Envio() {
  const router = useRouter();
  const [nome, setNome] = useState<string | null>(null);
  const [estado, formAction, enviando] = useActionState<UploadResult | undefined, FormData>(
    uploadPatientDocumentAction,
    undefined,
  );

  useEffect(() => {
    // Sucesso não monta item na mão: pede a lista de volta à projeção.
    if (estado?.success) {
      setNome(null);
      router.refresh();
    }
  }, [estado, router]);

  return (
    <div className="space-y-3 border-t border-[var(--patient-mist)] pt-5">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/*
              O controle nativo é escondido, não removido: ele continua sendo
              o campo real, focável e associado ao rótulo. O que sai de cena é
              só a moldura do navegador — que escreve "Choose File" no idioma
              DELE, e não há como traduzi-la. Um produto em português não pode
              depender da localidade de quem visita.
            */}
            <input
              id="documento-da-paciente"
              type="file"
              name="file"
              required
              accept={ACCEPT_DE_DOCUMENTO}
              aria-describedby="politica-de-arquivo"
              onChange={(evento) => setNome(evento.target.files?.[0]?.name ?? null)}
              className="peer sr-only"
            />
            <label
              htmlFor="documento-da-paciente"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[var(--patient-mist)] px-5 text-sm font-medium text-[var(--patient-ink)] transition-colors hover:bg-[var(--patient-linen)] peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-2"
            >
              Escolher arquivo
            </label>
            <span className="min-w-0 break-words text-sm text-[var(--color-ink-muted)]">
              {nome ?? "Nenhum arquivo escolhido"}
            </span>
          </div>
          {/* §11: a regra é dita antes, não depois da recusa. */}
          <p id="politica-de-arquivo" className="text-xs text-[var(--color-ink-muted)]">
            {RESUMO_DA_POLITICA_DE_ARQUIVO}
          </p>
        </div>
        <Button type="submit" variant="secondary" isLoading={enviando} className="w-full sm:w-auto">
          Enviar
        </Button>
      </form>

      {estado && !estado.success ? <FormMessage variant="error">{estado.error}</FormMessage> : null}
      {estado?.success ? (
        <FormMessage variant="success">Documento enviado. Ele já aparece na lista.</FormMessage>
      ) : null}
    </div>
  );
}

/** "12 de agosto de 2026" — o formato que ela usaria ao falar. */
function dataHumana(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
