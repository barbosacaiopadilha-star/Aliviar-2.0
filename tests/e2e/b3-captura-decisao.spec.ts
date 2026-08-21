/**
 * B3-EV-A · CAPTURA DA DECISÃO — antes, e o instante imediatamente depois.
 *
 * Mesma convenção da A6: gate por `CAPTURA=1`, credencial por variável de
 * ambiente, destino em `evidencias/` (gitignored). A paciente aqui é
 * SINTÉTICA, criada pela fixture canônica — nenhuma conta permanente e nenhum
 * dado real aparece nas imagens.
 *
 *   CAPTURA=1 CAPTURA_DIR=evidencias/b3 \
 *     node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/b3-captura-decisao.spec.ts --workers=1
 *
 * EV-B3-002 é a evidência que não pode ser fabricada: ela precisa ATRAVESSAR
 * o handler assíncrono real. Foi exatamente ali que o defeito do
 * `startTransition` se escondeu — a action era chamada, o refresh acontecia, e
 * a confirmação nunca aparecia. Render direto não o teria mostrado, e uma
 * captura com estado montado à mão pareceria correta provando nada.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import {
  cleanupFixture,
  removerPacienteSintetico,
  seedDeliveredCase,
  type DeliveredFixture,
} from "../apoio/apoio-curadoria-entregue";
import { createCuradoriaClient } from "../integration/curadoria-client";
import { seedPublishedProfessional } from "../integration/rede-fixture";

const URL_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const ANON_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/** Contas fixas locais — mesma convenção dos demais specs de e2e. */
function loadTestAccounts(): Array<{ role: string; email: string; password: string }> {
  const arquivo = path.resolve(__dirname, "../../test-users.local.json");
  if (!existsSync(arquivo)) {
    throw new Error("test-users.local.json ausente — rode bootstrap:test-users:local.");
  }
  return JSON.parse(readFileSync(arquivo, "utf-8"));
}

const DESTINO = process.env.CAPTURA_DIR ?? path.resolve(__dirname, "../../evidencias/b3");

/**
 * V-B3-1 · O LOGIN ESPERA POR MARCO, NÃO POR NAVEGAÇÃO.
 *
 * `waitForURL` sozinho esperava a coisa errada. O formulário entra com
 * `router.push` ([login-form.tsx:29](../../src/components/auth/login-form.tsx:29))
 * — navegação do CLIENTE, e a URL só troca quando a rota de destino termina de
 * renderizar no servidor. Com a máquina carregada isso passa dos 30s do
 * `navigationTimeout`, e o erro dizia "waitForURL", que não se parece nem um
 * pouco com "a home da paciente demorou a montar". Foi assim que a captura
 * falhou no login numa execução e passou na seguinte.
 *
 * Agora são dois marcos, nesta ordem, cada um com teto próprio:
 *
 * 1 · **o servidor respondeu** — ou saiu de `/login`, ou recusou. A recusa é
 *     `FormMessage role="alert"` e vira erro COM o texto inteiro do servidor.
 *     Credencial errada precisa dizer o motivo, não esgotar um teto em
 *     silêncio — e nada aqui reexecuta o login.
 * 2 · **a área autenticada montou** — `nav[aria-label="Navegação principal"]`
 *     só existe dentro do shell logado. Esperado `attached` e não `visible`
 *     porque em 390px ele fica atrás do menu, e este helper serve os dois
 *     viewports.
 */
