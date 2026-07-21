# Playbook de Implementação — Landing

Estratégia de execução, não arquitetura. Não redefine nenhum dos seis documentos canônicos já existentes (`BRAND_GUIDELINES.md`, `LANDING_CREATIVE_DIRECTION.md`, `LANDING_EXPERIENCE_PHILOSOPHY.md`, `LANDING_UX_WRITING.md`, `LANDING_FUNCTIONAL_SPEC.md`, `LANDING_IMPLEMENTATION_ARCHITECTURE.md`) — todos permanecem canônicos e inalterados. Este documento responde a uma única pergunta: **se uma equipe fosse construir toda a Landing a partir da arquitetura já definida, em que ordem, com que estratégia de desenvolvimento/validação/PR/rollout, e o que precisa estar verdadeiro antes de chamar isso de pronto para produção?**

**Três divergências já conhecidas** (WhatsApp placeholder, FAQ sobre Busca Direta, deriva do vídeo institucional de 10 minutos) foram registradas em `docs/LANDING_UX_WRITING.md` (Parte 2) e reafirmadas em `docs/LANDING_FUNCTIONAL_SPEC.md` (Parte 3) e `docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md` (observações finais). Este documento não as descreve de novo nem propõe correção — só referencia onde elas aparecem naturalmente num plano de execução (principalmente na seção 7, Checklist).

---

## 1. Ordem de implementação

### Etapa 0 — Fundação de configuração e conteúdo
- **Objetivo**: materializar a Camada de Configuração (`LANDING_IMPLEMENTATION_ARCHITECTURE.md` §1) — dados das 12 seções, incluindo todo o texto de `LANDING_UX_WRITING.md` — como dado puro, sem nenhuma lógica de motor.
- **Dependências**: nenhuma — primeiro passo possível.
- **Pré-condições**: os seis documentos canônicos já existem (já é o caso).
- **Entregáveis**: definição de dado de todas as 12 seções.
- **Critérios de aceite**: nenhum dado diverge do que os documentos canônicos especificam; nenhuma lógica de motor foi escrita ainda.
- **Riscos**: se pulada ou malfeita, todo o resto herda o risco de texto/comportamento inventado ad hoc dentro de componentes individuais.

### Etapa 1 — Motores fundamentais (Preferências de Movimento + Progresso Bruto)
- **Objetivo**: construir os dois únicos motores sem dependência (`LANDING_IMPLEMENTATION_ARCHITECTURE.md` §2, motores 1 e 8).
- **Dependências**: Etapa 0 (para saber o que consumirão depois).
- **Pré-condições**: nenhuma.
- **Entregáveis**: leitura confiável de preferência de movimento reduzido; medição confiável de progresso de rolagem de uma região.
- **Critérios de aceite**: cada motor testável isoladamente, sem nenhuma seção visual ainda existir.
- **Riscos**: o maior de todo o playbook — um erro aqui se propaga para todos os motores derivados. Por isso é a única etapa que precisa estar 100% estável antes de qualquer outra depender dela.

### Etapa 2 — Apresentação estática (Header, Footer, CTA Final)
- **Objetivo**: entregar as três seções sem motor complexo primeiro.
- **Dependências**: Etapa 0.
- **Pré-condições**: nenhuma.
- **Entregáveis**: Header (com o Motor de Compactação, o mais simples de todos), Footer, CTA Final navegáveis.
- **Critérios de aceite**: navegação e ações funcionam mesmo sem nenhum motor do Portal existir.
- **Riscos**: baixo — é a primeira parte visível e testável de ponta a ponta, útil como validação inicial de que a Etapa 0 está correta.

### Etapa 3 — Motor Narrativo + Hero
- **Objetivo**: provar a hierarquia de motores com o caso mais simples — uma parada sem física ambiente.
- **Dependências**: Etapa 1.
- **Pré-condições**: Etapa 2 concluída (para ter onde a jornada começa).
- **Entregáveis**: Hero funcional, mudando corretamente de foco ao rolar.
- **Critérios de aceite**: a parada ativa muda no momento certo do scroll.
- **Riscos**: base de tudo que segue dentro do Portal — qualquer erro na lógica de "parada ativa" se propaga.

