# Crítica de Direção de Arte — A Porta de Entrada da Casa Aliviar

> **Status:** VALIDADA e IMPLEMENTADA (2026-08-01). O usuário aprovou: reescrita do mockup de pontos, vídeo em repouso digno (poster real + play explícito), e o storyboard completo dos 7 atos. A troca do asset do vídeo (conflito ADR-033 × DESIGN_SYSTEM §8, §1.3) permanece registrada como decisão pendente do usuário, sem prazo.
> **Método:** percurso real da Landing em viewport (1280×800 e 390×844), seção por seção, com o dev server vivo. Nove capturas de seção + hero mobile. Nenhuma conclusão vem de leitura de código.
> **Correção de registro:** as capturas de página inteira usadas nas rodadas anteriores distorcem esta página (backdrop fixo + compositing). Duas afirmações anteriores são retificadas no §1.6.
> **Herda:** [EXPERIENCE_BOOK_2_0.md](./EXPERIENCE_BOOK_2_0.md) (especialmente §12), SISTEMA_VISUAL R1–R20, ADR-045.
> **Data:** 2026-08-01

---

## 1 · Diagnóstico visual completo

### 1.1 O que a porta faz bem — e precisa ser preservado

**A chegada é digna da casa.** Serifa grande e calma, o azul institucional no lugar certo, a foto de ambiente real lavada até virar atmosfera, o qualificador em versalete com fios dourados. Ninguém confunde com startup. A frase — *"Uma decisão de saúde importante. Você não precisa tomá-la sozinho."* — é a tese da empresa dita sem promessa.

**A sala verde existe e funciona.** "Curadores independentes" sobre o verde profundo é o único corte de cena da página, e o bloco *"O que não fazemos"* dentro dela é o gesto de confiança mais forte da Landing inteira. Declarar limite é o que instituição faz e anúncio não faz.

**O texto é quase todo digno.** *"Escolher um médico virou um problema de navegação"*, *"Nós nunca perguntamos qual é o melhor médico"*, *"A pior hora para decidir"* — a voz está certa. A crítica abaixo é quase inteiramente de **composição e de cena**, não de palavra.

### 1.2 ACHADO GRAVE 1 — A porta mostra pontos que o Método aboliu

Na seção *"Suas prioridades, nas suas palavras"*, o cartão-mockup exibe:

> Acompanhamento contínuo — **40 pts** · Experiência — **35 pts** · Começar logo — **25 pts**

Dois problemas, um pior que o outro:

1. **É o modelo morto.** 40+35+25 = 100. Este é o orçamento de 100 pontos que a **ADR-042 substituiu pelo Mapa de Prioridades**. A fachada está anunciando um mecanismo que não existe mais no produto — uma mentira institucional involuntária, na primeira página que qualquer pessoa vê.
2. **É pontuação.** A plataforma inteira foi construída para que **nada tenha score** — R2, R5, a matriz de alturas irregulares, a célula em frase. E a porta de entrada mostra números somáveis ao lado das palavras da pessoa. Duas seções depois, a sala verde promete *"não vendemos posição em ranking"*. **A página desmente a própria promessa antes de fazê-la.**

Este é o defeito mais importante da Landing. Não é estético: é a alma do Método sendo contradita na vitrine.

### 1.3 ACHADO GRAVE 2 — O vídeo é um avatar cartoon

Em reprodução, o vídeo do Hero mostra **um personagem ilustrado em estilo cartoon**, num escritório ilustrado, com balão de fala **turquesa saturado**.

`docs/DESIGN_SYSTEM.md` §0 e §8 proíbem isso **nominalmente**: *"Nenhuma ilustração cartoon — diferente do tratamento visto na referência pública"*, e o §0 registra a rejeição deliberada do avatar cartoon da referência `aliviar-temp`. `docs/BRAND_GUIDELINES.md`: fotografia editorial real, nunca infantilização. O turquesa do balão é, literalmente, a paleta da referência rejeitada.

