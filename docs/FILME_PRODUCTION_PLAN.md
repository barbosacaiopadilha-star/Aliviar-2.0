# Plano de Produção — Filme Institucional Aliviar

Documento executável de produção. Baseado integralmente em `docs/FILME_INSTITUCIONAL_ALIVIAR.md` (fonte oficial do roteiro, storyboard e narrativa — **não alterado, não reinterpretado aqui**). Este documento não redecide nenhuma escolha criativa; ele decide **como produzir** o que já foi decidido.

## 1. Estratégia de produção — visão geral

**Recomendação central: produção híbrida, não 100% IA e não 100% filmagem tradicional.** As cenas centradas em performance humana sustentada e contato visual genuíno (a maioria do filme) são filmadas com elenco e câmera reais — é onde geração por IA tem o maior risco de comprometer exatamente o que o filme busca (confiança, serenidade, humanidade real). As cenas sem rosto sustentado ou puramente gráficas/de marca usam motion graphics ou, como contingência, geração por IA.

Esta decisão está detalhada, cena a cena, na seção 2, e já era antecipada como recomendação profissional na seção 26 de `docs/FILME_INSTITUCIONAL_ALIVIAR.md` — este plano a torna operacional.

## 2. Plano cena a cena

| # | Cena | Tempo | Objetivo dramático | Tipo | Ferramenta recomendada | Contingência IA | Justificativa | Dificuldade | Risco visual | Risco de continuidade | Estratégia de consistência |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Silêncio | 0:00–0:05 (5s) | Estabelecer o mundo antes da personagem; silêncio absoluto | B-roll | Câmera real (drone/tripé) | **Luma** (forte em atmosfera, sem rosto envolvido) | Sem continuidade de personagem em jogo; a primeira imagem do filme não pode arriscar parecer sintética | Baixo | Baixo | Baixo (não depende de outra cena) | 3–5 tomadas alternativas na captação/geração; cor pré-alinhada ao LUT geral (seção 4) |
| 2 | Impacto emocional | 0:05–0:12 (7s) | Primeiro contato com o peso emocional da protagonista | Filmagem real | Câmera real | Runway (fallback só se inviável filmar) | Performance sustentada de rosto em repouso e respiração sutil — IA não garante microexpressão real nem consistência de rosto com as cenas seguintes | Alto | Baixo (com câmera real) | Médio (deve casar com a cena 3 — mesmo quarto, mesma hora implícita) | Gravar cenas 2 e 3 no mesmo dia/set, sequencialmente; still de referência de set dressing |
| 3 | Diagnóstico / reconhecimento | 0:12–0:17 (5s) | Reconhecimento interno silencioso | Filmagem real | Câmera real | Kling (fallback) | Mesma atriz da cena 2; movimento de mãos e expressão real, continuidade direta | Médio | Baixo | Médio (mesmo bloco de filmagem da cena 2) | Mesmo set/dia da cena 2; still de referência de figurino |
| 4 | Solidão | 0:17–0:24 (7s) | Presença física, ausência emocional, em meio à família | Filmagem real | Câmera real | Veo (fallback, mais capaz em cenas com múltiplos sujeitos) | Múltiplos figurantes e movimento coreografado de fundo — complexidade alta demais para IA manter consistência entre vários "atores" simultâneos | Alto | Médio | Alto (roupa/cabelo devem casar com cena 3; elenco de apoio precisa ser consistente) | Guia de continuidade fotográfico por cena; elenco de apoio contratado para o dia inteiro |
| 5 | Busca | 0:24–0:32 (8s) | Busca silenciosa, luz de tela no rosto | Filmagem real | Câmera real | Runway (fallback) | Luz prática de tela é efeito clássico de captação real, mais autêntico que simular; mesma atriz | Médio | Baixo | Médio (figurino de "fim de dia", distinto da manhã) | Still de referência; gravar em ambiente controlado (casa real ou set, à noite) |
| 6 | Dúvida | 0:32–0:37 (5s) | Hesitação genuína antes de decidir | Filmagem real | Câmera real | Runway (fallback) | Continuidade direta com as cenas 5 e 7 — mesmo set, mesma luz, mesma ação contínua | Médio | Baixo | Alto (é o meio de uma ação contínua com 5 e 7) | Gravar 5, 6 e 7 na mesma sessão; cobertura múltipla a partir de um bloco contínuo |
| 7 | Confiança | 0:37–0:44 (7s) | Decisão silenciosa, luz quente entrando | Filmagem real | Câmera real | Kling (fallback, bom em transição de luz motivada) | Mesma lógica de continuidade das cenas 5–6 | Médio | Baixo | Alto (mesma razão da cena 6) | Mesma sessão de gravação das cenas 5–6 |
| 8 | Nascimento da Aliviar | 0:44–0:51 (7s) | Introdução discreta da marca | Filmagem real (reflexo) + Motion Graphics (símbolo) | Câmera real + motion graphics (After Effects/Lottie) | Não recomendado IA de vídeo — precisão vetorial de marca exige fidelidade exata aos tokens do Design System | Peça de marca exige precisão de cor/tipografia que geração de IA não garante | Médio | Baixo (motion graphics controlado internamente) | Baixo (elemento novo, não depende de outra cena) | Produzir o símbolo animado como asset separado (seção 5), reaproveitado na cena 11 |
| 9 | Método | 0:51–1:01 (10s) | Conexão humana genuína — clímax emocional do filme | Filmagem real | Câmera real | Veo (fallback, mas risco elevado) | Contato visual sustentado entre duas pessoas reais é o momento emocionalmente mais importante — é onde "uncanny valley" seria mais prejudicial se gerado por IA | Alto | Médio (depende de locação real bem iluminada) | Baixo (cena autocontida) | Scout de locação com luz natural generosa; ensaio de blocking antes da gravação |
| 10 | Esperança | 1:01–1:09 (8s) | Presença recuperada, leveza | Filmagem real | Câmera real (gimbal/steadicam) | Kling ou Veo (fallback, melhores em movimento de câmera físico) | Tracking lateral sincronizado com caminhada natural em golden hour real — IA ainda não reproduz de forma confiável um "walk and turn" natural sustentado com luz realista | Alto | Médio (depende do clima/luz do dia) | Baixo (mas figurino com *callback* sálvia precisa ser decidido antes) | Agendar 2–3 dias alternativos de golden hour; prova de figurino aprovada previamente |
| 11 | Encerramento + CTA | 1:09–1:20 (11s) | Assinatura de marca, fechamento | Motion Graphics + Logo Animation | Motion graphics (After Effects/Lottie) | Não aplicável (mesmo motivo da cena 8) | Mesma exigência de precisão de marca da cena 8 | Baixo | Baixo | Baixo | Reaproveitar o mesmo asset de logo animado da cena 8 — nunca recriar |

