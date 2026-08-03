// =============================================================================
// RELEASE DE RECONSTRUÇÃO — ETAPA 10: o fluxo inteiro, com dados novos.
//
// Admin cria e publica profissionais reais (Catálogo 1.0.0) → cria a paciente
// → a paciente conta a história e envia documento → o caso nasce da história
// → o Curador acolhe (a história chega sozinha), consolida o Caso e abre a
// Mesa → a Rede Elegível aparece com totais e motivos → seleção dos três →
// Relatório → a paciente vê tudo.
//
// Nenhum registro de demonstração: todo dado nasce aqui, com timestamp.
// Asserts de comportamento (banco via UI, navegação, mensagens, contagens) —
// não só presença visual.
// =============================================================================
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error("test-users.local.json não encontrado. Execute `npm run bootstrap:test-users` antes.");
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

async function logout(page: Page) {
  await page.context().clearCookies();
}

/** Cria um profissional completo e publicado pela interface — nunca por SQL. */
async function criarProfissionalPublicado(
  page: Page,
  nome: string,
  identificador: string,
  area: { texto: string; tags: string },
): Promise<void> {
  await page.goto("/admin/profissionais/novo");
  await page.getByLabel("Nome de exibição").fill(nome);
  await page.getByLabel("Identificação profissional").fill(identificador);
  await page.getByRole("button", { name: "Criar profissional" }).click();
  await page.waitForURL(/\/admin\/profissionais\/[0-9a-f-]+$/);

  await page.getByLabel("CRM (quando aplicável)").fill(String(100000 + Math.floor(Math.random() * 899999)));
  await page.getByLabel("UF do CRM").selectOption("SP");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Salvo com sucesso.")).toBeVisible();

  await page.getByLabel("Situação verificada").selectOption("regular");
  await page.getByLabel("Fonte da verificação").fill("Portal do CFM (fluxo completo E2E)");
  await page.getByRole("button", { name: "Registrar verificação" }).click();
  await expect(page.getByText("Verificação registrada.")).toBeVisible();

  await page.getByLabel("Descrição (texto original, sempre preservado)").fill(area.texto);
  await page.getByLabel("Tags normalizadas (separadas por vírgula)").fill(area.tags);
  await page.getByLabel("Fonte", { exact: true }).fill("Site institucional (fluxo completo E2E)");
  await page.getByLabel("Marcar como verificada (exige fonte)").check();
  await page.getByRole("button", { name: "Salvar área de atuação" }).click();
  await expect(page.getByText("Área de atuação salva.")).toBeVisible();

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
}