async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();

  // Só alerta COM texto é recusa. `role="alert"` vazio existe na árvore da tela
  // de destino, e a primeira versão desta correção o leu como "login recusado
  // pelo servidor: " — mensagem vazia, teste vermelho, causa nenhuma.
  const recusa = page.getByRole("alert").filter({ hasText: /\S/ });

  // As duas esperas nunca rejeitam: quem perde a corrida ficaria pendente e
  // rejeitaria sozinha ao esgotar o teto, e é o diagnóstico abaixo — não a
  // corrida — que decide o que aconteceu.
  await Promise.race([
    page
      .waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 60_000 })
      .catch(() => undefined),
    recusa
      .first()
      .waitFor({ state: "visible", timeout: 60_000 })
      .catch(() => undefined),
  ]);

  // Quem manda é a URL: sair de `/login` é o desfecho, e um alerta qualquer na
  // tela de destino não é recusa de autenticação.
  if (new URL(page.url()).pathname.startsWith("/login")) {
    const ditos = (await recusa.allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    throw new Error(
      ditos.length > 0
        ? `login recusado pelo servidor: ${ditos.join(" · ")}`
        : "login não concluiu em 60s e o servidor não recusou — a transição do router não fechou. " +
          "Investigar antes de mexer no teto.",
    );
  }

  await page
    .locator('nav[aria-label="Navegação principal"]')
    .first()
    .waitFor({ state: "attached", timeout: 15_000 });
}

/**
 * B3-EV-C1 · EV-B3-001 e EV-B3-002 continuam VÁLIDAS depois da B3-COPY.
 *
 * A primeira é o estado ANTERIOR à decisão, onde `mostrarConexao` é falso e
 * painel de conexão nenhum existe; a segunda é o feedback transitório, na mesma
 * condição. Nenhuma das duas contém a copy que mudou — recapturá-las produziria
 * imagens equivalentes, e sobrescrever evidência válida é perder histórico por
 * nada. O teste que as produz CONTINUA rodando: é ele que registra a decisão de
 * verdade, atravessando a action, e é dessa decisão que EV-003/004/005 dependem.
 */
const PRESERVADAS = new Set([
  "EV-B3-001-antes-da-decisao-desktop",
  "EV-B3-002-feedback-imediato-desktop",
]);

async function capturar(page: Page, nome: string) {
  if (PRESERVADAS.has(nome)) {
    console.log(`preservado — não recapturado: ${nome}`);
    return;
  }
  mkdirSync(DESTINO, { recursive: true });
  await page.screenshot({ path: path.join(DESTINO, `${nome}.png`), fullPage: true });
  console.log(`capturado: ${nome}`);
}

/** As frases que só existem no caminho LEGADO, e que o canônico não pode ter. */
const COPY_LEGADA = [
  "Com quem você gostaria de seguir",
  "um dos três",
  "Os profissionais foram apresentados",
];

test.skip(!process.env.CAPTURA, "captura sob demanda — CAPTURA=1");
test.describe.configure({ mode: "serial" });