### Etapa 4 — Motor Ambiente + paradas restantes (Como Funciona, Benefícios, Por Que Confiar, Processo)
- **Objetivo**: completar a sequência narrativa com física ambiente real (luz, calor, intensidade, compactação).
- **Dependências**: Etapa 3.
- **Entregáveis**: as quatro paradas restantes de conteúdo, interpolando continuamente.
- **Critérios de aceite**: transição contínua verificável visualmente **e** nenhuma re-renderização de componente por quadro (`LANDING_IMPLEMENTATION_ARCHITECTURE.md` §6).
- **Riscos**: maior etapa em volume — se o princípio de performance não estiver certo aqui, corrigir depois é retrabalho estrutural, não um ajuste pontual.

### Etapa 5 — Motor de Fotografia
- **Objetivo**: adicionar a direção de fotografia (crossfade de cena) sobre a sequência narrativa já funcional.
- **Dependências**: só Etapa 1 (Progresso Bruto) — **não depende do Motor Narrativo**, então pode nascer em paralelo à Etapa 4.
- **Entregáveis**: crossfade funcionando de ponta a ponta.
- **Critérios de aceite**: nenhum corte perceptível entre enquadramentos.
- **Riscos**: baixo — módulo já isolado por natureza.

### Etapa 6 — Motor de Vídeo Companheiro
- **Objetivo**: adicionar presença de vídeo ambiente sobre o trecho Triagem→Curadoria.
- **Dependências**: Etapa 1; precisa das paradas Triagem/Análise/Curadoria (Etapa 4) já existirem para ter onde se ancorar.
- **Entregáveis**: entrada/saída do vídeo conduzida pelo scroll.
- **Critérios de aceite**: a ausência do vídeo (falha de carregamento) não quebra nenhuma outra parte da experiência.
- **Riscos**: acoplamento leve com o índice de parada, já registrado em `LANDING_IMPLEMENTATION_ARCHITECTURE.md` (observação 2) — atenção redobrada para não ampliar esse acoplamento durante a construção.

### Etapa 7 — Presença Contínua (fio) + Transição de Saída (handoff)
- **Objetivo**: os dois motores de acabamento, que dependem de quase tudo o mais já existir.
- **Dependências**: Etapas 1 e 4 (intensidade do Ambiente).
- **Entregáveis**: fio contínuo com pulso constante; dissolução suave para a seção seguinte.
- **Critérios de aceite**: nenhuma etapa anterior precisa ser modificada para acomodar este motor.
- **Riscos**: é o motor mais fácil de implementar tarde demais e forçar acoplamento com tudo — por isso vem por último entre os motores do Portal, nunca antes.

### Etapa 8 — FAQ completo (independente)
- **Objetivo**: construir a seção inteira, isolada de tudo o que veio antes.
- **Dependências**: só Etapa 0 (conteúdo das cartas) e Etapa 1 (Preferências de Movimento).
- **Pode ser construída em paralelo a qualquer uma das etapas 3-7** — a demonstração mais clara de "motor que nunca precisa nascer junto com os outros".
- **Entregáveis**: sequência de 6 cartas, navegável por scroll, toque e teclado.
- **Critérios de aceite**: funciona mesmo com o Portal inteiro ausente da página.
- **Riscos**: baixo — o isolamento é a própria proteção.

### Etapa 9 — Integração final e modo de movimento reduzido
- **Objetivo**: montar a página completa e confirmar o fallback estático ponta a ponta.
- **Dependências**: todas as anteriores.
- **Entregáveis**: página completa, com o modo estático testado seção por seção.
- **Critérios de aceite**: nenhuma informação do modo animado está ausente no modo estático.
- **Riscos**: baixo, **se** cada etapa 2-8 já tratou o próprio fallback como critério de aceite individual (o que este playbook recomenda) — alto, se deixado como descoberta nesta etapa.

