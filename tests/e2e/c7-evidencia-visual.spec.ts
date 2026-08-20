import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { createClient } from "@supabase/supabase-js";

import { CONTAINER_PADRAO, argumentosPsql, containerDoBanco } from "../apoio/stack-local";
import { semearCicloE2E } from "../apoio/seed-ciclo-e2e";

/**
 * PULA, NÃO FALHA, quando a stack isolada não está configurada.
 *
 * O seed destes cenários escreve oito profissionais sintéticos direto por
 * `psql` e é proibido de tocar a stack compartilhada — a trava dentro de
 * `semearCicloE2E` continua valendo e NÃO foi afrouxada aqui. O que muda é o
 * que acontece quando a condição não existe: antes, as 21 combinações
 * **falhavam**, e a suíte passava a mentir sobre si mesma — seis vermelhos
 * permanentes que não eram defeito nenhum, misturados aos defeitos de verdade.
 *
 * Falta de ambiente não é falha de produto. Pular diz a verdade; falhar não.
 */
const STACK_ISOLADA = containerDoBanco() !== CONTAINER_PADRAO;

/**
 * C7R · MATRIZ VISUAL 7×3 — sete cenários, três viewports, 21 combinações.
 *
 * Cada combinação é um teste independente: cenários que mudam estado re-armam
 * a própria semente ANTES de agir, então a ordem dos viewports não importa.
 * Cada captura registra arquivo, rota, sessão, estado inicial, ação, resultado,
 * innerWidth, scrollWidth, prova no banco e console — tudo num manifesto.
 */

const VIEWPORTS = [
  { nome: "1440", width: 1440, height: 900 },
  { nome: "768", width: 768, height: 1024 },
  { nome: "390", width: 390, height: 844 },
] as const;

const DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "evidencias",
  "c7r",
  "capturas",
);
const manifesto: Record<string, unknown>[] = [];

let seed: Awaited<ReturnType<typeof semearCicloE2E>>;
// Tipagem leve: o spec só precisa de rpc/from, e o genérico do supabase-js
// sem tipos gerados degrada para never.
type ClienteLeve = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
  from: (t: string) => {
    select: (c: string) => {
      eq: (
        k: string,
        v: string,
      ) => { single: () => Promise<{ data: unknown }> };
    };
  };
};
let service: ClienteLeve;
let adminEmail = "";

test.skip(
  !STACK_ISOLADA,
  "Exige stack isolada: defina SUPABASE_DB_CONTAINER. O seed destes cenários nunca toca a stack compartilhada.",
);

test.beforeAll(async () => {
  if (!STACK_ISOLADA) return;
  mkdirSync(DIR, { recursive: true });
  seed = await semearCicloE2E();
  service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { db: { schema: "curadoria" } },
  ) as unknown as ClienteLeve;
});

function psql(sql: string): string {
  const argumentos = argumentosPsql("");
  const semComando = argumentos.slice(0, argumentos.indexOf("-c"));
  semComando.splice(1, 0, "-i");
  semComando.push("-v", "ON_ERROR_STOP=1");
  return execFileSync("docker", semComando, {
    encoding: "utf8",
    input: sql,
  }).trim();
}

/** Re-arme: garante PUBLICADO_ATIVO pela porta da frente (idempotente). */
async function rearmarPublicado(sufixo: string) {
  await service.rpc("transicionar_ciclo_como_servico", {
    p_profissional: seed.ids[sufixo],
    p_para: "PUBLICADO_ATIVO",
    p_motivo: "CADASTRO_VALIDADO",
    p_ator: seed.adminId,
  });
}

/** Re-arme do legado: volta 07 a NULL pelo mesmo rito da ressincronização. */
function rearmarLegadoNulo() {
  psql(
    `begin;
     alter table curadoria.professional_profiles disable trigger assert_ciclo_do_profissional;
     alter table curadoria.professional_profiles disable trigger registrar_trilha_do_ciclo;
     update curadoria.professional_profiles
        set ciclo_de_vida=null, ciclo_motivo=null, ciclo_alterado_por=null, ciclo_alterado_em=null
      where professional_identifier='EV-C7-07';
     alter table curadoria.professional_profiles enable trigger assert_ciclo_do_profissional;
     alter table curadoria.professional_profiles enable trigger registrar_trilha_do_ciclo;
     commit;`,
  );
}

