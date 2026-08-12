# 30 · Track C — Falar com a Aliviar

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-11 |
| **Base** | `e335ec1` · ledger **121** · árvore com os dois `??` **pré-existentes**, intocados |
| **Natureza** | contrato vinculante. **Zero produção, zero migration, zero RLS, zero teste, zero evidência** |
| **Destinatário** | **`03 ENGENHEIRO`** |

---

## 1 · Mapa quantitativo do projeto

| Fatia | Objetivo | Estado | Fechamento | Gap residual |
|---|---|---|---|---|
| **Fundação** (Bloco 6) | tokens · primitivos · shell · contrato de estado | ✅ **concluída** | `f951a25`→ | `FOUNDATION_VERIFICATION.md` **nunca commitado** |
| **Bloco 2 · Estados** | fonte única de estado | ✅ **concluída** | `foundation/contrato-de-estado` + `fatos-do-caso.ts` | — |
| **Track A** (paciente) | shell · Home · História · Documentos · Curadoria | ✅ **concluída** | A2, A2B, A3a, A5, A6, B1, D-12.1R | **A3b** e **A4** declarados fora de escopo em A3a |
| **Trilha B** (Curadoria) | entrega · handoff · dois encontros | ✅ **concluída** | D-9 `996f109` · D-11A `996f109` | — |
| **Track B · B3** | decisão · 2º encontro · handoff | ✅ **encerrada** | `e335ec1` · [29](29_B3_FECHAMENTO_TRACK_B.md) | `GAP-B3-COPY-ID` (não bloqueante) |
| **Bloco 1 · Concierge** | canal humano para a paciente | 🔴 **pendente** | — | **é esta Track** |
| **Bloco 3 · Limpeza** | 3 landings + órfãos | 🔴 **pendente** | — | `portal-experience`, `landing/v2` vivos no disco |
| **Bloco 7 · Landing** | atualização controlada | 🔴 pendente | — | depende de 6 ✅ e de **D-1** |
| **Blocos 11/12 · Mesa e Fila** | ergonomia · fila | 🔴 pendente | — | **D-6**; a Fila exige **5–10 casos reais** |
| **D-5 · Pendência** | destinatário do pedido | ⛔ **bloqueada** | — | decisão de produto |
| **D-10 · agendar 2º encontro** | — | ⛔ adiada | — | **não bloqueante**, [26](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md) |
| **GAP-D12-C1 · Concierge nominal** | identidade da pessoa | ⛔ adiada | — | fallback honesto **basta** |

**Classificação exigida pelo §2:**

| Categoria | Itens |
|---|---|
| **implementado** | Fundação · Bloco 2 · Track A · Trilha B · B3 |
| **evidência pendente** | `FOUNDATION_VERIFICATION.md` fora do Git |
| **dívida de ambiente** | 444 contas sintéticas no Supabase local ([29 §16](29_B3_FECHAMENTO_TRACK_B.md)) — **não é resíduo de entrega** |
| **gap arquitetural adiado** | D-10 · GAP-D12-C1 · `GAP-B3-COPY-ID` · A3b/A4 |
| **fora do roadmap** | Fila do Curador (sem casos reais) · conversa na plataforma (**D-8: não agora**) |

> **Nenhuma Track concluída é reaberta por dívida não bloqueante.**

## 2 · A próxima Track, e por que é ela

> ### Track C · Bloco 1 — **Falar com a Aliviar**

**Não escolhi por sequência.** Escolhi porque a medição contradiz o roadmap: o
Bloco 1 estava marcado *"bloqueado por D-3"*, e **D-3 já foi respondida pelo
produto** — sem que ninguém registrasse.

### 2.1 · O problema, medido agora