### Etapa 10 — Hardening de performance e acessibilidade
- **Objetivo**: verificar os princípios de `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §6-7 contra a implementação real, de ponta a ponta.
- **Dependências**: Etapa 9.
- **Entregáveis**: confirmação dos seis invariantes técnicos.
- **Critérios de aceite**: nenhum invariante quebrado.
- **Riscos**: baixo se as etapas anteriores respeitaram seus próprios critérios de aceite — esta etapa é confirmação, não descoberta.

---

## 2. Sequência de integração dos motores

**Isolados — podem nascer sozinhos, sem nenhum outro motor pronto**:
- Preferências de Movimento (fundamental, sem dependência).
- Progresso Bruto (fundamental, sem dependência — só se torna útil quando algo o consome).
- Compactação do Cabeçalho (só consome posição bruta de rolagem da página).
- Virada do FAQ (região presa própria, independente de tudo).
- Fotografia (consome só Progresso Bruto, nunca o Narrativo).

**Dependentes — precisam de outro motor pronto primeiro**:
- Narrativo → precisa de Progresso Bruto.
- Ambiente → precisa de Narrativo.
- Vídeo Companheiro → precisa de Progresso Bruto **e** das paradas de conteúdo já existirem (dependência de conteúdo, não só de motor).
- Presença Contínua → precisa de Ambiente e de Transição de Saída.
- Transição de Saída → precisa de Progresso Bruto.

Nenhum motor "precisa nascer junto" com outro fora dessas dependências explícitas — a suposição de que o Portal inteiro precisa ser construído de uma vez é falsa e não deveria orientar o planejamento.

---

## 3. Estratégia de desenvolvimento

- **Desenvolver primeiro**: Camada de Configuração + os dois motores fundamentais + Apresentação Estática (Header/Footer/CTA Final) — maior valor de validação com menor risco, e a primeira coisa que pode ser vista funcionando de ponta a ponta.
- **Mockado inicialmente**: fotografia e vídeo reais podem ser substituídos por um tom neutro/placeholder enquanto os motores de física são construídos, sem bloquear o trabalho de engenharia — o texto real, ao contrário, **não precisa** ser mockado, já que já existe em `LANDING_UX_WRITING.md` desde o primeiro dia.
- **Integrado só no final**: a verificação do modo de movimento reduzido como alternância **global** (mesmo que cada seção já tenha sido testada individualmente nesse modo antes); o hardening de performance de ponta a ponta (Etapa 10).
- **Evoluem em paralelo**: FAQ (Etapa 8) em paralelo a qualquer etapa do Portal (3-7); Fotografia (Etapa 5) em paralelo ao Motor Ambiente (Etapa 4); refinamento de conteúdo/copy pode continuar acontecendo enquanto engenharia constrói os motores, desde que o contrato de dado da Etapa 0 já esteja fechado — mudar a forma do dado depois que motores já o consomem é retrabalho evitável.

---

## 4. Estratégia de validação

| Fase | O que validar | Como validar | Regressão a observar |
|---|---|---|---|
| Etapa 0 | Nenhum texto diverge do canônico | Comparação campo a campo contra `LANDING_UX_WRITING.md` | Texto reescrito informalmente durante a construção de um motor |
| Etapa 1 | Leitura de preferência e medição de progresso corretas | Simulação de diferentes posições/preferências, sem UI | Qualquer motor derivado começando antes deste estar estável |
| Etapa 2 | Navegação e ações corretas | Cada link/CTA leva ao destino declarado | Ação que deixa de funcionar quando um motor é adicionado depois |
| Etapas 3-4 | Parada ativa muda no momento certo; física não causa re-renderização | Teste funcional de mudança de parada + inspeção de contagem de renderizações | Re-renderização nova introduzida por uma etapa posterior |
| Etapa 5-6 | Nenhum corte perceptível; ausência de vídeo não quebra nada | Teste visual + teste de falha proposital de carregamento | Acoplamento novo entre Fotografia/Vídeo e o Motor Narrativo |
| Etapa 7 | Nenhuma etapa anterior precisou mudar | Revisão de diff — etapas 2-6 não deveriam ter arquivos alterados por esta etapa | Qualquer alteração retroativa em motor já estável |
| Etapa 8 | Funciona com o Portal ausente | Teste de isolamento (montar só o FAQ) | Dependência acidental do estado do Portal |
| Etapa 9 | Paridade total de conteúdo entre os dois modos | Comparação seção por seção, modo a modo | Conteúdo presente em um modo e ausente no outro |
| Etapa 10 | Os seis invariantes técnicos | Verificação automatizada onde possível, manual onde não | Qualquer invariante que passava antes e não passa mais |

**Invariantes que nunca podem quebrar, em nenhuma fase** (mesmos seis de `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §7 — repetidos aqui porque se aplicam a cada etapa, não a um momento único): soma das extensões das paradas = altura total declarada; nenhuma parada sem emoção documentada; paridade de conteúdo entre modo animado e reduzido; todo CTA com destino real e não-vazio; ordem de foco de teclado sem pular seção; nenhum motor importando um motor de nível superior.

