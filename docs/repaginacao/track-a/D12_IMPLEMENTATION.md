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

**Não executadas nesta passagem:** M2 (paciente preenche `case_id`), M3
(autorizar só por role), M4 (DELETE amplo) e M5 (storage sem caseId). Cada uma
exige `db reset` + recriação de fixtures. **R2, R3, R11, S6 e S2 já cobrem os
comportamentos correspondentes**, mas as mutações em si ficam pendentes — e
ficam registradas como tal, não como feitas.

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
