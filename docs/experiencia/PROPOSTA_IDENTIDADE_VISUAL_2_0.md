# Proposta — Identidade Visual 2.0: reconvergência cromática da Aliviar

> **Status:** **APROVADA e IMPLEMENTADA** (2026-08-01). Registrada como **ADR-045** em [`docs/DECISIONS.md`](../DECISIONS.md). Este documento permanece como o raciocínio que levou à decisão; as regras vigentes vivem em [`SISTEMA_VISUAL.md`](./SISTEMA_VISUAL.md) e [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md).
>
> **Diretrizes da aprovação que ajustaram a proposta:** a proporção-alvo passou de 60/30/10 para **40% neutros · 30% azul · 30% verde**; a padronização de Progress/gráficos/badges passou a ser **contextual** (interpretativa nas superfícies da paciente, analítica nos fundos) em vez de restrita aos fundos; e foi acrescentada a **R20 — Continuidade Visual da Jornada**.
> **Natureza:** correção de deriva. **Não é rebranding.**
> **Herda como congelado:** [SISTEMA_VISUAL.md](./SISTEMA_VISUAL.md) (F2), [ARQUITETURA_DA_EXPERIENCIA.md](./ARQUITETURA_DA_EXPERIENCIA.md) (F1), `docs/DESIGN_SYSTEM.md`, `docs/BRAND_GUIDELINES.md`, ADR-008, ADR-017, ADR-034.
> **Data:** 2026-08-01

---

## 1 · Diagnóstico — a deriva, com endereço

A identidade canônica da Aliviar é **azul profundo + verde sálvia**, confirmada contra a logo oficial pela **ADR-017** e registrada em `docs/DESIGN_SYSTEM.md` §2.1. O código divergiu dela durante o desenvolvimento.

**Evidência factual, varrida em HEAD (`fd031d9`):**

| Fonte | `--color-brand-primary` declarado | Deveria ser (ADR-017) |
|---|---|---|
| `src/app/globals.css:7` | `#556b5d` — verde-sálvia | `#123B67` — azul profundo |
| `src/app/patient-dashboard.css:7` | `#1a2e26` — verde-floresta | idem |
| `src/app/landing-editorial.css:17` | `#556b5d` — verde-sálvia | idem |

**Não existe uma única ocorrência do azul da marca em `src/`.** O `--color-brand-sage` foi definido como *idêntico* ao primary (`globals.css:7,10`), colapsando duas cores de identidade em uma só. O que sobrou como acento foi o **dourado** — que `docs/BRAND_GUIDELINES.md` ("Uso do dourado") restringe a fio, ícone isolado e detalhe de borda, **nunca protagonista**. Hoje ele é o único contraponto cromático da plataforma: 53 usos de `brand-gold`, e a borda padrão de todo o produto é dourada (`--color-border: rgba(183,154,91,.18)`).

**Causa raiz.** A deriva não foi uma decisão — foi acumulação de decisões locais razoáveis. Cada etapa da casa (Landing 3.0, dashboard da paciente, Mesa do Curador) definiu a própria paleta em escopo próprio, e nenhuma delas tinha o azul porque nenhuma delas herdava de uma camada única. A auditoria de hoje já nomeia o sintoma — *"três paletas concorrentes (globals × patient-dashboard × landing-editorial)"* (AUDITORIA §1) — e o registra como dívida da Onda 6 não quitada.

**O que a deriva produziu de bom, e que esta proposta preserva.** Três aprendizados reais nasceram do período verde e **entram na paleta canônica** em vez de serem descartados:

1. **`#556b5d`** — o verde que a plataforma aprendeu a usar. Diferente do sálvia canônico `#7F9E8C` (2,76:1 — reprova como texto), ele passa AA sobre papel (5,43:1). Entra como **`sage-700`**: o degrau em que o verde vira legível.
2. **`#1a2e26`** — o verde-floresta da casa da paciente, escuro o bastante para carregar texto branco (14,36:1). Entra como **`sage-900`**.
3. **Os neutros quentes** (`#faf8f4`, `#f4f5f2`) e a disciplina de elevação/motion do `patient-dashboard.css` (três degraus de sombra, orçamento de movimento declarado). Viram a base neutra e o padrão de elevação de toda a plataforma.

