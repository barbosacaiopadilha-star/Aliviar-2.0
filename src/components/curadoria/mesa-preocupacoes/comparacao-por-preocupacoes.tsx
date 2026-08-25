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
type Dono = "VOCE" | "OPERACAO" | "NINGUEM";

const CLASSE_DO_DONO: Record<Dono, string> = {
  VOCE: "border-l-2 border-l-[var(--color-attention)] bg-[var(--color-attention-surface)]",
  OPERACAO: "border-l-2 border-l-[var(--color-border-strong)]",
  NINGUEM: "",
};

/**
 * O TERCEIRO DONO, QUE ESTAVA ESCRITO AQUI E NUNCA EXISTIU — `SIM-44`.
 *
 * A lista acima declarava três donos do próximo passo; o mapa antigo
 * implementava dois. Todo conceito `FORA_DO_MOTOR` recebia cor de atenção e o
 * texto *"Exige juízo seu"* — inclusive **convênio (P15) e custo (P16)**, que
 * o Método classifica como *"condições de possibilidade, não medida de
 * profissional"* (`participacao-no-motor.ts`) e que a ADR-092 deixa fora da
 * exigência pela mesma razão que ficam fora do Motor.
 *
 * A tela cobrava um ato que ninguém deve — e, pior, não oferecia onde cumpri-lo:
 * essas linhas não recebem `natureza`, logo nunca tiveram formulário de juízo.
 *
 * A regra que faltava já estava aplicada no módulo puro, em `Orfao.conferido`:
 * *"um conceito que o Método não cruza não pede conferência de ninguém —
 * cobrá-la seria inventar trabalho."* Aqui ela passa a valer também.
 *
 * `exigeJuizo` é a mesma pergunta que decide se a célula ganha formulário
 * (`juizoExigidoEm`). Uma fonte, duas consequências — nunca duas listas.
 */
function donoDoProximoPasso(motivo: Celula["motivo"], exigeJuizo: boolean): Dono {
  switch (motivo) {
    case "CRUZADO":
      return "NINGUEM";
    case "SEM_IMPORTANCIA_DECLARADA":
      return "VOCE";
    case "SEM_ESTADO_DECLARADO":
      return "OPERACAO";
    case "FORA_DO_MOTOR":
      return exigeJuizo ? "VOCE" : "NINGUEM";
  }
}