**Conflito documental que não me cabe resolver:** a ADR-033 fez do vídeo o protagonista da Landing. O *asset* em uso contradiz o cânone visual da marca. Trocar o vídeo é decisão de produção (asset oficial), não de direção de arte — mas **a composição em volta dele é minha responsabilidade**, e hoje ela dá o palco principal a um elemento que veste a identidade rejeitada. O §6 propõe o tratamento; a decisão sobre o asset fica registrada para o usuário.

### 1.4 ACHADO 3 — O acordeão banido está na FAQ

"Dúvidas frequentes" é um acordeão: quatro perguntas fechadas com botões `+`. O SISTEMA_VISUAL §12 lista o *acordeão de FAQ* entre os **cinco elementos banidos**: *"esconder o que importa é confessar que não importa"*. Entre as perguntas escondidas: **"Quanto custa?"** — a dúvida mais sensível de quem está com medo, atrás de um clique.

E a resposta aberta diz *"uma conversa com **nossa equipe** organiza seus próximos passos"* — o residual "equipe sem rosto" (D-C1) que as auditorias já condenaram, no único lugar da página que responde a quem não sabe por onde começar.

### 1.5 Os dois problemas de composição estrutural

**O template repetido.** "O cenário atual" e "O Método" têm a MESMA composição: eyebrow dourado centrado → título serifado centrado → subtítulo → **três cartões da mesma altura em linha**. Duas seções consecutivas com a mesma sensação — o que o próprio briefing define como problema de direção de arte. E três cartões iguais em linha são **contáveis** (tensão com P4/R5): a mancha visual é "1, 2, 3", duas vezes seguidas.

**As duas portas na mesma parede.** "Contar minha história" (navy, sólido) e "Entrar na minha Jornada" (contorno) lado a lado, competindo. Falam com públicos diferentes — quem nunca entrou e quem já mora — mas estão compostos como alternativas da mesma pessoa. O primeiro gesto que a página pede de quem chegou com medo é **descartar uma opção que não era para ela**. O "Entrar" do cabeçalho já cumpre o papel do segundo botão.

### 1.6 Retificações de registro (contra as rodadas anteriores)

1. **"O vídeo é um retângulo preto"** — falso em uso real. O preto era o poster ausente antes do autoplay; em reprodução é o cartoon do §1.3. O problema é outro e é maior.
2. **"Duas telas inteiras de vazio após o Hero"** — falso. Frames obsoletos do compositing do painel. As seções são contíguas; o excesso de respiro é **uniformidade** (8,5–12rem idênticos em toda seção), não buracos.

---

## 2 · Mapa do olhar

**Entrada.** O olho entra pela frase serifada — correto e forte.

**Percurso no Hero.** frase → subtítulo → **bifurcação nos dois botões** (primeira hesitação) → o cartão de vídeo, que em autoplay se move e **vence a disputa pelo olhar** com um personagem cartoon. O último elemento visto acima da dobra é o que menos pertence à marca.

**Percurso nas seções.** Em cada uma: eyebrow → título → cartões. Como o template se repete, a partir da segunda seção o olho **para de ler e passa a reconhecer** — "mais três cartões" — e desliza. A monotonia converte leitura em rolagem.

**Onde o olhar finalmente para:** na sala verde. O único corte real de cena da página. Prova de que o instrumento funciona — foi usado uma vez só.

**Saída.** FAQ (fechada, olho sem apoio) → rodapé navy. A última coisa lida é *"Você não precisa decidir sozinho"* — bom fecho; a penúltima é um acordeão com "Quanto custa?" escondido — má véspera.

## 3 · Mapa do ritmo

| Seção | Sensação atual | Batida |
|---|---|---|
| Hero | contemplação + hesitação (2 CTAs) + ruído (vídeo) | **aberta, instável** |
| O cenário atual | leitura leve, 3 cartões | média |
| O Método | **idêntica à anterior** | média — repetida |
| Caminho claro | lista 01/02/03 espaçada | média-aberta |
| Suas prioridades | mockup + pontos | média |
| Um documento | mockup de novo (2ª vez seguida: título à esquerda + cartão à direita) | média — repetida |
| Sala verde | **corte** — o único | funda |
| FAQ | fechada, sem leitura | curta |
| Rodapé | assinatura | fecho |

