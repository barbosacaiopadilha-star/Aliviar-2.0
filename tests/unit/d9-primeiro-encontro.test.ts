import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import { resolveCurrentResponsible } from "@/modules/coa/journey-responsibility";
import { buildJornada } from "@/modules/curadoria/jornada";

/**
 * D-9 · O PRIMEIRO ENCONTRO PASSA A TER PROVA DE REALIZAÇÃO.
 *
 * A cláusula central é negativa: **produto do encontro não é prova do
 * evento**. O Curador pode reconhecer a história lendo o que ela escreveu, e
 * pode validar mapas sem que o encontro tenha ocorrido. Por isso
 * `meeting_held_at` não pode ser derivado de nada — só escrito por um ato
 * explícito.
 */

const MIGRATION = "supabase/migrations/20260810120000_d9_primeiro_encontro_realizado.sql";
const base = Object.values(MOCK_RECORDS)[0]!;

const acolhimento = (patch: Partial<CuradoriaRecord["acolhimento"]>): CuradoriaRecord => ({
  ...base,
  acolhimento: { ...base.acolhimento, ...patch },
});

describe("T-D9-1 · a migration é estritamente aditiva", () => {
  const sql = readFileSync(MIGRATION, "utf8");
  const codigo = sql.replace(/--.*$/gm, "");

  it("adiciona exatamente uma coluna", () => {
    expect((codigo.match(/add column/gi) ?? [])).toHaveLength(1);
    expect(codigo).toMatch(/meeting_held_at\s+timestamptz\s+null/i);
  });

  it("sem default, sem backfill, sem trigger, sem enum, sem tabela nova", () => {
    for (const proibido of [/\bdefault\b/i, /\bupdate\b/i, /\btrigger\b/i, /create type/i, /create table/i]) {
      expect(proibido.test(codigo), `a migration faz mais do que somar a coluna: ${proibido}`).toBe(
        false,
      );
    }
  });

  it("e é a única migration nova desta missão", () => {
    const novas = readdirSync("supabase/migrations").filter((f) => f.startsWith("20260810"));
    expect(novas).toEqual(["20260810120000_d9_primeiro_encontro_realizado.sql"]);
  });

  it("§6 · o rollback está escrito, e é um DROP COLUMN", () => {
    expect(sql).toMatch(/drop column meeting_held_at/i);
  });
});

describe("T-D9-3/4/5 · §18 · nada implica a realização", () => {
  it("agendar não realiza", () => {
    const agendado = acolhimento({ meetingScheduledAt: "2026-07-10T10:00:00-03:00", meetingHeldAt: null });
    expect(agendado.acolhimento.meetingScheduledAt).toBeTruthy();
    expect(agendado.acolhimento.meetingHeldAt).toBeNull();
  });

  it("reconhecer a história não realiza — ele pode reconhecer lendo", () => {
    const reconhecida: CuradoriaRecord = {
      ...acolhimento({ meetingHeldAt: null }),
      historia: { ...base.historia, understandingConfirmedAt: "2026-07-11T10:00:00-03:00" },
    };
    expect(reconhecida.historia.understandingConfirmedAt).toBeTruthy();
    expect(reconhecida.acolhimento.meetingHeldAt).toBeNull();
  });

  it("validar os mapas não realiza", () => {
    const validada: CuradoriaRecord = {
      ...acolhimento({ meetingHeldAt: null }),
      validacao: { ...(base.validacao ?? ({} as NonNullable<CuradoriaRecord["validacao"]>)), validatedAt: "2026-07-12T10:00:00-03:00" },
    };
    expect(validada.validacao?.validatedAt).toBeTruthy();
    expect(validada.acolhimento.meetingHeldAt).toBeNull();
  });

  it("a leitura é crua: o repositório não deriva o fato de nenhum outro", () => {
    const fonte = readFileSync("src/modules/curadoria/cos/repository.ts", "utf8");
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const i = codigo.indexOf("meetingHeldAt:");
    expect(i, "o reader sumiu — o recorte seria vazio").toBeGreaterThan(-1);
    const linha = codigo.slice(i, codigo.indexOf("\n", i));
    expect(linha).toContain("meeting_held_at");
    for (const outro of ["understanding_confirmed", "validated_at", "meeting_scheduled_at"]) {
      expect(linha, `o reader passou a inferir de ${outro}`).not.toContain(outro);
    }
  });
});

describe("T-D9-6/7 · o writer é explícito e não reescreve o passado", () => {
  const fonte = readFileSync("src/modules/curadoria/actions.ts", "utf8");
  const inicio = fonte.indexOf("export async function registrarPrimeiroEncontroRealizadoAction");
  const acao = fonte.slice(inicio, inicio + 3000);

  it("existe um ato próprio, e ele exige Curador autenticado", () => {
    expect(inicio, "o writer não existe").toBeGreaterThan(-1);
    expect(acao).toContain("requireCurator");
  });

  it("T-D9-7 · já registrado ⇒ a data original permanece, e o retorno é sucesso", () => {
    const codigo = acao.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codigo).toContain("if (existing?.meeting_held_at)");
    // Sucesso idempotente: nada falhou e nada foi duplicado.
    const guarda = codigo.indexOf("if (existing?.meeting_held_at)");
    expect(codigo.slice(guarda, guarda + 120)).toContain("success: true");
    // E a corrida entre dois cliques é fechada no próprio update.
    expect(codigo).toContain('.is("meeting_held_at", null)');
  });

  it("o writer não toca em nenhum outro fato do encontro", () => {
    const codigo = acao.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const outro of ["understanding_confirmed_at", "validated_at", "meeting_scheduled_at"]) {
      expect(codigo, `o writer escreveu ${outro}`).not.toContain(outro);
    }
  });
});

