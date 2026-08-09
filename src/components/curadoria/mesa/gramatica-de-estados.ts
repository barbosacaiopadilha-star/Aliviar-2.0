/**
 * A GRAMÁTICA CROMÁTICA DOS ESTADOS DA MESA.
 *
 * @metodo AUDITORIA_UX_MESA_DE_CURADORIA §5 e §6 — nível ESSENCIAL (E-2)
 *
 * Camada de APRESENTAÇÃO, não de domínio. Este módulo não cria estado, não
 * calcula, não traduz e não reinterpreta nada: recebe estados formais que já
 * existem e devolve o papel visual e o sinal que cada um deve ter.
 *
 * Os rótulos continuam vindo de onde sempre vieram — `DESFECHO_LEGIVEL`,
 * `MOTIVO_DO_AGUARDO`, `ESTADO_LABEL` — e nenhum deles é reescrito aqui.
 *
 * As três funções da cor não se misturam (§4 da missão):
 *
 * | papel         | função        | significa                                |
 * |---------------|---------------|------------------------------------------|
 * | `estrutura`   | institucional | identidade, navegação — nunca resultado  |
 * | `resolvido`   | de estado     | processo concluído — NUNCA desfecho bom  |
 * | `atencao`     | de atenção    | falta ato humano                         |
 * | `impedimento` | de estado     | erro, conflito, bloqueio                 |
 * | `neutro`      | de estado     | contexto, não iniciado, repouso          |
 *
 * Duas proibições que este arquivo existe para sustentar:
 *
 * - **verde é processual.** Nunca significa evidência favorável, benefício
 *   clínico, melhor opção ou conclusão positiva.
 * - **vermelho é impedimento.** Nunca significa divergência, evidência
 *   contrária ou discordância legítima — divergir não é errar.
 *
 * E nenhuma distinção depende de cor sozinha: todo estado devolve também um
 * `sinal`, e o rótulo textual continua ao lado (§10 da missão).
 */

import type { LacunaDeJuizo } from "@/modules/curadoria/julgamentos";
import type { MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

export type PapelVisual = "estrutura" | "resolvido" | "atencao" | "impedimento" | "neutro";

export type MarcaDeEstado = {
  papel: PapelVisual;
  /** Símbolo curto — a distinção que sobrevive ao daltonismo e ao cinza. */
  sinal: string;
};

/** A classe CSS de um papel. Uma só fonte, para não espalhar regra. */
export function classeDoPapel(papel: PapelVisual): string {
  return `mesa-estado mesa-estado--${papel}`;
}

/**
 * Os desfechos de um ato do Curador. As chaves são exatamente as de
 * `DESFECHO_LEGIVEL` — este mapa acrescenta a camada visual e **não** toca a
 * tradução.
 */
export const MARCA_DO_DESFECHO = {
  // Ato concluído. Verde é PROCESSUAL: diz "registrado", nunca "aprovado".
  JUIZO_REGISTRADO: { papel: "resolvido", sinal: "✓" },
  // ⚠️ Sucesso idempotente — NUNCA erro. Nada falhou e nada foi duplicado.
  VERSAO_JA_GRAVADA: { papel: "neutro", sinal: "=" },
  // Conflito real: o Curador precisa reler e reagir.
  CONFLITO_DE_VERSAO: { papel: "impedimento", sinal: "!" },
  // Ato impossível para este papel.
  SEM_AUTORIDADE: { papel: "impedimento", sinal: "⨯" },
  // Volta a aguardar juízo — pede ato humano, não é perda: nada foi apagado.
  JUIZO_RETIRADO: { papel: "atencao", sinal: "●" },
  ERRO_TECNICO: { papel: "impedimento", sinal: "!" },
} as const satisfies Record<string, MarcaDeEstado>;

/**
 * Os motivos do aguardo de um conceito. Todos pedem ato humano — nenhum é
 * falha.
 */
export const MARCA_DO_AGUARDO = {
  SEM_JUIZO: { papel: "atencao", sinal: "●" },
  JUIZO_RETIRADO: { papel: "atencao", sinal: "●" },
  // ⚠️ Atualidade, não erro: evidência nova pede releitura do juízo.
  JUIZO_SUPERADO_POR_EVIDENCIA: { papel: "atencao", sinal: "↻" },
} as const satisfies Record<NonNullable<LacunaDeJuizo["motivo"]>, MarcaDeEstado>;

/** As etapas da trilha. `AGUARDA` é "ainda não é a vez", jamais bloqueio. */
export const MARCA_DA_ETAPA = {
  PRONTA: { papel: "resolvido", sinal: "✓" },
  PENDENTE: { papel: "atencao", sinal: "●" },
  AGUARDA: { papel: "neutro", sinal: "·" },
} as const satisfies Record<MesaEtapaState["status"], MarcaDeEstado>;
