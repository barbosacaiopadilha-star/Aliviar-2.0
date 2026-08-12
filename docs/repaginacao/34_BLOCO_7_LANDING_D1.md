# 34 · Bloco 7 / D-1 — a Landing, com a decisão resolvida

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-12 |
| **Base** | `37ee9e6` · ledger **121** · árvore com os dois `??` **pré-existentes**, intocados |
| **Natureza** | contrato vinculante. **Zero produção, zero teste, zero migration, zero RLS, zero evidência** |
| **Destinatário** | **`03 ENGENHEIRO`** |

---

## 1 · Pré-flight

HEAD `37ee9e6` ✓ · Track D encerrada ([32](32_TRACK_D_LIMPEZA_E_CAPACIDADE_ENTERRADA.md) + [33](33_TRACK_D_FECHAMENTO.md)) ✓ ·
ledger **121/121** ✓ · árvore só com os dois pré-existentes ✓

**Nenhuma referência viva aos 28 removidos** — varredura em `src/**`: zero
ocorrências em `.ts`/`.tsx`. **Sobram duas em CSS**, e são as herdadas (§9).

**Verificação que este contrato precisava fazer, e fez:** o plano de 2026-08-10
foi escrito **antes** da Track D e manda *"reusar `LandingSection`,
`LandingEyebrow` e as cenas existentes"*. Os três **sobreviveram** —
`editorial/landing-section.tsx` exporta `LandingEyebrow`, e o que saiu foi o
`section-eyebrow.tsx` **da landing morta**. `header-compaction`, `link-button`,
`public-header`, `ImmersiveBackdrop` e `RevealGroup`: **todos vivos**.

> **O plano não aponta para nada removido.** Podia ter apontado.

## 2 · Quantitativo

| Cenário | Prompts até o encerramento |
|---|---|
| **melhor caso** | **7** |
| **previsão central** | **8–9** |
| **com uma remediação** | **10–11** |

Composição central: **Bloco 7** (1 engenharia + 1 gate) → **Blocos 11/12** (⚠️ **D-6**
e 5–10 casos reais: 3–4) → **passe final** (2) → **certificação geral** (1).

**Fora do caminho crítico, deliberadamente:** `GAP-D-1` (fase Filtros) ·
`GAP-D-2` · `GAP-D-3` · `GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` · D-5 · D-7 ·
D-10 · GAP-D12-C1 · A3b/A4 · dívida do banco local · **G-6**.

## 3 · D-1, reconstruída

| | |
|---|---|
| **problema observado** | a referência-mestra mostra **sete** blocos; a landing viva monta **oito**, e **quatro não aparecem na imagem**: `ProblemaSection`, `RespiroSection`, `FaqCompactSection`, `ConviteSection` |
| **ator afetado** | **quem ainda não é paciente** — a pessoa que chega pela primeira vez |
| **rota e estado** | `/` — `(public)/page.tsx`, anônima |
| **comportamento atual** | header **sem navegação** (só logo + `/login`); Hero **centralizado** com vídeo abaixo; **não existem** as seções "Nosso Método" (4 pilares) e "Concierge Aliviar" (3 pilares); só `#problema` tem âncora |
| **fato canônico** | **nenhum.** A Landing é conteúdo estático — sem tabela, sem writer, sem RLS |
| **dano hoje** | quem chega **não encontra** o que a Aliviar faz nem quem a acompanha; sem nav, a página só se lê rolando inteira; e o único CTA anônimo é **`Entrar`** — que fala com quem já é de casa |

### 3.1 · A decisão, resolvida — e não por opinião

> ### D-1 = leitura ② · **a referência é a espinha visual. Os quatro blocos ficam.**

**A prova é um ato, não um parecer.** A Track D apagou **23 arquivos de landing**
e, no mesmo contrato, **protegeu `landing/editorial/**` por escrito**. Se a
leitura ① fosse a pretendida — a referência substituindo a página —, aquele era
o momento exato de derrubar também os quatro blocos. **Não foi feito, e o
contrato os blindou nominalmente.**

O plano §B.1 já recomendava ②, ancorado na missão original: *"se algo atual já
atende, não reconstruir"* (§9), proibição de regressão (§14), e *"a landing da
referência, funcionando"* (§15) — **não uma landing mais curta**. A imagem é
composição de apresentação; ela não afirma *"nada além disto"*.

**Consequência vinculante:** ⛔ **proibido remover** `ProblemaSection`,
`RespiroSection`, `FaqCompactSection` ou `ConviteSection`.

