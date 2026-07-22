# Aliviar — Experience Design System (EDS)

**Versão:** 1.0  
**Status:** Canônico  
**Escopo:** Experiência do Paciente · Capítulos 1–8  
**Base:** `docs/ALIVIAR_EXPERIENCE_PRINCIPLES.md` · `docs/ALIVIAR_PATIENT_JOURNEY.md`

Este documento extrai os **padrões** da experiência já construída — não descreve telas específicas. É o framework para criar novos capítulos sem reinventar a linguagem, o ritmo ou a arquitetura narrativa.

---

## Capítulo 1 — Princípios Fundamentais

### 1.1 O software desaparece

O paciente não navega um aplicativo — vive uma **jornada**. A interface serve o cuidado; nunca o contrário. Formulários, menus e módulos internos permanecem invisíveis. O que aparece são conversas, cartas e orientações.

### 1.2 Uma única próxima ação

Em qualquer momento, o paciente sabe **uma coisa** prioritária — ou entende claramente que **não há ação dele** e que a Aliviar está cuidando. Nunca uma lista de pendências sem hierarquia.

### 1.3 Linguagem humana

Frases curtas. Voz ativa. Nomes próprios. Tradução do técnico. O paciente interage com a Aliviar — não com "o sistema", "a plataforma" ou "o módulo".

### 1.4 Cuidado antes de eficiência

Pressa artificial é proibida. Lentidão informada é válida. O tempo da saúde é respeitado. Períodos de espera comunicam presença — não abandono.

### 1.5 Tecnologia invisível

Polling, status, porcentagens, timelines e dashboards operacionais não pertencem à superfície do paciente. A complexidade fica do lado de dentro; o que transparece é clareza e cuidado.

### 1.6 Autonomia do paciente

A Aliviar coordena — não substitui. O paciente é sempre o sujeito da experiência. Recomendações são orientações fundamentadas, não ordens. A decisão permanece dele.

### 1.7 Continuidade humana

Quem cuida tem rosto e nome. A relação não reinicia a cada acesso. O que foi vivido permanece relevante.

### 1.8 Presença, não produtividade

Especialmente em espera: o paciente deve sentir que está **sendo acompanhado**, não que está **esperando** um processo parado.

---

## Capítulo 2 — Arquétipos

### 2.1 Personagens

| Arquétipo | Nome canônico | Papel | Capítulos |
|-----------|---------------|-------|-----------|
| **Paciente** | — (nome coletado no Cap. 2) | Sujeito da jornada; voz em primeira pessoa nas respostas | Todos |
| **Ana** | Ana | Primeira conversa; acolhimento inicial; triagem humana | 2 |
| **Dra. Marina** | Dra. Marina | Consulta inicial; escuta clínica aprofundada | 3 |
| **Lucas** | Lucas | Gestor da jornada; presença na curadoria e pós-entrega | 4–6, 8 |
| **Equipe Aliviar** | — (institucional) | Referência coletiva; rodapé discreto | Todos |
| **Curadoria** | — (processo, não personagem) | Trabalho criterioso nos bastidores; nunca personificada como bot | 4–7 |

### 2.2 Quando cada um fala

| Arquétipo | Fala quando… |
|-----------|--------------|
| **Paciente** | Responde a uma pergunta; confirma decisão; compartilha história |
| **Ana** | Primeiro contato qualificado; escuta antes de direcionar |
| **Dra. Marina** | Consulta inicial; aprofundamento clínico; confirmação de seguimento |
| **Lucas** | Abertura da curadoria; tempo de espera; preparação e continuidade pós-relatório |
| **Equipe Aliviar** | Assinatura institucional; contexto de bastidores sem rosto individual |

### 2.3 Quando cada um nunca deve falar

