# Retenção e Descarte de Cases com Histórico Imutável

**Documento de análise e decisão — ADR-038.**
Status: **Aprovada e implementada** — 2026-07-27.
Migration `20260727140000_descarte_administrativo_de_case`; certificação em `tests/integration/descarte-de-case.integration.test.ts`.

O §8 descreve o plano tal como foi aprovado; o que efetivamente mudou está resumido no §12, incluindo a diferença entre o desenho proposto e o implementado.

---

## 1. Causa formal

`curadoria.case_responsibility_changes` (migration `20260724192608_case_auditoria_troca_responsavel_fase2`) declara duas coisas que se contradizem:

```sql
case_id uuid not null references curadoria.cases(id) on delete cascade,   -- linha 6
...
create trigger case_responsibility_changes_append_only
  before update or delete on curadoria.case_responsibility_changes
  for each row execute function curadoria.enforce_responsibility_log_append_only();
```

E a função:

```sql
raise exception 'curadoria.case_responsibility_changes é append-only: % não é permitido', tg_op;
```

O gatilho é `FOR EACH ROW BEFORE DELETE` e **não distingue a origem do DELETE**. A cascata que a própria tabela declara na linha 6 dispara o gatilho e é recusada. Resultado observado:

```
ERROR: curadoria.case_responsibility_changes é append-only: DELETE não é permitido
```

Um Case que trocou de responsável **não pode ser excluído por nenhum caminho** — nem pelo `ON DELETE CASCADE` que o autor escreveu para ele.

### Efeito em cadeia

Como `cases.patient_profile_id → profiles ON DELETE CASCADE`, apagar o paciente tentaria apagar o Case e esbarra no mesmo gatilho. Ficam de pé, indefinidamente:

- o Case;
- a conta e o perfil do paciente;
- a história de origem;
- todo o resto da cadeia que dependeria da cascata.

Na suíte de integração, três cadeias por execução (origem única: `curador-assume-case`).

---

## 2. Intenção original inferível

O cabeçalho da migration diz, textualmente:

> *Toda passagem de bastão deixa rastro: quem entregou, quem recebeu, quando, por ordem de quem, e por quê. Append-only.*

E o comentário da função:

> *Append-only imposto pelo banco, não pela disciplina de quem escreve código.*

A intenção é **impedir que o rastro de uma passagem de bastão seja reescrito ou apagado enquanto o Case existe** — que ninguém possa alterar quem recebeu, quando, ou o motivo. É a **garantia 1** da pergunta de domínio.

**A evidência decisiva é a própria linha 6.** Quem escreveu `on delete cascade` esperava que o log morresse junto com o Case. A garantia 2 (Case imortal) nunca foi escolhida — ela é o efeito colateral de um gatilho que não perguntou de onde vinha o DELETE.

### O gatilho não protege produção — a RLS já protege

Estado real do banco de produção, verificado:

| Papel | Privilégios em `curadoria.cases` |
|---|---|
| `authenticated` | INSERT, SELECT, UPDATE |
| `anon` | nenhum |
| `service_role` | INSERT, SELECT, UPDATE, DELETE, TRUNCATE |

Políticas de RLS em `cases`: `INSERT`, dois `SELECT`, um `UPDATE`. **Nenhuma política de `DELETE`, e nenhum `GRANT DELETE` a `authenticated`.**

Ou seja: **nenhum usuário humano, em nenhum papel, consegue apagar um Case pela aplicação** — e isso já era verdade antes do gatilho. O único caminho restante é `service_role`, no servidor.

Conclusão: hoje o gatilho não acrescenta proteção alguma contra usuário. O que ele efetivamente bloqueia é a **operação administrativa autorizada** e a **limpeza de ambiente de teste** — exatamente os dois casos em que apagar é legítimo.

---

## 3. Cenários

| Cenário | Hoje | Deveria ser |
|---|---|---|
| Case sintético de teste | indestrutível; base local cresce | descartável, sem cerimônia |
| Case de demonstração | indestrutível | descartável por administrador |
| Case criado por engano | indestrutível; fica para sempre na fila | descartável, com motivo registrado |
| Solicitação válida de eliminação de dados (LGPD, art. 18, VI) | **impossível de atender** | atendível; ver §7 |
| Retenção obrigatória por auditoria | garantida | garantida — o descarte é exceção auditada, não regra |
| Anonimização | inexistente | necessidade real, **decisão separada** |
| Exclusão administrativa autorizada | impossível | possível, por porta única e auditada |
| Exclusão de conta | falha se a pessoa tem Case com troca de responsável | possível |
| Ambiente local após teste | 3 cadeias/execução acumulando | zero |
| Produção | Cases imortais por acidente | Cases imortais **por regra**, com exceção nomeada |