```
ALIVIAR_WHATSAPP = "5511979037133"        fonte única, oficial, em produção
whatsappHref()   → 1 uso vivo             curadoria-decision-panel, estado DECIDIDO
WhatsappContact  → 1 importador           sem-curadoria.tsx
SemCuradoria     → 0 renderizadores       ← ÓRFÃO
/paciente · /curadoria · /documentos · /linha-do-tempo · /perfil ·
/documentos-e-consentimentos  →  0 ocorrências de contato
```

> ### A paciente só consegue pedir ajuda **depois** de já ter decidido.
>
> O documento [09](09_CONCIERGE_WHATSAPP.md) §1 declara que a superfície da
> Curadoria e a da decisão são **as obrigatórias**. A da decisão existe. **A da
> Curadoria — o momento em que ela lê três caminhos médicos e escolhe — não.**

**E há duas órfãs a mais**, da mesma classe que a B3 acabou de fechar:
`WhatsappContact` está pronto e alcança ninguém, porque seu único importador
`SemCuradoria` **também** não é renderizado por lugar nenhum.

### 2.2 · Contra os seis critérios, na ordem exigida

| # | Critério | Track C |
|---|---|---|
| 1 | dependências satisfeitas | **nenhuma dependência.** Nível A |
| 2 | risco operacional/segurança | decidir sobre saúde sem canal; **e** risco de vazamento na mensagem pré-preenchida, que este contrato trava |
| 3 | impacto na jornada | **o maior declarado** — P0/P1 das duas auditorias |
| 4 | fatia completa e verificável | sete pontos · teste de conteúdo proibido · e2e · capturas |
| 5 | menor expansão de domínio | **zero** — sem tabela, action, RLS, migration ou motor |
| 6 | continuidade do plano | **é o Bloco 1**, e o único que [22](22_HANDOFF_ENGENHEIRO.md) autoriza correr em paralelo |

**Rejeitadas:** Bloco 3 (limpeza — valor interno, risco de apagar vivo, e não
melhora nada para ninguém agora) · Bloco 7 (depende de **D-1**) · Blocos 11/12
(**D-6**; a Fila exige casos reais) · **D-5** e **D-10** (bloqueadas ou adiadas
por decisão, não por ordem) · A3b/A4 (repaginação de hierarquia — estética antes
de canal).

## 3 · A contradição de domínio, resolvida aqui

**D-3 pediu três coisas. Duas já foram respondidas por fato, e a terceira eu
resolvo neste contrato — o Engenheiro não decide nada.**

| | Situação real | Decisão vinculante |
|---|---|---|
| **número** | `ALIVIAR_WHATSAPP` existe, é oficial e é fonte única | **usar essa constante. Nunca reescrever o literal** |
| **frase fora do horário** | `WhatsappContact` já diz *"Sem pressa — responderemos."* | **adotada como padrão** |
| **horário de atendimento** | **nenhum é declarado** | **nenhum será declarado** |

> **Por que nenhum horário.** Declarar horário cria SLA que ninguém aprovou.
> `continuity-worklist.ts` já recusa exatamente isso — *"não existe regra
> temporal aprovada, e inventar uma seria criar SLA por conta própria"*. A Track
> C herda essa doutrina: **o canal promete existir, nunca prometer prazo.**

**Segunda contradição, também resolvida:** [09](09_CONCIERGE_WHATSAPP.md) §1
lista seis mensagens e o código tem três tópicos; §2 exige o rótulo **"Falar com
a Aliviar"** e `WhatsappContact` usa o nome do assunto como rótulo. **Vence o
§2:** o rótulo é sempre *Falar com a Aliviar*; o assunto vive na **mensagem**,
nunca no texto do link.

## 4 · Ator, fato canônico e estado

| | |
|---|---|
| **ator** | a paciente |
| **responsabilidade** | quem responde é a **Aliviar** — nunca um profissional, nunca um Curador nominal |
| **fato canônico** | **nenhum.** Nível A: link com mensagem constante |
| **antes** | um único ponto de contato, no estado decidido de uma tela |
| **depois** | **sete** pontos, todos discretos, todos com a mesma frase |