| Arquétipo | Nunca… |
|-----------|--------|
| **Ana** | Diagnostica; recomenda médico; encerra sem próximo passo |
| **Dra. Marina** | Pressiona adesão; promete prazo de curadoria; decide pelo paciente |
| **Lucas** | Apresenta ranking; cobra tarefas; usa linguagem de status ou ticket |
| **Equipe Aliviar** | Fala em nome de marketing; cria urgência; substitui voz humana nomeada |
| **Curadoria** | Aparece como personagem falante ("Olá, sou a Curadoria") |

---

## Capítulo 3 — Tom de Voz

### 3.1 Regras

1. **Um pensamento por vez** — frases curtas, parágrafos respiráveis.
2. **Voz ativa** — "Vamos analisar", não "Será analisado".
3. **Proximidade sem informalidade excessiva** — conversa, não WhatsApp solto nem e-mail corporativo.
4. **Confirmação do entendido** — "Pelo que você contou…", "Recebi o que você escreveu."
5. **Honestidade sobre limites** — não prometer o que a operação não entrega.
6. **Ausência de passo também é informação** — "Você não precisa fazer nada agora" é um estado válido.

### 3.2 Exemplos positivos

| Contexto | Exemplo |
|----------|---------|
| Acolhimento | "Você não está sozinho." |
| Escuta | "Pergunto porque preciso entender seu contexto — não para classificar." |
| Espera | "Enquanto você vive sua vida, alguém continua cuidando de você." |
| Entrega | "Cada orientação carrega uma justificativa." |
| Encerramento | "Obrigado por confiar sua história a nós." |
| Autonomia | "A decisão continua sendo sua." |

### 3.3 Exemplos proibidos

| Categoria | Proibido | Preferir |
|-----------|----------|----------|
| Corporativo | "Usuário", "lead", "ticket", "pipeline" | "Você", "sua jornada" |
| Sistema | "O sistema", "a plataforma", "clique aqui" | "Nós", "quando estiver pronto" |
| Cobrança | "Você não enviou", "Falta documentação" | "Ainda precisamos de…", "Quando puder…" |
| Urgência | "Última chance", "Oferta expira" | "No seu ritmo", "Sem pressa" |
| Status | "Aguarde", "Em processamento", "75% concluído" | "Seguimos com seu caso", "Estamos estudando" |
| Produto | "Score", "ranking", "algoritmo", "IA" | Critérios, justificativas, seriedade |
| Marketing | "Compre", "Assine", "Promoção" | Gratidão, presença, continuidade |

---

## Capítulo 4 — Ritmo

### 4.1 Como começa um capítulo

1. **Atmosfera** — fundo calmo, glow discreto; sem conteúdo competindo por atenção.
2. **Identificação** — quem fala (nome + papel), quando há interlocutor humano.
3. **Contexto mínimo** — por que este momento existe, em uma ou duas linhas.
4. **Revelação progressiva** — um elemento por vez; animação apenas para orientar, nunca atrasar.

### 4.2 Como termina um capítulo

1. **Síntese emocional** — o que o paciente deve carregar deste momento.
2. **Próximo passo único** — um convite, ou permissão para fechar ("Pode fechar esta página").
3. **Assinatura humana** — "Com presença, [Nome]" ou equivalente institucional.
4. **Rodapé discreto** — link para equipe; nunca CTA agressivo no encerramento.

### 4.3 Silêncio

| Silêncio correto | Silêncio erro |
|------------------|---------------|
| Entre blocos de informação densa | Após pergunta do paciente sem resposta |
| Quando não há novidade | Quando o status mudou sem comunicação |
| Ao redor de decisões sensíveis | No onboarding inicial |
| Na espera informada | Quando há passo claro não comunicado |

### 4.4 Pausas (conversas — Cap. 2 e 3)

- **Pausa de assimilação** (~1100ms) após fala do host antes da próxima linha.
- **Respiro** (~750ms) entre blocos de preparação e pergunta.
- **Indicador de escuta** — animação sutil enquanto o host "fala"; desaparece antes do input do paciente.
- **Uma pergunta por vez** — nunca dois campos simultâneos.