## 4 · As fronteiras operacionais — duas colidem

| Regra aprovada | Colide? |
|---|---|
| Curador responsável até a decisão | ⚠️ **sim** — via a seção "Concierge" |
| Concierge só depois da decisão | ⚠️ **sim** — idem |
| dois encontros · análise entre eles · validação exige reunião | ❌ não — a Landing não tem Caso |
| facilitar o trabalho do Curador | ❌ não se aplica |
| fato canônico não é substituído por estado visual | ❌ **não há fato** para substituir |

### 4.1 · A colisão do Concierge, resolvida aqui

A referência pede uma seção **"Concierge Aliviar"**. Mas o produto diz três
coisas que a copy tem de respeitar:

1. **até a decisão, quem responde é o Curador** (`journey-responsibility`);
2. **não existe identidade persistida de Concierge** (`GAP-D12-C1`) — o produto
   diz *"Equipe Aliviar"*, e inventar uma pessoa seria pior;
3. **não há SLA aprovado** (doutrina herdada da Track C e de `continuity-worklist`).

> **Resolução:** a seção descreve **o serviço da Aliviar**, no registro
> institucional que a B3 fixou — nunca uma pessoa designada, nunca presença
> dedicada desde o primeiro dia, nunca prazo. **O terceiro pilar diz
> explicitamente "depois que você escolhe"**, que é exatamente onde o Concierge
> entra.

### 4.2 · O CTA "Começar", resolvido

O header anônimo tem hoje **só `Entrar`** — `portalCta` só existe para quem já
está autenticado.

**Destino do CTA `Começar`: `/sua-historia`.** É o mesmo destino do CTA do Hero,
a rota existe e está no ar. **D-7 continua aberta e não bloqueia**: ela trata do
que acontece **depois** que a história é enviada, não do convite.

## 5 · Fatos, writers e segurança — o mapa honesto

| | |
|---|---|
| tabelas / colunas | **nenhuma** |
| writers | **nenhum** |
| atores autorizados | **anônimo** |
| RLS · triggers · auditoria | **nenhum** |
| idempotência · transições de estado | **não se aplica** |
| projeções consumidas | **nenhuma** — conteúdo estático |
| fixtures | **nenhuma** |
| compatibilidade legada | **nenhuma** — a única landing é `editorial/` |

**Classificação exigida:**

| Categoria | Veredito |
|---|---|
| reutilização do domínio existente | **total** — nenhum domínio é tocado |
| **lacuna de superfície** | ✅ **sim** — nav, duas seções novas, âncoras |
| lacuna de fato | ❌ não |
| lacuna de segurança | ❌ não — **mas** vale a regra do §6.5 |
| **contradição documental** | ✅ **duas** — D-1 nunca formalizada (§3.1) e o Concierge antes da decisão (§4.1). **Ambas resolvidas acima** |
| funcionalidade nova | ❌ não — é composição visual |

> **Nenhum experimento-gate é necessário.** Não há hipótese essencial: tudo é
> verificável por inspeção da página renderizada.

## 6 · Superfície e copy — texto final

**Ordem dos blocos em `(public)/page.tsx`:**

```
Header (5 âncoras + Começar)
Hero "Capítulo Zero"        ← recomposto em 2 colunas
Problema                     #problema      ← permanece intacto
Respiro                                      ← permanece intacto
Nosso Método (4 pilares)     #metodo        ← NOVO
Suas prioridades             #para-quem     ← permanece, refinado
Concierge Aliviar (3)        #concierge     ← NOVO
Como funciona (5 etapas)     #como-funciona ← eyebrow + numeração
Bloco institucional          #quem-somos    ← copy + 4 diferenciais
FAQ                                          ← permanece intacto
Convite                                      ← permanece intacto
```

### 6.1 · Header

**Links, nesta ordem:** `Quem somos` `#quem-somos` · `Para quem é` `#para-quem` ·
`Como funciona` `#como-funciona` · `Nossa curadoria` `#metodo` · `Concierge` `#concierge`
**CTA primário:** `Começar` → `/sua-historia`
**`Entrar`** permanece, secundário. **`portalCta` autenticado permanece intacto.**

Os cinco `id` nascem **no passo 1**, com `scroll-margin-top`. Mobile: logo +
`Começar`; os links num drawer — **o CTA nunca some**.

### 6.2 · Hero

Eyebrow: **`Capítulo Zero`**
CTA primário: **`Começar minha história`** → `/sua-historia`
CTA secundário: **`Assistir ao vídeo`**
Duas colunas ≥1024px; abaixo disso empilha **título → corpo → vídeo → CTA**, com
o vídeo em largura total.

