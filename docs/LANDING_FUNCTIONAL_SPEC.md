# Especificação Funcional da Experiência — Landing

Contrato de comportamento, não de interface. Não decide componente, biblioteca, framework ou código — descreve o que cada seção da Landing precisa **fazer**, para que qualquer implementação (a atual ou uma futura reescrita) possa ser verificada contra ele. Não redefine `docs/LANDING_CREATIVE_DIRECTION.md` (estrutura/ADR-017), `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` (intenção emocional) nem `docs/LANDING_UX_WRITING.md` (conteúdo) — os três permanecem inalterados e são a fonte de cada regra abaixo.

**Base de verificação**: como a Landing real já existe e implementa a maior parte desta jornada, este documento descreve o comportamento **já verificado em produção** (marcado **[REAL]**) sempre que possível, em vez de especificar no vácuo — um contrato funcional é mais confiável quando é também um retrato fiel do que já funciona. Onde a especificação vai além do que existe hoje, o bloco é marcado **[ESPECIFICADO, NÃO VERIFICADO]**. Divergências entre este contrato e a implementação real são tratadas só na Parte 3 (Auditoria), nunca corrigidas aqui.

---

## Motor compartilhado — Hero, Vídeo, Como Funciona, Benefícios, Processo, Por Que Confiar

Seis das doze seções (2, 4, 5, 6, 7, 8) vivem dentro de um único ambiente contínuo, não são telas separadas. O comportamento abaixo é comum a todas elas; cada seção, na Parte 1, especifica só o que a diferencia dentro deste motor.

- **Objetivo funcional do motor**: apresentar uma sequência de "paradas" de conteúdo dentro de um mesmo ambiente visual persistente, de forma que o visitante nunca perceba uma transição de página, só uma progressão contínua.
- **Gatilho de entrada**: o ambiente começa a ser exibido assim que a Landing carrega, na primeira parada (Hero).
- **Gatilho de saída**: o ambiente termina quando o visitante rola até o fim de sua extensão total; a última parada (Processo) se dissolve gradualmente para a seção seguinte (FAQ).
- **Comportamento durante scroll**: a posição de rolagem dentro da extensão total do ambiente determina, de forma contínua, qual parada está em foco. Luz ambiente, intensidade de presença e temperatura visual interpolam suavemente entre paradas vizinhas, cada canal com seu próprio ritmo de resposta, propositalmente dessincronizado dos demais. Uma parada específica (Respiro, dentro de "Hero → Como Funciona") é um platô: o ambiente chega a um estado e permanece nele por toda a extensão dessa parada, sem avançar perceptivelmente, mesmo com o visitante continuando a rolar dentro dela.
- **Animações esperadas (conceitual)**: dissolução contínua entre enquadramentos de uma mesma fotografia (nunca corte abrupto); um traço/fio visual sempre presente, com um pulso muito sutil e constante (nunca ligado a progresso); halo de luz e bordas que se deslocam e mudam de temperatura devagar; uma oscilação mínima e lenta, independente do scroll, para que o ambiente nunca pareça congelado mesmo parado.
- **Comportamento em mobile**: idêntico em lógica ao desktop — mesma sequência de paradas, mesmo motor de interpolação; a diferença é só de proporção e legibilidade de texto, nunca remoção de comportamento.
- **Comportamento em desktop**: mesmo motor; mais espaço permite que o cartão de conteúdo de cada parada tenha folga adicional ao redor.
- **Estados possíveis do motor**: `carregando` (antes de pronto) → `ativo — parada N` (uma por parada, N de 0 a 7) → `saindo` (dissolvendo para a seção seguinte). Um estado paralelo, `movimento reduzido`, substitui toda a lógica de scroll por uma lista estática vertical de todo o conteúdo, sem nenhuma perda de informação — só da encenação.
- **CTAs disponíveis**: só na parada Hero (ver seção 2) — nenhuma outra parada deste motor interrompe a leitura com uma ação.
- **Regras de acessibilidade**: movimento reduzido é uma preferência de sistema respeitada automaticamente, nunca uma opção que o visitante precisa descobrir/configurar dentro da página; todo o conteúdo textual de cada parada precisa estar disponível e legível por leitor de tela independentemente do estado visual/animado; nenhuma informação existe *apenas* como efeito visual.
- **Dependências**: nenhuma parada depende de uma ação do visitante em outra — a única dependência é de ordem (a sequência narrativa é fixa).
- **Critério de sucesso do motor**: o visitante não deveria conseguir apontar o instante exato em que uma parada terminou e a seguinte começou.

