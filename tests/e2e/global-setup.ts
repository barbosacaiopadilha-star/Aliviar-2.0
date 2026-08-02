import { adquirirTrava } from "../execucao-exclusiva";

/**
 * Trava de execução do E2E — o par da trava da suíte de integração.
 * Se a integração estiver rodando (a limpeza dela restaura a baseline e
 * apagaria este fluxo no meio), o E2E recusa começar, com a explicação.
 */
export default function globalSetup(): void {
  adquirirTrava("e2e");
}