> A frase que sai do eyebrow — *"Curadoria médica independente"* — **não se
> perde**: ela é o primeiro diferencial do bloco institucional (§6.4).

### 6.3 · Seções novas — copy exata

**`Nosso Método` — eyebrow `Nosso Método`, título `Quatro movimentos, sempre nesta ordem.`**

| Pilar | Texto |
|---|---|
| **Consciência** | `Entender o que está em jogo antes de decidir qualquer coisa.` |
| **Contexto** | `Sua história, suas prioridades e o que você não abre mão — nas suas palavras.` |
| **Análise** | `Um Curador estuda o seu caso e compara caminhos, pessoa a pessoa.` |
| **Direção** | `Três caminhos legítimos, com o que cada um oferece e o que cada um pede.` |

**`Concierge Aliviar` — eyebrow `Concierge Aliviar`, título `Você não faz isso sozinha.`**

| Pilar | Texto |
|---|---|
| **Organização que simplifica** | `Documentos, etapas e informações reunidos num lugar só — você não precisa guardar nada de cabeça.` |
| **Navegação com segurança** | `Quando surge uma dúvida, há alguém da Aliviar para responder. Você nunca fica diante de uma decisão sem ter a quem perguntar.` |
| **Acompanhamento que acolhe** | `Depois que você escolhe, a Aliviar continua com você — o caso nunca fica sem alguém respondendo por ele.` |

> ⛔ **Proibido nesta seção:** nome de pessoa · foto · telefone · horário ·
> prazo de resposta · *"seu Concierge"* · qualquer verbo que prometa
> agendamento, intermediação ou contato com profissional.

### 6.4 · Bloco institucional

**Quatro linhas editoriais** — a quarta em dourado:

```
Curadoria é método.
Concierge é tranquilidade.
Independência é o que torna as duas possíveis.
E a decisão continua sendo sua.
```

**Quatro diferenciais:**

```
Curadoria médica independente — sem vínculo com operadoras ou hospitais.
Um Curador humano estuda cada caso — nenhum algoritmo escolhe por você.
Sem ranking, sem nota, sem "melhor opção".
Você decide, e a Aliviar continua com você depois.
```

**Todos os quatro são verificáveis contra o produto no ar.** ⛔ **Não criar** a
seção de independência (plano §B.2): a mensagem **é** o primeiro diferencial, e
repeti-la alongaria a página.

### 6.5 · Regra de promessa — vale para toda a página

> **Nenhuma frase nova pode afirmar capacidade que o produto não tem.**
> Proibidos: prazo · SLA · *"em breve"* · *"entraremos em contato"* ·
> agendamento · intermediação com o profissional · número de médicos, cidades ou
> casos · depoimento · selo · qualquer métrica não medida.

### 6.6 · Estados, mobile e acessibilidade

**Aparece sempre** — a Landing é anônima e não tem estado. **Ausente** apenas
para quem está autenticado no que já é diferente hoje: `portalCta` no lugar de
`Entrar`, **comportamento preservado**.

Sem feedback imediato, sem estado durável, sem erro — **não há ação que
persista**. Os únicos controles são links.

**Mobile:** 4 pilares `1 coluna` com divisores horizontais · 3 pilares `1 coluna` ·
5 etapas **verticais com conector**, nunca espremidas · nada quebra em **320px** ·
nenhum texto abaixo de **14px** · alvos ≥ **44px**.

**Acessibilidade:** contraste **AA** · `<h1>` único no Hero, seções em `<h2>`,
pilares em `<h3>` · nav por teclado com foco visível · drawer com
`aria-expanded`, `Esc` e foco preso · ícones `aria-hidden` · vídeo com controles,
**sem autoplay** · `prefers-reduced-motion` cobre **tudo** que nascer.

### 6.7 · Relação com WhatsApp, Documentos, Curadoria e jornada

**Nenhuma.** ⛔ **Não colocar `Falar com a Aliviar` na Landing** — a Track C o
definiu como canal **da paciente**, nas sete superfícies autenticadas. Na
Landing ele viraria suporte a estranho, que é capacidade inexistente. A porta
pública é **`Começar` → `/sua-historia`**, e só.

## 7 · Arquivos

