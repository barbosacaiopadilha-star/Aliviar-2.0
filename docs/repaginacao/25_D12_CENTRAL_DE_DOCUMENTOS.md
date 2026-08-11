# 25 · D-12 — Central de Documentos da paciente

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-10 |
| **Base** | `c300c2d` · árvore limpa exceto dois `??` **pré-existentes** |
| **Natureza** | arquitetura de domínio. **Zero código, zero migration aplicada** |
| **Veredito** | ✅ **D-12 APTO PARA IMPLEMENTAÇÃO** |

---

## A · O contrato real de `patient_documents`

```
profile_id    uuid not null → profiles(id)      a paciente
file_path     text not null UNIQUE
file_name     text not null                     (não pode ser vazio)
content_type  text
file_size     bigint
uploaded_by   uuid not null → profiles(id)
created_at    timestamptz
```

**Grants:** `select, insert, delete` para `authenticated`. **Sem `UPDATE`.**

**RLS vigente:**

| Op | Policy |
|---|---|
| SELECT | `profile_id = auth.uid() or has_role('administrador')` |
| **INSERT** | **`profile_id = auth.uid() AND uploaded_by = auth.uid()`** |
| DELETE | `profile_id = auth.uid() or has_role('administrador')` |

**Storage:** bucket **`patient-documents`**, privado, com policy
`for all to authenticated using (bucket_id = 'patient-documents' and (has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text))`.

> **Não há `case_id`.** O documento vincula-se à **pessoa**, não à Curadoria.

## B · O que `uploaded_by` significa hoje — e por que isso importa

`uploaded_by` é FK para `profiles`, e `profiles.id` **é** `auth.users.id` (o
trigger de signup grava `profiles(id) = new.id`).

> ### Hoje `uploaded_by` carrega **zero** informação distintiva.
>
> A policy de INSERT exige **`uploaded_by = auth.uid()` E `profile_id =
> auth.uid()`** — ou seja, **`uploaded_by` é sempre igual a `profile_id`, por
> construção**. Não é convenção de código: é imposição do banco.

**A confirmação da A6 ("todos os writers usam `authState.user.id`") é
consequência, não causa.** Ainda que um writer tentasse outra coisa, **a policy
recusaria**.

### Os três bloqueios estruturais

| # | Bloqueio | Efeito |
|---|---|---|
| **1** | INSERT exige `profile_id = auth.uid()` | **um Curador não consegue inserir** para a paciente |
| **2** | INSERT exige `uploaded_by = auth.uid()` | mesmo se o 1 caísse, ele teria de se declarar a paciente |
| **3** | storage chaveia a pasta por **`auth.uid()` do uploader** | arquivo do Curador cairia **na pasta dele**, e **ela não conseguiria ler** |

**São três, independentes. É por isso que "a Aliviar não disponibiliza
documentos" — não por falta de writer, mas por desenho do banco.**

## C · Reutilizar a tabela? — **SIM**

**O que impede não é a semântica da tabela; é a policy.**

A tabela modela *"um documento **da** paciente"* — `profile_id` é a dona,
`uploaded_by` é quem depositou. **Nada na estrutura diz "enviado por ela".**
Essa afirmação está **só** na policy de INSERT.

**Criar entidade separada (Opção B) seria pior:** duplicaria file_path, storage,
RLS e leitura, e criaria **duas Centrais** — exatamente o que o §2 pede para
evitar.

### E a origem se deriva com segurança, sem coluna nova

> **`uploaded_by <> profile_id` ⇒ recebido da Aliviar.**
> **`uploaded_by = profile_id` ⇒ enviado por ela.**

**Não é heurística de papel — é fato estrutural**, desde que a policy da
paciente continue exigindo `uploaded_by = auth.uid()`. Ela **não consegue**
forjar um documento "da Aliviar", porque para isso precisaria gravar
`uploaded_by <> auth.uid()`, e a policy dela recusa. **T-D12-3 fica satisfeito
pelo banco, não pela UI.**

**Nenhuma coluna `source`.**

## D · Reutilizar o bucket? — **SIM, com mudança de convenção de path**

**A convenção passa a ser `<patient_profile_id>/…`** — a pasta é **da dona**,
não do uploader.

