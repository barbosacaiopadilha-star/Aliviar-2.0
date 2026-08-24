import { ReconhecerPerfil } from "@/components/paciente/reconhecer-perfil";
import { ReconhecimentoDuasColunas } from "@/components/paciente/reconhecimento-duas-colunas";
import { Dobra } from "@/components/paciente/experiencia/dobra";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
import type { PerfilView } from "@/modules/paciente/experiencia";
import type { ComoQuerSerCuidadaItem } from "@/modules/paciente/experiencia-loader";
import type {
  LinhaDoReconhecimento,
  LinhaTecnica,
} from "@/modules/paciente/reconhecimento-contrato";

/**
 * O que mais importa para o seu caso — ADR-042, agora como eco.
 *
 * Antes este painel mostrava distribuição de pontos por critério. Ponto é
 * mecanismo interno: dizia como a Aliviar pondera, não o que ela escolheu.
 * Agora responde a pergunta dela — quais fatores foram considerados
 * prioritários —, agrupados pelo peso que ela mesma deu.
 *
 * A linguagem é de eco, nunca de diagnóstico (Linguagem §5): "foi isto que
 * entendemos do que você contou" — e o reconhecimento é dela, aqui (ADR-042).
 *
 * O que nunca atravessa: número, porcentagem, orçamento, cálculo. E nem os
 * níveis que ela declarou como pouco importantes somem: esconder o que ela
 * escolheu deixar de fora seria editar as palavras dela.
 *
 * Reabriga o conteúdo de /portal-paciente/prioridades (sem endereço desde o
 * 301 — Narrativa §8): a nota de que níveis nunca são nota de médico, o que
 * também foi registrado, e a data em que ela reconheceu o Perfil.
 */
