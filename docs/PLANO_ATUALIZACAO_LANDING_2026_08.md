# Plano de atualização controlada da Landing Aliviar

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-10 |
| **Branch** | `main` · **HEAD** `dff4c86` · **árvore limpa** |
| **Natureza** | auditoria + plano. **Zero código nesta missão** |
| **Referência-mestra** | a imagem fornecida na missão |

---

## A. Estado atual

**Stack:** Next.js App Router · React Server Components · Tailwind + CSS
próprio (`landing-editorial.css`, 536+ linhas) · sem design system externo.

### A.1 O que está no ar

`src/app/(public)/page.tsx` monta **oito blocos**:

| # | Componente | Papel |
|---|---|---|
| 1 | `HeroEditorial` | eyebrow + título + corpo + **um CTA** + vídeo **abaixo**, tudo **centralizado** |
| 2 | `ProblemaSection` | *"O cenário atual"* — três itens |
| 3 | `RespiroSection` | pausa visual, sem conteúdo |
| 4 | `MetodoSection` | *"O Método"* — **cinco passos numerados** |
| 5 | `PrioridadesSection` | *"Suas prioridades, nas suas palavras."* |
| 6 | `QuemSomosSection` | bloco **escuro** (`variant="forest"`) |
| 7 | `FaqCompactSection` | dúvidas |
| 8 | `ConviteSection` | CTA final |

Envolvidos por `RevealGroup` (motion de entrada). Moldura: `PublicHeaderContainer`
+ `PublicFooter`.

### A.2 Assets

| Asset | Situação |
|---|---|
| `/videos/video-institucional-aliviar.webm` | existe — **5,0 MB** ⚠️ |
| `/scenes/recepcao-bright.jpg` | cena do Hero — **é a recepção da referência** ✅ |
| `/scenes/grand-finale.jpg` | cena do átrio |
| `/brand/logo-aliviar-icon.png` | logo do header |

### A.3 ⚠️ Três gerações de landing convivem no repositório

| Geração | Arquivos | Consumidor |
|---|---|---|
| **`editorial/*`** | 6 arquivos | **VIVA** — usada por `page.tsx` |
| `portal-*` (`portal-experience` + 10 satélites, `video-section`, `golden-thread`, `final-cta-section`, `faq-book-*`, `final-actions`) | **~16 arquivos** | **ZERO consumidor** |
| `v2/*` (hero, metodo, curadoria, presenca) | **4 arquivos** | **ZERO consumidor** |

> **Consequência para esta missão:** o Engenheiro **não deve tocar** em nenhum
> arquivo `portal-*` ou `v2/*`. Eles não estão no ar. Editá-los por engano
> produziria trabalho invisível — e é um risco real, porque `v2/hero-experience`
> e `portal-experience` **parecem** ser a landing.
>
> **Limpeza dos ~20 arquivos mortos: RECOMENDAÇÃO, não parte deste pacote.**

### A.4 O que já está compatível com a referência

| Já atende | Onde |
|---|---|
| paleta marfim / azul profundo / verde suave / dourado discreto | tokens de `landing-editorial.css` |
| tipografia editorial nos títulos | `landing-heading`, `landing-hero-title` |
| arquitetura realista como pano de fundo | `ImmersiveBackdrop` + as duas cenas |
| bloco institucional escuro | `QuemSomosSection` `variant="forest"` |
| cinco etapas da curadoria, com copy quase idêntica à referência | `MetodoSection` |
| vídeo institucional no Hero | `HeroVideo` |
| `prefers-reduced-motion` | `globals.css` **e** `landing-editorial.css` |
| espaço em branco, baixa poluição, poucos cards | doutrina já aplicada |

> **Isto é muito.** A identidade da referência **já é** a identidade do site. O
> delta é de **composição e completude**, não de estética.

## B. Gap analysis, bloco a bloco

