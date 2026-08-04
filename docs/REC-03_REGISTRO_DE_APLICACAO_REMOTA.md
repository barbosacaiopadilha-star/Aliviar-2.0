# REC-03 — REGISTRO DE APLICAÇÃO REMOTA E VERIFICAÇÃO DAS MIGRATIONS

**Documento de registro *a posteriori*. Não é plano de execução.**

| | |
|---|---|
| **Data do evento** | 2026-08-03, 22:10:08 – 22:10:09 UTC |
| **Data deste registro** | 2026-08-04 |
| **Projeto** | `aliviar-2-prod` (`awdlmeykminwyifnygkm`), região `sa-east-1` |
| **Autor do registro** | Claude (CTO da execução) |
| **Estado** | 🟡 aguardando decisão do responsável (§11) |

---

## 1. Finalidade

Este documento substitui o dossiê de migração remota previsto no Plano Oficial de Lançamento (Fase 4). **Aquele dossiê nunca foi escrito, e não pode mais ser:** as três migrations que ele planejaria aplicar já haviam sido aplicadas quando sua redação começou.

O REC-03 registra, portanto, **o que de fato ocorreu**, a verificação executada depois do fato, o desvio em relação ao procedimento planejado, e o campo em aberto para a decisão do responsável.

Origem do identificador: `REC-03` é achado do `REGISTRO_UNICO_DE_ACHADOS.md` — *"dossiê de migração remota inválido"*, originalmente por descrever 2 migrations quando o repositório continha 91.

---

## 2. Estado anterior conhecido

Verificado em **2026-08-03 ~21:15Z**, por consulta direta ao banco de produção:

| Item | Valor |
|---|---|
| Migrations aplicadas | **88** |
| Última versão | `20260803120000_reconhecimento_cobre_bloco_relacional` |
| `curadoria.legal_documents` | **inexistente** (`to_regclass` → `null`) |
| `authenticated` lê `case_responsibility_changes` | **não** |

Consulta usada:

```sql
select count(*)                          as total,
       max(version)                      as ultima,
       to_regclass('curadoria.legal_documents')::text as governanca
  from supabase_migrations.schema_migrations;
```

---

## 3. Horário real da aplicação

| Momento (UTC) | Evento |
|---|---|
| 22:09:33 | `git push origin main` do commit de merge `4ad2f1f` (Passo 3 do Bloco A) |
| 22:10:03 | Integração Supabase↔GitHub clona o repositório em `git_ref=main` |
| 22:10:06 | Verificação de saúde do projeto |
| 22:10:07 | Conexão ao Postgres de produção, porta 5432 |
| **22:10:08.316** | Aplicação da `20260803130000` |
| **22:10:08.556** | Aplicação da `20260803140000` |
| **22:10:09.011** | Aplicação da `20260803150000` |
| 22:10:09 | `Skipping seed data for protected branch` · `No functions to deploy` |

**Duração total: menos de um segundo.** Intervalo entre o push e a aplicação: **35 segundos**.

---

## 4. Migrations aplicadas

| Ordem | Versão | Nome | Conteúdo |
|---|---|---|---|
| 1 | `20260803130000` | `grants_case_responsibility_changes` | Dois `grant` sobre `curadoria.case_responsibility_changes` |
| 2 | `20260803140000` | `governanca_documentos_aceites_lgpd` | Seis tabelas novas, RLS, policies, funções e grants da governança/LGPD |
| 3 | `20260803150000` | `governanca_aceite_do_profissional` | Tipo `legal_acceptance_nature`, três CHECKs e duas funções sobre `legal_acceptances` |

Nomes confirmados no ledger de produção em 2026-08-04.

**Aditividade verificada:** os únicos `alter table` incidem sobre tabelas criadas pela própria `140000`. **Nenhuma tabela preexistente em produção foi modificada** — o que explica por que o código então publicado (`ef7b7e9`) continuou funcionando sobre o schema novo.

---

## 5. Hashes SHA-256

Normalizados em LF. Idênticos entre a tag `lancamento-v1.0.0` e o disco.

| Arquivo | SHA-256 |
|---|---|
| `20260803130000_grants_case_responsibility_changes.sql` | `a80c41d5a14e22a98cc51f3430946bbaf4cfdbee237d3764ec38974af973edd7` |
| `20260803140000_governanca_documentos_aceites_lgpd.sql` | `f517524b8f8c3a0b1a32379e40a09ddd872e659745e37369f6c6c06f1f23cb0a` |
| `20260803150000_governanca_aceite_do_profissional.sql` | `8bfbc7139b7c42ba40e2f14a29230ad9118a9e947d224b6b784ec158e49b0b02` |

---

## 6. Evidências do ledger

Estado após a aplicação, reconferido múltiplas vezes até 2026-08-04:

| Fonte | Total | Última versão | Impressão MD5 das versões |
|---|---|---|---|
| **Produção** | 91 | `20260803150000` | `9081b5d131542eff5fcca498c485463e` |
| Banco local | 91 | `20260803150000` | `9081b5d131542eff5fcca498c485463e` |
| Repositório na tag `lancamento-v1.0.0` | 91 | `20260803150000` | `9081b5d131542eff5fcca498c485463e` |