---

## 2 · Princípio da correção

> **O azul volta ao lugar que a ADR-017 lhe deu; o verde permanece no lugar que a plataforma lhe ensinou; o dourado retorna ao fio.**

Três consequências diretas:

- **Nenhuma cor nova é inventada.** Toda âncora das escalas é um hex já canônico (ADR-017) ou já vigente no produto.
- **Nenhum documento congelado é revogado.** Uma única emenda mínima ao SISTEMA_VISUAL é proposta (§9), nomeada e justificada.
- **Nenhum comportamento muda.** Regras de negócio, APIs, Actions, Repository, estado, banco, Curadoria, fluxos, navegação e textos ficam intocados.

---

## 3 · Camada interna — as escalas (privadas)

Existem para consistência, theming e evolução futura. **Nenhum componente de produto as consome diretamente** — essa é a regra que protege a R18 (§4).

Prefixo `--scale-*`, declarado uma única vez em `:root`.

### 3.1 Índigo — azul profundo, fosco, dessaturado

Âncoras canônicas em **700** e **800** (ADR-017). Nunca ciano, nunca turquesa — a referência pública `aliviar-temp` é explicitamente rejeitada por `docs/DESIGN_SYSTEM.md` §0.

| Degrau | Hex | Papel típico |
|---|---|---|
| `indigo-50` | `#EEF2F7` | superfície recuada azulada, faixa de ambiente |
| `indigo-100` | `#DDE5EF` | superfície de badge/marca leve |
| `indigo-200` | `#BCCCDE` | fio estrutural azulado, borda de campo em foco |
| `indigo-300` | `#93AECB` | acento decorativo, gráfico (série 1 clara) |
| `indigo-400` | `#648BB2` | ilustração, dado em fundo escuro |
| `indigo-500` | `#3C6A96` | gráfico (série 1), ícone sobre superfície escura |
| `indigo-600` | `#21527D` | hover de ação primária |
| **`indigo-700`** | **`#123B67`** | **ação primária, marca, links — ADR-017** |
| **`indigo-800`** | **`#0E2F52`** | **pressed, superfície escura pontual — ADR-017** |
| `indigo-900` | `#0A2340` | tinta institucional, rodapé escuro |

### 3.2 Sage — verde de cuidado, dessaturado

Âncoras canônicas em **300** e **500** (ADR-017); aprendizados da plataforma em **700** e **900**.

| Degrau | Hex | Papel típico |
|---|---|---|
| `sage-50` | `#F1F5F2` | superfície recuada esverdeada, faixa do comum |
| `sage-100` | `#E2EAE4` | superfície de badge de continuidade |
| `sage-200` | `#C6D6CA` | fio estrutural esverdeado |
| **`sage-300`** | **`#A8C0AE`** | **fundo decorativo leve — ADR-017 (`sage-light`)** |
| `sage-400` | `#8CA795` | acento decorativo |
| **`sage-500`** | **`#7F9E8C`** | **sálvia de marca — ADR-017. Nunca como texto** |
| `sage-600` | `#67826F` | hover de ação verde |
| **`sage-700`** | **`#556B5D`** | **verde legível — o aprendizado (vigente hoje)** |
| `sage-800` | `#3D5147` | texto verde de alto contraste |
| **`sage-900`** | **`#1A2E26`** | **verde-floresta — o aprendizado da casa da paciente** |

### 3.3 Neutro — quente, "menos frio"

Atende diretamente ao pedido de revisar os cinzas. Toda a rampa carrega calor (matiz amarelo-terra nos claros, azul-terra muito contido nos escuros), o que impede a leitura de "cinza de sistema".

