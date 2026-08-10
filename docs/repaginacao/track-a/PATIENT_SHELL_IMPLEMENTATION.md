# A2 · PatientShell — a moldura

**Escopo:** só a moldura. Home, Jornada, rotas, responsável e domínio intactos.

## O que mudou, e por quê

| elemento | antes | depois | por quê |
|---|---|---|---|
| **header** | `bg` sólido + borda cinza dura, estático | `sticky`, véu translúcido sobre a atmosfera, fio de **dourado** | a faixa opaca separava "sistema" de "conteúdo" — era o que mais fazia ler como painel |
| **nav desktop** | seis pílulas preenchidas (`bg-accent-soft` no ativo) | peso + fio de dourado sob o item ativo | seis cápsulas coloridas competindo era a marca administrativa mais visível |
| **botão do menu** | círculo branco sólido com borda | contorno dourado discreto sobre o mesmo véu | deixou de ser objeto de interface |
| **conteúdo** | `py-12 / lg:py-16` | `pt-14 pb-16 / lg:pt-20 lg:pb-24` | a leitura começava colada na borda opaca |

**Largura e gutters não foram tocados.** Mexer neles moveria o conteúdo, e A2 é sobre a moldura.

## Tokens — nenhum novo

`--color-brand-gold` · `--patient-linen` · `--patient-acento` · `--patient-ink` · `--color-ink-muted` · `--color-border` · `--color-focus-ring` · `duration/ease` da Fundação. Zero cor inventada, zero design system paralelo.

## Acessibilidade

Preservados: skip-link · `<header>` · `<nav aria-label>` · `<main id>` · `aria-current` · foco visível em todos os alvos · alvos de 44px.

**Acrescentado:** `aria-expanded` no botão do menu mobile — ele não tinha.

## Overflow

Zero em 390 · 430 · 768 · 1440, medido antes e depois. A correção de A1 (`patient-walk__step { position: relative }`) permanece e não regrediu.

## Gaps preservados, não corrigidos

**GAP-A2B** — *"Minha história"* aponta para `/sua-historia/continuar`, sob o grupo `(public)`: um item da navegação privada tira a paciente da moldura privada. Decidido para A2B.

**GAP-A4** — *"Início"* e *"Linha do tempo"* são duas superfícies com narrativa de jornada própria. A consolidação é A4.