| Arquivo | Mudança |
|---|---|
| [`public-header.tsx`](../../src/components/landing/public-header.tsx) | nav de 5 âncoras · CTA `Começar` · drawer mobile |
| [`editorial/hero-editorial.tsx`](../../src/components/landing/editorial/hero-editorial.tsx) | duas colunas · eyebrow · 2º CTA |
| [`editorial/editorial-sections.tsx`](../../src/components/landing/editorial/editorial-sections.tsx) | duas seções novas · eyebrow e numeração de "Como funciona" · institucional · `id` nas seções |
| [`(public)/page.tsx`](../../src/app/(public)/page.tsx) | ordem dos blocos |
| [`landing-editorial.css`](../../src/app/landing-editorial.css) | **acréscimos** + remoção de `.landing-faq-book` (§9) |
| [`globals.css`](../../src/app/globals.css) | remoção de `.golden-thread-path` (§9) |

**Seis arquivos. Nenhum backend, nenhuma rota nova, nenhuma migration.**

**⛔ Proibidos:** `AGENTS.md` · `foundation/FOUNDATION_VERIFICATION.md` ·
`src/modules/**` · `supabase/**` · `next.config.ts` · footer · SEO · analytics ·
logo · paleta · tipografia · `sua-historia/**` · `login/**` · **os quatro blocos
da D-1** · qualquer superfície de paciente ou Curador.

**⛔ Proibido criar componente visual novo.** Reusar `LandingSection`,
`LandingEyebrow`, `LinkButton`, `ImmersiveBackdrop` e `RevealGroup`.
**⛔ Proibido reescrever `landing-editorial.css`** — 556 linhas em produção; **só
acrescentar**, exceto a remoção nomeada do §9.

**Migration: ⛔ proibida.** Ledger fica **121**.

## 8 · Testes

| # | Camada | Prova |
|---|---|---|
| **T-7-1** | componente | a página monta **onze** blocos, na ordem do §6, e os quatro da D-1 estão presentes |
| **T-7-2** | componente | os **cinco** `id` existem e **cada link do header aponta para um `id` que existe** |
| **T-7-3** | componente | header anônimo traz `Começar` → `/sua-historia`, e `Entrar` sobrevive |
| **T-7-4** | unitário | **guarda de promessa** — o texto renderizado das seções novas e do institucional não contém prazo, SLA, *"em breve"*, *"entraremos em contato"*, nome próprio de Concierge, nem número de médicos/cidades/casos |
| **T-7-5** | unitário | ⛔ `Falar com a Aliviar` e `wa.me` **não aparecem** em `(public)/**` nem em `components/landing/**` |
| **T-7-6** | componente | hierarquia de cabeçalhos: **um** `<h1>`, seções `<h2>`, pilares `<h3>` |
| **T-7-7** | e2e | 1280 · 768 · 390 · **320**: `scrollWidth === clientWidth` e as 5 etapas verticais em 390 |
| **T-7-8** | e2e | o vídeo **não** carrega sozinho — sem requisição de mídia antes do clique |
| **T-7-9** | e2e | drawer mobile: abre, `aria-expanded`, fecha por `Esc`, foco preso |
| **T-7-10** | unitário | `globals.css` e `landing-editorial.css` não contêm `.golden-thread-path` nem `.landing-faq-book` |
| **T-7-11** | manter | o detector de órfãos da Track D continua verde, **com a mesma contagem** |

## 9 · Herdados da Track D

| Achado | Nesta Track |
|---|---|
| **`.golden-thread-path` órfã em `globals.css`** | ✅ **corrigido** — é resíduo de landing e o arquivo já será aberto |
| **`.landing-faq-book` em `landing-editorial.css`** | ✅ **corrigido** — resíduo do `faq-book-section` removido; **zero consumidores** em `.tsx` |
| **V-D-1** — regras globais da landing perderam falseabilidade | **preservado** para o passe final — **T-7-1..T-7-3** repõem falseabilidade sobre a landing viva, que é o que importa agora |
| detector não fecha cluster morto em ciclo | **preservado** — passe final |
| detector ignora import de efeito colateral | **preservado** — passe final |
| motivos da allowlist sem validação semântica | **preservado** — passe final |
| **G-6** — falha unitária pré-existente | **preservado, alheio** — o Bloco 7 não tem arquivo SQL |

**Nenhum deles bloqueia D-1.** Os dois corrigidos entram porque **são resíduo de
landing** e o custo é duas remoções de CSS em arquivos já abertos.

## 10 · Mutações

