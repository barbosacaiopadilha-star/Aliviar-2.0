# Contrato do Item 2.4 — `curator_judgments` (infraestrutura inerte de juízo humano)

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **PROPOSTA — aguarda aprovação do Guardião da CURADORIA 2.0** |
| **Base** | `01f45dc` (2.6 residual implementado; 2.4 declarado próximo movimento canônico) |
| **Item** | **2.4** — `curator_judgments` **sem `AREA`** |
| **Autoridade central** | **ADR-067** (anexo `ADR_B_JUIZO_HUMANO.md`) — domínio integralmente fechado: §4.4 naturezas · §5 divisão da AVALIAÇÃO · §7 ato válido · §8 onze itens · §9–§10 versões · §12 supersessão (JS1–JS4) · §13 estados e unicidade · RS-03 (`AREA` fora) |
| **Implementação** | **NÃO AUTORIZADA** por este documento |

---

## 1. Autoridade

ADR-067 (integral) · ADR-066 onde restringe: **propostas só para conceitos com
lado da pessoa** (§16) — juízo não recebe proposta · Item 2.1 e atos do 1.12
como precedentes de estrutura inerte e de fato humano em entidade própria ·
padrões append-only da casa (`practice_evidence`, transições 2.2B,
`derivation_proposal_acts`). **Nenhuma autoridade nova é criada; nenhuma decisão
da ADR-067 é reaberta.**

## 2. Objeto

> **`curadoria.curator_judgments` — o registro auditável do juízo humano do
> Curador sobre conceito cujo resultado não pertence a uma célula automática do
> Motor.**

**Juízo humano ≠ proposta de derivação.** O juízo é **ato do Curador**
(autoridade decisória originária, ADR-067 §14); a proposta é **ato do sistema**
sobre campo alheio (ADR-066). **Um não substitui o outro, nunca.**

## 3. Não-objetivos

Writer/capability operacional (matéria do 2.3 — §17) · superfície · qualquer
juízo real · proposta de julgamento · tocar `AREA`/filtros · abrir 2.C ·
Fronteira · alterar Motor, Mapas ou a Camada de Derivação.

## 4. Definições

**Julgamento**: a cadeia de versões sobre um alvo. **Versão**: um ato humano
gravado (§9). **Alvo**: o par (Case, profissional) + conceito canônico **por
código** (I-2). **Vigente**: a versão mais recente em estado `VIGENTE` (§12).

## 5. Naturezas — exatamente duas

`TECNICO` · `RELACIONAL` — lista fechada por CHECK estrutural. *"Técnico nunca
fala de relação; relacional nunca fala de mérito"* (ADR-067 §8 item 3).

## 6. Conceitos — exatamente seis

| Natureza | Conceitos (por código canônico) |
|---|---|
| `TECNICO` (H8–H10) | `FORMACAO` · `EXPERIENCIA` · `HISTORICO` |
| `RELACIONAL` (H11) | `MODELO_DECISAO_COMPARTILHADA` · `MODELO_PREFERENCIAS_E_RESTRICOES` · `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` |

Sétimo conceito não existe no domínio — CHECK estrutural + guarda G-2.4-2.
**`AREA` está estruturalmente fora** (RS-03, ADR-067 §187): área é **filtro
eliminatório** com quatro estados próprios; nenhuma coluna, valor ou conceito
`AREA` nasce nesta entidade. Falseabilidade: adicionar `AREA` à entidade ou à
lista ⇒ **G-2.4-3 cai**.

## 7. Estados — os três da ADR-067 §13, nominalmente

| Estado | Semântica (texto da ADR) | Origem válida | Terminal? |
|---|---|---|---|
| **`VIGENTE`** | *"é a conclusão que vale agora para aquele (Case, profissional, conceito)"* | todo ato válido nasce `VIGENTE` | **não** — substituível por versão nova ou supersessão |
| **`SUPERADO`** | *"deixou de valer por JS1–JS4 (§12)"* — inclusive **JS3: evidência nova supersede o juízo, mesmo que a conclusão provavelmente não mudasse** | transição sobre versão `VIGENTE` | **sim** |
| **`RETIRADO`** | *"o autor o retirou sem substituir; o conceito voltou a ausência de juízo"* | ato do autor sobre versão `VIGENTE` | **sim** |

