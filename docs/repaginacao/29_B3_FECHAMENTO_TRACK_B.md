# 29 · B3 — fechamento da Track B

**Estado:** fechada para o **04 VERIFICADOR** · 2026-08-11
**Contratos que este documento fecha:** [26](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md), [27](27_B3R_SUPERFICIE_ALCANCAVEL.md), [28](28_B3COPY_MICROCONTRATO_DA_CONEXAO.md)

Este é o consolidado da Track B: o que ficou verdadeiro no produto, o que ficou
provado, o que ficou aberto de propósito e o que é dívida do ambiente local —
que **não** é resíduo desta entrega.

---

## 1 · O fato canônico

A decisão da paciente é **um fato**, e mora em `patient_curadoria_decisions`.
Não é derivada da conexão, não é inferida da tela e não é reconstruída a partir
do `connection_records` — este último trata de **continuidade**, nunca de
decisão (Arquitetura E, contrato 27).

A pessoa escolhida é **nomeada uma única vez**, no fato canônico. Tudo o que
vem depois lê esse nome; nada o pergunta de novo.

| desfecho | `outcome` | `chosen_option_id` |
|---|---|---|
| escolheu um dos três | `CHOSEN` | a opção da **seleção humana** (`curated_selection_options`) |
| nenhuma serviu | `NONE_OF_THEM` | `null` |

## 2 · Feedback — o silêncio era o defeito

Registrar a decisão passou a **dizer** que registrou. O anúncio é
`role="status"` com `aria-live="polite"` e **recebe foco**; sem o foco, quem
navega por leitor de tela fica no botão que acabou de sumir e não ouve nada.

O defeito original tinha duas metades, e a segunda estava escondida: um
`setState` depois de `await` dentro de `startTransition` nunca chegava a
aplicar. A correção trocou por handler assíncrono com `pending` próprio.

## 3 · Estado durável

Recarregar a página não recria nada: a decisão persistida **comanda** a
renderização. Reload não gera segunda decisão, segunda entrada de auditoria nem
conexão automática — medido em EV-B3-003/004.

## 4 · Handoff

Com a decisão registrada, a próxima etapa passa a ser acompanhada pela **Equipe
Aliviar**, e a paciente continua podendo consultar a Curadoria. Vale para os
**dois** desfechos: a recusa legítima move o handoff exatamente como a escolha
(corrigido em `45daa32`).

No caminho **legado** o responsável continua sendo o **Curador do Case** — a
diferença é real e está afirmada em EV-B3-006.

## 5 · Auditoria

Decidir deixa **exatamente uma** entrada em `audit_logs`
(`patient_curadoria_decided`), com o `curated_selection_id` no `metadata`.
Reload não duplica; abrir o acompanhamento não duplica. A trilha é
**append-only** — nenhuma limpeza a apaga, e a guarda de fixture exige que ela
só cresça.

## 6 · Copy canônica — contrato 28

O modo é **dito** pela rota, nunca inferido (`providerPresentations.length === 1`
erraria no legado de um profissional e no estado R3).

| | canônico | legado (H4) |
|---|---|---|
| abertura | **Começar seu acompanhamento** | Com quem você gostaria de seguir? |
| a pessoa | `Caminho escolhido: {nome}` — **texto fixo** | três **rádios** |
| ato | **Abrir meu acompanhamento** | Quero seguir com um dos três |
| revisão | O que acontece ao abrir seu acompanhamento | O que acontece ao seguir com {nome} |
| 5ª verdade | *Sua decisão continua registrada do jeito que está* | *pode trocar aqui mesmo* |
| depois | Acompanhamento aberto com {nome}. | Você escolheu seguir com {nome}. |
| correção | **não existe** | **Alterar minha escolha** |

A quinta verdade canônica substitui a promessa legada de trocar depois — que
no canônico seria **falsa**, porque o fato é append-only.

## 7 · H4 legado — congelado

Palavra por palavra. Os três rádios, a copy antiga e a correção sobrevivem, e a
conexão legada ancora em `final_curadoria_delivery_id` com
`curadoria_report_id` **nulo**. Provado por render da rota real, pelo
`connection-choice.spec.ts` e por EV-B3-006.

## 8 · `NONE_OF_THEM`

Percorrido pelo navegador: marcar *Nenhuma destas serviu para mim*, registrar,
recarregar. Resultado — uma decisão, `chosen_option_id` nulo, um evento de
auditoria, responsabilidade da Equipe Aliviar, três caminhos ainda
consultáveis, **nenhuma** superfície de conexão (nem a legada, nem a canônica),
zero rádio e zero conexão automática.

