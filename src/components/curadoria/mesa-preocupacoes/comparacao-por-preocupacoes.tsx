/**
 * A COMPARAÇÃO, ORGANIZADA PELO QUE ELA DISSE.
 *
 * @metodo ADR-093 — as linhas são as preocupações dela, não a taxonomia
 * @metodo ADR-041 — o Motor organiza; a conclusão é do Curador
 *
 * Cada linha começa com uma frase dela. O código do subcritério existe, mas
 * fica em segundo plano — quem trabalha aqui está olhando para uma pessoa, não
 * para uma matriz.
 *
 * Os três vazios aparecem DIFERENTES de propósito. "O Método não cruza isto",
 * "ninguém declarou a importância" e "ninguém declarou o estado" pediam a mesma
 * célula cinza na Mesa antiga, e o resultado era a frase "23 lacunas de
 * informação" — que não é acionável porque não diz de quem é a próxima ação.
 */

import type {
  Celula,
  Linha,
  MesaPorPreocupacoes,
  Orfao,
} from "@/modules/curadoria/mesa-por-preocupacoes";
import { COMPATIBILITY_LABELS } from "@/modules/curadoria/motor-compatibilidade";
import { IMPORTANCE_LABELS } from "@/modules/curadoria/mapa-prioridades";
import { NEED_DEGREE_LABELS } from "@/modules/curadoria/protocolos";
import { SUBCRITERION_STATUS_LABELS } from "@/modules/curadoria/mapa-profissional";

import { RegistrarRespostaDela } from "./registrar-resposta-dela";

type Props = MesaPorPreocupacoes & {
  caseId: string;
  profissionais: readonly { id: string; nome: string }[];
};

/** O texto de uma célula, e a razão do vazio quando há vazio. */
function textoDaCelula(celula: Celula): { titulo: string; detalhe: string | null } {
  switch (celula.motivo) {
    case "CRUZADO":
      return {
        titulo: COMPATIBILITY_LABELS[celula.compatibilidade!],
        detalhe: celula.estado ? SUBCRITERION_STATUS_LABELS[celula.estado] : null,
      };
    case "FORA_DO_MOTOR":
      return {
        titulo: "Exige juízo seu",
        detalhe: "O Método não cruza este conceito automaticamente.",
      };
    case "SEM_IMPORTANCIA_DECLARADA":
      return {
        titulo: "Falta você declarar",
        detalhe: "Quanto isto importa para ela ainda não foi classificado.",
      };
    case "SEM_ESTADO_DECLARADO":
      return {
        titulo: "Falta descobrir",
        detalhe: "Ninguém verificou isto sobre este profissional.",
      };
  }
}

function Celulas({ celulas }: { celulas: readonly Celula[] }) {
  return (
    <>
      {celulas.map((celula) => {
        const { titulo, detalhe } = textoDaCelula(celula);
        const pendente = celula.motivo !== "CRUZADO";
        return (
          <td
            key={celula.profissionalId}
            className="border-b border-border px-4 py-3 align-top"
            data-motivo={celula.motivo}
          >
            <span
              className={
                pendente
                  ? "block text-sm font-medium text-ink-muted"
                  : "block text-sm font-medium text-ink"
              }
            >
              {titulo}
            </span>
            {detalhe ? (
              <span className="mt-0.5 block text-xs text-ink-muted">{detalhe}</span>
            ) : null}
          </td>
        );
      })}
    </>
  );
}

/**
 * A coluna da esquerda: ela.
 *
 * A frase dela é o título. A pergunta que a provocou fica abaixo, menor —
 * porque quem lê a linha precisa saber o que foi perguntado, mas o que ela
 * respondeu é que manda.
 */
