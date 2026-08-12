import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PATIENT_NAV_ITEMS } from "@/components/paciente/patient-nav-items";

// PRODUTO DO PACIENTE — Fase 2 (Correções Arquiteturais Não Bloqueantes).
// Verificações textuais/estruturais (leitura de arquivo real, nunca
// reimplementação da regra em outro lugar) para os quatro itens da fase.
// A parte que exige renderização React vive em tests/components/.

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function readSrc(relativePath: string): string {
  return readFileSync(path.join(SRC, relativePath), "utf-8");
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("Parte 1 — código morto removido", () => {
  it("patient-dashboard-sections.tsx não existe mais", () => {
    expect(
      existsSync(
        path.join(SRC, "components/profiles/patient-dashboard-sections.tsx"),
      ),
    ).toBe(false);
  });

  it("nenhuma referência a patient-dashboard-sections em todo o src/", () => {
    const files = [
      "app/paciente/page.tsx",
      "components/paciente/patient-home-state.tsx",
      "modules/profiles/index.ts",
    ];
    for (const file of files) {
      expect(readSrc(file)).not.toMatch(/patient-dashboard-sections/);
    }
  });

  it("nenhuma referência aos três componentes que o arquivo exportava", () => {
    const barrelLike = readSrc("modules/profiles/index.ts");
    expect(barrelLike).not.toMatch(
      /CurationStatusCard|NextStepsCard|InstitutionalMessages/,
    );
  });
});

describe("Parte 2 — fonte única de navegação do paciente", () => {
  it("existe exatamente uma configuração canônica, com seis itens", () => {
    expect(PATIENT_NAV_ITEMS).toHaveLength(6);
  });

  it("PatientShell consome a configuração canônica (import real, não uma lista própria)", () => {
    const source = readSrc("components/paciente/patient-shell.tsx");
    expect(source).toMatch(
      /import\s*\{\s*PATIENT_NAV_ITEMS\s*\}\s*from\s*["']\.\/patient-nav-items["']/,
    );
    // Nenhuma segunda declaração local do mesmo nome (garantiria fonte única).
    expect(source).not.toMatch(/const\s+PATIENT_NAV_ITEMS/);
  });

  it("nenhuma rota duplicada dentro da configuração canônica", () => {
    const hrefs = PATIENT_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("toda rota da configuração canônica corresponde a uma página real", () => {
    // G1/suíte-estável: mapa atualizado para as rotas da release certificada
    // (o item de nav aponta para /sua-historia/continuar desde a ETAPA 8 da
    // reconstrução; este teste estava vermelho na tag por oráculo defasado).
    const routeToFile: Record<string, string> = {
      "/paciente": "app/paciente/page.tsx",
      "/sua-historia": "app/(public)/sua-historia/page.tsx",
      "/sua-historia/continuar": "app/(public)/sua-historia/(wizard)/continuar/page.tsx",
      "/paciente/documentos": "app/paciente/documentos/page.tsx",
      "/paciente/curadoria": "app/paciente/curadoria/page.tsx",
      "/paciente/linha-do-tempo": "app/paciente/linha-do-tempo/page.tsx",
      "/paciente/perfil": "app/paciente/perfil/page.tsx",
    };

    for (const item of PATIENT_NAV_ITEMS) {
      const file = routeToFile[item.href];
      expect(
        file,
        `rota "${item.href}" não tem mapeamento neste teste`,
      ).toBeDefined();
      expect(
        existsSync(path.join(SRC, file)),
        `rota "${item.href}" aponta para um arquivo inexistente: ${file}`,
      ).toBe(true);
    }
  });

  it("Linha do tempo está presente porque a rota é real, autenticada e implementada", () => {
    const linhaDoTempo = PATIENT_NAV_ITEMS.find(
      (item) => item.href === "/paciente/linha-do-tempo",
    );
    expect(linhaDoTempo).toBeDefined();

    const pageSource = readSrc("app/paciente/linha-do-tempo/page.tsx");
    expect(pageSource).toMatch(/requireRole\("paciente"\)/);
    expect(pageSource).not.toMatch(/em breve|placeholder|TODO/i);
  });

  // A4 · a ordem é ancorada nos DESTINOS, não na redação. O rótulo da Jornada
  // mudou ("Linha do tempo" → "Sua Jornada") e derrubou este oráculo, que
  // fixava as seis palavras à mão. O que esta guarda existe para proteger é a
  // sequência da navegação e a fonte única — não o texto de cada item, que é
  // copy e muda quando a experiência muda.
  it("ordem preservada: Início, história, Documentos, Curadoria, Jornada, Perfil", () => {
    expect(PATIENT_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/paciente",
      "/sua-historia/continuar",
      "/paciente/documentos",
      "/paciente/curadoria",
      "/paciente/linha-do-tempo",
      "/paciente/perfil",
    ]);
    // E nenhum item fica sem nome.
    for (const item of PATIENT_NAV_ITEMS) expect(item.label.trim()).toBeTruthy();
  });

  it("getDefaultNavItems (AppShell) não gera mais navegação de paciente", () => {
    const source = stripComments(readSrc("components/shell/nav-items.ts"));
    expect(source).not.toMatch(/role === "paciente"/);
  });

  it("AppShell não é importado por nenhum arquivo do ambiente do paciente", () => {
    const patientFiles = [
      "app/paciente/layout.tsx",
      "components/paciente/patient-shell.tsx",
    ];
    for (const file of patientFiles) {
      expect(stripComments(readSrc(file))).not.toMatch(/AppShell/);
    }
  });
});

describe("Parte 3 — wizard desacoplado da Landing", () => {
  const wizardFiles = [
    "app/(public)/sua-historia/(wizard)/para-quem/page.tsx",
    "app/(public)/sua-historia/(wizard)/motivo/page.tsx",
    "app/(public)/sua-historia/(wizard)/historia/page.tsx",
    "app/(public)/sua-historia/(wizard)/informacoes/page.tsx",
    "app/(public)/sua-historia/(wizard)/preferencias/page.tsx",
    "app/(public)/sua-historia/(wizard)/revisao/page.tsx",
    "app/(public)/sua-historia/(wizard)/layout.tsx",
    "components/story/story-step-layout.tsx",
    "components/story/story-narrative.tsx",
    "components/story/story-attachments.tsx",
    "components/story/story-conflict-banner.tsx",
    "components/story/autosave-indicator.tsx",
    "components/story/review-item.tsx",
    "components/story/story-summary.tsx",
  ];

  it("nenhum arquivo do wizard importa de @/components/landing", () => {
    for (const file of wizardFiles) {
      const source = readSrc(file);
      expect(source, `${file} ainda importa de components/landing`).not.toMatch(
        /from ["']@\/components\/landing/,
      );
    }
  });

  it("os primitivos compartilhados agora vivem em components/ui, não em components/landing", () => {
    expect(
      existsSync(path.join(SRC, "components/ui/section-container.tsx")),
    ).toBe(true);
    expect(existsSync(path.join(SRC, "components/ui/section-reveal.tsx"))).toBe(
      true,
    );
    expect(
      existsSync(path.join(SRC, "components/landing/section-container.tsx")),
    ).toBe(false);
    expect(
      existsSync(path.join(SRC, "components/landing/section-reveal.tsx")),
    ).toBe(false);
  });

  it("os primitivos compartilhados não importam nenhuma composição pública da Landing", () => {
    const container = readSrc("components/ui/section-container.tsx");
    const reveal = readSrc("components/ui/section-reveal.tsx");
    expect(container).not.toMatch(/from ["']@\/components\/landing/);
    expect(reveal).not.toMatch(/from ["']@\/components\/landing/);
  });

  it("a Landing continua consumindo os mesmos primitivos, agora de components/ui", () => {
    // video-section.tsx removido desta lista (LANDING DO PACIENTE — Fase 2,
    // Hardening, Etapa 1: divergência real encontrada, não introduzida por
    // esta fase): o commit ddd70e9 já em HEAD removeu a variante "section"
    // (o único uso de SectionContainer/SectionReveal neste arquivo) por ser
    // código morto sem consumidor real — a variante "window" remanescente
    // nunca precisou desses primitivos. Ajuste do teste para refletir essa
    // arquitetura já decidida, não reconstrução dela.
    // TRACK D · `faq-book-section` e `final-cta-section` saíram com a landing
    // morta (código morto com substituto vivo em `landing/editorial/*`). O que
    // este guarda protege — a Landing consome os primitivos de `components/ui`,
    // nunca o contrário — segue valendo no consumidor que sobreviveu.
    const landingConsumers = ["components/landing/public-footer.tsx"];
    for (const file of landingConsumers) {
      const source = readSrc(file);
      expect(source).toMatch(
        /from ["']@\/components\/ui\/section-(container|reveal)["']/,
      );
    }
  });

  it("a Landing não passou a importar o módulo story (sem dependência circular)", () => {
    // TRACK D · quatro dos cinco saíram com a landing morta. A ausência de
    // dependência circular continua afirmada sobre o que existe.
    const landingFiles = ["components/landing/public-footer.tsx"];
    for (const file of landingFiles) {
      expect(readSrc(file)).not.toMatch(
        /from ["']@\/(modules|components)\/story/,
      );
    }
  });

  it("as seis etapas do wizard continuam com a mesma ordem e destinos (backHref/nextHref)", () => {
    const expected: Record<string, { back?: string; next?: string }> = {
      // G1/suíte-estável: a release certificada mudou o back do primeiro passo
      // para /paciente (a paciente logada volta ao painel, não à landing).
      "app/(public)/sua-historia/(wizard)/para-quem/page.tsx": {
        back: "/paciente",
        next: "/sua-historia/motivo",
      },
      "app/(public)/sua-historia/(wizard)/motivo/page.tsx": {
        back: "/sua-historia/para-quem",
        next: "/sua-historia/historia",
      },
      "app/(public)/sua-historia/(wizard)/historia/page.tsx": {
        back: "/sua-historia/motivo",
        next: "/sua-historia/informacoes",
      },
      "app/(public)/sua-historia/(wizard)/informacoes/page.tsx": {
        back: "/sua-historia/historia",
        next: "/sua-historia/preferencias",
      },
      "app/(public)/sua-historia/(wizard)/preferencias/page.tsx": {
        back: "/sua-historia/informacoes",
        next: "/sua-historia/revisao",
      },
      "app/(public)/sua-historia/(wizard)/revisao/page.tsx": {
        back: "/sua-historia/preferencias",
      },
    };

    for (const [file, hrefs] of Object.entries(expected)) {
      const source = readSrc(file);
      if (hrefs.back) expect(source).toContain(`backHref="${hrefs.back}"`);
      if (hrefs.next) expect(source).toContain(`nextHref="${hrefs.next}"`);
    }
  });
});

describe("Parte 4 — ConnectionChoicePanel sem reload completo", () => {
  it("window.location.reload não existe mais neste arquivo", () => {
    const source = readSrc("components/patient/connection-choice-panel.tsx");
    expect(source).not.toMatch(/window\.location\.reload/);
  });

  it("router.refresh() é chamado após sucesso", () => {
    const source = readSrc("components/patient/connection-choice-panel.tsx");
    expect(source).toMatch(/useRouter/);
    expect(source).toMatch(/router\.refresh\(\)/);
  });

  it("as superfícies que exerciam autoridade do ACE não existem mais", () => {
    // Este teste nasceu provando que uma correção de reload havia sido
    // cirúrgica: os outros três usos de `window.location.reload` viviam nos
    // painéis de execução, entrega e revisão do ACE, e deviam permanecer
    // intocados. A ADR-035 descontinuou justamente esses três — o invariante
    // deixou de ser "continuam iguais" e passou a ser "não existem".
    const descontinuadas = [
      "components/cases/ace-execution-panel.tsx",
      "components/ace/final-curadoria-delivery-panel.tsx",
      "components/ace/human-review-form.tsx",
    ];
    for (const file of descontinuadas) {
      expect(existsSync(path.resolve(SRC, file)), `${file} deveria ter sido descontinuada`).toBe(
        false,
      );
    }
  });

  it("o domínio connection (commands/state-machine) não foi tocado", () => {
    const commands = readSrc("modules/connection/commands.ts");
    const stateMachine = readSrc("modules/connection/state-machine.ts");
    // Presença das assinaturas/comentários originais, inalterados —
    // qualquer reescrita do domínio quebraria estas âncoras textuais.
    expect(commands).toMatch(/export function createConnection\(/);
    expect(commands).toMatch(/export function correctChoice\(/);
    expect(commands).toMatch(/export function registerContactIntent\(/);
    expect(commands).toMatch(/export function confirmFirstAppointment\(/);
    expect(commands).toMatch(/export function closeWithoutRelationship\(/);
    expect(stateMachine).toMatch(/ALLOWED_TRANSITIONS/);
  });
});