**Diagnóstico:** sete batidas médias, um corte, nenhuma passagem densa e nenhum silêncio deliberado. A página é um metrônomo com um único acento. Ritmo não se conserta com espaçamento: se conserta **fundindo o que é igual e adensando o que é explicação**.

## 4 · Mapa das atmosferas

Estados emocionais pretendidos vs. o que a composição entrega:

| Ato pretendido | Seções | O que entrega hoje |
|---|---|---|
| **Chegada** — "estou num lugar seguro" | Hero | segurança na frase; instabilidade nos 2 CTAs; ruptura no cartoon |
| **Escuta** — "eles sabem o que estou passando" | cenário | correta, mas em formato de vitrine (3 cards) |
| **Compreensão** — "existe um jeito" | método + caminho | dita duas vezes, nunca com densidade de explicação real |
| **Confiança** — "vou receber algo concreto" | prioridades + documento | quebrada pelos pontos (§1.2) |
| **Segurança** — "eles têm limites" | sala verde | **a melhor da página** |
| **Convite** — "posso começar" | FAQ + rodapé | morna; a FAQ fechada não desarma as últimas dúvidas |

## 5 · Elementos — remover, preservar, redesenhar

**PRESERVAR (não tocar):**
- A frase do Hero e a foto-atmosfera.
- A sala verde inteira, com "O que não fazemos".
- O texto de "O cenário atual" e do "Caminho claro".
- O rodapé (corrigido na rodada 2.1).
- Os limiares de luz entre seções.

**REMOVER:**
- **O segundo CTA do Hero** ("Entrar na minha Jornada") — o cabeçalho já o oferece.
- **Os pontos do mockup de prioridades** (40/35/25 pts) — modelo morto + score na vitrine.
- **O acordeão da FAQ** — as respostas ficam abertas; quatro perguntas com respostas curtas não precisam de mecanismo.
- **"nossa equipe"** na resposta da FAQ → o Curador nomeado (uma linha; mudança de copy mínima e cirúrgica).

**REDESENHAR:**
- **A cena do vídeo** (§6, Ato I) — poster de fotografia real, play explícito, sem autoplay; o cartoon deixa de ser a primeira coisa em movimento da marca. *(A substituição do asset em si fica registrada como decisão do usuário — §1.3.)*
- **"O Método" + "Caminho claro"** → fundem-se na **passagem densa** da página.
- **"Suas prioridades" + "Um documento"** → fundem-se num único bloco sobre o que a pessoa recebe, com o mockup reescrito na gramática do Mapa (frases dela + peso em palavra: *"o mais importante"*, *"muito importante"* — zero números).
- **O ritmo global** — respiros deixam de ser uniformes: a página ganha a batida do §6.

## 6 · Storyboard da nova Landing

**Ato I — A PORTA** *(aberta, estável)*
A frase, o subtítulo, **uma única porta**: "Contar minha história". Abaixo, a cena do vídeo em repouso digno: fotografia real como poster, botão de play discreto, legenda curta ("Conheça a Aliviar — 2 min"). Nada se move até ser convidado. O primeiro movimento da página passa a ser **da pessoa**, não do marketing.

**Ato II — O ESPELHO** *(média, reconhecimento)*
"O cenário atual" como está — é onde a pessoa se vê. Os três cartões viram **três parágrafos com fio lateral**, empilhados com alturas naturais (não três caixas contáveis de mesma altura).

**Ato III — RESPIRO** *(vazio deliberado)*
Uma linha só, muito ar: a ponte emocional entre "o problema é esse" e "existe um jeito". O único grande respiro da página — e por ser único, significa.

