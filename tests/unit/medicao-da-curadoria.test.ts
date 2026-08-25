import { describe, expect, it } from "vitest";

import {
  duracao,
  medirCuradoria,
  type AtosDoCase,
} from "@/modules/curadoria/medicao-da-curadoria";

// ADR-089 — a medição da Curadoria.
//
// O que estes testes protegem não é aritmética: é a HONESTIDADE do número.
// Um relatório de tempo que arredonda ausência para zero, ou que engole uma
// data ilegível como se fosse um instante válido, autoriza cortar o Método
// com falsa confiança. Cada caso abaixo trava uma dessas mentiras.

const VAZIO: AtosDoCase = {
  caseAbertoEm: null,
  historiaEnviadaEm: null,
  acolhimento: [],
  mapa: [],
  protocoloDaPessoa: [],
  rede: [],
  avaliacao: [],
  composicaoEm: null,
  relatorioEmitidoEm: null,
  relatorioEntregueEm: null,
  decisaoEm: null,
};

const H = (hora: string) => `2026-08-25T${hora}:00.000Z`;
const MINUTO = 60_000;
const HORA = 60 * MINUTO;

describe("Medição da Curadoria — as duas grandezas", () => {
  it("espera e janela são coisas diferentes, e a etapa devolve as duas", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      // O Mapa começou às 10h — duas horas depois do Case abrir — e durou 30min.
      mapa: [H("10:00"), H("10:15"), H("10:30")],
    });

    const mapa = medicao.etapas.find((e) => e.id === "MAPA")!;
    expect(mapa.registros).toBe(3);
    // Espera: do Case aberto ao ÚLTIMO registro do Mapa — 2h30.
    expect(mapa.esperaMs).toBe(2 * HORA + 30 * MINUTO);
    // Janela: do primeiro ao último registro — 30min. É o piso do trabalho.
    expect(mapa.janelaMs).toBe(30 * MINUTO);
  });

  it("etapa de ato único tem janela nula, não zero", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      composicaoEm: H("09:00"),
    });

    const composicao = medicao.etapas.find((e) => e.id === "COMPOSICAO")!;
    expect(composicao.esperaMs).toBe(HORA);
    // `null` porque não há janela a medir — dizer "0" afirmaria que foi
    // instantâneo, e ninguém sabe disso.
    expect(composicao.janelaMs).toBeNull();
  });

  it("etapa que não aconteceu não vira zero — fica sem medida", () => {
    const medicao = medirCuradoria(VAZIO);

    for (const etapa of medicao.etapas) {
      expect(etapa.concluidaEm).toBeNull();
      expect(etapa.esperaMs).toBeNull();
      expect(etapa.registros).toBe(0);
    }
    expect(medicao.totalMs).toBeNull();
    expect(medicao.completa).toBe(false);
  });
});

describe("Medição da Curadoria — a cadeia das etapas", () => {
  it("cada etapa parte de onde a anterior terminou, não do início do Case", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      historiaEnviadaEm: H("09:00"),
      acolhimento: [H("10:00")],
      mapa: [H("11:00")],
    });

    // A Entrada é a ORIGEM da jornada: não há etapa anterior de quem esperar.
    expect(medicao.etapas.find((e) => e.id === "ENTRADA")!.esperaMs).toBeNull();
    // Do fim da Entrada (09:00) ao fim do Acolhimento (10:00) — não das 08:00.
    expect(medicao.etapas.find((e) => e.id === "ACOLHIMENTO")!.esperaMs).toBe(HORA);
    expect(medicao.etapas.find((e) => e.id === "MAPA")!.esperaMs).toBe(HORA);
  });

  it("buraco no meio não infla a etapa seguinte — o cursor fica no último marco conhecido", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      historiaEnviadaEm: H("09:00"),
      // Acolhimento nunca foi registrado.
      acolhimento: [],
      mapa: [H("10:00")],
    });

    expect(medicao.etapas.find((e) => e.id === "ACOLHIMENTO")!.esperaMs).toBeNull();
    // O Mapa mede a partir das 09:00 (último marco real), não a partir de uma
    // etapa fantasma. Uma etapa que não fechou não empurra a próxima.
    expect(medicao.etapas.find((e) => e.id === "MAPA")!.esperaMs).toBe(HORA);
  });

  it("emitir e entregar são atos separados, e a distância entre eles é medida", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      relatorioEmitidoEm: H("10:00"),
      relatorioEntregueEm: H("14:00"),
    });

    const relatorio = medicao.etapas.find((e) => e.id === "RELATORIO")!;
    expect(relatorio.registros).toBe(2);
    // A janela é a espera entre emitir e entregar — o Método exige que a
    // entrega aconteça na conversa, nunca junto da emissão.
    expect(relatorio.janelaMs).toBe(4 * HORA);
  });
});

