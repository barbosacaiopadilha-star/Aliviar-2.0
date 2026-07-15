# UX Writing da Landing — Conteúdo Integral

Escrita de conteúdo, não decisão de UX/UI/estrutura. Não redefine `docs/LANDING_CREATIVE_DIRECTION.md` (ADR-017, estrutura), não redefine `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` (intenção emocional) — aplica os dois em linguagem final, seção a seção, e audita a linguagem já em produção contra o critério dos dois. Nenhum documento existente foi alterado; nenhuma tela, componente ou código foi modificado para produzir este documento.

**Achado de partida, antes de qualquer texto novo**: a Landing publicada hoje (`PortalExperience`, `src/components/landing/`) já tem copy real, deliberadamente trabalhada — os comentários do próprio código documentam passagens editoriais anteriores ("Fase 6 — Origem Emocional": cada carta foi reescrita para nunca afirmar além do que o produto garante de fato). Este documento, portanto, não parte de uma página em branco: **organiza e audita o que já existe** sob as 12 seções oficiais de `docs/LANDING_CREATIVE_DIRECTION.md` §6, propõe texto novo só onde há lacuna real, e sinaliza — sem corrigir — três divergências entre o que está escrito hoje e o que os documentos canônicos ou o restante do produto garantem. Cada bloco de conteúdo abaixo é marcado **[REAL]** (já em produção, arquivo/linha citados) ou **[PROPOSTO]** (escrito agora, não implementado).

**Mapeamento estrutural**: a "Estrutura aprovada (12 seções)" de `LANDING_CREATIVE_DIRECTION.md` §6 foi desenhada para uma Landing de seções discretas. A Landing real hoje é um ambiente contínuo (`PortalExperience`) que **absorveu** várias dessas seções umas nas outras (registrado no próprio `CHANGELOG.md`, entrada `[1.0.0-landing]`: "Substitui a composição anterior de seções independentes... por um ambiente único e contínuo"). As 12 seções abaixo continuam sendo a unidade de conteúdo correta para este exercício (é o que a direção criativa nomeia, e o pedido desta fase é escrever linguagem, não redesenhar estrutura) — mas cada uma indica onde vive de fato hoje.

---

## Parte 1 — A Landing completa, seção a seção

### 1. Header

- **Onde vive**: `PublicHeader`, `src/components/landing/public-header.tsx`.
- **Título**: [REAL] "Aliviar" (wordmark, ao lado do ícone da marca).
- **CTA**: [REAL] "Entrar" → `/login`.
- **Microcopy**: [REAL] `alt` da imagem: "Aliviar — Curadoria Médica Independente".
- **Transição**: nenhuma — é permanente (sticky), presente durante toda a leitura.
- **Por que existe**: orientação e ancoragem — quem já tem conta nunca deveria precisar rolar a página inteira para encontrar o caminho de volta.
- **Ansiedade que reduz**: "não sei se já sou cliente daqui" — resolvida em um clique, sem precisar decidir isso antes de explorar o resto.
- **Decisão que facilita**: continuar como visitante ou entrar — nunca força a escolha.
- **Emoção que produz**: segurança de fundo, quase invisível — não deveria ser notado enquanto tudo o mais funciona.

### 2. Hero

- **Onde vive**: frame "Chegada", `PortalExperience`, linhas 117-138.
- **Eyebrow**: [REAL] "Curadoria médica independente".
- **Título**: [REAL] "Uma escolha de cuidado, **nunca sozinho**."
- **Subtítulo**: não existe hoje — a Chegada é deliberadamente enxuta (ver seção 6, "Como funciona", onde a lacuna real do Portal está).
- **Texto complementar**: [PROPOSTO, opcional] — uma linha curta só se um dia a ausência de subtítulo se mostrar insuficiente em teste real: *"Você não precisa chegar sabendo o que precisa. Só precisa começar a contar."* — deliberadamente não recomendado para implementação agora; o silêncio depois do título já é a decisão certa (`LANDING_EXPERIENCE_PHILOSOPHY.md`, princípio 8).
- **Transição**: para "Respiro" — nenhuma copy, é a primeira pausa deliberada.
- **Por que existe**: é o único momento da página em que a pessoa decide, em silêncio, se este é ou não o lugar certo.
- **Ansiedade que reduz**: a de estar sozinha com o problema — antes mesmo de saber o que a Aliviar faz.
- **Decisão que facilita**: continuar lendo ou não — nenhuma outra decisão é pedida aqui.
- **Emoção que produz**: reconhecimento (ver `LANDING_EXPERIENCE_PHILOSOPHY.md`, seção 2.1).