### 4.5 Confirmação

- Após resposta do paciente: **reflexão** antes da próxima pergunta ("Obrigada por confiar isso a mim.").
- Antes de avançar de capítulo: **confirmação explícita** ("Sim, quero seguir.") quando a decisão é significativa.
- Opção de **pausa** sempre visível ("Ainda preciso de tempo").

---

## Capítulo 5 — Componentes Narrativos

Padrões extraídos dos oito capítulos implementados. Cada um mapeia para uma **intenção**, não para uma rota fixa.

### 5.1 Carta (`Letter`)

**Intenção:** Transmitir presença escrita, calma e intimidade.  
**Usado em:** Cap. 1 (boas-vindas), Cap. 4 (abertura da curadoria).  
**Estrutura:** Saudação → corpo em linhas → assinatura → CTA único opcional.  
**Ritmo:** Linhas com `animationDelay` escalonado; ênfase em serif.

### 5.2 Conversa (`Conversation`)

**Intenção:** Escuta ativa; o paciente se sente ouvido antes de ser direcionado.  
**Usado em:** Cap. 2 (Ana), Cap. 3 (Dra. Marina).  
**Estrutura:** Abertura do host → thread de mensagens → compositor (uma pergunta) → encerramento.  
**Ritmo:** Pausas programadas; `aria-live="polite"` na thread.

### 5.3 Convite (`Invitation`)

**Intenção:** Um gesto para o próximo capítulo — suave, nunca funil.  
**Usado em:** CTAs entre capítulos ("Iniciar conversa", "Receber com calma").  
**Regra:** Um convite por tela; texto orienta o *porquê*, não o *como técnico*.

### 5.4 Síntese (`Synthesis`)

**Intenção:** Organizar informação densa em narrativa legível.  
**Usado em:** Cap. 7 (relatório de curadoria).  
**Estrutura:** Contexto → critérios → recomendações justificadas → decisão do paciente.  
**Regra:** Editorial, não competitivo; sem ranking.

### 5.5 Preparação (`Preparation`)

**Intenção:** Preparar emocionalmente antes de um momento denso.  
**Usado em:** Cap. 6 (antes da leitura do relatório).  
**Estrutura:** Carta do gestor → o que o trabalho representa → permissão para ler no seu tempo.  
**Regra:** Não mostrar o conteúdo que será entregue; não antecipar nomes ou dados.

### 5.6 Presença (`Presence`)

**Intenção:** Acompanhamento durante espera — o tempo é significativo, nunca vazio.  
**Usado em:** Cap. 4 (início), Cap. 5 (dias seguintes).  
**Estrutura:** Carta breve do gestor → mensagem adaptada ao tempo → permissão para fechar.  
**Regra:** Sem contador, timeline ou porcentagem; evolução por fases narrativas.

### 5.7 Entrega (`Delivery`)

**Intenção:** O principal produto da Aliviar — parecer técnico para decisão humana.  
**Usado em:** Cap. 7.  
**Estrutura:** Ver Síntese (5.4).  
**Regra:** O paciente entende *por que*, não recebe *lista*.

### 5.8 Continuidade (`Continuity`)

**Intenção:** A entrega não encerra a relação — inaugura nova fase.  
**Usado em:** Cap. 8.  
**Estrutura:** Carta do gestor → o que permanece disponível → gratidão sem marketing.  
**Regra:** Sem central de suporte, chat, FAQ ou CRM na superfície.

### 5.9 Mapa narrativo dos capítulos

