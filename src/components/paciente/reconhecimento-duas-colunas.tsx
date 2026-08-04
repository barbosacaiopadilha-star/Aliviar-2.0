import type { CadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";

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

export type LinhaDoReconhecimento = {
  subcriterionCode: string;
  /** O rótulo do conceito, como ela o lê. Nunca o código. */
  label: string;
  /** COLUNA 1 — a fala dela, literal. */
  declaracao: { grau: string; opcoes: string[]; em: string | null } | null;
  /** COLUNA 2 — o que ficou registrado, e por quem. */
  registro: { importancia: string; autor: string | null } | null;
  /** A cadeia do Item 1.9 — a fonte única do que falta e por quê. */
  cadeia: CadeiaDeProveniencia;
};

export function ReconhecimentoDuasColunas({ linhas }: { linhas: LinhaDoReconhecimento[] }) {
  if (linhas.length === 0) {
    return (
      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
        Ainda não há nada para comparar aqui — o Perfil começa a existir quando você responde o que
        importa para você.
      </p>
    );
  }

  return (
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
                      {linha.registro.autor
                        ? `Registrado por ${linha.registro.autor}.`
                        : "Registro anterior ao regime de autoria — não consta quem registrou."}
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
  );
}
