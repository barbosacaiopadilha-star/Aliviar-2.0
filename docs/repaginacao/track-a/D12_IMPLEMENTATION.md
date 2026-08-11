# D-12.1R · Central de Documentos — case_id, RLS e storage

**Base:** `a77961c` · **Migration:** `20260811090000_d12_central_documentos_case_id.sql`
**Escopo:** só o piso de segurança. Writer, projeção e Central visual são D-12.2/A6.

---

## 1 · Por que a coluna existe

A RLS avalia **a linha**. Sem `case_id` nela, nenhuma policy conseguia exprimir
*"este Case pertence a esta paciente E este Curador responde por este Case"* —
o máximo alcançável era *"existe algum Case dela atribuído ao ator"*, modelo
rejeitado porque, com duas Curadorias simultâneas, deixa o Curador de um Case
depositar no contexto do outro.

`case_id` **não** torna a Central por Case: a leitura segue patient-level.

## 2 · O que a migration contém

| item | decisão |
|---|---|
| `case_id uuid null` | FK `on delete set null` — **nunca cascade**: o documento é da paciente e sobrevive ao Case. Precedente do projeto (4 vínculos). |
| índice `patient_documents_case_id_idx` | consultado por toda policy de staff, tabela e storage |
| `curadoria.pode_depositar_no_caso(case_id, profile_id)` | as três condições **conjuntas**: Case é este, paciente é esta, ator é o curador atribuído |
| backfill | **zero** — todo documento existente é da própria paciente, e para ele `case_id` é null por definição |

Nenhuma tabela, bucket, enum, trigger ou UPDATE de dados. Varredura no arquivo:
`create table` / `storage.buckets` / `create type` / `insert into` → **0**.

## 3 · Policies

**INSERT paciente** — narrowed: `profile_id = auth.uid() and uploaded_by =
auth.uid() and case_id is null`. Ela não escolhe autoria nem associa o próprio
arquivo a uma Curadoria.

**INSERT Aliviar** — `uploaded_by = auth.uid() and profile_id <> auth.uid() and
case_id is not null and pode_depositar_no_caso(...)`.

**SELECT Curador (novo)** — a policy que ele já tinha passa pelo **anexo da
história**, e um documento recém-depositado não tem anexo. Sem esta, o depósito
gravava e o próprio depositante não o lia de volta: `insert().select()` falhava
com violação de RLS e **a gravação parecia recusada quando não era**. Simétrica
ao INSERT, pelo mesmo helper.

**DELETE** — *substituída*, não acrescentada. RLS permissiva é OR: uma policy
restritiva ao lado da antiga não restringiria nada. A antiga permitia
`profile_id = auth.uid()`, ou seja, a paciente apagando o que a Aliviar
depositou. Agora exige `profile_id = auth.uid() **and** uploaded_by = auth.uid()`.

**UPDATE** — nenhuma policy criada. Sem policy permissiva a RLS nega; a
ausência é a regra, e R12 a vigia.

## 4 · Storage

Convenção do recebido: `<patient_profile_id>/received/<case_id>/<arquivo>`
— dona na primeira dimensão, namespace na segunda, Case na terceira. **Nenhum
path existente foi migrado.**

A policy anterior era `for all` sobre a pasta da dona — o que deixava a
paciente **apagar fisicamente** um objeto recebido mesmo com a linha protegida.
Substituída por policies **por operação**, com `received/` excluído do INSERT e
do DELETE dela. O Curador grava pelo mesmo helper da tabela: um só lugar decide.

## 5 · Provas — banco local, 20/20

Fixtures sintéticas: paciente A com **dois Casos** (C1→Curador 1, C2→Curador 2)
e paciente B. Executadas contra o banco **reconstruído do zero** (`db reset`).

