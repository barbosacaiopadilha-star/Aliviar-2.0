# Protocolo do Primeiro Ato Operacional Real de R-1

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Base** | `6e42be9` — Emenda DR3 publicada, ledger 116 |
| **Regra** | `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA` v1 · `VIGENTE` · `PROVISÓRIA` |
| **Status** | **BLOQUEADO POR AUSÊNCIA DE ACIONAMENTO DO EMISSOR** — uma lacuna, nomeada em §4 |
| **Natureza** | protocolo operacional/metodológico. **Zero código, zero migration, zero grant** |

---

## 1. A cadeia real, elo por elo — lida na fonte

| # | Elo | Superfície vigente | Situação |
|---|---|---|---|
| 1 | **Coleta** | `src/app/profissional/page.tsx` + `protocolo-pratica-form.tsx` (o **próprio profissional** responde) · alternativa: `src/app/admin/profissionais/[id]/page.tsx` + `protocolo-pessoa-panel.tsx` | 🟢 **existe** |
| 2 | **Registro** | `protocolos-repository.ts` → `registerPracticeEvidence()` → `practice_evidence`, via `escrita-operacional.ts` (ponto **único** e auditável do service role) | 🟢 **existe** |
| 3 | **Emissão** | **nenhuma** | 🔴 **LACUNA** |
| 4 | **Fronteira Humana** | `src/app/admin/fronteira-do-mapa/page.tsx` + `painel-da-fronteira.tsx` · leitura `loadFronteiraDoMapa()` · ato `fronteira-do-mapa-actions.ts` → `rpc("decidir_proposta")` | 🟢 **existe** |

> **Três dos quatro elos estão operacionais.** O que falta não é registrar
> evidência real nem julgar proposta — é **fazer o Motor falar**.

## 2. Critério de escolha do primeiro profissional

**Consulta de elegibilidade** — descritiva, não executada aqui:

```
profissionais tais que:
  · pertencem ao universo operacional real da Aliviar
  · NÃO existe linha em professional_subcriterion_map
      para o conceito CONTINUIDADE_COORDENACAO        ← exclui os quatro
  · NÃO existe practice_evidence para (profissional, CONTINUIDADE_COORDENACAO)
  · participam legitimamente do processo de entrevista/coleta
ordenar por: ordem natural da fila de coleta — NUNCA por desfecho provável
```

**Regra de seleção:** o primeiro da fila que satisfizer os quatro critérios.
**Não** escolher por desfecho esperado (§7 da missão). **Não** procurar quem
certamente marcaria conduta positiva.

## 3. Os quatro com declaração manual — excluídos sem tocar em nada

Para eles o emissor devolve **`DECLARACAO_MANUAL_VIGENTE`** e não emite —
comportamento correto e lavrado: a declaração humana prevalece sobre a proposta.

**Exclusão por `not exists` na consulta de elegibilidade.** Nenhuma declaração é
apagada, alterada, suspensa ou contornada. Eles simplesmente **não são o primeiro
caso observacional da Regra 001** — e continuarão não sendo enquanto a declaração
existir.

## 4. 🔴 A LACUNA — nomeada com precisão

**`curadoria.emitir_proposta_de_estado(uuid, text, uuid)` não tem como ser
acionada por nenhum caminho operacional.**

Provas, na fonte:

| Verificação | Resultado |
|---|---|
| `grant execute` a qualquer papel | **nenhum** — `revoke execute … from public, anon, authenticated` na migration do 2.C **e** repetido na Emenda DR3; nunca concedido a `service_role` |
| trigger que a dispare | **nenhum** — a função só aparece em `create or replace` e nos dois `revoke` |
| chamador em código de aplicação | **nenhum** — zero ocorrências em `src/` |
| a Emenda DR3 abriu algo? | **não**, e declara: *"ZERO código de aplicação · ZERO grant · ZERO policy · ZERO RPC nova"* |

**Isto é deliberado, não esquecimento.** O `CONTRATO_2_C` abriu a Fronteira com
**um único grant novo: `EXECUTE` da decisora**. O emissor ficou fechado de
propósito — e a Emenda DR3 conectou o *conteúdo* do DR3 sem abrir a *porta*.

