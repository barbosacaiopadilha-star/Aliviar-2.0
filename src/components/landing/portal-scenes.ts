export type PortalScene = {
  id: string;
  /** Emoção protegida por esta cena (documentação — Regra Zero). */
  emocao: string;
  /** Caminho relativo dentro de public/ — mesmo padrão de checagem em
   *  disco já usado para a fotografia principal (feito em page.tsx;
   *  nunca falha silenciosamente, cai para a cena anterior disponível
   *  se o arquivo não existir). */
  src: string;
};

// DIREÇÃO DE FOTOGRAFIA — V1.0. Seis enquadramentos da MESMA locação
// (public/scenes/recepcao-bright.jpg, a fotografia institucional real da
// recepção da Aliviar), recortados para funcionar como posições de
// câmera diferentes dentro do mesmo ambiente — nunca fotografias
// independentes, nunca zoom digital exagerado (todos os recortes usam
// resolução nativa, sem upscaling). O visitante não deve perceber uma
// fotografia estática: percebe o mesmo lugar visto de ângulos diferentes
// conforme caminha.
//
// Esta configuração é INTENCIONALMENTE separada de FRAMES (o conteúdo
// textual, em portal-experience.tsx) — a fotografia e o texto evoluem em
// linhas do tempo independentes, cada uma com seu próprio ritmo.
//
// V1.1 — quando novas fotografias reais existirem (fachada, lounge, sala
// de conversa, curadoria, biblioteca, espaço final): troque os `src`
// abaixo por arquivos novos, ou insira uma "Cena 0 — fachada" no início
// do array (com posição 0 em PORTAL_SCENE_POSITIONS, deslocando as
// demais). Nenhuma mudança na arquitetura do Portal é necessária — só
// esta configuração.
export const PORTAL_SCENES: PortalScene[] = [
  {
    id: "recepcao-ampla",
    emocao: "Cheguei — alívio, nada aqui exige justificativa ou decisão imediata.",
    src: "/scenes/recepcao-bright.jpg",
  },
  {
    id: "recepcao-proxima",
    emocao: "Fui recebido — a atenção já está em mim.",
    src: "/scenes/cena-2-recepcao-proxima.jpg",
  },
  {
    id: "corredor",
    emocao: "Posso respirar — passagem quieta, sem pressa, sem ninguém observando.",
    src: "/scenes/cena-3-corredor.jpg",
  },
  {
    id: "transicao",
    emocao: "Posso falar — me aproximo de quem vai me ouvir.",
    src: "/scenes/cena-4-transicao.jpg",
  },
  {
    id: "quadro-planta",
    emocao: "Estão cuidando do meu caso — o canto mais silencioso da sala, atenção dedicada.",
    src: "/scenes/cena-5-quadro-planta.jpg",
  },
  {
    id: "detalhe-silencioso",
    emocao: "Agora eu entendo — o momento mais quieto de toda a jornada.",
    src: "/scenes/cena-6-detalhe.jpg",
  },
];

// Posições normalizadas (0 a 1) de cada cena ao longo do scroll total do
// Portal — independentes dos limites dos frames de conteúdo. Ajustar o
// ritmo da fotografia não exige tocar em nenhum texto.
export const PORTAL_SCENE_POSITIONS: number[] = [0, 0.14, 0.32, 0.5, 0.7, 0.88];
