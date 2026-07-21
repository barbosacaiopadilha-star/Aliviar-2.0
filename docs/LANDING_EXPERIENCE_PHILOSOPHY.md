# Filosofia da Experiência — Landing do Paciente

Documento de filosofia, não de implementação. Não redesenha, não propõe tela, wireframe, componente, layout ou código — define os princípios que devem orientar toda decisão futura de UX, UI, conteúdo e interação da Landing, no mesmo espírito com que `docs/PRODUCT_PRINCIPLES.md` orienta produto sem desenhar produto.

**Relação com o que já existe** — este documento não substitui nem contradiz `docs/LANDING_CREATIVE_DIRECTION.md` (ADR-017, canônico para a *estrutura* da Landing: as seções, a ordem emocional, "a Landing é um filme"), nem `docs/BRAND_GUIDELINES.md` (canônico para a *personalidade e voz* da marca em qualquer superfície). Ele aprofunda a camada que fica entre os dois: **por que** a Landing precisa ser um filme e não uma página, **o que exatamente** a Serenidade e a Discrição da marca devem *fazer sentir* especificamente no primeiro contato de alguém buscando cuidado. Onde este documento e um documento estrutural divergirem em algum detalhe futuro, a estrutura continua sendo `LANDING_CREATIVE_DIRECTION.md` — este documento nunca decide seção, ordem ou copy, só a intenção emocional por trás deles. Base: `docs/PRODUCT_VISION.md`, `docs/PRODUCT_PRINCIPLES.md` (especialmente 3-9, 14), `docs/BRAND_GUIDELINES.md`, `docs/ace/00-constitution/constitution.md` (princípios elevados a restrição), e a Landing real hoje em produção (`PortalExperience`, `src/components/landing/`), usada como evidência de que parte desta filosofia já é praticável, não como especificação.

**Não é uma "landing do paciente" no sentido de uma segunda rota separada** — hoje existe uma única Landing (`src/app/(public)/page.tsx`), e é ela quem já cumpre esse papel de primeiro contato. O nome desta iniciativa nomeia a *intenção* (a landing pensada a partir de quem chega buscando cuidado, não de quem chega comprando um serviço), não uma superfície nova do produto.

---

## 1. Manifesto da Experiência

A Aliviar não é encontrada. A Aliviar é reconhecida.

Quem chega até esta página não está comparando fornecedores — está, na maior parte das vezes, num momento em que pedir ajuda já foi, em si, um esforço. A Landing não existe para convencer essa pessoa de nada. Existe para que ela sinta, antes de ler qualquer palavra que explique o método, que chegou a um lugar que já entendeu algo sobre o que ela está vivendo.

Isto não é uma página que vende cuidado. É o primeiro gesto de um cuidado que já começou.

Não há aqui nenhuma urgência a criar, nenhuma objeção a vencer, nenhum funil a otimizar. Há uma pessoa, um momento, e a responsabilidade de não desperdiçar nenhum dos dois. Tudo o que esta experiência faz — cada frase, cada pausa, cada silêncio — responde a uma única pergunta, já estabelecida como critério máximo em `docs/LANDING_CREATIVE_DIRECTION.md`: isso faz essa pessoa sentir "é exatamente esse tipo de ajuda que eu estava precisando"? Se não, não pertence aqui — por mais que pareça, em qualquer outro critério, uma boa ideia.

---

## 2. Investigação

### 2.1 A sensação nos primeiros 10 segundos

Não é entusiasmo. Não é alívio ainda — seria cedo demais, e alívio prometido cedo demais é a primeira forma de desconfiança (`docs/PRODUCT_PRINCIPLES.md`, princípio 7: confiança é construída lentamente). É **reconhecimento**: a sensação de "isto foi escrito para alguém como eu, agora" — sem que a pessoa precise se identificar, clicar em nada ou ler um parágrafo inteiro para chegar lá. Se, aos 10 segundos, a pessoa está tentando entender "o que é este produto", a experiência já falhou; a pergunta certa aos 10 segundos é "será que aqui alguém entende o que eu sinto".

### 2.2 As emoções que a jornada deve construir, em ordem

1. **Reconhecimento** — "isto fala comigo".
2. **Alívio contido** — não "está tudo resolvido", mas "não estou mais sozinho tentando resolver isto".
3. **Curiosidade segura** — vontade de entender como funciona, sem medo do que vai encontrar a seguir.
4. **Confiança específica** — não "esta empresa parece confiável" em abstrato, mas "entendo exatamente por que confiar nisto, e em que termos".
5. **Convite, nunca pressão** — o momento de agir chega como uma porta aberta, não como uma seta piscando.

### 2.3 As emoções que a jornada deve evitar, sempre