**Consequência:** evidência real pode ser coletada e registrada hoje; a proposta
**não nasce**; e a Fronteira, que funciona, **não recebe nada**.

### 4.1 Duas vias para destravar — a escolha é do DT-01

| Via | O que é | Autoridade residual | Observação |
|---|---|---|---|
| **A — surface deliberada** *(recomendada)* | `grant execute` ao papel que a decisora já usa + uma action de ato explícito, chamada pelo administrador. **Espelha exatamente o precedente da decisora no 2.C** | permanente, mas **estreita e nominal** | emitir vira **ato deliberado e registrado**: sabe-se quem pediu e quando. Coerente com o espírito do P-10 — o Método não fala por efeito colateral |
| **B — emissão automática por trigger** | `after insert on practice_evidence` chama o emissor | permanente e **ampla** | o Motor passa a falar sozinho para todo conceito coberto. **Não recomendo antes de observar** — abre superfície maior do que a primeira observação justifica |
| **C — invocação administrativa do primeiro caso** | um `select emitir_proposta_de_estado(…)` autorizado, uma vez, para o profissional escolhido | **zero** | **não é fluxo**, e não escala — mas permite que **R-1 comece agora** sem abrir porta alguma, usando o mesmo padrão já aceito no nascimento e na promoção da regra |

> **Recomendação:** **A** para o regime; **C** é legítima para o **primeiro caso
> apenas**, se o DT-01 quiser observar antes de decidir a forma permanente. As
> duas produzem R-1 igualmente válido, porque **o marco de R-1 é o ato humano na
> Fronteira** (§8), não o modo de acionamento.
>
> **B não deve ser escolhida agora**: decidir que o Motor fala sozinho antes de
> tê-lo visto falar uma única vez é exatamente o tipo de antecipação que R-1
> existe para evitar.

## 5. Rito de coleta

**Fonte confirmada no catálogo vigente:** `CONTINUIDADE_COORDENACAO` tem
`evidenceSource = entrevista` — a evidência **deve** vir da entrevista real, não
de inferência secundária.

**Pergunta canônica, usada literalmente, sem reformulação:**

> **"Quando a pessoa já é acompanhada por outros profissionais, o que você
> costuma fazer?"**

**Opções canônicas vigentes, apresentadas como estão** (múltipla escolha):
`CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL` · `ENVIA_RELATORIO_ESCRITO` ·
`PARTICIPA_DE_DISCUSSAO_DE_CASO` · `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` ·
`ATUA_DE_FORMA_INDEPENDENTE`.

**Neutralidade obrigatória.** Não explicar ao profissional qual resposta produz
`CONFIRMADO` ou `NAO_CONFIRMADO`. Não sugerir, não completar, não interpretar
texto livre em opção. A pergunta **não é obrigatória** (`required: false`) — não
responder é resposta legítima, e produz **nenhuma proposta**, nunca negativa.

## 6. Rito de registro — campos reais, nada inventado

`registerPracticeEvidence()` grava em `practice_evidence`:

| Campo | Valor |
|---|---|
| `professional_profile_id` | o profissional escolhido |
| `subcriterion_code` | `CONTINUIDADE_COORDENACAO` |
| `catalog_version` | `PRACTICE_CATALOG_VERSION` — deve bater com a do conceito, senão o emissor devolve `CATALOGO_DIVERGENTE` |
| `version` | `corrente + 1`, calculado pelo próprio repositório (append-only) |
| `options` | **as opções efetivamente declaradas**, sem acréscimo |
| `source_tier` / `source` | proveniência da coleta, obrigatória |
| `collected_at` | momento real da entrevista |
| `collected_by` | **quem conduziu a coleta** — pessoa real |
| `status` | **`nao_verificado`** — é o que o código grava, e é o honesto |

**§9 — estado de verificação.** `nao_verificado` **não impede** a proposta:
decisão já lavrada (ficha v2.0 §8.1, ADR-070). **Não marcar como verificada para
destravar R-1.** O status acompanha pela proveniência e **nunca** entra em
`suggested_value` — **I-5**.