---

## Parte 1 — As 12 seções

### 1. Header

- **Objetivo funcional**: acesso permanente à identidade da marca e ao login, independentemente de onde o visitante está na página.
- **Comportamento esperado [REAL]**: fixo no topo, visível durante toda a leitura, nunca some ao rolar.
- **Gatilho de entrada**: imediato, ao carregar a página.
- **Gatilho de saída**: nunca sai — é permanente.
- **Animações esperadas**: uma diminuição sutil de altura e o surgimento de uma sombra leve depois de uma pequena rolagem inicial — sinal discreto de profundidade, nunca abrupto.
- **Comportamento durante scroll**: reage apenas à passagem de um limiar mínimo de rolagem (compactação); não reage a nenhuma outra posição além disso.
- **Comportamento mobile/desktop**: idêntico em comportamento; só a área de toque/proporção muda.
- **Estados possíveis**: `expandido` (topo da página) / `compacto` (após rolar).
- **Mensagens exibidas**: nenhuma — só identidade (nome da marca) e um convite (login).
- **CTAs disponíveis**: "Entrar" (para quem já tem conta).
- **Regras de acessibilidade**: alvo de toque com área mínima adequada; contraste mantido em ambos os estados (expandido/compacto); foco de teclado visível.
- **Dependências**: nenhuma.
- **Critérios de sucesso**: sempre alcançável, nunca cobre conteúdo abaixo dele de forma a esconder uma ação importante.

### 2. Hero

- **Objetivo funcional**: comunicar, no primeiro instante, a promessa central e oferecer uma única ação possível.
- **Comportamento esperado [REAL]**: é a primeira parada do motor compartilhado — título e ação aparecem centralizados, sem nenhum outro elemento competindo por atenção.
- **Gatilho de entrada**: imediato, ao carregar a página (parada 0 do motor).
- **Gatilho de saída**: início da rolagem, transição para a parada de silêncio (Respiro).
- **Animações esperadas**: nenhuma própria além da que o motor já descreve — o texto está presente desde o início, não "entra" com efeito.
- **Comportamento durante scroll**: permanece em foco total até o visitante começar a rolar; a partir daí, cede lugar suavemente à parada seguinte.
- **Mobile/desktop**: mesmo conteúdo; título quebra em menos linhas em telas largas.
- **Estados possíveis**: `em foco` (parada ativa) / `fora de foco` (depois que o visitante avança).
- **Mensagens exibidas**: a promessa central da marca, em uma frase.
- **CTAs disponíveis**: uma ação primária única — iniciar o relato da própria história.
- **Regras de acessibilidade**: título como cabeçalho principal da página (hierarquia semântica); ação com foco de teclado alcançável antes de qualquer rolagem.
- **Dependências**: nenhuma — é o ponto de entrada.
- **Critérios de sucesso**: o visitante entende a promessa sem precisar rolar; a ação é encontrável sem procurar.

### 3. CTA principal

