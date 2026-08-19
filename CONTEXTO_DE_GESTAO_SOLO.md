# Contexto de Gestão — Aliviar (operação solo)

> **O que é este documento.** Um briefing autossuficiente para que **um único agente** (eu, Claude Code) consiga conduzir o projeto Aliviar sem depender de Cursor, Codex ou de qualquer outro agente, e sem depender da memória de uma sessão anterior. Ele não substitui `docs/AGENTS.md` (governança canônica) nem os documentos de domínio — ele diz **o que eu preciso saber antes de abrir qualquer arquivo**, e onde ir para saber o resto.
>
> **Estado dos fatos:** tudo nas seções 3 e 4 foi verificado ao vivo em **2026-08-19** (Git, Supabase de produção, Vercel). O resto é leitura dos documentos do repositório. Qualquer número aqui envelhece — a seção 14 diz como reconferir em poucos comandos.
>
> Este arquivo **não é canônico** e não está registrado em `docs/INDEX.md`.

---

## 1. Quem eu sou neste projeto

**Engenheiro Líder** do repositório e, em tudo que toca o Método, **guardião técnico**: o software implementa o Método Aliviar, nunca o contrário.

Quando o assunto é conceitual (Constituição, identidade do produto, princípios), o papel muda para **Conselheiro Permanente**: apresento trade-offs, faço as perguntas constitucionais, **não decido pelo Caio e não crio princípio novo por iniciativa própria**.

Quem decide negócio, produção e aprovação final é sempre o **Caio**.

Operando sozinho, eu absorvo o papel que era do Cursor (implementação). O que **não** muda ao absorver: escopo único por entrega, evidência antes de declarar concluído, e revisão explícita do que eu mesmo escrevi — a disciplina existia porque dois agentes erram diferente, não porque eram dois.

---

## 2. O que a Aliviar é

Uma pessoa conta sua história; a Aliviar devolve **três caminhos de cuidado tecnicamente legítimos e compatíveis com as prioridades que ela declarou** — nunca uma lista de médicos, nunca um ranking, nunca um score exposto.

O princípio central, do documento canônico do domínio:

> **O sistema organiza. O Curador interpreta. A decisão é humana.**

Duas consequências que derrubam a maioria das ideias antes de custarem código:

- **O objeto da Curadoria não é o médico — é o caminho de cuidado.** O médico é quem materializa esse caminho.
- **Complexidade nunca chega ao paciente.** Todo peso operacional fica do lado de dentro.

O cliente é o paciente, o Curador e a equipe — nunca o código.

---

## 3. Onde as coisas vivem (verificado em 2026-08-19)

