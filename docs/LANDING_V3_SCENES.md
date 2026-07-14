# Landing V3 — Briefing de Ambientes

Documento operacional para quem for substituir os ativos temporários por produção real da Aliviar. Não é o conceito criativo completo (ver o artefato "Landing V3 — A Recepção Digital da Aliviar", revisão 3, aprovado nesta sessão) — é a lista objetiva de arquivos que o mecanismo técnico já está pronto para receber.

## Como funciona

Cada ambiente é resolvido em `src/app/(public)/page.tsx` via checagem de existência em disco (`existsSync`, build/render time) — o mesmo padrão já usado para o vídeo institucional desde a V2. Se o arquivo existir em `public/scenes/`, ele é usado; se não existir, a seção cai automaticamente no gradiente de fallback (tokens de marca, nunca uma foto fabricada).

## Estrutura (revisão 3 — dois ambientes)

A Landing V3 usa **dois** ambientes fotográficos, não sete. Entre eles, a `ConnectionZone` carrega o resto da jornada emocional só com tipografia e um gradiente de luz — nenhuma foto adicional é necessária ali.

| Ambiente | Arquivo esperado | Estado atual | Direção de arte (resumo) |
|---|---|---|---|
| Recepção (`ReceptionSection`) | `public/scenes/recepcao.jpg` | Foto de banco (Pexels, uso livre) | Hall/corredor calmo, luz natural fria de manhã, materiais nobres — nunca hospitalar |
| Vídeo-anfitrião (`VideoSection`) | `public/videos/video-institucional-aliviar.mp4` + `public/images/video-institucional-poster.webp` | Ainda não existe — placeholder elegante já validado na V2 | O vídeo é o anfitrião da experiência, com destaque explícito, nunca escondido como fundo |
| Final (`FinalSection`) | `public/scenes/grand-finale.jpg` | Foto de banco (Pexels, uso livre) | Ambiente mais aberto e silencioso de todos — luz clara, quase vazio |

Nenhuma dessas duas fotos retrata pessoas ou ambientes reais da Aliviar; nenhuma foi apresentada como tal.

## O que falta produzir para a versão definitiva

1. **Vídeo institucional real** — narração cobrindo quem somos / como funciona / por que existimos, mais legendas (`.vtt`) — ver `docs/VIDEO_INSTITUCIONAL_LANDING.md`. É o ativo de maior impacto: o vídeo é o anfitrião da experiência inteira.
2. **Duas fotografias editoriais reais** — Recepção e Final, com direção de arte consistente entre si (mesma gradação de cor).
3. Substituir os arquivos em `public/scenes/` pelos definitivos, nos mesmos nomes de arquivo — nenhuma alteração de código necessária.