| Degrau | Hex | Papel típico |
|---|---|---|
| `neutro-50` | `#FAF8F4` | **papel** — superfície de conteúdo (vigente) |
| `neutro-100` | `#F4F1EB` | papel recuado — fundo de ambiente |
| `neutro-200` | `#E9E5DC` | linho — áreas de repouso, borda padrão |
| `neutro-300` | `#D8D3C8` | fio estrutural forte |
| `neutro-400` | `#B5AFA3` | desabilitado, placeholder |
| `neutro-500` | `#8D8779` | metadado de baixa ênfase |
| `neutro-600` | `#6E6F6B` | **tinta suave** — texto secundário |
| `neutro-700` | `#55585A` | texto secundário de alto contraste |
| `neutro-800` | `#3A4045` | tinta institucional |
| `neutro-900` | `#232B31` | **tinta** — texto de leitura. Nunca preto puro |

### 3.4 Acentos pontuais (sem escala, por decisão)

Escala de 10 degraus para estes convidaria uso sistemático — exatamente o que a §5.3 do SISTEMA_VISUAL proíbe.

| Token | Hex | Papel | Restrição permanente |
|---|---|---|---|
| `--scale-argila` | `#955530` | atenção humana, condição a conversar | **nunca "erro"**. Corrigido de `#A9663F`, que reprovava AA (3,81:1) sobre a própria superfície |
| `--scale-argila-superficie` | `#F7EEE7` | fundo de condição | — |
| `--scale-dourado` | `#B08D57` | fio, selo, detalhe de distinção (ADR-017) | **nunca** preenchimento, texto corrido ou borda padrão |

---

## 4 · Camada semântica pública — a convenção vigente, estendida

**Nenhuma convenção nova.** Mantém-se `--color-<papel>-<variação>`, que é o padrão do projeto (505 usos, espelhado em `tailwind.config.ts`). Componentes continuam escrevendo `bg-brand-primary`, `text-ink-muted`, `border-border` — **zero edições de consumo**.

### 4.1 Tokens existentes — só o valor muda

| Token semântico (inalterado) | Hoje | Proposto |
|---|---|---|
| `--color-brand-primary` | `#556b5d` | `var(--scale-indigo-700)` |
| `--color-brand-primary-deep` | `#4a5f52` | `var(--scale-indigo-800)` |
| `--color-brand-primary-hover` | `#647b6d` | `var(--scale-indigo-600)` |
| `--color-brand-sage` | `#556b5d` (colapsado) | `var(--scale-sage-500)` |
| `--color-brand-sage-light` | `#8a9e92` | `var(--scale-sage-300)` |
| `--color-brand-gold` | `#b79a5b` | `var(--scale-dourado)` |
| `--color-bg-canvas` | `#faf8f4` | `var(--scale-neutro-50)` — mesmo valor |
| `--color-bg-surface` | `#ffffff` | `var(--scale-neutro-50)` sobre `neutro-100` (§6) |
| `--color-ink` | `#2f3a3d` | `var(--scale-neutro-900)` |
| `--color-ink-muted` | `#66737a` | `var(--scale-neutro-600)` |
| `--color-border` | `rgba(183,154,91,.18)` **dourada** | `var(--scale-neutro-200)` — o dourado sai da borda padrão |
| `--color-focus-ring` | `#556b5d` | `var(--scale-indigo-700)` |

### 4.2 Tokens novos — mesmo padrão, sem exceção

| Token novo | Valor | Por que é necessário |
|---|---|---|
| `--color-bg-recessed` | `var(--scale-neutro-100)` | superfície diferenciada; hoje inexiste e cada arquivo improvisa |
| `--color-bg-ambient` | *definido por ambiente* (§5) | o fundo suave, azulado ou esverdeado, pedido no briefing |
| `--color-ambient-accent` | *definido por ambiente* (§5) | a cor que carrega a narrativa daquele cômodo |
| `--color-ambient-accent-soft` | *definido por ambiente* (§5) | superfície do acento do ambiente |
| `--color-border-strong` | `var(--scale-neutro-300)` | fio estrutural; hoje improvisado com opacidades soltas |
| `--color-attention` / `--color-attention-surface` | `--scale-argila` / `--scale-argila-superficie` | condição humana — o par que a §5.3 exige que **não** se chame `warning` |