- **Objetivo funcional**: dar ao visitante uma única ação possível logo na chegada.
- **Comportamento esperado [REAL]**: não é uma seção própria — é a ação embutida na parada Hero (ver seção 2). Este item existe na lista das 12 seções oficiais por herança da estrutura original; funcionalmente, hoje, é parte de outra parada.
- **Gatilho de entrada/saída**: idêntico ao da Hero.
- **Estados possíveis**: `disponível` (padrão) / `em foco de teclado` / `pressionado`.
- **Mensagens exibidas**: nenhuma além do próprio rótulo da ação.
- **CTAs disponíveis**: iniciar o relato da história (ação primária).
- **Regras de acessibilidade**: rótulo claro sem depender de contexto visual ao redor para ser entendido por leitor de tela.
- **Dependências**: parte da seção 2 (Hero).
- **Critérios de sucesso**: nenhuma ambiguidade sobre o que essa ação faz antes de ser ativada.

### 4. Vídeo institucional

- **Objetivo funcional [REAL]**: sustentar presença humana silenciosa ao longo de um trecho da jornada — não explicar, não apresentar.
- **Comportamento esperado**: acompanha três paradas consecutivas do motor (Triagem, Análise, início da Curadoria), sem controle de reprodução manual exposto, sem som.
- **Gatilho de entrada**: início da parada "Triagem".
- **Gatilho de saída**: início da parada "Benefícios" — a saída é conduzida continuamente pelo progresso do scroll ao longo da parada "Curadoria" (opacidade e nitidez diminuem gradualmente), nunca um corte.
- **Animações esperadas**: entrada silenciosa (sem fade dramático); saída com leve perda de nitidez e escala reduzida, sincronizada ao scroll, nunca a um tempo fixo.
- **Comportamento durante scroll**: sua presença (opacidade) é função direta da posição de rolagem dentro do trecho de saída — rolar de volta o traz de volta, sem reiniciar do zero.
- **Mobile/desktop**: mesmo comportamento; ocupa proporcionalmente menos espaço em mobile.
- **Estados possíveis**: `ausente` (antes da Triagem) / `presente` / `saindo` (dentro do trecho Curadoria→Benefícios) / `ausente` (depois).
- **Mensagens exibidas**: nenhuma.
- **CTAs disponíveis**: nenhum.
- **Regras de acessibilidade**: puramente decorativo/ambiental — não deve carregar nenhuma informação que não esteja também disponível em texto em outra parte da página; com movimento reduzido, não aparece.
- **Dependências**: posicionado dentro do motor compartilhado, entre as paradas Triagem e Curadoria/Benefícios.
- **Critérios de sucesso**: percebido como companhia, nunca como elemento a ser operado.

### 5. Como funciona

- **Objetivo funcional [REAL]**: comunicar que existe uma sequência com começo, meio e fim, sem detalhar o mecanismo interno.
- **Comportamento esperado**: três paradas curtas e sucessivas do motor (Triagem, Análise, abertura de Curadoria), cada uma com um rótulo mínimo.
- **Gatilho de entrada**: fim da parada Respiro.
- **Gatilho de saída**: início da parada Benefícios.
- **Animações esperadas**: mesmas do motor — nenhuma animação própria de destaque; a progressão de luz/temperatura/intensidade entre as três paradas comunica avanço.
- **Comportamento durante scroll**: cada uma das três paradas ocupa sua própria fatia da rolagem total, com transição contínua entre elas.
- **Mobile/desktop**: idêntico.
- **Estados possíveis**: `Triagem em foco` / `Análise em foco` / `Curadoria (abertura) em foco`.
- **Mensagens exibidas**: um rótulo curto por parada, e uma frase de fechamento na terceira, afirmando que o caso é entendido antes de qualquer indicação aparecer.
- **CTAs disponíveis**: nenhum.
- **Regras de acessibilidade**: os três rótulos devem ser legíveis em sequência por leitor de tela, mesmo sem o efeito visual de transição.
- **Dependências**: motor compartilhado; segue Respiro, precede Benefícios.
- **Critérios de sucesso**: o visitante entende que existe processo e cuidado, sem precisar (nem conseguir) entender o mecanismo interno.

