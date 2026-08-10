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

## A3b — repaginação visual da Home

**Conta:** `validacao-mesa@example.test` — a paciente sintética do seed da Mesa,
**com Caso aberto**. A conta padrão de `test-users.local.json` não tem Caso e
exercita só o ramo sem Case; `AmbientHero`, `JourneyWalk`, `ProfileCard` e
`CuradoriaCard` — o objeto da A3b — só existem no outro ramo.

A credencial é emitida pelo seed na criação e não fica persistida. Por isso a
captura entra por variável de ambiente (`A3B_EMAIL`/`A3B_SENHA`) e a senha não
aparece em arquivo nem em relatório. O Caso de certificação foi removido pela
mesma operação de `cleanupCuradoriaCertificationFixture` e **reconstruído pelo
seed oficial** — nada forjado por SQL.

### ▸ OS QUATRO ARQUIVOS PARA REVISÃO VISUAL EXTERNA

```
evidencias/repaginacao/a3b/before/home-com-caso-desktop.png
evidencias/repaginacao/a3b/after/home-com-caso-desktop.png
evidencias/repaginacao/a3b/before/home-com-caso-mobile.png
evidencias/repaginacao/a3b/after/home-com-caso-mobile.png
```

| ID | viewport | estado | arquivo |
|---|---|---|---|
| **EV-A3b-001** | 1440×900 | antes | `before/home-com-caso-desktop.png` |
| **EV-A3b-002** | 390×844 | antes | `before/home-com-caso-mobile.png` |
| **EV-A3b-003** | 1440×900 | depois | `after/home-com-caso-desktop.png` |
| **EV-A3b-004** | 390×844 | depois | `after/home-com-caso-mobile.png` |

Mesmos fatos nas quatro: Caso aberto em `CONSULTA_INICIAL`, sem encontro
realizado, nada aguardando a paciente. A única diferença é a repaginação.

O ramo **sem Caso** também tem par completo, em
`{before,after}/06-paciente-home.png` e `{before,after}/19-paciente-home-mobile.png`.

### O que a comparação deve mostrar

**Antes:** cinco superfícies com fundo e sombra; grade de dois cartões iguais;
topo branco de painel; a página **esfriando** para cinza-azulado ao rolar; a
mesma frase repetida em dois blocos; uma segunda barra de navegação no rodapé.

**Depois:** marfim contínuo do topo ao fim — a temperatura da recepção; seções
separadas por fio, no lugar de caixas; colunas divididas por fio vertical (o
padrão "Nosso método" da landing); versalete + serifa; o responsável com nome e
rosto; nenhuma barra de navegação dentro da página.

**Pergunta para a revisão:** *"parece que a paciente atravessou a porta e entrou
no mesmo lugar?"*

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

**A3b · a mesma medição no caminho com Caso** (`medicao-overflow-com-caso.txt`)
— 390/430/768/1440, `scrollWidth == clientWidth`, nenhum elemento fora.

A sonda foi corrigida nesta missão. Ela acusava três descendentes da régua a
390px e a cena do hero a 768px — todos **contidos** por um ancestral que rola
(`overflow-x: auto`, o scroll interno da régua que o §17 manda preservar) ou
que recorta (`overflow: hidden`, a cena). Só `overflow-x: visible` deixa um
filho vazar para a página. A sonda da A3a nunca havia topado nisso porque a
conta sem Caso não renderiza a régua; as duas passam a usar a mesma regra.

---

## Como reproduzir

```bash
CAPTURA=1 CAPTURA_DIR=evidencias/repaginacao/a3a/after node scripts/with-local-supabase.mjs npx playwright test tests/e2e/captura-direcao-de-arte.spec.ts --workers=1 --grep "casa da paciente"
```

O Playwright exige build de produção local (`npm run build:local`) — ele sobe
`next start -p 3001` e não reaproveita o servidor de desenvolvimento.
