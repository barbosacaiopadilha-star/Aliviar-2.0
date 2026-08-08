# Contrato do Item 2.6 — Releitura de Escopo (incorporando o Item 1.2)

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **APROVADO — Guardião da CURADORIA 2.0, 2026-08-08** (`APROVADO COM RESSALVA`; ressalva incorporada: catálogo final de **três** desfechos com fusão anti-vazamento, regra **gate-first** e mutação **MUT-CAT** — §11/§17). Parecer catalogado como **PA-14** no [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md). Nasceu como **PROPOSTA** na base `279a8fb`; lavratura da aprovação no commit registrado no PA-14 |
| **Base** | `9afaead` (Onda 2 formalmente aberta; releitura do 2.6 nomeada como primeiro movimento canônico) |
| **Item** | **2.6 residual** — Governança de quem confirma o Mapa do Profissional, relido pós-ADR-068 §14.2, **agora carregando o Item 1.2** |
| **Decisão G-10** | **OPÇÃO B APROVADA** pelo Guardião — capability nominal read-only; **Opções A e C rejeitadas** (§6–§8) |
| **Implementação** | **NÃO AUTORIZADA** por este documento — exige missão própria |

---

## 1. Contexto

O 2.6 nasceu para "corrigir G4/RI4" ampliando quem confirma/escreve o Mapa do
Profissional (ADR-040 item 6). A **ADR-068 §14.2 decidiu em contrário**: o
recorte permanece intacto (escrita: `administrador`); G4 é problema de **carga**,
não de autoridade; a 2.0 o ataca pelo outro lado (28 digitações viram 28
confirmações informadas); reabrir sem operação real violaria o rito do
Congelamento §6. **Este contrato não reabre a autoridade de escrita.**

No fechamento da Onda 1, o **Item 1.2** (G-10 — a paciente não consegue ler o
nome do Curador) foi **carregado para dentro deste item**, sob a regra "uma
decisão de RLS, num pacote só".

## 2. Objeto residual — a partição completa

| # | Pedaço do 2.6 original/carregado | Classificação |
|---|---|---|
| 1 | Ampliar quem confirma/escreve o Mapa (ADR-040 item 6) | **SUPERADO** — ADR-068 §14.2; reabertura futura só pelo rito do Congelamento §6, com operação real |
| 2 | Registro do ato com autor, data e o que estava visível | **SATISFEITO POR DEPENDÊNCIA EXISTENTE** — Item 1.12 (`derivation_proposal_acts` + capability `decidir_proposta`); **não duplicar** |
| 3 | Incompatibilidade da ADR-068 §13.2 — *"quem confirma o estado não pode ser quem julga e seleciona nesse mesmo Case"* | **AINDA FAZ PARTE DO 2.6** — vira guarda executável (§10) |
| 4 | I-12 — *"o profissional lê o que é dele; a governança continua da operação"* | **AINDA FAZ PARTE DO 2.6** — vira guarda executável (§10) |
| 5 | Teste/guarda de permissão por papel (aceite original) | **AINDA FAZ PARTE DO 2.6** (§9) |
| 6 | **Item 1.2 / G-10** — leitura mínima do nome do Curador pela paciente | **AINDA FAZ PARTE DO 2.6** — o coração da releitura (§4–§8) |
| 7 | Qualquer mudança de writer do Mapa | **FORA DE ESCOPO SEM NOVA DECISÃO** |

## 3. Itens superados e satisfeitos — sem reimplementação

O pedaço 1 **não retorna por implementação**; o pedaço 2 **não é reimplementado**
— o 2.6 apenas **referencia** o mecanismo do 1.12 como o cumpridor do requisito.

## 4. O Item 1.2 dentro do 2.6 — o problema, com precisão

| Dimensão | Definição |
|---|---|
| **Ator leitor** | a **paciente autenticada**, dona do Case |
| **Dado mínimo** | o **nome de exibição** do Curador **do próprio Case** — nada mais |
| **Case de escopo** | exclusivamente o(s) Case(s) em que `is_patient_for_case(case_id)` é verdadeiro |
| **Fonte atual** | `curadoria.profiles`, via `displayName(curator_id)` ([`repository.ts:89`](../../src/modules/curadoria/repository.ts)) |
| **Restrição de RLS** | `profiles` é interna; a paciente não lê perfis de operadores — **e isso está certo como regra geral** |
| **Superfícies consumidoras** | portal da paciente: `paciente/page.tsx` (3 usos) · `next-action.ts` — frases interpoladas com o nome |
| **Risco de privacidade** | perfis internos contêm mais que o nome; expor a linha exporia o operador |
| **Boundary autorizado** | a decidir pelo Guardião entre as opções do §6 — **nunca acesso genérico a `profiles`** |