```sql
select count(*), max(version),
       md5(string_agg(version, ',' order by version))
  from supabase_migrations.schema_migrations;
```

**Paridade exata entre as três fontes.**

---

## 7. Prova de equivalência estrutural

Não bastava contar migrations: era preciso provar que os **objetos** criados em produção correspondem ao que o commit validado descreve. Método: impressão digital estrutural cobrindo, para os seis objetos de governança, colunas com tipo e nulidade, definição completa de cada constraint, expressão de cada policy, `md5` do corpo de cada função e todos os grants por papel.

| Ambiente | Itens | Impressão MD5 |
|---|---|---|
| **Produção** | **157** | **`ab84ae1881ec4ec303ac1f2efc50fbbd`** |
| Local (validado pela CI no commit `4ad2f1f`) | 157 | `ab84ae1881ec4ec303ac1f2efc50fbbd` |

**Idênticas.** A consulta completa está reproduzida no `RELATORIO_FINAL_DE_PRONTIDAO_1_0.md`, §3.

Confirmações pontuais: 6/6 tabelas · 5/5 funções · 5 policies em `legal_*` · 3/3 CHECKs da `150000` · tipo `legal_acceptance_nature` presente · `has_table_privilege('authenticated','case_responsibility_changes','select')` = **true** · **0 linhas** em todas as tabelas novas.

---

## 8. Autoria

**Integração nativa Supabase↔GitHub**, execução `workflow_run 1c724448f10945c3bb5a9eab71077203`, **disparada pelo push do merge do Bloco A**.

Autoria estabelecida por log da própria plataforma, não por inferência. Hipóteses alternativas descartadas com prova:

- **GitHub Actions** — um único workflow no repositório, **zero referências a `secrets.`** em `.github`. Sem credencial, não há como escrever em produção.
- **Vercel** — nenhum deployment ocorreu (`count: 0`); sem `postinstall`, `prepare`, `vercel-build` ou `postbuild`; nenhuma rota de API executa DDL.
- **Processo local** — CLI Supabase inativa desde 21:45:38Z, 25 minutos antes; 2.050 linhas de trace do dia com **zero** ocorrências de `db push`, `link`, `--linked`, `--project-ref` ou `supabase.co`.
- **Outra sessão ou agente** — sem evidência; o log nomeia o executor.

### 8.1 Log preservado — `branch-action`

```
2026/08/03 22:10:03 INFO Cloning git repo... git_ref=main
2026/08/03 22:10:06 INFO Checking service health... project_ref=awdlmeykminwyifnygkm
2026/08/03 22:10:07 INFO Skipping configuration for protected branch...
2026/08/03 22:10:07 INFO Connecting to database... host=[…]:5432
2026/08/03 22:10:08 INFO Applying migration... file=20260803130000_grants_case_responsibility_changes.sql
2026/08/03 22:10:08 INFO Applying migration... file=20260803140000_governanca_documentos_aceites_lgpd.sql
2026/08/03 22:10:09 INFO Applying migration... file=20260803150000_governanca_aceite_do_profissional.sql
2026/08/03 22:10:09 INFO No buckets found. Try setting [storage.buckets.name] in config.toml.
2026/08/03 22:10:09 INFO Skipping seed data for protected branch...
2026/08/03 22:10:09 INFO No functions to deploy.
```

### 8.2 Log preservado — Postgres

83 linhas de DDL capturadas na janela 22:10:00–22:10:15Z. Preâmbulo característico de `db push` da CLI:

```
22:10:08.239  execute <unnamed>: CREATE SCHEMA IF NOT EXISTS supabase_migrations
22:10:08.248  execute <unnamed>: CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text NOT NULL PRIMARY KEY)
22:10:08.250  execute <unnamed>: ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS statements text[]
22:10:08.255  execute <unnamed>: ALTER TABLE supabase_migrations.schema_migrations ADD COLUMN IF NOT EXISTS name text
22:10:08.481  execute <unnamed>: [corpo da 20260803130000]
22:10:08.721  execute <unnamed>: [corpo da 20260803140000]
22:10:09.176  execute <unnamed>: [corpo da 20260803150000]
```

**Um único preâmbulo seguido de três corpos** — assinatura de uma execução em lote, não de três operações independentes.

### 8.3 Contexto da janela — atividade humana concorrente

```
22:01:12  ERROR  permission denied for table case_responsibility_changes
22:02:49  (criação do 7º perfil profissional — publicado)
22:07:14  (atualização desse perfil)
22:09:01  logout de usuário real
22:09:05  login de usuário real (senha)
22:09:28  ERROR  Mapa de Prioridades congelado — nova rodada exige supersessão
22:09:59  ERROR  Mapa de Prioridades congelado
22:10:31 → 22:12:53  mais ocorrências do mesmo
```

