import { describe, expect, it } from "vitest";

import { config } from "@/middleware";

// O matcher decide quais requisições sequer chegam ao middleware. Ele é uma
// string de configuração — nunca é executado em teste de integração e nunca
// aparece num erro de tipo —, então um engano nele só apareceria em produção,
// como recurso da plataforma silenciosamente redirecionado para /login.
//
// A regra do Next é: a requisição PASSA pelo middleware quando o pathname casa
// com o padrão. Aqui a asserção é sobre o que NÃO deve casar.
function matches(pathname: string): boolean {
  const pattern = config.matcher[0];
  return new RegExp(`^${pattern}$`).test(pathname);
}

describe("matcher do middleware", () => {
  it("não intercepta o que a plataforma serve (_vercel, _next, favicon)", () => {
    // `/_vercel/insights/script.js` é o script do Vercel Analytics. Interceptado,
    // ele vira um redirect para /login que devolve HTML — e o browser recusa o
    // script por MIME type, justamente na Landing, onde ninguém tem sessão.
    expect(matches("/_vercel/insights/script.js")).toBe(false);
    expect(matches("/_vercel/speed-insights/script.js")).toBe(false);
    expect(matches("/_next/static/chunks/main.js")).toBe(false);
    expect(matches("/_next/image")).toBe(false);
    expect(matches("/favicon.ico")).toBe(false);
  });

  it("não intercepta arquivos estáticos servidos de public/", () => {
    for (const asset of [
      "/logo.svg",
      "/scenes/hero.jpg",
      "/videos/video-institucional-aliviar.webm",
      "/legendas.vtt",
    ]) {
      expect(matches(asset), asset).toBe(false);
    }
  });

  it("continua interceptando toda rota do produto", () => {
    for (const route of [
      "/",
      "/login",
      "/admin",
      "/admin/ace",
      "/curador/casos",
      "/paciente/curadoria",
      "/sua-historia/para-quem",
      "/coa/curadoria",
    ]) {
      expect(matches(route), route).toBe(true);
    }
  });
});