---

## 5. Estratégia de Pull Requests

Divisão 1:1 com as etapas da seção 1 — nenhum PR gigante, cada um com objetivo único.

| PR | Objetivo único | Escopo | Critérios de revisão | Riscos |
|---|---|---|---|---|
| PR1 | Camada de Configuração | Dado puro, nenhuma UI, nenhum motor | Nenhum texto diverge de `LANDING_UX_WRITING.md`; nenhum dado importa lógica | Baixo |
| PR2 | Motores fundamentais | Só Progresso Bruto + Preferências de Movimento, testáveis isoladamente | Nenhuma seção visual incluída; testável sem montar página | Alto — base de tudo, revisão redobrada |
| PR3 | Apresentação estática | Header, Footer, CTA Final | Navegação funcional; nenhuma referência a motores ainda não construídos | Baixo |
| PR4 | Motor Narrativo + Hero | Só a parada mais simples | Parada muda de foco corretamente; nenhuma física ambiente ainda | Médio — base do Portal |
| PR5 | Motor Ambiente + 4 paradas | Considerar dividir por parada se ficar grande demais (cada parada como PR próprio, todos dependentes do PR4) | Nenhuma re-renderização por quadro introduzida — revisão de performance obrigatória, não opcional | Maior PR do conjunto |
| PR6 | Motor de Fotografia | Paralelo ao PR5 | Nenhum acoplamento novo com o Motor Narrativo | Baixo |
| PR7 | Motor de Vídeo Companheiro | — | Atenção específica ao acoplamento já conhecido (referenciar `LANDING_IMPLEMENTATION_ARCHITECTURE.md`, observação 2) — confirmar que nada novo foi introduzido além do já registrado | Médio |
| PR8 | Presença Contínua + Transição de Saída | PR de acabamento | Nenhuma etapa anterior precisou ser modificada | Baixo se anteriores bem isoladas; alto se não — sinal de alerta a observar |
| PR9 | FAQ completo | Pode abrir a qualquer momento, paralelo a PR4-PR8 | Funciona com o resto do Portal ausente (teste de isolamento) | Baixo |
| PR10 | Modo de movimento reduzido, integração final | Paridade de conteúdo ponta a ponta | Nenhuma seção omite conteúdo neste modo | Médio — fácil de adiar indevidamente se PRs 3-9 não testaram o próprio fallback ao longo do caminho |
| PR11 | Hardening de performance/acessibilidade | Verificação final dos 6 invariantes | Checklist de `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §7 aplicado de ponta a ponta | Baixo |

---

## 6. Estratégia de rollout

- **Quando ativar cada parte**: as seções estáticas (Header, Footer, CTA Final) podem ir ao ar assim que prontas, mesmo antes do Portal completo existir — a página funciona, ainda que incompleta, sem quebrar navegação. O Portal, porém, **só deveria ser ativado como um todo**, nunca parada por parada — uma experiência "narrativamente incompleta" (só algumas paradas) contradiria a própria premissa de filme contínuo (`LANDING_CREATIVE_DIRECTION.md` §3).
- **Partes que podem permanecer ocultas até estarem prontas**: o vídeo companheiro (a experiência já funciona sem ele, por design — Etapa 6/PR7); a Biblioteca de FAQ pode ser ativada de forma independente do Portal, antes ou depois dele, por ser isolada por construção.
- **Onde uma flag faria sentido, conceitualmente**: uma alternância entre "Portal completo" e uma versão anterior/mais simples da página, para permitir reverter rapidamente sem depender de reverter código; uma alternância independente só para o vídeo companheiro, dado seu acoplamento leve já conhecido. Nenhuma flag por seção individual do Portal — fragmentar a ativação contradiria a mesma premissa de experiência única.
- **Como reduzir risco durante a implantação**: validar o modo de movimento reduzido antes do modo animado em qualquer ambiente novo (é o mais simples e o que menos pode quebrar); manter a versão anterior da Landing facilmente restaurável enquanto a nova estiver em rollout inicial; tratar os dois links/conteúdos já sinalizados como divergentes (referenciados na seção 7 abaixo) como parte explícita da decisão de ir ao ar, não como um detalhe esquecido.

---

## 7. Checklist final — pronto para produção

**Produto**
- [ ] As 12 seções oficiais (`LANDING_CREATIVE_DIRECTION.md` §6) estão presentes, na ordem correta.
- [ ] Nenhuma funcionalidade além do que os documentos canônicos descrevem foi adicionada.
- [ ] As divergências já registradas (WhatsApp placeholder e FAQ sobre Busca Direta — `docs/LANDING_UX_WRITING.md`, Parte 2) foram avaliadas conscientemente pelo responsável do produto antes do lançamento — aceitar por ora é uma decisão válida, esquecer não é.

**UX**
- [ ] O comportamento de cada seção corresponde a `docs/LANDING_FUNCTIONAL_SPEC.md`.
- [ ] A sequência emocional de `LANDING_CREATIVE_DIRECTION.md` §3 é reconhecível ao vivo, não só no papel.
- [ ] Nenhuma seção interrompe o visitante sem que ele peça (`LANDING_EXPERIENCE_PHILOSOPHY.md`, seção 6).

**Engenharia**
- [ ] A hierarquia de motores (`LANDING_IMPLEMENTATION_ARCHITECTURE.md` §2) não tem dependência circular nem lateral não documentada.
- [ ] Todo motor com loop contínuo tem desligamento simétrico verificado.
- [ ] O acoplamento conhecido entre Vídeo e Narrativo (`LANDING_IMPLEMENTATION_ARCHITECTURE.md`, observação 2) foi revisado — mesma regra de referenciar, não corrigir, se ainda presente.

**Performance**
- [ ] Nenhum valor contínuo (luz/calor/intensidade) dispara re-renderização de componente.
- [ ] Motores pausam fora da área visível.
- [ ] Um único relógio de quadro serve a todos os motores contínuos de uma mesma região.

**Acessibilidade**
- [ ] Toda a experiência é operável só por teclado, do Header ao Rodapé.
- [ ] Movimento reduzido é respeitado automaticamente, sem exigir configuração dentro da página.
- [ ] Contraste adequado (WCAG AA) verificado em todas as seções, incluindo as de fundo mais escuro.
- [ ] Paridade total de conteúdo entre modo animado e modo estático.

**Conteúdo**
- [ ] Todo texto corresponde a `docs/LANDING_UX_WRITING.md` — nenhuma frase inventada fora do documento sem justificativa registrada.
- [ ] Glossário de palavras proibidas (`LANDING_UX_WRITING.md`, Parte 5) verificado — nenhuma ocorrência.
- [ ] As três divergências já conhecidas (WhatsApp, FAQ sobre Busca Direta, vídeo institucional) constam de alguma lista de pendência do time responsável — não precisam estar resolvidas para o lançamento, mas precisam estar rastreadas em algum lugar visível para quem decide lançar.

**QA**
- [ ] Fluxo completo testado em ao menos um dispositivo mobile real e um desktop real, não só em emulação.
- [ ] Testado com movimento reduzido ativado no sistema operacional real, não simulado por parâmetro de URL.
- [ ] Testado com falha proposital de carregamento de imagem/vídeo, para confirmar que a página não quebra visualmente (`LANDING_FUNCTIONAL_SPEC.md`, Parte 2, itens 6-8).
- [ ] Testado o avanço do FAQ pelos três métodos (scroll, toque/clique, teclado).