**Resumo:** 1 cena em b-roll real, 8 cenas em filmagem real com elenco, 2 cenas (8 e 11) em motion graphics — nenhuma cena do filme é 100% gerada por IA na recomendação principal; IA aparece só como contingência documentada por cena.

## 3. Pipeline oficial

1. **Geração de keyframes** — para cenas de contingência IA: still de referência (frame inicial) antes de gerar qualquer clipe. Para cenas de filmagem real: still de referência fotográfica/moodboard (enquadramento, luz, figurino) aprovado antes de qualquer captação. Para motion graphics: frame estático do símbolo/tipografia em cada estado-chave da animação.
2. **Revisão dos keyframes** — checkpoint formal e obrigatório: enquadramento, paleta, figurino e luz aprovados contra `docs/FILME_INSTITUCIONAL_ALIVIAR.md` antes de prosseguir. Nenhuma filmagem ou geração corre sem esse sign-off.
3. **Geração dos vídeos** — filmagem real (maioria das cenas, conforme blocos de continuidade da seção 2) ou execução dos prompts de IA (só cenas de contingência). Múltiplas tomadas/gerações por cena.
4. **Revisão** — seleção da melhor tomada/geração por cena, contra o storyboard e a consistência visual (seção 4).
5. **Edição** — montagem conforme `docs/FILME_INSTITUCIONAL_ALIVIAR.md`, seção 24 (cortes secos, ritmo, único cross-dissolve entre cenas 8–9, único fade to black antes do logotipo).
6. **Color grading** — aplicação do arco de cor frio→quente e do LUT (seção 4).
7. **Sound design** — silêncio deliberado nas cenas 1–4, sons práticos específicos a partir da cena 5 (conforme seção 17 do roteiro).
8. **Trilha** — composição/licenciamento, mixagem abaixo da narração, crescimento orgânico até a cena 10.
9. **Narração** — gravação de voz (tom conforme `docs/BRAND_GUIDELINES.md`), sincronização com a edição já travada.
10. **Legendas** — geração e sincronização exata com a narração (nunca resumo paralelo).
11. **Exportação** — quatro formatos, mapeados aos destinos (seção 5).