## 7. Emissão e desfechos — registrar sem reinterpretar

| Desfecho | Significado | Proposta? |
|---|---|---|
| `CONFIRMADO` | ≥1 conduta direta declarada | **sim** |
| `NAO_CONFIRMADO` | `ATUA_DE_FORMA_INDEPENDENTE`, sem conduta direta | **sim** |
| `EVIDENCIA_INSUFICIENTE` | só `ORIENTA…`, ou `options` vazio | não |
| `EVIDENCIA_CONTRADITORIA` | conduta direta **e** a negativa | não — e **não se arbitra** |
| `EVIDENCIA_INCOMPATIVEL` | opção fora das canônicas | não |
| `SEM_EVIDENCIA` | não há insumo | não |
| `CATALOGO_DIVERGENTE` | versões não batem | não |
| `DECLARACAO_MANUAL_VIGENTE` | há declaração humana | não — **e o profissional não serve como primeiro caso** |

**Qualquer um destes é resultado válido de R-1.** Não repetir a coleta buscando
outro desfecho. Não trocar de profissional porque o resultado "não ficou bom".

## 8. O marco — quando R-1 começa

> ### R-1 INICIA no primeiro ato humano real sobre uma proposta real gerada pela Regra 001 a partir de `practice_evidence` real.
>
> Concretamente: **`decidir_proposta` devolvendo `ATO_REGISTRADO`** para uma
> proposta com `professional_profile_id` preenchido e `rule_id =
> CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`.

**Não** inicia no cadastro da evidência. **Não** na emissão técnica isolada.
**Não** em smoke. **Não** se o desfecho for não-emissão — nesse caso houve
observação da coleta, mas **R-1 ainda não começou**, e isso deve ser dito assim.

**O ato é do administrador**, na Fronteira (gate da ADR-068, herdado do 1.12 §7 e
estendido pelo 2.C ao alvo profissional): **confirmar** ou **recusar**, com
motivo. **Nunca auto-confirmar.**

## 9. O que observar no primeiro ciclo

| # | Dado | Onde vive |
|---|---|---|
| 1 | evidência original — id e versão | `practice_evidence` |
| 2 | opções declaradas | `practice_evidence.options` |
| 3 | estado de verificação | `practice_evidence.status` |
| 4 | resultado do avaliador | desfecho do emissor |
| 5 | proposta emitida ou não, e **por quê** | `derivation_proposals` / desfecho nomeado |
| 6 | decisão humana | `derivation_proposal_acts` |
| 7 | **motivo** da confirmação ou recusa | idem |
| 8 | diferença entre o declarado e o percebido pelo Curador | leitura qualitativa do motivo |
| 9 | qualquer ambiguidade — em especial o rótulo *"Atua de forma independente"* lido como *"trabalho sozinho em geral"* | registro narrativo |
| 10 | tempo entre coleta, emissão e ato | carimbos |

**Privacidade (§18):** registrar por **ID e síntese**. Nada de conteúdo clínico
desnecessário, dado pessoal dispensável ou documento privado no relatório
documental.

## 10. Sem threshold, e sem confundir silêncio com acerto

**Nenhum valor é estabelecido:** sem taxa mínima de confirmação, sem percentual
aceitável de discordância, sem número mínimo de casos, sem SLA. **Não
autorizados.** A primeira observação é **qualitativa e rastreável**.

> **Discordância zero sustentada não é sucesso automático.** Se o Curador nunca
> discordar, isso deve ser observado como **possível sinal de mecanismo pouco
> sensível** — não como prova de acerto. Sem criar threshold para isso.

## 11. Stop conditions

Interromper e reportar ao DT-01, **sem corrigir por conta própria**, se:

1. o emissor devolver desfecho **não previsto** nesta tabela;
2. a proposta nascer com proveniência incompleta ou apontando para evidência errada;
3. o Curador não conseguir praticar o ato na Fronteira;
4. `derivation_proposals` receber **mais de uma** proposta para a mesma evidência;
5. o `status` de verificação aparecer traduzido em estado profissional — **violação de I-5**;
6. surgir pressão para ajustar a evidência, a opção ou a regra **para produzir um resultado**;
7. a evidência tiver sido produzida fora do fluxo real de entrevista.