## 5 · Os sete pontos de inserção

| # | Rota | Posição exata | `topic` |
|---|---|---|---|
| **C1** | `/paciente/curadoria` — **Mesa** | dentro de `blocoMesa`, **ao lado do link "Levar em PDF"** | `curadoria` |
| **C2** | `/paciente/curadoria` — **vazio** | prop `action` do `PatientEmptyState` já existente | `curadoria` |
| **C3** | `/paciente` — Início | fim da página, linha discreta | `jornada` |
| **C4** | `/paciente/linha-do-tempo` | fim da página | `jornada` |
| **C5** | `/paciente/documentos` | rodapé da central | `documento` |
| **C6** | `/paciente/perfil` | fim da página | `jornada` |
| **C7** | `/paciente/documentos-e-consentimentos` | fim da página | `jornada` |

> **C1 não fica abaixo da decisão.** [`CaminhosPanel`](../../src/components/paciente/caminhos/caminhos-panel.tsx:135)
> reserva o espaço sob a escolha como vazio deliberado — *"preencher ali é
> empurrar"*. O lugar certo é a faixa de material de consulta, **acima** da
> decisão e no mesmo registro visual do PDF.

**Fora desta Track:** a superfície de **Pendência** (não existe — **D-5**) e o
tópico `curador` (existe no código e **não será ligado**: tornar o Curador
clicável prometeria acesso a uma pessoa específica, contra o §2 de
[09](09_CONCIERGE_WHATSAPP.md)).

## 6 · Copy final

**Rótulo, idêntico nos sete pontos:**

```
Falar com a Aliviar
```

**Sufixo acessível, invisível:** ` (abre o WhatsApp em nova aba)`

**Mensagens — constantes, sem interpolação, sem exceção:**

| `topic` | Mensagem | Situação |
|---|---|---|
| `jornada` | `Oi! Gostaria de ajuda com a minha jornada na Aliviar.` | **nova** |
| `curadoria` | `Oi! Gostaria de conversar sobre a minha Curadoria.` | **nova** |
| `documento` | `Oi! Quero enviar um documento para a minha Curadoria.` | existente, **inalterada** |
| `duvida` | `Oi! Tenho uma dúvida sobre a minha Curadoria.` | **congelada** — está no ar e em EV-B3-003/004/005 |
| `curador` | `Oi! Gostaria de falar com meu Curador.` | existente, **não ligada** |

**Proibido no rótulo:** "WhatsApp" · ícone verde como identidade · badge ·
animação · bolha flutuante · qualquer promessa de prazo.

## 7 · Segurança

**Regra absoluta:** a mensagem diz o **assunto**, nunca o **conteúdo**.

**Proibido, sem exceção:** diagnóstico · condição · sintoma · nome de
especialista · laudo · instituição · qualquer dado clínico · **identificador de
Caso, de seleção ou de perfil** · nome da paciente.

> **A garantia é de tipo, não de disciplina.** `whatsappHref` aceita **somente**
> `WhatsappTopic`. Não existe caminho para texto livre, e nenhuma mensagem é
> construída por template. **O Engenheiro não pode adicionar parâmetro de texto
> livre a essa função nesta Track.**

## 8 · Auditoria — deliberadamente nenhuma

**O clique não é registrado.** Registrá-lo criaria sinal de comportamento da
paciente — exatamente o que `continuity-worklist.ts` recusa: *"a operação é o
objeto da medição, ela nunca"*. **Nenhum `audit_logs`, nenhum evento, nenhuma
analítica.**

## 9 · Idempotência, migrations e fixtures

| | |
|---|---|
| **idempotência** | não se aplica — **nenhuma escrita** |
| **migration** | ⛔ **proibida** |
| **RLS / policies / grants** | ⛔ **proibidos** |
| **fixtures** | **nenhuma nova**; nenhum dado criado, logo **nenhum cleanup** |
| **ledger** | permanece **121** |

