# Arquitetura de Implementação — Landing

Arquitetura, não implementação. Nenhum componente, biblioteca, framework, UML ou código — só a decomposição que permite implementar `docs/LANDING_FUNCTIONAL_SPEC.md` (comportamento), `docs/LANDING_UX_WRITING.md` (conteúdo), `docs/LANDING_EXPERIENCE_PHILOSOPHY.md` (intenção) e `docs/LANDING_CREATIVE_DIRECTION.md` (estrutura) com coerência, e que qualquer engenheiro possa verificar contra este contrato antes de aprovar um Pull Request. Os cinco documentos acima permanecem canônicos e inalterados.

**Base de verificação**: a Landing já existe e já implementa a maior parte deste comportamento (`src/components/landing/`). Esta arquitetura é uma decomposição de referência — descreve como o sistema **deveria** ser modularizado para continuar coerente com os documentos acima conforme evolui, não uma reescrita exigida do que já funciona. Onde a implementação real já corresponde à decomposição abaixo, ou diverge dela, isso é registrado só na seção final de observações — nunca corrigido aqui.

**Herda, sem repetir**: `docs/CONVENTIONS.md` (módulos nunca acessam dado de outro diretamente; Server Components por padrão, `"use client"` só onde há estado/efeito/evento; sem biblioteca de primitivos de UI externa) continua valendo integralmente para qualquer implementação desta arquitetura.

---

## 1. Decomposição de módulos

