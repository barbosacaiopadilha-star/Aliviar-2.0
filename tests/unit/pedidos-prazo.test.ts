import { describe, expect, it } from "vitest";

import {
  PRAZO_PROPOSTO_EM_DIAS,
  ordenarPorPressao,
  prazoDoPedido,
} from "@/modules/governanca/pedidos-prazo";

/**
 * O RELÓGIO DO PEDIDO DO TITULAR — a aritmética que a tela mostra.
 *
 * Existe separado da tela porque é a parte que pode estar errada em silêncio:
 * um cálculo de prazo que se engana por um dia faz a operação perder o prazo
 * legal achando que tem folga. E é pura — nenhum banco, nenhum React.
 *
 * A distinção que estes testes protegem, e que é de honestidade e não de
 * matemática: **prazo fixado e referência não são a mesma coisa.** `prazo_em`
 * é nulo porque a decisão jurídica não veio; a tela pode mostrar um relógio,
 * mas não pode chamá-lo de prazo. `fixado` é o campo que carrega essa verdade,
 * e a tela lê ele para escolher a frase.
 */

const UM_DIA = 24 * 60 * 60 * 1000;
const em = (iso: string) => new Date(iso);

describe("prazoDoPedido", () => {
  it("sem prazo fixado, usa a referência da Política e DIZ que não é fixado", () => {
    const p = prazoDoPedido("2026-09-01T12:00:00Z", null, em("2026-09-01T12:00:00Z"));
    expect(p.fixado, "referência jamais se apresenta como prazo").toBe(false);
    expect(p.diasRestantes).toBe(PRAZO_PROPOSTO_EM_DIAS);
    expect(p.limite.getTime()).toBe(em("2026-09-16T12:00:00Z").getTime());
  });

  it("com prazo fixado no pedido, é ELE que manda — a referência sai de cena", () => {
    const p = prazoDoPedido("2026-09-01T12:00:00Z", "2026-09-05T12:00:00Z", em("2026-09-01T12:00:00Z"));
    expect(p.fixado).toBe(true);
    expect(p.diasRestantes).toBe(4);
  });

  it("conta os dias decorridos para baixo — 23h59 ainda é 'hoje'", () => {
    const p = prazoDoPedido("2026-09-01T00:00:00Z", null, em("2026-09-01T23:59:00Z"));
    expect(p.diasDecorridos).toBe(0);
  });

  it("conta os dias restantes para CIMA — faltando um resto de dia, ainda falta um dia", () => {
    // 14,2 dias restantes: arredondar para baixo diria 14, o que é seguro;
    // o caso que importa é o oposto — sobrando 0,2 dia, `floor` diria ZERO
    // com o prazo ainda aberto, e a tela mostraria "0 dias" para quem tem hoje.
    const p = prazoDoPedido("2026-09-01T00:00:00Z", null, em("2026-09-15T19:00:00Z"));
    expect(p.diasRestantes).toBe(1);
    expect(p.vencido).toBe(false);
  });

  it("vencido: dias restantes ficam negativos e a tela sabe disso", () => {
    const p = prazoDoPedido("2026-09-01T00:00:00Z", null, em("2026-09-18T00:00:00Z"));
    expect(p.vencido).toBe(true);
    expect(p.diasRestantes).toBe(-2);
    expect(p.urgente).toBe(true);
  });

  it("urgente cobre os últimos três dias — não só o vencimento", () => {
    const tresDiasAntes = new Date(em("2026-09-16T12:00:00Z").getTime() - 3 * UM_DIA);
    expect(prazoDoPedido("2026-09-01T12:00:00Z", null, tresDiasAntes).urgente).toBe(true);
    const quatroDiasAntes = new Date(em("2026-09-16T12:00:00Z").getTime() - 4 * UM_DIA);
    expect(prazoDoPedido("2026-09-01T12:00:00Z", null, quatroDiasAntes).urgente).toBe(false);
  });
});

describe("ordenarPorPressao", () => {
  it("quem vence primeiro vem primeiro — a fila NÃO é cronológica", () => {
    // O pedido mais NOVO tem prazo fixado curto; o mais antigo corre pela
    // referência de 15 dias. Uma fila por data de abertura deixaria o de
    // amanhã esperando atrás de quem ainda tem uma semana.
    const antigo = { id: "antigo", criadoEm: "2026-09-01T00:00:00Z", prazoEm: null };
    const novoUrgente = { id: "novo", criadoEm: "2026-09-09T00:00:00Z", prazoEm: "2026-09-11T00:00:00Z" };
    const ordem = ordenarPorPressao([antigo, novoUrgente], em("2026-09-10T00:00:00Z"));
    expect(ordem.map((p) => p.id)).toEqual(["novo", "antigo"]);
  });

  it("empate de prazo desempata pelo mais antigo", () => {
    const a = { id: "a", criadoEm: "2026-09-01T00:00:00Z", prazoEm: null };
    const b = { id: "b", criadoEm: "2026-09-01T06:00:00Z", prazoEm: null };
    const ordem = ordenarPorPressao([b, a], em("2026-09-05T00:00:00Z"));
    expect(ordem.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("não muda a lista original", () => {
    const lista = [
      { id: "a", criadoEm: "2026-09-09T00:00:00Z", prazoEm: null },
      { id: "b", criadoEm: "2026-09-01T00:00:00Z", prazoEm: null },
    ];
    ordenarPorPressao(lista, em("2026-09-10T00:00:00Z"));
    expect(lista.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
