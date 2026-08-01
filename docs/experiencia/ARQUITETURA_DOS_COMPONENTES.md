# A Arquitetura dos Componentes — Projeto Experiência Visual · Etapa: Biblioteca Conceitual

> **Status:** biblioteca conceitual da experiência. Nenhum componente será redesenhado antes deste documento. Não é código, não é Figma, não é layout.
> **Fontes de verdade congeladas:** [NARRATIVA_DA_EXPERIENCIA.md](./NARRATIVA_DA_EXPERIENCIA.md) · [TRAVESSIA_DA_PACIENTE.md](./TRAVESSIA_DA_PACIENTE.md) · [LINGUAGEM_DOS_AMBIENTES.md](./LINGUAGEM_DOS_AMBIENTES.md) — e, através delas, F1–F9C.1, L1–L14, R1–R18.
> **Não altera:** código, domínio, banco, comportamento, funcionalidade. Toda decisão é rastreável Narrativa → Travessia → Linguagem → código existente (caminhos citados).
> **Data:** 2026-08-01

---

# 1 · O inventário — tudo o que a paciente vê, na jornada inteira

Levantado do código real (src/components + páginas da planta dela, Narrativa §8). Agrupado já por **papel**, nunca por pasta — a pasta é citada só como rastreio.

## Componentes de acolhimento (modo Acolhe)

| Componente | Onde vive no código |
|---|---|
| Hero editorial da Fachada | `landing/editorial/hero-editorial.tsx` (+ `ImmersiveBackdrop`, vídeo) |
| Seções editoriais (Problema, Método, Como Funciona, Prioridades, Relatório, Quem Somos, FAQ) | `landing/editorial/editorial-sections.tsx`, `faq-compact.tsx`, `landing-section.tsx` |
| Saudação ambiental (hora do dia + etapa) | `paciente/experiencia/ambient-hero.tsx` |
| Boas-vindas ("Olá, {nome}") | `paciente/dashboard/patient-primitives.tsx` (`PatientWelcome`) |
| Estados vazios (Curadoria não iniciada · Aguardando · Caminhos não prontos · Comparação não iniciada · "Ainda não há relatórios") | `paciente/experiencia/estados-vazios.tsx`, `curadoria/sem-curadoria.tsx`, `PatientEmptyState` |
| Camada ambiental de fundo | `paciente/dashboard/patient-ambient-layer.tsx`, `.ambient-warmth` |

## Componentes de escuta (modo Escuta)

| Componente | Onde |
|---|---|
| Passo do contar (uma pergunta por vez, progresso sem número) | `story/story-step-layout.tsx` |
| Campos de resposta (texto livre, escolha única) | `ui/textarea.tsx`, `ui/radio.tsx`, `ui/input.tsx` |
| Guardado discreto (posse do rascunho) | `story/autosave-indicator.tsx` |
| Anexos da história | `story/story-attachments.tsx` |
| Aviso de conflito de rascunho | `story/story-conflict-banner.tsx` |
| Porta de quem retorna (login, senhas) | `auth/auth-card.tsx`, `login-form.tsx`, `request-password-reset-form.tsx`, `update-password-form.tsx` |
| Dados práticos de quem chegou | `profiles/patient-profile-form.tsx` |
| Arquivo do gabinete (documentos) | `profiles/patient-documents-panel.tsx` |
| Coleta da decisão já tomada | `patient/connection-choice-panel.tsx` (etapa `choosing`) |
| Modo de começar | `patient/contact-mode-panel.tsx` |

## Componentes de narrativa (modo Fala — voz humana)

