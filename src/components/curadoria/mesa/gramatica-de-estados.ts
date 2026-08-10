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

import { classeDoPapel, type MarcaDeEstado, type PapelVisual } from "@/foundation/estado-visual";
import type { LacunaDeJuizo } from "@/modules/curadoria/julgamentos";
import type { SubcriterionStatus } from "@/modules/curadoria/mapa-profissional";
import type { MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

/**
 * FUNDAÇÃO · o vocabulário (papéis, sinal, classe) subiu para
 * `@/foundation/estado-visual` — as quatro trilhas da repaginação consomem a
 * MESMA definição que a Mesa certificou. O que continua morando aqui são os
 * MAPEAMENTOS da Mesa: qual desfecho, aguardo ou etapa recebe qual papel.
 *
 * Reexportado para não quebrar quem já importa daqui.
 */
export { classeDoPapel, type MarcaDeEstado, type PapelVisual };

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

/**
 * R-2 · o sinal `AGUARDA_JUIZO_DO_CURADOR` do motor relacional é o MESMO
 * estado operacional do conceito sem julgamento registrado — falta ato
 * humano. É um alias deliberado, não uma segunda decisão: a leitura
 * relacional passa a buscar o papel aqui em vez de repetir a regra.
 */
export const MARCA_DE_AGUARDA_JUIZO: MarcaDeEstado = MARCA_DO_AGUARDO.SEM_JUIZO;

/** As etapas da trilha. `AGUARDA` é "ainda não é a vez", jamais bloqueio. */
export const MARCA_DA_ETAPA = {
  PRONTA: { papel: "resolvido", sinal: "✓" },
  PENDENTE: { papel: "atencao", sinal: "●" },
  AGUARDA: { papel: "neutro", sinal: "·" },
} as const satisfies Record<MesaEtapaState["status"], MarcaDeEstado>;

/**
 * R-1 · `LACUNA_DE_INFORMACAO` não tem um papel visual só, porque não é uma
 * situação só. O domínio já separa as duas — **este arquivo apenas lê**:
 *
 * > *"ADR-040: ausência de registro é diferente de `NAO_INFORMADO`. As duas
 * > caem em `LACUNA_DE_INFORMACAO` — mas o Curador precisa saber se alguém
 * > olhou e não soube, ou se ninguém olhou ainda. Por isso o estado vem
 * > junto, e não some dentro do resultado."* — `motor-compatibilidade.ts`
 *
 * | `status`         | significa                        | ato humano? | papel     |
 * |------------------|----------------------------------|-------------|-----------|
 * | `null`           | ninguém olhou ainda              | **sim**     | `atencao` |
 * | `NAO_INFORMADO`  | olharam e não havia              | não         | `neutro`  |
 *
 * Existe aqui, e não em cada painel, por um motivo empírico: a mesma regra
 * decidida em dois lugares já divergiu — a comparação gastava âmbar no que
 * já fora investigado, e a leitura relacional não tinha de onde distinguir.
 *
 * Nenhum estado novo, nenhuma enum, nenhuma inferência: é `status`, que já
 * viaja ao lado de `result` na mesma linha.
 */
export function papelDaLacuna(status: SubcriterionStatus | null): PapelVisual {
  return status === null ? "atencao" : "neutro";
}

/**
 * S-1 · a lacuna do motor RELACIONAL é o caso *"ninguém declarou ainda"*.
 *
 * Os dois motores usam o mesmo token para coisas opostas, e foi essa colisão
 * que fez a inconsistência sobreviver à Rodada 1:
 *
 * | motor         | token             | significa                   | papel     |
 * |---------------|-------------------|-----------------------------|-----------|
 * | assistencial  | `NAO_INFORMADO`   | analisado, e não havia      | `neutro`  |
 * | assistencial  | `status = null`   | ninguém olhou ainda         | `atencao` |
 * | relacional    | `NAO_INFORMADO`   | **sem evidência vigente**   | `atencao` |
 *
 * Quem decide a cor é a semântica do fluxo, nunca o nome do estado. No motor
 * relacional, `LACUNA_DE_INFORMACAO` sai de `MATRIZ_RELACIONAL` em três
 * células, todas sob `NAO_INFORMADO`, e `deriveRelationalState` só devolve
 * `NAO_INFORMADO` quando **não há evidência**. Lacuna relacional ⟺ ausência de
 * declaração — bicondicional, verificável na matriz inteira.
 *
 * Por isso é definido *como* o caso `null`: não é papel novo nem regra nova, é
 * a regra da Rodada 1 aplicada à terceira superfície. O ato humano existe, é do
 * Curador e já está na Mesa (solicitar atualização da prática) — e `atencao`
 * pede olhar, nunca bloqueia (§18: `atencao` ≠ `impedimento`).
 */
export const PAPEL_DA_AUSENCIA_DE_DECLARACAO: PapelVisual = papelDaLacuna(null);
