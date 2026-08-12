# 39 · COA-H2 — a fronteira do índice `/coa`

Fecha dois achados do gate pós-deploy: **COA-H1** (fronteira de autorização
incompleta) e **V-HV-1** (import órfão). Nada de banco, migration, dependência,
configuração ou regra clínica. Ledger **121**.

**Onde este documento mora.** A Fase 5 da missão pedia para atualizar "o
documento canônico que já registra a dívida". Nenhum arquivo rastreado registra
COA-H1 ou V-HV-1 — a auditoria chegou por missão. Escrever isso dentro do
fechamento do Bloco 12 misturaria dois cortes sem relação, então o registro
nasce aqui, no próximo número. Nenhum contrato anterior foi reescrito.

## 1 · COA-H1 — causa

`src/app/coa/page.tsx` tinha ramo para **um** nível (redireciona) e ramo
implícito para **vários** (renderiza o hub). Não tinha ramo para **nenhum**.

```
requisição /coa → middleware exige só sessão → getAuthState()
→ accessibleLevels = filter(canAccessCoaLevel)
→ length === 1 ? redirect : (sem ramo para 0) → render do hub, HTTP 200
```

Consequência medida: paciente, profissional e atendente sem nível COA recebiam
o Centro de Operações com **HTTP 200** e a grade vazia.

Não vazava dado — e ainda assim era fronteira aberta. A existência do painel
operacional é informação, e a próxima pessoa a mexer ali herdaria a suposição
de que quem chega já foi autorizado.

## 2 · Fronteira corrigida

Um ramo *fail-closed*, **antes de qualquer renderização**, no mesmo destino que
os layouts irmãos já usam:

```ts
if (accessibleLevels.length === 0) {
  redirect("/acesso-negado");
}
```

**`resolveCoaHomePath` ficou fora do corte, por decisão medida.** Ela deriva de
`resolveDefaultCoaLevel`, que decide por **nome de papel**
(`curador_medico`, `concierge`, `administrador`); a página decide por
**permissão** (`canAccessCoaLevel`). São duas noções diferentes de "tem nível",
e consumi-la aqui misturaria as duas — um papel com permissão COA fora daquela
lista receberia `/acesso-negado` mesmo tendo `accessibleLevels > 0`. O ramo
explícito é menor e não cria essa divergência. A função compartilhada permanece
como contrato puro, coberto em `tests/unit/coa.test.ts`.

## 3 · Matriz preservada

| Ator | `/coa` |
|---|---|
| Anônimo | `/login?next=%2Fcoa` |
| Paciente | **`/acesso-negado`** |
| Profissional | **`/acesso-negado`** |
| Atendente sem nível COA | **`/acesso-negado`** |
| Curador médico | `/coa/curadoria` |
| Concierge | hub com **dois** níveis, sem Curadoria |
| Administrador | hub com os **três** níveis |

As três últimas linhas são as que já funcionavam, e continuam idênticas: copy,
destinos e níveis autorizados não mudaram.

## 4 · Testes

[`tests/e2e/coa-fronteira.spec.ts`](../../tests/e2e/coa-fronteira.spec.ts) —
**T1..T8 na rota real**, com contas sintéticas locais e o `loginAs` do padrão
canônico de `authorization.spec.ts`. Cada caso de ator sem nível afirma **duas**
coisas: a URL final e a **ausência das marcas do hub** no corpo renderizado.

[`tests/unit/coa.test.ts`](../../tests/unit/coa.test.ts) — **T9**, o piso do
contrato: `resolveCoaHomePath` devolve `/acesso-negado` para `[]`, `paciente`,
`profissional` e `atendente`. Fica registrado que **o contrato puro sempre soube
fechar** — o defeito nunca esteve nele, e é por isso que teste de função pura
não podia ter pego.

## 5 · Prova de perda

Removido **apenas** o ramo novo, com rebuild real:

| | |
|---|---|
| Caíram | **T1** (paciente), **T2** (profissional), **T2** (atendente), **T8** (laço) — 4 de 4 casos de ator sem nível |
| Como caíram | URL final `http://127.0.0.1:3001/coa` em vez de `/acesso-negado` |
| Conteúdo servido | medido no navegador com a mutação ativa: a paciente **permanece em `/coa`**, com `h1` *"Escolha sua área operacional"* e a linha *"CENTRO DE OPERAÇÕES ALIVIAR"* |
| Continuaram verdes | **T3, T4, T5, T6, T7** — a matriz legítima não depende do ramo novo |
| Restauração | byte-idêntica (`sha256` conferido), suítes de volta ao verde |

### A cegueira da cobertura anterior, medida

Com o defeito reintroduzido, `authorization.spec.ts` passou **11/11** e
`tests/unit/coa.test.ts` passou **14/14**. A razão é verificável: aquele spec
percorre `/admin`, `/profissional` e `/paciente`, e **nunca visita `/coa`**.

**Achado do próprio processo:** a primeira versão da guarda de conteúdo procurava
*"Centro de Operações Aliviar"* com a caixa da fonte. O CSS maiusculiza o nome
(`uppercase`) e `innerText` devolve o texto **renderizado** — a marca estava
muda. Só apareceu porque a prova de perda mediu o DOM em vez de confiar na
asserção. A comparação passou a ser case-insensitive.

## 6 · V-HV-1

Uma linha removida de
`src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx`:

```ts
import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
```

Zero usos do símbolo na rota (medido antes da remoção). `MesaShell` continua
consumido por `MesaComEstado`, que é quem a rota realmente monta desde a
B11-12-H. Warning `'MesaShell' is defined but never used` **eliminado**. Zero
efeito em copy, DOM, regra ou comportamento; nenhum teste foi adaptado.

## 7 · Fora do corte

Nada de banco, migration, schema, RLS, policy, grant, função ou dado. Nada de
middleware, `next.config.ts`, layout novo para `/coa`, layouts filhos,
`ROLE_COA_PERMISSIONS`, dependências, configuração da Vercel ou variáveis.
Nenhum deploy, push ou promoção.

Dívidas preservadas sem reclassificação: **D-11**, **GAP-B3-COPY-ID**,
**GAP-C-2**, **GAP-C-3**, alvos de 40px/32px, **G-6**, as 444 contas sintéticas
históricas e a proteção SSO dos Previews.