| Componente | Onde |
|---|---|
| A história dela, relida | `story/story-narrative.tsx`, `story-summary.tsx`, `review-item.tsx` |
| O Perfil devolvido (leitura organizada + reconhecimento) | `paciente/experiencia/profile-card.tsx`, `paciente/reconhecer-perfil.tsx` |
| O eco do Curador (enquadramento + `compositionRationale`) | `paciente/caminhos/caminhos-panel.tsx` (bloco de abertura) |
| A carta de um caminho | `paciente/caminhos/carta-caminho.tsx` |
| Retrato tipográfico | `paciente/caminhos/retrato.tsx` |
| Retrato do Curador | `paciente/dashboard/patient-primitives.tsx` (`CuratorAvatar`) |
| Correspondência em frase + textura de linha | `paciente/caminhos/barra-compatibilidade.tsx` (forma nova, Travessia §9.3) |
| Comparação por dimensão | `paciente/caminhos/comparacao-caminhos.tsx` |
| Relatório legado do ACE | `patient/final-curadoria-view.tsx` |

## Componentes de decisão (modos Explica → Escuta)

| Componente | Onde |
|---|---|
| A porta que espera (convite pós-terceira carta) | dentro de `caminhos-panel.tsx` |
| Escolha entre os três (nenhum pré-selecionado) | `connection-choice-panel.tsx` |
| Revisão antes do ato (as verdades + a única reversibilidade) | `connection-choice-panel.tsx` (etapa `reviewing`) e revisões de `connection-progress-panel.tsx` / `relationship-status-panel.tsx` |

## Componentes de confirmação (modo Confirma)

| Componente | Onde |
|---|---|
| Eco neutro ("é assim que está registrado") | `contact-mode-panel.tsx`, ecos de `connection-progress-panel.tsx` |
| O difícil dito como fato | `ui/form-message.tsx` |
| Estados terminais quietos (zero CTA) | `connection-progress-panel.tsx`, `relationship-status-panel.tsx` |

## Componentes de continuidade (modo Acompanha)

| Componente | Onde |
|---|---|
| Quem está comigo + próximo passo possível | `patient/connection-progress-panel.tsx` |
| Acompanhamento vivo | `patient/relationship-status-panel.tsx` |
| A caminhada da jornada | `paciente/experiencia/journey-walk.tsx`; legado: `curadoria/jornada-timeline.tsx`, `patient-status-widget.tsx` |
| Memória de momentos | linha do tempo em `app/paciente/linha-do-tempo/page.tsx` (inline) + `profiles/patient-notifications-list.tsx` |
| Porta de retorno ao cômodo (Acompanhar) | `paciente/experiencia/curadoria-card.tsx` |
| O documento para levar | link PDF em `app/paciente/curadoria/page.tsx` + `patient/print-button.tsx` + página `imprimir` |

## Componentes do lugar (a casa em si)

| Componente | Onde |
|---|---|
| O corredor autenticado | `paciente/patient-shell.tsx` (+ `patient-nav-items.ts`, `authenticated-user-menu.tsx`) |
| A fachada pública | `PublicHeaderContainer`, `PublicFooter` |
| O limiar entre ambientes | `paciente/experiencia/limiar.tsx` |
| A espera com forma (skeletons rotulados) | `paciente/experiencia/skeletons.tsx` (Hero, Walk, Profile, Cartas, Comparação) |
| Moldura de conteúdo dela | `PatientCard`, `PatientPageHeader`, `patient-section-title` |

---

# 3 · Cada componente por dentro

Para não repetir o óbvio, o detalhamento cobre os componentes com decisão de experiência real; primitivos de formulário (`Input`, `Radio`, `Textarea`, `Button`) herdam integralmente a Linguagem e não têm voz própria.

