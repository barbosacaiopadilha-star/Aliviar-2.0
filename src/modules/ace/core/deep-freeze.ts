// Congelamento profundo — agora mantido pela Plataforma.
//
// A implementação foi absorvida em `src/platform/immutability/deep-freeze.ts`,
// onde ganhou tratamento de ciclo, suporte a Map/Set e segurança com getters.
// Este arquivo permanece como o ponto de entrada que o ACE já usava: nada
// deixou de existir, e a disciplina passou a ter uma implementação só.

export { deepFreeze, isDeeplyFrozen, type DeepReadonly } from "@/platform/immutability/deep-freeze";
