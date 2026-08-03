# Backup, Restore e Saúde — procedimento operacional

**Bloco I.** Este documento descreve o que foi **executado e medido**, não o que se pretende fazer. Onde algo não foi provado, está dito.

---

## 1. O que o backup cobre

`node scripts/backup-local.mjs [destino]` produz quatro peças:

| Peça | Conteúdo | Por que existe |
|---|---|---|
| `curadoria.sql` | Schema da aplicação: estrutura, dados **e GRANTs** | É o dado clínico e operacional |
| `auth.sql` | `auth.users` + `auth.identities` | Sem as contas, o banco restaurado devolve dados que ninguém acessa |
| `storage-index.sql` | `storage.buckets` + `storage.objects` | O índice dos arquivos |
| `storage.tar` | Os **bytes** dos arquivos | Metadado sem byte é um índice apontando para o vazio |
| `manifesto.json` | Contagens no instante da captura | É a contraprova do restore |

**Fora do backup, e isso é declarado pelo próprio script ao terminar:** segredos e variáveis de ambiente (vivem no provedor) e a configuração do projeto Supabase (plano, PITR, rede). Ambos precisam de procedimento próprio.

## 2. Restore verificado

`node scripts/restore-local.mjs <pasta>` executa e **verifica duas coisas diferentes**:

1. **Contagens** — cada tabela do manifesto precisa voltar com o número que tinha.
2. **Acesso** — `anon`, `authenticated` e `service_role` precisam conseguir ler o que lhes cabe.

A segunda verificação nasceu de um erro real cometido durante esta Sprint: um restore com `pg_dump --no-privileges` **aprovou na contagem e entregou um banco inacessível** (`permission denied for schema curadoria`). Presença de dado não é acesso a dado. Hoje o dump preserva os GRANTs e o script recusa aprovar sem provar acesso.

### As duas sondas NÃO bastam — rode a suíte

Ainda nesta Sprint, um segundo erro provou que nem a verificação de acesso é suficiente. Tentando recuperar os GRANTs perdidos, extraí-os das migrations com `grep "^grant"` — e **perdi silenciosamente** os de seis tabelas, porque elas recebem privilégio por **SQL dinâmico** (`do $$ … execute format('grant …') … $$`, migration `20260727050000`). O restore seguinte aprovou: 10/10 contagens, 3/3 acessos. A suíte completa então acusou **43 arquivos de integração quebrados** com `permission denied for table professional_practice_areas`.

Duas regras que saem daí, e nenhuma é opcional:

- **Nunca reconstruir privilégio por extração de texto.** Grant emitido por SQL dinâmico é invisível ao `grep`. A fonte é a migration executada, não o arquivo lido.
- **Depois de qualquer restore, rodar a suíte completa.** Sondar três tabelas prova que o schema respira; só a suíte prova que o sistema funciona. Em caso de dúvida sobre o estado local, `npm run supabase:reset` reconstrói a partir das migrations — é o caminho canônico, e foi o que recuperou o ambiente aqui.

### Ordem obrigatória (aprendida na marra)

1. Derrubar **só** `curadoria` — `auth` e `storage` pertencem à plataforma e recusam `drop` com *must be owner*.
2. Restaurar **contas antes** da aplicação: `curadoria.profiles` referencia `auth.users` em cascade; limpar `auth` depois arrastaria os dados recém-restaurados.
3. Restaurar a aplicação.
4. Restaurar o índice de objetos **apenas em instância limpa** — a plataforma protege `storage.objects` contra deleção direta (trigger `protect_objects_delete`) e nem o `postgres` do Supabase desarma isso. No desastre real a instância é nova, que é quando o passo funciona.
5. Restaurar os bytes.

## 3. Evidência do ciclo executado

Ciclo completo rodado contra a stack local em 2026-08-03:

| Etapa | Resultado |
|---|---|
| Backup | `curadoria.sql` 5,9 MB · `auth.sql` 344 KB · `storage-index.sql` 20 KB · `storage.tar` |
| Destruição | `drop schema curadoria cascade` + remoção dos arquivos → **0 arquivos**, schema inexistente |
| Restore | 10/10 contagens conferem · 3/3 acessos conferem |
| **RTO observado** | **3,9 s** (stack local; produção terá ordem de grandeza diferente) |
| Pós-restore | ledger 91/91 · `bootstrap:test-users` ok · suítes de integração verdes |

Numa execução anterior do ciclo, a restauração dos **bytes** foi provada por checksum: o laudo voltou com `md5 556fdc0ecb120e7086cc22f44afe526a`, idêntico ao de antes da destruição.

**RPO:** não definido. Depende do PITR do provedor e é decisão de contrato/plano — não há como um script local respondê-la.

## 4. Saúde (`/api/health`)

`/api/build-info` **não** é health check: lê arquivo local e responde 200 com o banco caído. `/api/health` toca as dependências:

| Estado | Resposta |
|---|---|
| Tudo respondendo | `200 {"status":"ok"}` |
| Dependência fora | `503 {"status":"degradado"}` + qual dependência e a causa |

Provado nos dois estados, derrubando o container do banco de verdade: 200 → **503** (`Database connection error`) → 200 após religar. Nunca expõe segredo, host ou contagem.

## 5. Checklist antes de qualquer deploy

- [ ] **Backup válido** — backup do dia confirmado no painel do provedor, com PITR ativo
- [ ] **Restore testado** — ciclo executado e aprovado (contagens **e** acessos)
- [ ] **Migrations** — `npm run supabase:ledger:check` sincronizado; rollback escrito no arquivo
- [ ] **Rollback** — matriz código × schema conhecida; ponto-sem-retorno identificado
- [ ] **Build** — `npm run build:local` verde; BUILD_ID anotado
- [ ] **CI** — verde no commit exato que vai ao ar
- [ ] **Observabilidade** — `/api/health` respondendo 200 antes e depois
- [ ] **Suíte completa** — verde APÓS qualquer restauração, não só as sondas
- [ ] **Smoke** — login, envio de história, anexo, Mesa, emissão de Relatório
- [ ] **Responsáveis** — quem executa, quem verifica, quem decide abortar

## 6. O que continua em aberto

Este documento cobre o **procedimento**. Continuam pendentes, e nenhum deles é resolvível sem acesso à produção ou decisão do responsável:

- Confirmar cobertura e retenção do backup **de produção** (PITR, `auth`, `storage`) — REC-01
- Definir **RPO** e RTO aceitáveis
- Executar um restore em **produção ou staging**, não só local
- Rollback de deploy e a matriz código × schema — REC-02
- Alertas e monitor externo apontando para `/api/health` — OBS-01
- Runbooks com coordenadas corrigidas — DOC-06
