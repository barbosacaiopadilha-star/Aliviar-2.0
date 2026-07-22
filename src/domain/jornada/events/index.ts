export type { DomainEvent } from "./domain-event";
export type { JornadaIniciada } from "./jornada-iniciada";
export { criarJornadaIniciada } from "./jornada-iniciada";
export type { EtapaConcluida } from "./etapa-concluida";
export { criarEtapaConcluida } from "./etapa-concluida";
export type { EtapaBloqueada } from "./etapa-bloqueada";
export { criarEtapaBloqueada } from "./etapa-bloqueada";
export type { EtapaRetomada } from "./etapa-retomada";
export { criarEtapaRetomada } from "./etapa-retomada";
export type { JornadaConcluida } from "./jornada-concluida";
export { criarJornadaConcluida } from "./jornada-concluida";

import type { JornadaIniciada } from "./jornada-iniciada";
import type { EtapaConcluida } from "./etapa-concluida";
import type { EtapaBloqueada } from "./etapa-bloqueada";
import type { EtapaRetomada } from "./etapa-retomada";
import type { JornadaConcluida } from "./jornada-concluida";

export type JornadaDomainEvent =
  | JornadaIniciada
  | EtapaConcluida
  | EtapaBloqueada
  | EtapaRetomada
  | JornadaConcluida;
