import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * T-A-1 · AS QUATRO SUPERFÍCIES PÚBLICAS LEVAM À MESMA PORTA.
 *
 * Antes existiam dois convites concorrentes — `Começar` e `Começar minha
 * história` — e os dois levavam a `/sua-historia`, que **exige conta**. Quem
 * chegava sem conta batia numa porta trancada e ia embora. O CTA agora é um só,
 * e o destino também.
 *
 * T-A-14 · a régua é o **destino**, não o texto: renomear a copy não pode
 * quebrar o writer nem a identificação canônica da rota.
 */

const RAIZ = process.cwd();

const SUPERFICIES = [
  { nome: "header público", arquivo: "src/components/landing/public-header.tsx" },
  { nome: "hero da Landing", arquivo: "src/components/landing/editorial/hero-editorial.tsx" },
  { nome: "/sua-historia", arquivo: "src/app/(public)/sua-historia/page.tsx" },
  { nome: "/login", arquivo: "src/components/auth/login-form.tsx" },
] as const;

const ROTA = "/solicitar-atendimento";
const CTA = "Solicitar atendimento";

describe("T-A-1 · os quatro CTAs alcançam /solicitar-atendimento", () => {
  it.each(SUPERFICIES)("$nome aponta para a porta pública", ({ arquivo }) => {
    const fonte = readFileSync(path.join(RAIZ, arquivo), "utf8");
    expect(fonte, `${arquivo} não leva a ${ROTA}`).toContain(`href="${ROTA}"`);
  });

  it.each(SUPERFICIES)("$nome usa o CTA canônico", ({ arquivo }) => {
    const fonte = readFileSync(path.join(RAIZ, arquivo), "utf8");
    expect(fonte, `${arquivo} não diz "${CTA}"`).toContain(CTA);
  });

  it("nenhum convite concorrente sobrou apontando para o wizard", () => {
    // `Começar` continua existindo DENTRO de `/sua-historia` — lá é o avanço
    // do wizard para quem já tem conta, e isso é legítimo. O que não pode é
    // uma superfície pública convidar quem não tem conta para lá.
    for (const arquivo of [
      "src/components/landing/public-header.tsx",
      "src/components/landing/editorial/hero-editorial.tsx",
    ]) {
      const fonte = readFileSync(path.join(RAIZ, arquivo), "utf8");
      expect(fonte, `${arquivo} ainda convida o público para o wizard`).not.toContain(
        'href="/sua-historia"',
      );
    }
  });

  it("a rota pública existe, e é a que os CTAs citam", () => {
    const pagina = readFileSync(
      path.join(RAIZ, "src/app/(public)/solicitar-atendimento/page.tsx"),
      "utf8",
    );
    expect(pagina).toContain("Fale com a Aliviar");
    expect(pagina).toContain("Nada sobre saúde nesta página");
  });
});

describe("T-A-8 · o consentimento nasce desmarcado na interface", () => {
  it("o formulário nasce com a caixa desmarcada", () => {
    // A marca é do produto, não do teste: `defaultChecked` ou `checked` ligado
    // no JSX seria consentimento pré-dado, e isso não é consentimento.
    const form = readFileSync(
      path.join(RAIZ, "src/components/publico/solicitar-atendimento-form.tsx"),
      "utf8",
    );
    expect(form).toContain('type="checkbox"');
    expect(form, "a caixa de consentimento nasce marcada").not.toMatch(
      /defaultChecked|checked=\{true\}/,
    );
  });
});

describe("T-A-14 · renomear a copy não quebra writer nem identificação", () => {
  it("o formulário chama o endpoint pelo path, nunca pelo texto do botão", () => {
    const form = readFileSync(
      path.join(RAIZ, "src/components/publico/solicitar-atendimento-form.tsx"),
      "utf8",
    );
    expect(form).toContain('fetch("/api/solicitacoes-atendimento"');
    expect(form).toContain('method: "POST"');
  });

  it("o endpoint identifica a RPC pelo nome canônico, não por copy", () => {
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    expect(rota).toContain('.rpc("solicitar_atendimento_publico"');
  });

  it("a origem gravada no CRM é código estável, não texto de interface", () => {
    const sql = readFileSync(
      path.join(RAIZ, "supabase/migrations/20260812210000_porta_publica_solicitacao_de_atendimento.sql"),
      "utf8",
    );
    expect(sql).toContain("'porta_publica'");
  });
});

describe("T-A-10 · o contrato do WAF mira só o POST real", () => {
  /**
   * Nesta missão isto prova **contrato**, não eficácia: regra, escopo, método,
   * path e estado. Rate-limit só se valida com tráfego real, em Preview.
   *
   * O runbook é a fonte da regra. Se o path do endpoint mudar e o runbook não,
   * este teste cai — que é exatamente o modo de falha perigoso: WAF protegendo
   * um path que não existe mais.
   */
  const runbook = readFileSync(path.join(RAIZ, "docs/repaginacao/41_OPS_R3A1_WAF_RUNBOOK.md"), "utf8");

  it("o path do runbook é o path real do endpoint", () => {
    expect(runbook).toContain('"type":"path","op":"eq","value":"/api/solicitacoes-atendimento"');
  });

  it("mira POST, e só POST", () => {
    expect(runbook).toContain('"type":"method","op":"eq","value":"POST"');
    expect(runbook, "a regra alcançou o GET da página").not.toMatch(/"value":"GET"/);
  });

  it("nasce em log — não bloqueia, não desafia", () => {
    expect(runbook).toContain("--rate-limit-action log");
    for (const acao of ["--action deny", "--action challenge", "--rate-limit-action deny", "--rate-limit-action challenge"]) {
      expect(runbook, `o runbook já arma "${acao}" na fase inicial`).not.toContain(acao);
    }
  });

  it("a chave é IP e nada é guardado pelo aplicativo", () => {
    expect(runbook).toContain("--rate-limit-keys ip");
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    for (const cabecalho of ["x-forwarded-for", "x-real-ip", "request.ip", "geolocation"]) {
      expect(rota, `o endpoint leu \`${cabecalho}\``).not.toContain(cabecalho);
    }
  });

  it("o runbook não contém o comando de publicação", () => {
    expect(runbook, "o runbook traz `publish` pronto para colar").not.toMatch(
      /^\s*npx vercel firewall publish/m,
    );
  });
});