### 3. CTA principal

- **Onde vive**: dentro do próprio frame "Chegada" (fundida ao Hero, não mais uma seção própria).
- **CTA**: [REAL] "Contar minha história" → `/sua-historia`.
- **Por que existe**: uma única ação possível no primeiro instante — nunca duas ofertas competindo.
- **Ansiedade que reduz**: a de não saber o que fazer a seguir.
- **Decisão que facilita**: dar o primeiro passo, sem se comprometer com mais do que isso.
- **Emoção que produz**: convite, nunca pressão — o botão está presente, não piscando.

### 4. Vídeo institucional

- **Onde vive**: "Vídeo Companheiro", presente da Triagem à entrada da Curadoria (`PortalExperience`, linhas 23-28, 607-621).
- **Achado a sinalizar, não corrigir**: `LANDING_CREATIVE_DIRECTION.md` §4 descreve um vídeo institucional de **~10 minutos**, roteirizado (`docs/VIDEO_INSTITUCIONAL_LANDING.md`), como "o centro da Landing". O que existe hoje é um vídeo ambiente e silencioso — "presença, nunca apresentador" (comentário do próprio código, linha 27) — que acompanha o scroll sem explicar nada. São dois conceitos de vídeo diferentes; a direção criativa não foi atualizada para refletir essa mudança. Nenhum texto abaixo assume que o vídeo de 10 minutos está implementado.
- **Microcopy**: nenhuma — o vídeo não tem legenda, título ou CTA próprio; é puramente ambiental.
- **Por que existe (o vídeo real, ambiente)**: prova, sem precisar de uma palavra, de que existe gente de verdade do outro lado.
- **Ansiedade que reduz**: a sensação de estar preenchendo algo automatizado.
- **Emoção que produz**: companhia — nunca performance.

### 5. Como funciona

- **Onde vive**: frames "Triagem", "Análise do caso" e a abertura de "Curadoria" (`PortalExperience`, linhas 157-200).
- **Título (Triagem)**: [REAL] "Triagem".
- **Título (Análise)**: [REAL] "Análise do caso".
- **Texto principal (Curadoria, abertura)**: [REAL] "O seu caso é entendido antes de qualquer caminho aparecer."
- **Lacuna real identificada**: das 12 seções, esta é a mais enxuta em relação ao que o nome promete — duas palavras cada em Triagem/Análise, sem explicar o que de fato acontece em cada etapa (o que é esperado: `LANDING_CREATIVE_DIRECTION.md` §9 já registra que "a Landing não precisa ensinar todos os detalhes operacionais" — a profundidade pertence ao momento humano). Ainda assim, um texto de apoio poderia reduzir mais ansiedade sem violar esse princípio:
- **Mensagens de apoio [PROPOSTO]**, para avaliação futura, nunca implementadas aqui:
  - Sob "Triagem": *"Você conta o que está vivendo, no seu ritmo. Não existe pergunta errada."*
  - Sob "Análise do caso": *"Sua história é lida com atenção antes de qualquer indicação — nunca por um processo automático isolado."*
- **Transição**: Triagem → Análise → Curadoria já é conduzida pela luz e pelo ritmo do scroll (Motor da Caminhada), nunca por uma frase de ligação — decisão de linguagem que este documento endossa, não questiona.
- **Por que existe**: mostrar que existe uma sequência com começo, meio e fim — sem detalhar o mecanismo (`docs/LANDING_CREATIVE_DIRECTION.md` §2, sigilo do Método).
- **Ansiedade que reduz**: "o que vai acontecer com o que eu contar".
- **Decisão que facilita**: nenhuma ainda — esta seção só informa, não pede nada.
- **Emoção que produz**: confiança crescente (ver `PortalExperience`, campo `emocao` de cada frame, linhas 159-176).

### 6. Benefícios

