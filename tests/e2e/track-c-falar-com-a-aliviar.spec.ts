import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import {
  cleanupFixture,
  seedDeliveredCase,
  type DeliveredFixture,
} from "../apoio/apoio-curadoria-entregue";

/**
 * TRACK C · T-C-7, T-C-8 e T-C-9 — a porta, medida na rota real.
 *
 * Antes desta Track a paciente só conseguia pedir ajuda DEPOIS de já ter
 * decidido. O que se prova aqui não é que o componente funciona — isso a P1 já
 * provou —, é que ele **está na tela**, é alcançável pelo teclado, cabe em
 * 390px e leva ao destino certo, com a mensagem certa e sem carregar nada dela.
 *
 * O WhatsApp **nunca é aberto**: o destino é inspecionado por atributo. Clicar
 * abriria uma aba externa, e nenhuma prova depende disso.
 *
 * As capturas ficam atrás de `CAPTURA=1`; os testes, não. Medir é permanente.
 */

const NUMERO_OFICIAL = "5511979037133";
const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../evidencias/c");
const CAPTURANDO = Boolean(process.env.CAPTURA);

/** As sete superfícies, com o tópico que cada uma carrega (contrato 30 §5). */
const SUPERFICIES = [
  { id: "C1", rota: "/paciente/curadoria", topic: "curadoria" },
  { id: "C3", rota: "/paciente", topic: "jornada" },
  { id: "C4", rota: "/paciente/linha-do-tempo", topic: "jornada" },
  { id: "C5", rota: "/paciente/documentos", topic: "documento" },
  { id: "C6", rota: "/paciente/perfil", topic: "jornada" },
  { id: "C7", rota: "/paciente/documentos-e-consentimentos", topic: "jornada" },
] as const;

/** As mensagens, palavra por palavra. Divergir aqui é divergir do contrato. */
const MENSAGEM: Record<string, string> = {
  jornada: "Oi! Gostaria de ajuda com a minha jornada na Aliviar.",
  curadoria: "Oi! Gostaria de conversar sobre a minha Curadoria.",
  documento: "Oi! Quero enviar um documento para a minha Curadoria.",
  duvida: "Oi! Tenho uma dúvida sobre a minha Curadoria.",
};

async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();

  const recusa = page.getByRole("alert").filter({ hasText: /\S/ });
  await Promise.race([
    page
      .waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 })
      .catch(() => undefined),
    recusa.first().waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined),
  ]);

  if (new URL(page.url()).pathname.startsWith("/login")) {
    const ditos = (await recusa.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    throw new Error(
      ditos.length > 0
        ? `login recusado pelo servidor: ${ditos.join(" · ")}`
        : "login não concluiu em 60s e o servidor não recusou.",
    );
  }

  await page
    .locator('nav[aria-label="Navegação principal"]')
    .first()
    .waitFor({ state: "attached", timeout: 15_000 });
}