| Bloco da referência | Como está | Como deve ficar | Delta | Prio |
|---|---|---|---|---|
| **A · Header** | logo + botão `Entrar`/`/login`. **Sem navegação** | logo + **5 links** (Quem somos · Para quem é · Como funciona · Nossa curadoria · Concierge) + CTA **Começar** | **novo**: nav âncora + CTA primário; sticky discreto | **P0** |
| **B · Hero "Capítulo Zero"** | **centralizado**, vídeo **abaixo** | **duas colunas**: texto à esquerda, vídeo à direita; eyebrow *"Capítulo Zero"*; título em três linhas; CTA secundário *"Assistir ao vídeo"* | **recomposição de layout** + eyebrow + CTA secundário | **P0** |
| **C · Nosso Método** (4 pilares) | **não existe** | Consciência · Contexto · Análise · Direção, ícones minimalistas, divisores verticais | **seção nova** | **P0** |
| **D · Suas prioridades** | existe, próximo | atmosfera azul-clara, símbolo ao fundo, CTA *"Começar agora"* | ajuste de fundo/CTA | **P1** |
| **E · Concierge Aliviar** (3 pilares) | **não existe** | Organização que simplifica · Navegação com segurança · Acompanhamento que acolhe | **seção nova** | **P0** |
| **F · Como funciona** (5 etapas) | **existe** como *"O Método"* | mesmos 5 passos, **numerados em linha com conectores**, eyebrow *"Como funciona nossa curadoria"* | renomear eyebrow + tratamento numérico | **P1** |
| **G · Bloco institucional** | existe (escuro) | 4 linhas editoriais (*"Curadoria é método… Concierge é tranquilidade"*) + **4 diferenciais com ícone** | copy + lista de diferenciais | **P1** |
| **— · `ProblemaSection`** | existe | **não está na referência** | ⚠️ **decisão do DT-01** (§B.1) | — |
| **— · `RespiroSection`** | existe | não está na referência | ⚠️ idem | — |
| **— · `FaqCompactSection`** | existe | não está na referência | ⚠️ idem | — |
| **— · `ConviteSection`** | existe | não está na referência (o CTA final vive no header e no bloco D) | ⚠️ idem | — |

### B.1 🔴 A decisão que eu não posso tomar

A referência mostra **sete blocos**. A landing viva tem **oito**, e **quatro
deles não aparecem na referência**: Problema, Respiro, FAQ e Convite.

**Duas leituras, e só o DT-01 escolhe:**

| Leitura | Consequência |
|---|---|
| **① A referência é a página inteira** | Problema, Respiro, FAQ e Convite **saem**. A landing encurta bastante e perde o argumento *"por que curadoria"* (Problema) e o tratamento de objeções (FAQ) |
| **② A referência é a espinha visual; o que existe e funciona permanece** | os quatro ficam, intercalados nos blocos novos. A página fica mais longa que a imagem |

> **Recomendo ②**, e o fundamento é a própria missão: §9 diz *"se algo atual já
> atende, não reconstruir"*, §14 proíbe regressão, e §15 quer *"a landing da
> referência, funcionando"* — não uma landing mais curta. Além disso, a imagem
> é uma composição de apresentação; ela não afirma *"nada além disto"*.
>
> **Mas isto é conteúdo, não execução — e o §13 me proíbe de mudar texto
> substantivamente. Registro como decisão, não como proposta.**

**Ordem sugerida na leitura ②:**

```
Header (nav + Começar)
Hero "Capítulo Zero"          ← recomposto em 2 colunas
Problema  "O cenário atual"   ← permanece
Respiro                        ← permanece
Nosso Método (4 pilares)      ← NOVO
Suas prioridades              ← permanece, ajustado
Concierge Aliviar (3 pilares) ← NOVO
Como funciona (5 etapas)      ← renomeado
Bloco institucional           ← copy + diferenciais
FAQ                            ← permanece
Convite                        ← permanece
```

### B.2 §5 — a seção de independência **não deve ser criada**

A missão pede avaliar uma seção *"Escolhas de saúde pedem independência"*.