| Consequência | |
|---|---|
| para os uploads dela | **nada muda** — o uid dela **é** o profile id dela |
| para os arquivos já existentes | **já satisfazem** a nova regra, porque ela sempre foi a uploader |
| para o Curador | precisa de **policy própria** para escrever em pasta alheia, **restrita** aos Casos dele |
| leitura pela paciente | **a policy atual já funciona** — a pasta é a dela |

> **A retrocompatibilidade é acidental e feliz:** como o bloqueio 3 impedia
> qualquer outro uploader, **todo path existente já está sob o id da dona**.
> Nenhum backfill, nenhuma migração de arquivo.

**Nenhum bucket novo.**

## E · Quem pode disponibilizar

| Papel | Pode? | Fundamento |
|---|---|---|
| **Curador atribuído ao Caso** | ✅ **sim** | é quem conduz a Curadoria dela |
| **Admin** | ⚠️ **só se houver necessidade operacional declarada** | já tem SELECT e DELETE; INSERT é acréscimo |
| **Concierge** | ❌ **não agora** | o handoff só ocorre **após a decisão**, e o Concierge não é Curador do Caso. Abrir aqui seria antecipar autoridade |
| qualquer staff | ❌ **nunca** | menor privilégio |

**A autorização deriva do Caso, sem coluna nova:**

> existe Caso **ativo** cujo `patient_profile_id = patient_documents.profile_id`
> **e** cujo `assigned_curator_id = auth.uid()`.

`cases` já tem os dois campos e os dois índices. **T-D12-4 sai de graça:** um
Curador sem Caso dessa paciente **não satisfaz o predicado**.

> ⚠️ **Limite honesto:** sem `case_id`, o documento não sabe **a qual** Curadoria
> pertence. Para a v1 da Central isso não é necessário — ele é **dela** de todo
> modo. **Quando houver mais de um Caso simultâneo por paciente, `case_id` passa
> a fazer falta.** Registrado como **GAP-D12-1**, não criado agora.

## F · Modelo de segurança — RLS proposta

| Op | Quem | Predicado |
|---|---|---|
| **SELECT** | paciente · admin | **inalterado** |
| **INSERT (a)** | **paciente** | **inalterado** — `profile_id = auth.uid() and uploaded_by = auth.uid()` |
| **INSERT (b)** | **Curador do Caso** *(nova)* | `uploaded_by = auth.uid()` **and** `uploaded_by <> profile_id` **and** existe Caso ativo dessa paciente com `assigned_curator_id = auth.uid()` |
| **UPDATE** | ninguém | **continua sem grant** |
| **DELETE** | paciente · admin | **inalterado** — ⚠️ ver §16 |
| **storage INSERT** *(nova)* | Curador do Caso | `bucket_id = 'patient-documents'` **and** `foldername[1]` = profile de paciente cujo Caso ativo é dele |

**A cláusula `uploaded_by <> profile_id` na policy (b) é o que impede o Curador
de gravar um documento "como se fosse dela".** As duas policies são **disjuntas
por construção**.

## G · A Curadoria entregue — **artefato digital, não arquivo**

**Duas classes de item na Central, e a distinção é do modelo de apresentação:**

| Classe | O que é | Ações |
|---|---|---|
| **A · arquivo real** | linha em `patient_documents` + objeto no bucket | **Ver** · **Baixar** |
| **B · artefato da plataforma** | existe como experiência, não como arquivo | **Abrir** · **Levar em PDF** |

**A Curadoria é classe B.** Aparece em *Recebidos da Aliviar* quando
`deliveredAt` permitir, com ação **Abrir**. **Nenhum arquivo é criado no storage
só para encaixar no modelo** — inventar persistência para satisfazer uma
categoria seria mentir sobre o que existe.

## H · O portão da entrega

> `emittedAt` ≠ `presentedAt` ≠ **`deliveredAt`**
>
> **Só `deliveredAt` libera a presença em *Recebidos da Aliviar*.**

Com `emittedAt` presente e `deliveredAt` nulo, a Central **não** mostra a
Curadoria como recebida. Mostra o estado honesto: **"A Aliviar está
preparando"** — que é a tradução da paciente para *emitido e não entregue*
(§07, §10, §13). **T-D12-6 e T-D12-7 nascem daqui.**

