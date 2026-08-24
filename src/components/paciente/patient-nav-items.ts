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
// SIMPLIFICAÇÃO DE 23/08 (decisão do Fundador: "a operação é muito simples
// para ter isso tudo"). O menu tinha seis itens para uma casa de três atos.
// Duas mudanças:
//
//  - "Sua Jornada" SAI do menu: a régua dos seis marcos já vive na Home, no
//    contexto em que significa, com o link "Ver sua Jornada inteira" para
//    quem quiser o histórico. A rota continua existindo — o que sai é a
//    repetição no menu, não a página.
//  - "Perfil" vira "Meus dados": no menu ele é telefone, cidade e canal
//    preferido; na Home, "Conhecer meu Perfil" abre o Mapa de Prioridades.
//    Duas coisas diferentes com o mesmo nome faziam a paciente procurar o
//    que importa no lugar errado.
// CORTE FUNDO DE 23/08 (decisão do Fundador) + MERGE ("às vezes tem muita
// página"). O menu foi a quatro itens e depois a TRÊS: o Início passou a SER
// a Curadoria — a Home tinha virado um cartaz de um botão só apontando para
// ela, e duas telas para um assunto é página demais.
//
// "Documentos" vive dentro de "Meus dados" (a rota `/paciente/documentos`
// continua inteira, com os consentimentos dentro dela); "Minha Curadoria"
// vive no Início (a rota `/paciente/curadoria` redireciona).
export const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  { label: "Início", href: "/paciente" },
  // ETAPA 9: retoma a história existente no passo em que ela parou. Apontar
  // para a recepção do wizard recomeçava a conversa do zero.
  { label: "Minha história", href: "/sua-historia/continuar" },
  { label: "Meus dados", href: "/paciente/perfil" },
];