| Componente | O que comunica | O que **nunca** comunica | Ambiente | Modo | Protagonista |
|---|---|---|---|---|---|
| Hero editorial | há um lugar, cuidado, com a porta destrancada | urgência, prova social, preço, Método | Entrada | Acolhe | ela (o momento dela) |
| Seções editoriais | o que este lugar é — por sobriedade | "comece agora", escassez, selo | Entrada | Acolhe/Explica | ela |
| AuthCard/login | a porta de quem retorna | erro como culpa; "cadastre-se" (não existe autocadastro, ADR-018) | Entrada | Escuta | ela |
| StoryStepLayout | uma pergunta por vez; o percurso sem número | contagem, cobrança, pressa | Recepção | Escuta | ela |
| AutosaveIndicator | o rascunho é seu e está guardado | vigilância ("estamos vendo você digitar") | Recepção | Confirma | ela |
| StoryConflictBanner | há duas versões — escolha a sua | erro dela | Recepção | Explica | ela |
| StoryNarrative/Summary | a história como ela contou, intacta | reescrita nossa | Recepção→Sala | Fala | ela |
| ProfileCard / ReconhecerPerfil | o caso dela organizado, na ordem dela; o gesto de responder | pontuação, vocabulário do Método, "confirme os dados" | Sala Particular | Fala | ela + Curador |
| Eco do Curador (CaminhosPanel) | a voz dele enquadrando: três legítimos, ordem de apresentação | veredito, "o melhor" | Sala (eco) | Fala | Curador |
| CartaCaminho | uma pessoa, por que está aqui, o que custa | número, destaque, defeito | Mesa | Fala/Mostra | Curador (autor) → ela (leitora) |
| Retrato | presença honesta sem foto falsa | rosto inventado | Mesa | Mostra | o profissional |
| Correspondência (frase+textura) | natureza da resposta ao Perfil dela | quantidade, nota, cor-veredito | Mesa | Mostra | ela (o critério é dela) |
| ComparacaoCaminhos | o que muda entre eles, nisto que importa | quem ganha | Mesa | Mostra | ela |
| Estados vazios | o que acontece, por quê, o que vem | falha, "vazio", contagem do que falta | todos | Acolhe | ela |
| Skeletons | a espera tem forma e rótulo | — (ver violação §7) | todos | — | sistema |
| Porta que espera (convite) | não há pressa; nada pré-escolhido | suficiência, "decida agora" | limiar da Decisão | Explica | ela |
| ConnectionChoicePanel | a escolha é sua; revisar antes | recomendação, pré-seleção, urgência | Sala da Decisão | Escuta | ela |
| Revisões de ato | o alcance do ato + a única reversibilidade verdadeira | "tem certeza?", segunda confirmação | Decisão/Acompanhamento | Explica→Confirma | ela |
| ContactModePanel | duas formas de começar; capacidade pendente dita | promessa de execução, prazo, modo padrão | Acompanhamento | Escuta | ela |
| ConnectionProgressPanel | quem ela escolheu; o que pode registrar quando quiser | cobrança, prazo, avaliação | Acompanhamento | Acompanha | ela |
| RelationshipStatusPanel | o acompanhamento como ela o declara | julgamento do profissional, reabertura | Acompanhamento | Acompanha | ela |
| JourneyWalk | onde ela está na caminhada; o percorrido permanece iluminado | funil, porcentagem | corredor | Mostra | ela |
| CuradoriaCard | o momento + a porta ("Acompanhar") | tarefa pendente | corredor | Acompanha | ela |
| Linha do tempo | a jornada virando memória | log de sistema | Acompanhamento | Acompanha | ela |
| PatientShell | a casa em volta, as quatro âncoras | outro sistema por área | lugar | — | a casa |
| Limiar | o nome do que se entra; separação | loading, progresso | entre ambientes | Silencia | a casa |
| FinalCuradoriaView | o relatório do motor antigo | — | fim da travessia | Fala | legado |
| PDF / imprimir | o documento que se leva | — | Mesa/saída | Mostra | ela |

---

# 4 · Classificação, com justificativa

**Manter** (cumprem Narrativa/Travessia/Linguagem; evoluem só em coerência material): Hero e seções editoriais · StoryStepLayout · AutosaveIndicator · StoryAttachments · StoryConflictBanner · StoryNarrative/Summary/ReviewItem · Retrato · Correspondência (forma nova) · ComparacaoCaminhos · CartaCaminho · eco do Curador · Limiar · ConnectionChoicePanel · ConnectionProgressPanel · ContactModePanel · RelationshipStatusPanel · FormMessage · PatientShell · CuradoriaCard · AmbientHero · PatientWelcome · estados vazios · ProfileCard · ReconhecerPerfil · PatientDocumentsPanel · PatientProfileForm · AuthCard e formulários de senha · PDF/PrintButton.