| | |
|---|---|
| R1–R3 | paciente insere próprio com `case_id` null; **negada** ao informar `case_id`; **negada** ao forjar `uploaded_by` |
| R4–R6, R5b | Curador 1 via C1 ✓ · via C2 ✗ · Case de outra paciente ✗ · Curador 2 via C2 ✓ |
| R7–R9 | recebido tem autoria e Case; paciente A lê; paciente B não |
| R10–R12 | apaga o próprio · **não** apaga o recebido · nenhum UPDATE |
| S1–S3 | grava em `A/received/C1/` ✓ · em `C2/` ✗ · na pasta de outra paciente ✗ |
| S4–S7 | A lê · B não lê · **não** apaga o recebido · apaga o próprio |

**O cenário de dois Casos é o coração:** R5 e R5b provam que a existência de
duas Curadorias não transforma a autorização em "qualquer Case serve".

## 6 · Prova de perda

**M1 — o helper volta a autorizar por "algum Case da paciente":** derruba
**7 provas**, entre elas R5, R5b e S2. É a demonstração material de que o
modelo rejeitado pelo §2 seria detectado.

### D-12.1F · a falseabilidade, agora automatizada

A D-12.1 foi **reprovada** com razão: as garantias existiam no banco e **nada
no repositório as defendia**. Um script descartável não é cobertura.

`tests/integration/d12-central-documentos-rls.integration.test.ts` — **27
testes**, matriz de fixtures obrigatória: pacientes A e B, curadores 1/2/3,
Case A1→C1, A2→C2, B1→C3. As duas Curadorias simultâneas de A são o que
distingue "este Case" de "algum Case".

**As seis mutações, uma por vez, com `db reset` + `bootstrap` entre elas:**

| mutação | testes derrubados |
|---|---|
| M1 · helper aceita "algum Case da paciente" | **4** |
| M2 · paciente pode inserir `case_id` | **1** |
| M3 · staff autorizado só por role | **7** |
| M4 · DELETE amplo restaurado | **1** |
| M5 · storage sem caseId específico | **1** |
| M6 · SELECT do Curador por "algum Case" | **2** |

Migration inalterada em todo o ciclo — SHA `84f3bd19…` idêntico antes e depois.
Nenhuma migration temporária sobreviveu. Baseline verde nas duas pontas.

**Duas escolhas de método que valem registro:**

- **DELETE é medido por linhas removidas**, nunca por ausência de exceção: a
  RLS não levanta erro no DELETE, ela simplesmente não encontra a linha. Um
  teste que só checasse `error === null` passaria com a policy aberta.
- **O storage também não devolve erro no `remove` sem permissão.** A prova é a
  leitura depois: o objeto recebido continua baixável.

**S-2 registrado, não corrigido:** o Curador depositante não tem hoje SELECT de
storage sobre o objeto que acabou de gravar. A suíte **não inventa** essa
capacidade — ela será decidida na D-12.2, se o writer precisar reler o objeto.

## 7 · Rollback

```sql
drop policy if exists "curadoria_patient_documents_storage_insert_curador" on storage.objects;
drop policy if exists "curadoria_patient_documents_storage_delete_proprio" on storage.objects;
drop policy if exists "curadoria_patient_documents_storage_insert_dona" on storage.objects;
drop policy if exists "curadoria_patient_documents_storage_select_dona" on storage.objects;
create policy "curadoria_patient_documents_storage_own_or_admin" on storage.objects for all to authenticated
  using (bucket_id = 'patient-documents' and (curadoria.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text))
  with check (bucket_id = 'patient-documents' and (curadoria.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text));

drop policy if exists "patient_documents_delete_proprio_upload" on curadoria.patient_documents;
create policy "patient_documents_delete_own_or_admin" on curadoria.patient_documents for delete to authenticated
  using (profile_id = auth.uid() or curadoria.has_role('administrador'));

drop policy if exists "patient_documents_select_curador_do_caso" on curadoria.patient_documents;
drop policy if exists "patient_documents_insert_curador_do_caso" on curadoria.patient_documents;
drop policy if exists "patient_documents_insert_own" on curadoria.patient_documents;
create policy "patient_documents_insert_own" on curadoria.patient_documents for insert to authenticated
  with check (profile_id = auth.uid() and uploaded_by = auth.uid());

drop function if exists curadoria.pode_depositar_no_caso(uuid, uuid);
drop index if exists curadoria.patient_documents_case_id_idx;
alter table curadoria.patient_documents drop column if exists case_id;
```