## I · Sua História e formulários

**A terceira área chama-se "Sua História e formulários".** **Sua História não é
questionário** — e o Método já registra isso no código.

| Item | Classe | Quando |
|---|---|---|
| **Continuar Sua História** | B | `status = 'rascunho'` |
| **Rever Sua História** | B | `status = 'enviada'` — projeção de `/sua-historia/revisao` |
| **Levar em PDF** | B | ver §J |
| consentimentos aceitos | B | já existem no domínio de governança |

## J · Versão imprimível — **duas perguntas, duas respostas**

**Existe fonte canônica?** `src/modules/story/types.ts` traz `STORY_STEPS` e
`SuaHistoriaData` (`paraQuem` · `motivo` · `historia` · `informacoesImportantes`
· `preferenciaModalidade`), e `PatientStory` traz `status`, `currentStep`,
`data`, `revision`, `submittedAt`. **A forma do dado é canônica e tipada.**

| Artefato | Possível sem novo domínio? |
|---|---|
| **história ENVIADA, imprimível** | ✅ **SIM** — `PatientStory.data` é canônico e `/sua-historia/revisao` **já o projeta**. Um *"Levar em PDF"* sai **da mesma projeção**, sem tabela, sem coluna |
| **questionário EM BRANCO** | ⚠️ **não como está** — os **textos das perguntas** vivem espalhados nas sete páginas do wizard, não numa fonte única |

> ### GAP-A6-Q1 — representação imprimível **em branco** de Sua História
>
> Não é lacuna de domínio: é de **organização de código**. Os textos precisariam
> ser extraídos das páginas para um módulo compartilhado, **antes** de qualquer
> geração. **Duplicá-los num PDF é proibido** — duas fontes divergem na primeira
> mudança de pergunta.
>
> **Registrado, não resolvido nesta missão.**

**Da projeção não pode vazar:** id, `profile_id`, `revision`, `currentStep`,
caminho de arquivo, nem qualquer campo interno. **Só o que ela escreveu.**

## K · Pendência documental — **não criar**

`patient_documents` **não representa pendência**, e **ausência de upload não é
pedido de documento**.

A pendência real existe hoje **só na tela do Curador** (B2-3, §06 H-2), e criar
sua contraparte é **[D-5]**, decisão de produto já registrada.

> **A Central não inventa "faltando".** Quando **D-5** existir, ela **lê** a
> pendência de lá. **Registrado como dependência, não como escopo.**

## L · Projeção UX — `DocumentCenterItem`

**TypeScript, não tabela. Nenhum enum persistido.**

```ts
type DocumentCenterItem = {
  id: string;
  category: "SENT_BY_PATIENT" | "RECEIVED_FROM_ALIVIAR" | "HISTORY_OR_FORM";
  presentation: "FILE" | "PLATFORM_ARTIFACT";     // classe A ou B
  title: string;                                   // humano, nunca file_name cru
  date: string;
  actions: Array<"OPEN" | "DOWNLOAD" | "TAKE_PDF">;
  reference: { kind: "patient_document" | "curadoria" | "story"; id: string };
};
```

**`category` deriva de `uploaded_by` vs `profile_id`** — não é gravada.

## M · Auditoria

**Reusar o mecanismo existente.** `audit_logs` já é usado para
`profile_recognized`; depositar documento vira uma entrada análoga, com
`actor_id`, ação e metadata mínima.

**Não criar trilha nova.** E **não** usar `case_events`: o enum é fechado em
quatro valores, e ampliá-lo por isto seria desproporcional.

## N · Download e revogação

| Questão | Decisão |
|---|---|
| quando o download aparece | classe **A** sempre; classe **B** só quando houver geração |
| URL | **signed URL de curta validade**, gerada no servidor. Bucket **permanece privado** |
| substituição | **não existe** — não há `UPDATE`, e `file_path` é único. Substituir é **depositar outro** |
| revogação | **não inventar.** Existe `DELETE` para paciente e admin. Revogação pelo Curador **não tem precedente** e não é criada aqui |
| versionamento | **nenhum** — sem caso real que o exija |