**Fundir:**
- `PatientEmptyState` + `EmptyJourneyState` (journey/) + `Vazio` (estados-vazios) + `SemCuradoria` → **uma família única de Estado Vazio** com variantes de conteúdo. Justificativa: cinco implementações do mesmo papel (dívida da Narrativa §9); o `journey/index.ts` já declara "uma implementação por papel conceitual" e o código a viola.
- `JornadaTimeline` (portal legado) + `JourneyWalk` → **uma Caminhada**. Duas representações da mesma jornada; a de `/paciente` é a viva.
- Linha do tempo inline de `linha-do-tempo/page.tsx` + `PatientNotificationsList` → **Memória de Momentos** única — hoje são duas listas de eventos com gramáticas diferentes.
- `PatientCard` + `LandingCard` + `Card` (ui) *no território dela* → **um Cartão dela** com variantes; a regra do vocabulário visual é "cartão significa sempre a mesma coisa" (F2 §12). (O `Card` de equipe permanece nos fundos.)

**Dividir:**
- `CaminhosPanel` → o eco (Sala) e a Mesa são dois papéis num componente (já dividido em percepção pela Travessia §4; a divisão estrutural é a consequência natural).
- `ConnectionChoicePanel` → a escolha (Escuta) e a revisão (Explica/Confirma) são dois modos; hoje coabitam com `step` interno. Divisão conceitual, sem mudança de comportamento.

**Eliminar** (da experiência dela — remoção física é decisão de engenharia):
- `patient-pulse` (animação infinita do JourneyWalk) — comportamento, não componente, mas nomeado aqui porque é o único elemento que **se move sozinho** na casa (proibido, F2 §9).
- Chips contáveis e barra de dez traços — já eliminados na Travessia implementada; registrados como formas banidas para nunca voltarem.

**Legado** (funcionam, não pertencem à casa; recuam até a aposentadoria formal):
- `FinalCuradoriaView` — formato do motor antigo; ordinais e caixa alta violam a Linguagem; recua como documento histórico datado (Travessia §4).
- `PatientStatusWidget`, `WhatsappContact`, superfícies de `/portal-paciente` — sem endereço vivo (301); conteúdo já re-abrigado pela Travessia §9.2.
- `landing/portal-*`, `landing/v2/*`, `golden-thread`, `video-section`, `faq-book-section` — geração anterior da Fachada, não importada pela página atual.
- `CuradoriaDecisionPanel` (patient/) — papel absorvido pelos painéis de Connection.

---

# 5 · As famílias

Nenhuma nasce por aparência; cada uma nasce de um papel na história:

1. **Portas** — o que faz atravessar: a porta da Fachada, a de quem retorna (login), a porta que espera (convite), a porta de voltar (CuradoriaCard). Uma porta sempre nomeia o destino e nunca empurra (L3).
2. **Limiares** — a pausa com nome entre ambientes. Sempre vazio + nome, nunca barra (L4).
3. **Perguntas** — o que escuta: os passos do contar, os campos, o modo de começar. Uma pergunta por vez, resposta confirmada antes da próxima.
4. **Cartas** — prosa de uma pessoa para outra: a carta do Curador (Encontro), a carta de um caminho, o eco do enquadramento. Serifa, autoria, data; termina em pergunta quando há dúvida honesta.
5. **Retratos** — presença de gente: retrato tipográfico do profissional, retrato do Curador, retratos em prosa. Nunca foto falsa (R13).
6. **Espelhos** — o que devolve o que é dela: a história relida, o Perfil organizado, as prioridades por zonas, a frase dela. A hierarquia é sempre a dela (R4).
7. **Correspondências** — como a prática encontra o Perfil: frase + textura de linha; a comparação por dimensão. Natureza, nunca quantidade (F2 §11.3).
8. **Escolhas** — os três com o mesmo peso + a saída de mesmo peso. Nenhum destaque, nenhum padrão marcado.
9. **Confirmações** — revisão antes do ato + eco neutro depois + assentamento. Nunca celebração (R do ritmo: celebrar, nunca).
10. **Acompanhamentos** — quem está comigo, o que posso registrar, a caminhada, a memória de momentos. Nomeiam quem, nunca quando.
11. **Estados vazios** — a espera dita em palavras: o que acontece, por quê, o que vem. Família única (fusão do §4).
12. **A casa** — shell, âncoras, camada ambiental, margem (metadados/proveniência). Contínua entre todos os cômodos (L2).

