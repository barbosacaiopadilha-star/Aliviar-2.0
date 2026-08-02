export type PatientNavItem = {
  label: string;
  href: string;
};

// Fonte única da navegação persistente do paciente (PRODUTO DO PACIENTE,
// Fase 2) — consumida por PatientShell, mesma lista para desktop e
// mobile. Deliberadamente separada de components/shell/nav-items.ts
// (compartilhada por administrador/profissional/curador_medico via
// AppShell): o paciente tem um item fora da árvore /paciente ("Minha
// história", em /sua-historia) que getDefaultNavItems não consegue
// representar (só gera `${basePath}/sufixo`) — nunca um ramo daquela
// função, sempre esta lista própria.
//
// "Linha do tempo" adicionada nesta fase — a rota já existia
// (src/app/paciente/linha-do-tempo/page.tsx, autenticada via
// requireRole("paciente"), conteúdo real: histórico da conta, perfil,
// documentos e notificações), mas nunca tinha aparecido aqui. Rótulo
// ("Linha do tempo") copiado do próprio h1/metadata.title da página, não
// inventado.
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  { label: "Início", href: "/paciente" },
  // ETAPA 9: retoma a história existente no passo em que ela parou. Apontar
  // para a recepção do wizard recomeçava a conversa do zero.
  { label: "Minha história", href: "/sua-historia/continuar" },
  { label: "Documentos", href: "/paciente/documentos" },
  { label: "Minha Curadoria", href: "/paciente/curadoria" },
  { label: "Linha do tempo", href: "/paciente/linha-do-tempo" },
  { label: "Perfil", href: "/paciente/perfil" },
];