| | Mutação | Deve cair |
|---|---|---|
| **M-7-1** | remover `FaqCompactSection` da página | **T-7-1** — é a guarda da D-1 |
| **M-7-2** | apontar um link do header para `#inexistente` | **T-7-2** |
| **M-7-3** | escrever *"Respondemos em até 24 horas"* num pilar | **T-7-4** |
| **M-7-4** | pôr `Falar com a Aliviar` no footer público | **T-7-5** |
| **M-7-5** | trocar o `<h2>` de um pilar por `<h1>` | **T-7-6** |
| **M-7-6** | `preload="auto"` no vídeo | **T-7-8** |

**M-7-1 e M-7-3 são as que importam:** uma protege a decisão do DT-01, a outra
protege a paciente de uma promessa que a Aliviar não pode cumprir.

## 11 · Evidências

| | Viewport | O que prova |
|---|---|---|
| **EV-7-001** | 1440×900 | página inteira — os onze blocos na ordem |
| **EV-7-002** | 1440×900 | Hero em duas colunas, com eyebrow e os dois CTAs |
| **EV-7-003** | 390×844 | 5 etapas **verticais com conector** |
| **EV-7-004** | 390×844 | drawer aberto, com o CTA `Começar` visível |
| **EV-7-005** | 320×568 | nada quebra |

Landing é **pública e sem dados** — nenhuma fixture, **nenhum cleanup**, nenhum
resíduo possível.

## 12 · Regressão mínima

`npm run build` verde · suíte de unidade, componente e e2e verde · **os quatro
blocos da D-1 presentes** · `/sua-historia` e `/login` funcionando · footer e
redirects intactos · `portalCta` autenticado inalterado · ledger **121** · os
dois `??` intocados.

## 13 · Aprovação e reprovação

**Aprova se, e só se:** os 18 critérios visuais do [plano §I](../PLANO_ATUALIZACAO_LANDING_2026_08.md)
e os 9 de acessibilidade do §H · T-7-1..T-7-11 · M-7-1..M-7-6 derrubam o previsto ·
zero overflow de 1280 a 320 · vídeo não autocarrega · **nenhuma promessa nova** ·
build e suíte verdes.

**Reprova se:** qualquer bloco da D-1 sair · nascer componente visual novo ·
`landing-editorial.css` for reescrito · aparecer migration, rota, RLS ou
backend · o WhatsApp entrar na Landing · surgir prazo, SLA, depoimento, selo ou
métrica não medida · a seção Concierge nomear uma pessoa · a hierarquia de
cabeçalhos quebrar.

## 14 · Gaps preservados

`GAP-D-1` · `GAP-D-2` · `GAP-D-3` · `GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` ·
**D-5** · **D-6** · **D-7** · **D-8** · D-10 · GAP-D12-C1 · A3b/A4 · G-6 ·
V-D-1 e os três achados do detector · dívida do banco local ·
`FOUNDATION_VERIFICATION.md` fora do Git — **todos intocados**.

## 15 · Ordem de execução

**Uma passagem do `03 ENGENHEIRO`, nove commits, nesta ordem:**

1. **âncoras + header** — os `id` precisam existir antes dos links
2. **Hero** em duas colunas
3. **"Nosso Método"** (4 pilares)
4. **"Concierge Aliviar"** (3 pilares)
5. **"Como funciona"** — eyebrow e numeração com conectores
6. **institucional** — 4 linhas + 4 diferenciais
7. **"Suas prioridades"** — refinamento
8. **responsividade** — 1280 · 768 · 390 · 320
9. **performance** + remoção das duas classes órfãs

**Um gate do `04 VERIFICADOR`**, incluindo a **auditoria de promessa** do §6.5.

**`05 CERTIFICADOR`: não exigido** — não há fato novo, migration, promessa
operacional nem gatilho de governança. **A auditoria de promessa é o substituto
proporcional**, e ela é do gate.

**Não dividir a engenharia.** Um domínio, zero banco, zero migração destrutiva.

---

# BLOCO 7 / D-1 CONTRATADO — PRONTO PARA EXECUÇÃO ACELERADA PELO 03 ENGENHEIRO

**D-1 está resolvida: espinha visual.** A prova não é uma opinião — é o que a
Track D **fez**: apagou 23 arquivos de landing e blindou `editorial/**` por
escrito. Quem quisesse a página mais curta tinha ali o momento, e o contrato
protegeu os quatro blocos nominalmente.

**E a colisão que ninguém tinha visto ficou resolvida no contrato, não no
Engenheiro:** a referência pede uma seção "Concierge", e o produto diz que o
Concierge só entra **depois da decisão** — então a copy fala do serviço, nunca de
uma pessoa designada, e o terceiro pilar começa exatamente por *"depois que você
escolhe"*.
