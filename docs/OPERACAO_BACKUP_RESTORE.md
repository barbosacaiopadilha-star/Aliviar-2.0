# Backup, Restore e Saúde — procedimento operacional

> **ACHADO DE 2026-08-25 — leia antes do resto.** A premissa que este documento
> e o `backup-local.mjs` carregavam — *"o backup de produção é responsabilidade
> do provedor (PITR gerenciado)"* — foi verificada e é **falsa**. A organização
> `aliviar-alpha` está no plano **free** do Supabase, que não oferece backup
> automático nem PITR. No instante da verificação, produção tinha **47 contas,
> 6 histórias enviadas, 3 profissionais reais publicados e 28 arquivos** — e
> nenhum ponto de recuperação, de nenhum tipo.
>
> Enquanto o plano não mudar, `npm run backup:producao` é o **único** ponto de
> recuperação que existe — e ele só existe nas datas em que alguém o rodar.
> Ver a seção 3-bis.

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

## 3-bis. Backup de PRODUÇÃO (REC-01) — o que existe e o que não existe

### O estado verificado em 2026-08-25

| Fato | Valor | Como foi verificado |
|---|---|---|
| Organização | `aliviar-alpha` | API do Supabase |
| **Plano** | **free** | API do Supabase (`get_organization`) |
| Backup automático | **nenhum** | consequência do plano free |
| PITR | **nenhum** | consequência do plano free |
| Projeto | `aliviar-2-prod` (`sa-east-1`, PostgreSQL 17.6) | API do Supabase |
| Dado em risco | 47 contas · 6 histórias enviadas · 3 profissionais reais publicados · 28 arquivos · 3 Cases | contagem lida do próprio banco |

Os 3 profissionais reais não são cadastro trivial: cada um passou por verificação de registro no conselho **com fonte**, área de atuação verificada e formação com selo. É trabalho humano que não se refaz por script.

### O comando

```
npm run backup:producao
```

Produz, numa pasta datada em `.backups/` (fora do Git): `curadoria.sql` (com GRANTs), `auth.sql`, `storage-index.sql`, os bytes em `storage/`, e `manifesto.json` com as contagens da captura.

**Credenciais — dois valores, uma vez.**

```
npm run backup:producao:configurar
```

Pede a connection string do banco e a service role key, **com a digitação oculta**, e escreve `.env.backup.local` (permissão 600, ignorado pelo Git). O endereço do projeto ele descobre sozinho, do `project-ref` que a CLI já gravou — um campo a menos é uma chance a menos de erro de digitação num arquivo que ninguém relê.

O configurador **recusa rodar fora de um terminal de verdade**. Aceitar entrada redirecionada convidaria `echo "$SENHA" | npm run …`, que joga o segredo no histórico do shell — exatamente o que ele existe para evitar.

E confere antes de escrever, porque erro de colagem aqui falha em silêncio: marcador `[YOUR-PASSWORD]` do painel, connection string sem senha, alvo local, host de outro projeto, chave publishable no lugar da service_role. As conferências são função pura em `scripts/backup-credenciais.mjs`, com teste próprio — a lógica não podia viver dentro de um roteiro que roda ao ser carregado.

**PostgreSQL 17.** O servidor hospedado é 17.6 e o `pg_dump` da stack local é 15.8 — e `pg_dump` recusa servidor mais novo que ele. Por isso o dump roda numa imagem `postgres:17-alpine` descartável. Se um dia produção subir de versão, é esta linha que muda.

**Guarda invertida.** O `backup-local.mjs` recusa apontar para produção; este recusa apontar para o local. Um "backup de produção" que copiou a máquina de desenvolvimento gera pasta com tamanho e manifesto e não protege nada — falso sucesso é pior que falha. Ambos os caminhos foram exercitados: sem credencial o script instrui e sai; com alvo local, recusa.

### O que foi provado e o que não foi

| Parte | Estado |
|---|---|
| Guarda de credencial ausente | **provada** (25/08) |
| Guarda invertida contra alvo local | **provada** (25/08) |
| `pg_dump 17` em container alcançando banco real | **provado** (25/08 — 1,5 MB de um banco de verdade, credencial só em variável de ambiente) |
| `psql` em container: contagens e listagem de objetos | **provado** (25/08, no caminho de código real) |
| Execução completa contra **produção** | **NÃO EXECUTADA** — depende de credencial que não existe nesta máquina |
| Restore de um backup de produção | **NUNCA EXECUTADO** |

A distinção importa: o mecanismo está provado, a operação não. Um backup que ninguém restaurou continua sendo esperança, e essa frase vale igualmente para este script.

### O que um script não resolve, e é decisão do responsável

`npm run backup:producao` é **manual**. Ele protege contra perda catastrófica na data em que for rodado, e contra mais nada: um dado criado depois do último backup está a descoberto. Isso é aceitável para um produto sem paciente real; deixa de ser no dia em que houver.

O que o plano pago resolve e o script não:

- **Backup diário automático**, sem depender de alguém lembrar;
- **Retenção**, que dá janela para perceber o erro antes de o ponto de recuperação sumir;
- **PITR** (add-on separado), que é o que responde "voltar ao instante anterior ao acidente" em vez de "voltar ao último dump".

Há ainda um risco do plano free que não é sobre backup: projetos gratuitos são **pausados por inatividade**. Um projeto pausado não perde dado, mas fica fora do ar até alguém reativá-lo — e descobrir isso pela paciente é diferente de descobrir pelo painel.

### O que fecha o REC-01

1. Decisão do responsável sobre o plano (é compra — não é ato de agente);
2. Backup automático confirmado no painel, cobrindo `curadoria`, `auth` e `storage`;
3. **Um restore executado de verdade**, com RTO e RPO medidos — não o RTO local de 3,9 s, que mede outra coisa.

Enquanto os três não acontecerem, o REC-01 continua **P0 aberto**, e este documento não deve dizer o contrário.

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

- **REC-01 — respondido em parte, e a parte que falta é a que protege.** Cobertura e retenção do provedor: **verificadas em 25/08 e inexistentes** (plano free). Existe agora um backup manual de produção (`npm run backup:producao`, §3-bis) com o mecanismo provado, mas **nunca executado contra produção** e **nunca restaurado**. Fecha com: decisão de plano, backup automático confirmado no painel, e um restore real medido.
- Definir **RPO** e RTO aceitáveis
- Executar um restore em **produção ou staging**, não só local
- Rollback de deploy e a matriz código × schema — REC-02
- Alertas e monitor externo apontando para `/api/health` — OBS-01
- Runbooks com coordenadas corrigidas — DOC-06
