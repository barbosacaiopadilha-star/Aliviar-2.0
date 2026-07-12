# TASK-002 — Ambiente Supabase local (CLI + Docker)

**Status:** Planejada, pronta para ser enviada ao Cursor. Ainda não aprovada para execução — depende da confirmação de pré-requisito descrita no "Passo 0".

Baseada em ADR-007 (`docs/DECISIONS.md`): enquanto não houver capacidade de projeto Supabase hospedado de desenvolvimento (bloqueado pelo limite do tier gratuito), o desenvolvimento usa Supabase local via CLI + Docker — estritamente local, reproduzível, descartável, sem cobrança, sem ligação com o `aliviar-app`.

---

## Objetivo

Preparar e validar um ambiente Supabase local (CLI + Docker) para desenvolvimento e testes: CLI instalada como dependência do projeto, `supabase/config.toml` compatível com a versão instalada, scripts npm para operar a stack local, geração automática de `.env.local` a partir dos valores da stack local, e confirmação de que a aplicação inicializa contra esse ambiente. **Sem autenticação, sem perfis, sem regra de negócio, sem projeto hospedado.**

## Causa raiz

A criação de um projeto Supabase hospedado de desenvolvimento está bloqueada pelo limite do tier gratuito da conta/organização atual. O desenvolvimento da Fase 2 (autenticação e perfis) não pode ficar parado por essa limitação de infraestrutura — por isso a Fase 2 passa a depender de um ambiente Supabase local reproduzível, não de um projeto hospedado (ADR-007).

## Passo 0 — Verificação obrigatória de pré-requisito (antes de qualquer outra coisa)

Execute `docker info`. Dois cenários:

- **Docker responde normalmente:** prossiga para a Parte A e depois a Parte B desta tarefa.
- **Docker não responde (não instalado, daemon parado, ou exige elevação):** **pare imediatamente após a Parte A** (que não depende de Docker). Não tente instalar, configurar, atualizar ou reiniciar o Docker Desktop, não tente contornar o problema. Registre exatamente a mensagem de erro obtida e reporte a Parte B como bloqueada, pendente de uma instalação/decisão do usuário fora do escopo desta tarefa.

Esta tarefa é dividida em duas partes exatamente por causa desse risco conhecido:

- **Parte A** — não depende de Docker, deve ser sempre executável.
- **Parte B** — depende de Docker + daemon ativo; só é executada se o Passo 0 confirmar que o Docker responde.

## Escopo — Parte A (sem dependência de Docker)

1. Instalar a CLI do Supabase como devDependency do projeto (não global): `npm install --save-dev supabase@2.109.1` (versão já validada contra o `config.toml` atual nesta revisão; se uma versão mais recente já estiver disponível no momento da execução, documente a divergência no relatório em vez de trocar silenciosamente).
2. Corrigir a depreciação já identificada em `supabase/config.toml`: renomear a seção `[inbucket]` para `[local_smtp]`, mantendo exatamente as mesmas chaves (`enabled`, `port`, `smtp_port`, `pop3_port`) e valores já existentes. Confirmado por teste: o formato gerado pela CLI atual (`supabase init`) usa `[local_smtp]` com essas mesmas chaves — não é necessário renomear ou remover nenhuma chave, só o cabeçalho da seção.
3. Adicionar a `.gitignore` (apenas linhas novas, nunca remover as existentes): `supabase/.temp/` e `supabase/.branches/` — diretórios de estado local gerados pela CLI ao rodar a stack, que ainda não estavam cobertos pela entrada genérica `.supabase`.
4. Adicionar scripts em `package.json` (usando a CLI local instalada no passo 1, via `npx supabase` ou pelo bin local do pacote):
   - `"supabase:start": "supabase start"`
   - `"supabase:stop": "supabase stop"`
   - `"supabase:status": "supabase status"`
   - `"supabase:reset": "supabase db reset"`
   - `"supabase:env": "node scripts/generate-local-env.mjs"`