**Não executado.** Devolve exatamente o estado anterior.

## 8 · Zero produção

Tudo em Supabase **local** (`127.0.0.1:54321`), confirmado antes de cada passo.
Contas sintéticas `d12-*@example.test`.
---

# D-12.2 · O writer da Aliviar — depósito, allowlist e trilha

**Base:** `caecbb7` · **Migration:** `20260811100000_d12_2_deposito_da_aliviar_auditado.sql`
**Escopo desta fatia:** o writer e o que ele precisa para existir com segurança.
A projeção `DocumentCenterItem` e a Central visual **não** entram aqui — ver §15.

## 9 · A origem da allowlist — e o ponto em que esta fatia divergiu

**A allowlist não nasceu aqui.** A **ADR-054 — Política de documentos
clínicos** (2026-08-02, aprovada pelo responsável, Bloco A/decisão D-08) já
fixava *"MIME allowlist (PDF, JPG, PNG, WEBP) e teto de **20 MB**"*. A
auditoria de origem foi feita depois da implementação, e o resultado corrige a
atribuição que este documento fazia:

| valor | classe | origem |
|---|---|---|
| teto de **20 MB** | **A** · já decidido | ADR-054 §1 |
| **PDF · JPEG · PNG · WebP** | **A** · já decidido | ADR-054 §1 |
| **HEIC/HEIF** | **B** · desta implementação | **não consta na ADR-054** |
| `content_type` vazio recusado | **B** · desta implementação | não consta |
| conferência dos bytes | **B** · desta implementação | não consta |

> ### D-12-FILE-POLICY — DECISÃO PENDENTE
>
> **HEIC/HEIF é ampliação da allowlist da ADR-054, feita por engenharia.** A
> própria ADR define o gatilho e o rito: *"Revisitar quando: o primeiro tipo
> de arquivo legítimo fora da allowlist aparecer na operação real"* — ampliar
> é ato de revisitar a ADR, não de um engenheiro. O motivo técnico continua
> real (HEIC é o padrão do iPhone, e sem ele a foto do exame é recusada), mas
> **motivo não é autoridade**.
>
> O comportamento implementado **fica preservado** — desmontá-lo agora
> derrubaria a fatia provada sem que ninguém tenha decidido nada. Fica
> **explicitamente não congelado** até a ADR-054 ser revisitada, que é quem
> pode confirmar, reduzir ou ampliar.
>
> **A conferência de bytes permanece em qualquer cenário:** ela não altera
> *quais* tipos entram, apenas impede que a etiqueta minta sobre o conteúdo.

**Gap contra a ADR-054, não contra esta missão:** a ADR manda aplicar a regra
em **três camadas** — bucket, action e config do framework. Esta fatia
implementou **só a action**. Os buckets seguem com `file_size_limit` e
`allowed_mime_types` **nulos** (achado F1 da AUDITORIA_03_BANCO) e o teto real
do framework continua o acidental. **Registrado, não resolvido:** fechar as
outras duas camadas é trabalho do Bloco H, e mexer em bucket seria capacidade
de banco nova, fora da autorização desta passagem.

**O alcance (decidido nesta passagem):** a regra vale para os **dois** writers
— o dela e o da Aliviar.

**Auditoria (não era decisão).** A passagem anterior apresentou como dilema
"aceitar depósito sem trilha ou autorizar `alter type … add value`", por ter
lido o enum na migration de origem. `curadoria.audit_action` tem **24 valores**
e foi estendido aditivamente **15 vezes**, com dois irmãos na própria família
de documentos — `patient_document_orphaned` (20260802153000) e
`patient_document_deleted` (20260802162000). O §M do doc 25 já mandava reusar
o mecanismo. Seguir a convenção era o caminho barato; **não** segui-la é que
seria o desvio.