## 5. G-10 — lavrado

`curadoria.profiles` não é pública · a paciente não pode ler perfis internos ·
`displayName(curator_id)` depende dessa leitura · **o resultado degradado atual é
consequência do gate funcionando, não falha acidental** · resolver exige uma
**nova authority boundary**, sob o princípio: **menor dado possível, menor
superfície possível.**

## 6. As três opções, analisadas

### Opção A — alteração mínima de RLS

Policy de `SELECT` em `profiles` com `using (curadoria.is_patient_for_case(<case do curador>))`…

| Critério | Avaliação |
|---|---|
| Suficiência técnica | **parcial** — RLS filtra **linhas, não colunas**: a policy exporia a **linha inteira** do perfil do Curador (tudo que a tabela carrega), não só o nome |
| Correção do vazamento | exigiria **view dedicada** por cima — dois objetos novos e a policy ainda ancorada numa junção Case↔Curador não trivial na própria `profiles` |
| Risco | ampliar leitura de uma tabela interna por policy é exatamente o que G-10 protege |
| Filosofia da casa | contraria o padrão recente: a casa resolve leitura pontual por **capability nominal**, não por abrir tabela |

### Opção B — capability nominal read-only de saída mínima ★

`curadoria.nome_do_curador_do_caso(p_case_id uuid)`:

| Critério | Avaliação |
|---|---|
| Especificidade | responde **uma pergunta só**: o nome de exibição do Curador **deste** Case |
| Autenticação/gate | `SECURITY DEFINER` com gate **interno**: `auth.uid()` + **`is_patient_for_case(p_case_id)` — helper que já existe** (stage 7) e já guarda policies da paciente |
| Escopo por Case | por construção: o argumento é o Case; o gate recusa quem não é a dona |
| Saída mínima | **uma coluna** (`display_name text`); zero linha de `profiles` exposta |
| Acesso genérico | impossível — não há predicado livre, não há listagem |
| Auditabilidade | função nomeada, lavrada, com grants explícitos — o padrão §21/§17.4, **três precedentes verdes** (leitora individual, agregada, decisora) |
| Compatibilidade §17.4 do 1.11 | total: capability nominal lavrada; o cliente da paciente a invoca autenticado — **o cliente administrativo não participa** |

### Opção C — read model / projeção dedicada

Tabela ou view materializada com o par Case→nome. **Excesso arquitetural**: cria
um segundo lugar para um fato que já tem fonte (P-07 em risco na sincronização),
para servir **um campo** em **uma superfície**. Custo alto, benefício nulo sobre
a B.

## 7. Recomendação arquitetural *(histórico — decisão tomada, ver §8)*

> **Recomendação: OPÇÃO B.** É a única que entrega exatamente o dado mínimo pela
> menor superfície, com gate interno já existente, zero mudança de policy e o
> padrão de authority boundary que a casa já provou três vezes.

## 8. Decisão do Guardião — lavrada (2026-08-08)

> **G-10 — OPÇÃO B APROVADA.** As **Opções A e C foram rejeitadas** (A: RLS
> filtra linha, não coluna — exporia o perfil e exigiria view; C: excesso
> arquitetural, segunda origem para fato com fonte). O **escopo residual do §2
> está aprovado** e a **escrita do Mapa permanece intacta** (§9) — reafirmada,
> nenhuma decisão nova.
>
> A capability do G-10 **não é abertura de superfície nova**: ela serve a
> **superfície da paciente já autorizada** (portal existente). A Fronteira
> Humana permanece **FECHADA**, com grants do 1.12 = zero e O2-A/B pendentes —
> exceção distinta, nomeada aqui para que ninguém a confunda com abertura.

## 9. Autoridade de escrita do Mapa — preservada e testada

**Nada muda**: escrita de `professional_subcriterion_map` permanece no recorte da
ADR-040 item 6 (`administrador`), conforme ADR-068 §14.2. O contrato acrescenta o
**aceite executável** que faltava (o aceite original do 2.6):

| Pergunta | Resposta testável |
|---|---|
| Quem pode escrever | `administrador` (policy vigente) |
| Quem não pode | `anon` · `authenticated` sem papel · `curador_medico` (leitura sim, escrita não) · **o próprio profissional** (I-12) · a paciente |
| Como testar | oráculo de catálogo (`has_table_privilege` + policies) + tentativa negativa por papel, padrão `derivacao-inerte` |
| Como falsear | mutação: conceder escrita a um papel extra ⇒ o oráculo cai |
| Regressão silenciosa | guarda G-2.6-4 varre migrations por policies novas sobre o Mapa |

