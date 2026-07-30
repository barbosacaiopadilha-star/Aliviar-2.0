import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listSubcriterionCatalog } from "./mapa-prioridades-repository";
import { loadCasePriorityMap } from "./mapa-prioridades-repository";
import { loadProfessionalMap } from "./mapa-profissional-repository";
import {
  assertSameCatalog,
  crossPriorityAndProfessional,
  type CompatibilityReading,
} from "./motor-compatibilidade";

/**
 * MOTOR DE COMPATIBILIDADE — o lado do banco.
 *
 * Só carrega e delega. O cruzamento inteiro mora no módulo puro, testável
 * sem Supabase; aqui não existe nenhuma regra de compatibilidade.
 *
 * O catálogo ativo é lido uma vez e serve aos dois lados — é o que garante
 * que a comparação aconteça por identidade de subcritério, e não por nome.
 */

export type ProfessionalCompatibility = CompatibilityReading & {
  professionalProfileId: string;
};

export async function crossCaseWithProfessional(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileId: string,
): Promise<ProfessionalCompatibility> {
  const [catalogo, mapaDoCase, mapaDoProfissional] = await Promise.all([
    listSubcriterionCatalog(supabase),
    loadCasePriorityMap(supabase, caseId),
    loadProfessionalMap(supabase, professionalProfileId),
  ]);

  const ativos = catalogo.map((entry) => entry.code);

  // Os dois lados precisam falar do mesmo catálogo. Um mapa que referencia
  // subcritério fora de circulação não é erro de dado — é histórico legítimo
  // (ADR-039/040) —, então o que se compara é só o que segue ativo.
  const prioridades = mapaDoCase.items.filter((item) => ativos.includes(item.subcriterionCode));
  const estados = mapaDoProfissional.items.filter((item) => ativos.includes(item.subcriterionCode));

  assertSameCatalog(prioridades.map((p) => p.subcriterionCode), ativos, "Mapa de Prioridades do Case");
  assertSameCatalog(estados.map((e) => e.subcriterionCode), ativos, "Mapa do Profissional");

  const leitura = crossPriorityAndProfessional({
    casePriorities: prioridades,
    professionalStates: estados,
    activeSubcriterionCodes: ativos,
  });

  return { ...leitura, professionalProfileId };
}

/**
 * Cruza o Case com vários profissionais.
 *
 * A ordem de saída é a ordem de entrada — o Motor não ordena por resultado.
 * Ordenar aqui seria produzir colocação, e colocação é decisão (Ontologia
 * §3.13).
 */
export async function crossCaseWithProfessionals(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileIds: readonly string[],
): Promise<ProfessionalCompatibility[]> {
  const [catalogo, mapaDoCase] = await Promise.all([
    listSubcriterionCatalog(supabase),
    loadCasePriorityMap(supabase, caseId),
  ]);

  const ativos = catalogo.map((entry) => entry.code);
  const prioridades = mapaDoCase.items.filter((item) => ativos.includes(item.subcriterionCode));
  assertSameCatalog(prioridades.map((p) => p.subcriterionCode), ativos, "Mapa de Prioridades do Case");

  const leituras: ProfessionalCompatibility[] = [];

  for (const professionalProfileId of professionalProfileIds) {
    const mapa = await loadProfessionalMap(supabase, professionalProfileId);
    const estados = mapa.items.filter((item) => ativos.includes(item.subcriterionCode));
    assertSameCatalog(estados.map((e) => e.subcriterionCode), ativos, "Mapa do Profissional");

    leituras.push({
      professionalProfileId,
      ...crossPriorityAndProfessional({
        casePriorities: prioridades,
        professionalStates: estados,
        activeSubcriterionCodes: ativos,
      }),
    });
  }

  return leituras;
}