---

# 6 · Compartilhado × exclusivo

**Compartilhados entre ambientes** (a continuidade material da casa): a casa (shell, âncoras, margem) · limiares · portas · estados vazios · confirmações (eco/revisão) · FormMessage · primitivos de formulário · retrato do Curador (a mesma pessoa em todos os cômodos — L7).

**Exclusivos de um ambiente** (a identidade de cada cômodo):
- **Entrada:** hero, seções editoriais, fotografia (a fotografia não entra nos cômodos de decisão — F4 §11.2).
- **Recepção:** os passos do contar, o guardado discreto, anexos.
- **Sala Particular:** a carta do Encontro, o Perfil com zonas, o gesto de reconhecer.
- **Mesa:** cartas de caminho, correspondências, comparação, faixa do comum. **Nada da Mesa aparece em outro cômodo** — comparação fora da Mesa é o combustível do arrependimento (F3 §8).
- **Sala da Decisão:** a escolha entre três, a revisão da decisão, a frase dela.
- **Acompanhamento:** progresso, modo de começar, acompanhamento vivo, memória de momentos.

Regra de fronteira: **um componente exclusivo que alguém queira reusar noutro ambiente não é reuso — é vazamento de ambiente**, e a resposta é não (cada cômodo responde uma pergunta humana; o componente carrega a pergunta junto).

---

# 7 · Violações atuais, com o porquê

| Componente | Viola | Por quê |
|---|---|---|
| `FinalCuradoriaView` | Linguagem §6 (C) · F2 §6.2 | ordinais "Primeiro/Segundo/Terceiro caminho" leem como colocação; eyebrows em caixa alta (banida além de siglas) |
| `patient-section-title` (transversal) | F2 §6.2 | caixa alta com tracking em todos os títulos de seção dela — "caixa alta grita" |
| `patient-pulse` no `JourneyWalk` | F2 §9 | animação que se repete sem interação — o único movimento autônomo da casa |
| Skeletons (`skeletons.tsx`) | R16 / Linguagem §3 | "a espera é dita em palavras, nunca skeleton pulsante"; os rótulos existem (bom), a forma pulsante não deveria |
| `Retrato` | F2 §3 (regra de ouro) | usa gradiente e sombra pronunciada — nenhuma superfície tem gradiente; o conceito (iniciais determinísticas) está certo, a pele viola o material |
| Vídeo em autoplay/loop na Fachada | F2 §9 | movimento que se repete sem interação; a Fachada tem licença fotográfica, não cinética permanente |
| "Confirme sua escolha" (título da revisão) | Linguagem §2 (imperativo) | leve; a frase de corpo está correta — só o título carrega imperativo |
| `WhatsappContact` (portal legado) | LANDING_CREATIVE_DIRECTION §8 (já flagrado em 2026-07-15) | canal quebrado/placeholder; legado sem endereço |
| Duas pastas `paciente/` e `patient/` | governança (Narrativa §9) | mesma família em dois idiomas — não viola a experiência dela, viola a manutenção de quem a constrói |

*(As violações maiores anteriores — barra de dez traços, chips contáveis, blur de vidro, declaração de suficiência, abas-pílula — foram corrigidas na implementação da Travessia e constam lá.)*