Urgência ("não perca", contagem regressiva, vagas limitadas — já proibido em `docs/PRODUCT_PRINCIPLES.md`, princípio 4, e em `docs/PRODUCT_VISION.md`, "o que nunca faremos"). Culpa ou vergonha por ainda não ter buscado ajuda. Medo amplificado do problema para depois "vender" a solução — uma tática publicitária clássica, incompatível com o Princípio 8 (nenhuma interface deve aumentar ansiedade). Excitação de produto de consumo ("novidade!", "revolucionário!") — dissonante com a Discrição da marca (`docs/BRAND_GUIDELINES.md`). Alívio prematuro e genérico ("relaxa, a gente cuida de tudo") — que soa a promessa vazia antes de qualquer prova. E, sutilmente, **eficiência fria**: a sensação de estar preenchendo um formulário de triagem, mesmo que tecnicamente elegante.

### 2.4 A relação entre paciente e plataforma

Nem cliente-fornecedor, nem paciente-hospital, nem usuário-app. A relação que a Landing precisa estabelecer, desde o primeiro instante, é a de **alguém que busca cuidado e um guia que já entende o caminho** — o arquétipo Sábio, com Cuidador como tom (`docs/BRAND_GUIDELINES.md`). A Aliviar nunca é protagonista da história que está sendo contada na Landing; a pessoa é. A plataforma se posiciona sempre a favor de quem chega, nunca ao lado de quem oferece cuidado — essa assimetria deliberada (Princípio 1, `docs/PRODUCT_PRINCIPLES.md`) precisa ser sentida, não só declarada em texto de rodapé.

### 2.5 Transmitir inteligência sem parecer um algoritmo frio

Inteligência se mostra pela **qualidade da pergunta**, nunca pela exibição do mecanismo. Um sistema verdadeiramente inteligente, nesta filosofia, não precisa dizer "usamos IA avançada" — ele demonstra inteligência ao reconhecer, na própria comunicação, a complexidade real de quem está lendo (sem simplificar a ponto de soar condescendente, nem tecnicizar a ponto de soar distante). A tecnologia (o ACE, os protocolos, qualquer critério interno) nunca aparece nomeada na Landing — mesma regra já vigente em `docs/LANDING_CREATIVE_DIRECTION.md`, seção 2 — porque nomear o mecanismo é, paradoxalmente, a forma mais eficiente de parecer uma máquina.

### 2.6 Transmitir acolhimento sem parecer uma clínica tradicional

Acolhimento não é vocabulário fofo, nem ícones de coração, nem cor pastel em excesso. É **presença sem pressa**: frases que dão à pessoa tempo de se reconhecer nelas antes de pedir qualquer ação dela. Uma clínica tradicional acolhe com formulário e sala de espera; esta experiência acolhe com ritmo — silêncio onde silêncio é apropriado (a Landing real já pratica isso: a cena "Respiro" do `PortalExperience` existe exatamente para isso), e nunca preenche todo o espaço da tela só porque o espaço existe.

### 2.7 Transmitir autoridade sem parecer arrogância

Autoridade, aqui, nunca é afirmação ("somos os melhores", "método comprovado") — é **precisão sobre os próprios limites**. Uma marca que diz claramente o que não faz (não diagnostica, não substitui profissional de saúde, não promete resultado clínico — Constituição do ACE, seção 3) comunica mais autoridade do que uma que promete tudo. Arrogância é a ausência de limite declarado; autoridade, nesta filosofia, é exatamente o oposto.

### 2.8 Reduzir ansiedade antes mesmo de começar a história

O maior redutor de ansiedade antes de qualquer história ser contada não é tranquilização genérica ("fique tranquilo") — é **clareza total do que vai acontecer a seguir**, sem letras miúdas. A pessoa que entende, antes de começar, o que vai ser perguntado, por quanto tempo, o que acontece depois, e que pode parar a qualquer momento sem perder o que já fez (o que, hoje, já é literalmente verdade — o rascunho de "sua história" é salvo automaticamente, `docs/PATIENT_EXPERIENCE_BLUEPRINT.md`, Etapa 3), sente menos ansiedade do que a pessoa apenas tranquilizada com adjetivos.

### 2.9 Princípios editoriais para toda a comunicação

Frases curtas, uma ideia por vez — nunca duas mensagens concorrendo na mesma seção (já um critério de `docs/LANDING_STRATEGY.md`). Segunda pessoa usada com parcimônia, nunca no modo imperativo de venda ("comece agora!", "não perca!"). Nenhum superlativo não verificável ("o melhor", "líder em"). Nenhuma métrica fabricada ou depoimento genérico sem lastro real (`docs/PRODUCT_VISION.md`, "o que nunca faremos"). Toda afirmação sobre o que a Aliviar faz precisa já ser verdade no produto hoje — nunca aspiracional disfarçada de presente.