## 10 · A allowlist é garantia, não etiqueta

`src/modules/profiles/document-file-policy.ts` — **fonte única**, lida pelos
dois writers e pelo `accept` da UI. Duas listas divergiriam na primeira vez
que alguém acrescentasse um tipo de um lado só.

`file.type` é **declarado pelo cliente**. Uma allowlist que só o lesse seria
rótulo: um executável anunciado como `application/pdf` passaria, e o valor
mentido ainda seria gravado em `content_type` e viraria o `Content-Type` do
download. O validador confere a **assinatura real** do arquivo e devolve o
tipo verificado — é ele que os writers gravam, nunca `file.type`.

O nome do arquivo deixou de poder mexer no caminho. `foldername()[1..3]` é
como as policies leem dona, namespace e Case; um nome com barra deslocaria
essas posições. Falharia fechado, mas depender disso é depender de acidente.

**Três pontos de entrada, não dois.** Além do upload da Central e do depósito
novo, o **anexo à Sua História** (`story/attachment-actions`) também é upload
dela. Os três validam pela mesma fonte.

## 11 · O writer

Entrada da action: **`caseId` e o arquivo, mais nada.** `patient_profile_id`
é derivado do Case no servidor — aceitá-lo do formulário criaria duas fontes
para o mesmo fato, e a divergência entre elas seria uma porta. A derivação
**não é a autorização**: quem autoriza continua sendo a policy da D-12.1, e a
recusa final é sempre do banco.

Caminho: `<dona>/received/<Case>/<arquivo>`. Autoria real (`uploaded_by` = o
Curador), de onde a Central deriva "recebido da Aliviar" sem coluna nenhuma.

## 12 · A trilha é do banco, não do writer

`patient_document_provided` gravado por **trigger** — mesma forma do DELETE
(`log_patient_document_deleted_trigger`). Auditoria que depende de o código
lembrar de chamá-la é auditoria que um caminho novo esquece; aqui **nenhum
writer, atual ou futuro, aplicação ou console**, deposita sem deixar rastro.

Guarda de autoria: só `uploaded_by <> profile_id`. O upload da própria
paciente não entra — não é ato de terceiro sobre ela, e auditar tudo faria de
`audit_logs` uma cópia da tabela. Metadata guarda **hash** do caminho, nunca o
caminho em claro (precedente do tombstone de DELETE).

## 13 · Duas lacunas que só apareceram com o writer existindo

**A compensação não tinha porta.** A D-12.1 tirou o DELETE do Curador tanto da
linha quanto do objeto. Nenhuma ordem de escrita se autocompensava: falhando o
INSERT depois do upload, o arquivo ficava órfão na pasta da paciente —
invisível na Central e sem ninguém que pudesse removê-lo. Conceder DELETE
resolveria e criaria **revogação**, que o §N recusa. A policy concede
exatamente a compensação pela cláusula que a define: **só apaga objeto SEM
linha**. Documento entregue tem linha, e segue intocável pelo depositante.

**S-2 fechado por experimento, não por argumento.** A D-12.1F registrou a
dúvida sobre o Curador não ter SELECT de storage. A resposta veio de um teste
que **falhou**: `remove()` busca o objeto sob a RLS de quem chama antes de
apagar, então sem SELECT o depositante nunca alcança o DELETE — e a
compensação não acontecia, **em silêncio**, porque `remove` também não levanta
erro sem permissão. Concedeu-se a visibilidade mínima para o writer desfazer o
próprio ato, com o **mesmo recorte do INSERT**: só `received/`, só o Case dele.
Os uploads particulares dela ficam fora, e um teste fixa esse limite.

## 14 · Provas — 80 testes, e seis mutações

**23 unitários** (`tests/unit/document-file-policy.test.ts`) e **15 de
integração** (`tests/integration/d12-2-deposito-da-aliviar.integration.test.ts`),
com a mesma matriz de dois Casos simultâneos da D-12.1F. Baseline conjunta:
**57 de integração + 23 unitários, todos verdes**, incluindo os 27 do piso da
D-12.1 intactos.

