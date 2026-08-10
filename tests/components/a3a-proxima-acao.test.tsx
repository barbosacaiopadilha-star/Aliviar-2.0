import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProximaAcao } from "@/components/paciente/experiencia/proxima-acao";
import { PatientHomeState } from "@/components/paciente/patient-home-state";
import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { buildJornada } from "@/modules/curadoria/jornada";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import { derivePatientPending, type PatientPendingState } from "@/modules/paciente/next-action";

/**
 * A3a · A PRÓXIMA AÇÃO NÃO PODE VOLTAR A SER DESCARTADA.
 *
 * O defeito: `derivePatientPending` calculava título, motivo, o que acontece
 * depois e destino — e a Home jogava fora. O único consumo era um `aside` no
 * cartão da Curadoria, sob a condição `!pending.action.cta`. Quer dizer:
 * **quando havia uma ação com tela para fazê-la, a Home não exibia nada.**
 *
 * As pendências abaixo vêm da projeção real, nunca de literais: se a Fundação
 * ou a Jornada mudarem, estes testes acompanham em vez de mentir.
 */

const FATOS: Record<string, FatosDoCaso> = {
  HISTORIA_NAO_INICIADA: { historia: { existe: false, enviadaEm: null }, caso: null, relatorio: null, pendencia: null },
  HISTORIA_EM_PREENCHIMENTO: { historia: { existe: true, enviadaEm: null }, caso: null, relatorio: null, pendencia: null },
  HISTORIA_ENVIADA: { historia: { existe: true, enviadaEm: "enviada" }, caso: null, relatorio: null, pendencia: null },
  CASO_EM_CURADORIA: {
    historia: { existe: true, enviadaEm: "enviada" },
    caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
    relatorio: null,
    pendencia: null,
  },
  CURADORIA_ENTREGUE: {
    historia: { existe: true, enviadaEm: "enviada" },
    caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false },
    relatorio: { existe: true, emitidoEm: "emitida", entregueEm: "entregue" },
    pendencia: null,
  },
  CASO_CANCELADO: {
    historia: { existe: true, enviadaEm: "enviada" },
    caso: { curadorResponsavel: "c", encerradoEm: "fechado", cancelado: true },
    relatorio: null,
    pendencia: null,
  },
};

function leituraDe(estado: keyof typeof FATOS) {
  const leitura = lerEstado(FATOS[estado]!);
  if (leitura.estado !== estado) {
    throw new Error(`fixture não produz ${estado}, e sim ${leitura.estado}`);
  }
  return leitura;
}

function pendingDe(estado: keyof typeof FATOS, jornada: ReturnType<typeof buildJornada> | null = null) {
  return derivePatientPending({ leitura: leituraDe(estado), jornada });
}

/** A primeira jornada dos mocks cuja etapa aguardando bate com o filtro. */
function jornadaComEtapaAguardando(stageId: string) {
  return Object.keys(MOCK_RECORDS)
    .map((key) => buildJornada(MOCK_RECORDS[key]!))
    .find((j) => j.stages.some((s) => s.id === stageId && s.status === "AGUARDANDO_VOCE"));
}

function pendingComCta(): Extract<PatientPendingState, { kind: "action" }> {
  const pending = pendingDe("HISTORIA_EM_PREENCHIMENTO");
  if (pending.kind !== "action" || !pending.action.cta) {
    throw new Error("fixture deixou de produzir uma ação com destino");
  }
  return pending;
}

afterEach(cleanup);

describe("T-A3a-1 · pendência com destino é renderizada como ação", () => {
  it("título, motivo e o que acontece depois chegam à tela", () => {
    const pending = pendingComCta();
    render(<ProximaAcao pending={pending} />);

    expect(screen.getByRole("heading", { name: pending.action.title })).toBeVisible();
    expect(screen.getByText(pending.action.why)).toBeVisible();
    expect(screen.getByText(pending.action.whatHappensNext, { exact: false })).toBeVisible();
  });

  it("e a marca de estado carrega símbolo + texto, nunca cor sozinha", () => {
    render(<ProximaAcao pending={pendingComCta()} />);
    // `13_MODELO_DE_ESTADOS.md` §4: papel de atenção = falta um ato humano.
    expect(document.querySelector(".mesa-estado--atencao")).toBeTruthy();
    expect(screen.getByText("Precisa de você")).toBeVisible();
  });
});