O quarto item é o mais grave. Uma solicitação legítima de eliminação de dados hoje **não tem como ser atendida** — não por decisão de política, mas por um efeito colateral que ninguém escolheu.

---

## 4. Alternativas

### A — Exceção controlada para ambiente de teste
Permitir o descarte só em local/teste, para Case marcado como fixture.

- ✅ Resolve a suíte.
- ❌ Não resolve engano, LGPD nem operação administrativa.
- ❌ **Faz o domínio se comportar diferente em local e em produção.** A partir daí a suíte deixa de provar produção justamente no caminho que ela exercita. É o pior tipo de dívida: silenciosa e sistêmica.

### B — Anonimização e retenção
O Case fica; a identidade é desvinculada.

- ✅ Resolve privacidade preservando o histórico operacional.
- ❌ Não resolve teste, engano nem demonstração — anonimizar um Case de teste continua deixando o Case.
- ➜ **Não é alternativa: é necessidade complementar.** Deve virar decisão própria (§7).

### C — Função administrativa de descarte integral
Operação privilegiada, auditada, que remove a cadeia inteira em ordem segura. Não exposta como `DELETE` comum.

- ✅ Restaura a intenção original (a cascata da linha 6 volta a funcionar).
- ✅ Mantém o append-only contra reescrita — que é a garantia que se quis.
- ✅ Comportamento **idêntico** em local e em produção; a suíte volta a provar produção.
- ✅ Porta única, nominal, com motivo obrigatório e registro do próprio descarte.
- ⚠️ Cria uma capacidade destrutiva onde não havia. Mitigado em §6.

### D — Manter o comportamento atual
Aceitar Cases imortais e conviver.

- ✅ Custo zero agora.
- ❌ Base local cresce para sempre; a suíte nunca é idempotente; toda sessão visual exige `reset`.
- ❌ **Nenhum caminho para eliminação de dados** — risco regulatório real, hoje sem resposta.
- ❌ Mantém uma regra que ninguém decidiu, sustentada por acidente de implementação.

---

## 5. Riscos

| Risco | Alternativa | Mitigação |
|---|---|---|
| Descarte indevido em produção | C | Motivo obrigatório, administrador nomeado, registro do descarte antes da exclusão, sem exposição HTTP |
| Perda de rastro do que foi descartado | C | O registro sobrevive ao Case: `audit_logs` não tem FK para `cases`, e o `case_id` vai em `metadata` |
| A porta virar rotina | C | Sem UI, sem rota, sem Server Action; só caminho de script administrativo revisado |
| Divergência local × produção | A | Motivo direto para recusar A |
| Continuar sem resposta a pedido de eliminação | D | Motivo direto para recusar D |
| Privacidade tratada como exclusão quando deveria ser anonimização | C isolada | §7: B entra como decisão própria, não como consolo |

---

## 6. Decisão recomendada pelo domínio

> **Alternativa C**, com a garantia 1 explicitada e a garantia 2 recusada como regra acidental.

**O que se preserva, sem exceção:** enquanto um Case existe, seu histórico de responsabilidade é imutável. Nenhum `UPDATE`, nunca. Nenhum `DELETE` avulso de linha do log, nunca.

**O que se corrige:** o histórico de um Case **deixa de existir junto com o Case**, e só assim — que é o que a linha 6 sempre disse.

### Como cada requisito é respondido