Cada etapa só começa com a etapa anterior formalmente aprovada — nenhuma sobreposição informal de fases.

## 4. Consistência visual

- **Temperatura de cor**: arco deliberado frio→quente (já definido no roteiro) — cenas 1–6 em tons azul-acinzentados (~5600–6500K aparente), cena 7 introduz o primeiro ponto de luz quente (~3200K), cenas 9–11 em luz quente natural (~3200–4000K).
- **LUT sugerida**: base neutra/log na captação, LUT customizado no grading — direção estilística: contraste suave, pretos não totalmente cheios (leve véu, como filme físico), realces quentes sem estourar, saturação geral abaixo do padrão "comercial" (mais próximo de still fotográfico editorial que de vídeo publicitário). Não usar LUT genérico de pacote comercial "cinematic teal-orange" — incompatível com a paleta da marca.
- **Profundidade de campo**: rasa na maior parte do filme (f/1.8–f/2.8) nos closes; média (f/4) nos planos de estabelecimento (cenas 1, 9 abertura).
- **Granulação**: grão de filme sutil simulado (equivalente a 35mm, baixa intensidade) em toda a peça — nunca ruído digital, nunca grão pesado/estilizado.
- **Velocidade de câmera**: 24fps em toda a peça (padrão cinematográfico), sem variação de frame rate entre cenas.
- **Movimentos permitidos**: estático, push-in imperceptível (2–3% ao longo do plano), dolly lateral muito lento, handheld sutil documental (só cena 4), steadicam/gimbal suave em tracking lateral (só cena 10).
- **Movimentos proibidos**: whip pan, zoom rápido ou perceptível, drone espetacular/sweeping, shake exagerado, rotação de câmera, qualquer movimento que chame atenção para si mesmo.
- **Tipos de lente**: 24–35mm (estabelecimento), 50mm (plano médio neutro), 85mm f/1.8–f/2 (closes de rosto), 100mm macro (detalhes de mão/textura) — conforme já especificado no roteiro, seção 12.
- **Composição**: espaço negativo generoso em toda a peça; regra dos terços deliberadamente quebrada nas cenas de isolamento (protagonista descentralizada, "ar" excessivo ao redor) para reforçar solidão; nunca simetria perfeita "corporativa".

## 5. Assets a produzir