## 10. I-12 e §13.2 — de invariante a guarda

- **I-12** (*o profissional lê o que é dele; a governança continua da operação*):
  guarda G-2.6-3 — nenhuma policy/capability/action dá ao profissional escrita no
  próprio Mapa; **mutação que deve cair**: writer aceitando
  `auth.uid() = professional_profile.user_id`.
- **§13.2** (*quem confirma o estado não julga e seleciona no mesmo Case*):
  torna-se **cláusula de contrato do futuro fluxo de confirmação** (2.C) e guarda
  documental aqui — a incompatibilidade é verificável quando os dois atos
  existirem no mesmo Case; o 2.6 a lavra como aceite herdado pelo 2.C.

## 11. Leitura mínima — contrato da capability (se B for a escolhida)

| Item | Especificação |
|---|---|
| Nome | `curadoria.nome_do_curador_do_caso(p_case_id uuid)` |
| Regime | nominal · read-only · `SECURITY DEFINER` · `STABLE` · `STRICT` · `search_path` fixo com `pg_temp` ao fim · referências qualificadas · zero SQL dinâmico · **sem policy nova de SELECT** · **sem leitura genérica de `profiles`** |
| **Gate-first — ordem vinculante** | **o gate vem primeiro.** `is_patient_for_case(p_case_id)` é a **primeira e única** authority boundary, avaliada **antes de qualquer dado** do Case ou do Curador ser resolvido. A implementação **não pode** consultar existência e depois testar autoridade — testa a boundary, e **só então** resolve o nome. Consequência deliberada: **terceiros não distinguem Case inexistente de Case alheio** |
| Saída | **`display_name text` SOMENTE** — uma coluna, uma linha no máximo. **Proibidos na saída**: `profile.id` · uuid de autenticação · e-mail · telefone · papel · avatar · metadados · timestamps · histórico. **O identificador interno nunca aparece ao cliente** — se a superfície um dia precisar de mais, é emenda com lavratura |
| **Desfechos — catálogo fechado em TRÊS** *(ressalva do Guardião — `CASE_NAO_ENCONTRADO` removido do domínio)* | **`OK`** — a chamadora é a dona do Case e há Curador atribuído · **`SEM_AUTORIDADE`** — funde **indistinguivelmente** Case inexistente, Case de terceiro e qualquer chamador que não seja a paciente do Case · **`CURADOR_NAO_ATRIBUIDO`** — o Case é da chamadora, mas não há Curador atribuído |
| Grants | `REVOKE FROM PUBLIC` imediato · `EXECUTE` a `authenticated` (o gate real é interno, padrão `acknowledge_case_need`) |
| Quem invoca | o cliente **autenticado da paciente**; o administrativo **não participa** |
| Consumo | `repository`/`jornada` trocam o `displayName(profiles)` pela capability **no caminho da paciente**; caminhos internos (Mesa) seguem lendo `profiles` normalmente |

## 12. Relação com o Item 1.12

O requisito "ato com autor, data e contexto visível" está **SATISFEITO POR
DEPENDÊNCIA EXISTENTE** (`derivation_proposal_acts`, capability `decidir_proposta`,
atestado do visível — Contrato 1.12 §10/§19). O 2.6 **referencia, não duplica**.

## 13. Relação com o 2.C — o que "2.6 satisfeito" significa *(lavrado na aprovação)*

O futuro 2.C **só poderá considerar o 2.6 satisfeito** quando, cumulativamente:

1. o **G-10 (Opção B)** estiver **implementado e verde**;
2. o **recorte de escrita** estiver **guardado por teste** (§9, G-2.6-4);
3. **I-12** estiver **verde** (G-2.6-3);
4. o **aceite de permissão por papel** estiver **verde** (§9);
5. o **ato do 1.12** estiver reconhecido como **dependência satisfeita** (§12);
6. a **incompatibilidade §13.2** estiver **herdada — incluindo o regime de
   transição da exceção**: enquanto a Fronteira não abrir, a incompatibilidade é
   cláusula lavrada; ao abrir, vira verificação executável entre os dois atos no
   mesmo Case.

O que o 2.C **não** herda daqui: Fronteira, grants, superfícies, emissor
profissional — gates próprios dele. **O 2.C permanece BLOQUEADO até a
implementação e o encerramento formal do 2.6 — e mesmo então, pelos seus
próprios gates.**

## 14. Não-objetivos

