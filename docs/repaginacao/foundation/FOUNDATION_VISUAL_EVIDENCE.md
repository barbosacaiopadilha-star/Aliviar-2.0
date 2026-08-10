# Fundação · Manifesto de evidência visual

**Diretório:** `evidencias/repaginacao/foundation/` *(gitignored — as imagens não
são commitadas)*
**Reprodução:** `npm run test:e2e -- tests/e2e/zz-foundation-evidencia.spec.ts`
com a stack local de pé e `test-users.local.json` presente.
**Rota:** `/foundation` · **sessão:** `curador_medico` · **seed:** nenhum ·
**dado real:** nenhum — os estados vêm de fatos sintéticos escritos na página.
**Viewports:** desktop 1440×900 · mobile 390×844.

---

## Por que não há `before` nesta missão

A Fundação **não migrou nenhuma tela** (§12). A superfície de prova é nova, então
não existe "antes" dela. E as telas existentes **não mudaram de aparência**: o
único movimento visual foi tirar seis regras CSS de `mesa-curador.css` e colocá-las
em `globals.css` sem alterar seletor nem valor — comprovado pelos 37 testes de
orientação visual da Mesa, que continuam verdes.

**A partir do próximo bloco, `before`/`after` passa a ser obrigatório**, porque aí
sim haverá superfície viva mudando.

---

| ID | Componente | Estado | Viewport | Arquivo |
|---|---|---|---|---|
| **EV-FND-000** | showcase inteiro | composição | desktop · mobile | `{desktop,mobile}/EV-FND-000__after__showcase__*.png` |
| **EV-FND-001** | Button | 4 variantes · 3 tamanhos · disabled · loading | desktop · mobile | `EV-FND-001__after__button__*.png` |
| **EV-FND-002** | StateMark | 5 papéis | desktop · mobile | `EV-FND-002__after__statemark__*.png` |
| **EV-FND-003** | Badge | 5 variantes decorativas | desktop · mobile | `EV-FND-003__after__badge__*.png` |
| **EV-FND-004** | Contrato de estado | 7 cenários | desktop · mobile | `EV-FND-004__after__contrato-de-estado__*.png` |
| **EV-FND-005** | Card · EmptyState | superfície e vazio | desktop · mobile | `EV-FND-005__after__card-emptystate__*.png` |
| **EV-FND-006** | Campos | input · erro · select · textarea · checkbox · radio | desktop · mobile | `EV-FND-006__after__campos__*.png` |
| **EV-FND-007** | Foco por teclado | `:focus-visible` | desktop | `states/EV-FND-007__after__foco-teclado__desktop.png` |
| **EV-FND-008** | Reduced motion | `prefers-reduced-motion: reduce` | desktop | `states/EV-FND-008__after__reduced-motion__desktop.png` |

**16 imagens · 1,0 MB · zero vídeo** (nenhum comportamento desta missão exige
sequência para ser provado).

## Provas medidas, não olhadas

| Prova | Resultado |
|---|---|
| overflow horizontal · 1440×900 | **falso** |
| overflow horizontal · 390×844 | **falso** |
| foco visível (EV-FND-007) | `outline: 2px solid` + anel duplo com deslocamento |
| reduced motion (EV-FND-008) | nenhuma transição/animação ativa em 40 elementos |

## Critérios de aceite relacionados

- **EV-FND-002** → estados semanticamente distintos não compartilham aparência
  arbitrária; cor nunca sozinha.
- **EV-FND-004** → as duas traduções do mesmo estado; *"emitido"* jamais lido
  pela paciente como *"entregue"*.
- **EV-FND-007** → foco visível por teclado nos primitivos.
- **EV-FND-008** → `prefers-reduced-motion` respeitado.
- **EV-FND-000** → a mesma composição sobrevive a 390px sem overflow.


---

## Correção 3A · recaptura

A vitrine **mudou**: EV-FND-004 ganhou duas linhas — `cancelado (closed_at
preenchido, nada entregue)` e `encerrado sem entrega`. Ambas com tom neutro,
sem `VER_CURADORIA` e sem a palavra concluída, que é o que o Gate reprovou.

**Recapturados:** EV-FND-000 e EV-FND-004, em desktop e mobile — 4 arquivos
substituídos. Overflow horizontal medido em falso nos dois viewports.

**Não recapturados:** EV-FND-001, 002, 003, 005, 006, 007 e 008 — nenhum deles
mudou um pixel: a correção é de contrato de estado, e não tocou primitivo, token
nem folha de estilo.