async function estadoNoBanco(sufixo: string): Promise<string> {
  const { data } = await service

    .from("professional_profiles")
    .select("ciclo_de_vida, status, publication_status")
    .eq("id", seed.ids[sufixo])
    .single();
  const l = data as unknown as {
    ciclo_de_vida: string | null;
    status: string;
    publication_status: string;
  };
  return `${l.ciclo_de_vida ?? "NULO"} · ${l.status}/${l.publication_status}`;
}

async function entrar(page: Page, erros: string[]) {
  const contas = JSON.parse(
    readFileSync(
      path.resolve(__dirname, "..", "..", "test-users.local.json"),
      "utf8",
    ),
  ) as Array<{ role: string; email: string; password: string }>;
  const admin = contas.find((c) => c.role === "administrador")!;
  adminEmail = admin.email;
  page.on("pageerror", (e) => erros.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(m.text());
  });
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("E-mail").fill(admin.email);
  await page.getByLabel("Senha").fill(admin.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/admin/, { timeout: 60000 });
}

function consoleDoProduto(erros: string[]): string[] {
  return erros.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("net::ERR_ABORTED") &&
      // next start local não tem o script de analytics da Vercel: ruído.
      !e.includes("_vercel/insights") &&
      !e.includes("404 (Not Found)"),
  );
}

