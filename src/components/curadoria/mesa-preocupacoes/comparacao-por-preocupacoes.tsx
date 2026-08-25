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

import { Fragment } from "react";

import { juizoExigidoEm } from "@/modules/curadoria/mesa-por-preocupacoes";
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

import { RegistrarJuizoNaCelula } from "./registrar-juizo-na-celula";
import { RegistrarRespostaDela } from "./registrar-resposta-dela";

/** O eixo dito como gente fala. O código cru não é para ser lido na tela. */
const ROTULO_DO_EIXO: Record<string, string> = {
  EXPERIENCIA: "Experiência — o que já fez",
  PRATICA: "Limites — o que declara não fazer",
  HISTORICO: "Histórico — por onde passou",
  FORMACAO: "Formação — onde estudou",
};

/**
 * O peso dela, curto.
 *
 * `NEED_DEGREE_LABELS` traz "Essencial — sem isso o cuidado não acontece", que
 * é o rótulo do FORMULÁRIO: existe para alguém escolher entre quatro opções.
 * Dentro de uma linha da tabela ele vira ruído, e a linha tem outras cinco
 * informações competindo. Mesmo erro do "·" e do "preciso de atendimento
 * presencial era essencial": texto certo, lugar errado.
 */
const GRAU_CURTO: Record<string, string> = {
  ESSENCIAL: "essencial",
  PESA_MUITO: "pesa muito",
  DESEJAVEL: "desejável",
  SEM_PREFERENCIA: "sem preferência",
};

type Props = MesaPorPreocupacoes & {
  caseId: string;
  profissionais: readonly { id: string; nome: string }[];
};

/**
 * A COR DIZ DE QUEM É A PRÓXIMA AÇÃO — nunca quem é melhor.
 *
 * A armadilha, nomeada para não ser esquecida: se "Alta compatibilidade"
 * ficasse verde e "Média" amarela, o Curador passaria a contar verdes. Isso é
 * ranking com outro nome, e é a única coisa que esta tela não pode fazer — no
 * dia em que ela ordena, a Aliviar passou a escolher o médico (ADR-041).
 *
 * Então os quatro resultados do Motor continuam em TEXTO, sem escala de cor. O
 * que ganha cor é a pendência, e a cor responde a uma pergunta só: quem deve o
 * próximo passo?
 *
 *   você      — o Curador, agora, nesta tela
 *   operação  — alguém precisa ir descobrir; não é trabalho de julgar
 *   ninguém   — o Método decidiu não cruzar isto, e está encerrado
 */
