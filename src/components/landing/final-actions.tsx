import { LinkButton } from "@/components/landing/link-button";

// Ação única de encerramento (LAND DO PACIENTE, Fase 10 — Fechamento das
// Divergências de Lançamento, Decisão 1). O antigo segundo botão
// ("Conversar pelo WhatsApp") apontava para `https://wa.me/message`, um
// placeholder genérico sem número real — nenhum canal de WhatsApp da
// Aliviar existe hoje em nenhum documento deste repositório (verificado
// em `docs/CREDENTIALS.md`, `docs/ENVIRONMENT_VARIABLES.md`, `.env.*` e
// todo o código). `docs/LANDING_CREATIVE_DIRECTION.md` §8 já proibia
// inventar esse link ("nenhum é fabricado aqui") — removê-lo traz a
// implementação de volta à conformidade com uma regra já escrita, não é
// uma nova decisão de arquitetura. Papel antigo do ConciergeSection
// (caminho guiado via WhatsApp) fica sem segunda opção até um canal real
// existir; quando existir, basta reintroduzir o segundo `LinkButton`
// apontando para ele.
export function FinalActions() {
  return (
    <LinkButton href="/sua-historia" variant="primary">
      Contar minha história
    </LinkButton>
  );
}