- **Produção:** inalterada para todo usuário. `authenticated` continua sem `DELETE` em `cases` e sem política de `DELETE`. O que muda é que passa a existir **uma** porta administrativa, no servidor, que hoje não existe.
- **Local:** exatamente o mesmo comportamento. Nenhuma condicional de ambiente no domínio.
- **Auditoria:** nada é desligado. O descarte **grava antes de apagar**, e o registro sobrevive porque `audit_logs` não pertence à cascata do Case.
- **Privacidade e retenção:** o descarte integral atende à eliminação; a anonimização (§7) atende à retenção com desidentificação. São respostas diferentes para pedidos diferentes.
- **RLS:** nenhuma política nova, nenhuma política afrouxada. A porta é uma função `SECURITY DEFINER`, não uma permissão de tabela.
- **Cascatas:** as que já existem passam a funcionar como declaradas. Nenhuma cascata nova.
- **Testes:** a limpeza passa a chamar a função; os 3 Cases residuais por execução vão a zero e a suíte fica plenamente idempotente.
- **Quem executa:** administrador, nomeado como parâmetro e verificado contra `user_roles` dentro da função. `service_role` **não é justificativa** — é apenas o transporte; a autorização é verificada no corpo da função.
- **Como a operação é auditada:** cada descarte grava em `audit_logs` a ação `case_discarded`, o administrador autorizador, o motivo (obrigatório, não vazio) e, em `metadata`, o `case_id`, o paciente, a contagem de trocas de responsável descartadas e o momento.

---

## 7. Decisão separada, recomendada em seguida

**Anonimização (Alternativa B) não é substituta e não deve ser decidida junto.** Descarte e anonimização respondem a pedidos distintos: *"apaguem meus dados"* e *"não quero mais ser identificável, mas o atendimento aconteceu"*. Recomendo abrir ADR própria com participação de quem responde por LGPD na Aliviar, definindo prazos de retenção por tipo de dado. Este documento não decide isso.

---

## 8. Plano de implementação (separado — só após aprovação)

**Bloco 1 — refinar o gatilho.** `UPDATE`: recusa incondicional (inalterado). `DELETE`: recusa, exceto quando a transação corrente carrega a autorização do descarte para *aquele* `case_id`, via `current_setting` local à transação (`set_config(..., is_local => true)`) — não sobrevive ao commit, não vaza para outra sessão, não pode ser ligado por fora da função.

**Bloco 2 — a função de descarte.** `curadoria.descartar_case(_case_id uuid, _autorizado_por uuid, _motivo text)`, `SECURITY DEFINER`, `set search_path = curadoria, pg_temp`. Valida motivo não vazio; valida que `_autorizado_por` tem papel `administrador`; grava a auditoria; arma a autorização; apaga o Case (a cascata faz o resto); devolve o resumo do que foi apagado.

**Bloco 3 — grants.** `revoke all ... from public, anon, authenticated`. Sem rota, sem Server Action, sem botão.

**Bloco 4 — testes.** Certificar: usuário comum não alcança a função; administrador com motivo vazio é recusado; não-administrador é recusado; o Case some com a cadeia; o registro de auditoria sobrevive ao Case; o gatilho continua recusando `UPDATE` e `DELETE` avulso de linha do log.

**Bloco 5 — limpeza da suíte.** `tests/integration/limpeza/inventario.ts` passa a chamar a função nos Cases que hoje registra como indestrutíveis. O sentinela deixa de aceitar resíduo dessa classe.

**Bloco 6 — documentação.** ADR-038 em `docs/DECISIONS.md`, este documento em `docs/INDEX.md`, e a operação no `docs/MANUAL_CURADOR.md` apenas como *não é operação de Curador*.

---

## 9. Estratégia de migração

Migration aditiva, sem alteração de dados: `create or replace` do gatilho, `create` da função, `revoke` dos grants. Nenhuma linha existente é tocada; nenhum Case é descartado pela migration.

Aplicar primeiro em local, rodar a suíte duas vezes sem reset, e só então em produção — onde o efeito imediato é **nenhum**, porque a função não é chamada por nada.

## 10. Estratégia de rollback

Reversível com um `create or replace` do gatilho na forma anterior (recusa incondicional) e `drop function curadoria.descartar_case`. Nenhum dado migrado, nada a reverter em conteúdo. Os Cases descartados até o rollback continuam descartados — por isso o registro de auditoria do descarte é obrigatório antes, não depois.

## 11. Impacto na suíte

Hoje: 27 arquivos, 244 testes verdes, resíduo de **3 Cases + 3 contas + 3 histórias por execução**, declarado e conferido pelo sentinela.

Depois: resíduo **zero**. O sentinela deixa de ter a classe de exceção e volta a exigir igualdade com a baseline em todas as entidades.