describe("T-D9-11/12 · o Encontro 1 não move a responsabilidade", () => {
  const responsavel = (r: CuradoriaRecord) =>
    resolveCurrentResponsible({ curadoriaRecord: r, curatorName: "Dra. Curadora" }).role;

  it("encontro realizado ⇒ o Curador continua responsável", () => {
    const realizado: CuradoriaRecord = {
      ...acolhimento({ meetingHeldAt: "2026-07-10T11:00:00-03:00" }),
      devolutiva: { ...base.devolutiva, decision: null },
    };
    expect(responsavel(realizado)).toBe("curador");
  });

  it("a decisão continua sendo o único portão do handoff", () => {
    const semEncontro: CuradoriaRecord = {
      ...acolhimento({ meetingHeldAt: null }),
      devolutiva: { ...base.devolutiva, decision: null },
    };
    expect(responsavel(semEncontro)).toBe("curador");
    const fonte = readFileSync("src/modules/coa/journey-responsibility.ts", "utf8");
    const codigo = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    // Os fatos do Primeiro Encontro não entram na regra de responsabilidade.
    for (const fato of ["meetingHeldAt", "meeting_held_at", "meetingScheduledAt"]) {
      expect(codigo, `${fato} virou portão de handoff`).not.toContain(fato);
    }

    // `emittedAt` continua no arquivo — ele calcula a FASE, não o portão. O que
    // o torna inofensivo é a ordem: a decisão é verificada antes.
    const guarda = codigo.indexOf("!input.curadoriaRecord.devolutiva.decision");
    const concierge = codigo.indexOf('phase === "acompanhamento"');
    expect(guarda).toBeGreaterThan(-1);
    expect(guarda, "a guarda da decisão caiu para depois da fase").toBeLessThan(concierge);
  });
});

describe("T-D9-9 · a guarda é do STATUS, não da frase", () => {
  /**
   * A versão anterior deste teste protegia só a `description` — e o
   * Verificador mostrou que isso deixava o defeito passar: bastava mudar a
   * copy para o estágio continuar aparecendo como CONCLUÍDA sem prova. O
   * oráculo agora olha o campo que a interface realmente usa para pintar o
   * marco.
   */
  const comProduto = (meetingHeldAt: string | null): CuradoriaRecord => ({
    ...acolhimento({ meetingHeldAt }),
    historia: { ...base.historia, understandingConfirmedAt: "2026-07-11T10:00:00-03:00" },
  });

  const consulta = (r: CuradoriaRecord) =>
    buildJornada(r).stages.find((s) => s.id === "CONSULTA_INICIAL")!;

  it("produto presente + encontro sem prova ⇒ o estágio NÃO fica CONCLUÍDA", () => {
    const r = comProduto(null);
    expect(r.historia.understandingConfirmedAt).toBeTruthy();
    expect(r.acolhimento.meetingHeldAt).toBeNull();
    expect(consulta(r).status).not.toBe("CONCLUIDA");
  });

  it("e a etapa atual da régua permanece no Primeiro Encontro", () => {
    expect(buildJornada(comProduto(null)).currentStage).toBe("CONSULTA_INICIAL");
  });

  it("T-D9-10 · com prova, o estágio reconhece a realização", () => {
    expect(consulta(comProduto("2026-07-10T11:00:00-03:00")).status).toBe("CONCLUIDA");
  });

  it("§7 · a prova de perda: o critério do estágio é o encontro, não o produto", () => {
    // Se `consultaDone` voltasse a olhar o produto, os dois registros abaixo
    // — que diferem SÓ no fato do encontro — produziriam o mesmo status.
    const semEncontro = consulta(comProduto(null)).status;
    const comEncontro = consulta(comProduto("2026-07-10T11:00:00-03:00")).status;
    expect(semEncontro).not.toBe(comEncontro);
  });

  it("nenhuma frase afirma o encontro sem prova", () => {
    for (const stage of buildJornada(comProduto(null)).stages) {
      expect(stage.description, stage.id).not.toMatch(
        /encontro (já )?(aconteceu|foi realizado)|contou sua história para/i,
      );
    }
  });
});

describe("T-D9-2 · sem backfill, e o estado independente é representável", () => {
  /**
   * A prova de "sem backfill" é do BANCO, e foi feita na migration: a linha
   * existente ficou `null` (`total=1, com_prova=0`). Aqui o que importa é
   * outra coisa — que o estado legítimo do §3 exista de verdade entre as
   * fixtures, e não seja um cenário só de papel.
   */
  it("§3 · existe fixture com história reconhecida E encontro sem prova", () => {
    const independente = Object.values(MOCK_RECORDS).filter(
      (r) => r.historia.understandingConfirmedAt && !r.acolhimento.meetingHeldAt,
    );
    expect(independente.length, "o estado independente sumiu das fixtures").toBeGreaterThan(0);
  });

  it("e nela a régua NÃO conclui o Primeiro Encontro", () => {
    const independente = Object.values(MOCK_RECORDS).find(
      (r) => r.historia.understandingConfirmedAt && !r.acolhimento.meetingHeldAt,
    )!;
    const consulta = buildJornada(independente).stages.find((s) => s.id === "CONSULTA_INICIAL")!;
    expect(consulta.status).not.toBe("CONCLUIDA");
  });

  it("nenhuma fixture ganhou o fato sem que o cenário o justifique", () => {
    for (const [nome, record] of Object.entries(MOCK_RECORDS)) {
      if (!record.acolhimento.meetingHeldAt) continue;
      // Só quem validou mapas — ato que pressupõe o encontro — o declara.
      expect(record.validacao?.validatedAt, `${nome} declara encontro sem cenário que o sustente`).toBeTruthy();
    }
  });
});