Perguntar "com quem?" a quem disse que nenhuma serviu seria incoerente e cruel.

## 9 · Medições em 390px

```
innerWidth 390 · clientWidth 390 · scrollWidth 390 · overflow 0
CTA "Abrir meu acompanhamento" 222×44 · CTA "Falar com a Aliviar" 123×44
elementos fora da viewport: []   (descendentes de scroller próprio excluídos)
```

O carrossel dos três caminhos é deliberado: medir o `right` das cartas contra a
viewport acusaria um layout que funciona.

## 10 · Acessibilidade

Validada **no fluxo real**, nunca em render isolado. Não há auditor
automatizado no projeto e nenhum foi instalado — as verificações são asserções
explícitas:

- `role="status"` com `aria-live="polite"` e **foco** na confirmação;
- dupla submissão impedida — o gesto não reaparece depois de registrado;
- decisão compreensível **sem cor**: o texto diz tudo;
- identidade canônica como **texto**, não controle; zero rádio no canônico;
- CTA canônico alcançável e acionável **só pelo teclado** (`focus` + `Enter`);
- alvo mínimo de **44px**; zero overflow horizontal em 390px.

## 11 · WhatsApp oficial

`wa.me/5511979037133`, com mensagem pré-escrita sobre a Curadoria. Inspecionado
por `href` e nome acessível — **nunca aberto** por teste.

## 12 · Pacote de evidências

`evidencias/` é **gitignored** (`.gitignore:95`): as imagens não entram em
commit. Reproduzíveis com

```bash
CAPTURA=1 node scripts/with-local-supabase.mjs npx playwright test tests/e2e/b3-captura-decisao.spec.ts --workers=1
```

| evidência | viewport | o que prova |
|---|---|---|
| **EV-B3-001** | 1440×900 | antes da decisão — formulário canônico e recusa com o mesmo peso |
| **EV-B3-002** | 1440×900 | o feedback imediato, atravessando a action real |
| **EV-B3-003** | 1440×900 | estado durável + conexão canônica logo abaixo |
| **EV-B3-004** | 390×844 | o mesmo canônico no tamanho em que o achado apareceu |
| **EV-B3-005** | 390×844 | acompanhamento aberto, sem nenhuma via de correção |
| **EV-B3-006** | 1440×900 | H4 legado — três rádios, copy antiga, correção preservada |

001 e 002 seguem **válidas** e não foram recapturadas: retratam o estado
anterior à decisão, onde painel de conexão não existe, e a copy que mudou não
aparece nelas. A preservação é explícita no `capturar()`, e o teste que as
produz continua rodando — é ele que registra a decisão de verdade.

Toda paciente nas imagens é **sintética**, criada pela fixture: nenhum dado real
aparece.

## 13 · Cleanup — corrigido, e medido

Duas correções de suporte de teste, ambas com guarda permanente
(`tests/integration/fixture-sem-residuo.integration.test.ts`):

1. **A conta do paciente** (`8520437`). As fixtures confiavam em
   `auth.admin.deleteUser` para cascatear `auth.users → profiles → cases`. A
   cascata existe, mas nunca era executada: ~60 FKs prendem `curadoria.profiles`
   sem cascade, e três são criadas pela própria fixture
   (`patient_stories.created_by`, `patient_story_versions.created_by`,
   `crm_contacts.patient_profile_id`). O GoTrue devolvia 500 (SQLSTATE 23503) e
   ninguém lia.
2. **A conta do admin** (`e94a5b2`). `seedDeliveredCase` cria um
   administrador/curador por execução e nunca o removia. Na integração
   `setup-limpeza.ts` absorvia a sobra; no E2E não há esse guarda-chuva.

Ordem que a topologia exige: `connection_events` → **Case** → `patient_stories`
→ `crm_contacts` → perfil → **`user_roles`** → conta. O `user_roles` antes da
conta não é estilo: o trigger `log_user_role_change()` grava auditoria com
`old.profile_id`, e com o perfil já removido a gravação viola
`audit_logs_target_profile_id_fkey`.

Todo passo lê o próprio erro, e **zero linhas afetadas virou falha**.

## 14 · Ausência de novos resíduos

Baseline medida antes e depois da execução completa de captura:

