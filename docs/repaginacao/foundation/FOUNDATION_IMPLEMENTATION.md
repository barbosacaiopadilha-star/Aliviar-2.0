# Fundação · Implementação

**Base:** `f951a25` · **Escopo:** os quatro pilares (tokens · primitivos · shell ·
contrato de estado), **sem migrar tela nenhuma**.

## O que foi construído

| # | Arquivo | O quê |
|---|---|---|
| 1 | `src/foundation/estado-visual.ts` | vocabulário visual de estado — **promovido** da Mesa |
| 2 | `src/foundation/contrato-de-estado.ts` | leitura apresentacional dos macroestados |
| 3 | `src/components/ui/state-mark.tsx` | `StateMark` — cor + símbolo + texto |
| 4 | `src/app/globals.css` | gramática cromática de estado, vinda de `mesa-curador.css` |
| 5 | `src/app/foundation/page.tsx` | superfície de prova (rota autenticada, não indexável) |
| 6 | `src/components/curadoria/mesa/gramatica-de-estados.ts` | passa a **consumir** o vocabulário; mapeamentos ficam |

## O que NÃO foi feito, de propósito

Nenhuma tela migrada. Nenhum `Card`, `Button`, `EmptyState`, `Dialog`, `Drawer`,
`Tabs` ou cabeçalho consolidado — todos exigem tocar superfície viva, e o
contrato manda fazer isso **tela a tela, com evidência antes/depois**. Nenhum
componente morto removido (`portal-*`, `v2/*`): a regra é construir → provar uso
zero → remover.

Nenhuma migration, nenhum enum, nenhuma regra de domínio, nenhuma dependência
nova.

## Sobre o pilar C (shell)

**Reconheci quatro shells** — `app-shell`, `patient-shell`, `portal-shell`,
`portal-shell-container` — e **não** criei um quinto. Criar `PageContainer` /
`PageHeader` sem migrar nenhum consumidor produziria mais um sistema não
adotado, que é exatamente o problema que a repaginação existe para resolver.

O que a Fundação entrega para o shell é a **gramática** que os quatro passam a
compartilhar (tokens, estado, foco, motion) e a fronteira de propriedade escrita
em `FOUNDATION_OWNERSHIP.md`. A convergência estrutural pertence às trilhas A e
C, que têm as telas na mão. **Registrado como decisão, não como omissão.**

## Achados que corrigem a auditoria

1. **O motion já estava consolidado.** `--p-motion-*` e `--p-ease*` são aliases
   de `--duration-*` / `--ease-*`; não competem com o canônico.
2. **A divergência real de token é `--color-warning`** — hex cru fora da escala,
   duplicando a função de `--color-attention`. Não troquei o valor: seria mudar
   pixel em tela viva, e esta missão não migra tela.
3. **A gramática de estado estava presa a `mesa-curador.css`**, que o layout raiz
   não importa — o vocabulário não teria aparência fora da Mesa. Por isso as
   seis regras subiram para `globals.css`.
4. **`Input` já exige `label`.** A acessibilidade dos campos não precisa ser
   acrescentada; ela já é obrigatória por assinatura.

## Bloqueio registrado

**A decisão da paciente permanece indefinida**, à espera de **[D-2]**. Está no
código como `decisaoDaPaciente()` devolvendo `registrada: false` — não porque
seja falso, mas porque é **indeterminável**, e inventar aqui criaria regra de
negócio por conveniência de UX.