test.describe("B3 · evidências da decisão", () => {
  const service = createAdminSupabaseClient();
  let fixture: DeliveredFixture;

  test.beforeAll(async () => {
    fixture = await seedDeliveredCase();
  });

  test.afterAll(async () => {
    await cleanupFixture(fixture);
  });

  test("EV-B3-001 e EV-B3-002 — antes da decisão, e o feedback imediato", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // -----------------------------------------------------------------------
    // EV-B3-001 · ANTES
    // -----------------------------------------------------------------------
    const { data: antes } = await service
      .from("patient_curadoria_decisions")
      .select("id")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(antes ?? [], "a fixture precisa nascer sem decisão").toHaveLength(0);

    await entrar(page, fixture.patientEmail, fixture.patientPassword);
    await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

    // Os três caminhos.
    await expect(page.getByRole("heading", { name: "Seus três caminhos" })).toBeVisible();
    for (const nome of fixture.professionalDisplayNames) {
      await expect(page.getByRole("article", { name: nome })).toHaveCount(1);
    }

    // A superfície canônica, alcançável, com a recusa legítima com o mesmo peso.
    await expect(page.getByRole("button", { name: "Registrar minha decisão" })).toBeVisible();
    await expect(
      page.getByRole("radio", { name: "Nenhuma destas serviu para mim" }),
    ).toBeVisible();

    // Curador responsável — provado pela AUSÊNCIA do estado decidido, que é o
    // único caminho para o Concierge. Buscar "Equipe Aliviar" no texto acusaria
    // o cabeçalho institucional (quatro ocorrências legítimas).
    await expect(page.getByText("Sua decisão está registrada.")).toHaveCount(0);

    await capturar(page, "EV-B3-001-antes-da-decisao-desktop");

    // -----------------------------------------------------------------------
    // EV-B3-002 · O INSTANTE DEPOIS
    // -----------------------------------------------------------------------
    const escolhido = fixture.professionalDisplayNames[0]!;
    await page.getByRole("radio", { name: escolhido }).check();

    // O clique REAL, atravessando `registerDecisionAction`.
    await page.getByRole("button", { name: "Registrar minha decisão" }).click();

    // A espera é pelo STATUS aparecer — nunca por timeout arbitrário.
    const status = page.getByRole("status");
    await expect(status).toBeVisible({ timeout: 60_000 });
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(status).toBeFocused();

    await expect(page.getByText("Sua decisão foi registrada.")).toBeVisible();
    await expect(
      page.getByText("Agora a Aliviar pode seguir com os próximos passos."),
    ).toBeVisible();

    // Captura ANTES de qualquer navegação: é o estado transitório real.
    await capturar(page, "EV-B3-002-feedback-imediato-desktop");

    // -----------------------------------------------------------------------
    // O que o banco diz sobre o mesmo instante
    // -----------------------------------------------------------------------
    const { data: depois } = await service
      .from("patient_curadoria_decisions")
      .select("id, outcome, chosen_option_id")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(depois ?? [], "a decisão precisa existir, e ser única").toHaveLength(1);
    expect(depois![0]!.outcome).toBe("CHOSEN");
    expect(depois![0]!.chosen_option_id, "a opção escolhida precisa estar gravada").toBeTruthy();

    const { data: trilha } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "patient_curadoria_decided")
      .eq("target_profile_id", fixture.patientProfileId);
    const desta = (trilha ?? []).filter(
      (l) => (l.metadata as Record<string, unknown>)?.curated_selection_id === fixture.curatedSelectionId,
    );
    expect(desta, "decidir deixa exatamente uma entrada na trilha").toHaveLength(1);

    // Decidir NÃO inicia conexão: são fatos distintos (ADR-066).
    const { data: conexoes } = await service
      .from("connection_records")
      .select("id")
      .eq("case_id", fixture.caseId);
    expect(conexoes ?? [], "a decisão não cria conexão automática").toHaveLength(0);
  });

  /**
   * O estado durável não é continuação do anterior: é a MESMA página relida.
   * A fixture já está decidida, e o que se prova aqui é que o fato persistido
   * — não um resto de estado React — comanda a renderização.
   */
  test("EV-B3-003 e EV-B3-004 — estado durável, desktop e 390px", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await entrar(page, fixture.patientEmail, fixture.patientPassword);
    await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });
    await page.reload();

    // Nada foi criado pela releitura.
    const { data: decisoes } = await service
      .from("patient_curadoria_decisions")
      .select("id")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(decisoes ?? [], "reload não cria segunda decisão").toHaveLength(1);

    const { data: trilha } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "patient_curadoria_decided")
      .eq("target_profile_id", fixture.patientProfileId);
    expect(
      (trilha ?? []).filter(
        (l) => (l.metadata as Record<string, unknown>)?.curated_selection_id === fixture.curatedSelectionId,
      ),
      "reload não gera segunda entrada na trilha",
    ).toHaveLength(1);

    const { data: conexoes } = await service
      .from("connection_records")
      .select("id")
      .eq("case_id", fixture.caseId);
    expect(conexoes ?? [], "nenhuma conexão automática").toHaveLength(0);

    // O estado durável, e o handoff dito na copy específica.
    await expect(page.getByText("Sua decisão está registrada.")).toBeVisible();
    await expect(
      page.getByText(/a próxima etapa passa a ser acompanhada pela Equipe Aliviar/),
    ).toBeVisible();
    await expect(
      page.getByText("Você continua podendo consultar sua Curadoria sempre que precisar."),
    ).toBeVisible();

    // Append-only na tela: nada de decidir de novo, nada de desfazer.
    await expect(page.getByRole("button", { name: "Registrar minha decisão" })).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "Nenhuma destas serviu para mim" })).toHaveCount(0);
    for (const proibida of [/editar/i, /desfazer/i, /apagar/i, /trocar/i, /escolher outro/i]) {
      await expect(page.getByRole("button", { name: proibida })).toHaveCount(0);
    }

    // Os três caminhos continuam consultáveis depois de decidir.
    await expect(page.getByRole("heading", { name: "Seus três caminhos" })).toBeVisible();

    // -----------------------------------------------------------------------
    // B3-COPY · a conexão canônica, logo abaixo do estado decidido.
    //
    // Era exatamente aqui que a contradição morava: a pessoa já tinha decidido,
    // e a tela perguntava de novo "com quem?", com um rádio não marcado sob um
    // botão que falava em três. Agora a decisão e o convite a começar dizem a
    // MESMA coisa.
    // -----------------------------------------------------------------------
    const escolhido = fixture.professionalDisplayNames[0]!;

    await expect(
      page.getByRole("heading", { name: "Começar seu acompanhamento" }),
    ).toBeVisible();
    await expect(page.getByText(`Caminho escolhido: ${escolhido}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir meu acompanhamento" }),
    ).toBeVisible();
    await expect(page.getByRole("radio"), "nada para marcar depois de decidir").toHaveCount(0);
    for (const legada of COPY_LEGADA) {
      await expect(
        page.getByText(legada, { exact: false }),
        `copy legada vazou no canônico: ${legada}`,
      ).toHaveCount(0);
    }

    // O CTA e o canal oficial — inspecionado, nunca aberto.
    const cta = page.getByRole("link", { name: "Falar com a Aliviar" });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href, "o canal precisa ser o oficial").toContain("wa.me/5511979037133");
    expect(href, "o tópico é `duvida`, pré-escrito").toContain("Curadoria");

    await capturar(page, "EV-B3-003-estado-duravel-desktop");

    // -----------------------------------------------------------------------
    // EV-B3-004 · 390px, medido — não estimado
    // -----------------------------------------------------------------------
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    // V-B3-1 · mesma classe da correção do H4: depois de um reload, quem responde
    // é o servidor, e o teto tem de ser dito. O card decidido já É o marco
    // durável — ele nasce do fato persistido, não de estado da sessão anterior.
    await expect(page.getByText("Sua decisão está registrada.")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Registrar minha decisão" })).toHaveCount(0);

    // O mesmo canônico no tamanho em que o achado apareceu (EV-B3-004 é a
    // prova original do defeito): convite a começar, pessoa fixa, CTA certo.
    await expect(
      page.getByRole("heading", { name: "Começar seu acompanhamento" }),
    ).toBeVisible();
    await expect(page.getByText(`Caminho escolhido: ${escolhido}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir meu acompanhamento" }),
    ).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    for (const legada of COPY_LEGADA) {
      await expect(page.getByText(legada, { exact: false })).toHaveCount(0);
    }

    const medidas = await page.evaluate(() => {
      const d = document.documentElement;
      const link = [...document.querySelectorAll("main a")].find(
        (a) => a.textContent?.trim() === "Falar com a Aliviar",
      );
      const cta = link?.getBoundingClientRect();
      // O CTA canônico — o alvo que a pessoa realmente toca para começar. Era
      // ele que, antes da B3-COPY, dizia "Quero seguir com um dos três".
      const abrir = [...document.querySelectorAll("main button")].find(
        (b) => b.textContent?.trim() === "Abrir meu acompanhamento",
      );
      const abrirRect = abrir?.getBoundingClientRect();
      const decidido = [...document.querySelectorAll("main *")].find((e) =>
        e.textContent?.trim().startsWith("Sua decisão está registrada."),
      );
      const caminhos = [...document.querySelectorAll("main h2")].find(
        (h) => h.textContent?.trim() === "Seus três caminhos",
      );
      // Só conta como vazamento o que ultrapassa a viewport SEM estar dentro de
      // um contêiner de rolagem própria. As cartas dos três caminhos vivem num
      // carrossel deliberado (B1, já auditado): medir o `right` delas contra a
      // viewport acusaria um layout que funciona.
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
        ctaWidth: cta ? Math.round(cta.width) : null,
        ctaHeight: cta ? Math.round(cta.height) : null,
        ctaAbrirWidth: abrirRect ? Math.round(abrirRect.width) : null,
        ctaAbrirHeight: abrirRect ? Math.round(abrirRect.height) : null,
        distanciaAteCuradoria:
          decidido && caminhos
            ? Math.round(
                caminhos.getBoundingClientRect().top - decidido.getBoundingClientRect().top,
              )
            : null,
        excedem,
      };
    });

    console.log("MEDIÇÕES 390px:", JSON.stringify(medidas));

    expect(medidas.innerWidth).toBe(390);
    expect(medidas.overflow, "zero rolagem horizontal").toBeLessThanOrEqual(0);
    expect(medidas.excedem, "nenhum elemento ultrapassa a viewport").toEqual([]);
    expect(medidas.ctaHeight, "alvo mínimo de 44px").toBeGreaterThanOrEqual(44);
    expect(
      medidas.ctaAbrirHeight,
      "o CTA canônico precisa existir e ter alvo mínimo de 44px",
    ).toBeGreaterThanOrEqual(44);

    await capturar(page, "EV-B3-004-estado-duravel-mobile-390");
  });

  /**
   * EV-B3-005 · O ESTADO QUE NÃO EXISTIA — acompanhamento aberto, no canônico.
   *
   * É a prova de §3.3 do contrato 28: depois de abrir, a tela fala de
   * continuidade e NÃO oferece correção. A pessoa não é perguntada de novo, e a
   * decisão registrada permanece exatamente como estava — abrir o
   * acompanhamento é um fato NOVO, nunca uma alteração do anterior.
   */
  test("EV-B3-005 — acompanhamento aberto, 390px", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });

    const escolhido = fixture.professionalDisplayNames[0]!;

    await entrar(page, fixture.patientEmail, fixture.patientPassword);
    await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

    // O estado de partida é o de EV-B3-004: decidido, sem conexão.
    const { data: antesDeAbrir } = await service
      .from("connection_records")
      .select("id")
      .eq("case_id", fixture.caseId);
    expect(antesDeAbrir ?? [], "EV-005 começa sem conexão").toHaveLength(0);

    const { data: decisaoAntes } = await service
      .from("patient_curadoria_decisions")
      .select("id, outcome, chosen_option_id, decided_at")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(decisaoAntes ?? []).toHaveLength(1);

    // -----------------------------------------------------------------------
    // A revisão — as cinco verdades, e a quinta é a que o append-only exige.
    // -----------------------------------------------------------------------
    await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

    await expect(
      page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
    ).toBeVisible();
    await expect(
      page.getByText(`Seu acompanhamento com ${escolhido} passa a ser visível`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(`${escolhido} ainda não foi procurado`, { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText(/nunca fica sem alguém respondendo por ele/),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Sua decisão continua registrada do jeito que está: abrir o acompanhamento não altera o que você já decidiu.",
      ),
      "a quinta verdade substitui a promessa legada de trocar depois",
    ).toBeVisible();
    await expect(
      page.getByText(/Os outros dois caminhos continuam na Mesa/),
    ).toBeVisible();

    // A promessa que só o legado pode fazer não aparece aqui.
    await expect(page.getByText(/pode trocar aqui mesmo/)).toHaveCount(0);

    // -----------------------------------------------------------------------
    // O ato — e a espera pelo ESTADO REAL, com teto explícito. Sem sleep.
    // -----------------------------------------------------------------------
    await page.getByRole("button", { name: "Abrir meu acompanhamento" }).click();

    await expect(page.getByText(`Acompanhamento aberto com ${escolhido}.`)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("heading", { name: "Seu acompanhamento" }).first(),
    ).toBeVisible();

    // Nenhuma via de correção — nem botão, nem rádio, nem verbo.
    await expect(page.getByRole("button", { name: "Alterar minha escolha" })).toHaveCount(0);
    await expect(page.getByRole("radio")).toHaveCount(0);
    for (const proibida of [/trocar/i, /escolher outro/i, /editar/i, /desfazer/i]) {
      await expect(page.getByRole("button", { name: proibida })).toHaveCount(0);
    }
    await expect(page.getByText("Você escolheu seguir com", { exact: false })).toHaveCount(0);

    await capturar(page, "EV-B3-005-acompanhamento-aberto-mobile-390");

    // -----------------------------------------------------------------------
    // O que o banco diz: um fato NOVO, e o anterior intacto.
    // -----------------------------------------------------------------------
    const { data: conexoes } = await service
      .from("connection_records")
      .select("id, professional_profile_id, status")
      .eq("case_id", fixture.caseId);
    expect(conexoes ?? [], "abrir cria exatamente uma conexão").toHaveLength(1);
    expect(conexoes![0]!.status).toBe("DECISAO_REGISTRADA");

    const { data: decisaoDepois } = await service
      .from("patient_curadoria_decisions")
      .select("id, outcome, chosen_option_id, decided_at")
      .eq("curated_selection_id", fixture.curatedSelectionId);
    expect(decisaoDepois ?? [], "a decisão continua única").toHaveLength(1);
    expect(
      decisaoDepois![0],
      "abrir o acompanhamento não altera o que já foi decidido",
    ).toEqual(decisaoAntes![0]);

    const { data: trilha } = await service
      .from("audit_logs")
      .select("metadata")
      .eq("action", "patient_curadoria_decided")
      .eq("target_profile_id", fixture.patientProfileId);
    expect(
      (trilha ?? []).filter(
        (l) =>
          (l.metadata as Record<string, unknown>)?.curated_selection_id ===
          fixture.curatedSelectionId,
      ),
      "abrir não duplica a trilha da decisão",
    ).toHaveLength(1);
  });
});

