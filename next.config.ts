import type { NextConfig } from "next";

// GO LIVE — endurecimento mínimo indispensável antes de produção real:
// nenhum cabeçalho de segurança HTTP existia até aqui. CSP fica de fora de
// propósito (exigiria allowlist cuidadosa de Supabase/Vercel Analytics e
// teste ponta a ponta antes de arriscar quebrar a aplicação em produção —
// registrado como backlog, não bloqueia o lançamento).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