function CabecalhoDaLinha({ linha, caseId }: { linha: Linha; caseId: string }) {
  // Sem resposta dela, a PERGUNTA vira o título — e não uma repetição de
  // "ela ainda não respondeu" dezessete vezes seguidas, que foi o primeiro
  // desenho e ficava pior que a taxonomia: pelo menos a taxonomia nomeia o
  // conceito. Enquanto a conversa não aconteceu, o que a tela tem de mais
  // útil a dizer é o que falta perguntar.
  const semResposta = linha.resposta === null;

  return (
    <th scope="row" className="border-b border-border px-4 py-3 text-left align-top">
      <span
        className={
          semResposta
            ? "block text-sm font-medium text-ink-muted"
            : "block text-sm font-medium text-ink"
        }
      >
        {linha.resposta ?? linha.pergunta}
      </span>
      <span className="mt-1 block text-xs text-ink-muted">
        {semResposta ? "Ainda não perguntado a ela." : linha.pergunta}
      </span>
      <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        <span className="font-mono">{linha.questionId}</span>
        {linha.grau ? <span>· para ela: {NEED_DEGREE_LABELS[linha.grau]}</span> : null}
        {linha.importancia ? <span>· você: {IMPORTANCE_LABELS[linha.importancia]}</span> : null}
        {linha.resposta && !linha.reconhecida ? (
          <span className="text-ink-muted">· aguarda o reconhecimento dela</span>
        ) : null}
      </span>

      {/* Registrar acontece NA LINHA — é o ponto da ADR-093. Na Mesa antiga a
          conversa vivia noutra tela, com dezessete fichas recolhidas, longe da
          consequência que ela produz. */}
      {caseId && linha.opcoes.length > 0 ? (
        <RegistrarRespostaDela
          caseId={caseId}
          questionId={linha.questionId}
          subcriterionCode={linha.subcriterionCode}
          pergunta={linha.pergunta}
          opcoes={linha.opcoes}
          multi={linha.multi}
          origem={linha.origem}
          opcoesJaMarcadas={linha.opcoesMarcadas}
          grauJaDeclarado={linha.grau}
        />
      ) : null}
    </th>
  );
}

function LinhaOrfa({ orfao }: { orfao: Orfao }) {
  return (
    <tr>
      <th scope="row" className="border-b border-border px-4 py-3 text-left align-top">
        <span className="block text-sm font-medium text-ink">
          {orfao.subcriterionCode.replace(/_/g, " ").toLowerCase()}
        </span>
        <span className="mt-1 block text-xs text-ink-muted">
          {orfao.importancia
            ? `Você declarou: ${IMPORTANCE_LABELS[orfao.importancia]}`
            : "Ela não tem como pedir isto — a classificação é sua."}
        </span>
      </th>
      <Celulas celulas={orfao.celulas} />
    </tr>
  );
}

export function ComparacaoPorPreocupacoes({
  caseId,
  linhas,
  orfaos,
  pendentesDeConferencia,
  conferenciaCompleta,
  profissionais,
}: Props) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-ink">O que ela pediu, e quem responde</h2>
        <p className="text-sm text-ink-muted">
          Cada linha é uma coisa que ela disse. O Motor lê e sinaliza; a conclusão é sua.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">
            Comparação dos profissionais pelas preocupações declaradas por ela
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-[22rem] border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Nas palavras dela
              </th>
              {profissionais.map((profissional) => (
                <th
                  key={profissional.id}
                  scope="col"
                  className="border-b border-border px-4 py-2 text-sm font-medium text-ink"
                >
                  {profissional.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.questionId}>
                <CabecalhoDaLinha linha={linha} caseId={caseId} />
                <Celulas celulas={linha.celulas} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <header className="flex flex-col gap-1">
          <h3 className="text-base font-medium text-ink">
            O que ela não tem como pedir
          </h3>
          <p className="max-w-3xl text-sm text-ink-muted">
            Nenhuma pessoa pergunta pelo volume cirúrgico de quem vai operá-la — e é para isso
            que existe curadoria. Estes {orfaos.length} conceitos não vieram da conversa: a
            classificação é sua.{" "}
            {pendentesDeConferencia.length > 0 ? (
              <strong className="font-medium text-ink">
                {pendentesDeConferencia.length} ainda esperam.
              </strong>
            ) : (
              <span>Todos já foram tratados.</span>
            )}
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <caption className="sr-only">
              Conceitos técnicos, classificados pelo Curador
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-[22rem] border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Conceito do Método
                </th>
                {profissionais.map((profissional) => (
                  <th
                    key={profissional.id}
                    scope="col"
                    className="border-b border-border px-4 py-2 text-sm font-medium text-ink"
                  >
                    {profissional.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orfaos.map((orfao) => (
                <LinhaOrfa key={orfao.subcriterionCode} orfao={orfao} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* A promessa da ADR-093, visível para quem opera — e não só para o teste. */}
      <p className="text-xs text-ink-muted">
        {conferenciaCompleta
          ? `Cobertura completa: os ${linhas.length + orfaos.length} conceitos ativos do Método estão nesta tela, ${linhas.length} pela voz dela e ${orfaos.length} pela sua.`
          : "ATENÇÃO: algum conceito ativo do Método não apareceu nesta tela. Isto é defeito — avise a engenharia."}
      </p>
    </section>
  );
}
