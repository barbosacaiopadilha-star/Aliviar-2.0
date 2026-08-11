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
// "Linha do tempo" adicionada numa fase anterior — a rota já existia
// (src/app/paciente/linha-do-tempo/page.tsx, autenticada via
// requireRole("paciente")), mas nunca tinha aparecido aqui. O rótulo foi
// copiado do h1 da própria página, não inventado.
//
// A4 · o rótulo passa a ser "Sua Jornada", e o h1 mudou junto: a página
// deixou de ser um log de conta e passou a contar o percurso. Duas palavras
// para a mesma coisa — "jornada" no resumo da Home e "linha do tempo" no
// menu — faziam a paciente procurar duas superfícies onde há uma.
//
// O href continua `/paciente/linha-do-tempo`: ele está em uso, e trocá-lo só
// pelo nome custaria um redirect sem nenhum ganho para quem navega.
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  { label: "Início", href: "/paciente" },
  // ETAPA 9: retoma a história existente no passo em que ela parou. Apontar
  // para a recepção do wizard recomeçava a conversa do zero.
  { label: "Minha história", href: "/sua-historia/continuar" },
  { label: "Documentos", href: "/paciente/documentos" },
  { label: "Minha Curadoria", href: "/paciente/curadoria" },
  { label: "Sua Jornada", href: "/paciente/linha-do-tempo" },
  { label: "Perfil", href: "/paciente/perfil" },
];