describe("Medição da Curadoria — o que não pode passar", () => {
  it("data ilegível é ausência, nunca um instante plausível", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      mapa: ["nao-e-uma-data", H("09:00"), ""],
    });

    const mapa = medicao.etapas.find((e) => e.id === "MAPA")!;
    // Só o carimbo legível conta. `NaN` sairia como duração plausível na tela.
    expect(mapa.registros).toBe(1);
    expect(mapa.esperaMs).toBe(HORA);
    expect(Number.isNaN(mapa.esperaMs)).toBe(false);
  });

  it("relógio para trás é dado torto, não tempo negativo", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("10:00"),
      historiaEnviadaEm: H("08:00"),
    });

    expect(medicao.etapas.find((e) => e.id === "ENTRADA")!.esperaMs).toBeNull();
  });

  it("a carga aparece como número de atos, que é a pergunta do Fundador", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      mapa: Array.from({ length: 29 }, (_, i) => H(`09:${String(i).padStart(2, "0")}`)),
      protocoloDaPessoa: Array.from({ length: 15 }, (_, i) => H(`10:${String(i).padStart(2, "0")}`)),
      rede: [H("11:00"), H("11:05"), H("11:10")],
      avaliacao: Array.from({ length: 9 }, (_, i) => H(`12:${String(i).padStart(2, "0")}`)),
    });

    // 1 (Case aberto) + 29 + 15 + 3 + 9 = 57 atos registrados, medidos e
    // não estimados. Os 56 de juízo mais a admissão que os precede.
    expect(medicao.registrosTotais).toBe(57);
  });

  it("etapas intercaladas não fazem o relógio andar mais rápido que o relógio", () => {
    // O Curador intercalou: registrou Mapa às 10:00 e 11:00, e no meio disso
    // registrou o Protocolo às 10:20 e 10:40. As duas janelas se sobrepõem.
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("09:00"),
      mapa: [H("10:00"), H("11:00")],
      protocoloDaPessoa: [H("10:20"), H("10:40")],
    });

    const mapa = medicao.etapas.find((e) => e.id === "MAPA")!;
    const protocolo = medicao.etapas.find((e) => e.id === "PROTOCOLO_DA_PESSOA")!;
    expect(mapa.janelaMs).toBe(HORA);
    expect(protocolo.janelaMs).toBe(20 * MINUTO);

    // Somar daria 1h20 — mais tempo do que de fato passou entre 10:00 e 11:00.
    // A união conta o período uma vez só.
    expect(medicao.janelaTotalMs).toBe(HORA);
  });

  it("etapas separadas somam, porque não há sobreposição a descontar", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      mapa: [H("09:00"), H("09:30")],
      protocoloDaPessoa: [H("14:00"), H("14:30")],
    });

    expect(medicao.janelaTotalMs).toBe(HORA);
  });

  it("a medição parcial se declara parcial", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      relatorioEntregueEm: H("15:00"),
    });

    expect(medicao.completa).toBe(false);
    expect(medicao.totalMs).toBeNull();
  });
});

describe("Duração dita como gente fala", () => {
  it("ausência é travessão, nunca zero", () => {
    expect(duracao(null)).toBe("—");
  });

  it("escala de segundos a dias", () => {
    expect(duracao(45_000)).toBe("45s");
    expect(duracao(20 * MINUTO)).toBe("20 min");
    expect(duracao(2 * HORA)).toBe("2h");
    expect(duracao(2 * HORA + 30 * MINUTO)).toBe("2h30");
    expect(duracao(48 * HORA)).toBe("2d");
    expect(duracao(50 * HORA)).toBe("2d 2h");
  });
});