**Duas decisões preservadas da ADR:** `PENDENTE` **não é estado** (ausência de
juízo é ausência de registro; `AGUARDA_JUIZO_DO_CURADOR` é derivação da
ausência) · **rascunho não existe** (texto não submetido não é julgamento).

## 8. Entidade — decisões estruturais (norma, não SQL)

| Elemento | Cláusula |
|---|---|
| Nome | `curadoria.curator_judgments` |
| PK | identidade própria da **versão** (item 1 do §8 da ADR: referência estável) |
| Alvo | `case_id` (FK) · `professional_profile_id` (FK) · `subcriterion_code` (código canônico, mesmo regime de identidade estável das demais tabelas) |
| Natureza | `TECNICO`\|`RELACIONAL` — CHECK; coerência natureza×conceito garantida estruturalmente (os seis pares do §6) |
| Estado | `VIGENTE`\|`SUPERADO`\|`RETIRADO` — CHECK |
| Autoria | `actor_id` **not null** (FK `profiles`) + instante do ato **not null** |
| Conclusão | o texto do Curador (item 6 do §8) — limite curto da casa; **sem extensão mínima** (§7) |
| Fatos visíveis | as declarações dos dois lados **com versão** (item 7 do §8) — por **referência**, no padrão do atestado do 1.12 |
| Evidências | **referências com versão e estado de verificação** (item 8) — §10 deste contrato |
| Catálogo | versão do catálogo vigente no ato (item 9) |
| Versão | número da versão na cadeia + **referência à versão anterior** (item 10; §9: *"cada uma referencia a anterior"*) |
| Motivo | **oferecido, nunca exigido** (§9 — o mesmo P-10 da recusa) |

## 9. Autoria — real, da versão, nunca do payload

A autoria **é da versão, nunca do julgamento como um todo** (§9 — outro Curador
pode assumir). `actor_id` vem **da identidade autenticada** no futuro caminho de
escrita — **cláusula herdada pelo 2.3: o cliente jamais escolhe o autor; o autor
é `auth.uid()`**, padrão `decidir_proposta`/`acknowledge_case_need`.
**`service_role` não é autoria humana** e não pratica juízo. Indelegável (§7
condição 8): não existe juízo "pela equipe" nem "pelo sistema, revisado por".

## 10. Evidência — referência, nunca texto redigitado

> **O juízo referencia evidência; não copia o texto como segunda origem** (§7
> condição 7; resolve R10; P-07 preservado).

Referências por **`id` + `version`** de `practice_evidence` (ponteiro, nunca
busca — C-01c), com o **estado de verificação acompanhando a referência sem
contaminar a conclusão** (julgar sobre evidência não verificada é permitido, **é
registrado como tal**, e vira lacuna de governança na Ficha — I-5). Conjunto de
evidências: zero ou mais (julgar com incompletude visível é legítimo — §7).

**Referência solta não existe** — coerência estrutural obrigatória: evidência
inexistente ⇒ recusa (FK) · evidência de **outro profissional** ⇒ recusa (FK
composta, padrão do vínculo 1.8-R1) · evidência de **conceito incompatível** com
o julgamento ⇒ recusa (validação estrutural, padrão `valida_conceito`) · versão
inexistente ⇒ recusa (a referência é à linha exata) · *"evidência de outro
Case"* não se aplica — `practice_evidence` é do profissional, não do Case; o
alvo do juízo é quem carrega o Case.

## 11. Append-only — história como fato

**Nenhum UPDATE, nenhum DELETE — imposto por trigger** (padrão
`practice_evidence`/atos do 1.12). Retificar é **gravar versão nova** com autor
e data próprios (I-7). Corrigir texto, mudar entendimento, incorporar fato novo:
**sempre versão nova, nunca edição — nem para vírgula** (§10). Transições de
estado (`VIGENTE`→`SUPERADO`/`RETIRADO`) são **fatos apendados/registrados pelo
mecanismo estrutural**, nunca reescrita do ato original.