/**
 * B3-EV-C2 · O FECHAMENTO — a outra decisão, e a leitura.
 *
 * Eram três coisas aqui. A primeira era o LEGADO visto de perto, "o que
 * justifica a existência de dois modos" — e os dois modos deixaram de existir
 * junto com o motor ACE, então o caso saiu com eles.
 *
 * Restam as duas que não dependiam dele: a recusa legítima (`NONE_OF_THEM`,
 * que nenhuma captura precisa mas toda auditoria precisa) e a acessibilidade
 * medida no fluxo REAL — nunca em render isolado.
 */
test.describe("B3 · fechamento (EV-C2)", () => {
  const service = createAdminSupabaseClient();

  test("NONE_OF_THEM — a recusa legítima, pelo navegador", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const f = await seedDeliveredCase();
    try {
      await entrar(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

      await page.getByRole("radio", { name: "Nenhuma destas serviu para mim" }).check();
      await page.getByRole("button", { name: "Registrar minha decisão" }).click();

      // O feedback REAL — atravessando a action, nunca um timeout arbitrário.
      const status = page.getByRole("status");
      await expect(status).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Sua decisão foi registrada.")).toBeVisible();

      await page.reload();

      const { data: decisoes } = await service
        .from("patient_curadoria_decisions")
        .select("id, outcome, chosen_option_id")
        .eq("curated_selection_id", f.curatedSelectionId);
      expect(decisoes ?? [], "exatamente uma decisão").toHaveLength(1);
      expect(decisoes![0]!.outcome).toBe("NONE_OF_THEM");
      expect(decisoes![0]!.chosen_option_id, "recusar não escolhe ninguém").toBeNull();

      const { data: trilha } = await service
        .from("audit_logs")
        .select("metadata")
        .eq("action", "patient_curadoria_decided")
        .eq("target_profile_id", f.patientProfileId);
      expect(
        (trilha ?? []).filter(
          (l) =>
            (l.metadata as Record<string, unknown>)?.curated_selection_id ===
            f.curatedSelectionId,
        ),
        "exatamente um evento de auditoria",
      ).toHaveLength(1);

      // A tela: o estado durável, a responsabilidade da Equipe, e NENHUMA
      // superfície de conexão — nem a legada, nem a canônica. Perguntar "com
      // quem?" a quem disse que nenhuma serviu seria incoerente e cruel.
      await expect(page.getByText(/nenhuma das três serviu/i)).toBeVisible();
      await expect(
        page.getByText(/a próxima etapa passa a ser acompanhada pela Equipe Aliviar/),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: "Seus três caminhos" })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Começar seu acompanhamento" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: "Com quem você gostaria de seguir?" }),
      ).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      await expect(page.getByText("Caminho escolhido:", { exact: false })).toHaveCount(0);

      const { data: conexoes } = await service
        .from("connection_records")
        .select("id")
        .eq("case_id", f.caseId);
      expect(conexoes ?? [], "recusar não cria conexão").toHaveLength(0);
    } finally {
      await cleanupFixture(f);
    }
  });

  test("acessibilidade do fluxo real — decidir e começar", async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });

    const f = await seedDeliveredCase();
    try {
      await entrar(page, f.patientEmail, f.patientPassword);
      await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

      const escolhido = f.professionalDisplayNames[0]!;
      await page.getByRole("radio", { name: escolhido }).check();

      const registrar = page.getByRole("button", { name: "Registrar minha decisão" });
      await registrar.click();

      // O anúncio: papel, polidez e FOCO. Sem foco, quem navega por leitor de
      // tela fica no botão que acabou de sumir e não ouve a confirmação.
      const status = page.getByRole("status");
      await expect(status).toBeVisible({ timeout: 60_000 });
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(status).toBeFocused();

      // Dupla submissão: o gesto não se repete depois de registrado.
      await expect(registrar).toHaveCount(0);

      await page.reload();

      // A decisão é compreensível SEM COR: o texto diz tudo.
      // V-B3-1 · teto explícito, pelo mesmo motivo das outras duas.
      await expect(page.getByText("Sua decisão está registrada.")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(`Você escolheu ${escolhido}.`)).toBeVisible();

      // Identidade canônica é TEXTO, não controle — e não há o que marcar.
      await expect(page.getByText(`Caminho escolhido: ${escolhido}`)).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(0);

      // O canal oficial, com nome acessível e destino legíveis.
      const whatsapp = page.getByRole("link", { name: "Falar com a Aliviar" });
      await expect(whatsapp).toBeVisible();
      expect(await whatsapp.getAttribute("href")).toContain("wa.me/5511979037133");

      // Alvos e rolagem, medidos em 390px.
      const medidas = await page.evaluate(() => {
        const d = document.documentElement;
        const abrir = [...document.querySelectorAll("main button")].find(
          (b) => b.textContent?.trim() === "Abrir meu acompanhamento",
        );
        const r = abrir?.getBoundingClientRect();
        return {
          overflow: d.scrollWidth - d.clientWidth,
          alturaCta: r ? Math.round(r.height) : null,
          larguraCta: r ? Math.round(r.width) : null,
        };
      });
      expect(medidas.overflow, "zero rolagem horizontal em 390px").toBeLessThanOrEqual(0);
      expect(medidas.alturaCta, "alvo mínimo de 44px").toBeGreaterThanOrEqual(44);

      // Ordem de tabulação: o CTA canônico é alcançável só pelo teclado, e o
      // que recebe foco é ele — não um contêiner sem nome.
      const abrirCta = page.getByRole("button", { name: "Abrir meu acompanhamento" });
      await abrirCta.focus();
      await expect(abrirCta).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: "O que acontece ao abrir seu acompanhamento" }),
      ).toBeVisible();
    } finally {
      await cleanupFixture(f);
    }
  });
});