const COR_DA_PENDENCIA: Record<Celula["motivo"], { classe: string; dono: string }> = {
  CRUZADO: { classe: "", dono: "" },
  SEM_IMPORTANCIA_DECLARADA: {
    classe: "border-l-2 border-l-[var(--color-attention)] bg-[var(--color-attention-surface)]",
    dono: "você",
  },
  SEM_ESTADO_DECLARADO: {
    classe: "border-l-2 border-l-[var(--color-border-strong)]",
    dono: "operação",
  },
  FORA_DO_MOTOR: {
    classe: "border-l-2 border-l-[var(--color-attention)] bg-[var(--color-attention-surface)]",
    dono: "você",
  },
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

function Celulas({
  celulas,
  caseId,
  subcriterionCode,
  nomePorId,
  natureza = null,
}: {
  celulas: readonly Celula[];
  caseId: string;
  subcriterionCode: string;
  nomePorId: ReadonlyMap<string, string>;
  /** Quando o juízo pertence a este ponto. `null` = não pedir aqui. */
  natureza?: "TECNICO" | "RELACIONAL" | null;
}) {

  return (
    <>
      {celulas.map((celula) => {
        const { titulo, detalhe } = textoDaCelula(celula);
        const pendente = celula.motivo !== "CRUZADO";
        return (
          <td
            key={celula.profissionalId}
            className={`border-b border-border px-4 py-3 align-top ${COR_DA_PENDENCIA[celula.motivo].classe}`}
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
            {natureza ? (
              <RegistrarJuizoNaCelula
                caseId={caseId}
                professionalProfileId={celula.profissionalId}
                professionalNome={nomePorId.get(celula.profissionalId) ?? "este profissional"}
                subcriterionCode={subcriterionCode}
                natureza={natureza}
                conclusaoVigente={null}
              />
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
        {linha.grau ? <span>· para ela: {GRAU_CURTO[linha.grau]}</span> : null}
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

function LinhaOrfa({
  orfao,
  caseId,
  nomePorId,
}: {
  orfao: Orfao;
  caseId: string;
  nomePorId: ReadonlyMap<string, string>;
}) {
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
      <Celulas
        celulas={orfao.celulas}
        caseId={caseId}
        subcriterionCode={orfao.subcriterionCode}
        nomePorId={nomePorId}
      />
    </tr>
  );
}

export function ComparacaoPorPreocupacoes({
  caseId,
  linhas,
  orfaos,
  gruposDeOrfaos,
  pendentesDeConferencia,
  conferenciaCompleta,
  profissionais,
}: Props) {
  const nomePorId = new Map(profissionais.map((p) => [p.id, p.nome]));

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-medium text-ink">O que ela pediu, e quem responde</h2>
        <p className="text-sm text-ink-muted">
          Cada linha é uma coisa que ela disse. O Motor lê e sinaliza; a conclusão é sua.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md border border-border px-4 py-3 text-xs text-ink-muted">
        <span className="font-medium text-ink">Como ler:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-1 bg-[var(--color-attention)]" aria-hidden="true" />
          espera <strong className="font-medium text-ink">você</strong>, nesta tela
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-1 bg-[var(--color-border-strong)]"
            aria-hidden="true"
          />
          espera a <strong className="font-medium text-ink">operação</strong> ir descobrir
        </span>
        <span>sem marca — nada devido</span>
        <span className="w-full text-ink-muted">
          A cor diz de quem é o próximo passo, nunca quem é melhor. Comparar contagens de cor
          seria ranquear os profissionais — e a escolha é sua, não da tela.
        </span>
      </div>

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
                {/* Linha em que os três respondem igual não separa ninguém: ela
                    encolhe para uma frase e devolve o espaço às que separam.
                    A informação não some — deixa de gritar. */}
                {linha.todosIguais ? (
                  <td
                    colSpan={profissionais.length}
                    className="border-b border-border px-4 py-3 align-top text-sm text-ink-muted"
                  >
                    Os três respondem igual aqui:{" "}
                    <span className="text-ink">{textoDaCelula(linha.celulas[0]).titulo}</span>. Não
                    separa ninguém.
                  </td>
                ) : (
                  <Celulas
                    celulas={linha.celulas}
                    caseId={caseId}
                    subcriterionCode={linha.subcriterionCode}
                    nomePorId={nomePorId}
                    natureza={juizoExigidoEm(linha.subcriterionCode)}
                  />
                )}
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
              {gruposDeOrfaos.map((grupo) => (
                <Fragment key={grupo.eixo}>
                  {grupo.juizo ? (
                    <tr>
                      <th
                        scope="row"
                        className="border-b border-border bg-canvas px-4 py-3 text-left align-top"
                      >
                        <span className="block text-sm font-medium text-ink">
                          {ROTULO_DO_EIXO[grupo.eixo] ?? grupo.eixo.toLowerCase()}
                        </span>
                        <span className="mt-1 block text-xs text-ink-muted">
                          Um juízo por eixo, não por item — ADR-067 §5.
                        </span>
                      </th>
                      <Celulas
                        celulas={grupo.itens[0].celulas.map((c) => ({
                          ...c,
                          motivo: "FORA_DO_MOTOR" as const,
                        }))}
                        caseId={caseId}
                        subcriterionCode={grupo.eixo}
                        nomePorId={nomePorId}
                        natureza="TECNICO"
                      />
                    </tr>
                  ) : null}
                  {grupo.itens.map((orfao) => (
                    <LinhaOrfa
                      key={orfao.subcriterionCode}
                      orfao={orfao}
                      caseId={caseId}
                      nomePorId={nomePorId}
                    />
                  ))}
                </Fragment>
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