/** O texto de uma célula, e a razão do vazio quando há vazio. */
function textoDaCelula(
  celula: Celula,
  exigeJuizo: boolean,
): { titulo: string; detalhe: string | null } {
  switch (celula.motivo) {
    case "CRUZADO":
      return {
        titulo: COMPATIBILITY_LABELS[celula.compatibilidade!],
        detalhe: celula.estado ? SUBCRITERION_STATUS_LABELS[celula.estado] : null,
      };
    case "FORA_DO_MOTOR":
      return exigeJuizo
        ? {
            titulo: "Exige juízo seu",
            detalhe: "O Método não cruza este conceito automaticamente.",
          }
        : {
            titulo: "O Método não cruza isto",
            detalhe: "Condição de possibilidade, não medida de profissional — nada a julgar aqui.",
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
        const exigeJuizo = natureza !== null;
        const { titulo, detalhe } = textoDaCelula(celula, exigeJuizo);
        const dono = donoDoProximoPasso(celula.motivo, exigeJuizo);
        const pendente = celula.motivo !== "CRUZADO";
        return (
          <td
            key={celula.profissionalId}
            className={`border-b border-border px-4 py-3 align-top ${CLASSE_DO_DONO[dono]}`}
            data-motivo={celula.motivo}
            data-dono={dono}
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
 * O PONTO DE JUÍZO DO EIXO — que não é uma célula de comparação, e parou de
 * fingir que era (`SIM-43`).
 *
 * Antes, esta linha reaproveitava `Celulas` clonando as células do primeiro
 * subcritério do grupo com `motivo: "FORA_DO_MOTOR"` forçado, só para obter o
 * texto "Exige juízo seu". Saía `data-motivo="FORA_DO_MOTOR"` em conceitos que
 * o Motor CRUZA — `FORMACAO_GRADUACAO` entre eles. Funcionava, e afirmava uma
 * falsidade sobre o domínio num atributo que um teste futuro acreditaria.
 *
 * O juízo do eixo não tem leitura de Motor porque não é cruzamento nenhum: é o
 * ato que a ADR-067 §5 reserva a uma pessoa. Então ele não empresta a forma da
 * célula — tem a própria.
 */
function JuizoDoEixo({
  eixo,
  profissionais,
  caseId,
}: {
  eixo: string;
  profissionais: readonly { id: string; nome: string }[];
  caseId: string;
}) {
  return (
    <>
      {profissionais.map((profissional) => (
        <td
          key={profissional.id}
          className="border-b border-border px-4 py-3 align-top border-l-2 border-l-[var(--color-attention)] bg-[var(--color-attention-surface)]"
          data-ponto-de-juizo={eixo}
          data-dono="VOCE"
        >
          <span className="block text-sm font-medium text-ink-muted">Exige juízo seu</span>
          <RegistrarJuizoNaCelula
            caseId={caseId}
            professionalProfileId={profissional.id}
            professionalNome={profissional.nome}
            subcriterionCode={eixo}
            natureza="TECNICO"
            conclusaoVigente={null}
          />
        </td>
      ))}
    </>
  );
}

/**
 * O DESFECHO DO RECONHECIMENTO, dito pelo nome — `SIM-48`.
 *
 * @metodo M-001 §6.2.1 — os quatro desfechos
 * @metodo DT-22 — `CORRIGIDA` e `RECUSADA` guardam o texto DELA
 *
 * Desde o PP-03C a paciente discorda e corrige por conta própria. A Mesa
 * antiga tinha um painel só para isso, porque uma discordância no fim de uma
 * lista de dezessete podia atravessar a Curadoria sem ninguém ver.
 *
 * Aqui ela não precisa de painel: mora na linha da própria frase, que é onde a
 * ADR-093 diz que as coisas moram. E quando ela escreveu, o que aparece é o
 * que ELA escreveu — não um selo dizendo que houve escrita.
 */
function Reconhecimento({ linha }: { linha: Linha }) {
  if (linha.reconhecimento === "RECONHECIDA") return null;

  if (linha.reconhecimento === "PENDENTE") {
    return (
      <span className="mt-1 block text-xs text-ink-muted">Aguarda o reconhecimento dela.</span>
    );
  }

  const recusou = linha.reconhecimento === "RECUSADA";

  return (
    <span className="mt-1.5 block border-l-2 border-l-[var(--color-attention)] bg-[var(--color-attention-surface)] px-2 py-1 text-xs">
      <strong className="block font-medium text-ink">
        {recusou ? "Ela recusou esta leitura." : "Ela corrigiu esta leitura."}
      </strong>
      {linha.correcao ? (
        <span className="mt-0.5 block text-ink">“{linha.correcao}”</span>
      ) : (
        <span className="mt-0.5 block text-ink-muted">
          {recusou ? "Sem texto: procure-a antes de usar esta linha." : "Sem texto registrado."}
        </span>
      )}
    </span>
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
      </span>

      {/* O QUE ELA FEZ COM A LEITURA QUE FIZERAM DELA.
          Quatro desfechos, não um booleano (M-001 §6.2.1). Chamar de "aguarda
          o reconhecimento" uma recusa é dizer que ela está calada exatamente
          quando ela falou — e uma discordância que a tela chama de silêncio
          atravessa a Curadoria inteira sem ninguém ver. */}
      {linha.resposta ? <Reconhecimento linha={linha} /> : null}

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
        <span className="block text-sm font-medium text-ink">{orfao.rotulo}</span>
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
                    {/* `false`: linha que exige juízo NUNCA colapsa (SIM-43),
                        então aqui nunca há juízo pendente a nomear. */}
                    <span className="text-ink">{textoDaCelula(linha.celulas[0], false).titulo}</span>.
                    Não separa ninguém.
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
                  {/* O CABEÇALHO DO EIXO NÃO DEPENDE DE HAVER JUÍZO — `SIM-45`.
                      Ele só era renderizado quando o eixo exigia juízo, e por
                      isso PRATICA — o único dos quatro que não exige — nunca
                      mostrava o próprio nome. "Limites — o que declara não
                      fazer" estava definido logo acima e não aparecia em
                      lugar nenhum da tela. */}
                  <tr>
                    <th
                      scope="row"
                      className="border-b border-border bg-canvas px-4 py-3 text-left align-top"
                    >
                      <span className="block text-sm font-medium text-ink">
                        {ROTULO_DO_EIXO[grupo.eixo] ?? grupo.eixo.toLowerCase()}
                      </span>
                      <span className="mt-1 block text-xs text-ink-muted">
                        {grupo.juizo
                          ? "Um juízo por eixo, não por item — ADR-067 §5."
                          : "Sem juízo de eixo: o Método não o exige aqui."}
                      </span>
                    </th>
                    {grupo.juizo ? (
                      <JuizoDoEixo
                        eixo={grupo.eixo}
                        profissionais={profissionais}
                        caseId={caseId}
                      />
                    ) : (
                      <td
                        colSpan={profissionais.length}
                        className="border-b border-border px-4 py-3 align-top text-sm text-ink-muted"
                      />
                    )}
                  </tr>
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