## 12. Versões e vigência

| Regra | Cláusula |
|---|---|
| Cadeia | cada versão referencia a anterior; a primeira não referencia nada |
| **Vigente** | *"a versão mais recente em estado `VIGENTE`"* — e o **invariante de unicidade da ADR-067 §13** é estrutural: **no máximo UM `VIGENTE` por (Case, profissional, conceito)** — índice único parcial, padrão MR1.2 |
| Ordem | **pela cadeia e pelo número de versão, nunca pelo relógio** (padrão C-05: carimbo de tempo empata sob concorrência) |
| Pós-`RETIRADO` | novo ato abre **versão nova na mesma cadeia do alvo** — a história do alvo permanece uma só; a ausência entre o retiro e o novo ato fica legível |
| Pós-`SUPERADO` | revisão grava versão nova `VIGENTE` na mesma cadeia, referenciando os fatos novos (JS3) |

## 13. Idempotência — desfechos nomeados

| Cenário | Desfecho |
|---|---|
| Primeiro ato válido sobre o alvo | `JUIZO_REGISTRADO` |
| **Duplo clique / retry** — mesmo ator, mesma versão-base, mesmo conteúdo | **`VERSAO_JA_GRAVADA`** — sucesso idempotente, nada gravado (o árbitro é a cadeia: a versão-base já tem sucessora idêntica) |
| Mesmo ator, versão-base já sucedida, conteúdo **diferente** | **`CONFLITO_DE_VERSAO`** — recusa explícita; o ator relê o vigente e age de novo |
| **Outro ator** sobre versão-base já sucedida | `CONFLITO_DE_VERSAO` — mesma regra; autoria do primeiro prevalece (padrão da ressalva PA-12) |
| Ato sobre alvo cujo vigente está `RETIRADO`/`SUPERADO` | válido — abre versão nova (§12) |
| Natureza/conceito fora das listas | erro estrutural, nunca desfecho |

Nada disso fica para a implementação decidir.

## 14. Concorrência — árbitro declarativo

**O árbitro é o par de garantias estruturais**: o **índice único parcial** (um
`VIGENTE` por alvo) + a **unicidade de sucessão na cadeia** (uma sucessora por
versão-base). Dois atos simultâneos sobre o mesmo alvo: o primeiro INSERT vence;
o segundo cai no índice e é traduzido para `CONFLITO_DE_VERSAO`. Evidência
supersedida durante o ato: a verificação transacional das referências (FKs)
decide — nunca lock inventado.

## 15–16. Inércia, RLS e grants — o estado em que o 2.4 nasce

Padrão dos precedentes (2.1 · 2.2B · atos do 1.12), lavrado como cláusula:

**RLS ligada · ZERO policy · ZERO grant a papel de aplicação · ZERO writer
operacional · ZERO superfície · ZERO juízo real.** Os mecanismos estruturais
(CHECKs, FKs, índices, triggers de append-only e de unicidade) nascem juntos —
são a estrutura, não operação. Testes de integração usam fixtures em transação
com rollback (padrão 2.2C), sem resíduo.

## 17. Writer/capability — decisão: **somente a entidade**

O caminho de escrita do juízo **pertence ao 2.3** — é a etapa dividida da
AVALIAÇÃO que pratica o ato, e desenhá-lo aqui anteciparia superfície e fluxo
sem autoridade. O 2.4 entrega a **infraestrutura completa e inerte**; o 2.3
herdará as cláusulas deste contrato (autoria por sessão — §9; desfechos — §13)
ao lavrar seu próprio caminho.

## 18. Relação com o 2.3 — dependência material lavrada

> **`2.3 DEPENDE MATERIALMENTE DO 2.4`.** Os juízos H8–H11 produzidos pela etapa
> dividida têm `curator_judgments` como **destino lavrado** (ADR-067 §5/H8–H11).
> **O 2.3 não pode ser implementado completamente antes do 2.4** — a metade
> humana da etapa ficaria sem onde registrar o ato.