### 6. Benefícios

- **Objetivo funcional [REAL]**: transformar a promessa em garantias concretas e verificáveis.
- **Comportamento esperado**: uma parada do motor com três afirmações apresentadas juntas, cada uma com um título curto e uma frase de apoio.
- **Gatilho de entrada**: fim da parada "Curadoria" (abertura).
- **Gatilho de saída**: início da parada "Por que confiar".
- **Animações esperadas**: mesmas do motor; nenhum efeito de entrada sequencial entre as três — aparecem como um conjunto único.
- **Mobile/desktop**: mesmas três afirmações; em mobile, empilhadas com o mesmo espaçamento relativo.
- **Estados possíveis**: `em foco` / `fora de foco`, como parte do motor.
- **Mensagens exibidas**: três pares título/descrição, cada um respondendo a um medo específico (perder-se no processo, repetir a história, ficar sem suporte).
- **CTAs disponíveis**: nenhum.
- **Regras de acessibilidade**: as três afirmações devem ter uma ordem de leitura lógica (não depender de posição espacial para fazer sentido).
- **Dependências**: motor compartilhado; segue Como Funciona, precede Por Que Confiar.
- **Critérios de sucesso**: cada afirmação deveria ser, por si só, suficiente para reduzir uma ansiedade específica.

### 7. Processo

- **Objetivo funcional [REAL]**: projetar o que vem depois da curadoria, sem prometer prazo.
- **Comportamento esperado**: última parada de conteúdo do motor antes da transição para o FAQ — uma frase de abertura, uma lista curta de etapas futuras, uma frase de fechamento que sinaliza (sem nomear) que dúvidas serão respondidas a seguir.
- **Gatilho de entrada**: fim da parada "Por que confiar".
- **Gatilho de saída**: início da dissolução para a seção de FAQ (Biblioteca).
- **Animações esperadas**: mesmas do motor; hierarquia visual deliberadamente menor que a da Hero e do CTA Final — esta parada nunca deveria competir com os extremos da jornada.
- **Mobile/desktop**: mesma lista, centralizada em ambos.
- **Estados possíveis**: `em foco` / `dissolvendo` (transição final do motor).
- **Mensagens exibidas**: uma frase de abertura, uma lista de 3 etapas futuras, uma frase de fechamento.
- **CTAs disponíveis**: nenhum.
- **Regras de acessibilidade**: lista lida em ordem sequencial correta por leitor de tela.
- **Dependências**: última seção do motor; sua saída aciona a transição visual (dissolução de cor) para a seção 10 (FAQ).
- **Critérios de sucesso**: o visitante termina esta parada sentindo que sabe o que esperar a seguir, sem uma data.

### 8. Por que confiar

- **Objetivo funcional [REAL]**: comunicar critério sem soar como avaliação fria.
- **Comportamento esperado**: parada do motor com três afirmações de critério, cada uma declarando um limite (o que nunca acontece) em vez de uma afirmação de grandeza.
- **Gatilho de entrada**: fim da parada "Benefícios".
- **Gatilho de saída**: início da parada "Processo".
- **Animações esperadas**: mesmas do motor.
- **Mobile/desktop**: mesmas três afirmações, mesma lógica de empilhamento.
- **Estados possíveis**: `em foco` / `fora de foco`.
- **Mensagens exibidas**: três pares título/descrição sobre critério de curadoria, revisão humana obrigatória e ausência de encaixe genérico.
- **CTAs disponíveis**: nenhum.
- **Regras de acessibilidade**: mesma exigência de ordem lógica de leitura da seção 6.
- **Dependências**: motor compartilhado; segue Benefícios, precede Processo.
- **Critérios de sucesso**: o visitante sente que existe critério humano real, sem nenhuma alegação não verificável.

### 9. Concierge de Saúde