Método herdado e mantido: **recusa é medida lendo depois**, nunca por
`error !== null` — nem DELETE nem `remove` levantam erro sem permissão.

| mutação | testes derrubados |
|---|---|
| M1 · a lista de tipos deixa de filtrar | **5** |
| M2 · a conferência de bytes é removida | **3** |
| M3 · o teto de 20 MB some | **1** |
| M4 · a compensação perde "objeto sem linha" (vira revogação) | **1** |
| M5 · o SELECT do Curador perde o recorte `received/` | **1** |
| M6 · o trigger perde a guarda de autoria | **1** |

Banco reconstruído **do zero pelas migrations** ao fim do ciclo (`db reset` +
`bootstrap`), confirmando que a migration se basta — as policies haviam sido
aplicadas à mão durante o desenvolvimento. Ledger **119/119**.

## 15 · O que esta fatia NÃO fez

- **Projeção `DocumentCenterItem` e a Central visual** (§L do doc 25): as três
  seções, classe A/B, o portão `deliveredAt` e Sua História como terceira área.
  Nada foi começado — não há meia implementação no repositório.
- **UI do Curador para depositar.** A action existe e está testada; nenhuma
  tela a chama ainda.
- **GAP-D12-C1 · Concierge** — confirmado por código: `resolveCurrentResponsible`
  resolve o Concierge por **string de nome** (`conciergeName ?? attendantName ??
  "Equipe Aliviar"`), sem id e sem assignment. Não há como provar vínculo com o
  Case. Coincide com o §E (Concierge ❌ não agora): **não-escopo confirmado**.
- **GAP-D12-2** (ela pode apagar o que recebeu?) segue com DT-01. Hoje **não
  pode** — a D-12.1 já fechou, e um teste vigia.

## 16 · Risco assumido, explicitamente

A allowlist passou a valer para os uploads **dela**, por decisão do DT-01.
**Um arquivo que ela conseguia enviar ontem pode ser recusado hoje** — tipo
fora da lista, acima de 20 MB, ou sem `content_type`. A troca aceita foi: uma
recusa que diz o motivo, em vez de um arquivo que entra e quebra adiante.
Documentos **já enviados não são tocados** — a regra vale só na escrita nova.


## 17 · Rollback da D-12.2

```sql
drop policy if exists "curadoria_patient_documents_storage_compensacao_curador" on storage.objects;
drop policy if exists "curadoria_patient_documents_storage_select_curador_do_caso" on storage.objects;
drop trigger if exists log_patient_document_provided_trigger on curadoria.patient_documents;
drop function if exists curadoria.log_patient_document_provided();
```

**Não executado.** O valor `patient_document_provided` do enum **não** é
removível sem recriar o tipo; fica inofensivo sem uso, como resíduo aceito —
mesmo precedente de `case_discarded`, `curadoria_delivered` e
`patient_document_orphaned`. Linhas já gravadas permanecem: auditoria é
história real.

O piso da D-12.1 **não é tocado** por este rollback. O código volta pelo Git;
sem as policies, o writer da Aliviar simplesmente deixa de conseguir depositar
— e a Central volta a ter só o que ela mesma enviou.

## 18 · Zero produção

Tudo em Supabase **local** (`127.0.0.1:54321`). A suíte de integração não lê
`.env.local` — que neste repositório aponta deliberadamente para o projeto
hospedado — e `assertSupabaseLocal` aborta antes da primeira chamada de rede.
Contas sintéticas `d122-*@example.test`, removidas no `afterAll` junto com os
objetos criados no bucket.

---

# D-12.2B · A Central como projeção

**Base:** `85fa8de` · **Migration: nenhuma.** A Central não é domínio novo: é
uma leitura de três fontes que já existem, na forma que a paciente entende.
`src/modules/paciente/central-de-documentos.ts` — função pura, sem I/O.

## 19 · Três decisões que o arquivo carrega

