import { describe, expect, it } from "vitest";

import { currentHourInBrazil, greetingFor } from "@/modules/paciente/ambiente";

describe("Saudação por horário — gentileza, sem exagero", () => {
  it("cobre o dia inteiro sem buraco", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      expect(greetingFor(hour), `hora ${hour}`).toMatch(/^(Bom dia|Boa tarde|Boa noite)$/);
    }
  });

  it("os cortes são onde a pessoa espera", () => {
    expect(greetingFor(5)).toBe("Bom dia");
    expect(greetingFor(11)).toBe("Bom dia");
    expect(greetingFor(12)).toBe("Boa tarde");
    expect(greetingFor(17)).toBe("Boa tarde");
    expect(greetingFor(18)).toBe("Boa noite");
  });

  it("madrugada é noite — quem abre às 3h está acordado por algum motivo", () => {
    expect(greetingFor(0)).toBe("Boa noite");
    expect(greetingFor(3)).toBe("Boa noite");
    expect(greetingFor(4)).toBe("Boa noite");
  });

  it("a hora vem do fuso do Brasil, não do servidor", () => {
    // Meio-dia UTC é 9h em São Paulo — se lesse o fuso do servidor, daria
    // "Boa tarde" para quem está tomando café.
    const meioDiaUtc = new Date("2026-07-27T12:00:00Z");
    expect(currentHourInBrazil(meioDiaUtc)).toBe(9);
    expect(greetingFor(currentHourInBrazil(meioDiaUtc))).toBe("Bom dia");
  });

  it("a saudação é só a saudação — sem comentário sobre o dia dela", () => {
    for (const hour of [8, 14, 21]) {
      const saudacao = greetingFor(hour);
      expect(saudacao.split(" ")).toHaveLength(2);
      expect(saudacao).not.toMatch(/!|\?|😊|espero|tudo bem/i);
    }
  });
});