- **Objetivo funcional [ESPECIFICADO]**: oferecer uma via de continuidade fora do site, sem parecer abandono.
- **Comportamento esperado [REAL]**: não existe como parada própria do motor — é o segundo botão, secundário, da seção 11 (CTA Final). Este item também existe na lista das 12 por herança da estrutura original; funcionalmente hoje é parte da seção 11.
- **Gatilho de entrada/saída**: idêntico ao da seção 11.
- **Estados possíveis**: `disponível` / `em foco de teclado` / `pressionado`.
- **Mensagens exibidas**: um convite a continuar a conversa por outro canal.
- **CTAs disponíveis**: uma ação secundária, alternativa à ação primária da seção 11.
- **Regras de acessibilidade**: distinguível da ação primária por hierarquia visual e por ordem de foco de teclado (secundária vem depois da primária).
- **Dependências**: parte da seção 11.
- **Critérios de sucesso**: o visitante entende que sair para esse canal não é perder o que já construiu na página.

### 10. FAQ

- **Objetivo funcional [REAL]**: resolver, uma a uma, as dúvidas mais prováveis de quem ainda não decidiu.
- **Comportamento esperado**: uma sequência própria e independente do motor principal — um conjunto fixo de pares Dúvida/Solução, apresentados um de cada vez, com uma transição de "virada" entre um e o próximo.
- **Gatilho de entrada**: fim da dissolução do motor principal (seção 7 → 10).
- **Gatilho de saída**: depois do último par ser lido, transição para o CTA Final.
- **Animações esperadas (conceitual)**: cada dúvida "vira" para revelar sua solução, como a página de um livro físico — girando a partir de uma borda fixa, nunca do centro; um leve aprofundamento de sombra durante o giro, simulando peso real; a peça sai de cena suavemente depois de revelada, dando lugar à próxima.
- **Comportamento durante scroll**: esta seção "prende" a rolagem por uma extensão própria — o avanço de uma dúvida para a próxima é conduzido pela rolagem dentro desse trecho reservado, não pela rolagem geral da página. Antes da primeira e depois da última dúvida, há um intervalo de assentamento (a dúvida permanece parada, sem avançar) para que o início e o fim nunca pareçam abruptos.
- **Comportamento adicional**: também avança por toque/clique direto e por teclado (setas), como alternativa à rolagem — sempre respeitando o mesmo marco de posição de cada dúvida, nunca uma distância arbitrária.
- **Mobile/desktop**: mesmo mecanismo; card ocupa proporcionalmente mais largura em mobile.
- **Estados possíveis**: `assentando (primeira dúvida)` → `virando (dúvida N)` → `saindo (dúvida N)` → ... → `assentando (última dúvida)`.
- **Mensagens exibidas**: um par Dúvida/Solução por vez; um indicador textual de posição ("pergunta X de Y") disponível para tecnologia assistiva mesmo quando não exibido visualmente.
- **CTAs disponíveis**: nenhum próprio — a seção inteira é navegação, não conversão.
- **Regras de acessibilidade**: operável inteiramente por teclado; com movimento reduzido, todos os pares são exibidos ao mesmo tempo, em lista, sem o mecanismo de virada; anúncio de posição atual para leitor de tela a cada mudança.
- **Dependências**: independente do motor principal; depende apenas de vir depois da seção 7 e antes da seção 11.
- **Critérios de sucesso**: cada dúvida real do visitante encontra uma resposta antes de ele chegar ao convite final.

### 11. CTA Final