describe("T-A3a-2 · o destino é o da projeção, nunca remontado na tela", () => {
  it("o href do CTA é exatamente `pending.action.cta.href`", () => {
    const pending = pendingComCta();
    render(<ProximaAcao pending={pending} />);

    expect(screen.getByRole("link", { name: pending.action.cta!.label })).toHaveAttribute(
      "href",
      pending.action.cta!.href,
    );
  });

  it("vale para toda pendência com destino que os mocks alcançam", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = pendingDe("CASO_EM_CURADORIA", buildJornada(MOCK_RECORDS[key]!));
      if (pending.kind !== "action" || !pending.action.cta) continue;

      cleanup();
      render(<ProximaAcao pending={pending} />);
      expect(
        screen.getByRole("link", { name: pending.action.cta.label }),
        `destino divergente em ${key}`,
      ).toHaveAttribute("href", pending.action.cta.href);
    }
  });
});

describe("T-A3a-3 · sem destino, nenhum botão é inventado", () => {
  it("reconhecer o Perfil não ganha CTA — o ato tem liturgia (ADR-042 / Fundamentos §10)", () => {
    const jornada = jornadaComEtapaAguardando("PERFIL_DE_PRIORIDADES");
    expect(jornada, "nenhum mock cobre o Perfil aguardando a paciente").toBeDefined();

    const pending = pendingDe("CASO_EM_CURADORIA", jornada!);
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta).toBeNull();

    render(<ProximaAcao pending={pending} curatorName="Ana" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // E o silêncio do botão é explicado, não deixado no ar.
    expect(screen.getByText(/conversa com Ana/)).toBeVisible();
  });

  it("nenhuma pendência renderizada fica sem destino E sem explicação", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = pendingDe("CASO_EM_CURADORIA", buildJornada(MOCK_RECORDS[key]!));
      if (pending.kind !== "action") continue;

      cleanup();
      render(<ProximaAcao pending={pending} curatorName="Ana" />);

      const temLink = screen.queryByRole("link") !== null;
      const temExplicacao = screen.queryByText(/conversa com/) !== null;
      expect(temLink !== temExplicacao, `pendência ambígua em ${key}`).toBe(true);
    }
  });
});

describe("T-A3a-4 · espera legítima é dita, e não parece tela quebrada", () => {
  it("quando nada depende dela, a mensagem e o próximo passo aparecem", () => {
    const pending = pendingDe("HISTORIA_ENVIADA");
    if (pending.kind !== "nothing") throw new Error("esperava silêncio declarado");

    render(<ProximaAcao pending={pending} />);

    expect(screen.getByRole("heading", { name: pending.message })).toBeVisible();
    expect(screen.getByText(pending.whatHappensNext)).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    // Repouso é papel neutro — nunca impedimento, nunca erro.
    expect(document.querySelector(".mesa-estado--neutro")).toBeTruthy();
    expect(document.querySelector(".mesa-estado--impedimento")).toBeNull();
  });

  it("com Case em andamento, o silêncio diz com quem o caso está (§12)", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = pendingDe("CASO_EM_CURADORIA", buildJornada(MOCK_RECORDS[key]!));
      if (pending.kind !== "nothing") continue;

      cleanup();
      render(<ProximaAcao pending={pending} />);
      // A responsabilidade não muda por causa da ação: ela é dita junto.
      expect(screen.getByRole("heading", { name: pending.message })).toBeVisible();
      expect(screen.getByText(pending.whatHappensNext)).toBeVisible();
    }
  });
});

