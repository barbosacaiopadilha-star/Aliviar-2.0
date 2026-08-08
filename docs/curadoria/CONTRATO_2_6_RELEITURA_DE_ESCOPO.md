# Contrato do Item 2.6 — Releitura de Escopo (incorporando o Item 1.2)

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **PROPOSTA — aguarda aprovação do Guardião da CURADORIA 2.0** |
| **Base** | `9afaead` (Onda 2 formalmente aberta; releitura do 2.6 nomeada como primeiro movimento canônico) |
| **Item** | **2.6 residual** — Governança de quem confirma o Mapa do Profissional, relido pós-ADR-068 §14.2, **agora carregando o Item 1.2** |
| **Decisão principal requerida** | **G-10: RLS × capability × read-model** (§7–§8) |
| **Implementação** | **NÃO AUTORIZADA** por este documento |

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

## 7. Recomendação arquitetural

> **Recomendação: OPÇÃO B.** É a única que entrega exatamente o dado mínimo pela
> menor superfície, com gate interno já existente, zero mudança de policy e o
> padrão de authority boundary que a casa já provou três vezes.

**Distinção de autoridade, com clareza:** isto é **recomendação do Arquiteto**.
A autoridade existente cobre o padrão (precedentes §21/§17.4); **a decisão sobre
a boundary do G-10 — A × B × C — pertence ao Guardião**, e nada aqui a antecipa.

## 8. Decisão requerida do Guardião

1. **Escolher o desenho do G-10** (recomendação: B).
2. **Aprovar o escopo residual** deste contrato (§2).
3. Confirmar que a escrita do Mapa **permanece intacta** (§9) — reafirmação, não
   decisão nova.

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
| Regime | `SECURITY DEFINER` · `STABLE` · `STRICT` · `search_path` fixo com `pg_temp` ao fim · referências qualificadas · zero SQL dinâmico |
| Gate interno | `is_patient_for_case(p_case_id)` — senão, `SEM_AUTORIDADE` |
| Saída | **`display_name text`** — uma coluna, uma linha no máximo. **Nenhum identificador de operador** (a superfície não precisa; se um dia precisar, é emenda) |
| Erros | `OK` (implícito) · `CASE_NAO_ENCONTRADO` · `SEM_AUTORIDADE` · `CURADOR_NAO_ATRIBUIDO` — catálogo fechado |
| Grants | `REVOKE FROM PUBLIC` imediato · `EXECUTE` a `authenticated` (o gate real é interno, padrão `acknowledge_case_need`) |
| Quem invoca | o cliente **autenticado da paciente**; o administrativo **não participa** |
| Consumo | `repository`/`jornada` trocam o `displayName(profiles)` pela capability **no caminho da paciente**; caminhos internos (Mesa) seguem lendo `profiles` normalmente |

## 12. Relação com o Item 1.12

O requisito "ato com autor, data e contexto visível" está **SATISFEITO POR
DEPENDÊNCIA EXISTENTE** (`derivation_proposal_acts`, capability `decidir_proposta`,
atestado do visível — Contrato 1.12 §10/§19). O 2.6 **referencia, não duplica**.

## 13. Relação com o 2.C — o que o encerramento do 2.6 entrega

Quando o 2.6 residual encerrar, o 2.C poderá considerar satisfeitos:

1. a **governança de quem confirma** — decidida (ADR-068) e **guardada por teste** (§9);
2. a **incompatibilidade §13.2** — lavrada como aceite herdado (§10);
3. **I-12 executável** (§10);
4. o **G-10 resolvido** — a paciente lê o nome do Curador pelo boundary aprovado.

O que o 2.C **não** herda daqui: Fronteira, grants, superfícies, emissor
profissional — gates próprios dele. **O 2.C permanece bloqueado.**

## 14. Não-objetivos

Reabrir autoridade de escrita sem decisão · abrir Fronteira · implementar 2.C ·
decidir DP-5 · expor `profiles` genericamente · criar leitor administrativo
genérico · duplicar o ato do 1.12 · alterar o Motor · tocar `curator_judgments`
(matéria do 2.4).

## 15. Privacidade

Menor dado (uma coluna), menor superfície (um Case, uma dona), gate interno no
banco, catálogo de erros sem vazamento (o `SEM_AUTORIDADE` não revela se o Case
existe para terceiros — `CASE_NAO_ENCONTRADO` só para a própria dona com id
inválido), cliente administrativo fora do fluxo.

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

## 18. Erros

Catálogo fechado do §11 — quatro desfechos, semântica de domínio, saída mínima.

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

## 21. Decisão requerida do Guardião

**G-10: A × B × C** (recomendação: **B**) · aprovação do escopo residual (§2) ·
reafirmação do recorte de escrita (§9). Sem essas três, nada se implementa.

## 22. Encaminhamento

Ao **Guardião da CURADORIA 2.0**. Após aprovação: contrato vira vigente, o 2.6
residual segue para implementação por missão própria (Engenheiro), e o 2.C ganha
seu penúltimo pré-requisito no caminho da abertura.