**Avaliação: não agrega — porque a mensagem já é o primeiro diferencial do bloco
institucional da própria referência**: *"Curadoria médica independente — sem
vínculos com operadoras ou hospitais."*

> Criar uma seção separada **duplicaria** a mensagem e alongaria a página, que é
> exatamente o que o §5 manda evitar. **Recomendo reforçá-la onde ela já
> está** — no bloco G, que é justamente um dos elementos mais fortes da
> referência.

## C. Preservar / alterar / não alterar

| Elemento | Decisão | Justificativa |
|---|---|---|
| paleta e tokens de cor | **NÃO ALTERAR** | já é a da referência |
| tipografia editorial | **NÃO ALTERAR** | já é a da referência |
| `ImmersiveBackdrop` + as duas cenas | **PRESERVAR**, reutilizar nas seções novas | a cena do Hero **é** a recepção da imagem |
| `landing-editorial.css` | **ESTENDER**, nunca reescrever | 536 linhas em produção; reescrever é regressão garantida |
| `RevealGroup` / motion | **PRESERVAR** | já discreto e com `reduced-motion` |
| `PublicHeader` | **ALTERAR** — acrescentar nav + CTA | é o gap P0 mais visível |
| `HeroEditorial` | **ALTERAR** — recompor em duas colunas | mantém conteúdo, muda arranjo |
| `MetodoSection` | **ALTERAR** — eyebrow e tratamento numérico | conteúdo permanece |
| `QuemSomosSection` | **ALTERAR** — copy editorial + 4 diferenciais | estrutura permanece |
| `ProblemaSection` · `RespiroSection` · `FaqCompactSection` · `ConviteSection` | **NÃO ALTERAR** *(sob leitura ②)* | funcionam; §9 |
| `portal-*` e `v2/*` | **NÃO TOCAR** | mortos; §A.3 |
| logo, rotas, `/sua-historia`, `/login`, footer, SEO, analytics | **NÃO ALTERAR** | §13/§14 |

## D. Plano de implementação — ordem segura

| # | Passo | Por que nesta ordem |
|---|---|---|
| **1** | **Header**: nav de 5 âncoras + CTA `Começar`; sticky discreto; menu mobile | as âncoras precisam existir **antes** das seções que elas apontam |
| **2** | **Hero em duas colunas** | maior impacto visual; isolado num arquivo |
| **3** | **Seção "Nosso Método"** (4 pilares) | nova, sem dependência |
| **4** | **Seção "Concierge Aliviar"** (3 pilares) | nova, sem dependência |
| **5** | **"Como funciona"**: eyebrow + numeração com conectores | edita seção existente |
| **6** | **Bloco institucional**: 4 linhas + 4 diferenciais | edita seção existente |
| **7** | **"Suas prioridades"**: fundo azul-claro, símbolo suavizado, CTA | refinamento |
| **8** | **Passe de responsividade** nas quatro seções tocadas | depois de tudo posicionado |
| **9** | **Passe de performance** (vídeo, imagens, CLS) | por último, com a página real |

**Cada passo é um commit próprio.** Um passo por vez permite reverter sem
desfazer os outros.

## E. Responsividade

| Bloco | Desktop | Tablet (768) | Mobile (375/320) |
|---|---|---|---|
| **Header** | logo + 5 links + CTA | logo + CTA; links em menu | **logo + CTA**; nav em drawer. CTA **nunca** some |
| **Hero** | 2 colunas (texto ~45% / vídeo ~55%) | 2 colunas comprimidas ou empilhado | **empilhado**: título → corpo → **vídeo** → CTA. Vídeo **largura total**, nunca miniatura |
| **4 pilares** | 4 colunas com divisores verticais | **2×2** | **1 coluna**, divisores **horizontais** |
| **3 pilares Concierge** | 3 colunas | 3 colunas estreitas | 1 coluna |
| **5 etapas** | **linha horizontal** com conectores | 5 em linha comprimida ou 2 linhas | **vertical**, número à esquerda, **conector vertical** ligando os círculos — a narrativa se preserva |
| **Institucional** | mensagem à esquerda / diferenciais à direita | idem, mais estreito | empilhado: mensagem, depois diferenciais |