describe("T-A3a-5 · a ação some quando o estado avança", () => {
  it("Curadoria entregue troca a ação da História pela de ver a Curadoria (§15)", () => {
    const antes = pendingDe("HISTORIA_EM_PREENCHIMENTO");
    const depois = pendingDe("CURADORIA_ENTREGUE");
    if (antes.kind !== "action" || depois.kind !== "action") throw new Error("esperava ações");

    render(<ProximaAcao pending={depois} />);

    // A ação anterior não sobrevive ao avanço do estado.
    expect(screen.queryByText(antes.action.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: antes.action.cta!.label })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: depois.action.cta!.label })).toHaveAttribute(
      "href",
      "/paciente/curadoria",
    );
  });

  it("caso cancelado não oferece nenhum CTA de fluxo ativo (§16)", () => {
    const pending = pendingDe("CASO_CANCELADO");
    expect(pending.kind).toBe("nothing");

    render(<ProximaAcao pending={pending} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const texto = document.body.textContent ?? "";
    for (const proibido of ["continuar", "Continuar", "Acompanhar", "Ver minha Curadoria"]) {
      expect(texto, `CTA de fluxo ativo vazou num caso cancelado: ${proibido}`).not.toContain(
        proibido,
      );
    }
  });
});

describe("T-A3a-6 · uma pendência, uma apresentação", () => {
  it("o estado e a ação não repetem o mesmo botão na mesma dobra", () => {
    const leitura = leituraDe("HISTORIA_EM_PREENCHIMENTO");
    const pending = pendingComCta();

    // Exatamente a composição que a Home usa no caminho sem Case.
    render(
      <>
        <PatientHomeState leitura={leitura} statusLabel={null} acaoEmOutroLugar />
        <ProximaAcao pending={pending} />
      </>,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute("href", pending.action.cta!.href);
  });

  it("sem a declaração, a duplicação reaparece — é por isso que a Home a faz", () => {
    // O padrão do componente continua sendo exibir a própria ação: quem monta
    // a tela é quem declara que assumiu a apresentação.
    render(
      <>
        <PatientHomeState leitura={leituraDe("HISTORIA_EM_PREENCHIMENTO")} statusLabel={null} />
        <ProximaAcao pending={pendingComCta()} />
      </>,
    );
    expect(screen.getAllByRole("link").length).toBeGreaterThan(1);
  });
});

describe("A3a · a Home consome a pendência — e não volta a descartá-la", () => {
  const FONTE = "src/app/paciente/page.tsx";
  // Comentários fora: o arquivo DESCREVE o defeito antigo, e descrição não é
  // comportamento — foi assim que guardas anteriores desta casa se enganaram.
  const codigo = readFileSync(FONTE, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\/.*$/gm, "");

  it("os DOIS caminhos de render entregam `pending` ao bloco de ação", () => {
    const usos = codigo.match(/<ProximaAcao\b[^>]*pending=\{pending\}/g) ?? [];
    expect(usos.length, "a Home tem dois caminhos: sem Case e com Case").toBe(2);
  });

  it("a pendência não volta a ser consumida só quando NÃO tem destino", () => {
    // A mutação que esta guarda existe para pegar: devolver o consumo ao
    // `aside`, sob a condição que descartava toda ação com destino.
    expect(codigo).not.toMatch(/!\s*pending\.action\.cta/);
    expect(codigo).not.toMatch(/aside=\{/);
  });

  it("a Home não remonta o destino por fora da projeção (§6)", () => {
    // Nenhum href de História escrito à mão no bloco de ação: quem dá o
    // caminho é `derivePatientPending`.
    const blocoDaAcao = codigo.match(/<ProximaAcao\b[^>]*\/>/g) ?? [];
    expect(blocoDaAcao.length).toBeGreaterThan(0);
    for (const uso of blocoDaAcao) {
      expect(uso, `destino remontado na tela: ${uso}`).not.toMatch(/href=/);
    }
  });
});
