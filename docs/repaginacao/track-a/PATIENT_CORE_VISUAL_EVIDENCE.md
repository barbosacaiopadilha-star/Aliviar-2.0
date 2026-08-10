# Trilha A · Evidência visual

**Diretório das imagens:** `evidencias/repaginacao/` *(gitignored)*
**Ferramenta:** `tests/e2e/captura-direcao-de-arte.spec.ts` — o harness de
captura que já existe no repositório. Ele faz o login com as contas locais de
`test-users.local.json` e salva a página inteira. Nenhuma credencial aparece
aqui.

---

## A3a — a próxima ação da paciente

**Base:** `bed4786` · **build:** `bed4786-msnr3gvf` (antes) e build local
equivalente (depois)
**Conta:** `paciente.teste@aliviar-conexao.local` (sintética, local)
**Fatos, idênticos nas quatro capturas:** sem história, sem Case →
`HISTORIA_NAO_INICIADA`. A projeção devolve uma ação **com destino** — o caso
que a Home antiga silenciava.

| ID | rota | viewport | estado | arquivo |
|---|---|---|---|---|
| **EV-A3a-001** | `/paciente` | 1440×900 | antes | `before/06-paciente-home.png` |
| **EV-A3a-002** | `/paciente` | 390×844 | antes | `before/19-paciente-home-mobile.png` |
| **EV-A3a-003** | `/paciente` | 1440×900 | depois | `after/06-paciente-home.png` |
| **EV-A3a-004** | `/paciente` | 390×844 | depois | `after/19-paciente-home-mobile.png` |

**As imagens diferem** — MD5 distinto nos dois viewports:

| | antes | depois |
|---|---|---|
| desktop | `fcf24c843126…` | `cfaecde751a9…` |
| mobile | `6ee2edc0040d…` | `f100e743c96d…` |

### O que muda entre 001/002 e 003/004

**Antes.** A ação existe na tela, mas vem de `PatientHomeState` — o segundo
motor de estado — e aponta para `/sua-historia/continuar`. `pending`, com seu
título, motivo, destino e *"o que acontece depois"*, não aparece em lugar
nenhum.

**Depois.** Um bloco no nível 2, marcado **● PRECISA DE VOCÊ**:

- título e motivo vindos da projeção;
- **uma** ação principal, com o destino que a projeção forneceu;
- *"Depois disso: …"* — o que acontece a seguir, que antes não era dito;
- o botão duplicado saiu do cartão de estado acima.

No mobile o bloco é o **segundo** da página: a paciente não precisa passar por
régua, resumo e cartões para descobrir que algo depende dela.

### EV-A3a-005 — estado sem CTA · **não capturado**

O estado *"a Aliviar está trabalhando nesta etapa"* (`kind: "nothing"`) **não
tem captura**, e o motivo é registrado em vez de contornado:

- a única conta local cujo Case está nesse estado é a paciente sintética do seed
  (`validacao-mesa@example.test`), cuja credencial é emitida uma única vez na
  criação e não fica persistida;
- levar a conta credenciada até lá exigiria enviar a história — mudança de
  estado real e irreversível numa conta de teste, feita só para produzir uma
  imagem;
- forjar o estado por SQL é o que o §10 da missão proíbe, e arbitrar uma senha
  para conta existente é o que a D-9F proibiu.

**O comportamento está coberto por teste**, não por imagem: `T-A3a-4` (dois
casos) renderiza o `kind: "nothing"` a partir da projeção real e verifica a
mensagem, o próximo passo, a ausência de qualquer link e o papel visual
`neutro` — nunca `impedimento`. Fica como pendência de evidência para a **A3b**,
quando houver um Case local em andamento.

---

## Medição de overflow (§18/§19)

`tests/e2e/a3a-medicao-overflow.spec.ts` — mede `scrollWidth` × `clientWidth` no
documento **e** varre todo descendente de `<main>` procurando quem cruza a
borda. Artefato: `after/medicao-overflow.txt`.

| viewport | `scrollWidth` | `clientWidth` | elemento que estoura |
|---|---|---|---|
| 390 | 390 | 390 | nenhum |
| 430 | 430 | 430 | nenhum |
| 768 | 768 | 768 | nenhum |
| 1440 | 1440 | 1440 | nenhum |

Sem `overflow-x: hidden`. A correção da A1 segue de pé.

---

## Como reproduzir

```bash
CAPTURA=1 CAPTURA_DIR=evidencias/repaginacao/a3a/after node scripts/with-local-supabase.mjs npx playwright test tests/e2e/captura-direcao-de-arte.spec.ts --workers=1 --grep "casa da paciente"
```

O Playwright exige build de produção local (`npm run build:local`) — ele sobe
`next start -p 3001` e não reaproveita o servidor de desenvolvimento.
