import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { lacunasDeJuizo } from "./julgamentos";
import { loadJulgamentosDaAvaliacao } from "./julgamentos-repository";
import { crossCaseRelationalForProfessionals } from "./motor-relacional-repository";
import {
  veredictoDaEmissao,
  type SelecionadoComLacunas,
  type VeredictoDaEmissao,
} from "./emissao-exige-juizo";

/**
 * OS FATOS QUE A GUARDA DA ADR-094 PRECISA — e nada além deles.
 *
 * @metodo ADR-094 — o juízo humano é condição de emissão
 * @metodo ADR-067 §5 — H8–H10 sempre; H11 quando o Case declarou grau
 *
 * A regra mora no módulo puro (`emissao-exige-juizo.ts`); aqui é só banco. A
 * separação não é estética: uma regra que só existe dentro de uma action é uma
 * regra que a próxima action esquece — e é exatamente essa a história do
 * `SIM-51`, em que a exigência vivia no Método e nada no software a lia.
 *
 * O recorte é o dos TRÊS SELECIONADOS. A Rede inteira não entra: julgar quem
 * não foi escolhido é trabalho que não chega à paciente.
 */
export async function veredictoDaEmissaoDoCase(
  supabase: SupabaseClient,
  caseId: string,
  curatedSelectionId: string,
): Promise<VeredictoDaEmissao> {
  const { data: opcoes, error } = await supabase
    .from("curated_selection_options")
    .select("professional_profile_id, professional_profiles(display_name)")
    .eq("curated_selection_id", curatedSelectionId);

  // FAIL-CLOSED. Uma falha de leitura aqui não pode virar "pode emitir": seria
  // a guarda mais pesada do produto se desligando por um erro de rede.
  if (error) {
    return {
      pode: false,
      motivo:
        "Não foi possível conferir os juízos antes de emitir. Nada foi emitido — " +
        "recarregue e tente de novo.",
      faltando: [],
    };
  }

  const escolhidos = (opcoes ?? []).map((linha) => {
    const perfil = (linha as { professional_profiles: unknown }).professional_profiles;
    const nome = Array.isArray(perfil)
      ? (perfil[0] as { display_name?: string } | undefined)?.display_name
      : (perfil as { display_name?: string } | null)?.display_name;
    return {
      id: (linha as { professional_profile_id: string }).professional_profile_id,
      nome: nome ?? "este profissional",
    };
  });

  if (escolhidos.length === 0) return veredictoDaEmissao([]);

  // O H11 só é exigido onde o Case declarou grau para o conceito relacional
  // (ADR-065). Sem isto a guarda cobraria seis juízos onde o Método pede três.
  const relacional = await crossCaseRelationalForProfessionals(
    supabase,
    caseId,
    escolhidos.map((e) => e.id),
  );
  const declaradosPorId = new Map(
    relacional.byProfessional.map((leitura) => [
      leitura.professionalProfileId,
      leitura.readings.filter((r) => r.kind === "JUIZO_HUMANO").map((r) => r.code),
    ]),
  );

  const selecionados: SelecionadoComLacunas[] = await Promise.all(
    escolhidos.map(async ({ id, nome }) => ({
      professionalProfileId: id,
      nome,
      lacunas: lacunasDeJuizo(
        await loadJulgamentosDaAvaliacao(supabase, caseId, id),
        declaradosPorId.get(id) ?? [],
      ),
    })),
  );

  return veredictoDaEmissao(selecionados);
}