**A origem não é declarada, é derivada.** `uploaded_by = profile_id` é dela;
diferente é da Aliviar. Não existe campo por onde o cliente peça categoria —
**ele não envia categoria nenhuma**. E mesmo forjando a linha ele não
conseguiria: a policy da D-12.1 impede a paciente de gravar
`uploaded_by <> auth.uid()`. A garantia é do banco; a projeção só a lê.

**O portão da Curadoria é `deliveredAt`, e só ele.** `emittedAt` é a Aliviar
ter terminado por dentro; `presentedAt` é o encontro ter acontecido. Nenhum
dos dois é ela ter acesso. Os dois entram na ENTRADA da projeção **de
propósito, para serem ignorados** — é isso que permite provar por mutação que
o portão não os usa. Segunda condição: conteúdo real. Carimbo de entrega sobre
Relatório sem nenhuma opção é carimbo apontando para o vazio.

**Artefato não é arquivo.** A Curadoria não vira linha falsa em
`patient_documents`, e "Levar em PDF" não é download: é
`/paciente/curadoria/imprimir`, tela que **já existe** e já é guardada por
papel. A distinção mora no TIPO — `FILE_DOWNLOAD` · `PRINTABLE_VIEW` · `NONE`
— para que nenhuma tela possa confundir as duas coisas por descuido.

## 20 · O que atravessa, e o que não

Sai: id, categoria, classe, título, data, ação primária, capacidade de
download e uma referência opaca. **Não sai** caminho, autoria, Case nem
bucket — e a garantia é mais forte que um filtro: `file_path` e `case_id`
**não estão sequer na entrada** da projeção. Ela não pode vazar o que nunca
recebe.

Para arquivo, a referência é o **id da linha**, não o caminho: é ele que um
handler autorizado troca por URL assinada de curta validade, no clique.
Nenhuma URL é materializada aqui.

O descarte por `profileId` dentro da projeção é **segunda tranca**, não a
primeira — a RLS continua sendo a autoridade. Filtro de segurança não pode
viver só do lado do cliente.

## 21 · Sua História, e o que ainda não existe

Rascunho → **Continuar** (`/sua-historia/continuar`). Enviada → **Rever**
(`/sua-historia/revisao`). Rotas verificadas em `src/app`: a projeção não
inventa endereço, porque href que não existe é 404 na mão da paciente.

**Sua História nunca é chamada de questionário** — e o teste varre a projeção
inteira serializada, não só o título.

**GAP-A6-Q1 segue aberto e por isso não há imprimível dela.** Os textos das
perguntas vivem espalhados nas sete páginas do wizard, sem fonte única;
gerar um PDF hoje exigiria duplicá-los, e duas fontes divergem na primeira
pergunta que mudar. A projeção diz isso explicitamente
(`NO_SAFE_PRINTABLE_REPRESENTATION`) em vez de simplesmente omitir o botão.

**§11 respeitado:** não existindo outro formulário real, a categoria contém
só Sua História. Nenhum item fictício foi criado para preencher a seção.

## 22 · Provas — 23 testes e cinco mutações

`tests/unit/central-de-documentos.test.ts`, cobrindo P1–P12.

| mutação | testes derrubados |
|---|---|
| M-P1 · o portão vira `emittedAt` | **5** |
| M-P2 · o portão vira `presentedAt` | **4** |
| M-P3 · a origem passa a vir do input do cliente | **2** |
| M-P4 · o artefato ganha download de arquivo | **2** |
| M-P5 · a projeção vaza metadata interna | **2** |

**Compatibilidade com os registros reais, verificada pelo compilador:** um
`CuradoriaRecord` e um `PatientStory` reais satisfazem as entradas. E ficou
registrado que **`PatientDocument` não tem `profileId`** e **tem `filePath`** —
quem adaptar precisa informar a dona e deixar o caminho de fora. Isso é
informação que o A6 precisa antes de escrever a tela, não depois.

## 23 · O que esta fatia NÃO fez

- **A tela.** `/paciente/documentos` não foi redesenhada, nenhum card, nenhum
  layout. Nenhum loader especulativo foi criado: a projeção é exportada,
  tipada e provada, e o A6 a consome quando existir.