| Cap. | Rota | Componente(s) principal(is) | Host |
|------|------|----------------------------|------|
| 1 | `/` | Carta + Convite | Aliviar |
| 2 | `/conversa` | Conversa + Convite | Ana |
| 3 | `/consulta` | Conversa + Convite | Dra. Marina |
| 4 | `/curadoria` | Presença (abertura) | Lucas |
| 5 | `/curadoria` (retorno) | Presença (tempo) | Lucas |
| 6 | `/relatorio` | Preparação + Convite | Lucas |
| 7 | `/relatorio/leitura` | Síntese + Entrega | Lucas |
| 8 | `/continuamos` | Continuidade | Lucas |

---

## Capítulo 6 — Componentes Visuais

### 6.1 Elementos permitidos

| Elemento | Classe base | Função |
|----------|-------------|--------|
| Shell de capítulo | `chapter-one` | Container atmosférico |
| Atmosfera | `chapter-one__atmosphere`, `chapter-one__glow--warm` | Calma visual |
| Linha de carta | `chapter-one__letter-line` | Revelação progressiva |
| CTA | `chapter-one__cta` | Um convite por capítulo |
| Thread de conversa | `conversation__thread` | Mensagens alternadas |
| Linha de conversa | `conversation__line--ana` / `--patient` | Voz do host vs. paciente |
| Compositor | `conversation__composer` | Uma ação por vez |
| Host de jornada | `curation-presence__host-name` | Nome + papel do gestor |
| Parecer | `curation-report__*` | Leitura longa, tipografia generosa |
| Rodapé equipe | `chapter-one__footer` | Discreto, não compete |

### 6.2 Tokens visuais

| Token | Valor | Uso |
|-------|-------|-----|
| `--paper` | `#faf6ef` | Fundo |
| `--ink` | `#2b2420` | Texto principal |
| `--ink-soft` | `#6b5f52` | Corpo, parágrafos |
| `--coral` | `#d8664a` | CTA, acentos |
| `--sage` | `#6e8b6f` | Rótulos editoriais |
| `--font-serif` | Fraunces | Títulos, ênfases |
| `--font-sans` | Inter | Corpo |

### 6.3 Elementos proibidos

- Barras de progresso e porcentagens
- Timelines de etapas
- Cards de status empilhados
- Rankings, medalhas, estrelas, scores
- Tabelas comparativas de profissionais
- Dashboards e múltiplos CTAs competindo
- Modais de urgência
- Chat flutuante
- FAQ accordion na jornada
- Dark patterns (urgência falsa, cancelamento difícil)
- Animações decorativas sem função
- Densidade visual que gera ansiedade

### 6.4 Responsividade

- Mobile-first; margens generosas para polegar e olhar.
- `clamp()` em títulos do relatório.
- Linha de leitura confortável (`line-height: 1.85` no corpo).
- Contraste alto entre `--ink` e `--paper`.

---

## Capítulo 7 — Anti-patterns

### 7.1 Destruem confiança

| Anti-pattern | Por que destrói |
|--------------|-----------------|
| Abandono silencioso | Paciente não sabe se alguém recebeu sua mensagem |
| Status otimista falso | Quebra confiança quando a realidade diverge |
| Promessa sem base | "Garantimos o melhor médico" |
| Reinício da relação | "Bem-vindo! Complete seu perfil" a cada acesso |

### 7.2 Destruem autonomia

| Anti-pattern | Por que destrói |
|--------------|-----------------|
| Sobrecarga de escolha | Lista de 5+ opções sem curadoria |
| Ranking de médicos | Transforma cuidado em competição |
| Decisão imposta | Orientação apresentada como ordem |
| Infantilização | Tom paternalista |

### 7.3 Destruem a narrativa

| Anti-pattern | Por que destrói |
|--------------|-----------------|
| Tela de status | Paciente sente que espera, não que é cuidado |
| Checklist de tarefas | Burocracia visível |
| Relatório como PDF download | Entrega de arquivo, não trabalho |
| Chat de suporte genérico | Central de atendimento, não continuidade humana |
| FAQ no lugar de presença | Escala problema para o paciente |

### 7.4 Destruem o ritmo

