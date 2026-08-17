import { expect, test, type Page } from "@playwright/test";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { seedDeliveredCase, type DeliveredFixture } from "../apoio/apoio-curadoria-entregue";

/**
 * F-4 · A FORMAÇÃO NA CARTA DA PACIENTE — conteúdo, não só presença.
 *
 * O E2E anterior media a seção ADMINISTRATIVA e provava duas coisas: que a
 * seção existe e que o viewport não estica. Nada disso diz o que a paciente lê.
 * Aqui a superfície medida é a dela, com Curadoria ENTREGUE e formação
 * verificada representativa: uma entrada COMPLETA (instituição, cidade, país e
 * período) e uma com AUSÊNCIAS (sem instituição, sem local, sem período).
 *
 * O oráculo cobre o contrato inteiro: categoria e título, instituição integral,
 * local e período quando existem, omissão elegante quando não existem, UM selo,
 * zero vocabulário proibido, legibilidade sem corte nem sobreposição, zero
 * overflow — e a formação NÃO verificada ausente da tela.
 *
 *   node scripts/with-local-supabase.mjs \
 *     npx playwright test tests/e2e/formacao-academica-paciente.spec.ts --workers=1
 */

/**
 * Os três tamanhos do contrato. A emulação móvel (`isMobile`/`hasTouch`) fica
 * num teste PRÓPRIO, e não no de conteúdo, por uma razão medida: sob emulação
 * de toque o gesto sintético do harness não consegue abrir a carta (o handler
 * de React não recebe o evento), e a carta fechada não renderiza o detalhe.
 * Forçar a abertura ali seria maquiar o harness. Então cada teste prova o que
 * sabe provar: conteúdo e layout nos três tamanhos reais, e integridade de
 * viewport — a lição da MESA-390 — sob emulação móvel em 390.
 */
const VIEWPORTS = [
  { nome: "390x844", width: 390, height: 844 },
  { nome: "768x1024", width: 768, height: 1024 },
  { nome: "1440x900", width: 1440, height: 900 },
];

const COMPLETA = {
  kind: "residencia" as const,
  title: "Residência em Clínica Médica",
  institution: "Hospital Sintético das Clínicas",
  city: "Belo Horizonte",
  country: "Brasil",
  period_start: 2010,
  period_end: 2013,
};

const SEM_LOCAL = {
  kind: "fellowship" as const,
  title: "Fellowship em Doenças Autoimunes",
  institution: null as string | null,
  city: null as string | null,
  country: null as string | null,
  period_start: null as number | null,
  period_end: null as number | null,
};

const NAO_VERIFICADA = {
  kind: "especializacao" as const,
  title: "Especialização que a equipe AINDA NAO confirmou",
  institution: "Instituto Sintético Não Confirmado",
};

let fx: DeliveredFixture;

test.beforeAll(async () => {
  const admin = createAdminSupabaseClient();
  fx = await seedDeliveredCase();
  const profissional = fx.selectedProfessionals[0]!.id;

  const verificadas = [COMPLETA, SEM_LOCAL].map((e) => ({
    professional_profile_id: profissional,
    ...e,
    source: "registro_manual",
    verification_status: "verificado",
    verified_at: new Date().toISOString(),
    verified_by: fx.adminUserId,
  }));

  const { error } = await admin.from("professional_education_entries").insert([
    ...verificadas,
    {
      professional_profile_id: profissional,
      ...NAO_VERIFICADA,
      city: null,
      country: null,
      period_start: null,
      period_end: null,
      source: "registro_manual",
      verification_status: "nao_verificado",
    },
  ]);
  if (error) throw new Error(`seed da formação falhou: ${error.message}`);
});