- **O handler de download assinado.** A projeção declara a capacidade; quem a
  emite ainda não existe.
- **Zero migration.** Nada nesta fatia pediu banco novo — como previsto.

## 24 · Regressão da D-12.2 completa

| verificação | resultado |
|---|---|
| suíte de integração **completa** (73 arquivos) | **926 passaram**, 3 skipped, **0 falhas** |
| suíte unitária completa | 2 693 passaram · **1 falha pré-existente** |
| typecheck | limpo |
| lint | limpo (3 warnings pré-existentes, em arquivos não tocados) |
| build local | íntegro — `85fa8de-mso5eg8c`, backend único e local (394 arquivos inspecionados) |
| ledger | **119/119** |

A falha unitária é `mecanismo-de-discordancia.test.ts`, sobre
`curadoria.decidir_proposta`. **Provada pré-existente:** falha idêntica na base
`caecbb7`, e nem o teste nem a migration que ele lê foram tocados por esta
missão (`git diff caecbb7 HEAD` sobre os dois arquivos: vazio).

---

# D-12.3 · ADR-054 cumprida nas três camadas

**Base:** `f680a0c` · **Migration:** `20260811110000_adr054_terceira_camada_no_bucket.sql`
**Objeto:** alinhar a implementação à ADR-054 vigente e fechar V-1 e V-2.

## 25 · HEIC removido

A ADR-054 lista **PDF, JPG, PNG, WEBP**. HEIC/HEIF entrou na D-12.2 como
ampliação de engenharia e **saiu**: a lista agora é exatamente a do contrato.
Nada nesta versão o aceita — nem a validação, nem o bucket, nem o `accept` do
seletor —, e a mensagem de recusa deixou de oferecê-lo.

> **HEIC/HEIF requer revisão futura da ADR-054.**

O endurecimento técnico **permaneceu**, porque não amplia a allowlist: a
conferência da assinatura real dos bytes, a recusa de MIME falso e a recusa de
`content_type` vazio. Eles decidem se o arquivo *é* o que diz ser, não *quais
tipos* entram.

## 26 · V-1 encerrado — eram DUAS guilhotinas, não uma

O Verificador apontou `serverActions.bodySizeLimit` (default **1 MB**).
Corrigido, um arquivo de 19,5 MB **continuava falhando**, e com erro que não se
parecia com tamanho: *"Unexpected end of form"*. O log do servidor do e2e disse
o que era:

```
Request body exceeded 10MB for /paciente/documentos.
Only the first 10MB will be available unless configured.
```

`middlewareClientMaxBodySize` tem default de **10 MB** e vale porque este
projeto **tem middleware**. O corpo chegava truncado à action. Os dois limites
foram levados a 22 MB — acima dos 20 MB de propósito, para que quem recuse
"20 MB + 1 byte" seja a nossa regra, com a frase que explica, e não um corte
mudo.

**Prova material, não unitária** (`tests/e2e/adr054-limite-de-upload.spec.ts`):
servidor real, login real, formulário real.

| prova | resultado |
|---|---|
| **T-ADR054-9** · ~2 MB atravessa a Server Action | ✅ |
| ~19,5 MB — perto do teto, abaixo dele | ✅ aceito |
| 20 MB + 512 KB | ✅ recusado **pela nossa regra**, com o motivo |
| `accept` do seletor | exatamente os quatro tipos da ADR |

## 27 · A terceira camada — o bucket

O bypass que o Verificador demonstrou está fechado: `patient-documents` passou
a ter `file_size_limit` 20 MB e `allowed_mime_types` com os quatro tipos.
Nenhuma policy expressa **o que** está sendo escrito — tamanho e tipo não são
colunas que a RLS avalie —, e é por isso que a ADR pede a camada separada.