test.describe("Release de Reconstrução — fluxo completo com dados novos", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(600_000);

  const stamp = Date.now();
  const pacienteEmail = `paciente.fluxo.${stamp}@aliviar-conexao.local`;
  const historiaDaPaciente =
    "Há dois anos convivo com dores na coluna que pioraram depois do meu segundo parto. " +
    "Já passei por dois ortopedistas, fiz fisioterapia por oito meses e uma ressonância recente. " +
    "Preciso de alguém que olhe o quadro inteiro antes de propor cirurgia.";
  let pacienteSenha = "";
  let caseUrl = "";

  test("1. build íntegro e backend local declarados em /api/build-info", async ({ page }) => {
    const resposta = await page.request.get("/api/build-info");
    expect(resposta.ok()).toBe(true);
    const info = await resposta.json();
    expect(info.ambiente).toBe("local");
    expect(info.backendHost).toBe("127.0.0.1:54321");
    expect(info.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(info.buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("2. admin cria e publica a rede nova (Catálogo 1.0.0 pela interface)", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin.email, admin.password);

    await criarProfissionalPublicado(page, `Dra. Coluna A ${stamp}`, `FLX-A-${stamp}`, {
      texto: "Ortopedia — cirurgia de coluna e dor crônica",
      tags: "ortopedia, coluna, dor_cronica",
    });
    await criarProfissionalPublicado(page, `Dr. Coluna B ${stamp}`, `FLX-B-${stamp}`, {
      texto: "Ortopedia — coluna, abordagem conservadora",
      tags: "ortopedia, coluna, conservador",
    });
    await criarProfissionalPublicado(page, `Dra. Coluna C ${stamp}`, `FLX-C-${stamp}`, {
      texto: "Ortopedia e reabilitação da coluna",
      tags: "ortopedia, coluna, reabilitacao",
    });
    await criarProfissionalPublicado(page, `Dr. Cardio D ${stamp}`, `FLX-D-${stamp}`, {
      texto: "Cardiologia clínica",
      tags: "cardiologia",
    });
    await criarProfissionalPublicado(page, `Dra. Derma E ${stamp}`, `FLX-E-${stamp}`, {
      texto: "Dermatologia geral",
      tags: "dermatologia",
    });
  });

  test("3. admin cria a paciente e recebe as credenciais uma única vez", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin.email, admin.password);

    await page.goto("/admin/pacientes/novo");
    await page.getByLabel("Nome do paciente").fill(`Paciente Fluxo ${stamp}`);
    await page.getByLabel("E-mail (será o login)").fill(pacienteEmail);
    await page.getByRole("button", { name: "Criar paciente e gerar senha" }).click();

    await expect(page.getByText("Credenciais de acesso")).toBeVisible();
    pacienteSenha = (await page.locator("dt:has-text('Senha') + dd").innerText()).trim();
    expect(pacienteSenha.length).toBeGreaterThan(10);
  });

  test("4. paciente conta a história, anexa documento e envia", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    // O card inicial diz a verdade: ainda não há história.
    await page.goto("/paciente");
    await expect(page.getByText("Você ainda não contou sua história.")).toBeVisible();

    // "Minha história" abre o wizard no passo atual — nunca a landing.
    await page.getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Minha história" })
      .click();
    await page.waitForURL(/\/sua-historia\//);

    // ETAPA 9: "Voltar", no primeiro passo, devolve ao painel — nunca à
    // landing nem a um laço para o próprio passo.
    await page.getByRole("link", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/paciente$/);
    await page.getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Minha história" })
      .click();
    await page.waitForURL(/\/sua-historia\//);

    await page.getByLabel("Para mim").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(new RegExp("/sua-historia/motivo$"));
    await page.getByLabel("Sua resposta").fill("Dores na coluna há dois anos, avaliando cirurgia.");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(new RegExp("/sua-historia/historia$"));
    await page.getByLabel("Sua resposta").fill(historiaDaPaciente);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(new RegExp("/sua-historia/informacoes$"));
    await page.getByLabel("Sua resposta").fill("Ressonância recente disponível.");

    // Upload na história: sucesso dito e lista atualizada sozinha.
    await page
      .getByLabel("Selecionar documento")
      .setInputFiles({ name: `ressonancia-${stamp}.txt`, mimeType: "text/plain", buffer: Buffer.from("laudo E2E") });
    await page.getByRole("button", { name: "Anexar" }).click();
    await expect(page.getByText("Documento anexado. Ele já aparece na lista abaixo.")).toBeVisible();
    await expect(page.getByText(`ressonancia-${stamp}.txt`)).toBeVisible();

    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(new RegExp("/sua-historia/preferencias$"));
    await page.getByLabel("Tanto faz").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL(new RegExp("/sua-historia/revisao$"));
    await page.getByRole("button", { name: "Enviar minha história" }).click();
    // O envio precisa ser CONFIRMADO — sem isto, uma falha silenciosa deixaria
    // a história em rascunho e o teste seguiria adiante achando que enviou.
    // getByRole, não getByText: o route announcer do Next (aria-live) ecoa o
    // título após navegação SPA e o texto solto resolve DOIS elementos.
    await expect(page.getByRole("heading", { name: "Recebemos sua história" })).toBeVisible({ timeout: 30_000 });

    // Depois de enviar, o dashboard mostra o resumo REAL da história.
    await page.goto("/paciente");
    await expect(page.getByText(/Há dois anos convivo com dores na coluna/)).toBeVisible();

    // Marco G — acesso após a conclusão NÃO reinicia: reabrir mostra a
    // história enviada, e nenhuma história nova nasce por navegar.
    await page.getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Minha história" })
      .click();
    await page.waitForURL(/\/sua-historia\//);
    await expect(page).not.toHaveURL(/\/sua-historia$/);
    await expect(
      page.getByRole("heading", { name: "Recebemos sua história" }),
      "voltar a Minha história depois de enviar começou uma história nova em branco",
    ).toBeVisible();
  });

  test("5. admin inicia o Caso e atribui o Curador", async ({ page }) => {
    const admin = loadTestAccounts().find((a) => a.role === "administrador")!;
    await loginAs(page, admin.email, admin.password);

    await page.goto("/admin/pacientes");
    // A lista pagina em 10 e a tabela é cliente: a busca resolve as duas
    // coisas de uma vez — filtra para a linha única da paciente desta rodada
    // (em qualquer página) e, por só responder depois da hidratação, garante
    // que o clique seguinte cai numa tabela viva, não numa em remontagem.
    await page.getByRole("searchbox", { name: "Buscar por nome ou e-mail" }).fill(pacienteEmail);
    const linha = page.getByRole("row", { name: new RegExp(pacienteEmail) });
    await expect(linha).toHaveCount(1);
    await linha.getByRole("link", { name: "Gerenciar" }).click();
    // A navegação é confirmada IMEDIATAMENTE — um clique que não navegou
    // falha aqui em segundos, com o snapshot do estado real, em vez de
    // esperar 10 minutos por um botão de outra página.
    await page.waitForURL(/\/admin\/pacientes\/[0-9a-f-]+$/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Iniciar caso" })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Iniciar caso" }).click();
    await page.waitForURL(/\/admin\/casos\/[0-9a-f-]+/);
    caseUrl = page.url();

    await page.getByLabel("Curador médico").selectOption({ label: "Curador Teste" });
    await page.getByRole("button", { name: /Atribuir|Reatribuir/ }).click();
    await expect(page.getByText(/Curador Teste/).first()).toBeVisible();
  });

  test("6. curador acolhe: a história chega sozinha; o Caso persiste ao reabrir", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador.email, curador.password);

    const caseId = caseUrl.match(/casos\/([0-9a-f-]+)/)![1];
    await page.goto(`/coa/curadoria/casos/${caseId}/acolhimento`);

    // ETAPA 8: a história aparece automaticamente, e o texto é o que ela salvou.
    await expect(page.getByText(/A história, nas palavras de/)).toBeVisible();
    await expect(page.getByText(/Há dois anos convivo com dores na coluna/).first()).toBeVisible();

    await page.getByLabel("Revisei o que já se sabe sobre o paciente").check();
    await page.getByLabel("Revisei os documentos disponíveis").check();
    await page.getByRole("button", { name: "Registrar revisão" }).click();

    // O registro da história nasce pré-preenchido com as palavras dela — sem redigitação.
    const historiaField = page.getByLabel("História organizada");
    await expect(historiaField).toHaveValue(/Há dois anos convivo com dores na coluna/);
    await page.getByLabel("Fiz a devolução e o paciente reconheceu a própria história").check();
    await page.getByRole("button", { name: "Registrar a história" }).click();
    // Persistência OBSERVADA, nunca presumida: o "✓" só aparece depois que o
    // servidor confirmou e re-renderizou.
    await expect(
      page.getByText("✓ O paciente reconheceu a própria história — registrado e permanente."),
    ).toBeVisible({ timeout: 30_000 });

    // Um único campo consolida o Caso Clínico.
    const casoTexto = `Dor lombar crônica pós-parto, ressonância recente disponível, avaliação cirúrgica em aberto. [${stamp}]`;
    await page.getByLabel("Contexto clínico relatado").fill(casoTexto);
    await page.getByRole("button", { name: "Registrar o contexto clínico" }).click();
    // O link para a Mesa só nasce quando o Caso está registrado no servidor.
    await expect(page.getByRole("link", { name: "Abrir a Mesa de Curadoria" })).toBeVisible({
      timeout: 30_000,
    });

    // Retomada: sair e voltar — o Caso permanece, a história permanece intocada.
    await page.reload();
    await expect(page.getByLabel("Contexto clínico relatado")).toHaveValue(casoTexto);
    await expect(page.getByText(/Há dois anos convivo com dores na coluna/).first()).toBeVisible();
  });

  test("7. curador abre o Perfil e preenche o Mapa de Prioridades (29 conceitos)", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador.email, curador.password);

    const caseId = caseUrl.match(/casos\/([0-9a-f-]+)/)![1];
    await page.goto(`/coa/curadoria/casos/${caseId}/curadoria_tecnica`);

    // O beco sem saída original: agora a Mesa oferece abrir o Perfil.
    await page.getByRole("button", { name: "Abrir o Perfil de Prioridades" }).click();
    await expect(page.getByText("Mapa de Prioridades").first()).toBeVisible();

    // Classifica os 29 — escala fechada, um clique por conceito (Catálogo 1.1.0, ADR-065).
    const relevantes = page.getByRole("radio", { name: "Relevante", exact: true });
    await expect(relevantes).toHaveCount(29, { timeout: 20_000 });
    for (let i = 0; i < 29; i += 1) {
      await relevantes.nth(i).check({ force: true });
      // Cada gravação é uma action — espera o "Salvando…" daquele item sumir.
      await expect(page.getByText("Salvando…")).toHaveCount(0, { timeout: 15_000 });
    }

    // ADR-065: o reconhecimento agora exige também o bloco relacional — toda
    // conversa do Protocolo da Pessoa registrada. O Curador registra pelo
    // MESMO caminho do produto (painel do Protocolo). O domínio recusa
    // registro sem opção ("silêncio não é dado") e tradução sem leitura
    // proposta — por isso cada conversa seleciona uma opção canônica (a
    // neutra, quando a pergunta a oferece) e declara o grau "Não tenho
    // preferência", que a matriz relacional lê como NAO_RELEVANTE.
    const badgeDeProgresso = page.getByText(/\d+ de 15 conversas registradas/);
    for (let volta = 0; volta < 16; volta += 1) {
      const registrar = page.getByRole("button", { name: "Registrar conversa" });
      if ((await registrar.count()) === 0) break;
      const registradas = Number.parseInt(await badgeDeProgresso.innerText(), 10);
      await registrar.first().click();

      // O painel aberto é o único lugar da página com "Fechar".
      const painel = page
        .locator("li")
        .filter({ has: page.getByRole("button", { name: "Fechar" }) })
        .last();

      // Tradução exige a leitura proposta — sem ela o domínio recusa.
      const leitura = painel.getByLabel("Leitura proposta");
      if ((await leitura.count()) > 0) {
        await leitura.fill(
          "Pelo que você me contou, entendi que este ponto não tem uma exigência específica. É isso?",
        );
      }

      // Uma opção canônica da pergunta. As opções vêm ANTES do fieldset do
      // grau no formulário; o grau nunca substitui a opção.
      const caixas = painel.getByRole("checkbox");
      const radios = painel.getByRole("radio");
      const grau = painel.getByRole("group", { name: "Quanto isso pesa, segundo ela" });
      if ((await caixas.count()) > 0) {
        const neutra = painel.getByRole("checkbox", { name: /Não tenho preferência|Não sei informar/ });
        await ((await neutra.count()) > 0 ? neutra.first() : caixas.first()).check({ force: true });
      } else if ((await radios.count()) > (await grau.getByRole("radio").count())) {
        const neutra = painel.getByRole("radio", { name: /^(Tanto faz|Não sei informar)$/ });
        await ((await neutra.count()) > 0 ? neutra.first() : radios.first()).check({ force: true });
      }

      // P14 (texto guiado) exige as palavras dela quando o campo existir.
      const palavras = painel.getByLabel("O que precisa ser respeitado (palavras dela)");
      if ((await palavras.count()) > 0) {
        await palavras.fill("Nada a registrar — ela disse que não há restrições.");
      }

      // O grau declarado por ela — dentro do fieldset do grau, nunca
      // confundido com a opção homônima de algumas perguntas.
      await grau.getByRole("radio", { name: "Não tenho preferência" }).check({ force: true });

      await painel.getByRole("button", { name: "Registrar", exact: true }).click();
      // Persistência OBSERVADA: o painel só fecha quando a action confirma.
      // Uma recusa do domínio o deixa aberto com o erro — e falha AQUI, em
      // segundos, com a mensagem no snapshot, nunca no timeout do teste.
      await expect(page.getByRole("button", { name: "Fechar" })).toHaveCount(0, { timeout: 20_000 });
      // E o refresh do servidor precisa TER CHEGADO antes da próxima volta —
      // sem isto, a lista obsoleta ainda oferece "Registrar conversa" para a
      // pergunta recém-registrada e o laço gasta voltas re-registrando-a.
      await expect(
        page.getByText(`${registradas + 1} de 15 conversas registradas`),
      ).toBeVisible({ timeout: 20_000 });
    }

    // O oráculo do gate relacional: todas as conversas registradas.
    await expect(page.getByText("15 de 15 conversas registradas")).toBeVisible({ timeout: 15_000 });
  });

  test("8. paciente reconhece o Perfil como seu", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);
    await page.goto("/paciente");

    // O Perfil abre por revelação progressiva: primeiro "Conhecer meu
    // Perfil", e só então o ato de reconhecer aparece — a confirmação nunca
    // fica a um clique impensado de distância.
    await page.getByRole("button", { name: "Conhecer meu Perfil" }).click();
    await page
      .getByRole("button", { name: "Confirmar que este Perfil representa minhas prioridades" })
      .click();
    await page.getByRole("button", { name: "Sim, confirmar" }).click();

    // O sinal observável no topo da casa: a pendência DESAPARECE quando o
    // refresh aplica o estado novo — sem reload manual.
    await expect(page.getByText(/Falta você reconhecer/)).toHaveCount(0, { timeout: 20_000 });

    // O refresh recolhe a seção; o registro do ato mora dentro dela.
    await page.getByRole("button", { name: "Conhecer meu Perfil" }).click();
    await expect(page.getByText(/Você reconheceu este Perfil/)).toBeVisible({ timeout: 15_000 });
  });

  test("9. Rede elegível: cinco encontrados, estados distintos, motivo por exclusão", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador.email, curador.password);
    const caseId = caseUrl.match(/casos\/([0-9a-f-]+)/)![1];
    await page.goto(`/coa/curadoria/casos/${caseId}/curadoria_tecnica`);

    // ETAPA 7 — a Rede enxerga os cinco publicados; os não publicados não entram.
    // A declaração de área mora na etapa REDE: "Avaliação técnica" mostra o
    // estado vazio enquanto eligible === 0 (curadoria_tecnica/page.tsx) — o
    // botão "Declarar área" nunca existiria lá antes das declarações.
    // Só o botão de ETAPA da Mesa COMEÇA com o rótulo ("Rede elegível,
    // aguarda…"); os itens do painel de atenção são "Resolver em Rede
    // elegível" — a âncora no início desfaz a ambiguidade de 112 elementos.
    await page.getByRole("button", { name: /^Rede elegível/ }).click();
    for (const nome of [`Dra. Coluna A ${stamp}`, `Dr. Coluna B ${stamp}`, `Dra. Coluna C ${stamp}`, `Dr. Cardio D ${stamp}`, `Dra. Derma E ${stamp}`]) {
      await expect(page.getByText(nome).first()).toBeVisible();
    }

    // Área de Atuação como porta: três compatíveis, um incompatível (com
    // motivo), um com informação insuficiente (pendente).
    async function declarar(nome: string, opcao: string, justificativa?: string) {
      // .last(): dos divs que contêm o nome E o botão, o último em ordem de
      // documento é o mais INTERNO — o cartão. .first() pegava o contêiner da
      // página inteira (a Rede real lista ~116 profissionais acumulados).
      const cartao = page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: nome }) })
        .filter({ has: page.getByRole("button", { name: "Declarar área" }) })
        .last();
      await cartao.getByRole("button", { name: "Declarar área" }).click();
      await page.getByRole("button", { name: opcao, exact: true }).click();
      if (justificativa) {
        await page.getByLabel(/Justificativa|O que falta verificar\?/).fill(justificativa);
      }
      await page.getByRole("button", { name: "Registrar declaração" }).click();
      await expect(page.getByRole("button", { name: "Registrar declaração" })).toHaveCount(0);
    }

    await declarar(`Dra. Coluna A ${stamp}`, "Compatível");
    await declarar(`Dr. Coluna B ${stamp}`, "Compatível");
    await declarar(`Dra. Coluna C ${stamp}`, "Compatível");
    await declarar(`Dr. Cardio D ${stamp}`, "Incompatível", "Cardiologia clínica não atende um caso cirúrgico de coluna.");
    await declarar(`Dra. Derma E ${stamp}`, "Informação insuficiente", "Confirmar se a prática dermatológica inclui dor crônica de coluna — improvável.");

    // O motivo de cada não-elegível fica dito na Mesa.
    await expect(page.getByText("Cardiologia clínica não atende um caso cirúrgico de coluna.")).toBeVisible();
  });

  test("10. seleção: substituição funciona, exatamente três encerra, persiste ao reabrir", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador.email, curador.password);
    const caseId = caseUrl.match(/casos\/([0-9a-f-]+)/)![1];
    await page.goto(`/coa/curadoria/casos/${caseId}/curadoria_tecnica`);

    // Âncora no início: o botão da etapa "Relatório" cita "Três caminhos" no texto de dependência.
    await page.getByRole("button", { name: /^Três caminhos/ }).click();

    const selecionar = page.getByRole("button", { name: "Selecionar", exact: true });
    await selecionar.first().click();
    await selecionar.first().click();

    // Com duas, encerrar não é possível: o botão NEM EXISTE — no lugar dele,
    // a lista de pendências diz o que falta, começando pela contagem.
    await expect(page.getByText("A Curadoria apresenta sempre exatamente três opções — hoje há 2.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Encerrar a Curadoria Técnica" })).toHaveCount(0);

    await selecionar.first().click();
    await expect(page.getByText("3 de 3 selecionados", { exact: false })).toBeVisible();

    // Substituição antes da conclusão: remove uma e devolve.
    await page.getByRole("button", { name: "Remover da seleção" }).first().click();
    await expect(page.getByText(/2 de 3 selecionados/)).toBeVisible();
    await page.getByRole("button", { name: "Selecionar", exact: true }).first().click();
    await expect(page.getByText(/3 de 3 selecionados/)).toBeVisible();

    // Pareceres: os três campos obrigatórios de cada uma das três opções.
    const porQue = page.getByLabel("Por que esta opção está na Curadoria");
    const prioridades = page.getByLabel("Quais prioridades atende melhor");
    const limitacoes = page.getByLabel("Quais limitações possui");
    await expect(porQue).toHaveCount(3);
    for (let i = 0; i < 3; i += 1) {
      await porQue.nth(i).fill("Prática regular em coluna, com área verificada contra fonte institucional.");
      await prioridades.nth(i).fill("Experiência no tipo de caso e continuidade do cuidado, declaradas como relevantes.");
      await limitacoes.nth(i).fill("Agenda e custo ainda não confirmados com a clínica — verificar antes da consulta.");
    }
    // A justificativa da composição mora no cartão "Por que estas três,
    // juntas" — o textarea não tem rótulo próprio, e `.last()` da página
    // apontava para outro campo (a seção de perguntas vem depois dele).
    const cartaoComposicao = page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: "Por que estas três, juntas" }) })
      .filter({ has: page.locator("textarea") })
      .last();
    await cartaoComposicao.locator("textarea").first().fill(
      "Três caminhos de coluna com abordagens distintas: cirúrgica, conservadora e reabilitadora — a troca entre eles é legível para a paciente.",
    );

    // O botão real é "Encerrar e gerar o Relatório" — "Encerrar a Curadoria
    // Técnica" é o TÍTULO da seção (vira "Curadoria Técnica encerrada" depois).
    await page.getByRole("button", { name: "Encerrar e gerar o Relatório" }).click();
    await expect(page.getByRole("heading", { name: "Curadoria Técnica encerrada" })).toBeVisible({ timeout: 20_000 });

    // Persistência: reabrir mantém a seleção encerrada.
    await page.reload();
    // Âncora no início: o botão da etapa "Relatório" cita "Três caminhos" no texto de dependência.
    await page.getByRole("button", { name: /^Três caminhos/ }).click();
    await expect(page.getByRole("heading", { name: "Curadoria Técnica encerrada" })).toBeVisible();
  });

  test("11. Relatório: recusa bastidor (B-1 e B-2); resolvido, emite e entrega", async ({ page }) => {
    const curador = loadTestAccounts().find((a) => a.role === "curador_medico")!;
    await loginAs(page, curador.email, curador.password);
    const caseId = caseUrl.match(/casos\/([0-9a-f-]+)/)![1];
    await page.goto(`/coa/curadoria/casos/${caseId}/relatorio`);

    // O Relatório nasceu na Mesa (dos pareceres) e por isso está marcado como
    // revisado; a seção relacional só nasce no RASCUNHO ASSISTIDO, cuja
    // regeneração sobre texto humano exige o ato explícito — nunca silenciosa.
    await page.getByRole("button", { name: "Gerar rascunho assistido" }).click();
    await expect(page.getByText(/Regenerar substituiria o texto/)).toBeVisible({ timeout: 20_000 });
    await page
      .getByRole("button", { name: "Regenerar mesmo assim, descartando minhas edições" })
      .click();
    // RELEASE GATE 2: o editor remonta pela key (assisted_generated_at) e a
    // tela passa a exibir o rascunho recém-gerado SEM reload — a asserção
    // seguinte, lida direto da textarea, é a prova viva da sincronização.
    // (O aviso transitório morre na remontagem — o estado permanente fica no
    // cabeçalho "Rascunho assistido:", que é o que se afirma aqui.)
    await expect(page.getByText(/Rascunho assistido: o texto abaixo foi montado/)).toBeVisible({
      timeout: 20_000,
    });

    // B-2 (ADR-064): regenerar substituiu a abertura que o Curador escreveu na
    // Mesa pelo texto de trabalho do gerador — o caminho exato pelo qual o
    // bastidor chegava à paciente. A emissão RECUSA primeiro por isso.
    const composicao = page.getByLabel("Justificativa da composição");
    await expect(composicao).toHaveValue(/Revisão do Curador pendente/);
    await page.getByRole("button", { name: "Emitir o Relatório" }).click();
    await expect(page.getByText(/a abertura ainda é o texto do rascunho assistido/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Relatório emitido — pronto para entregar")).toBeHidden();

    // A frase do Curador no lugar do bastidor.
    await composicao.fill(
      "Três caminhos de coluna com abordagens distintas: cirúrgica, conservadora e reabilitadora — a troca entre eles é legível para você.",
    );

    // B-1 (ADR-064/065): resolvida a abertura, a emissão passa a recusar pelo
    // que ainda falta — a frase-sentinela dos conceitos de juízo humano
    // (P11/P14/P17), nomeando o que depende do Curador.
    const relacional = page.getByLabel("Como conversa com a forma como ela quer ser cuidada");
    await expect(relacional).toHaveCount(3);
    await expect(relacional.first()).toHaveValue(/aguarda a conversa com o Curador/);
    await page.getByRole("button", { name: "Emitir o Relatório" }).click();
    await expect(page.getByText(/ainda aguarda a sua avaliação/)).toBeVisible({ timeout: 20_000 });

    // Substituir cada linha-sentinela pela leitura do Curador É a validação
    // (report-editor, ADR-065) — feita nas três opções, pela interface.
    for (let i = 0; i < 3; i += 1) {
      const campo = relacional.nth(i);
      const texto = await campo.inputValue();
      const proprio = texto
        .split("\n")
        .map((linha) => {
          const pendente = linha.match(/^Sobre (.+): esta leitura aguarda a conversa com o Curador\.\s*$/);
          return pendente
            ? `Sobre ${pendente[1]}: conversamos — sem preferência declarada, e nada na prática declarada conflita com o que ela pediu.`
            : linha;
        })
        .join("\n");
      await campo.fill(proprio);
    }

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText(/Relatório salvo/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Emitir o Relatório" }).click();
    await expect(page.getByText("Relatório emitido — pronto para entregar")).toBeVisible({ timeout: 20_000 });
    // Entrega em DUAS etapas: o primeiro clique abre a confirmação ("Depois
    // disso o documento não muda mais. Confirma?"); o segundo, nomeando a
    // paciente, entrega de fato.
    await page.getByRole("button", { name: "Entregar a Curadoria", exact: true }).click();
    await page.getByRole("button", { name: /^Entregar a Curadoria a / }).click();
    await expect(page.getByText(/entregue|Entregue/).first()).toBeVisible({ timeout: 20_000 });
  });

  test("12. paciente vê o resultado: relatório, três profissionais, sem ranking", async ({ page }) => {
    await loginAs(page, pacienteEmail, pacienteSenha);

    // Card inicial: dados reais — resumo, documentos, relatório pronto.
    await page.goto("/paciente");
    await expect(page.getByText(/Há dois anos convivo com dores na coluna/)).toBeVisible();
    await expect(page.getByText(/1 documento\(s\) enviado\(s\)/)).toBeVisible();
    await expect(page.getByText("Pronto para você.")).toBeVisible();

    await page.goto("/paciente/curadoria");
    for (const nome of [`Dra. Coluna A ${stamp}`, `Dr. Coluna B ${stamp}`, `Dra. Coluna C ${stamp}`]) {
      await expect(page.getByText(nome).first()).toBeVisible();
    }
    // Fronteira de vocabulário: nunca score, ranking ou soma de pontos.
    const corpo = await page.locator("main").innerText();
    expect(corpo).not.toMatch(/200 pontos|ranking|score/i);
    // B-1/B-2 (ADR-064): e nenhum texto de bastidor — o documento definitivo
    // não fala com o Curador nem promete conversa que não virá.
    expect(corpo).not.toMatch(
      /Rascunho assistido|Revisão do Curador pendente|aguarda a conversa com o Curador/i,
    );
    // E nenhum profissional fora dos três selecionados.
    expect(corpo).not.toContain(`Dr. Cardio D ${stamp}`);
    expect(corpo).not.toContain(`Dra. Derma E ${stamp}`);
  });
});
