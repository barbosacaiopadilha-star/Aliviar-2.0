import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import {
  fatosDoRegistro,
  montarFila,
  type FatosDaFila,
  type GrupoDaFila,
} from "@/modules/curadoria/fila-por-ato-devido";

import { semearMatrizCoexistente, type EstagioCoexistente } from "../apoio/apoio-curadoria-entregue";

/**
 * T-12-4 · O4 — DEZ CASOS VIVOS AO MESMO TEMPO.
 *
 * Um por um, qualquer classificação passa. O que quebra fila é a coexistência:
 * dez Casos em estágios diferentes, lidos na MESMA passagem, disputando os
 * mesmos sete grupos. É aqui que aparece o Caso que cai em dois grupos, o que
 * some entre eles, e o que só está certo porque nasceu primeiro.
 *
 * ⛔ **O loader não é mockado.** Os fatos vêm de `loadCuradoriaRecord` sobre o
 * banco real, exatamente como a rota os lê — se a projeção e o repositório
 * discordarem sobre o que é "entregue", este teste é quem descobre.
 */

const service = createAdminSupabaseClient();

const ESPERADO: Record<string, GrupoDaFila> = {
  "CR-01": "AGUARDA_ACOLHIMENTO",
  "CR-02": "AGUARDA_PRIMEIRO_ENCONTRO",
  "CR-03": "AGUARDA_RECONHECIMENTO_DELA",
  "CR-04": "CURADORIA_EM_CURSO",
  "CR-05": "CURADORIA_EM_CURSO",
  "CR-06": "AGUARDA_ENTREGA",
  "CR-07": "AGUARDA_DECISAO_DELA",
  "CR-08": "COM_O_CONCIERGE",
  "CR-09": "COM_O_CONCIERGE",
  "CR-10": "COM_O_CONCIERGE",
};

/** Lê os fatos do jeito da rota: registro + status do Caso + entrega legada. */
async function lerFatos(caseIds: string[]): Promise<Map<string, FatosDaFila>> {
  const { data: linhas, error } = await service
    .from("cases")
    .select("id, status, closed_at")
    .in("id", caseIds);
  if (error) throw new Error(`cases: ${error.message}`);
  const statusPorCaso = new Map(
    (linhas ?? []).map((l) => [l.id as string, { status: l.status as string, closedAt: l.closed_at as string | null }]),
  );

  const { data: legadas } = await service
    .from("final_curadoria_deliveries")
    .select("case_id")
    .in("case_id", caseIds);
  const legado = new Set((legadas ?? []).map((l) => l.case_id as string));

  const fatos = new Map<string, FatosDaFila>();
  for (const caseId of caseIds) {
    const registro = await loadCuradoriaRecord(service, caseId);
    if (!registro) throw new Error(`Case ${caseId} não carregou — a fixture não nasceu.`);
    fatos.set(
      caseId,
      fatosDoRegistro(registro, {
        status: statusPorCaso.get(caseId)?.status ?? "NEW",
        closedAt: statusPorCaso.get(caseId)?.closedAt ?? null,
        legadoSemCuradoria:
          legado.has(caseId) && registro.curadoriaTecnica.curatedSelectionId === null,
      }),
    );
  }
  return fatos;
}

describe("T-12-4 · O4 — a Fila com dez Casos simultâneos", () => {
  it(
    "CR-01..CR-10 coexistem, cada um no seu grupo, exatamente uma vez",
    { timeout: 300_000 },
    async () => {
      const matriz = await semearMatrizCoexistente();
      try {
        expect(matriz.caseIds, "a matriz não trouxe dez Casos").toHaveLength(10);
        expect(new Set(matriz.caseIds).size, "dois cortes compartilharam o mesmo Case").toBe(10);

        const fatos = await lerFatos(matriz.caseIds);
        const porCr = new Map(Object.values(matriz.casos).map((c) => [c.estagio, c.caseId]));

        const { grupos, fora, total } = montarFila([...fatos.values()]);

        // 1 · nenhum Caso perdido: dez entraram, dez estão em algum grupo.
        expect(total, "algum Caso ativo sumiu entre os grupos").toBe(10);
        expect(fora, "um Caso ativo foi tratado como fora da Fila").toHaveLength(0);

        // 2 · nenhum Caso duplicado.
        const vistos = grupos.flatMap((g) => g.casos.map((c) => c.caseId));
        expect(new Set(vistos).size, "um Case apareceu em dois grupos").toBe(10);

        // 3 · cada corte no grupo que a matriz prevê.
        const grupoDoCaso = new Map<string, GrupoDaFila>();
        for (const grupo of grupos) {
          for (const caso of grupo.casos) grupoDoCaso.set(caso.caseId, grupo.definicao.id);
        }
        for (const [cr, esperado] of Object.entries(ESPERADO)) {
          const caseId = porCr.get(cr as EstagioCoexistente)!;
          expect(grupoDoCaso.get(caseId), `${cr} caiu no grupo errado`).toBe(esperado);
        }

        // 4 · contagens por grupo, na ordem contratada.
        expect(grupos.map((g) => [g.definicao.titulo, g.contagem])).toEqual([
          ["Aguarda Acolhimento", 1],
          ["Aguarda o Primeiro Encontro", 1],
          ["Aguarda o reconhecimento dela", 1],
          ["Curadoria em curso", 2],
          ["Aguarda entrega", 1],
          ["Aguarda a decisão dela", 1],
          ["Com o Concierge", 3],
        ]);

        // 5 · a criação foi INVERTIDA pela fixture (CR-10 nasce primeiro) e a
        //     classificação não mudou. Se a Fila lesse ordem de chegada, esta
        //     asserção e a de cima não poderiam ser verdadeiras juntas.
        const invertido = montarFila([...fatos.values()].reverse());
        expect(invertido.grupos.map((g) => g.contagem)).toEqual(grupos.map((g) => g.contagem));
        for (const [cr, esperado] of Object.entries(ESPERADO)) {
          const caseId = porCr.get(cr as EstagioCoexistente)!;
          const onde = invertido.grupos.find((g) => g.casos.some((c) => c.caseId === caseId));
          expect(onde?.definicao.id, `${cr} mudou de grupo ao inverter a ordem`).toBe(esperado);
        }

        // 6 · nenhum conteúdo clínico atravessou: os fatos que a Fila carrega
        //     são só os do recorte, e nome é o único texto livre.
        for (const caso of fatos.values()) {
          expect(Object.keys(caso).sort()).toEqual(
            [
              "caseId",
              "closedAt",
              "decisionAt",
              "legadoSemCuradoria",
              "meetingHeldAt",
              "patientName",
              "priorityProfileId",
              "reportDeliveredAt",
              "reportEmittedAt",
              "status",
              "understandingConfirmedAt",
              "validatedAt",
            ].sort(),
          );
        }
      } finally {
        await matriz.limpar();
      }
    },
  );
});
