import type {
  LinhaDoReconhecimento,
  LinhaTecnica,
} from "@/modules/paciente/reconhecimento-contrato";

/**
 * O Perfil em duas colunas — o que ela disse, e o que virou.
 *
 * @metodo Arquitetura §6.2.1 — reconhecimento em duas colunas (ressalva RS-01)
 * @metodo Auditoria P8 — o "seu Perfil" que ela reconhece é hoje a
 *         classificação do Curador, apresentada como construída com ela
 * @metodo Congelamento I-8 — ausência de informação nunca vira ausência da
 *         característica
 *
 * Por que existe: ela reconhece como seu um Perfil que foi traduzido, sem ver a
 * tradução. A coluna 1 é a fala dela; a coluna 2 é o que o Método registrou a
 * partir dela — com autoria. Ver as duas lado a lado é a única forma de o
 * reconhecimento ser um ato informado em vez de um voto de confiança.
 *
 * Esta tela NÃO decide nada: recebe a cadeia de proveniência montada pelo Item
 * 1.9 e apenas a apresenta. Nenhum estado novo, nenhum critério novo, nenhuma
 * regra própria — inclusive as lacunas exibidas são as que a cadeia nomeia.
 */

/**
 * Os tipos moram em `@/modules/paciente/reconhecimento-contrato` (B1): a camada
 * de dados não pode depender de um `.tsx`. Reexportados aqui só para não
 * quebrar quem já os importava deste caminho.
 */
export type { LinhaDoReconhecimento, LinhaTecnica };

/** Uma data como ela lê — nunca o carimbo cru do banco. */
function emPortugues(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * A procedência de um registro, dita por inteiro ou não dita.
 *
 * O que nunca acontece aqui: completar metade. Se falta o autor, a frase não
 * inventa "pela Curadoria"; se falta a data, não aproxima. Uma lacuna dita por
 * nome é informação; uma lacuna preenchida é mentira (I-8).
 */
function procedencia(autor: string | null, registradoEm: string | null): string {
  if (autor && registradoEm) return `Registrado por ${autor} em ${emPortugues(registradoEm)}.`;
  if (autor) return `Registrado por ${autor} — não consta a data.`;
  if (registradoEm) {
    return `Registrado em ${emPortugues(registradoEm)} — não consta quem registrou.`;
  }
  return "Registro anterior ao regime de autoria — não consta quem registrou, nem quando.";
}

export function ReconhecimentoDuasColunas({
  linhas,
  tecnicos = [],
}: {
  linhas: LinhaDoReconhecimento[];
  /** Terceiro bloco — declarações do Curador, sem lado dela. */
  tecnicos?: LinhaTecnica[];
}) {
  if (linhas.length === 0 && tecnicos.length === 0) {
    return (
      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
        Ainda não há nada para comparar aqui — o Perfil começa a existir quando você responde o que
        importa para você.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-4">
      {linhas.map((linha) => {
        const lacunasDaConfirmacao = linha.cadeia.lacunas.filter(
          (lacuna) => lacuna.lado === "PESSOA" && lacuna.elo === "CONFIRMACAO",
        );

        return (
          <li
            key={linha.subcriterionCode}
            className="rounded-md border border-[var(--color-border)] p-4"
          >
            <h3 className="text-sm font-medium text-[var(--patient-ink)]">{linha.label}</h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {/* COLUNA 1 — só a fala dela. Nenhum texto do Curador entra aqui
                  (critério RC-2): se ela não declarou, a coluna diz isso. */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  O que você disse
                </p>
                {linha.declaracao ? (
                  <>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--patient-ink)]">
                      {linha.declaracao.grau}
                    </p>
                    {linha.declaracao.opcoes.length > 0 ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {linha.declaracao.opcoes.join(" · ")}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Você ainda não respondeu sobre isto.
                  </p>
                )}
              </div>

              {/* COLUNA 2 — o que o Método registrou, com autoria. */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  O que ficou registrado
                </p>
                {linha.registro ? (
                  <>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--patient-ink)]">
                      {linha.registro.importancia}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {procedencia(linha.registro.autor, linha.registro.registradoEm)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {lacunasDaConfirmacao[0]?.porque ?? "Ainda não há registro para este item."}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
      </ul>

      {/* TERCEIRO BLOCO — o que o Curador declarou contra este caso. Fica FORA
          da comparação: ela nunca disse nada sobre isto, e sugerir que disse
          seria pôr palavra na boca dela. */}
      {tecnicos.length > 0 ? (
        <section className="mt-8">
          <h3 className="text-sm font-medium text-[var(--patient-ink)]">
            O que a Curadoria considerou por conta própria
          </h3>
          {/* B3 — a origem dita por inteiro: este bloco NÃO veio dela. Sem essa
              frase, um item técnico ao lado da comparação passa a parecer algo
              que ela declarou e esqueceu. */}
          <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
            Sobre estes pontos você não precisou dizer nada, e nada aqui veio de você — quem os
            avalia, diante do seu caso, é quem conduz a sua Curadoria.
          </p>
          <ul className="mt-3 space-y-2">
            {tecnicos.map((tecnico) => (
              <li
                key={tecnico.subcriterionCode}
                className="rounded-md border border-[var(--color-border)] p-3"
              >
                <p className="text-sm text-[var(--patient-ink)]">
                  <span className="font-medium">{tecnico.label}:</span> {tecnico.importancia}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {procedencia(tecnico.autor, tecnico.registradoEm)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