| Coisa | Valor |
|---|---|
| **Base de trabalho oficial** | `C:\Users\barbo\OneDrive\Desktop\curadoria-2-0` |
| **Cópia congelada** | `C:\Users\barbo\Projects\aliviar-conexao` — parada em `e5df452`, **não trabalhar nela** |
| **Remoto** | `origin` → `github.com/barbosacaiopadilha-star/Aliviar-2.0.git` (repositório **público**) |
| **Branch principal** | `main`, com merge por Pull Request (últimos: PR #4 e PR #6) |
| **Vercel — projeto vigente** | `curadoria-2-0` (`prj_D8UhxU9oBRFLPRGkGVH3oCOxJcFu`), time `Aliviar` (`team_MrA9yI3aYtigZx8OFoVzQtZu`) |
| **Vercel — projeto antigo** | `aliviar-2-0` — ainda existe, com deploys de produção até `e5df452`. **Não é mais o alvo.** |
| **Supabase (produção)** | projeto `aliviar-2-prod`, ref `awdlmeykminwyifnygkm`, região `sa-east-1`, Postgres 17 |
| **Schema do produto** | **`curadoria`** — o `public` do mesmo banco pertence à **AliCIA**, outro produto. Nunca escrever no `public` daqui. |
| **Supabase local** | stack Docker em `127.0.0.1:54321`, **compartilhada** entre repo e worktrees |
| **Segredo do ACE** | `CLAUDE_API_KEY` (nome atual; já se chamou `ANTHROPIC_API_KEY`), só no painel da Vercel |

**Não existe staging.** Operar sem staging na v1 é decisão formal aceita (ADR-058), com mitigações. Preview da Vercel é o que há.

---

## 4. Estado real hoje (2026-08-19)

**Código**

- `origin/main` = `1dfb7a4` — *feat(admin): adiciona ciclo administrativo do lead (#6)*.
- A cópia oficial em disco estava em `5d53b7d`, **1 commit atrás** — resolve com `git pull --ff-only`.
- Não-versionados na base oficial: `AGENTS.md`, `zz-cols.mjs`, `zz-inv.mjs`, `docs/repaginacao/foundation/FOUNDATION_VERIFICATION.md`, `docs/repaginacao/ops-g4-auditoria/`.

**Produção (aplicação)**

- Deployment de produção `READY` a partir de `1dfb7a4`, no projeto `curadoria-2-0`.
- Rollback = promover um deployment anterior pelo painel (imediato). Ver `docs/RECOVERY.md`.

**Produção (banco)**

- **129 migrations** aplicadas; a última é `20260819005908_ciclo_administrativo_do_lead`, versionada no repositório. **Código e banco estão sincronizados** — checar isso é a primeira coisa a fazer sempre, porque já divergiu antes.
- Backup: **PITR não está contratado.** A garantia real é backup lógico por dump + restauração testada (ADR-059). Antes de qualquer ato destrutivo em produção, o dump é obrigatório e a restauração precisa ter sido provada, não presumida.

**Produção (dados) — o dado mais importante deste documento**

7 perfis · 9 profissionais · 3 pacientes · 3 Cases · 8 histórias · 3 leads · **0 entregas de Curadoria**.

**A produção nunca curou ninguém.** Nenhum Case chegou ao fim, nenhuma Curadoria Final foi entregue. Consequência prática: mexer no modelo de dados ainda custa quase nada, e nenhuma decisão precisa ser justificada por "já tem gente lá dentro". Isso deixa de ser verdade no primeiro paciente real.

---

## 5. Hierarquia de autoridade

Em conflito, o de cima vence. Sempre.

1. **Constituição da Aliviar** — documento permanente de maior autoridade. Nenhuma ADR, decisão ou feature pode contradizê-la.
2. **`docs/curadoria/MODELO_CURADORIA_V1.md`** (hoje **v3.0**) — canônico do domínio. *Conceito que não está lá não é conceito do domínio: é candidato a ADR ou é ruído.*
3. **`docs/DECISIONS.md`** — o log de ADRs (hoje ADR-001 a ADR-070). É **append-only**: nenhum verbete é reescrito. O **índice de supersessões** no topo (instituído pela ADR-062) é obrigatório — quem lê uma ADR listada lá precisa ler também a que a supersede.
4. **`docs/AGENTS.md`** — protocolo de governança dos agentes.
5. Documentos de domínio e arquitetura (`docs/architecture/`, `docs/ace/`, `docs/curadoria/`, `docs/experiencia/`).
6. Documentos marcados **"Proposto"** — não são canônicos. Vários documentos bonitos do `docs/` são Propostos; ler o cabeçalho antes de citar como regra.

Para o **ACE** há uma ordem de camadas própria e obrigatória, em `docs/ace/06-governance/governance.md`: Constituição → Framework → Ontologia → Kernel → Protocolos. Regra peculiar dessa governança: documento ainda não materializado é tratado como **já aprovado**, nunca como bloqueio.

---

## 6. Arquitetura técnica em uma página

- **Monólito modular.** Next.js 15 (App Router) + TypeScript + Tailwind, React 19. Supabase (Postgres/Auth/Storage). Zod. Vitest + Playwright. Vercel.
- **A fronteira de autorização é a RLS do banco, não a aplicação.** Se uma proteção só existe em código, ela não existe. ADR-048: *toda imutabilidade prometida ao usuário mora no banco.*
- **Áreas por papel são segmentos reais de rota** (`/admin`, `/paciente`, `/profissional`, `/portal-curador`, `/coa`), nunca route groups (ADR-009). `(public)` e `(auth)` são grupos só para compartilhar layout.
- **`src/modules/*`** = domínio isolado; um módulo nunca lê dado de outro direto, só por contrato explícito. **`src/platform/*`** = fundação técnica transversal (ADR-030). **`src/foundation/*`** = primitivas visuais.
- **Papéis:** `administrador`, `profissional`, `paciente`, `curador_medico`, `concierge`. N:N em `user_roles` — papel novo é dado, não migration estrutural.
- **Não há autocadastro público** (ADR-018). A conta do paciente é criada pela equipe. A porta pública de entrada é `/solicitar-atendimento` → lead no CRM.
- **Tabelas de log, decisão e entrega são append-only por desenho** — a garantia é a *ausência* de policy de UPDATE/DELETE, não uma trigger.
- **Migration aplicada nunca é editada.** Correção é sempre migration nova.
- **COA — Centro de Operações Aliviar** (`/coa`): três níveis internos sobre o mesmo banco — Atendimento (`/coa/atendimento`), Curadoria, Concierge. Substitui o conceito isolado de "Portal do Curador". O paciente só vê a Jornada dele.
- **ACE (`src/modules/ace/`, P001–P010):** **não tem mais autoridade operacional** (ADR-035/036/037). A entrega canônica é a do Método (Mesa de Curadoria). `runAceExecution` está preservado como motor histórico sob observação. Não tratar o ACE como o caminho vivo do produto.
- **Sem `discovery` e sem `connection` de "busca direta"**: os módulos existem vazios, reservados. O MVP original da ADR-004 não foi o caminho real.

---

## 7. O domínio, o mínimo indispensável

- **Catálogo Canônico 1.0.0** (ADR-046/047): 28 conceitos, 7 grupos, 5 eixos. **O banco é a fonte autoritativa do Catálogo**, não um `Record` TypeScript.
- **Mapa de Prioridades do Case** e **Mapa do Profissional**: estados fechados sobre o mesmo catálogo. A **ADR-042** aposentou o orçamento de 100 pontos — se algum documento ainda falar em "100 pontos" ou "0–100", o documento está atrasado, não o código (`docs/DATABASE.md` ainda tem esse resíduo).
- **Motor de Compatibilidade** (ADR-041): quatro resultados por subcritério, **nenhum score**. Score interno jamais sai para o paciente.
- **Curadoria 2.0** (ADR-066 a ADR-070): Propostas de Derivação fazem a ponte entre a declaração e o Método; o Curador registra julgamentos em `curator_judgments`; confirmar é ato humano com autoria; regras de derivação têm ciclo de vida versionado (uma versão vigente por conceito, garantida por trigger + índice parcial). Regra Material 001 aprovada (ADR-070).
- **Exatamente três opções**, com autoria humana, garantidas por trigger.
- **A decisão da paciente é fato próprio** e `NONE_OF_THEM` é desfecho legítimo.

Onde aprofundar, na ordem: `docs/curadoria/MODELO_CURADORIA_V1.md` → `docs/curadoria/CONGELAMENTO_ARQUITETURAL.md` → `docs/architecture/ARCHITECTURE_BLUEPRINT.md` → `docs/MANUAL_CURADOR.md`.

---

## 8. Ambientes, comandos e as quatro guardas

**A regra de bolso:** se o comando fala com a stack local, ele começa com `node scripts/with-local-supabase.mjs` ou é um script `*:local`. `.env.local` aponta para o backend **hospedado** — um `next build` "a seco" já embutiu a URL remota no bundle e quebrou o login local sem avisar. Foi daí que nasceram as guardas.

| Objetivo | Comando |
|---|---|
| Dev contra a stack local | `npm run dev:local` |
| Build local determinístico | `npm run build:local` |
| Qual backend está no bundle | `npm run verify:backend:local` |
| Testes unitários | `npm test` |
| Integração (banco real local) | `npm run test:integration` |
| E2E (builda antes) | `npm run test:e2e` |
| Golden Set do ACE | `npm run test:golden` |
| Subir/derrubar stack local | `npm run supabase:start` / `npm run supabase:stop` |
| Contas de teste locais | `npm run bootstrap:test-users` |

As quatro guardas, todas em código: (1) validação de ambiente no `next.config.ts`, que mata o processo em contradição; (2) identidade do build exposta em `GET /api/build-info`; (3) `scripts/verify-bundle-backend.mjs`, que falha em bundle misto; (4) `scripts/clean-next-output.mjs`, porque o cache do webpack já reaproveitou módulos do env errado.

**`docs/AMBIENTES.md` é a referência.** `npm run supabase:reset` passa por `guard-db-reset.mjs` — não contornar.

---

## 9. Protocolo de trabalho, operando sozinho

As oito etapas de `docs/AGENTS.md`, sem pular nenhuma:

**analisar → identificar causa raiz → definir solução → implementar → validar → executar testes → revisar → documentar**

Adaptações para operação solo:

- A etapa 4 (implementar) é minha. A etapa 7 (revisar) continua existindo como **passo separado e explícito** — reler o diff como se fosse de outra pessoa, procurando escopo que vazou, arquivo tocado sem motivo e segredo introduzido.
- **Escopo único por entrega.** Não misturar refatoração com funcionalidade. Não tocar mais de um módulo funcional por entrega sem autorização.
- **Nada é "concluído" sem evidência**: comando executado + resultado observado. Validação que não pôde rodar vira **pendência registrada**, nunca "presumido OK".
- **Bloqueio:** parar, registrar o que travou e por quê, preparar tudo que não depende do bloqueio, e pedir ao Caio **só a decisão mínima inevitável**.
- **Relatório por ciclo:** objetivo · causa raiz · alterações · arquivos · comandos · validações · riscos · pendências · próximos passos.
- **Investigação segue ordem fixa:** reproduzir → localizar → evidenciar → classificar → corrigir. **Vídeo não é evidência técnica — é hipótese.**
- **Nunca descartar trabalho existente** (reset, force push, sobrescrita) sem confirmar o estado atual e comunicar o que será perdido.

---

## 10. Regras invioláveis

- **Produção só muda com autorização explícita do Caio.** Nenhuma automação daqui faz deploy, cria recurso pago ou altera produção sozinha.
- **Nunca** expor senha, token, chave privada ou service role em código, commit, log ou relatório. **Nunca** service role no cliente. **Nunca** commitar `.env*`.
- `docs/CREDENTIALS.md` registra identificador/finalidade/ambiente/local — **nunca valores**.
- Credencial temporária só é criada quando já existe mecanismo real que a consome. Nunca "por precaução", nunca pedindo ao Caio para inventar senha.
- **O repositório é público.** Tratar todo conteúdo como leitura de estranhos.
- **Ausência do `CLAUDE_API_KEY` em produção falha explicitamente.** O modelo fake determinístico é permitido em dev/teste e **vedado em produção** — nunca cair nele em silêncio.
- Recurso de outro projeto (`aliviar-app`, AliCIA) não é reutilizado, copiado nem alterado daqui (ADR-001).
- **Dado clínico.** ADR-054 (documentos clínicos), ADR-055 (LGPD e retenção), ADR-056 (suboperadores: Anthropic documentada, analytics fora das rotas autenticadas). Qualquer coisa que amplie coleta ou exposição volta para o Caio.

---

## 11. Armadilhas conhecidas (lições que já custaram caro)

1. **A stack Supabase local é compartilhada** entre o repo principal e as worktrees. Sessões concorrentes apagam seeds, rotacionam senhas, tomam a porta 3001 e dessincronizam o ledger de migrations. Esperar a stack quieta antes de suíte longa.
2. **E2E vermelho aqui quase nunca é o produto.** Ordem de suspeita: oráculo desatualizado → fixture não-autossuficiente → só então o código.
3. **`supabase db reset` local produz schema diferente de produção.** Sete migrations do schema `curadoria` nasceram fora do repositório. Teste de integração local tem valor limitado como prova sobre o banco real.
4. **Chunk de rota autenticada não é descobrível.** Para provar que algo foi publicado, usar SHA do commit + logs de build — e desescapar `\xHH` antes de procurar acento em bundle.
5. **Smoke reversível em produção existe e funciona:** `begin; … rollback;` via `execute_sql` do MCP prova a cadeia real sem deixar resíduo. É a forma preferida de verificar produção.
6. **Documentos desatualizados são a regra, não a exceção.** Já encontrados: `docs/DATABASE.md` falando em 100 pontos (morto pela ADR-042); `docs/CODEBASE_MAP.md` citando `/curador` (hoje `/portal-curador`); `docs/DEPLOY_RUNBOOK.md` apontando para o caminho e o projeto Vercel antigos. **Verificar no código/banco antes de agir sobre o que um doc afirma.**
7. **A auditoria mediu que o código é mais fiel ao Método do que os documentos.** Em divergência doc × código sobre o Método, suspeitar do documento primeiro — e resolver a divergência, não escolher em silêncio.

---

## 12. O que está congelado e o que está aberto

- **V1.0 congelada** pela ADR-021: só correção de bug; mudança estrutural exige decisão explícita de abrir V2. O congelamento foi **parcialmente superado** — ADR-031 (Experience Continuity), ADR-032 (calibração), ADR-035, e ADR-063, que regularizou reaberturas pós-fato. Na prática o projeto voltou a evoluir sob ADR; o congelamento sobrevive como **exigência de decisão explícita**, não como proibição.
- **Arquitetura da Curadoria congelada** (`docs/curadoria/CONGELAMENTO_ARQUITETURAL.md`, com emenda de 2026-08-04): daqui em diante toda alteração é evolução da plataforma, **nunca implementação do Método**.
- **Arquitetura madura em 7 domínios:** trabalho novo entra num domínio existente. Domínio novo exige justificativa explícita e forte.
- **Compatibility Intelligence:** conceitual, Fases 0-6 completas; falta validação empírica antes de implementar. **Não tem arquivo em `docs/`.**
- **Observatório da Experiência:** protocolo ativo, **sem nenhum dado real**. Evolução de produto deve derivar de comportamento registrado, não de especulação — e ainda não há comportamento registrado.
- Ideias já filtradas e **não** implementáveis agora: frequência de condutas e os itens 🟡 do RELEASE BLOCKERS.

**Filtro para ideia nova:** Conselho de 7 Guardiões como primeira passada; se sobreviver, protocolo de 5 perspectivas / 12 seções. Só depois, implementação.

---

## 13. Dívida conhecida: o veredicto NO-GO

A Auditoria Geral de 2026-08-02 (dez fases, nove frentes) consolidou **68 problemas distintos: 15 P0, 27 P1, 22 P2, 4 P3** (`docs/REGISTRO_UNICO_DE_ACHADOS.md`), com veredicto **NO-GO** (`docs/GO_NO_GO_FINAL.md`). Não é NO-GO de reconstrução — o núcleo está certo. É NO-GO de **consolidação**, e o resumo em três frases era:

1. O Método está implementado, fiel e certificado.
2. A confiança que o produto promete está na interface e na boa vontade, não no sistema — imutabilidades reversíveis em silêncio por credencial legítima, operações compostas não atômicas, fail-open na Rede.
3. A operação em volta do produto ainda não existe — backup, rollback, rotação de credenciais, alerta, e uma única pessoa acumulando administrador, curador, aprovador, respondedor de incidente e cofre (ADR-060/061).

Parte disso já foi endereçada desde então (backup lógico provado, publicação por gates, isolamento de ambientes). **Antes de citar um achado como aberto, conferir se ele já caiu.** O Plano Mestre de correção depende de aprovação humana dos três documentos da Fase 10 — não começar por conta própria.

O padrão transversal, que vale como método de correção: *a casa sabe fazer certo e prova isso em vários lugares — as proteções nasceram onde os incidentes doeram e nunca foram generalizadas.* O gabarito de quase toda correção está dentro do próprio repositório.

---

## 14. Rotina de abertura de sessão

Antes de responder qualquer pedido não-trivial:

```bash
cd "/c/Users/barbo/OneDrive/Desktop/curadoria-2-0" && git fetch origin && git status -sb && git log --oneline -3 origin/main
```

E, quando o pedido tocar dados ou schema, mais três perguntas com resposta em um comando cada:

1. **O banco de produção bate com o repositório?** contar migrations em `supabase_migrations.schema_migrations` e comparar com `supabase/migrations/`.
2. **Qual commit está no ar?** último deployment `target: production` do projeto Vercel `curadoria-2-0`.
3. **A stack local está quieta?** `npm run supabase:status`.

Se algum dos três divergir, **isso vira o assunto** antes do pedido original.

---

## 15. O que este documento não substitui

`docs/AGENTS.md` (governança canônica) · `docs/curadoria/MODELO_CURADORIA_V1.md` (domínio) · `docs/DECISIONS.md` + índice de supersessões (o porquê de tudo) · `docs/AMBIENTES.md` (procedimento de build) · `docs/ace/06-governance/governance.md` (antes de qualquer trabalho no ACE) · `docs/CONVENTIONS.md` (como o código já é escrito) · `docs/INDEX.md` (mapa do resto).

Este documento me diz **onde estou e o que não posso quebrar**. Os de cima dizem **como fazer certo**.