**Ato IV — O MÉTODO** *(a passagem densa — a que hoje não existe)*
Fusão de "O Método" + "Caminho claro" numa peça editorial de coluna estreita: a pergunta que nunca fazemos, a que fazemos, e os quatro passos em texto corrido com os numerais dourados na margem. Leitura de verdade, medida de 60–68 caracteres. Quem quer entender, entende **aqui**, num só lugar, com densidade que respeita a inteligência.

**Ato V — O QUE VOCÊ RECEBE** *(média, concreta)*
Fusão de "prioridades" + "documento": à esquerda o texto; à direita **um único mockup** — o retrato das prioridades na gramática real do produto: as frases dela em serifa, o peso dito em palavra, e a moldura do documento ("Sua Jornada — quem está cuidando, com nome e data"). A vitrine passa a mostrar **o que a casa realmente entrega**.

**Ato VI — A SALA VERDE** *(o corte — intocada)*
Curadores independentes + o que não fazemos. Já é o melhor momento; agora é também o único bloco escuro entre duas superfícies claras enxutas, e o contraste sobe sem mexer em nada.

**Ato VII — AS ÚLTIMAS DÚVIDAS** *(curta, aberta)*
FAQ sem acordeão: quatro perguntas, quatro respostas visíveis, em duas colunas de leitura. "Quanto custa?" à vista. A resposta de "por onde começar" aponta para o Curador, não para "nossa equipe".

**Fecho** — rodapé como está.

**O gesto da marca (discreto):** a porta única do Ato I ganha uma **soleira** — o fio dourado fino que já é o acabamento dos eyebrows, revelando-se sob o CTA no hover/focus, da esquerda para a direita, nos 480ms de travessia. É o mesmo gesto que a casa usa por dentro (link-underline), promovido a assinatura da entrada: **a porta que se abre devagar**. Nunca pisca, nunca salta.

## 7 · Justificativa artística, mudança a mudança

| Mudança | Justificativa |
|---|---|
| Uma porta só | O primeiro gesto de quem tem medo não pode ser descartar uma opção. Hesitação na soleira é ansiedade fabricada. |
| Vídeo em repouso digno | O que se move sem convite compete com quem chegou. E o cartoon veste a identidade que a marca rejeitou nominalmente — enquanto o asset existir, a cena o contém em vez de promovê-lo. |
| Cartões → parágrafos com fio | Três caixas iguais são contáveis; parágrafos com alturas naturais são lidos. A mancha deixa de dizer "1, 2, 3" e passa a dizer "alguém me explicou". |
| A passagem densa | Confiança nasce de entender. Uma página que só tem blocos rasos diz "não se preocupe com os detalhes" — que é exatamente o que gera desconfiança em saúde. Densidade única e bem posta = respeito. |
| Mockup sem pontos | A vitrine não pode contradizer a alma do produto. O Mapa em frases e pesos-palavra mostra o que existe — e mostra que aqui **nada é nota**. |
| FAQ aberta | Esconder "quanto custa" atrás de um clique é o gesto de quem tem algo a esconder. Abrir é o gesto de quem não tem. |
| Respiro único (Ato III) | Vazio uniforme não significa; vazio único significa. A pausa passa a existir porque o resto ficou mais denso. |
| A soleira dourada | O gesto pedido: discreto, elegante, memorável, e **já pertence à casa** — não inventa vocabulário novo, promove o existente. |

## 8 · O que esta crítica NÃO propõe

- **Trocar o asset do vídeo** — decisão de produção/negócio (conflito documentado no §1.3).
- **O bloco do Curador com rosto e nome** — depende de pessoa real e decisão de privacidade (Experience Book §12.6); continua registrado como a lacuna nº 1 de conteúdo.
- **Reescrever copy além das duas cirurgias citadas** (pontos do mockup; "nossa equipe" na FAQ) — o texto é governado por LANDING_UX_WRITING e não é o problema.
- **Tocar em qualquer coisa fora da Landing.**

---

**Implementação: somente após validação desta crítica.**