Reabrir autoridade de escrita sem decisão · abrir Fronteira · implementar 2.C ·
decidir DP-5 · expor `profiles` genericamente · criar leitor administrativo
genérico · duplicar o ato do 1.12 · alterar o Motor · tocar `curator_judgments`
(matéria do 2.4).

## 15. Privacidade — não-vazamento por desenho

Menor dado (uma coluna), menor superfície (um Case, uma dona), gate interno no
banco. **Regra de não-vazamento lavrada pela ressalva**: com o catálogo de três
desfechos e o gate-first (§11), `SEM_AUTORIDADE` é a resposta **única e
indistinguível** para Case inexistente e Case alheio — a capability **nunca
confirma a existência de um Case a quem não é sua dona**. Cliente administrativo
fora do fluxo.

## 16. Guardas

| # | Guarda | Cai se |
|---|---|---|
| **G-2.6-1** | paciente só obtém o nome do Curador **do próprio Case** | a capability aceitar Case de terceiro (teste negativo com segunda paciente) |
| **G-2.6-2** | **nenhuma leitura genérica de `profiles`** nasce | policy nova de SELECT para `authenticated`/paciente em `profiles`, ou capability com listagem |
| **G-2.6-3** | profissional **não escreve** o próprio Mapa (I-12) | writer/policy aceitando o vínculo profissional-autenticado |
| **G-2.6-4** | recorte de escrita atual **íntegro** | migration concede escrita do Mapa a papel novo |
| **G-2.6-5** | **2.C continua fechado** | superfície/emissor/grant do 2.C nasce citando o 2.6 como pretexto |

## 17. Falseabilidade — mutações obrigatórias

paciente lê nome de Curador de outro Case ⇒ G-2.6-1 cai · capability retorna
campo extra ⇒ contrato de saída cai · `SELECT` genérico em `profiles` ⇒ G-2.6-2
cai · profissional ganha writer ⇒ G-2.6-3 cai · papel não autorizado escreve o
Mapa ⇒ G-2.6-4/§9 caem · 2.C consome antes do encerramento ⇒ G-2.6-5 cai.

> **MUT-CAT** *(ressalva do Guardião — obrigatória na implementação e na
> verificação)*: alterar temporariamente a capability para **responder de forma
> diferente** a Case inexistente e a Case de terceiro ⇒ **o oráculo de
> não-vazamento (§15) deve cair.** Sem esta mutação, a fusão do
> `SEM_AUTORIDADE` seria promessa sem prova.

## 18. Erros

Catálogo fechado do §11 — **três desfechos** (`OK` · `SEM_AUTORIDADE` ·
`CURADOR_NAO_ATRIBUIDO`), semântica de domínio, saída mínima.
`CASE_NAO_ENCONTRADO` **não existe no domínio** — removido pela ressalva do
Guardião de catálogo, exemplos, critérios e testes futuros.

## 19. Rollback

Tudo aditivo: `drop` da capability + reverter a troca de fonte no caminho da
paciente (volta ao `null` degradado) + remover guardas por `git revert`. Nenhum
dado tocado, nenhuma policy alterada (na Opção B).

## 20. Critérios de aceite do 2.6 residual

| # | Critério |
|---|---|
| 1 | O desenho do G-10 aprovado pelo Guardião está implementado e **a paciente vê o nome do Curador do próprio Case** |
| 2 | **Nenhuma leitura genérica de `profiles`** nasceu (G-2.6-2 verde) |
| 3 | Aceite executável de permissão por papel verde (§9), com mutações caindo |
| 4 | I-12 executável (G-2.6-3) |
| 5 | §13.2 lavrado como aceite herdado pelo 2.C |
| 6 | Requisito do ato referenciado ao 1.12, sem duplicação |
| 7 | Escrita do Mapa intacta — zero mudança de recorte |
| 8 | 2.C segue bloqueado; Fronteira fechada; grants do 1.12 zero |
| 9 | Regressão integral verde; rollback limpo |

## 21. Decisão do Guardião — tomada e lavrada

**G-10 = OPÇÃO B** (A e C rejeitadas) · escopo residual do §2 **aprovado** ·
recorte de escrita **reafirmado intacto** · ressalva incorporada: catálogo de
três desfechos, gate-first, MUT-CAT. Parecer **PA-14**.

## 22. Encaminhamento

Contrato **APROVADO E LAVRADO**. O 2.6 residual está **apto a receber missão de
implementação** (Engenheiro); a implementação **não** começa sem essa missão. O
2.C permanece bloqueado; a Fronteira, fechada.