- **Onde vive**: frame "Beneficios", `PortalExperience`, linhas 48-60, 201-223.
- **Texto principal (3 cartas)**: [REAL]
  1. "Você sabe o que vem a seguir" — "Cada etapa é explicada antes de acontecer — para você nunca ficar perdido no meio do caminho."
  2. "Você conta sua história uma vez" — "O que você compartilha acompanha a análise do seu caso — sem precisar repetir do zero."
  3. "Você encontra acompanhamento em cada etapa" — "Do primeiro contato à conversa que importa, sempre com apoio disponível."
- **Por que existe**: transformar a promessa abstrata do Hero em três garantias concretas e verificáveis (o próprio código documenta, linhas 39-47, que cada carta foi checada contra o que o produto garante de fato antes de ser escrita).
- **Ansiedade que reduz**: medo de se perder no processo, de ter que recontar tudo, de ficar sem suporte.
- **Decisão que facilita**: acreditar que vale a pena continuar lendo até o CTA final.
- **Emoção que produz**: alívio contido (ver `LANDING_EXPERIENCE_PHILOSOPHY.md`, seção 2.2, item 2).

### 7. Processo

- **Onde vive**: frame "Continuação", `PortalExperience`, linhas 85, 244-275.
- **Texto principal**: [REAL] "O que vem depois já tem forma."
- **Lista**: [REAL] Seleção dos profissionais → Agendamento → Atendimento.
- **Texto complementar**: [REAL] "E, se ainda houver dúvidas, há espaço para elas também." (ponte não-nomeada para a Biblioteca de FAQ, decisão deliberada — comentário do código, linhas 253-259).
- **Por que existe**: fechar o arco da Curadoria com uma projeção concreta do que vem a seguir, sem prometer prazo.
- **Ansiedade que reduz**: incerteza sobre o que acontece depois de contar a história.
- **Decisão que facilita**: nenhuma ação nova — prepara para o convite final.
- **Emoção que produz**: curiosidade segura.

### 8. Por que confiar

- **Onde vive**: frame "Confiança", `PortalExperience`, linhas 70-83, 224-243.
- **Texto principal (3 cartas)**: [REAL]
  1. "Perfis organizados com cuidado" — "Formação, experiência e área de atuação de cada profissional são reunidas pela nossa equipe — nunca um perfil solto ou incompleto."
  2. "Uma pessoa revisa antes de chegar até você" — "Nenhuma indicação segue adiante sem a revisão de alguém da nossa equipe."
  3. "Pensado para o seu caso" — "Nunca um encaixe genérico — a indicação considera a sua situação real, não uma lista pronta."
- **Por que existe**: mostrar o critério sem soar como avaliação fria — autoridade pelo limite declarado ("nunca um perfil solto", "nunca um encaixe genérico"), nunca por afirmação de grandeza (`LANDING_EXPERIENCE_PHILOSOPHY.md`, princípio 6).
- **Ansiedade que reduz**: medo de cair numa indicação genérica ou não verificada.
- **Decisão que facilita**: confiar o suficiente para chegar ao convite final.
- **Emoção que produz**: confiança específica.

### 9. Concierge de Saúde