- **Objetivo funcional [REAL]**: fazer o único convite explícito de toda a página, depois de toda a confiança já construída.
- **Comportamento esperado**: seção própria, fora do motor principal e da FAQ — título, e duas ações (primária e secundária, ver seção 9).
- **Gatilho de entrada**: fim da seção FAQ.
- **Gatilho de saída**: início do Rodapé.
- **Animações esperadas**: entrada suave conforme a seção se aproxima da área visível (nunca abrupta); nenhuma outra animação própria.
- **Comportamento durante scroll**: aparece uma vez e permanece estática — não há mecanismo de rolagem interno.
- **Mobile/desktop**: as duas ações ficam empilhadas em mobile, lado a lado em desktop.
- **Estados possíveis**: `fora da área visível` / `visível`.
- **Mensagens exibidas**: uma frase que nega explicitamente a urgência, reforçando que não há pressa.
- **CTAs disponíveis**: ação primária (iniciar o relato da história) e ação secundária (continuar por outro canal, ver seção 9).
- **Regras de acessibilidade**: ordem de foco de teclado segue a hierarquia visual (primária antes da secundária); contraste adequado sobre o fundo desta seção especificamente (o fundo aqui é mais escuro que o resto da página).
- **Dependências**: segue FAQ, precede Rodapé.
- **Critérios de sucesso**: o visitante entende que pode agir agora ou depois, sem diferença de tratamento.

### 12. Footer

- **Objetivo funcional [REAL]**: encerrar a experiência sem terminar de forma seca, e oferecer navegação de apoio.
- **Comportamento esperado**: última seção da página — uma frase de encerramento emocional, uma descrição curta da marca, links de navegação, aviso de direitos autorais.
- **Gatilho de entrada**: fim da seção CTA Final.
- **Gatilho de saída**: nenhum — é o fim da página.
- **Animações esperadas**: entrada suave conforme se aproxima da área visível, mesma técnica de entrada usada em outras seções fora do motor principal.
- **Comportamento durante scroll**: nenhum mecanismo próprio além da entrada.
- **Mobile/desktop**: navegação empilhada em mobile, em colunas em desktop.
- **Estados possíveis**: `fora da área visível` / `visível`.
- **Mensagens exibidas**: uma frase de encerramento que ecoa a frase de abertura da Hero; uma descrição curta da proposta; links de navegação interna.
- **CTAs disponíveis**: links de navegação (não são CTAs de conversão).
- **Regras de acessibilidade**: marcado semanticamente como rodapé da página; todos os links com destino claro e foco de teclado visível.
- **Dependências**: última seção; nenhuma seção depende dela.
- **Critérios de sucesso**: o visitante sai da página com a mesma sensação de companhia com que entrou, mesmo sem clicar em nada.

---

## Parte 2 — Consolidação

### 1. Fluxo funcional completo

```
Header (permanente)
  │
  ▼
[Motor do Portal — rolagem contínua]
Hero (2/3) → Respiro → Como Funciona (5) → Benefícios (6) →
Por Que Confiar (8) → Processo (7)
  │  (dissolução)
  ▼
FAQ (10) — sequência própria, presa à rolagem, avança por
  rolagem/toque/teclado, dúvida por dúvida
  │
  ▼
CTA Final (11 + 9, ação secundária)
  │
  ▼
Footer (12)
```

Nenhum ramo alternativo — a jornada é sempre linear, na mesma ordem, para todo visitante. A única bifurcação é a escolha entre as duas ações do CTA Final (e, tecnicamente, do Hero), e mesmo essa não muda o que o visitante já viu.

### 2. Máquina de estados da experiência

```
CARREGANDO
  │ (assets prontos)
  ▼
PORTAL_ATIVO ─┬─(movimento reduzido detectado)──▶ PORTAL_ESTATICO
              │                                        │
   (rolagem)  │                                        │ (mesmo conteúdo,
              ▼                                        │  sem interpolação)
     parada 0..7, cada uma:                             │
     EM_FOCO ──▶ SAINDO ──▶ (próxima) EM_FOCO           │
              │                                        │
              └────────────────┬───────────────────────┘
                                ▼
                          FAQ_ASSENTANDO
                                │ (rolagem/toque/teclado)
                                ▼
                    FAQ_VIRANDO (dúvida N) ──▶ FAQ_SAINDO (dúvida N)
                                │                        │
                                └───(repete até N=6)──────┘
                                          │
                                          ▼
                                  FAQ_ASSENTADA (última)
                                          │
                                          ▼
                                    CTA_FINAL_VISIVEL
                                          │
                                          ▼
                                      RODAPE_VISIVEL (fim)
```

