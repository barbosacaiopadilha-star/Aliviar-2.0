/**
 * O MAPA NOMINAL DAS CAPABILITIES DE PROPOSTAS E SEUS CHAMADORES ÚNICOS.
 *
 * @metodo CONTRATO_1_8_R1 §21.6/§21.7 (lavratura `78e261c`)
 * @metodo CONTRATO_1_11 §10 (lavratura `ca49293`) — a C-01d evolui para DUAS
 *         capabilities, com chamadores nominais DISTINTOS
 *
 * A aplicação nunca conhece a tabela (`C-01`): ela conhece FUNÇÕES. Cada
 * função tem exatamente UM chamador autorizado, e os papéis não se cruzam:
 *
 * - a leitora INDIVIDUAL reconstrói proveniência (§11.4) — uma proposta, por
 *   identidade, para a cadeia;
 * - a leitora AGREGADA alimenta o Painel de Discordância — contagens por
 *   conceito × regra × versão × desfecho, sem dimensão pessoal.
 *
 * Chamador cruzado é proibido nos dois sentidos: o painel que lesse a
 * individual poderia reconstituir linhas (e agregar em memória, §10.1); a
 * cadeia que lesse a agregada estaria decidindo por estatística. Um segundo
 * nome em qualquer lista nasce auditado por construção (C-01b) — e um
 * chamador fora do mapa derruba a C-01d.
 *
 * Declarado UMA vez e usado por todas as guardas: C-01b (inércia dos
 * chamadores), C-01c (vínculo é ponteiro), C-01d (exclusividade), A2 de
 * `derivacao-contrato.test.ts` (a mesma verdade pela porta do consumo).
 */
export const CHAMADORES_DE_CAPABILITIES = {
  ler_proposta_para_proveniencia: [
    "src/modules/curadoria/cadeia-de-proveniencia-repository.ts",
  ],
  contar_propostas_por_desfecho: [
    "src/modules/curadoria/painel-de-discordancia-repository.ts",
  ],
} as const;

export type CapabilityDePropostas = keyof typeof CHAMADORES_DE_CAPABILITIES;

/**
 * Todos os chamadores autorizados, de todas as capabilities — o conjunto que a
 * C-01b audita como read-only e não decisório.
 */
export const LEITORES_DE_PROPOSTA_AUTORIZADOS: readonly string[] = Object.values(
  CHAMADORES_DE_CAPABILITIES,
).flat();

/** Normaliza separador de caminho para comparar em qualquer sistema. */
function normalizar(caminho: string): string {
  return caminho.split("\\").join("/");
}

export function ehLeitorAutorizado(caminho: string): boolean {
  return LEITORES_DE_PROPOSTA_AUTORIZADOS.includes(normalizar(caminho));
}

/** O chamador único autorizado de UMA capability específica. */
export function ehChamadorDe(capability: CapabilityDePropostas, caminho: string): boolean {
  const autorizados: readonly string[] = CHAMADORES_DE_CAPABILITIES[capability];
  return autorizados.includes(normalizar(caminho));
}