async function entrarComoPaciente(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(fx.patientEmail);
  await page.getByLabel("Senha").fill(fx.patientPassword);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test.describe("F-4 · a formação como a paciente lê, em 390/768/1440", () => {
  test.describe.configure({ mode: "serial" });

  for (const vp of VIEWPORTS) {
    test(`conteúdo, selo, omissões e layout em ${vp.nome}`, async ({ browser }) => {
      const contexto = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await contexto.newPage();

      try {
        await entrarComoPaciente(page);
        await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });

        // A região da formação — nomeada para tecnologia assistiva.
        const bloco = page.getByRole("region", { name: "Formação acadêmica" }).first();

        // Em telas estreitas a carta nasce fechada e a leitura é sob demanda;
        // em telas largas ela já vem aberta. Abrir é o gesto real da paciente —
        // e só é feito quando a carta está de fato fechada, sem inventar
        // interação onde o produto não a pede.
        //
        // A segunda tentativa é guarda de HIDRATAÇÃO, não maquiagem: o botão
        // fica clicável antes de o React prender o handler, e o primeiro clique
        // pode cair no vazio. Se ainda assim a região não vier, o teste falha.
        // `aria-expanded` é o sinal do próprio produto de que o handler rodou —
        // esperar por ele elimina a corrida de hidratação sem inventar espera
        // arbitrária. Se a carta não abrir, o teste falha.
        // A carta nasce fechada e só o detalhe aberto traz a formação — abrir é
        // o gesto real da paciente. `aria-expanded`/"Recolher" é o sinal do
        // próprio produto de que ela abriu; sem isso, o teste falha.
        const abrir = page.getByRole("button", { name: "Conhecer este caminho" }).first();
        await expect(abrir).toBeVisible({ timeout: 30_000 });
        await abrir.click();
        await expect(page.getByRole("button", { name: "Recolher" }).first()).toBeVisible({
          timeout: 15_000,
        });

        await expect(bloco).toBeVisible({ timeout: 20_000 });
        await expect(bloco.getByRole("heading", { name: "Formação" })).toBeVisible();

        // 1 · categoria e título da entrada completa
        await expect(bloco.getByText("Residência", { exact: false }).first()).toBeVisible();
        await expect(bloco.getByText(COMPLETA.title, { exact: false }).first()).toBeVisible();

        // 2 · instituição pelo nome INTEGRAL, não truncada no DOM
        await expect(bloco.getByText(COMPLETA.institution, { exact: false }).first()).toBeVisible();

        // 3 · cidade, país e período quando presentes
        const textoDoBloco = (await bloco.first().textContent()) ?? "";
        expect(textoDoBloco).toContain("Belo Horizonte");
        expect(textoDoBloco).toContain("Brasil");
        expect(textoDoBloco).toMatch(/2010\s*[–-]\s*2013/);

        // 4 · a entrada SEM local/período aparece sem inventar nada
        expect(textoDoBloco).toContain(SEM_LOCAL.title);

        // 5 · exatamente UM selo
        expect(
          await bloco.getByText("Formação verificada pela equipe").count(),
          "o selo é binário — um por bloco",
        ).toBe(1);

        // 6 · vocabulário proibido em nenhuma hipótese
        for (const proibido of [
          "não informado",
          "Não informado",
          "fonte",
          "Fonte",
          "documento",
          "Documento",
          "http",
          "método",
          "Método",
          "autodeclarad",
          "extração",
          "PDF",
        ]) {
          expect(textoDoBloco, `vocabulário proibido na carta: ${proibido}`).not.toContain(proibido);
        }

        // 7 · formação NÃO verificada não existe para a paciente
        expect(
          (await page.content()).includes(NAO_VERIFICADA.title),
          "formação não confirmada chegou à paciente",
        ).toBe(false);
        expect(await page.getByText(NAO_VERIFICADA.institution).count()).toBe(0);

        // 8 · legibilidade: nenhum texto do bloco cortado, nenhum par sobreposto
        const layout = await bloco.evaluate((raiz) => {
          const textos = Array.from(raiz.querySelectorAll("p, span, h4")).filter(
            (el) => (el.textContent || "").trim().length > 0 && el.children.length === 0,
          );
          const cortados = textos
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => (el.textContent || "").slice(0, 40));
          const caixas = textos.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              top: r.top,
              bottom: r.bottom,
              left: r.left,
              right: r.right,
              txt: (el.textContent || "").slice(0, 24),
            };
          });
          const sobrepostos: string[] = [];
          for (let i = 0; i < caixas.length; i += 1) {
            for (let j = i + 1; j < caixas.length; j += 1) {
              const a = caixas[i]!;
              const b = caixas[j]!;
              const cruzaV = a.top < b.bottom - 1 && b.top < a.bottom - 1;
              const cruzaH = a.left < b.right - 1 && b.left < a.right - 1;
              if (cruzaV && cruzaH) sobrepostos.push(`${a.txt} × ${b.txt}`);
            }
          }
          return { cortados, sobrepostos, quantidade: textos.length };
        });
        expect(layout.quantidade, "bloco vazio — o teste passaria por vacuidade").toBeGreaterThan(3);
        expect(layout.cortados, `texto cortado em ${vp.nome}`).toEqual([]);
        expect(layout.sobrepostos, `texto sobreposto em ${vp.nome}`).toEqual([]);

        // 9 · sem overflow horizontal em nenhum dos três tamanhos
        const m = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }));
        expect(m.innerWidth).toBe(vp.width);
        expect(m.docScrollWidth, `documento estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
        expect(m.bodyScrollWidth, `body estoura em ${vp.nome}`).toBeLessThanOrEqual(vp.width);
      } finally {
        await contexto.close();
      }
    });
  }

  /**
   * A lição da MESA-390, agora na rota da paciente: sob emulação móvel real, o
   * viewport de layout não pode esticar. Este teste não interage com a carta —
   * mede a página como o Chrome móvel a entrega.
   */
  test("em 390 com emulação móvel, o viewport de layout permanece íntegro", async ({ browser }) => {
    const contexto = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    const page = await contexto.newPage();
    try {
      await entrarComoPaciente(page);
      await page.goto("/paciente/curadoria", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Seus três caminhos" })).toBeVisible({
        timeout: 30_000,
      });

      const m = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        docScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));
      expect(m.innerWidth, "viewport de layout esticado em 390").toBe(390);
      expect(m.innerHeight, "viewport de layout esticado em 390").toBe(844);
      expect(m.docScrollWidth).toBeLessThanOrEqual(390);
      expect(m.bodyScrollWidth).toBeLessThanOrEqual(390);
    } finally {
      await contexto.close();
    }
  });
});