`professional-documents` **não foi tocado** (§6): a ADR-054 chama-se "Política
de documentos clínicos" e seus itens 2–4 tratam da equipe do Case, da paciente
e de documento anexado a Case — ela não o nomeia. Um teste fixa esse escopo, e
o achado FUN-02 sobre a action do profissional **segue aberto**.

## 28 · V-2 encerrado e a autoria falseável

**T-V2:** o Curador do Case A1 **não lê os bytes** de `A/received/A2/`, mesmo
sendo curador da mesma paciente. É onde "este Case" se distingue de "algum
Case" — e nada guardava isso no storage.

**T-AUTH:** o Verificador observou que fazer o autor vir do formulário não
derrubava nada — o banco recusava, e **a aplicação era omissa**. Agora
`exigirAutoriaDaSessao` recusa antes de qualquer byte subir, nos dois writers.
Isto **não reproduz a RLS**, que continua sendo o piso; impede a regressão
óbvia, e é falseável.

## 29 · Provas de perda

| mutação | testes derrubados |
|---|---|
| M1 · bucket sem MIME allowlist | **3** |
| M2 · bucket sem teto de tamanho | **2** |
| M3 · framework volta aos defaults | **3** (as três provas de upload do e2e) |
| M4 · storage SELECT por "algum Case" | **1** (T-V2) |
| M5 · autoria vem do parâmetro, não da sessão | **2** (T-AUTH) |

Todas restauradas; baselines verdes depois de cada uma.

> **Nota de método:** a primeira tentativa da M5 **não aplicou** — o arquivo é
> rastreado pelo Git e está em CRLF, e o padrão casava só `\n`. Ela "passou"
> como zero falhas, o que teria sido lido como guarda não-falseável. Mutação
> que não aplica é pior que mutação que falha: **conferir que a mutação entrou
> passou a ser parte do rito.**

## 30 · Regressão

| verificação | resultado |
|---|---|
| integração completa (74 arquivos) | **937 passaram**, 3 skipped, **0 falhas** |
| unitários completos | 2 672 passaram · **1 falha pré-existente** |
| e2e — provas da ADR-054 | **6/6** |
| e2e — suíte completa | ver ressalva abaixo |
| typecheck · lint | limpos |
| build local | íntegro, backend único e local |
| ledger | **120/120** |

**Ressalva honesta sobre o e2e completo.** A suíte roda 4 workers contra a
mesma stack local e é **instável nesta máquina**: em três execuções seguidas o
conjunto de falhas mudou toda vez (`admin-patients`, `connection-choice`,
`sua-historia`, `admin-dashboard`, `sua-historia-access`, `admin-professionals`),
e **todas passam quando executadas isoladamente** — `admin-professionals` foi
rodado duas vezes seguidas, verde. Nenhuma delas é de documentos; as de
documentos passam.

**Uma falha é real, persistente e PRÉ-EXISTENTE:**
`reconstrucao-fluxo-completo.spec.ts:244` procura o rótulo
`'Revisei o que já se sabe sobre o paciente'`, que **não existe mais em
`src/`** — foi removido em **2026-08-04** pelo commit `9f6ee86`
(*"checkboxes derivados"*), ancestral da base desta missão. É oráculo obsoleto
do redesenho do Acolhimento, não regressão. Estava mascarado antes porque o
passo 4 do mesmo spec serial subia `.txt`, que a nova camada do bucket recusa —
corrigido para PDF nesta missão, o passo 6 passou a ser alcançado e a
obsolescência apareceu. **Não corrigido aqui: é escopo do dono do D-9/D-11.**

## 31 · Fixtures atualizados

`text/plain` deixou de existir como upload possível em qualquer camada. Os
fixtures que o usavam passaram a PDF — não por conveniência de teste, mas
porque o contrato mudou: `sample-document.pdf`, o anexo do
`reconstrucao-fluxo-completo`, e os dois fixtures de integração.

## 32 · Rollback da D-12.3

```sql
update storage.buckets
   set file_size_limit = null, allowed_mime_types = null
 where id = 'patient-documents';
```

O resto volta pelo Git. Sem as três camadas, a ADR-054 volta a ser promessa.