**O que deliberadamente NÃO é criado:** nenhum token `success`, `danger`, `error-scale` ou escala cromática semântica. A R18 é protegida pela **ausência**, exatamente como o Nível 2 do §13.2 prescreve. Os tokens `--color-success/warning/error` que já existem permanecem **como estão, sem escala e sem ampliação**, restritos aos fundos operacionais — sua unificação já está registrada na auditoria como dívida técnica separada, e não é reaberta aqui.

### 4.3 A tensão de nomenclatura, declarada

A R18 pede tokens nomeados por material; a convenção vigente no código nomeia por papel (`brand-primary`, `ink`). São incompatíveis na letra. **Resolução proposta:** preservar a convenção vigente (renomear 505 usos seria refatoração ampla sem ganho perceptivo, e a diretriz recebida é explicitamente "não crie nova convenção"), e honrar a *intenção* da R18 — que é impedir `success`/`danger` — pela ausência declarada em §4.2. Registro isto como divergência conhecida, não como omissão.

---

## 5 · O mecanismo da narrativa cromática

**A descoberta arquitetural desta proposta:** a plataforma **já** redefine tokens semânticos por escopo de ambiente (`patient-dashboard.css:2-13` faz exatamente isso). O que era o sintoma da deriva é a solução da narrativa.

Cada ambiente redefine **três tokens** — `--color-ambient-accent`, `--color-ambient-accent-soft`, `--color-bg-ambient`. Tudo o mais herda de `:root`. **Nenhum componente muda de código para mudar de cômodo.**

| Ambiente | Escopo CSS | `ambient-accent` | `bg-ambient` | Narrativa |
|---|---|---|---|---|
| **Landing** | `.landing-editorial` | alterna índigo/sage por ambiente da página | `neutro-50` | azul e verde equilibrados |
| **Paciente** | `.patient-dashboard` | `indigo-700` | `indigo-50` | azul predomina; **verde marca evolução** (§5.1) |
| **Curadoria** | `.mesa-curador`, `/coa/*` | `sage-700` | `sage-50` | verde predomina — o trabalho do cuidado |
| **Sala da Decisão** | `.ambiente-decisao` | `indigo-700` + `sage-700` em par | `neutro-50` | equilíbrio; nenhuma cor pesa mais que a outra |
| **Concierge** | `/acompanhamento` | `indigo-700` | `indigo-50` | azul predomina; **verde é continuidade** |
| **Administração** | `.app-shell` | `indigo-700` | `neutro-100` | neutros com azul; verde só em marcadores de jornada |

### 5.1 A regra que impede o semáforo

O verde carrega **evolução e continuidade**; o azul carrega **confiança, orientação e comunicação**. Nenhum dos dois carrega juízo.

> **Regra permanente proposta (R19):** *azul e verde nunca aparecem como alternativas do mesmo campo.* O azul descreve **o que a Aliviar comunica**; o verde descreve **o que avançou no tempo**. São eixos diferentes — nunca dois valores do mesmo eixo.

Isto preserva a R2 (proibição do semáforo) sob a nova paleta: o par proibido é vermelho/verde, e a nova gramática não cria um par azul/verde equivalente porque os dois nunca respondem à mesma pergunta.

### 5.2 As proporções 40/30/30

Presença de identidade na plataforma inteira, **não pixels por tela**. Operacionalização como critério de revisão, não como métrica:

- **40% neutros** — organizam. Papel, tinta, fio, linho. Continuam sendo a estrutura.
- **30% azul** — marca, ação primária, navegação, autoria/proveniência, foco.
- **30% verde** — faixa do comum, marcadores de evolução, continuidade, superfícies de acompanhamento.

Um ambiente individual desvia da média por projeto (a Curadoria é verde; a Administração é azul). **A soma da jornada é que fecha 40/30/30.** O dourado sai da conta: volta a ser fio e selo, medido em ocorrências, não em proporção.