## 10 · Mobile e acessibilidade

- alvo mínimo **44px** (`min-h-11`), nos sete pontos;
- **zero overflow horizontal** em **390px** — medir `scrollWidth ≤ clientWidth`;
- `target="_blank"` + `rel="noopener noreferrer"`;
- `focus-visible` com anel, alcançável e acionável **só pelo teclado**;
- compreensível **sem cor** — é texto com sublinhado no foco/hover;
- o sufixo `sr-only` avisa a nova aba **antes** do clique.

## 11 · Arquivos de produção previstos

| Arquivo | O quê |
|---|---|
| `src/components/paciente/concierge-link.tsx` | **novo** — `ConciergeLink({ topic, className })` |
| [`whatsapp-contact.tsx`](../../src/components/curadoria/whatsapp-contact.tsx) | acrescentar `jornada` e `curadoria` ao union e ao mapa. **Não alterar `duvida`** |
| [`paciente/curadoria/page.tsx`](../../src/app/paciente/curadoria/page.tsx) | C1 e C2 |
| [`paciente/page.tsx`](../../src/app/paciente/page.tsx) | C3 |
| `paciente/linha-do-tempo/page.tsx` | C4 |
| `paciente/documentos/page.tsx` | C5 |
| `paciente/perfil/page.tsx` | C6 |
| `paciente/documentos-e-consentimentos/page.tsx` | C7 |

**Nove arquivos, um deles novo. Nenhum módulo, nenhum repositório, nenhuma action.**

## 12 · Arquivos proibidos

⛔ [`curadoria-decision-panel.tsx`](../../src/components/patient/curadoria-decision-panel.tsx) — **congelado**: seu link está no ar e em evidência da B3 encerrada
⛔ `sem-curadoria.tsx` — órfão; **não ligar** (ver §16)
⛔ `supabase/**` · qualquer policy · qualquer grant
⛔ `src/modules/**`
⛔ superfícies de Curador, Concierge, admin e Landing
⛔ `AGENTS.md` e `docs/repaginacao/foundation/FOUNDATION_VERIFICATION.md`

## 13 · Testes

| # | Nível | Prova |
|---|---|---|
| **T-C-1** | componente | `ConciergeLink` renderiza exatamente `Falar com a Aliviar`, com `target`/`rel` corretos e o aviso `sr-only` |
| **T-C-2** | unitário | **nenhuma** mensagem do mapa contém vocabulário proibido (§7), verificado contra a lista inteira |
| **T-C-3** | unitário | `whatsappHref` **não** aceita texto livre — a assinatura só admite `WhatsappTopic` |
| **T-C-4** | unitário | o número aparece **uma única vez** em `src/`, em `ALIVIAR_WHATSAPP` |
| **T-C-5** | componente | **as sete rotas** renderizam o link — atravessando a composição real, **nunca importando `ConciergeLink` direto** |
| **T-C-6** | componente | o link da Mesa (C1) fica **acima** da superfície de decisão na ordem do documento |
| **T-C-7** | e2e | em `/paciente/curadoria` **antes de decidir**, o link existe, é focável por teclado e tem alvo ≥ 44px |
| **T-C-8** | e2e | 390px nas sete rotas: `scrollWidth === clientWidth` |
| **T-C-9** | e2e | o `href` é inspecionado por atributo — **o WhatsApp nunca é aberto** |
| **T-C-10** | unitário | **alcançabilidade**: `ConciergeLink` é importado, transitivamente, por arquivo de `src/app` |

> **T-C-5 e T-C-10 são a lição da B3.** Um teste que importa o componente prova
> que ele funciona, **nunca** que alguém o alcança.

## 14 · Provas de perda