---

# 8 · A matriz

Estado: ✅ conforme · ⚠ conforme com ressalva (§7) · 🕰 legado.

| Componente | Ambiente | Função (família) | Estado | Destino | Observações |
|---|---|---|---|---|---|
| HeroEditorial + backdrop | Entrada | Porta/Acolhimento | ⚠ | Manter | vídeo em loop a rever |
| Seções editoriais + FAQ | Entrada | Acolhimento | ✅ | Manter | |
| AuthCard + forms de senha | Entrada | Porta | ✅ | Manter | ganhar a luz da casa (Narrativa §9) |
| StoryStepLayout | Recepção | Pergunta | ✅ | Manter | referência da família |
| AutosaveIndicator | Recepção | Confirmação | ✅ | Manter | |
| StoryAttachments / ConflictBanner | Recepção | Pergunta | ✅ | Manter | |
| StoryNarrative / Summary / ReviewItem | Recepção→Sala | Espelho | ✅ | Manter | |
| PatientProfileForm | Recepção | Pergunta | ✅ | Manter | única tela sem cabeçalho (Narrativa §8) |
| ProfileCard / ReconhecerPerfil | Sala | Espelho/Carta | ✅ | Manter | recebem as zonas de `prioridades` (Travessia §9.2) |
| Eco do Curador | Sala (eco) | Carta | ✅ | Dividir (de CaminhosPanel) | já prosa, sem moldura |
| CartaCaminho | Mesa | Carta/Retrato | ✅ | Manter | chips já removidos |
| Retrato | Mesa | Retrato | ⚠ | Manter | trocar pele (gradiente) |
| Correspondência (frase+textura) | Mesa | Correspondência | ✅ | Manter | forma nova da Travessia §9.3 |
| ComparacaoCaminhos | Mesa | Correspondência | ✅ | Manter | seletor já sem cara de abas |
| ComparacaoNaoIniciada | Mesa | Estado vazio | ✅ | Fundir | na família única |
| Convite (porta que espera) | limiar Decisão | Porta | ✅ | Manter | sem suficiência (corrigido) |
| ConnectionChoicePanel | Decisão | Escolha | ⚠ | Dividir | título imperativo; escolha × revisão |
| Revisões de ato (3 painéis) | Decisão/Acomp. | Confirmação | ✅ | Manter | |
| ContactModePanel | Acompanhamento | Pergunta | ✅ | Manter | o contrato em forma de tela |
| ConnectionProgressPanel | Acompanhamento | Acompanhamento | ✅ | Manter | |
| RelationshipStatusPanel | Acompanhamento | Acompanhamento | ✅ | Manter | |
| JourneyWalk | corredor | Acompanhamento | ⚠ | Manter | remover pulso infinito; absorve `como-funciona` |
| CuradoriaCard | corredor | Porta | ✅ | Manter | |
| AmbientHero / PatientWelcome | corredor | Acolhimento | ✅ | Manter | |
| Linha do tempo + NotificationsList | Acompanhamento | Acompanhamento | ⚠ | Fundir | Memória de Momentos única; linguagem de registro→momento |
| PatientDocumentsPanel | Sala | Pergunta | ✅ | Manter | |
| PatientShell + nav + âncoras | lugar | Casa | ✅ | Manter | |
| Limiar | entre ambientes | Limiar | ✅ | Manter | nasceu na Travessia implementada |
| PatientCard / PageHeader / section-title | lugar | Casa | ⚠ | Fundir/Manter | caixa alta do section-title; unificação de cartões |
| Estados vazios (5 implementações) | todos | Estado vazio | ⚠ | Fundir | família única |
| Skeletons | todos | Casa | ⚠ | Manter | espera em palavras, sem pulso |
| FormMessage | todos | Confirmação | ✅ | Manter | |
| FinalCuradoriaView | fim da travessia | Documento | 🕰 | Legado | recuado, datado |
| PDF / PrintButton / imprimir | Mesa/saída | Documento | ✅ | Manter | botão oficial (feito) |
| PatientStatusWidget / JornadaTimeline / WhatsappContact | portal legado | — | 🕰 | Legado/Fundir | sem endereço vivo |
| landing portal-*/v2/golden-thread/video/faq-book | — | — | 🕰 | Legado | geração anterior, não importada |
| CuradoriaDecisionPanel | — | — | 🕰 | Legado | papel absorvido |