`PORTAL_ESTATICO` é um estado paralelo, não uma etapa da sequência — uma vez detectado, substitui inteiramente a lógica de `PORTAL_ATIVO` para o resto da sessão de leitura.

### 3. Lista de eventos da interface

- Carregamento inicial concluído.
- Preferência de movimento reduzido detectada.
- Posição de rolagem alterada (evento contínuo, não discreto).
- Parada do motor mudou de foco.
- Dúvida do FAQ avançou/retrocedeu (por rolagem, toque/clique, ou tecla).
- Ação primária ativada (Hero ou CTA Final).
- Ação secundária ativada (CTA Final).
- Link do Header/Rodapé ativado.
- Elemento recebeu foco de teclado.

### 4. Lista de microinterações

- Compactação sutil do Header ao ultrapassar um limiar mínimo de rolagem.
- Pulso quase imperceptível e constante do fio contínuo do motor (respiração do ambiente).
- Aprofundamento de sombra durante a virada de uma dúvida do FAQ (simulação de peso).
- Leve elevação da dúvida ativa do FAQ ao receber destaque (hover/foco).
- Diminuição de nitidez e escala do vídeo companheiro durante sua saída.

### 5. Lista de transições narrativas

- Chegada → Respiro: de "acolhido" para "posso desacelerar".
- Respiro → Como Funciona: de "posso desacelerar" para "posso falar com segurança".
- Como Funciona → Benefícios: de "entendo o processo" para "sei o que eu recebo".
- Benefícios → Por Que Confiar: de "sei o que eu recebo" para "sei por que confiar".
- Por Que Confiar → Processo: de "confio no critério" para "sei o que vem depois".
- Processo → FAQ: de "sei o que vem depois" para "ainda tenho dúvidas, e há espaço para elas".
- FAQ → CTA Final: de "minhas dúvidas foram respondidas" para "posso agir, sem pressa".
- CTA Final → Rodapé: de "convite feito" para "companhia até o fim, mesmo sem clicar".

### 6. Estados de carregamento

- Antes de as imagens de fundo do motor estarem prontas: um tom de base neutro é exibido, nunca uma tela em branco ou um indicador de carregamento genérico.
- O vídeo companheiro usa uma imagem de repouso (poster) até que o próprio vídeo esteja pronto para reproduzir — nunca uma área vazia.
- Nenhuma seção depende de uma chamada de dado externa em tempo real — todo o conteúdo é conhecido no momento em que a página é servida; portanto não existe um estado de "carregando conteúdo" além do carregamento inicial de mídia.

### 7. Estados vazios

- Não aplicável como categoria própria — a Landing não apresenta listas ou resultados que possam estar vazios (diferente de uma busca ou um painel autenticado). O único paralelo é a ausência de JavaScript/animação (ver "movimento reduzido" e "sem suporte a scroll interativo", tratados como comportamento alternativo, nunca como "vazio").

### 8. Estados de erro

- Falha ao carregar uma imagem de fundo do motor: o tom de base neutro (o mesmo do carregamento) permanece, sem ícone de imagem quebrada nem texto de erro visível ao visitante.
- Falha ao carregar o vídeo companheiro: a seção correspondente do motor continua funcionando normalmente sem ele — o vídeo é presença opcional, nunca uma dependência de bloqueio.
- Nenhuma seção da Landing depende de uma submissão que possa falhar (isso pertence à jornada pós-Landing, `docs/PATIENT_EXPERIENCE_BLUEPRINT.md`) — portanto não há estado de erro de formulário aqui.

### 9. Critérios de responsividade