Até a aprovação, o comportamento atual permanece e continua declarado — não é resíduo tolerado em silêncio.

---

## 12. O que foi implementado (2026-07-27)

**Migration:** `20260727140000_descarte_administrativo_de_case` — aditiva. Não descarta Case nenhum, não altera linha nenhuma, não concede DELETE, não toca RLS. Efeito imediato em produção: **nenhum**, porque nada a chama.

### Diferença entre o proposto e o implementado

O §8 propunha destravar o gatilho por uma variável local à transação. Sozinha, isso seria "uma variável de sessão como única defesa". O implementado exige **duas condições, ambas obrigatórias**:

**(a) Estrutural — o Case pai já não existe.** Verificado empiricamente antes de escrever a migration: num `DELETE` avulso da linha do log, o Case ainda está lá quando o `BEFORE DELETE` dispara; numa cascata vinda de `delete from cases`, o Case já saiu. A diferença entre "estão apagando o rastro" e "o Case inteiro deixou de existir" não depende de nada que um cliente possa afirmar sobre si mesmo.

**(b) Autorização** — a transação carrega a marca do descarte para **aquele** `case_id`, posta por `discard_case_admin` com `is_local => true`.

Sem (b), qualquer detentor de `DELETE` em `cases` apagaria um Case por fora da porta auditada. Sem (a), a defesa seria só a variável. Juntas: a única forma de remover o histórico é o Case inteiro sendo descartado pela função. Certificado por teste — `delete from cases` direto, com `service_role`, é recusado.

### A função

`curadoria.discard_case_admin(_case_id uuid, _reason text, _executed_by uuid default null)`, `SECURITY DEFINER`, `search_path` fixo. Exige `case_id`; exige motivo não vazio após `btrim`; resolve o executor como `coalesce(auth.uid(), _executed_by)` — **sessão autenticada tem precedência, ninguém se passa por outro**; recusa executor ausente; verifica papel `administrador` em `user_roles`; confirma que o Case existe; grava auditoria; apaga; devolve o resumo. Tudo em uma transação.

`service_role` é **transporte**: certificado por teste que, sem executor identificado, a chamada é recusada mesmo com service role.

### Auditoria

Novo valor no ENUM `curadoria.audit_action`: `case_discarded` — auditoria de vocabulário controlado, não texto livre. O registro carrega `case_id`, status, `is_certification`, quantas trocas de responsável foram descartadas, o motivo e o instante. **Nenhum conteúdo clínico, narrativa ou documento** — coberto por teste que varre as chaves do metadado.

`audit_logs` referencia apenas `profiles`, nunca `cases` — por isso o rastro sobrevive ao descarte.

### Privilégios finais

`revoke all` de `public`, `anon` e `authenticated`; `grant execute` só a `service_role`. Sem rota, Server Action, botão ou painel. Superfície de RPC fechada por ausência de EXECUTE — e, se um dia for aberta, a checagem de papel continua obrigatória no corpo.

### Casos protegidos

Nenhuma restrição nova foi inventada. A ADR não distingue Case com Relatório emitido, Connection ou Relationship ativa, nem Case real de fixture: a política aprovada é **autorização administrativa + motivo + auditoria**, e é exatamente isso que a função exige. Restrições adicionais, se vierem, precisam de decisão própria.

### Certificação

`tests/integration/descarte-de-case.integration.test.ts` — 14 cenários contra o banco real local: anônimo, paciente, Curador, service_role sem executor, motivo vazio, Case inexistente, descarte completo, auditoria antes e sobrevivente, metadado mínimo, `UPDATE` impossível para qualquer papel, `DELETE` avulso impossível, porta única, autorização que não vaza entre Cases, rollback integral e Case sem histórico.

### Idempotência

Baseline `users=6 profiles=6 roles=6 cases=0 prof=0 rede_pub=0 hist=0`; duas execuções consecutivas sem reset devolvem **exatamente** esses números. Cresce só `audit_logs` (6 → 240 → 474), com 16 `case_discarded` por execução.

Uma correção veio junto: a limpeza estava apagando o próprio registro de descarte, porque ele aponta para o paciente como alvo. Agora `case_discarded` é preservado — a prova do que foi apagado não pode morrer com o que foi apagado.