---

## 6 · Fundos e profundidade

O briefing pede menos branco puro. A plataforma já usa marfim `#faf8f4` — a lacuna real é a **ausência de degraus de superfície**: hoje existem só canvas e branco, então tudo é ou fundo ou cartão.

**Quatro degraus, um significado cada** (respeita R9 — profundidade significa transitoriedade):

| Degrau | Valor | Significado |
|---|---|---|
| Ambiente | `--color-bg-ambient` (azulado/esverdeado por cômodo) | o cômodo |
| Recuado | `neutro-100` | o que está atrás do conteúdo |
| Papel | `neutro-50` | a superfície de leitura |
| Elevado | `neutro-50` + `--shadow-md` | **só** o transitório (dropdown, drawer, diálogo) |

Contraste preservado: tinta sobre qualquer um dos quatro fica entre **12,78:1 e 13,55:1** (§10). Superfícies adjacentes diferem por 1,04–1,06:1 — perceptíveis como material, invisíveis como divisão.

---

## 7 · Unificação dos tokens duplicados

A eliminação de duplicações pedida no briefing, com o inventário real:

| Dimensão | Hoje | Proposto |
|---|---|---|
| **Paletas** | 3 concorrentes | 1 em `:root` + 3 escopos que só redefinem `--color-ambient-*` |
| **Raios** | `6/10/16` (globals) × `12/16/20/pill` (paciente) | `--radius-sm/md/lg/pill` = `8/12/16/9999` — degrau único |
| **Sombras** | marrom (globals) × `--p-elev-1..3` (paciente) × `--shadow-card*` (landing) | `--shadow-sm/md/lg` em três degraus, tinta quente, elevação suave |
| **Durações** | `280/480/640` × `120/220` × `280/520/760/1100` | `--duration-instant/fast/base/travessia` = `120/240/360/480` |
| **Easing** | 3 curvas | `--ease-standard` única, desaceleração mais longa que a aceleração |
| **Espaçamento** | escala Tailwind × `--p-space-xs..xl` | escala Tailwind (base 4px) como única fonte |

**Motion — princípios, sem implementar animação nova.** `120ms` micro-resposta · `240ms` revelação · `480ms` travessia de ambiente (o dobro, por decisão da F2 §9) · saída mais longa que a entrada · nada elástico · `prefers-reduced-motion` já global em `globals.css:80`.

**Tipografia — hierarquia e respiro, sem trocar fonte.** Fraunces (serifa/voz humana) e Public Sans (sem-serifa/função) permanecem. Ajustes: progressão ~1.2 entre degraus (hoje há saltos irregulares), entrelinha 1.65 no corpo de leitura e 1.5 no funcional, medida de 60–68 caracteres. **Débito da auditoria a quitar junto:** ~50 ocorrências de caixa-alta com tracking violam a F2 §6.2 em toda a plataforma.

**Ícones.** `lucide-react`, traço 1.5px ótico, sem preenchimento, herdando tinta, tamanhos `16/20/24`. Regra mantida: **ícone nunca é estado** (R14).

---

## 8 · Componentes — a linguagem compartilhada

Todos consomem exclusivamente a camada semântica. Estados: `default` · `hover` · `focus-visible` (anel `--color-focus-ring`, nunca só cor) · `active` · `disabled` · `loading`.