- Nenhuma seção remove conteúdo em mobile — só reorganiza (empilha em vez de lado a lado) e ajusta proporção.
- O motor do Portal mantém a mesma lógica de rolagem contínua em qualquer tamanho de tela.
- Toda ação (CTA, link) mantém uma área de toque adequada em qualquer largura de tela.
- A leitura nunca deveria exigir rolagem horizontal, em nenhuma largura suportada.

### 10. Critérios de acessibilidade

- Preferência de movimento reduzido é respeitada automaticamente em toda a página, sem exigir configuração dentro dela.
- Toda a experiência é operável só por teclado, do Header ao Rodapé, incluindo o avanço do FAQ.
- Nenhuma informação existe exclusivamente como efeito visual/animado — todo conteúdo tem equivalente textual acessível a leitor de tela, na ordem correta de leitura.
- Contraste de texto sobre imagem/gradiente mantido em piso adequado (WCAG AA) em todas as seções, incluindo as de fundo mais escuro (CTA Final, Rodapé).
- Foco de teclado sempre visível, nunca suprimido.

---

## Parte 3 — Auditoria interna

Só registro — nenhuma correção proposta, nenhum documento alterado.

1. **[RESOLVIDO — Fase 10, Decisão 1]** ~~Contradiz a implementação atual — seção 9 (Concierge de Saúde)~~: a especificação descrevia a ação secundária do CTA Final como "uma via de continuidade fora do site, sem parecer abandono", mas a implementação apontava para um link de WhatsApp genérico, não funcional. O CTA secundário foi removido de `FinalActions` (nenhum destino real existe) — a especificação desta seção não precisa mudar (continua descrevendo o CTA primário corretamente); a divergência deixou de existir porque o botão que a causava não existe mais.

2. **[RESOLVIDO — Fase 10, Decisão 1]** ~~Contradiz o ADR-017 (`LANDING_CREATIVE_DIRECTION.md` §8)~~: mesma raiz do achado acima. Com a remoção do botão, a implementação passa a cumprir §8 (nenhum link de WhatsApp inventado) em vez de violá-lo.

3. **[RESOLVIDO — Fase 10, Decisão 2]** ~~Contradiz a implementação atual — seção 10 (FAQ), carta 3~~: a carta 3 assumia que Busca Direta existe como caminho hoje disponível. A carta foi reescrita (`docs/LANDING_UX_WRITING.md`, seção 10) para descrever só o caminho real — a seção 10 aqui especificada permanece correta e neutra sobre o conteúdo, sem alteração de comportamento necessária.

4. **[RESOLVIDO — Fase 10, Decisão 3, ADR-026]** ~~Contradiz `LANDING_CREATIVE_DIRECTION.md` §4 (vídeo institucional) — seção 4~~: o comportamento aqui especificado (vídeo ambiente, silencioso, sem controle) descrevia fielmente a implementação real, mas divergia do vídeo de ~10 minutos, roteirizado, então descrito como "centro da Landing" no documento canônico de direção criativa. `LANDING_CREATIVE_DIRECTION.md` §3/§4 foram atualizados (ADR-026) para aprovar formalmente o vídeo ambiente como o vídeo de lançamento — este documento de comportamento já descrevia a implementação real corretamente desde antes; não precisou mudar.

5. **Nenhuma nova divergência foi encontrada** entre este documento e `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` — os princípios de ritmo controlado pelo visitante, ausência de barra de progresso tradicional, e saída sempre disponível (nunca um fluxo que prende) estão todos refletidos no comportamento aqui especificado (mecanismo de "Fio Dourado" sem representar progresso; FAQ operável por teclado e reversível; nenhuma seção bloqueia o avanço).

6. **Nenhuma nova divergência foi encontrada** entre este documento e o restante do `docs/LANDING_UX_WRITING.md` (conteúdo em si) além das já herdadas acima — o comportamento aqui especificado é compatível com todo o texto real já auditado naquele documento.