export function PerfilPanel({
  perfil,
  caseId,
  observations = [],
  validatedAt,
  curatorName,
  comoQuerSerCuidada,
  linhas,
  tecnicos,
}: {
  perfil: PerfilView;
  caseId?: string;
  /** O que ela contou e orienta o cuidado — vem do registro da Curadoria. */
  observations?: string[];
  /** Quando ela reconheceu o Perfil; ausente enquanto o ato é dela. */
  validatedAt?: string | null;
  curatorName?: string | null;
  /** ADR-065 — o bloco relacional: as respostas dela, na linguagem dela. */
  comoQuerSerCuidada?: ComoQuerSerCuidadaItem[];
  /** Etapa 2B — a comparação, vinda pronta de `loadModeloDoReconhecimento`. */
  linhas?: LinhaDoReconhecimento[];
  /** Etapa 2B — o terceiro bloco, já separado no modelo. */
  tecnicos?: LinhaTecnica[];
}) {
  /**
   * B6 — QUAL SUPERFÍCIE ELA VÊ AO RECONHECER.
   *
   * A superfície antiga do reconhecimento é a lista de níveis abaixo: ela
   * mostra o que ficou registrado **sem a fala dela ao lado**, que é exatamente
   * o achado P8 — reconhecer uma tradução sem ver a tradução. Enquanto o ato é
   * dela, a comparação toma o lugar da lista; as duas nunca aparecem juntas,
   * para não existirem dois retratos concorrentes do mesmo Perfil.
   *
   * Depois do reconhecimento, a lista volta a ser o retrato — não há mais o que
   * comparar, e o que ela quer ver é o Perfil que passou a orientar a Curadoria.
   */
  const comparacao = linhas ?? [];
  const tecnicosDoBloco = tecnicos ?? [];
  const reconhecendo =
    !perfil.validated && (comparacao.length > 0 || tecnicosDoBloco.length > 0);

  return (
    <PatientCard>
      <h2 className="font-serif text-xl font-medium text-[var(--patient-ink)]">
        O que mais importa para o seu caso
      </h2>
      {/* O headline é a voz de estado do eco — "foi isto que entendemos", e
          depois do reconhecimento, "este Perfil é seu". Nunca diagnóstico. */}
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {perfil.headline}
      </p>

      {reconhecendo ? (
        <div className="mt-5">
          <ReconhecimentoDuasColunas
            linhas={comparacao}
            tecnicos={tecnicosDoBloco}
            caseId={caseId}
          />
        </div>
      ) : perfil.prioridades.length === 0 ? (
        // Nunca um card vazio: o estado é dito por nome.
        <p className="mt-4 max-w-reading text-sm leading-relaxed text-ink-muted">
          Assim que esta etapa for concluída, você verá aqui o que foi considerado mais importante
          para o seu caso. Isso nasce da conversa com seu Curador, com as suas palavras.
        </p>
      ) : (
        /* CORTE DE 23/08 (decisão do Fundador, "aplique todos os cortes"): o
           Mapa listava TODOS os fatores abertos de uma vez — a mesma doença
           que a carta do caminho tinha. Mesma cura: cada nível vira uma
           dobra, só o mais importante nasce aberto. Nenhum nível some — nem
           os que ela declarou pouco importantes, porque esconder o que ela
           escolheu deixar de fora seria editar as palavras dela. */
        <div className="mt-5 space-y-3">
          {perfil.prioridades.map((nivel, indice) => (
            <Dobra
              key={nivel.level}
              titulo={nivel.label}
              rotulo={nivel.label}
              abertaInicial={indice === 0}
            >
              <ul className="space-y-1">
                {nivel.itens.map((item) => (
                  <li key={item} className="text-sm text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </Dobra>
          ))}
        </div>
      )}

      {/* ADR-065 — o bloco relacional do Perfil: o que ELA respondeu sobre a
          forma de ser cuidada, com o peso que ela deu. Eco, nunca cruzamento:
          nenhum resultado, nenhuma célula, nenhum profissional aqui. */}
      {(comoQuerSerCuidada?.length ?? 0) > 0 ? (
        <div className="mt-3">
          <Dobra titulo="Como você quer ser cuidada" rotulo="Como você quer ser cuidada">
            <ul className="space-y-3">
              {comoQuerSerCuidada!.map((item) => (
                <li key={item.code} className="text-sm leading-relaxed text-ink">
                  <span className="block text-xs text-ink-muted">
                    {item.conceptName} — {item.degreeLabel}
                  </span>
                  {item.texto ? (
                    <span className="mt-0.5 block max-w-prose font-serif">{item.texto}</span>
                  ) : item.escolhas.length > 0 ? (
                    <span className="mt-0.5 block max-w-prose">{item.escolhas.join("; ")}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Dobra>
        </div>
      ) : null}

      {observations.length > 0 ? (
        <div className="mt-3">
          <Dobra titulo="Também registramos" rotulo="Também registramos">
            <ul className="space-y-2">
              {observations.map((observation) => (
                <li key={observation} className="text-sm leading-relaxed text-ink">
                  {observation}
                </li>
              ))}
            </ul>
          </Dobra>
        </div>
      ) : null}

      {/* A nota explica a LISTA de níveis. Quando a comparação toma o lugar
          dela, a nota sai junto: explicar uma lista que não está na tela é
          apontar para o vazio. */}
      {!reconhecendo && perfil.prioridades.length > 0 ? (
        <p className="mt-6 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Estes níveis representam apenas a importância que você atribuiu a cada aspecto durante a
          conversa. Eles falam do que importa para você — nenhum profissional é medido por eles.
        </p>
      ) : null}

      {validatedAt ? (
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Você reconheceu este Perfil em{" "}
          {new Date(validatedAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            // Fuso fixo — mesma regra do achado de 23/08: servidor em UTC e
            // navegador local davam datas diferentes para o mesmo instante.
            timeZone: "America/Sao_Paulo",
          })}
          {curatorName ? `, junto com ${curatorName}` : ""}. A partir daí ele passou a orientar
          toda a Curadoria.
        </p>
      ) : null}

      {/* C5 — O QUADRANTE DESCOBERTO PELO AGENTE 04.
          Antes, a condição exigia `prioridades.length > 0`. Com Mapa vazio e
          declaração dela existindo, a comparação aparecia e o bloco do ato
          simplesmente não era renderizado: nenhuma ação, nenhuma explicação,
          silêncio. Agora o bloco sempre entra quando o ato é dela, e é
          `decideAcknowledgement` — que já sabe distinguir Mapa incompleto de
          Perfil substituído — quem diz por que não há o que praticar. A
          comparação não é escondida, e nenhum registro é inventado. */}
      {!perfil.validated && caseId ? (
        <ReconhecerPerfil
          caseId={caseId}
          pendentes={perfil.total - perfil.classificados}
          validated={perfil.validated}
        />
      ) : null}
    </PatientCard>
  );
}