### 2.10 Princípios visuais anteriores a qualquer interface

Mesmo sem desenhar nada, alguns compromissos já valem antes do primeiro pixel: espaço negativo é conteúdo, não folga sobrando (`docs/DESIGN_SYSTEM.md`, princípio "Discrição"); nenhuma cor, forma ou movimento deve competir por atenção com o texto que está sendo lido naquele instante; ritmo visual acompanha ritmo emocional — uma seção que fala de acolhimento não deveria se mover rápido; e a paleta aprovada (navy/sage/dourado como acento, nunca protagonista, `docs/DESIGN_SYSTEM.md` seção 0) já é, em si, uma decisão filosófica: nada aqui deveria gritar para ser notado.

---

## 3. Os 10 princípios fundamentais da experiência

1. **A Landing reconhece, não convence.** O objetivo não é vencer uma objeção — é ser reconhecida como o lugar certo antes que a pessoa precise formular uma objeção.
2. **Confiança se constrói em camadas, nunca se declara de uma vez.** Cada seção entrega só a confiança que a anterior já ganhou o direito de construir sobre (`docs/PRODUCT_PRINCIPLES.md`, princípio 7).
3. **A jornada tem começo, meio e fim — nunca um funil.** Um funil existe para converter; uma jornada existe para acompanhar. A diferença é sentida, não só estrutural.
4. **Inteligência aparece na pergunta certa, nunca na exibição do mecanismo.** A tecnologia é sempre invisível (`docs/PRODUCT_PRINCIPLES.md`, princípio 5).
5. **Acolhimento é ritmo, não vocabulário.** Presença sem pressa vale mais que qualquer palavra "calorosa" isolada.
6. **Autoridade é o limite declarado, nunca a afirmação de grandeza.** Dizer o que não se faz comunica mais do que dizer o que se faz melhor que os outros.
7. **Clareza do próximo passo é o principal redutor de ansiedade.** Tranquilização genérica não substitui informação concreta.
8. **Silêncio e espaço são decisões de design, não vazios a preencher.** Uma seção pode, deliberadamente, não dizer nada além de deixar a pessoa respirar.
9. **O paciente é sempre o protagonista da própria história contada na Landing.** A Aliviar é presença e guia — nunca o centro da narrativa (`docs/PRODUCT_ARCHITECTURE.md`, princípio central: "o paciente nunca interage com protocolos").
10. **Toda promessa feita aqui já precisa ser verdade no produto hoje.** Nenhuma aspiração comunicada como fato presente (`docs/PRODUCT_VISION.md`, "confiança perdida por uma promessa quebrada custa muito mais do que o ganho de tê-la feito").

---

## 4. A personalidade da Landing

Herda integralmente a personalidade de marca já definida (`docs/BRAND_GUIDELINES.md`: Serena, Culta sem ser distante, Acolhedora sem informalidade excessiva, Discreta, Direta) — mas, no primeiro contato especificamente, cada um desses traços tem um peso diferente do que teria, por exemplo, numa tela de acompanhamento já dentro do produto:

- A **Serenidade** aqui não é ausência de emoção — é ritmo controlado diante de um assunto que, para quem chega, pode não estar sereno nenhum pouco. É a serenidade de quem já viu muitas histórias parecidas e sabe, com segurança tranquila, que existe um caminho.
- A **Discrição** aqui significa, especificamente, resistir à tentação de "provar valor" com excesso de recursos visuais, prova social e credenciais empilhadas — a Landing confia que a experiência de ler já é, em si, a prova.
- A **Autoridade sem distância** aqui significa nunca soar como uma instituição hospitalar fria nem como uma marca de bem-estar performática — o meio-termo exato que `docs/PRODUCT_VISION.md` já nomeia como "nunca um ERP médico frio, nunca um produto de estética tech agressiva".

Arquétipo primário sempre **Sábio**, tom sempre **Cuidador** — nunca Herói (não há drama a resolver aqui, há um caminho a mostrar) e nunca Tech visionário (a tecnologia nunca é o assunto).

---

## 5. A personalidade da linguagem

Frases que soam como algo que uma pessoa de confiança diria, nunca como copy de anúncio. Verbos no indicativo, raramente no imperativo — e quando o imperativo aparece (um convite final de ação), ele é um convite, não uma ordem ("conte sua história", nunca "comece agora!"). Nenhum jargão clínico, nenhum jargão técnico de tecnologia, nenhuma palavra que exija que a pessoa já saiba do que se trata para entender a frase. Frases médias a curtas — nunca período longo demais para ser lido no ritmo de quem está ansioso. Nunca ironia, nunca humor sobre o tema (mesmo tom institucional leve é vetado, `docs/BRAND_GUIDELINES.md`). A pontuação é parte do ritmo: reticências e pausas podem comunicar cuidado; pontos de exclamação quase nunca pertencem aqui.