A célula do 2.3 no mapa passa a expressar a dependência (reconciliação neste
mesmo commit). O mérito do 2.3 não é alterado.

## 19. Relação com o 2.C

O encerramento do 2.4 entrega ao futuro 2.C: **a entidade de juízo disponível e
guardada** — nada mais. Nenhuma superfície, nenhum ato automático, nenhum grant.
**O 2.C permanece BLOQUEADO** (o gate real é o ato de abertura da Fronteira,
decisão própria); a **Fronteira permanece FECHADA**, grants do 1.12 zero,
O2-A/B pendentes.

## 20. Guardas

| # | Guarda | Cai se |
|---|---|---|
| **G-2.4-1** | natureza somente `TECNICO`\|`RELACIONAL` | terceira natureza nasce em CHECK, código ou dado |
| **G-2.4-2** | conceitos **exatamente os seis**, nos pares certos | sétimo conceito, ou par natureza×conceito trocado |
| **G-2.4-3** | **`AREA` inexistente** na entidade e nas listas | coluna/valor/conceito `AREA` aparece |
| **G-2.4-4** | append-only | UPDATE/DELETE deixa de ser recusado |
| **G-2.4-5** | evidência por **referência+versão**, nunca texto duplicado | nasce coluna de texto de evidência copiado |
| **G-2.4-6** | autoria real obrigatória | `actor_id` nullable, ou vindo de payload no futuro writer |
| **G-2.4-7** | **zero proposta automática de julgamento** | Motor/pipeline/regra escreve na entidade, ou `derivation_proposals` ganha alvo de juízo |
| **G-2.4-8** | inércia da estrutura | policy/grant/writer/superfície nasce antes do 2.3 autorizado |
| **G-2.4-9** | o 2.3 **não existe operacionalmente sem o destino** | código da etapa dividida grava juízo fora de `curator_judgments` |

## 21. Falseabilidade — mutações que devem cair

terceira natureza ⇒ G-2.4-1 · sétimo conceito ⇒ G-2.4-2 · `AREA` ⇒ G-2.4-3 ·
UPDATE de juízo ⇒ G-2.4-4 · DELETE ⇒ G-2.4-4 · texto de evidência copiado ⇒
G-2.4-5 · `actor_id` do payload ⇒ G-2.4-6 · Motor escrevendo judgment ⇒ G-2.4-7 ·
grant/policy prematuros ⇒ G-2.4-8 · dois `VIGENTE` no mesmo alvo ⇒ unicidade
(§12) · sucessão dupla da mesma versão-base ⇒ cadeia (§13) · 2.3 gravando fora ⇒
G-2.4-9.

## 22. Rollback

Tudo aditivo: `drop` da entidade + triggers + índices; nenhuma tabela existente
alterada; **nenhum fato real existe enquanto inerte** (zero grants, zero writer)
— nada humano a preservar; reaplicação idempotente (padrão `if not exists` /
`create or replace`).

## 23. Critérios de aceite

| # | Aceite |
|---|---|
| **A1** | tabela existe **sem `AREA`** |
| **A2** | somente **duas naturezas** (estrutural) |
| **A3** | somente **seis conceitos**, nos pares certos (estrutural) |
| **A4** | **três estados** da ADR-067 §13, nominais (estrutural) |
| **A5** | **append-only** imposto e provado |
| **A6** | **autoria obrigatória** (not null + FK) |
| **A7** | **evidência referenciada** com versão; referência solta recusada |
| **A8** | **zero proposta automática** — G-2.4-7 verde |
| **A9** | **inércia comprovada** — RLS/policies/grants no padrão 2.1, oráculo de catálogo |
| **A10** | **o mapa expressa `2.3 → 2.4`** |
| A11 | unicidade de um `VIGENTE` por alvo, provada sob concorrência |
| A12 | regressão integral verde; rollback limpo |

## 24. Encaminhamento

Ao **Guardião da CURADORIA 2.0**, para aprovação. Após aprovada: implementação
por missão própria (Engenheiro), verificação, encerramento — e o 2.3 torna-se o
próximo elegível, herdando as cláusulas §9/§13.