## 12. Um caso não revisa a regra

Um único ciclo **não** autoriza criar v2, alterar semântica, promover
`ORIENTA…`, trocar opções ou reclassificar o conceito. **Registrar o
aprendizado**; mudança exige ato próprio. **Regra 002 permanece fora de escopo**
(§21 da missão).

## 13. Perguntas obrigatórias

| # | Resposta |
|---|---|
| 1 | Quem conduz a entrevista: o **próprio profissional** respondendo seu Protocolo, ou o **administrador** registrando por ele |
| 2 | `src/app/profissional/page.tsx` (`protocolo-pratica-form.tsx`) ou `src/app/admin/profissionais/[id]/page.tsx` (`protocolo-pessoa-panel.tsx`) |
| 3 | **Para coleta, registro e Fronteira: sim.** Para **emissão: não** |
| 4 | **Sim — e só no elo 3.** Os outros três estão prontos |
| 5 | `registerPracticeEvidence()`, via `escrita-operacional.ts` — ponto único e auditável do service role |
| 6 | **`nao_verificado`** — é o que o código grava, e é o honesto |
| 7 | **Ninguém, hoje.** É a lacuna (§4) |
| 8 | **Deve ser ato explícito**, não automático — recomendação da via **A** (§4.1) |
| 9 | O administrador, no painel da Fronteira do Mapa |
| 10 | O administrador (gate ADR-068, herdado do 1.12 §7 e estendido pelo 2.C) |
| 11 | **`decidir_proposta` devolvendo `ATO_REGISTRADO`** sobre proposta real da Regra 001 (§8) |
| 12 | Consulta de elegibilidade de §2, pela ordem natural da fila — **nunca** por desfecho provável |
| 13 | Por `not exists` em `professional_subcriterion_map` na consulta. **Nada é apagado**; o emissor já os protege com `DECLARACAO_MANUAL_VIGENTE` |
| 14 | Os dez itens de §9 |
| 15 | **A coleta e o registro podem começar hoje. A emissão não** |
| 16 | **Sim, um:** o acionamento do emissor (§4) |
| 17 | **Sim** — a evidência é escrita por service role, então nada no banco distingue entrevista real de linha inserida |
| 18 | Vinculando `collected_by` a pessoa real, `source_tier`/`source` à entrevista, usando o formulário do Protocolo (nunca SQL direto), e pela **stop condition 7** |
| 19 | **Sim — INTACTA.** Nada aqui toca `case_needs`, grau, importância ou `derivation_rule_degree_map` |
| 20 | **`DT-01`** para decidir a via de §4.1; depois **`03 ENGENHEIRO`** para executá-la |

## 14. Veredito

> ### PROTOCOLO R-1 — BLOQUEADO POR AUSÊNCIA DE ACIONAMENTO DO EMISSOR
>
> **Lacuna única e exata:** `curadoria.emitir_proposta_de_estado` tem **zero
> grants, nenhum trigger e nenhum chamador**. Coleta, registro e Fronteira estão
> operacionais; a proposta não nasce.
>
> **Não é defeito** — o 2.C abriu **um único** grant (o da decisora) e deixou o
> emissor fechado; a Emenda DR3 conectou o conteúdo do DR3 sem abrir a porta.
>
> **Ato mínimo:** o DT-01 escolher entre as vias de §4.1 — **A** (surface
> deliberada, recomendada para o regime) ou **C** (invocação administrativa do
> primeiro caso, autoridade residual zero, permite começar já). **B não agora.**
>
> **Todo o resto do protocolo está pronto e é executável no momento em que a via
> for escolhida:** critério de seleção, exclusão dos quatro sem tocar em nada,
> rito de coleta neutro, rito de registro com campos reais, tabela de desfechos,
> marco de R-1, dez observáveis, sete stop conditions.
>
> **CD-1 — INTACTA. R-1 — NÃO INICIADA.**