- **Onde vive**: absorvida — não existe mais como seção própria. O papel dela era cumprido pelo segundo botão do CTA final (`FinalActions`).
- **CTA**: **[RESOLVIDO — LAND DO PACIENTE, Fase 10, Decisão 1]** o botão "Conversar pelo WhatsApp" → `https://wa.me/message` foi **removido** de `FinalActions` (`src/components/landing/final-actions.tsx`). Antes de remover, foi feita busca global por um destino real de WhatsApp em `docs/CREDENTIALS.md`, `docs/ENVIRONMENT_VARIABLES.md`, `.env.local`/`.env.example` e todo o repositório — nenhum existe. Como `docs/LANDING_CREATIVE_DIRECTION.md` §8 já proíbe inventar um link, e não há destino real para conectar, remover foi o único caminho consistente com a regra já escrita. `FinalActions` passa a ter uma única ação ("Contar minha história").
- **Achado original (histórico, preservado — não mais ativo)**: este link era um placeholder genérico, não um número real da Aliviar. Contradizia diretamente `docs/LANDING_CREATIVE_DIRECTION.md` §8: *"Nenhum link de WhatsApp genérico/externo deve ser inventado na Landing — a Aliviar não tem hoje um número de atendimento público registrado em nenhum documento deste repositório; nenhum é fabricado aqui."* Este achado foi citado em cinco documentos sucessivos sem nunca virar decisão — exatamente o padrão que `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §1 usa como exemplo motivador da regra "a terceira menção obriga uma decisão".
- **Por que existia (a intenção, independente do link)**: mostrar que a experiência continua fora do site — "o site continua", nunca uma saída de emergência (`LANDING_CREATIVE_DIRECTION.md` §8). Sem um canal real, essa intenção fica sem CTA que a cumpra — registrado como achado novo em `docs/PATIENT_ENTRY_ARCHITECTURE.md`.
- **Ansiedade que reduzia**: medo de ficar sozinho depois de sair da página.
- **Decisão que facilitava**: escolher o canal mais confortável para dar o próximo passo.
- **Emoção que produzia**: seria alívio — exatamente por isso um link quebrado era pior que nenhum link; é o motivo da remoção em vez da manutenção.

### 10. FAQ

- **Onde vive**: `FaqBookSection`, `src/components/landing/faq-book-section.tsx`, as 6 cartas Dúvida/Solução.
- **Título**: [REAL] "Perguntas que costumam vir antes do primeiro passo".
- **Conteúdo completo**: [REAL] as 6 cartas (não repetido, ver arquivo original) — cobrem: por onde começar, medo de ficar sem suporte, qual caminho seguir, dados/privacidade, tempo de espera, se a Aliviar substitui um médico.
- **Achado — [RESOLVIDO — LAND DO PACIENTE, Fase 10, Decisão 2]**: a carta 3 apresentava Busca Direta e Concierge de Saúde como duas portas hoje igualmente disponíveis. Não são — `discovery`/`connection` seguem como pastas reservadas e vazias (`docs/PATIENT_EXPERIENCE_BLUEPRINT.md`, seção 6; `docs/ARCHITECTURE_KNOWLEDGE_MAP.md`); só o caminho Concierge (`/sua-historia`) existe de fato. A carta foi reescrita para responder apenas sobre o caminho real, sem nomear Busca Direta, discovery, connection ou qualquer funcionalidade futura/roadmap:
  - **Copy anterior**: Dúvida: "Não sei qual caminho escolher" — "Busca Direta ou Concierge de Saúde parecem opções diferentes e você não sabe qual seguir." / Solução: "É a mesma curadoria Aliviar" — "Escolha só a forma mais confortável para você começar — o cuidado é o mesmo."
  - **Copy nova [REAL]**: Dúvida: "Não sei qual caminho escolher" — "Você não sabe se precisa decidir algo antes de começar, ou se existe um jeito certo de dar o primeiro passo." / Solução: "Um caminho único e guiado" — "Você conta sua história uma vez e a nossa equipe organiza os próximos passos com você — não existe forma errada de começar."
  - O título da dúvida ("Não sei qual caminho escolher") foi preservado — continua uma pergunta real e válida mesmo com um único caminho (por onde começar, o que vem primeiro), só deixou de pressupor duas portas nomeadas.
- **Por que existe**: responder objeções reais antes que elas impeçam o primeiro passo.
- **Ansiedade que reduz**: as seis dúvidas mais prováveis de quem ainda não decidiu.
- **Decisão que facilita**: dar o primeiro passo com as principais dúvidas já respondidas.
- **Emoção que produz**: alívio específico, carta a carta.

### 11. CTA Final

- **Onde vive**: `FinalCtaSection`, `src/components/landing/final-cta-section.tsx`.
- **Eyebrow**: [REAL] "Quando estiver pronto".
- **Título**: [REAL] "Estamos aqui — sem pressa e sem urgência artificial."
- **CTAs**: [REAL] "Contar minha história" (primário, → `/sua-historia`). O CTA secundário "Conversar pelo WhatsApp" foi removido — ver seção 9 (Decisão 1, Fase 10).
- **Por que existe**: o único convite explícito de toda a página, depois de toda a confiança já construída.
- **Ansiedade que reduz**: a de sentir que precisa decidir agora — o próprio título nega isso.
- **Decisão que facilita**: dar o primeiro passo.
- **Emoção que produz**: convite, nunca pressão — encerrando exatamente a sequência emocional prevista em `LANDING_CREATIVE_DIRECTION.md` §3.

### 12. Footer

- **Onde vive**: `PublicFooter`, `src/components/landing/public-footer.tsx`.
- **Texto principal**: [REAL] "Você não precisa decidir sozinho." (eco deliberado do "nunca sozinho" do Hero — comentário do código, linhas 27-32: "a última voz da Landing ecoa a primeira").
- **Texto complementar**: [REAL] "Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro contato à conversa que importa."
- **Navegação**: [REAL] Início / Dúvidas frequentes / Contar minha história / Entrar.
- **Microcopy**: [REAL] "© {ano} Aliviar. Todos os direitos reservados."
- **Por que existe**: fechar a experiência sem "secar" — nenhum rodapé genérico de links institucionais.
- **Ansiedade que reduz**: nenhuma nova — é puramente emocional, "sem nenhuma reivindicação factual a verificar" (comentário do código, linhas 27-32).
- **Emoção que produz**: acompanhamento silencioso — a página termina, a companhia continua implícita.

---

## Parte 2 — Revisão

Passagem contra os sete critérios pedidos, sobre a linguagem real hoje em produção (não sobre as propostas acima, que já nascem filtradas por eles).

| Critério | Resultado |
|---|---|
| Repetições | Aceitável — "cuidado"/"cuida" aparece de forma esparsa e temática (Hero, alt do logo, FAQ carta 6), nunca em sequência próxima o bastante para soar repetitivo. |
| Excesso de adjetivos | Não encontrado — a copy é predominantemente verbal/factual ("é explicada", "acompanha", "é revisada"), raríssimos adjetivos isolados. |
| Promessas implícitas | **Dois achados, ambos resolvidos na Fase 10 (LAND DO PACIENTE)**: (1) o CTA "Conversar pelo WhatsApp" apontava para um canal que não existia — removido (seção 9); (2) a carta 3 do FAQ prometia uma escolha de caminho (Busca Direta) que o produto ainda não oferece — reescrita (seção 10). Um terceiro, menor, permanece sem alteração (fora do escopo da Fase 10): o título "Acompanhamento em tempo real" (FAQ carta 2) pode ler como uma garantia de resposta instantânea que nenhum documento deste repositório declara como SLA — alternativa mais segura, se um dia revisitada: *"Acompanhamento contínuo"* ou *"O mesmo cuidado, agora pelo WhatsApp"*. |
| Linguagem publicitária | Não encontrada — nenhum superlativo, nenhuma urgência, nenhuma comparação, nenhum "clique agora". |
| Excesso de tecnicismo | Não encontrado — ACE, protocolos, Compatibility Matrix e qualquer critério interno nunca aparecem, como exige `LANDING_CREATIVE_DIRECTION.md` §2. |
| Excesso de emoção | Não encontrado — mesmo os momentos mais emocionais ("nunca sozinho", "sem pressa") são curtos e contidos, nunca dramáticos. |
| Excesso de racionalidade | Não encontrado — a página nunca vira lista de especificações; até "Por que confiar" (a seção mais próxima de argumento racional) mantém tom pessoal ("chega até você", "a sua situação real"). |

**Conclusão da revisão**: a linguagem já em produção está, na grande maioria, alinhada à filosofia — resultado esperado, já que o próprio histórico de commits mostra fases editoriais dedicadas a isso ("Fase 6 — Origem Emocional"). Os dois achados de promessa implícita (WhatsApp, Busca Direta) não são problemas de tom — são desalinhamentos factuais entre o que o texto diz e o que o produto hoje realmente oferece, e por isso merecem prioridade sobre qualquer refinamento de estilo.

---

## Parte 3 — Guia editorial

Aprofunda `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` §5 em regras de escrita aplicáveis frase a frase:

1. Comece pela pessoa, não pela Aliviar — prefira "Você sabe o que vem a seguir" a "Nós explicamos cada etapa".
2. Uma frase, uma ideia — se precisar de "e" para juntar dois pensamentos diferentes, são duas frases.
3. Verbo no indicativo, presente — nunca futuro promissor ("você vai adorar"), nunca condicional vago ("poderia ajudar").
4. Nenhuma afirmação sem lastro verificável no produto real — antes de publicar, pergunte: isso é verdade hoje, ou é a intenção de que seja verdade um dia?
5. Números só quando concretos e verdadeiros (três profissionais, seis dúvidas) — nunca uma métrica de "quantas pessoas já usaram".
6. Reticências e pausas comunicam cuidado; ponto de exclamação quase nunca pertence aqui (nenhum uso encontrado na copy real, e é para continuar assim).
7. Toda pergunta no FAQ nasce de uma dúvida real e prevista, nunca de uma oportunidade de venda disfarçada de pergunta.
8. Se uma frase soa bem em qualquer outro produto de saúde, reescreva — precisa soar como só a Aliviar diria.

---

## Parte 4 — Glossário de palavras preferidas

Cuidado · História · Caminho · Acompanhamento · Curadoria · Critério · Independente · Pessoa/você (nunca "usuário") · Reunir/organizar (nunca "processar") · Revisar (nunca "aprovar" em tom burocrático) · Junto/companhia · Ritmo/tempo (nunca "rápido" como valor em si) · Clareza · Passo (nunca "etapa do funil") · Escolha/decisão (sempre atribuída à pessoa).

---

## Parte 5 — Glossário de palavras proibidas

Melhor/líder/número 1 (qualquer superlativo competitivo) · Algoritmo, IA, inteligência artificial, machine learning (nunca nomeados ao paciente) · Protocolo, pipeline, score, ranking, matriz de compatibilidade, shortlist (vocabulário interno do ACE) · Usuário, lead, conversão, funil (linguagem de produto/marketing voltada para dentro) · Grátis/oferta/desconto (a Aliviar não compete por preço) · Urgente/agora/não perca/última chance · Garantido/comprovado/100% · Diagnóstico, tratamento, cura, resultado clínico prometido · Vagas limitadas/exclusivo (qualquer escassez artificial) · Paciente-cliente tratado como "caso" em linguagem voltada a ele (o termo interno "Caso" nunca aparece nomeado assim para o paciente, mesmo sendo o termo correto internamente, `docs/PRODUCT_ARCHITECTURE.md` §14).

---

## Parte 6 — Regras para futuras telas

- Toda tela nova segue o mesmo teste de `docs/LANDING_CREATIVE_DIRECTION.md` §0: melhora a experiência emocional do paciente, ou não entra.
- Nenhum texto novo nomeia mecanismo interno (ACE, protocolo, IA) — mesma regra de `LANDING_CREATIVE_DIRECTION.md` §2, sem exceção por ser uma tela "só interna".
- Toda tela que representa espera ou processamento usa linguagem de estado real, nunca genérica — o padrão já em produção (`patient_case_overview`, nove textos distintos por estado real do Caso, `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` seção 4) é a referência a seguir, nunca um "carregando..." vazio.
- Nenhuma tela promete um canal, prazo ou capacidade que não exista de fato no momento da publicação — a lição direta dos dois achados da Parte 2.

## Parte 7 — Regras para futuros fluxos

- Todo fluxo mostra o próximo passo antes de pedir a próxima ação — nunca uma pergunta sem contexto do que vem depois.
- Toda saída de um fluxo é possível sem culpa ou fricção — nenhuma mensagem de retenção ("tem certeza que quer sair?") fora do necessário para não perder dado real.
- Nenhum fluxo usa progresso como pressão — se uma barra ou indicador de etapas for necessário, ele informa, nunca avalia ("Fio Dourado" já em produção é a referência: presença contínua, nunca cobrança de avanço).

## Parte 8 — Regras para futuras notificações

- Toda notificação nomeia o que mudou, em linguagem humana — nunca um evento técnico cru ("status atualizado").
- Nenhuma notificação usa urgência artificial para aumentar abertura/clique.
- Tom idêntico ao da Landing e do produto — uma notificação nunca deveria soar como um sistema diferente falando.

## Parte 9 — Regras para futuras mensagens do sistema

- Toda mensagem de erro é honesta sobre o que aconteceu, sem expor detalhe técnico (mesma regra já em vigor: `docs/DEBUGGING.md` — falhas do modelo de linguagem "nunca expõem a mensagem crua do provedor").
- Toda mensagem de estado vazio (nenhum resultado, nada ainda disponível) mantém o mesmo cuidado do resto da experiência — nunca um "nada encontrado" seco.
- Nenhuma mensagem do sistema usa humor, ironia ou tom "descontraído de erro 404" — o tom institucional é sempre o mesmo, mesmo quando algo dá errado.