**O erro das 22:01:12 é o defeito que a `20260803130000` corrige** — ele estava ocorrendo em produção, em uso real, nove minutos antes da correção chegar.

> ⚠️ **Retenção.** Os logs de `branch-action`, `postgres` e `auth` da plataforma Supabase têm retenção de **24 horas**. As linhas acima foram capturadas em 2026-08-03, entre 22:38Z e 23:30Z, e transcritas aqui **antes do vencimento**. Após 2026-08-04 22:10Z, este documento passa a ser a única prova documental do evento.

---

## 9. Desvio em relação ao procedimento planejado

| O plano previa | O que ocorreu |
|---|---|
| Reescrita e conferência prévia do dossiê REC-03 | Não houve — a aplicação antecedeu a redação |
| Aplicação **uma migration por vez** | Três aplicadas em lote, em menos de 1 s |
| **Parada de verificação entre elas** | Nenhuma |
| Janela de manutenção definida | Nenhuma — usuários reais em sessão |
| Backup confirmado antes | **Inexistente** — organização em plano Free |
| Ato deliberado do Responsável Técnico | Ato automático, disparado por um `git push` |

### 9.1 Causa-raiz do desvio

**A auditoria do fluxo de deploy que precedeu o Bloco A não examinou a integração Supabase↔GitHub.** Ela cobriu Vercel, GitHub Actions, `vercel.json`, proteção de branch e scripts de `package.json`, e concluiu — corretamente, para o que examinou — que pausar a Vercel protegeria produção.

A conclusão estava certa sobre o **código** e errada sobre o **schema**. Existiam dois pipelines partindo do mesmo gatilho; apenas um foi identificado e contido.

A falha é de **cobertura de auditoria**, não da plataforma nem do mecanismo, que operou exatamente como configurado.

---

## 10. Riscos gerados e validações realizadas

### Riscos que o desvio criou

1. **DDL em produção sem backup** — o mais grave. Se qualquer das três migrations tivesse falhado no meio, não haveria ponto de restauração. Nenhum.
2. **Sem janela e sem aviso** — usuários reais em sessão no momento da aplicação.
3. **Sem verificação entre migrations** — um erro na segunda seria descoberto só depois da terceira.
4. **Precedente operacional** — enquanto a integração estiver ativa, qualquer `.sql` mergeado em `main` repete este cenário em ~30 s.

### Validações executadas depois do fato

| Validação | Resultado |
|---|---|
| Ledger em produção | ✅ 91 / `20260803150000` |
| Paridade produção × local × tag | ✅ `9081b5d1…` nas três |
| Equivalência estrutural | ✅ 157 itens, `ab84ae18…`, idêntica |
| Aditividade das três migrations | ✅ nenhuma tabela preexistente alterada |
| Dados espúrios nas tabelas novas | ✅ zero linhas |
| Escrita administrativa posterior | ✅ nenhuma após 22:10:09Z |
| CI no mesmo commit | ✅ run `30857578623` verde |
| Aplicação em produção | ✅ saudável durante e depois |
| Publicação subsequente (`97ed8b2`) | ✅ integração reportou `All migrations are up to date` |

**Resultado material: íntegro.** O que protegeu não foi o processo — foi a aditividade das migrations.

---

## 11. Decisão do responsável

> **Campo em aberto. A ser preenchido pelo Fundador.**

**11.1 — Aceitar o estado resultante do banco de produção?**
`91 / 20260803150000`, equivalência estrutural provada com o commit `4ad2f1f`.

☐ Aceito · ☐ Não aceito
Data: __________ Assinatura/registro: __________

**11.2 — Destino da integração Supabase↔GitHub**
Recomendação técnica registrada no Plano Oficial, Parte 11: **Estratégia A** (desligar durante o Bloco A) e **Estratégia B** (religar após a P1, com recuperação verificada).

☐ Desligar · ☐ Manter e adaptar o processo · ☐ Outro: __________

**11.3 — Observação registrada em 2026-08-04**
Nenhuma das duas decisões foi tomada até a data deste registro. A integração **permanece ativa**.

---

## 12. Documentos relacionados

| Documento | Relação |
|---|---|
| `RELATORIO_FINAL_DE_PRONTIDAO_1_0.md` | Autoridade sobre o **estado** do projeto; contém a auditoria forense completa |
| `PLANO_OFICIAL_DE_LANCAMENTO_1_0.md` (Rev. 3) | Autoridade sobre o **caminho**; Parte 11 registra os dois pipelines |
| `REGISTRO_UNICO_DE_ACHADOS.md` | Origem do identificador REC-03 |
| `OPERACAO_BACKUP_RESTORE.md` | Procedimento de backup e restore medido no Bloco I |

---

## 13. Encerramento

As três migrations foram aplicadas **corretamente, na ordem certa e com resultado verificado**. O que falhou não foi a mudança: foi o controle sobre ela.

Este documento existe para que o registro seja fiel — e para que a próxima pessoa que ler o Plano Oficial saiba que, em 2026-08-03, um `git push` alterou o schema de produção sem que ninguém tivesse decidido isso naquele instante.
