# Fundação · Primitivos

## O inventário, antes de criar qualquer coisa

| Biblioteca | Componentes | Decisão |
|---|---|---|
| `src/components/ui/` | **26** | **canônica** (D-2) |
| `src/components/ads/` | **10** | deprecada — **não removida** (regra: construir → provar uso zero → remover) |

`ui/` já traz: alert · avatar · badge · breadcrumb · button · card · checkbox ·
dialog · drawer · empty-state · form-field · form-message · input · pagination ·
radio · search-field · section-container · section-reveal · select · skeleton ·
spinner · table · tabs · textarea · toast.

**Quase nada precisava nascer.** O que faltava era um só.

## O que foi criado: `StateMark`

O único primitivo novo desta missão, e o que o design system alvo pedia (§4):
**cor + símbolo + texto, sempre os três**.

Por que não estender o `Badge`: ele é deliberadamente **não semântico** — não
tem variante `success` nem `danger`, e o comentário no arquivo diz por quê:
*"a ausência é a proteção"*. Ele decora; não afirma estado. Misturar as duas
coisas destruiria uma guarda existente.

```tsx
<StateMark papel="atencao">Aguarda você</StateMark>
```

- o símbolo é `aria-hidden`: quem usa leitor de tela recebe a frase, não "bola";
- sem `children` não há marca — o texto é obrigatório por assinatura;
- só os cinco papéis entram; o TypeScript recusa o resto.

## Button — auditado, não reescrito

`variant`: `primary` · `secondary` · `ghost` · `danger`. `size`: `sm` · `md` ·
`lg`. `isLoading` já existia e troca o rótulo por `Spinner`. Foco medido no
navegador: `outline: 2px solid` + anel duplo com deslocamento.

**Nenhuma variante por tela**, e nenhuma criada agora. A divergência entre CTA
público e botão de produto é real, mas resolvê-la é migração visual de
superfície — pertence ao bloco da Landing, com evidência antes/depois.

## Campos — a acessibilidade já é obrigatória

`Input` **exige** `label` na assinatura. Descobri isso porque o showcase não
compilou sem ele. É a forma certa: não há caminho para esquecer.

## O que NÃO foi consolidado, e por quê

Quatro cartões (D-3), dois sistemas de botão (D-8), três vazios (D-5), três
abas (D-6), quatro superfícies sobrepostas (D-7), três carregamentos (D-9),
três cabeçalhos (D-4).

**Todos exigem tocar telas vivas.** O contrato é explícito: *"tela a tela, nunca
em massa"*, e esta missão não migra telas. A Fundação entrega o chão; a
consolidação acontece com evidência antes/depois, superfície por superfície.