async function capturar(page: Page, nome: string) {
  if (!CAPTURANDO) return;
  mkdirSync(DESTINO, { recursive: true });
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome}`);
}

/**
 * Mede a superfície inteira — nunca por classe CSS.
 *
 * Só conta como vazamento o que ultrapassa a viewport SEM estar dentro de um
 * contêiner de rolagem própria: as cartas dos três caminhos vivem num
 * carrossel deliberado (auditado na B1), e medir o `right` delas acusaria um
 * layout que funciona. Mesma regra já validada na B3.
 */
async function medir(page: Page) {
  return page.evaluate(() => {
    const d = document.documentElement;
    const link = [...document.querySelectorAll("main a")].find((a) =>
      (a.textContent ?? "").includes("Falar com a Aliviar"),
    );
    const r = link?.getBoundingClientRect();

    const dentroDeScroller = (e: Element) => {
      for (let p = e.parentElement; p && p !== d; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      return false;
    };
    const excedem = [...document.querySelectorAll("main *")]
      .filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1)
      .filter((e) => !dentroDeScroller(e))
      .map((e) => e.tagName.toLowerCase());

    return {
      innerWidth: window.innerWidth,
      clientWidth: d.clientWidth,
      scrollWidth: d.scrollWidth,
      overflow: d.scrollWidth - d.clientWidth,
      links: document.querySelectorAll("main a").length,
      linkTop: r ? Math.round(r.top) : null,
      linkLeft: Math.round(r?.left ?? -1),
      linkWidth: r ? Math.round(r.width) : null,
      linkHeight: r ? Math.round(r.height) : null,
      linkRight: r ? Math.round(r.right) : null,
      excedem,
    };
  });
}

test.describe("Track C — Falar com a Aliviar (E2E autenticado)", () => {
  // Serial pelo mesmo motivo da B3: `seedDeliveredCase` popula
  // `professional_profiles`, que é um recurso GLOBAL no Supabase local.
  test.describe.configure({ mode: "serial" });

  const service = createAdminSupabaseClient();
  let fixture: DeliveredFixture;

  test.beforeAll(async () => {
    // Entregue e SEM decisão: é exatamente o estado do achado — ela lê três
    // caminhos médicos e precisa poder perguntar.
    fixture = await seedDeliveredCase();
  });

  test.afterAll(async () => {
    await cleanupFixture(fixture);
  });

  test("T-C-7 — a porta existe na Curadoria ANTES de decidir, e é alcançável pelo teclado", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });

    await entrar(page, fixture.patientEmail, fixture.patientPassword);
    await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

    // O contexto: os três caminhos estão na tela, e ela ainda não decidiu.
    await expect(page.getByRole("heading", { name: "Seus três caminhos" })).toBeVisible();
    for (const nome of fixture.professionalDisplayNames) {
      await expect(page.getByRole("article", { name: nome })).toHaveCount(1);
    }
    await expect(page.getByRole("button", { name: "Registrar minha decisão" })).toBeVisible();

    // A porta, pelo NOME ACESSÍVEL completo — o aviso de nova aba faz parte
    // dele, e é dito antes do clique.
    const porta = page.getByRole("link", { name: "Falar com a Aliviar (abre o WhatsApp em nova aba)" });
    await expect(porta).toBeVisible();

    // Alcançável e acionável só pelo teclado.
    await porta.focus();
    await expect(porta).toBeFocused();

    // O alvo, medido em pixels — nunca por classe.
    const caixa = (await porta.boundingBox())!;
    expect(Math.round(caixa.height), "alvo mínimo de 44px").toBeGreaterThanOrEqual(44);

    // O destino, lido como ATRIBUTO. O WhatsApp não é aberto em momento algum.
    const href = (await porta.getAttribute("href"))!;
    expect(href).toContain(`wa.me/${NUMERO_OFICIAL}`);
    expect(decodeURIComponent(href)).toContain(MENSAGEM.curadoria);
    expect(href, "abrir o WhatsApp não é necessário para provar o destino").toMatch(
      /^https:\/\/wa\.me\//,
    );
    await expect(porta).toHaveAttribute("target", "_blank");
    await expect(porta).toHaveAttribute("rel", "noopener noreferrer");

    // Inspecionar não decide nada: o banco continua igual.
    const { data: decisoes } = await service
      .from("patient_curadoria_decisions")
      .select("id")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(decisoes ?? [], "ver a porta não registra decisão").toHaveLength(0);

    const { data: conexoes } = await service
      .from("connection_records")
      .select("id")
      .eq("case_id", fixture.caseId);
    expect(conexoes ?? [], "ver a porta não cria conexão").toHaveLength(0);

    await capturar(page, "EV-C-001-curadoria-tres-caminhos-contato-390");
  });

  test("T-C-7 — o link já aprovado do estado decidido permanece intacto", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Fixture própria: decidir na fixture compartilhada invalidaria o teste
    // anterior, que exige o estado ANTES da decisão.
    const decidida = await seedDeliveredCase({ decidir: "CHOSEN" });
    try {
      await entrar(page, decidida.patientEmail, decidida.patientPassword);
      await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

      await expect(page.getByText("Sua decisão está registrada.")).toBeVisible();

      // O link do painel de decisão é `duvida`, está no ar e aparece em
      // EV-B3-003/004/005. A Track C não o toca — só acrescenta portas.
      //
      // Os dois se distinguem pelo NOME ACESSÍVEL, e não por posição: o antigo
      // não tem o aviso `sr-only` de nova aba; a porta nova tem. É a diferença
      // que o GAP-C-2 registra — duas implementações do mesmo link, com o
      // painel de decisão congelado até a evidência da B3 ser superada.
      const antigo = page.getByRole("link", { name: "Falar com a Aliviar", exact: true });
      await expect(antigo, "o link congelado da B3 sumiu").toHaveCount(1);
      const href = (await antigo.getAttribute("href"))!;
      expect(href).toContain(`wa.me/${NUMERO_OFICIAL}`);
      expect(decodeURIComponent(href), "a mensagem congelada da B3 mudou").toContain(
        MENSAGEM.duvida,
      );
    } finally {
      await cleanupFixture(decidida);
    }
  });

  test("T-C-8 e T-C-9 — as sete superfícies em 390px, medidas e com destino conferido", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await entrar(page, fixture.patientEmail, fixture.patientPassword);

    for (const { id, rota, topic } of SUPERFICIES) {
      await page.goto(rota, { waitUntil: "domcontentloaded" });

      const porta = page.getByRole("link", {
        name: "Falar com a Aliviar (abre o WhatsApp em nova aba)",
      });
      await expect(porta, `${id} · ${rota}: a porta precisa existir`).toHaveCount(1);
      await expect(porta).toBeVisible();

      // T-C-9 · o destino, por atributo. Nenhum request externo é feito.
      const href = (await porta.getAttribute("href"))!;
      expect(href, `${id}: número fora da fonte única`).toContain(`wa.me/${NUMERO_OFICIAL}`);
      const mensagem = decodeURIComponent(href.split("?text=")[1] ?? "");
      expect(mensagem, `${id}: mensagem do tópico ${topic}`).toBe(MENSAGEM[topic]);
      for (const dado of [
        fixture.caseId,
        fixture.curatedSelectionId,
        fixture.patientProfileId,
        fixture.patientEmail,
        ...fixture.professionalDisplayNames,
      ]) {
        expect(mensagem, `${id}: a mensagem carrega dado da paciente`).not.toContain(dado);
      }

      // T-C-8 · a medição, em pixels.
      const m = await medir(page);
      console.log(`[TRACK-C] ${id} ${rota} → ${JSON.stringify(m)}`);

      expect(m.innerWidth, `${id}: viewport`).toBe(390);
      expect(m.clientWidth, `${id}: clientWidth`).toBe(390);
      expect(m.scrollWidth, `${id}: scrollWidth === clientWidth`).toBe(m.clientWidth);
      expect(m.overflow, `${id}: zero rolagem horizontal`).toBeLessThanOrEqual(0);
      expect(m.excedem, `${id}: elemento fora da viewport`).toEqual([]);
      expect(m.linkHeight, `${id}: alvo mínimo de 44px`).toBeGreaterThanOrEqual(44);
      expect(m.linkRight!, `${id}: o próprio link ultrapassa a viewport`).toBeLessThanOrEqual(390);
    }

    await page.goto("/paciente", { waitUntil: "domcontentloaded" });
    await capturar(page, "EV-C-002-home-contato-390");

    await page.goto("/paciente/documentos", { waitUntil: "domcontentloaded" });
    await capturar(page, "EV-C-004-mobile-390-documentos");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/paciente/documentos", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("link", { name: "Falar com a Aliviar (abre o WhatsApp em nova aba)" }),
    ).toBeVisible();
    await capturar(page, "EV-C-003-documentos-contato-desktop");
  });

  test("C2 — quem ainda espera não espera sozinha", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });

    // Emitida e NÃO entregue: `loadPatientCuradoria` recusa devolver Curadoria
    // sem `delivered_at`, e não há entrega legada. É o estado vazio real.
    const esperando = await seedDeliveredCase({ entregar: false });
    try {
      await entrar(page, esperando.patientEmail, esperando.patientPassword);
      await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

      await expect(page.getByText("Ainda não há relatórios aqui.")).toBeVisible();

      const porta = page.getByRole("link", {
        name: "Falar com a Aliviar (abre o WhatsApp em nova aba)",
      });
      await expect(porta).toHaveCount(1);
      expect(decodeURIComponent((await porta.getAttribute("href"))!)).toContain(
        MENSAGEM.curadoria,
      );

      // A frase institucional aparece AQUI, e só aqui: é o único ponto com
      // espaço de bloco. Nas seis inserções discretas ela seria ruído.
      await expect(page.getByText("Sem pressa — responderemos.")).toBeVisible();

      const m = await medir(page);
      expect(m.overflow, "estado vazio: zero rolagem horizontal").toBeLessThanOrEqual(0);
      expect(m.linkHeight, "estado vazio: alvo mínimo de 44px").toBeGreaterThanOrEqual(44);

      await capturar(page, "EV-C-004b-estado-vazio-contato-390");
    } finally {
      await cleanupFixture(esperando);
    }
  });
});