// ---------------------------------------------------------------------------
// Etapa salva em lote — o caso que a travessia de 25/08 revelou
// ---------------------------------------------------------------------------
//
// Os 29 subcritérios do Mapa são gravados numa transação só: os 29 carimbos
// saem IDÊNTICOS. A primeira versão devolvia janela = 0, e a tela leria
// "classificar 29 subcritérios levou tempo nenhum" — a mesma mentira que a
// regra do travessão existe para impedir, escapando pelo caso não previsto.

describe("Registro em lote — ausência de medida, nunca medida de zero", () => {
  it("29 carimbos no mesmo instante não produzem janela de 0s", () => {
    const instante = H("10:00");
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("09:00"),
      mapa: Array.from({ length: 29 }, () => instante),
    });

    const mapa = medicao.etapas.find((e) => e.id === "MAPA")!;
    expect(mapa.registros).toBe(29);
    // O que se sabe: foram gravados juntos. O que NÃO se sabe: quanto durou.
    expect(mapa.janelaMs).toBeNull();
    // A espera continua valendo — é o único sinal que sobra no trabalho em lote.
    expect(mapa.esperaMs).toBe(HORA);
  });

  it("um registro único também não vira janela de zero", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("09:00"),
      rede: [H("09:30")],
    });
    expect(medicao.etapas.find((e) => e.id === "REDE")!.janelaMs).toBeNull();
  });

  it("etapa em lote não infla o total: sem janela, nada a somar na união", () => {
    const instante = H("10:00");
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("09:00"),
      mapa: Array.from({ length: 29 }, () => instante),
      rede: [H("11:00"), H("11:20")],
    });
    // Só a Rede tem janela real: 20 minutos.
    expect(medicao.janelaTotalMs).toBe(20 * MINUTO);
  });
});

// ---------------------------------------------------------------------------
// A Entrada tem dois atos, e a ordem entre eles varia — achado de 25/08
// ---------------------------------------------------------------------------
//
// A primeira versão presumia que o Case nasce e a história chega depois.
// A operação não garante isso: a paciente pode escrever antes de o Atendente
// abrir o Case, e em produção há histórias enviadas que nunca viraram Case.
// Com a ordem invertida, o intervalo dava negativo e a tela mostrava "—" —
// que se lê como "não aconteceu". Dizer isso sobre dois atos que aconteceram
// é pior do que não medir.

describe("Entrada — ordem observada, nunca presumida", () => {
  it("com a história ANTES do Case, a Entrada continua medindo", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      historiaEnviadaEm: H("08:00"),
      caseAbertoEm: H("09:00"),
    });

    const entrada = medicao.etapas.find((e) => e.id === "ENTRADA")!;
    expect(entrada.registros).toBe(2);
    expect(entrada.janelaMs).toBe(HORA);
    expect(entrada.concluidaEm).toBe(H("09:00"));
  });

  it("com o Case ANTES da história, mede igual — a ordem não muda o resultado", () => {
    const medicao = medirCuradoria({
      ...VAZIO,
      caseAbertoEm: H("08:00"),
      historiaEnviadaEm: H("09:00"),
    });

    const entrada = medicao.etapas.find((e) => e.id === "ENTRADA")!;
    expect(entrada.registros).toBe(2);
    expect(entrada.janelaMs).toBe(HORA);
  });

  it("a jornada é contada da ORIGEM observada, não da abertura do Case", () => {
    // Ela escreveu às 08:00; o Case só nasceu às 09:00. O tempo dela começou
    // às 08:00 — contar do Case esconderia a primeira hora de espera.
    const medicao = medirCuradoria({
      ...VAZIO,
      historiaEnviadaEm: H("08:00"),
      caseAbertoEm: H("09:00"),
      decisaoEm: H("12:00"),
    });

    expect(medicao.totalMs).toBe(4 * HORA);
    expect(medicao.completa).toBe(true);
  });

  it("história enviada que nunca virou Case ainda é Entrada medida", () => {
    const medicao = medirCuradoria({ ...VAZIO, historiaEnviadaEm: H("08:00") });
    const entrada = medicao.etapas.find((e) => e.id === "ENTRADA")!;
    expect(entrada.registros).toBe(1);
    expect(entrada.concluidaEm).toBe(H("08:00"));
    // Um ato só: não há janela a medir, e isso não é zero.
    expect(entrada.janelaMs).toBeNull();
  });
});
