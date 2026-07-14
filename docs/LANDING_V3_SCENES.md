# Landing V3 — Briefing de Cenas (Scroll Story)

Documento operacional para quem for substituir os ativos temporários por produção real da Aliviar. Não é o conceito criativo completo (ver o artefato "Landing V3 — A Recepção Digital da Aliviar" aprovado nesta sessão) — é a lista objetiva de arquivos que o mecanismo técnico (`src/components/landing/scroll-story/`) já está pronto para receber.

## Como funciona

Cada cena é resolvida em `src/app/(public)/page.tsx` via checagem de existência em disco (`existsSync`, build/render time) — o mesmo padrão já usado para o vídeo institucional desde a V2. Se o arquivo existir em `public/scenes/`, ele é usado; se não existir, a cena cai automaticamente no gradiente de fallback (tokens de marca, nunca uma foto fabricada). Não é necessário alterar nenhum código para trocar um arquivo — só substituir o arquivo no caminho certo.

## Estado atual (temporário)

As 7 fotos e o loop de vídeo abaixo já estão em `public/scenes/`, mas são **fotografia de banco (Pexels, uso livre) e um loop reaproveitado do Aliviar Conecta** — colocados para o mecanismo funcionar de ponta a ponta enquanto a produção fotográfica/de vídeo real da Aliviar não existe. Nenhuma dessas imagens retrata pessoas ou ambientes reais da Aliviar; nenhuma foi apresentada como tal.

| Cena | Arquivo esperado | Estado atual | Direção de arte (resumo) |
|---|---|---|---|
| Recepção | `public/scenes/recepcao.jpg` + vídeo institucional em `public/videos/video-institucional-aliviar.mp4` (prioridade) | Foto de banco (Pexels) + loop ambiente do Aliviar Conecta como placeholder de vídeo | Hall/corredor calmo, luz natural, materiais nobres — nunca hospitalar |
| Escuta | `public/scenes/escuta.jpg` | Foto de banco (Pexels) | Plano fechado, mãos, papel — luz quente, íntimo |
| Organização | `public/scenes/organizacao.jpg` | Foto de banco (Pexels) | Mesa organizada, documentos, luz de fim de tarde |
| Companhia | `public/scenes/companhia.jpg` | Foto de banco (Pexels) — mais fraca do lote, considerar substituir primeiro | Conversa humana, sem jaleco, luz quente e envolvente |
| Critério | `public/scenes/criterio.jpg` | Foto de banco (Pexels) | Documentos/curadoria, tons contidos, quase arquivístico |
| Entrega | `public/scenes/entrega.jpg` | Foto de banco (Pexels) | Luz se abre, ar livre, alívio |
| Grand Finale | `public/scenes/grand-finale.jpg` | Foto de banco (Pexels) | Ambiente mais aberto e silencioso de todos |

Vídeo ambiente temporário: `public/scenes/recepcao-ambient.webm` (reaproveitado de `aliviar-temp.vercel.app`, reuso explicitamente autorizado — mesma empresa, outro produto Aliviar). Some automaticamente assim que `public/videos/video-institucional-aliviar.mp4` existir, já que o vídeo institucional real tem prioridade.

## O que falta produzir para a versão definitiva

1. **Vídeo institucional real**, com narração cobrindo quem somos / como funciona / por que existimos, e legendas (`.vtt`) — ver `docs/VIDEO_INSTITUCIONAL_LANDING.md`.
2. **Sete fotografias editoriais reais**, uma por cena da tabela acima, com direção de arte consistente (grading de cor unificado) — recomendação: uma única sessão de produção, não sete sessões avulsas, para garantir que todas pareçam parte do mesmo universo visual.
3. Substituir os arquivos em `public/scenes/` pelos definitivos, nos mesmos nomes de arquivo — nenhuma alteração de código necessária.