**Regras firmes:** nunca espremer as 5 etapas numa linha no celular · nenhum
texto abaixo de 14px · fundos arquitetônicos com `object-position` que preserve
o ponto focal · hierarquia editorial mantida em todas as larguras.

## F. Microinterações aprovadas

**Somente estas seis:**

1. **fade + subida de 8–12px** na entrada de cada bloco — o `RevealGroup` já faz
2. **hover nos links do header**: sublinhado que cresce, 150ms
3. **hover no CTA**: mudança sutil de fundo, sem escala
4. **hover nos pilares**: elevação **de opacidade**, não de sombra
5. **transição do play do vídeo**: 200ms
6. **compactação do header** ao rolar — `header-compaction` já existe

**Proibido:** parallax · zoom · 3D · cursor customizado · texto saltando ·
movimento de fundo · qualquer animação acima de 300ms.

**`prefers-reduced-motion` já está implementado nos dois CSS — deve continuar
cobrindo tudo que for acrescentado.**

## G. Performance

| Risco | Mitigação |
|---|---|
| ⚠️ **vídeo de 5,0 MB no Hero** | `preload="none"` · **poster obrigatório** (a própria cena) · só carrega ao clicar · **nunca autoplay** |
| cenas arquitetônicas nas seções novas | `next/image`, AVIF/WebP, `sizes` correto, `loading="lazy"` fora do Hero |
| CLS no Hero em duas colunas | `aspect-ratio` reservado para o vídeo **antes** de carregar |
| fontes | manter o que já existe; **não acrescentar peso** |
| header sticky | `position: sticky` puro, sem listener de scroll novo |

**Regra:** o LCP do Hero deve ser a **imagem de fundo**, nunca o vídeo.

## H. Acessibilidade — critérios de aceite

1. contraste **AA** em todo texto — atenção especial ao texto claro sobre a
   recepção clara do Hero e ao dourado sobre azul profundo
2. nav do header navegável por teclado, com **foco visível**
3. `<h1>` único (Hero); seções em `<h2>`; pilares em `<h3>`
4. `alt` descritivo nas cenas; ícones decorativos com `aria-hidden`
5. vídeo com **controles**, sem autoplay com som, e legenda ou transcrição
6. `prefers-reduced-motion` desliga **tudo** que foi acrescentado
7. menu mobile: `aria-expanded`, fechar por `Esc`, foco preso enquanto aberto
8. alvos de toque ≥ 44px
9. âncoras do header com `scroll-margin-top` para não ficarem sob o header

## I. Critérios de aceite visual — checklist do `04 VERIFICADOR`

| # | Critério | Como conferir |
|---|---|---|
| 1 | header com **5 links + CTA**, nesta ordem | comparar com a referência |
| 2 | Hero em **duas colunas** no desktop, texto à esquerda | idem |
| 3 | eyebrow **"Capítulo Zero"** presente | idem |
| 4 | título do Hero em **três linhas**, com a terceira em itálico serifado | idem |
| 5 | **dois** CTAs no Hero: primário e *"Assistir ao vídeo"* | idem |
| 6 | 4 pilares do Método com **divisores verticais** | idem |
| 7 | 3 pilares do Concierge com ícone em círculo claro | idem |
| 8 | 5 etapas **numeradas em círculo**, ligadas por linha | idem |
| 9 | bloco institucional **azul profundo**, 4 linhas, última em **dourado** | idem |
| 10 | 4 diferenciais com ícone à direita do bloco | idem |
| 11 | nenhuma planta, vaso ou decoração ornamental nova | inspeção |
| 12 | nenhum card novo com sombra pesada | inspeção |
| 13 | mobile: 5 etapas **na vertical**, com conector | 375px |
| 14 | mobile: vídeo em **largura total** | 375px |
| 15 | nada quebra a 320px | 320px |
| 16 | vídeo **não** carrega sozinho | Network |
| 17 | `reduced-motion` ligado ⇒ sem animação | DevTools |
| 18 | rotas, CTAs e footer continuam funcionando | clique |