async function capturar(
  page: Page,
  sobre: {
    arquivo: string;
    cenario: string;
    viewport: (typeof VIEWPORTS)[number];
    rota: string;
    estadoInicial: string;
    acao: string;
    resultado: string;
    bancoDepois: string;
    erros: string[];
  },
) {
  const m = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(m.innerWidth, `${sobre.arquivo}: innerWidth`).toBe(
    sobre.viewport.width,
  );
  if (sobre.viewport.width === 390) {
    expect(m.scrollWidth, `${sobre.arquivo}: excesso horizontal`).toBe(390);
  }
  const proibidos = consoleDoProduto(sobre.erros);
  expect(proibidos, `${sobre.arquivo}: console do produto`).toEqual([]);
  await page.screenshot({
    path: path.join(DIR, sobre.arquivo),
    fullPage: true,
  });
  manifesto.push({
    arquivo: sobre.arquivo,
    cenario: sobre.cenario,
    viewport: sobre.viewport.nome,
    innerWidth: m.innerWidth,
    scrollWidth: m.scrollWidth,
    rota: sobre.rota,
    sessao: `${adminEmail} (administrador)`,
    estadoInicial: sobre.estadoInicial,
    acao: sobre.acao,
    resultado: sobre.resultado,
    bancoDepois: sobre.bancoDepois,
    consoleSemErroDoProduto: true,
    quando: new Date().toISOString(),
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`matriz ${viewport.nome}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`EV-1 painel do ciclo · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      await rearmarPublicado("01");
      const antes = await estadoNoBanco("01");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["01"]}?etapa=rede`;
      await page.goto(rota);
      await expect(
        page.getByRole("heading", { name: "Ciclo de vida" }),
      ).toBeVisible();
      await expect(page.getByText("Algo deu errado")).toHaveCount(0);
      await capturar(page, {
        arquivo: `ev1-painel-${viewport.nome}.png`,
        cenario: "EV-1 painel do ciclo aberto (a rota que caía)",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "abrir o detalhe",
        resultado: "painel visível, sem error boundary",
        bancoDepois: await estadoNoBanco("01"),
        erros,
      });
    });

    test(`EV-2 motivos por destino · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      await rearmarPublicado("02");
      const antes = await estadoNoBanco("02");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["02"]}?etapa=rede`;
      await page.goto(rota);
      const destino = page.getByLabel("Mudar para");
      await destino.selectOption("PAUSADO");
      const pausa = await page
        .getByLabel("Motivo")
        .locator("option")
        .allTextContents();
      await destino.selectOption("RETIRADO_ARQUIVADO");
      const retirada = await page
        .getByLabel("Motivo")
        .locator("option")
        .allTextContents();
      expect(pausa).not.toEqual(retirada);
      expect(retirada.join("|")).toContain("Encerramento da atuação");
      await capturar(page, {
        arquivo: `ev2-motivos-${viewport.nome}.png`,
        cenario: "EV-2 motivos por destino (listas diferentes)",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "escolher PAUSADO e depois RETIRADO_ARQUIVADO",
        resultado: "listas distintas, iguais a motivos_da_transicao",
        bancoDepois: await estadoNoBanco("02"),
        erros,
      });
    });

    test(`EV-3 prévia de impacto · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      await rearmarPublicado("03");
      const antes = await estadoNoBanco("03");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["03"]}`;
      await page.goto(rota);
      await page.getByLabel("Mudar para").selectOption("RETIRADO_ARQUIVADO");
      await expect(page.getByText("O que muda")).toBeVisible();
      await expect(page.getByText(/Relatórios já emitidos/)).toBeVisible();
      await capturar(page, {
        arquivo: `ev3-previa-${viewport.nome}.png`,
        cenario: "EV-3 prévia de impacto antes da confirmação",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "escolher destino RETIRADO_ARQUIVADO",
        resultado: "consequências e 'o que permanece' visíveis",
        bancoDepois: await estadoNoBanco("03"),
        erros,
      });
    });

    test(`EV-4 confirmação deliberada · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      await rearmarPublicado("04");
      const antes = await estadoNoBanco("04");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["04"]}`;
      await page.goto(rota);
      await page.getByLabel("Mudar para").selectOption("PAUSADO");
      await page.getByLabel("Motivo").selectOption("REVISAO_CADASTRAL");
      await page
        .getByRole("checkbox", { name: /Confirmo esta mudança/ })
        .check();
      await page.getByRole("button", { name: "Aplicar mudança" }).click();
      await expect(
        page.getByText("Estado do profissional atualizado."),
      ).toBeVisible({ timeout: 20000 });
      const depois = await estadoNoBanco("04");
      expect(depois).toContain("PAUSADO · inativo/nao_publicado");
      await capturar(page, {
        arquivo: `ev4-confirmacao-${viewport.nome}.png`,
        cenario: "EV-4 confirmação deliberada (pausa com espelho e trilha)",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "PAUSADO + motivo + confirmar + aplicar",
        resultado: "sucesso na tela; espelho inativo/nao_publicado",
        bancoDepois: depois,
        erros,
      });
    });

    test(`EV-5 publicação bloqueada · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      const antes = await estadoNoBanco("05");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["05"]}?etapa=publicacao`;
      await page.goto(rota);
      await expect(
        page.getByRole("button", { name: /^Publicar$/ }),
      ).toBeDisabled();
      await expect(page.getByText(/Pendências para publicação/)).toBeVisible();
      await capturar(page, {
        arquivo: `ev5-publicacao-bloqueada-${viewport.nome}.png`,
        cenario: "EV-5 publicação bloqueada com pendências nomeadas",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "abrir a seção Publicação",
        resultado: "botão disabled real + pendências listadas",
        bancoDepois: await estadoNoBanco("05"),
        erros,
      });
    });

    test(`EV-6 despublicação · ${viewport.nome}`, async ({ page }) => {
      const erros: string[] = [];
      await rearmarPublicado("06");
      const antes = await estadoNoBanco("06");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["06"]}?etapa=publicacao`;
      await page.goto(rota);
      await page.getByRole("button", { name: "Despublicar" }).click();
      await expect(
        page.getByRole("button", { name: /^Publicar$/ }),
      ).toBeVisible();
      const depois = await estadoNoBanco("06");
      expect(depois).toContain("PAUSADO");
      await capturar(page, {
        arquivo: `ev6-despublicacao-${viewport.nome}.png`,
        cenario: "EV-6 despublicar leva a PAUSADO, espelho coerente",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "clicar Despublicar",
        resultado: "volta o botão Publicar; ciclo PAUSADO",
        bancoDepois: depois,
        erros,
      });
    });

    test(`EV-7 classificação de legado · ${viewport.nome}`, async ({
      page,
    }) => {
      const erros: string[] = [];
      rearmarLegadoNulo();
      const antes = await estadoNoBanco("07");
      expect(antes).toContain("NULO");
      await entrar(page, erros);
      const rota = `/admin/profissionais/${seed.ids["07"]}`;
      await page.goto(rota);

      // (a) recusa sem justificativa: o botão nem é oferecido habilitado.
      await page
        .getByLabel("Estado atual deste cadastro")
        .selectOption("PREPARACAO");
      const botao = page.getByRole("button", {
        name: "Classificar cadastro legado",
      });
      await expect(botao).toBeDisabled();
      await capturar(page, {
        arquivo: `ev7a-legado-recusa-${viewport.nome}.png`,
        cenario: "EV-7a legado NULL: sem justificativa, o ato não é oferecido",
        viewport,
        rota,
        estadoInicial: antes,
        acao: "escolher estado sem escrever justificativa",
        resultado: "botão desabilitado",
        bancoDepois: await estadoNoBanco("07"),
        erros,
      });

      // (b) aceite com justificativa.
      await page
        .getByLabel(/Justificativa da classificação/)
        .fill("revisão documental do cadastro legado");
      await botao.click();
      await expect(page.getByText("Cadastro legado classificado.")).toBeVisible(
        { timeout: 20000 },
      );
      const depois = await estadoNoBanco("07");
      expect(depois).toContain("PREPARACAO");
      await capturar(page, {
        arquivo: `ev7b-legado-aceite-${viewport.nome}.png`,
        cenario: "EV-7b legado classificado com justificativa e trilha própria",
        viewport,
        rota,
        estadoInicial: "NULO",
        acao: "justificativa válida + classificar",
        resultado: "sucesso na tela; ciclo PREPARACAO",
        bancoDepois: depois,
        erros,
      });

      // (c) recusa de reclassificação: recarregada, a superfície de legado
      // sumiu — quem já tem ciclo usa a matriz, e o banco recusa o atalho.
      await page.reload();
      await expect(page.getByText(/Estado atual/)).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Classificar cadastro legado" }),
      ).toHaveCount(0);
      await capturar(page, {
        arquivo: `ev7c-legado-reclassificacao-${viewport.nome}.png`,
        cenario: "EV-7c reclassificação não é oferecida a quem já tem ciclo",
        viewport,
        rota,
        estadoInicial: depois,
        acao: "recarregar a página",
        resultado: "superfície de classificação ausente; painel normal",
        bancoDepois: await estadoNoBanco("07"),
        erros,
      });
    });
  });
}

test.afterAll(() => {
  const md = [
    "# Manifesto 7×3 — evidência visual do Corte 7",
    "",
    "| arquivo | cenário | viewport | innerWidth | scrollWidth | rota | banco depois |",
    "|---|---|---|---|---|---|---|",
    ...manifesto.map(
      (m) =>
        `| ${m.arquivo} | ${m.cenario} | ${m.viewport} | ${m.innerWidth} | ${m.scrollWidth} | ${m.rota} | ${m.bancoDepois} |`,
    ),
  ].join("\n");
  writeFileSync(path.join(DIR, "MANIFESTO.md"), md, "utf8");
  writeFileSync(
    path.join(DIR, "manifesto.json"),
    JSON.stringify(manifesto, null, 2),
    "utf8",
  );
  expect(manifesto.length, "combinações capturadas").toBeGreaterThanOrEqual(21);
});