| Componente | Regra cromática |
|---|---|
| **Botão** | primário = `ambient-accent` sólido, texto papel; secundário = fio `border-strong` + tinta; terciário = texto `ambient-accent`. **Dourado nunca preenche botão.** |
| **Card** | papel sobre recuado, fio `border` 1px, radius `md`, sem sombra em repouso. Sombra só se for transitório (R9) |
| **Input** | fundo papel, fio `border`; foco = fio `ambient-accent` + anel. Erro nunca só por cor |
| **Badge** | `ambient-accent-soft` de fundo, tinta de texto. **Nunca caixa-alta** (guarda já existente). Numérico só em fundos operacionais |
| **Tabela** | cabeçalho `bg-recessed`, fio `border` entre linhas, zebra proibida |
| **Menu/Sidebar** | fundo `bg-ambient`, item ativo = `ambient-accent-soft` + fio `ambient-accent` à esquerda |
| **Timeline** | eixo em `border-strong`; marcador de momento vivido em `sage-700`, futuro em `neutro-300` — **evolução, nunca aprovação** |
| **Progress** | ver §9 |
| **Alerta** | quatro papéis, quatro tratamentos: fato (`neutro`), confirmação (`ambient-accent`), condição (`attention`/argila), impedimento (`error`, **só fundos operacionais**) |
| **Gráfico** | séries em degraus da mesma família (`indigo-700/500/300`), nunca família por categoria; sem vermelho/verde no mesmo gráfico |
| **Dashboard** | só fundos operacionais. Número em serifa, rótulo em sem-serifa, fio em vez de cartão-caixa |

---

## 9 · Progress, gráficos e badges — padronização contextual

A diretriz recebida: mesma linguagem visual em toda a plataforma, **expressão diferente por contexto** — interpretativa nas superfícies da paciente, analítica nos fundos operacionais.

Isso colide com **R16** (*"Espera é dita em palavras. Nunca barra, nunca spinner"*) e com o banimento do *badge numérico* na §12. A diretriz pede a alteração mínima documentada em vez de revogação ampla. Proponho **emendar duas regras, preservando o que elas protegiam**:

**R16 → R16'**
> *A espera é dita em palavras — nunca em barra nem spinner.* **Progresso de jornada** (onde ela está no caminho, quantos passos faltam) pode ter forma visual **contínua e sem número**: um traço que se estende, um marcador que avança. **A espera de um sistema continua sendo dita em palavras.**

Distinção operativa: **progresso de jornada** é a pessoa avançando (legítimo, interpretativo); **progresso de processamento** é o sistema trabalhando (continua proibido nas superfícies dela). O wizard da Recepção já implementa a primeira forma corretamente — *"progresso sem número"*, classificada 🟢 na auditoria. A emenda **descreve o que já existe** em vez de autorizar algo novo.

**§12 (badge numérico) → emenda**
> *Badge numérico permanece proibido nas superfícies da pessoa atendida.* Nos fundos operacionais é legítimo — a auditoria pós-consolidação já os aceita ali (*"densidade operacional aceita (23)"*).

**O que NÃO é emendado, e permanece proibido em toda superfície da paciente:** contagem que possa ser somada (R5), barra de progresso de processamento, skeleton pulsante, spinner infinito, ícone como estado (R14), cor codificando correspondência (R6), qualquer coisa que produza placar. **A textura de linha continua sendo o único codificador de correspondência do Mapa.**

**Gráficos e dashboards** não recebem emenda: continuam exclusivos dos fundos operacionais, agora dentro da paleta única.

---

## 10 · Contraste validado

Calculado pela fórmula WCAG de luminância relativa (não estimado). Piso do projeto: **AA**.

| Par | Razão | Veredito |
|---|---|---|
| tinta `neutro-900` / papel `neutro-50` | **13,55:1** | AAA |
| tinta suave `neutro-600` / papel | **4,77:1** | AA |
| tinta suave `neutro-700` / papel | **6,76:1** | AA |
| `indigo-700` / papel | **10,72:1** | AAA |
| papel / `indigo-700` (botão primário) | **11,37:1** | AAA |
| papel / `indigo-600` (hover) | **8,18:1** | AAA |
| `indigo-700` / `indigo-50` | **10,11:1** | AAA |
| `sage-700` / papel | **5,43:1** | AA |
| papel / `sage-700` | **5,76:1** | AA |
| papel / `sage-900` | **14,36:1** | AAA |
| `sage-700` / `sage-50` | **5,23:1** | AA |
| tinta / `sage-300` (badge) | **7,40:1** | AAA |
| tinta / `indigo-200` (badge) | **8,78:1** | AAA |
| argila `#955530` / papel | **4,90:1** | AA |
| argila / superfície de argila | **5,07:1** | AA |
| tinta / `bg-ambient` índigo ou sage | **12,78 / 13,06:1** | AAA |