> ⚠️ **Ressalva de segurança:** a policy de DELETE deixa a paciente **apagar um
> documento que a Aliviar depositou**. Isso é consequência da policy atual, não
> desta proposta — **mas passa a importar** quando existirem documentos da
> Aliviar. **Registrado como GAP-D12-2**, decisão de produto: *ela pode apagar o
> que recebeu?*

## O · Migration — **SIM, e é só policy**

| Item | Tipo |
|---|---|
| policy `patient_documents_insert_curator_of_case` | **RLS** |
| policy de storage para o Curador escrever em `<patient>/` | **RLS de storage** |
| **coluna nova** | **nenhuma** |
| **tabela nova** | **nenhuma** |
| **bucket novo** | **nenhum** |
| **backfill** | **nenhum** |
| convenção de path | **documental** — já satisfeita pelos arquivos existentes |

**É a menor alteração possível: duas policies aditivas.** Nenhuma policy
existente é alterada ou removida.

**Classificação §25 do Contrato Mestre: nível E** ⇒ **[D-12 requer aprovação do
DT-01]** — como toda alteração de banco, ainda que só de RLS.

## P · Testes obrigatórios

| # | Prova |
|---|---|
| **T-D12-1** | paciente envia → aparece em *Enviados por você* |
| **T-D12-2** | Curador do Caso deposita → aparece em *Recebidos da Aliviar* |
| **T-D12-3** | paciente **não consegue** gravar `uploaded_by <> auth.uid()` — **recusa do banco**, não da UI |
| **T-D12-4** | Curador **sem Caso** dessa paciente → **recusado** |
| **T-D12-5** | paciente alheia **não lê** — nem a linha, nem o objeto do storage |
| **T-D12-6** | `emittedAt` sem `deliveredAt` → Curadoria **não** aparece como recebida |
| **T-D12-7** | `deliveredAt` → Curadoria aparece como **artefato digital**, classe B |
| **T-D12-8** | Sua História **nunca** é chamada de questionário |
| **T-D12-9** | download só existe quando há arquivo real ou geração |
| **T-D12-10** | **nenhum** metadata interno na UI — sem id, `profile_id`, `file_path` ou `uploaded_by` |
| **T-D12-11** | *(acréscimo)* documento depositado pelo Curador **cai na pasta da paciente** e **ela consegue lê-lo** |
| **T-D12-12** | *(acréscimo)* **nenhum** `UPDATE` é possível em `patient_documents` |

**T-D12-11 é o teste que prova o bloqueio 3 resolvido** — e sem ele a feature
"funciona" no banco e falha na leitura.

## Q · Impacto na A6

**A6 estava certa em parar.** Ela concluiu que não havia caminho para a Aliviar
depositar — e a razão é mais funda do que "falta writer": **a policy de INSERT
torna isso impossível por construção**.

**D-12 desbloqueia A6** com duas policies e uma convenção de path, **sem criar
domínio**: sem tabela, sem coluna, sem bucket, sem enum persistido.

## R · Handoff ao `03 ENGENHEIRO`

**Fazer:** duas policies aditivas · convenção de path documentada · projeção
`DocumentCenterItem` · três seções na Central · classe A e classe B · portão
`deliveredAt` · entrada em `audit_logs` no depósito.

**Não fazer:** tabela · coluna · bucket · enum persistido · `UPDATE` · arquivo
de storage para a Curadoria · PDF em branco de Sua História (**GAP-A6-Q1**) ·
noção de pendência (**[D-5]**) · abrir INSERT para Concierge ou staff genérico.

**Aceite:** os doze testes do §P.
**Rollback:** `drop policy` das duas novas. **Nada mais existe para desfazer.**

---

# D-12 APTO PARA IMPLEMENTAÇÃO — CENTRAL DE DOCUMENTOS POSSUI ARQUITETURA MÍNIMA DEFINIDA

**Condicionado a aprovação de banco** (duas policies, nível E).

**Dois GAPs registrados, nenhum resolvido por conta própria:** **GAP-A6-Q1**
(textos das perguntas sem fonte única) e **GAP-D12-2** (a paciente pode apagar o
que recebeu?). **GAP-D12-1** (`case_id`) fica para quando houver Casos
simultâneos.

**Próximo destinatário:** **`DT-01`** para a aprovação de banco e para
**GAP-D12-2**; depois **`03 ENGENHEIRO`**.