| Anti-pattern | Por que destrói |
|--------------|-----------------|
| Múltiplas perguntas simultâneas | Sobrecarga cognitiva |
| Urgência fabricada | Ansiedade desnecessária |
| Animação que atrasa informação | Software aparece demais |
| Repetição literal em retornos | Parece abandono disfarçado de automação |

### 7.5 Destruem a linguagem

| Anti-pattern | Exemplo |
|--------------|---------|
| Jargão sem tradução | "Elegibilidade assistencial" sem explicação |
| Linguagem de produto | "Seu pipeline está em curadoria" |
| Linguagem de ticket | "Chamado #4521 aberto" |
| Marketing no encerramento | "Aproveite 20% na renovação" |

---

## Capítulo 8 — Checklist

Use este checklist antes de publicar qualquer novo capítulo da experiência do paciente.

### 8.1 Princípios

- [ ] O software desaparece — o paciente pensa em jornada, não em app?
- [ ] Existe apenas uma próxima ação (ou ausência informada de ação)?
- [ ] A linguagem é humana, sem jargão corporativo ou de sistema?
- [ ] O cuidado precede a eficiência — sem pressa artificial?
- [ ] A autonomia do paciente está preservada?

### 8.2 Arquétipo e voz

- [ ] O interlocutor correto fala neste capítulo?
- [ ] Nenhum personagem ultrapassa seus limites (diagnóstico, ranking, cobrança)?
- [ ] Tom de voz conforme Capítulo 3?

### 8.3 Ritmo

- [ ] O capítulo começa com atmosfera + identificação?
- [ ] Termina com síntese, passo único e assinatura?
- [ ] Pausas e silêncios são intencionais?
- [ ] Em conversas: uma pergunta por vez?

### 8.4 Componente narrativo

- [ ] O capítulo usa o componente narrativo adequado (Carta, Conversa, Presença, etc.)?
- [ ] Não mistura intenções incompatíveis (ex.: Síntese + Chat)?

### 8.5 Visual

- [ ] Usa tokens e classes do EDS?
- [ ] Nenhum elemento proibido (Capítulo 6.3)?
- [ ] Legível em mobile, com contraste adequado?

### 8.6 Anti-patterns

- [ ] Nenhum item do Capítulo 7 presente?

### 8.7 Técnico

- [ ] Conteúdo em `*-model.ts`; apresentação em `*Experience.tsx`?
- [ ] Testes cobrem linguagem proibida e estrutura narrativa?
- [ ] `npm run test`, `lint` e `build` passam?
- [ ] Comportamento de capítulos anteriores inalterado?

---

## Implementação — Camada compartilhada

```
src/components/experience/
├── shared/                    # Framework visual (EDS)
│   ├── ExperienceShell.tsx    # Atmosfera + main + rodapé
│   ├── ExperienceAtmosphere.tsx
│   ├── ExperienceStaffFooter.tsx
│   ├── JourneyHostHeader.tsx  # Lucas · Gestor da jornada
│   └── ExperienceLetterLine.tsx
├── chapter-one/ … chapter-eight/
└── *-model.ts                 # Conteúdo e lógica narrativa (por capítulo)
```

**Separação de responsabilidades:**

| Camada | Responsabilidade |
|--------|------------------|
| `*-model.ts` | Textos, fases, regras de negócio narrativa, dados de exemplo |
| `*Experience.tsx` | Composição visual; usa `shared/` |
| `shared/` | Padrões visuais reutilizáveis |
| `globals.css` | Tokens (`--ink`, `--coral`) e classes por capítulo |

---

## Governança

Este documento é mantido pelo time de produto. Novos capítulos devem ser avaliados contra este EDS **e** contra `ALIVIAR_EXPERIENCE_PRINCIPLES.md`.

Em caso de conflito entre conveniência de implementação e princípio de experiência, **o princípio prevalece**.

---

*Aliviar Curadoria Médica — Do padrão à presença.*