| | Mutação | Deve cair |
|---|---|---|
| **M-C1** | remover o link de `/paciente/curadoria` | T-C-5, T-C-7 |
| **M-C2** | trocar o rótulo por *"WhatsApp"* | T-C-1 |
| **M-C3** | acrescentar o nome da paciente à mensagem | **T-C-2** |
| **M-C4** | escrever o número literal numa página | T-C-4 |
| **M-C5** | remover o `ConciergeLink` de toda `src/app` | **T-C-10** |

**M-C3 é a mutação que importa** — é a única que produziria vazamento real.

## 15 · Evidências visuais

| | Viewport | O que prova |
|---|---|---|
| **EV-C-001** | 390×844 | `/paciente/curadoria` **antes de decidir**, com o link na Mesa |
| **EV-C-002** | 390×844 | Início com o link, discreto e no fim |
| **EV-C-003** | 1440×900 | Documentos com o link no rodapé |
| **EV-C-004** | 390×844 | o estado vazio da Curadoria com o link na `action` |

Paciente **sintética**, pela fixture. Nenhum dado real. `evidencias/` segue
gitignored.

## 16 · Gaps preservados e registrados

| Gap | Disposição |
|---|---|
| **GAP-C-1** — `SemCuradoria` órfão, duplicando o estado vazio vivo | **registrado, não resolvido aqui.** A rota já tem `PatientEmptyState`; `SemCuradoria` é código morto e sai no **Bloco 3**. ⛔ **não ligar nesta Track** |
| **GAP-C-2** — duas implementações do mesmo link | o painel de decisão fica **congelado**; unificar depois que a evidência da B3 for superada |
| **GAP-C-3** — tópico `curador` sem uso | **deliberado** (§5) |
| **D-5** — Pendência sem destinatário | ⛔ **bloqueada** — a sétima superfície de [09](09_CONCIERGE_WHATSAPP.md) não existe |
| D-10 · GAP-D12-C1 · `GAP-B3-COPY-ID` · A3b/A4 | **intocados** |
| `FOUNDATION_VERIFICATION.md` fora do Git | **intocado**, por instrução expressa |

## 17 · Sequência — quatro passagens

| # | O quê | Custo |
|---|---|---|
| **P1** | `ConciergeLink` + os dois tópicos novos + **T-C-1 a T-C-4** e **T-C-10** | barato — **sem tocar rota, sem build de e2e** |
| **P2** | os **sete** pontos num único ciclo + **T-C-5, T-C-6** | um ciclo de rota e integração |
| **P3** | **T-C-7 a T-C-9** + as quatro evidências, com o funcional já estável | caro — **uma vez só** |
| **P4** | gate final independente | — |

**Regra:** P2 não começa antes de P1 verde, e P3 não começa antes de P2 verde.
**Proibido** dividir P2 por rota — sete inserções idênticas em sete ciclos é
desperdício, e nenhuma delas depende das outras.

## 18 · Aprovação e reprovação

**Aprova se, e só se:** os sete pontos renderizam · T-C-1..T-C-10 verdes ·
M-C1..M-C5 derrubam o teste previsto · zero overflow em 390px · o número aparece
uma vez só · **nenhuma mensagem carrega dado da paciente** · nenhuma migration ·
ledger **121** · os dois `??` intocados.

**Reprova se:** qualquer mensagem virar template · o rótulo mudar · surgir
widget flutuante · aparecer horário ou promessa de prazo · o clique for
registrado · `sem-curadoria.tsx` for ligado · o painel de decisão for tocado ·
qualquer teste importar `ConciergeLink` direto para provar alcance.

---

# PRÓXIMA TRACK DEFINIDA — CONTRATO VINCULANTE PRONTO PARA O 03 ENGENHEIRO

**Track C · Falar com a Aliviar.** Nível A, sem banco, sem domínio novo — e é o
item que as duas auditorias classificaram como o de **maior impacto humano e
menor custo técnico** do contrato inteiro.

**A medição desbloqueou o que o roadmap dava por bloqueado:** D-3 já tinha
resposta no código, e ninguém havia registrado. O que falta não é decisão — é a
porta.