**Reprovações conhecidas e intencionais** — decorativos, com proibição de uso como texto já registrada na ADR-017/DESIGN_SYSTEM §2.1: `sage-500` sobre papel (2,76:1) e dourado sobre papel (2,91:1).

---

## 11 · Impacto

**Arquivos que mudam (visual apenas):**

- `src/app/globals.css` — camada `--scale-*` + remapeamento semântico
- `src/app/patient-dashboard.css`, `landing-editorial.css`, `mesa-curador.css` — deixam de declarar paleta própria; passam a declarar só `--color-ambient-*`
- `tailwind.config.ts` — expor os tokens semânticos novos
- `src/components/ui/*` (26 primitivas) — ajuste de classes para os tokens novos
- 5 arquivos com hex literal — `video-section.tsx`, `caminhos/retrato.tsx` e os 3 CSS

**Nenhuma mudança de comportamento.** Regras de negócio, APIs, Actions, Repository, estado, banco, Curadoria, fluxos, navegação e **textos** intocados — os 505 usos de token existentes continuam válidos por construção, já que a camada semântica preserva nome e papel.

**Documentos a atualizar após aprovação:** `docs/DESIGN_SYSTEM.md` §2.1 (escalas), `docs/experiencia/SISTEMA_VISUAL.md` §5 + R16' + R19, e uma **ADR nova** registrando a reconvergência como correção de deriva (não rebranding), referenciando ADR-008 e ADR-017 sem superá-las.

---

## 12 · Riscos

| Risco | Mitigação |
|---|---|
| Regressão visual ampla (285 `.tsx`) | Ordem por ambiente, uma onda por vez, capturas antes/depois — o método que já funcionou nas Ondas 1–6 |
| Testes de fonte existentes (9 guardas) quebrarem | Nenhum deles verifica cor; verificam blur, caixa-alta, `text-muted-foreground`, "Sistema Operacional". Rodar a suíte inteira a cada onda |
| Azul ser lido como "corporativo/hospitalar" | Dessaturado, fosco, sempre sobre papel quente e com ≥50% de vazio (R10). O risco real é saturação, não o azul |
| Verde perder o significado de continuidade | R19 (§5.1) — eixos separados, nunca alternativas do mesmo campo |
| 40/30/30 virar métrica burocrática | É critério de revisão da jornada inteira, não de tela |

---

## 13 · Ordem de execução proposta (após aprovação)

1. **Fundação** — `--scale-*` + remapeamento semântico em `globals.css` + `tailwind.config.ts`. Sem tocar componente. Já muda a plataforma inteira.
2. **Primitivas** — as 26 de `ui/`, incluindo os 5 hex literais.
3. **Ambientes** — os 3 CSS escopados perdem paleta própria e ganham `--color-ambient-*`.
4. **Narrativa** — os seis ambientes recebem seu acento (§5).
5. **Acabamento** — tipografia, caixa-alta transversal, ícones, raios, sombras.
6. **Documentação** — DESIGN_SYSTEM, SISTEMA_VISUAL, ADR nova, guardas de fonte para a paleta única.

---

## 14 · O que peço aprovação

1. **As escalas de §3** — âncoras em hex canônicos, com os três aprendizados do verde incorporados.
2. **A estratégia de token de §4** — escala interna privada, camada semântica pública inalterada em nome, seis tokens novos no mesmo padrão, nenhum `success`/`danger` novo.
3. **O mecanismo de ambiente de §5** — narrativa cromática por escopo, zero código de componente por cômodo, mais a **R19** que impede o par azul/verde de virar semáforo.
4. **As duas emendas de §9** — R16' (progresso de jornada ≠ espera de sistema) e badge numérico restrito aos fundos. São as alterações mínimas; nada mais é revogado.
5. **A ordem de §13.**
