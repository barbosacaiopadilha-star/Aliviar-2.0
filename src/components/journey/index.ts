// Biblioteca de componentes da Aliviar Guided Experience (Missão 1).
//
// UMA implementação por papel conceitual, para todos os perfis — nunca
// variações por módulo (Guided Experience; UX_PRINCIPLES "Componentes
// conceituais"). Papéis:
//
//   JourneyHeader      — Onde estou / estado / contexto / o que depende de mim
//   NextActionCard     — a Próxima Ação com endereço fixo (ou o silêncio certo)
//   ProgressTimeline   — etapas com estado e dependência explícita
//   EmptyJourneyState  — vazio que responde por quê / o que virá / se está atualizado
//   StepStatus         — o que já sabemos × o que ainda precisa ser decidido
//   LastUpdate         — quem tocou nisto por último, e quando
//
// Componentes já existentes que cumprem papéis da biblioteca (não duplicar):
//   Identidade   → @/components/auth/authenticated-user-menu
//   Alertas      → @/components/curadoria/case-alert
//   Linha do Tempo → @/components/curadoria/activity-feed

export * from "./journey-header";
export * from "./next-action-card";
export * from "./progress-timeline";
export * from "./empty-journey-state";
export * from "./step-status";
export * from "./last-update";
