# 16 · Acessibilidade

> A Rodada 1 produziu `ACCESSIBILITY_OBSERVATIONS.md`. Este documento fixa
> **critérios de aceite**, não observações.

---

## 1. Critérios

| # | Critério | Como se verifica |
|---|---|---|
| **A1** | contraste **AA** em todo texto | atenção ao dourado sobre azul profundo e ao texto claro sobre a recepção clara |
| **A2** | **cor nunca sozinha** — todo estado tem cor + símbolo + texto | §13; falseável em qualquer badge |
| **A3** | tudo alcançável por **teclado**, na ordem visual | `Tab` do topo ao fim |
| **A4** | **foco visível** em todo elemento focável | inclusive dentro de diálogos |
| **A5** | **um `<h1>` por tela**, hierarquia sem saltos | inspeção da árvore |
| **A6** | todo campo com **label programático** | não só `placeholder` |
| **A7** | alvos de toque **≥ 44px** | mobile |
| **A8** | `prefers-reduced-motion` **desliga tudo** | DevTools |
| **A9** | erro **junto do campo**, em texto, associado por `aria-describedby` | C6 |
| **A10** | ação assíncrona anuncia início e fim | `aria-live` |
| **A11** | diálogo: foco preso, `Esc` fecha, foco volta | §12 |
| **A12** | gaveta mobile: `aria-expanded`, `Esc`, foco preso | §15 |
| **A13** | imagem informativa com `alt`; decorativa `aria-hidden` | cenas são **decorativas** |
| **A14** | vídeo com controles, **sem autoplay com som**, legenda ou transcrição | Landing |
| **A15** | tabela comparativa com cabeçalhos associados | §04.1 |
| **A16** | leitor de tela **não perde** `pending`/`waitingOn` | já garantido; **não regredir** |

## 2. O que já está certo — e não pode regredir

`prefers-reduced-motion` nos três CSS · o `sr-only` da trilha da Mesa
(**a informação chega aos dois lados, uma vez cada**) · `aria-live` no cabeçalho
da Mesa · `aria-current="step"` na etapa ativa · badge **além** da cor no cartão
de candidato.

> **A trilha da Mesa é o padrão a imitar, não a corrigir.**

## 3. Regra permanente

> **Acessibilidade não é passe final.** Cada bloco entrega os critérios que lhe
> tocam, e o `04 VERIFICADOR` recusa o bloco sem eles.

## 4. Fora deste contrato

Auditoria WCAG formal · teste com usuários de tecnologia assistiva · certificação
externa. **Recomendados, não incluídos** — e a recomendação fica registrada.