```
┌─ Camada de Configuração/Conteúdo (dado puro, sem lógica, sem estado) ─┐
│  • Definição das paradas do Portal (física + referência de conteúdo)  │
│  • Direção de fotografia (enquadramentos, ordem, posições)            │
│  • Cartas do FAQ (pares Dúvida/Solução)                               │
│  • Textos de cada seção (título, subtítulo, CTA, microcopy —         │
│    espelham `docs/LANDING_UX_WRITING.md` linha a linha)              │
│  Nunca importa um motor. Nunca sabe que existe scroll, animação ou   │
│  estado. Testável isoladamente, sem montar nenhuma tela.              │
└─────────────────────────────────────────────────────────────────────┘

┌─ Camada de Motores (lógica pura de estado/física — ver seção 2) ──────┐
│  Não produzem interface própria. Cada motor expõe só o valor que      │
│  calcula, nunca decide como esse valor é desenhado.                    │
└─────────────────────────────────────────────────────────────────────┘

┌─ Camada de Composição de Seção (consome motores + configuração) ──────┐
│  • Header — consome Motor de Compactação                              │
│  • As 6 paradas do motor compartilhado (Hero, Vídeo, Como Funciona,   │
│    Benefícios, Por Que Confiar, Processo) — cada uma consome o        │
│    Motor Narrativo + Motor Ambiente, nunca implementa física própria  │
│  • FAQ — consome o Motor de Virada do FAQ, independente do resto      │
│  • CTA Final — sem motor próprio, seção estática                      │
│  • Footer — sem motor próprio, seção estática                         │
│  Cada seção só conhece os motores que consome — nunca o DOM ou o      │
│  estado interno de outra seção.                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─ Camada de Apresentação Estática (Server Components, sem estado) ─────┐
│  Marcação e texto que nunca mudam depois de renderizados — a maior    │
│  parte do Header, Footer, CTA Final. Só vira Camada de Composição     │
│  onde há de fato estado, efeito ou evento (regra já vigente em        │
│  `docs/CONVENTIONS.md`).                                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Nunca devem se conhecer**:
- A Camada de Configuração nunca importa um motor (dado nunca depende de lógica).
- Um motor nunca importa outro motor do mesmo nível diretamente (ver hierarquia, seção 2) — só consome o valor já exposto por um motor mais fundamental.
- Uma seção nunca lê o DOM, o estado ou as referências internas de outra seção — inclusive a transição entre o Portal e o FAQ é o Portal desvanecendo a si mesmo, nunca o FAQ "sabendo" do Portal.
- O Motor de Vídeo nunca decide física ambiente (luz/calor); o Motor Ambiente nunca sabe que existe um vídeo.
- Nenhuma seção importa a Camada de Configuração de outra seção (o FAQ nunca lê a configuração das paradas do Portal, e vice-versa).

---

## 2. Motores internos

Descobertos a partir do contrato funcional (`LANDING_FUNCTIONAL_SPEC.md`), não assumidos por lista pronta. Ordenados por dependência — cada um só consome o(s) anterior(es):

| # | Motor | Responsabilidade | Consome |
|---|---|---|---|
| 1 | **Progresso Bruto** | Traduz a posição real de rolagem de uma região (a página inteira, para o Portal; uma região presa, para o FAQ) em um número entre 0 e 1. Fonte única de "quanto já rolei" — nunca duplicado em outro lugar. | Nada (lê o DOM diretamente) |
| 2 | **Narrativo** | Traduz progresso bruto em "qual parada está ativa" + "avanço dentro dela", respeitando paradas de platô (que não avançam durante sua extensão). | Progresso Bruto (1) |
| 3 | **Ambiente** | Interpola luz, intensidade de presença, temperatura e compactação entre a parada ativa e a próxima, cada canal com inércia própria e dessincronizada das demais. | Narrativo (2) |
| 4 | **Fotografia** | Crossfade contínuo entre enquadramentos de uma mesma cena, em linha do tempo própria — deliberadamente independente das paradas de conteúdo. | Progresso Bruto (1) — não o Narrativo |
| 5 | **Vídeo Companheiro** | Controla presença/saída do vídeo ambiente dentro de um trecho específico do progresso. | Progresso Bruto (1) |
| 6 | **Presença Contínua** (fio) | Pulso de respiração independente do scroll + opacidade ligada à proximidade do fim do Portal. | Ambiente (3, intensidade) + Transição de Saída (7) |
| 7 | **Transição de Saída** (handoff) | Calcula a "presença" (1→0) nos últimos instantes do Portal, para que Fotografia/Ambiente/Fio desvaneçam juntos, sem corte perceptível. | Progresso Bruto (1) |
| 8 | **Preferências de Movimento** | Única fonte de "movimento reduzido?". Todo motor acima consulta este antes de agir. | Nada (lê preferência de sistema) |
| 9 | **Virada do FAQ** | Progressão presa própria, marcos de virada por carta, assentamento antes da primeira e depois da última. Inteiramente independente dos motores 1-7. | Nada além do seu próprio Progresso Bruto (região presa própria) |
| 10 | **Compactação do Cabeçalho** | Um único limiar (rolagem além de X) — sem interpolação contínua. O mais simples de todos. | Nada além de posição bruta de rolagem da página |

**Descartados deliberadamente, e por quê**:
- *Motor de animações genérico*: não existe como camada própria — cada motor acima já produz seu próprio valor de saída; uma camada central de animação seria indireção sem função real, já que nenhum motor precisa que outro "anime por ele".
- *Motor de progressão* (como conceito à parte de Narrativo): o que a lista de exemplo chamaria de "motor de progressão" já é o Motor Narrativo (2) — nomear os dois separadamente duplicaria responsabilidade.
- *Motor de responsividade contínuo*: breakpoint/orientação é dado estático consultado no render, não um valor que precisa de interpolação ou lifecycle próprio — não é um motor, é uma leitura pontual usada por qualquer motor/seção que precise dela.

**Regra de hierarquia**: motores 1 e 8 são fundamentais (não dependem de nada). Todo o resto deriva deles, sempre em uma única direção — nunca um motor de nível 3+ é consumido por um motor de nível inferior.

---

## 3. Estados compartilhados

| Estado | Escopo | Nunca deveria ser lido por |
|---|---|---|
| Movimento reduzido? | Landing inteira | — (é global por natureza) |
| Página pronta/hidratada | Landing inteira | — |
| Progresso bruto do Portal, parada ativa, valores do Ambiente, posição de Fotografia, presença do Fio | Só dentro do Portal | FAQ, Header, CTA Final, Footer |
| Progresso bruto do FAQ, carta ativa | Só dentro do FAQ | Portal, Header, CTA Final, Footer |
| Compactado/expandido | Só o Header | Qualquer outra seção |
| Foco/hover de um card individual (Benefícios, Confiança, FAQ) | Só aquele card | Qualquer outro card, mesmo do mesmo grupo |

**Nunca deveria ser compartilhado, mesmo que tecnicamente possível**: nenhum estado interno de uma seção é lido diretamente por outra — mesmo a costura visual Portal→FAQ é o Portal desvanecendo por conta própria (motor 7), nunca o FAQ consultando "o Portal já terminou?". Isso preserva a regra da seção 1 (seções nunca se conhecem) mesmo em um caso onde pareceria conveniente violar.

---

## 4. Comunicação entre módulos

- **Publicam** (são fonte primária de um valor, nunca derivam de outro motor do mesmo nível): Motor de Progresso Bruto (1 e 9), Motor de Preferências de Movimento (8).
- **Só observam, nunca publicam**: toda a Camada de Configuração/Conteúdo; toda seção de apresentação (Header, Footer, CTA Final, as 6 paradas do motor compartilhado) — leem o valor já resolvido pelos motores, nunca escrevem de volta para um motor.
- **Nunca deve emitir nada**: a Camada de Configuração — no instante em que um dado de configuração "emitisse" algo, deixaria de ser configuração e passaria a ser lógica, quebrando a separação da seção 1.
- **Direção única**: motores fundamentais → motores derivados → seções que consomem. Nunca lateral entre motores do mesmo nível, nunca de uma seção de volta para um motor (uma seção não pode "pedir" ao motor para mudar de estado fora do fluxo natural de scroll/preferência).

---

## 5. Lifecycle

| Momento | Comportamento esperado |
|---|---|
| **Ao entrar** | Preferência de movimento reduzido é lida antes de qualquer motor 1-7/9/10 iniciar. Se reduzida, nenhum desses motores sobe — a árvore estática é montada diretamente. |
| **Durante scroll** | Só motores cuja seção está na área visível recalculam — um motor pausa ao sair de vista, nunca gasta ciclo fora dela. |
| **Ao trocar de seção/parada** | A parada que perde o foco fica não-interativa e oculta de tecnologia assistiva; a que ganha assume ambos, nunca as duas simultaneamente. |
| **Ao perder foco (aba/janela)** | Todo motor com loop contínuo (leitura a cada quadro) pausa — nunca continua calculando fora de vista do usuário. |
| **Ao voltar (retomar foco)** | Motores retomam a partir da posição real de scroll no momento — scroll é sempre a fonte de verdade, nunca um cronômetro interno que "perdeu tempo" enquanto a aba estava em segundo plano. |
| **Ao reduzir movimento (mudança em tempo real)** | O contrato correto é resiliente a essa mudança acontecer a qualquer momento, não só na carga inicial — a página deveria poder alternar para o modo estático sem recarregar. |
| **Ao trocar orientação** | Motores dependentes de proporção de tela recalculam suas referências — nenhum valor de física fica preso a uma orientação anterior. |
| **Ao redimensionar** | Mesma regra — nenhum motor assume dimensões constantes durante toda a sessão. |
| **Ao sair (desmontagem)** | Todo motor com loop contínuo, observer ou listener se desliga explicitamente — nenhum "órfão" continuando a rodar depois que a Landing sai de tela. |

---

## 6. Performance — princípios arquiteturais

- **Contra re-renderizações desnecessárias**: separar valor que muda a cada quadro (física contínua — luz, calor, intensidade) de valor que muda por evento discreto (qual parada está ativa). O primeiro nunca deveria disparar re-renderização de componente; o segundo pode.
- **Contra animações conflitantes**: um único relógio (loop de quadro) serve a todos os motores contínuos de uma mesma região — nunca um loop por motor, o que multiplicaria custo por quadro e criaria janelas de dessincronia entre motores que deveriam parecer coordenados.
- **Contra vazamento de memória**: toda assinatura (observer, listener, timeline) tem uma contraparte de desligamento simétrica e verificável — a ausência de uma é sempre um vazamento, sem exceção.
- **Contra concorrência entre motores**: nenhum motor depende do resultado de outro motor do **mesmo nível** — só de níveis mais fundamentais (hierarquia da seção 2) — o que impede dois motores de tentarem escrever a mesma propriedade visual na mesma janela de tempo.
- **Contra dependência circular**: a hierarquia de motores é estritamente de mão única (Progresso Bruto/Preferências → Narrativo → Ambiente/Fotografia/Vídeo → Fio/Transição) — um motor de nível superior nunca é importado por um de nível inferior, nem mesmo indiretamente.
- **Contra trabalho fora de tela**: todo motor pausa quando sua seção não está na área visível — nunca gasta ciclo de CPU calculando algo que ninguém está vendo.

---

## 7. Testabilidade

- **Contrato de motor**: cada motor é uma função pura de estado — dado um progresso de entrada (ou a configuração de uma parada), produz um valor de saída determinístico. Testável isoladamente, sem montar a página inteira nem simular scroll real do navegador.
- **Contrato de configuração**: a Camada de Configuração é dado puro, testável por si só — sem precisar de nenhum motor ou seção.
- **Contrato de seção**: toda seção de apresentação só recebe valores já resolvidos pelos motores — nunca importa um motor bruto e decide sozinha como interpretá-lo. Isso permite testar uma seção só com valores de entrada simulados, sem depender do motor real.

**Invariantes técnicos a preservar, verificáveis por teste**:
1. A soma das extensões de todas as paradas do Portal é sempre igual à altura total declarada do ambiente.
2. Nenhuma parada existe sem uma emoção protegida documentada (regra já em prática no código real, `PortalExperience`).
3. O modo de movimento reduzido nunca omite conteúdo presente no modo animado — mesmo conjunto de texto nos dois modos, sempre.
4. Toda ação (CTA, link) tem um destino real e não-vazio — nenhuma âncora ou link aponta para nada.
5. A ordem de foco de teclado nunca pula uma seção nem entra em uma seção oculta/inativa.
6. Nenhum motor de nível inferior importa um motor de nível superior (verificável estruturalmente, não só por teste de comportamento).

---

## 8. Mapas e contratos

### Mapa completo dos módulos
Ver diagrama da seção 1 — quatro camadas (Configuração → Motores → Composição de Seção → Apresentação Estática), com a regra de que uma camada só conhece a camada imediatamente abaixo dela.

### Mapa dos motores
Ver tabela da seção 2 — dez motores em quatro níveis de dependência (fundamentais → narrativos → derivados → periféricos).

### Mapa de estados
Ver tabela da seção 3 — seis estados, cada um com escopo explícito e lista de quem nunca deveria lê-lo.

### Mapa de eventos
| Evento | Publicado por | Consumido por |
|---|---|---|
| Progresso de rolagem mudou | Motor de Progresso Bruto (1, 9) | Motores 2, 4, 5, 7, 10 (cada um conforme sua região) |
| Parada narrativa mudou | Motor Narrativo (2) | Motor Ambiente (3), seção da parada correspondente |
| Preferência de movimento mudou | Motor de Preferências (8) | Todos os motores 1-7, 9, 10 |
| Carta do FAQ virou | Motor de Virada do FAQ (9) | Seção FAQ (indicador de posição, tecnologia assistiva) |
| Limiar do cabeçalho ultrapassado | Motor de Compactação (10) | Seção Header |
| Ação primária/secundária ativada | Seção (Hero, CTA Final) | Fora da Landing (navegação) — nunca um motor interno |

### Contratos arquiteturais
1. Todo motor expõe um valor, nunca um método que outra camada possa usar para alterar seu comportamento de fora.
2. Toda seção declara explicitamente quais motores consome — nunca importa um motor "por via das dúvidas".
3. Nenhuma seção mantém sua própria cópia de um estado que um motor já expõe (fonte única de verdade, sempre).
4. Todo motor com loop contínuo declara, no mesmo lugar em que inicia, como se desliga.
5. Toda alteração num motor existente é avaliada contra os invariantes da seção 7 antes de ser aceita.

### Dependências permitidas
- Seção → Motor (dos motores que consome, explicitamente).
- Motor → Motor de nível mais fundamental (hierarquia da seção 2).
- Motor/Seção → Camada de Configuração (leitura).

### Dependências proibidas
- Motor → Motor do mesmo nível ou de nível superior.
- Seção → DOM, estado ou referência de outra seção.
- Camada de Configuração → qualquer motor ou seção.
- Seção → Camada de Configuração de outra seção.
- Qualquer módulo → um motor "global" que não declarou consumir.

### Checklist de implementação
- [ ] O novo comportamento corresponde a um motor já existente, ou exige um motor novo? Se novo, ele respeita a hierarquia da seção 2 (só consome motores de nível mais fundamental)?
- [ ] O valor contínuo (por quadro) está separado do valor discreto (por evento) desde o desenho inicial?
- [ ] A seção que vai consumir este motor já declara essa dependência explicitamente, sem importar nada além do necessário?
- [ ] Existe um caminho de desligamento simétrico para todo loop/observer/listener novo?
- [ ] O comportamento sob movimento reduzido foi definido antes de o comportamento animado ser considerado "pronto"?
- [ ] O conteúdo (texto, CTA) usado vem da Camada de Configuração, nunca escrito solto dentro de uma seção?
- [ ] Os invariantes da seção 7 continuam válidos depois da mudança?

### Checklist de revisão de Pull Request
- [ ] Nenhuma seção nova lê o estado/DOM de outra seção.
- [ ] Nenhum motor novo importa outro motor do mesmo nível ou superior.
- [ ] Nenhuma dependência circular foi introduzida (verificar contra o mapa da seção 2).
- [ ] Todo novo `useEffect`/observer/listener tem uma função de limpeza correspondente.
- [ ] O modo de movimento reduzido foi testado manualmente, não só o modo animado.
- [ ] Nenhum texto novo diverge do que está registrado em `docs/LANDING_UX_WRITING.md` sem justificativa registrada.
- [ ] Nenhum comportamento novo diverge do que está registrado em `docs/LANDING_FUNCTIONAL_SPEC.md` sem justificativa registrada.
- [ ] A mudança não introduz uma re-renderização nova no caminho de física contínua (luz/calor/intensidade).

---

## Observações arquiteturais (registro apenas — nenhuma correção proposta)

1. **Decomposição física ainda não existe** — hoje, praticamente todos os motores 1-7 (exceto FAQ e Header) vivem dentro de um único componente (`PortalExperience`, `src/components/landing/portal-experience.tsx`, ~680 linhas), não como módulos separados. O comportamento resultante já cumpre o contrato funcional da Fase 6 — esta observação não aponta um defeito, só que a separação em motores independentes descrita acima é hoje lógica (dentro do mesmo arquivo), não física (em módulos próprios).

2. **Acoplamento pequeno entre Motor de Vídeo e Motor Narrativo** — o motor de vídeo hoje depende de um índice de parada (`VIDEO_EXIT_AT_FRAME`) definido no mesmo arquivo do motor narrativo, em vez de consumir uma posição de progresso bruta e independente. A arquitetura-alvo trata os dois como independentes (ambos consomem só o Motor de Progresso Bruto); a implementação real tem uma referência cruzada pequena entre eles.

3. **Um caso em que a implementação já antecipa esta arquitetura**: a direção de fotografia (`portal-scenes.ts`) já vive hoje em um módulo de configuração separado, desacoplado do componente principal — exatamente o padrão que a seção 1 recomenda para toda a Camada de Configuração. Vale como referência para separar as demais partes de configuração (paradas, cartas do FAQ, textos) do mesmo jeito.

4. **Técnica de performance já em uso, coerente com a seção 6**: os valores contínuos (luz, intensidade, calor) já são hoje escritos diretamente em propriedades de estilo via referência, fora do ciclo normal de re-renderização — exatamente o princípio "valor que muda a cada quadro nunca deveria disparar re-renderização". Esta arquitetura não pede uma mudança de técnica aqui, só nomeia formalmente um padrão que já existe.

5. **Cobertura de teste dos invariantes não verificada** — não foi lido código de teste como parte desta arquitetura (fora de escopo desta fase), então não é possível confirmar se os seis invariantes da seção 7 já têm alguma verificação automatizada hoje. Registrado como lacuna de verificação, não como ausência confirmada.
