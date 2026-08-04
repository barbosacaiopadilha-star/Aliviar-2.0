# Relatório de Impedimento — Pacote F-02 (Modelo de Dados da Curadoria 2.0)

| Campo | Valor |
|---|---|
| **Versão** | **v2.0** — reemitido após a lavratura das ADR-066, ADR-067 e ADR-068 (v1.0: 2026-08-04, antes das ADRs) |
| **Autor** | Agente 03 — Implementador |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` |
| **Status** | **IMPEDIMENTO ABERTO** — pacote interrompido antes de qualquer alteração |
| **Dependências** | [`../DECISIONS.md`](../DECISIONS.md) ADR-066/067/068 · [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) · [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §9.4, §15, §15.0 · [`REGISTRO_DAS_GUARDAS_2_0.md`](REGISTRO_DAS_GUARDAS_2_0.md) |
| **Origem** | Segunda missão do pacote F-02 (reemitida com as ADRs declaradas aprovadas) |

> **Nada foi implementado.** Nenhuma migration, tabela, constraint, índice, policy, view,
> tipo ou teste. `git diff` sobre `src/`, `supabase/` e `tests/` permanece vazio.
>
> **O motivo mudou de natureza.** Na v1.0 deste relatório o impedimento era *falta de
> domínio*. Isso **acabou**: as três ADRs foram lavradas e o domínio está fechado. O
> impedimento que resta **não é inferência do Implementador** — está escrito, com todas as
> letras, dentro das próprias ADRs que esta missão manda materializar fielmente.

---

## 1. O que mudou desde a v1.0 — o impedimento principal foi resolvido

| Impedimento v1.0 | Estado agora |
|---|---|
| **I-1** — as ADRs que definem as duas tabelas não existem | **RESOLVIDO.** ADR-066 (ADR-A), ADR-067 (ADR-B) e ADR-068 (ADR-D) foram lavradas em 2026-08-04, com anexos normativos próprios. O log passou de 65 para **68** ADRs |
| **I-2** — a regra §15.0 proíbe começar pela persistência | **PERMANECE** — e agora **reafirmado pelas ADRs** |
| **I-3** — a entrada da Onda 2 não está satisfeita | **PERMANECE em parte.** A parte "ADRs aprovadas" caiu; sobram Onda 1 e a nomeação da Autoridade de Método |
| **I-4** — colisão com a guarda C-01 | **PERMANECE** — e agora a própria ADR-066 determina que a guarda **continue ativa** |

**Registro devido:** as ADRs respondem também a três pendências que este pacote listava —
**DP-7** (P-07, P-08 e P-10 promovidos a princípios oficiais de domínio), **DP-9**
(respondida com *"não ampliar"*: a RLS da ADR-040 item 6 **não** é reaberta) e **DP-11**
(o parecer do Guardião passou a existir como arquivo:
[`PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md`](PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md)).

## 2. O impedimento, nas palavras das próprias ADRs

### ADR-066 — Consequência (verbete em `DECISIONS.md`)

> *"o domínio de `derivation_proposals` fica fechado; o Implementador pode construí-lo sem
> tomar decisão de domínio. […] **Esta ADR não autoriza implementação:** o pacote F-02
> permanece bloqueado por sequenciamento (Onda 1 não iniciada), pela nomeação da Autoridade
> de Método e pela guarda C-01, que deve continuar ativa."*

### ADR-068 — Consequência

> *"com as ADR-066, ADR-067 e ADR-068, **nenhuma decisão de domínio falta** ao pacote F-02.
> O bloqueio remanescente é de sequenciamento (Onda 1 não iniciada), de nomeação
> (Autoridade de Método) e de guarda (C-01, que deve permanecer ativa)."*

**Não há como executar esta missão e obedecer a estas ADRs ao mesmo tempo.** A missão
determina materializar **fielmente** as decisões já tomadas; uma das decisões tomadas é,
literalmente, *não implementar ainda*. Materializar fielmente, aqui, **é não implementar**.

## 3. Os três bloqueios remanescentes, um a um

### B-1 · Sequenciamento — a Onda 1 não começou

Arquitetura §15.0 (regra que corrigiu o bloqueador **B6**):

> *"Nenhuma derivação persistida ou consumida pode começar antes de existirem,
> **simultaneamente**: `derivation_proposals` · proveniência completa · regra versionada ·
> autoridade da regra · explicabilidade · reconhecimento em duas colunas · mecanismo de
> discordância · painel de discordância · guardas contra vazamento de critérios · critérios
> de supersessão."*

Dos doze itens da Onda 1 (1.1–1.7, 1.8–1.12, 1.A), **nenhum** foi implementado. Criar a
tabela agora recoloca a persistência antes das dependências — o erro que a v1.1 da
arquitetura já corrigiu uma vez.

### B-2 · Nomeação — a Autoridade de Método continua vaga (DP-4)

O anexo [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) §16 lista sete
condições cumulativas para que exista oferecimento. A **condição 6**:

> *"**A Autoridade de Método está nomeada e ativa** (DP-4) — regra sem dono não propõe."*

A ADR-066 institui a **função**; **nenhum documento nomeia o ocupante**. Uma estrutura de
propostas cuja regra não tem dono nasce inerte por decisão — e nasce antes da hora.

### B-3 · Guarda — C-01 deve permanecer ativa, por determinação da ADR-066

A guarda **C-01** (pacote F-01, ratificada em F-01A) falha se `derivation_proposals`
aparecer em qualquer migration ou módulo. A ADR-066 não a revoga: determina que ela
**continue ativa**.

Implementar F-02 hoje significaria deixar a suíte vermelha ou desligar a guarda — e
desligá-la exigiria, pela missão do F-01, retorno **ao Guardião, ao Arquiteto e à
Governança**. A ADR-066 já se pronunciou: **mantém**.

## 4. O que está pronto para quando o desbloqueio vier

Registro, para que o próximo F-02 seja curto: o domínio necessário **está completo e
legível**, e não precisará ser reinterpretado.

| Estrutura | Norma | Conteúdo já fechado |
|---|---|---|
| `derivation_proposals` | ADR-066 + anexo ADR-A; Arquitetura §9.4 | proposta imutável com desfecho como fato separado · **cinco estados** (`PROPOSTA`·`CONFIRMADA`·`RECUSADA`·`SUPERADA`·`RETIRADA`; `PENDENTE` recusado) · **doze itens obrigatórios de proveniência** · cinco causas de supersessão, que atravessam para a confirmação · ponteiro para a declaração autoritativa, nunca o valor final |
| `curator_judgments` | ADR-067 + anexo ADR-B | duas naturezas (`TECNICO`, `RELACIONAL`) sobre **seis conceitos**, lista fechada · `AREA` excluída · **três estados** (`VIGENTE`·`SUPERADO`·`RETIRADO`) com no máximo **um `VIGENTE`** por (Case, profissional, conceito) · append-only · quatro causas de supersessão · `criterion_declarations` preservada (cópia, nunca migração) |
| Autoridade de escrita | ADR-068 + anexo ADR-D | confirmar é adotar · só confirma quem poderia ter declarado · **RLS da ADR-040 item 6 não reaberta** · sem confirmação parcial, sem confirmação automática (nove formas nomeadas e proibidas) · incompatibilidade "quem confirma não julga", com exceção datada e visível |

## 5. Decisões necessárias para desbloquear — agora são três, não oito

1. **Executar a Onda 1** (12 itens), ou uma decisão explícita do Fundador que suspenda o
   §15.0 para este caso, assumindo por escrito a reintrodução do bloqueador B6.
2. **Nomear a Autoridade de Método** (DP-4) — condição 6 do anexo ADR-A.
3. **Decidir sobre a guarda C-01** pelas três instâncias (Guardião, Arquiteto, Governança),
   já que a ADR-066 determinou expressamente que ela permaneça ativa.

Permanecem, fora do domínio: **janela de publicação** para DDL e **separação do pacote de
segurança** ainda não commitado — nenhuma migration da 2.0 é publicável hoje.

## 6. Conformidade

Nenhuma estrutura criada. Nenhuma migration escrita. Nenhuma guarda alterada, desligada ou
contornada. Nenhuma decisão de domínio tomada. Nenhum documento canônico, ADR ou anexo
modificado — apenas este relatório e os registros derivados do próprio pacote.