- **Logotipo animado** — asset único (Lottie/After Effects), produzido uma vez, reaproveitado nas cenas 8 e 11.
- **Ícones** — nenhum novo: reaproveitar o set já adotado no produto (`lucide-react`, `docs/DESIGN_SYSTEM.md`, seção 8) para qualquer elemento gráfico auxiliar, se necessário.
- **Trilha** — composição original ou licenciamento de peça instrumental (piano/cordas minimalista), conforme direção de linguagem sonora do roteiro (seção 16).
- **Sons ambientes** — biblioteca de foley/field recording: relógio, respiração, passos, ambiente de casa (cozinha, quarto), ambiente de consultório, ambiente de rua urbana suave.
- **Identidade sonora** — avaliar (decisão pendente, fora do escopo deste plano) uma assinatura sonora curta (2–3 notas) para abrir/fechar futuros vídeos da marca, reaproveitável além deste filme.
- **Legendas** — arquivo `.srt`/`.vtt` em pt-BR, revisado contra o vocabulário de `docs/BRAND_GUIDELINES.md` antes de finalizar.
- **Thumbnails** — still de capa por versão/plataforma; recomendação: still da cena 10 (luz dourada, esperança) como thumbnail padrão — é a imagem que melhor resume o objetivo emocional do filme sem depender de contexto.
- **Versões para Landing** — 16:9, autoplay mudo com controle de som, legendas embutidas.
- **Versões para YouTube** — 16:9 completo, título/descrição alinhados às palavras-chave de `docs/LANDING_STRATEGY.md`.
- **Versões para Instagram** — 9:16 (Stories/Reels, recomposta) e 1:1 (feed), ambas com legenda embutida.
- **Versões para LinkedIn** — 1:1 ou 16:9, legenda embutida, tom institucional preservado.

## 6. Cronograma

| Fase | Conteúdo | Duração estimada |
|---|---|---|
| **Fase 1 — Keyframes** | Moodboard/still de referência por cena, casting, scout de locações, aprovação de figurino | 1 semana |
| **Fase 2 — Geração IA / Filmagem** | Filmagem real das cenas 2–7, 9, 10; b-roll da cena 1; produção do motion graphics das cenas 8/11; geração das contingências IA se necessário | 1–2 semanas |
| **Fase 3 — Revisão** | Seleção de tomadas/gerações, aprovação contra storyboard | 3–4 dias |
| **Fase 4 — Edição** | Montagem completa conforme guia de edição do roteiro | 1 semana |
| **Fase 5 — Color grading** | Aplicação do arco de cor e LUT | 3–4 dias |
| **Fase 6 — Sound design** | Sons ambientes, trilha, gravação de narração, legendas (todos agrupados nesta fase, já que o cronograma solicitado não abre uma fase própria para cada) | 1 semana |
| **Fase 7 — Exportação** | Geração dos 4 formatos e versões por destino | 2–3 dias |

**Total estimado, ponta a ponta:** ~5–6 semanas, presumindo aprovações rápidas em cada checkpoint e sem contratempo de agenda (especialmente a dependência de golden hour real na cena 10).

## 7. Riscos

- Dependência de golden hour real (cena 10) pode exigir múltiplas tentativas de agenda — clima é o fator não controlável.
- Contato visual genuíno e não performático (cena 9) depende inteiramente da direção de atores e do casting certo — não há atalho técnico para isso.
- Continuidade de figurino/luz entre blocos de filmagem (cenas 2–3, 5–6–7) exige disciplina de produção (still de referência, mesma equipe, idealmente mesmo dia) — falha aqui é visualmente perceptível ao espectador.
- Motion graphics de marca (cenas 8, 11) exigem acesso aos tokens exatos de `docs/DESIGN_SYSTEM.md` — qualquer aproximação visual "de olho" quebra a consistência de marca.
- Se a produção real não for viável no prazo (orçamento/agenda), as contingências de IA por cena (coluna da seção 2) têm qualidade inferior à filmagem real, especialmente nas cenas 4, 9 e 10 — não recomendado como plano principal, só como último recurso documentado.

## 8. Próximos passos

1. Aprovação deste plano de produção pelo responsável do projeto.
2. Definir orçamento e prazo real, para confirmar se a Fase 2 comporta filmagem real integral ou se alguma cena precisa migrar para contingência IA.
3. Iniciar Fase 1: casting, scout de locações, moodboard.
4. Iniciar conversas de composição/licenciamento de trilha em paralelo à Fase 1 (prazo de produção musical costuma ser longo).
5. Confirmar acesso aos assets de marca (tokens de `docs/DESIGN_SYSTEM.md`) para a equipe de motion graphics antes da Fase 2.