5. Criar `scripts/generate-local-env.mjs`: script Node que executa `supabase status -o env` (ou `-o json`, o que for mais confiável para parsing) via `child_process`, extrai **somente** a URL da API local e a `anon key`, e escreve/sobrescreve `.env.local` na raiz do projeto com exatamente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<valor>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<valor>
   ```
   **Não incluir a service role key, a connection string do banco, o JWT secret nem qualquer outro valor retornado pelo `supabase status`** — só os dois valores que `src/lib/supabase/env.ts` já consome. O script não deve imprimir esses valores no terminal/log (rodar silenciosamente ou, se precisar logar, mascarar o valor).

Confirmar ao final da Parte A, mesmo sem Docker: `npx supabase status` não deve mais emitir o aviso de depreciação do `[inbucket]` (a mensagem de erro de conexão com o Docker pode continuar aparecendo — isso é esperado e não é falha da Parte A).

## Escopo — Parte B (requer Docker + daemon ativo, só se o Passo 0 confirmar)

6. `npm run supabase:start` — subir a stack local.
7. `npm run supabase:status` — conferir URLs e portas ativas.
8. `npm run supabase:env` — gerar `.env.local` a partir da stack local.
9. `npm run dev` — iniciar a aplicação e confirmar que os clients Supabase (`src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`) inicializam sem lançar erro de variável ausente. Não é necessário (e não deve ser feito) testar login, cadastro ou qualquer fluxo de negócio — só que a aplicação sobe sem erro de configuração. Encerrar o processo do `next dev` ao final da verificação.
10. `npm run supabase:stop` seguido de `npm run supabase:start` novamente — validar que a stack reinicia de forma idempotente.
11. `npm run supabase:reset` — validar que o reset do banco local funciona sem erro (banco local está vazio, sem schema de negócio; é só validação do comando).
12. `npm run supabase:stop` ao final — não deixar containers rodando ao concluir a tarefa.

## Arquivos permitidos

- `package.json`, `package-lock.json` (adição de devDependency e scripts)
- `supabase/config.toml` (somente a correção da seção `[local_smtp]` descrita no passo 2; nenhuma outra alteração estrutural sem justificativa registrada no relatório)
- `.gitignore` (somente adição das linhas descritas no passo 3)
- `scripts/generate-local-env.mjs` (novo arquivo)
- `.env.local` (gerado automaticamente pela Parte B; nunca deve ser commitado)

## Arquivos proibidos

- `docs/**`, `CLAUDE.md`, `README.md`, `.cursor/**` — não editar, não apagar.
- `supabase/migrations/**` — nenhuma migration nesta tarefa.
- Qualquer arquivo em `src/**`, incluindo `src/lib/supabase/**` — os clients já foram validados na TASK-001; se algum defeito real for observado neles durante a Parte B, **não corrigir aqui**, apenas registrar como achado no relatório para uma tarefa futura.
- Qualquer comando que vincule o projeto a um Supabase hospedado (`supabase link`, URLs de projeto remoto, `project_ref` de um projeto real).
- Qualquer arquivo, valor ou referência do projeto `aliviar-app`.
- Qualquer criação de usuário de aplicação, papel, senha administrativa ou dado de negócio.
- `.env`, ou qualquer arquivo de credencial fora de `.env.local` (que é local e ignorado).

## Comandos exatos

Passo 0 (sempre):
```
docker info
```

Parte A (sempre, independente do resultado do Passo 0):
```
npm install --save-dev supabase@2.109.1
npx supabase status
git status
```

Parte B (somente se o Passo 0 confirmar Docker ativo):
```
npm run supabase:start
npm run supabase:status
npm run supabase:env
npm run dev
npm run supabase:stop
npm run supabase:start
npm run supabase:reset
npm run supabase:stop
git status
```

## Critérios objetivos de aceite

**Sempre (Parte A):**
- `supabase` instalado como devDependency com versão registrada em `package.json`/`package-lock.json`.
- `npx supabase status` não emite mais o aviso de depreciação do `[inbucket]`.
- `.gitignore` contém as novas entradas, sem remoção de nenhuma entrada existente.
- Scripts `supabase:start`, `supabase:stop`, `supabase:status`, `supabase:reset`, `supabase:env` presentes em `package.json`.
- `scripts/generate-local-env.mjs` existe, não contém valores reais hardcoded, e não imprime segredos no console.
- `git status` mostra apenas os arquivos da lista de "Arquivos permitidos".

**Somente se a Parte B foi executada:**
- Stack local sobe e para sem erro (`supabase:start`/`supabase:stop`).
- `.env.local` criado com exatamente as duas variáveis esperadas, nunca aparecendo como rastreável em `git status`.
- `npm run dev` inicia sem lançar erro de variável de ambiente ausente.
- Reinício da stack (stop + start) idempotente, sem erro.
- `supabase:reset` conclui sem erro.
- Nenhum container Supabase permanece rodando ao final da tarefa.

**Se a Parte B foi bloqueada pelo Passo 0:**
- Relatório declara isso explicitamente, com a mensagem de erro exata do `docker info`, sem simular ou presumir um resultado que não foi observado.

## Estratégia de rollback

Todo o ambiente é descartável por definição (ADR-007): não há migration nem dado real em jogo.

- Parar e descartar a stack local a qualquer momento: `npm run supabase:stop` (ou `supabase stop --no-backup` para descartar volumes locais imediatamente).
- Remover `.env.local` (arquivo local, nunca versionado) se precisar recomeçar do zero.
- Se o commit local desta tarefa precisar ser desfeito antes do push: `git reset --soft HEAD^` (nunca `--hard` sem confirmar que não há trabalho não commitado relevante) e reverter os arquivos de configuração ao estado anterior.
- Nenhuma dessas ações afeta produção ou qualquer projeto Supabase hospedado, porque nenhum foi criado ou vinculado nesta tarefa.

## Validações de segurança

- Confirmar que `.env.local` nunca aparece como arquivo rastreável em `git status` (deve estar coberto por `.env.*` em `.gitignore`).
- Confirmar que nenhuma service role key, connection string ou JWT secret foi escrita em qualquer arquivo versionado ou impressa em log/relatório.
- Confirmar que `scripts/generate-local-env.mjs` não expõe valores no console (rodar silenciosamente ou mascarar).
- Confirmar que nenhuma credencial, URL ou referência do `aliviar-app` foi copiada ou reutilizada.
- Confirmar que nenhum usuário de aplicação, papel ou senha administrativa foi criado.
- Confirmar que nenhum comando de vinculação a projeto hospedado (`supabase link` ou similar) foi executado.

## Checklist (preencher antes de reportar)

- [ ] Passo 0 executado e resultado registrado (Docker disponível ou não, com a mensagem exata).
- [ ] Parte A concluída e validada, independentemente do resultado do Passo 0.
- [ ] Parte B concluída e validada — **ou** explicitamente marcada como bloqueada, com o motivo.
- [ ] `git status` conferido: só arquivos da lista de "Arquivos permitidos" alterados.
- [ ] Nenhum segredo em `.env.local` além dos dois valores esperados; `.env.local` não commitado.
- [ ] Nenhuma alteração em `src/**`, `docs/**`, `supabase/migrations/**`.
- [ ] Commit local criado, **sem push**.
- [ ] Relatório de conclusão redigido no formato de `docs/WORKFLOW.md`.

## Exigência de commit local sem push

Ao final da tarefa (mesmo que a Parte B tenha sido bloqueada), criar **um único commit local** com as alterações da Parte A (e da Parte B, se executada). Mensagem sugerida: `chore: ambiente Supabase local via CLI + Docker (TASK-002)`. **Não fazer push.** O push só ocorre após revisão do Claude Code, como na TASK-001.

## Relatório obrigatório

Entregar, no formato de `docs/WORKFLOW.md`: objetivo; causa raiz; resultado do Passo 0 (com a mensagem exata do `docker info`); alterações realizadas (Parte A e, se aplicável, Parte B); arquivos modificados; comandos executados com o resultado de cada um; validações de segurança realizadas; se a Parte B foi executada ou bloqueada, e por quê; riscos identificados; pendências; próximos passos; hash do commit local criado.

## Resultado esperado

`supabase/config.toml` compatível com a CLI instalada, scripts npm para operar a stack local, geração automática e segura de `.env.local`, e — se o ambiente tiver Docker disponível — confirmação de que a aplicação roda contra o Supabase local, com a stack parada ao final. Se Docker não estiver disponível, a Parte A fica pronta e documentada, com a Parte B claramente registrada como pendência que depende de uma decisão/instalação do usuário.