---

## 6. A personalidade das interações

Ainda sem desenhar nenhuma interface — apenas o espírito que qualquer interação futura precisa carregar: o ritmo pertence a quem está lendo, nunca ao sistema (nada avança sozinho, nada pressiona para avançar mais rápido — a Landing real já pratica isso: o `PortalExperience` é conduzido por scroll do visitante, nunca por autoplay forçado). Nenhuma barra de progresso que implique "faltam X passos" antes mesmo de a pessoa decidir se quer dar o primeiro (o "Fio Dourado" já implementado é deliberadamente "sempre inteiramente visível, sem representar progresso ou avanço da rolagem" — mesma filosofia). Nenhuma interrupção não solicitada (modal de saída, pop-up de captura de e-mail, chat automático se passando por humano). Toda ação tem uma saída fácil e sem culpa — a pessoa pode sair, parar, voltar, sem qualquer fricção ou mensagem de retenção. O silêncio entre uma seção e outra é tão desenhado quanto o conteúdo em si.

---

## 7. O que nunca devemos fazer

- Criar urgência artificial (contagem regressiva, "vagas limitadas", "oferta por tempo limitado").
- Usar prova social fabricada ou genérica (depoimento sem lastro, contador de "pessoas atendidas" sem necessidade real de mostrar).
- Nomear ou expor qualquer parte do mecanismo interno (ACE, protocolos, Compatibility Matrix, scores, critérios de IA) em qualquer superfície voltada ao paciente.
- Dramatizar sofrimento alheio para gerar impacto emocional antes de oferecer qualquer caminho.
- Prometer resultado clínico, cura, ou qualquer garantia de desfecho.
- Usar tom de urgência médica ("não espere", "cuide disso agora") — o tom é sempre calmo, mesmo ao convidar para agir.
- Simular um humano por trás de uma interação automatizada.
- Comparar-se nominalmente a concorrentes ou desqualificar alternativas.
- Usar cor, ilustração ou estética "tech" para parecer mais avançada do que realmente comunica cuidado.
- Interromper a pessoa com qualquer elemento não solicitado por ela (pop-up, modal, autoplay de som).

---

## 8. O que deve estar presente em qualquer tela futura

- Um próximo passo sempre claro, nunca ambíguo, nunca escondido atrás de outro clique.
- Uma saída sempre disponível — nenhuma tela prende a pessoa num fluxo sem permitir parar ou voltar.
- Ritmo calmo, mesmo em uma tela de erro, ausência de resultado ou espera (`docs/PRODUCT_PRINCIPLES.md`, princípio 8).
- A decisão final sempre explicitamente da pessoa — nunca uma pré-seleção ou default que empurre uma escolha.
- Coerência com a ordem emocional já estabelecida na Landing (reconhecimento → confiança → convite) — nenhuma tela introduz um tom dissonante sem transição.
- Acessibilidade como piso (WCAG AA), nunca como meta futura (`docs/PRODUCT_PRINCIPLES.md`, princípio 11).
- Nenhuma menção a mecanismo interno, protocolo ou critério de IA, em nenhuma circunstância.

---

## 9. Resumo executivo

A Landing do Paciente não vende um serviço — é o primeiro gesto de um cuidado que já começou. Ela deve ser reconhecida, não escolhida entre opções. Toda decisão de UX, UI, conteúdo e interação passa por um único teste: isto faz a pessoa sentir "é exatamente esse tipo de ajuda que eu estava precisando" (critério já estabelecido em `docs/LANDING_CREATIVE_DIRECTION.md`)? A personalidade é a da marca (Serena, Culta, Acolhedora, Discreta, Direta — `docs/BRAND_GUIDELINES.md`), com um peso específico neste primeiro contato: presença sem pressa, autoridade pelo limite declarado, inteligência pela pergunta certa, nunca pela exibição da tecnologia. A linguagem convida, nunca ordena; nunca promete o que o produto ainda não cumpre hoje. As interações pertencem a quem está lendo — nada avança, pressiona ou interrompe sem que a pessoa peça. O que nunca fazemos: urgência artificial, prova social fabricada, exposição do mecanismo interno, promessa de resultado clínico. O que sempre garantimos: próximo passo claro, saída sempre disponível, ritmo calmo, decisão sempre da pessoa. Esta filosofia não substitui a estrutura já aprovada em `docs/LANDING_CREATIVE_DIRECTION.md` — explica a intenção emocional que essa estrutura existe para servir, e deve orientar qualquer decisão futura de UX/UI/conteúdo/desenvolvimento que ainda não tenha sido tomada.