| | antes | depois |
|---|---|---|
| `connection-e2e-admin-*` | 225 | **225** |
| `connection-e2e-patient-*` | 219 | **219** |
| `h4-legado-*` | 0 | **0** |
| cases | 0 | **0** |
| connections · decisões · seleções · deliveries · profissionais | 0 | **0** |
| `audit_logs` | 2842 | **2943** (cresceu) |

**Novos resíduos: zero.**

## 15 · `GAP-B3-COPY-ID` — aberto, não bloqueante

O filtro canônico compara **`displayName`**, porque a projeção da decisão expõe
apenas `outcome`, `chosenName` e `decidedAt` — não há identificador. Ampliar o
loader está fora do microcontrato 28. Detalhe e critério de fechamento em
[28 §11](28_B3COPY_MICROCONTRATO_DA_CONEXAO.md).

**A condição estrutural, medida (V-B3-3):** `professional_profiles.display_name`
**não tem índice único**. É isso que mantém o risco existindo — e é isso que o
mantém pequeno: para o filtro ficar ambíguo seriam necessários dois
profissionais com o **mesmo nome exibido dentro da mesma seleção curada**.
Nenhuma colisão material foi observada. As duas pontas da comparação derivam do
**mesmo** `professional_profiles.display_name`, lido de um único mapa em
[patient-curadoria.ts:119](../../src/modules/curadoria/patient-curadoria.ts:119),
então elas não divergem por caminho — só por homonímia. **Reclassificar só com
evidência material de colisão ou associação incorreta.**

## 16 · Dívida histórica do banco local — **não é resíduo desta entrega**

O Supabase local acumulou, **antes** das correções acima:

| prefixo | contas | com dependência material |
|---|---|---|
| `connection-e2e-admin-*` | **225** | 0 |
| `connection-e2e-patient-*` | **219** | 219 (`crm_contacts`) |

São contas sintéticas de execuções anteriores. As duas correções **param o
crescimento**; a limpeza retroativa é passagem própria, e não foi feita aqui de
propósito — remoção em massa por papel ou contagem derrubaria a conta fixa de
bootstrap junto. Os admins sairiam com `user_roles` → conta; os pacientes
exigem os `crm_contacts` antes.

Nada disso afeta produção: é banco local de desenvolvimento.

## 17 · Commits da B3

| commit | o que entregou |
|---|---|
| `97aaad0` | a decisão já é canônica — o defeito é silêncio, não perda |
| `1362095` | a hipótese confirmada: a decisão persiste; o silêncio é a falha |
| `bfeb66d` | a decisão deixa trilha, e o handoff ganha prova |
| `603c4f5` | a decisão deixa de ser registrada em silêncio |
| `7df89b7` | contrato 27 — a superfície canônica não tinha porta |
| `321af0e` | a decisão canônica ganha porta na rota, com duas guardas |
| `2a085e5` | a fronteira entre decisão e conexão |
| `45daa32` | a recusa legítima também move o handoff |
| `8015a04` | T-B3-R6 comportamental — a conexão acontece, a decisão não se move |
| `7d4fe7f` | `connection-choice` separa canônico de legado, ambos verdes |
| `30397f2` | **contrato 28** — rota e e2e distinguem canônico de legado |
| `8520437` | a fixture sintética passa a sair inteira |
| `e94a5b2` | a fixture remove também o admin sintético que cria |

---

# B3 FECHADA — O CANÔNICO TRATA DE CONTINUIDADE; O LEGADO PRESERVA A ESCOLHA

**A B3 completa incluiu uma migration**, e ela é o §5 deste documento:
`20260811120000_b3_decisao_da_paciente_auditada.sql`, entregue em **`bfeb66d`**.
Ela acrescenta o valor `patient_curadoria_decided` ao enum de auditoria, cria
`log_patient_curadoria_decided()` e o gatilho que a dispara, e revoga `execute`
dessa função nova de `public`. É ela que torna a decisão auditável — sem ela o
§5 não teria o que afirmar. Nenhuma policy de RLS foi criada, alterada ou
removida, e nenhum grant sobre objeto pré-existente foi tocado.

**As fatias seguintes não voltaram ao banco.** De `603c4f5` a `f70ddb2` — a
correção do silêncio, a composição da rota (contrato 27), a copy (contrato 28),
as evidências e as duas correções de cleanup — **nenhuma delas tocou migration,
RLS, grants ou permissões**. Ali foram uma prop nova na conexão, três arquivos
de produção, e o resto é prova.