## J. Arquivos provavelmente impactados

| Arquivo | Mudança |
|---|---|
| `src/components/landing/public-header.tsx` | nav + CTA + menu mobile |
| `src/components/landing/editorial/hero-editorial.tsx` | duas colunas, eyebrow, 2º CTA |
| `src/components/landing/editorial/editorial-sections.tsx` | duas seções novas; eyebrow e numeração do Método; institucional |
| `src/app/(public)/page.tsx` | ordem dos blocos |
| `src/app/landing-editorial.css` | **acréscimos** (grid do Hero, pilares, conectores, âncoras) |
| `src/lib/aliviar-environments.ts` | **só se** as seções novas pedirem cena própria |

**Provavelmente 5 arquivos. Nenhum backend, nenhuma migration, nenhuma rota
nova.**

## K. Riscos

| Tipo | Risco | Mitigação |
|---|---|---|
| **Visual** | Hero em duas colunas quebrar o equilíbrio em telas médias | breakpoint de empilhamento em 1024px, não 768 |
| **Visual** | seções novas parecerem "de outro site" | reusar `LandingSection`, `LandingEyebrow` e as cenas existentes — **nenhum componente visual novo** |
| **Funcional** | âncoras do header apontarem para `id` inexistente | criar os `id` no passo 1 |
| **Regressão** | Engenheiro editar `portal-*` ou `v2/*` por engano | **§A.3 é aviso explícito** |
| **Regressão** | reescrever `landing-editorial.css` | proibido: **só acrescentar** |
| **Performance** | vídeo de 5 MB no LCP | `preload="none"` + poster (§G) |
| **Conteúdo** | remover Problema/FAQ sem decisão | **§B.1 — bloqueado até o DT-01 decidir** |

## L. Missão proposta ao `03 ENGENHEIRO`

> **Escopo:** atualizar a landing viva (`editorial/*` + `public-header`) para a
> referência-mestra, em **nove passos, um commit cada**, na ordem do §D.
>
> **Fazer:** header com nav e CTA · Hero em duas colunas · seção "Nosso Método"
> (4 pilares) · seção "Concierge Aliviar" (3 pilares) · eyebrow e numeração de
> "Como funciona" · copy e diferenciais do bloco institucional · refinamento de
> "Suas prioridades" · passe de responsividade · passe de performance.
>
> **Não fazer:** tocar em `portal-*` ou `v2/*` · reescrever
> `landing-editorial.css` · criar componente visual novo · mudar paleta,
> tipografia ou logo · alterar rotas, backend, banco ou SEO · **remover
> Problema, Respiro, FAQ ou Convite** · criar a seção de independência (§B.2) ·
> publicar em produção.
>
> **Aceite:** os 18 critérios do §I, os 9 de acessibilidade do §H e os limites de
> performance do §G.

---

# ESTADO E ENCAMINHAMENTO

| | |
|---|---|
| **Branch** | `main` |
| **HEAD** | `dff4c86` |
| **Árvore** | **limpa** |
| **Arquivos que seriam afetados** | os 5–6 do §J |
| **Riscos** | mapeados no §K; nenhum de domínio, banco ou backend |
| **Bloqueio** | 🔴 **UM** — a decisão do §B.1: a referência **substitui** a página atual ou é a **espinha visual** dela? |

> ### A missão **não** está pronta para seguir ao `03 ENGENHEIRO`.
>
> Falta **uma decisão sua**, e ela muda o tamanho do pacote: se for a leitura ①,
> quatro seções saem e o plano precisa de um passo a mais; se for ②
> — **minha recomendação** —, o plano acima está completo e o Engenheiro pode
> começar pelo passo 1.
>
> **Respondida essa linha, segue direto.**