---

# 9 · A árvore da futura biblioteca visual

Arquitetura, não código. A biblioteca tem três andares — **a casa** (transversal), **as famílias** (papéis) e **os cômodos** (exclusivos) — e cada folha aponta para o componente real que hoje cumpre (ou cumprirá) o papel:

```
BIBLIOTECA DA EXPERIÊNCIA ALIVIAR
│
├── A CASA  (transversal a todos os cômodos)
│   ├── Materiais e vozes        ← tokens por material (papel, tinta, sage…), serifa/sem-serifa (R3, R18)
│   ├── Shell / o corredor       ← PatientShell + nav + AuthenticatedUserMenu
│   ├── As quatro âncoras        ← nome · Curador (CuratorAvatar) · história · percurso (L7)
│   ├── Camada ambiental         ← patient-ambient-layer / ambient-warmth
│   ├── Margem                   ← metadados, datas, proveniência (fora do corpo — R7)
│   ├── Limiar                   ← limiar.tsx (L4)
│   ├── Espera dita em palavras  ← skeletons rotulados, sem pulso (R16)
│   └── Estado Vazio (família única) ← fusão das 5 implementações
│
├── AS FAMÍLIAS  (papéis, reusáveis onde o papel existir)
│   ├── Portas          ← CTA da Fachada · AuthCard · convite · CuradoriaCard
│   ├── Perguntas       ← StoryStepLayout · campos · ContactModePanel
│   ├── Cartas          ← carta do Encontro · CartaCaminho · eco do Curador
│   ├── Retratos        ← Retrato (pele nova) · CuratorAvatar · retratos em prosa
│   ├── Espelhos        ← StoryNarrative · ProfileCard/zonas · a frase dela
│   ├── Escolhas        ← escolha entre três + saída de mesmo peso
│   ├── Confirmações    ← revisão de ato · eco neutro · FormMessage
│   └── Acompanhamentos ← ConnectionProgress · RelationshipStatus · JourneyWalk · Memória de Momentos
│
└── OS CÔMODOS  (exclusivos; o componente carrega a pergunta do ambiente)
    ├── Entrada          ← hero + seções editoriais + fotografia
    ├── Recepção         ← o contar (passos, anexos, guardado, conflito)
    ├── Sala Particular  ← carta do Encontro · Perfil por zonas · reconhecer · arquivo (documentos)
    ├── Mesa             ← faixa do comum¹ · cartas de caminho · correspondências · comparação
    ├── Sala da Decisão  ← escolha · revisão · frase dela¹
    ├── Acompanhamento   ← progresso · modo de começar · acompanhamento vivo · memória
    └── Saída / Documento ← PDF · documento histórico (legado datado)

¹ papéis previstos pelos documentos congelados (F2 §11.1-b; F7 §gesto) ainda sem componente
  dedicado no RC1 — nomeados aqui para que nasçam DENTRO da família certa, nunca soltos.
```

**Regra de crescimento da biblioteca:** componente novo só nasce se (1) nenhuma família o cobre, (2) responde a uma pergunta humana de um ambiente, e (3) passa as sete perguntas de aceitação da F2 §13.2. Um componente que precise de dois papéis é dois componentes.

---

> **Esta biblioteca não é uma coleção de peças — é o elenco de uma história.** Cada componente sabe em que cômodo atua, que modo de linguagem fala, quem é o protagonista da sua cena e o que jamais pode dizer. Quem for redesenhar qualquer peça começa por esta página, segue para a Linguagem, e só então abre o editor.
