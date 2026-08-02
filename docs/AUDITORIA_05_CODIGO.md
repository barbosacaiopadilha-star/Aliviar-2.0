# AUDITORIA 05 — CÓDIGO, ARQUITETURA E MANUTENIBILIDADE

**Data:** 2026-08-02 · **Fase:** 5 da Auditoria Geral (após Fases 1–4)
**Natureza:** inspeção somente. Único artefato novo: este documento.
**Pergunta:** *a arquitetura e o código são coerentes, seguros, compreensíveis e sustentáveis — ou existem estruturas que favorecem deriva, regressão e decisões silenciosas?*

## 1. Resumo executivo

**Veredicto: a arquitetura e o código ainda favorecem regressões ou perda de integridade.**

O projeto tem um núcleo de qualidade rara: domínio puro bem fatorado e testado (`relatorio-inteligente`, `dossie`, `motor-compatibilidade`, `mesa.ts`), **meta-testes arquiteturais** que guardam decisões (actions-com-chamador, catálogos coerentes, autoridade ADR-041/042, paleta única), fronteira cliente/dados limpa (zero componentes importando supabase), guardas de ambiente exemplares (`env-guard`, `build:local`), e uma cultura de comentário-de-porquê que preserva a memória de incidentes reais. **A casa sabe fazer certo — e prova isso em vários lugares.**

A dívida é igualmente nomeável e se concentra em cinco estruturas que *fabricam* regressão:

1. **Assimetria transacional estrutural**: connection/relationship/crm/cases são atômicos via RPC; `curadoria` — o módulo central (57 arquivos, ~30 tabelas, 79 componentes consumidores) — **não tem nenhuma RPC de escrita**. É a raiz de código dos críticos de atomicidade da Fase 3.
2. **Fronteira UI↔domínio vazando nos dois sentidos**: a regra "exatamente três" replicada em **10 arquivos sem constante**; ordem de apresentação (o que o paciente lê) garantida apenas por convenção através de 6 pontos; estrutura de parecer duplicada e divergente entre `mesa.ts` e `report-editor`; **controle de fluxo por substring de mensagem de erro** em 3 pontos; serialização `join(" ")` × `join("\n")` sem `split` (colapsa arrays irreversivelmente — e `favorablePoints: []` **apaga o rascunho assistido no primeiro save**).
3. **Contornos de runtime amarrados a uma versão do Next** (RECONHECE-REFRESH-001, NAV-COMMIT-001, prefetch da história) com premissas sem guarda ("nenhuma rota do paciente é estática") — um upgrade toca 3 dívidas, 1 regressão e 2 passos de E2E de uma vez.
4. **A defesa contra o incidente dos 10 minutos está morta**: `ambiente-integro.setup.ts` nunca executa (nenhum testMatch o inclui), `test:e2e` não builda nem derruba servidor obsoleto, e o `setTimeout(600s)` não tem `actionTimeout` — os três compõem um único buraco reaberto.
5. **Fontes de verdade concorrentes** (Catálogo ×4, rotas do curador ×3, enum de verificação ×3, estado do Case ×2) — detalhadas nas Fases 1–4; esta fase identifica a **causa estrutural**: ausência de geração de tipos, diretório nunca renomeado compensado por rewrite, e listas hard-coded sem teste de amarração.

## 2. Escopo e método

Quatro frentes novas (mapa arquitetural com grafo de imports exaustivo; 25 maiores arquivos com análise de responsabilidade dos 12 críticos; configuração/build item a item classificado estrutural×workaround; segredos com verificação de tracked no git e histórico completo) + consolidação das evidências das Fases 1–4 para as partes já auditadas (fontes de verdade, órfãos, decisões silenciosas, erros, autorização, transações, tipagem, rotas). Evidência sempre `arquivo:linha`; certeza declarada.

## 3. Mapa arquitetural (síntese)

- **Entrypoints**: árvores por papel com guard por página/layout; middleware só otimista (deliberado, documentado). **Duplicação de árvore**: `/paciente`+`/portal-paciente`, `/curador`+`/portal-curador`, `/atendimento`+`/coa/atendimento`.
- **22 módulos** (7 vazios-promessa). Grafo de dependências levantado; **3 ciclos confirmados** com arestas de valor: `crm↔coa`, `curadoria↔coa`, `curadoria↔paciente` (+ triângulo crm→curadoria→coa→crm). `curadoria` é o hub de fato.
- **Camadas**: `platform/*` consumido só por `ace/core` (re-exports-fachada documentados); **`platform/runtime` (8 arquivos), `forbidden-vocabulary` e `provenance` sem consumidor de produção** — só testes (nota: `forbidden-vocabulary` é citado por testes que guardam invariantes — órfão de produção, não de propósito).
- **Convenção actions→repository→supabase majoritariamente uniforme**: zero componentes com query; 3 páginas violam (montam query própria: `acompanhamento`, `paciente/linha-do-tempo`, `profissional`); cliente é injetado pela rota (DI, não violação). **Service role instanciado em 9 rotas** + 4 módulos; contrato de guarda seguido em 13/14 call sites (exceção: leads).
- **Fronteira transacional**: 19 `.rpc()`, todos em módulos; atômicos: connection (9), relationship (3), crm (4), cases (1), paciente (1). **`curadoria`: zero RPC de escrita.**
- **Estado**: sem store global; 4 contexts + 1 reducer (Mesa). **Duas portas de escrita para `patient_documents`** (story/ e profiles/).
- **Testes**: 136 unit · 54 integration · 48 components · 27 e2e · golden. **Lacunas por módulo**: `profiles` (0 testes nomeados; 17 arquivos, 15 guards, dono das contas), `concierge` (0 diretos), `crm` (0 integration apesar de 4 RPCs), `coa` (1 unit, participa de 2 ciclos).

## 4. Fontes de verdade (consolidação Fases 1–4 + causa estrutural)

| Conceito | Classificação | Causa estrutural |
|---|---|---|
| Catálogo 1.0.0 | **duplicada divergente** (tabela + 3 arrays; 36 códigos divergem; opções do banco com 0 leituras) | sem geração de tipos/validação cruzada; `catalogos-coerentes.test.ts` existe mas não cobre opções nem eixo |
| Rotas do curador | **duplicada coerente por rewrite** (3 endereços) | diretório físico nunca renomeado; rewrite como dívida permanente; `revalidatePath` já errou o alvo em produção — **e o Briefing erra hoje** (5 chamadas para `/portal-curador/...`) |
| Enum de verificação | **duplicada divergente** (banco 5 valores; 2 arquivos TS com fantasma `em_verificacao`; `fontes.ts` correto) | tipagem 100% manual sem paridade automatizada |
| Estado do Case | **autoridade indefinida** (enum decorativo × derivação `conduct`) | ninguém conectou as máquinas; `patient_case_overview` consome a errada |
| "Exatamente 3" | **duplicada coerente** (10 arquivos, sem constante) | invariante sem símbolo |
| Estrutura do parecer | **duplicada divergente** (`mesa.ts:49-87` × `report-editor.tsx:58-96` — títulos/guidance divergem) | UI reimplementou o domínio |
| Permissões CRM/COA | **duplicada incompleta** (mapas de aplicação sem `atendente`; RLS correta) | dois sistemas de permissão sem teste de paridade |
| Navegação por papel | **duplicada divergente** (`ROLE_HOME` × `LEVEL_PATHS`; `ROLE_PRIORITY` declarado e não usado no redirect) | helpers concorrentes reconciliados sem unificar |
| Home do paciente ("meu Case") | **duplicada** (2 queries por `updated_at desc` na mesma página) | duas portas de leitura para o mesmo conceito |

## 5. Código morto e órfão (consolidação + classificação)

**Morto comprovado**: árvores `/curador/*` (7 arquivos) e `/portal-paciente/*` (4) atrás de redirect; página `/admin/crm` raiz; `ambiente-integro.setup.ts` (o porteiro que nunca roda); `mock-records.ts` (426 linhas); `WHATSAPP_ACCESS_TOKEN` (ambos os ramos retornam Disabled); prop `interactions` passada e não desestruturada (query roda e é descartada); 5 `revalidatePath` para redirects. **Órfãs com função viva** (Fase 2): 14 actions + `MandatoryFilters` + `CuradoriaDecisionPanel` + 6 seções Landing v2. **Legado deliberado**: `concierge/ACE` (ADR-037, sob observação), `compatibility_analyses` etc. **Compatibilidade**: redirects, re-exports de `platform`. **Diagnóstico permanente**: `documentos-orfaos.ts`, observabilidade ACE. **Potencialmente morto**: `platform/runtime` (8 arquivos), `Skeleton`, `ActivityFeed`, `EvidenceCard`.

## 6. Duplicações (síntese — Parte 4)

Regra em cliente+servidor+banco com divergência: "exatamente 3" (10×, coerente), congelamentos (divergente — Fase 4), `crm` do gate (`IS NULL` no banco × `trim()` na UI). Lógica de domínio no cliente: cap de 3 e ordem de apresentação no reducer (`mesa-workspace.tsx:143,186-210`); `etapaAtual` do lead em `.tsx`; Decision Memory volátil que a tela chama de memória. Actions que misturam nome e efeito: `saveReportAction` (também revisa), `deliverSelectionAction` (também entrega o relatório), `emitReportAction` (também aprova), `changePipelineStage` (também cria interação e audita). Página consultando múltiplas fontes para o mesmo conceito: home do paciente (2), detalhe do profissional (catálogo TS + banco na mesma página).

## 7. Decisões silenciosas (consolidação da Fase 4 §9 — inalterada; adições desta fase)

Adições: `leadStageFallback = "in_service"` (o que aparece no funil quando a projeção falha); `criteriaTotal = N*6` com `6` literal; `.slice(0, 2)` das âncoras da justificativa (muda dois campos do documento do paciente sem nome nem teste); `dossie.assessReadiness` sem `now` → verificação vencida conta como válida (semântica de parâmetro opcional em prosa); `explicitCompletionConfirmed: toStage === "completed"` — a confirmação humana exigida pelo domínio é auto-preenchida pela UI.

## 8. Tratamento de erros (consolidação + padrões)

Classificação por padrão: **correto** — `falhaParaUsuario`+ERR- nas leituras da Mesa e actions de profiles; compensação do upload. **Insuficiente** — `fail()` das actions de curadoria devolve `error.message` cru (inclusive Postgres); boundary não mostra ERR-. **Fail-silent** — os 4 pontos de erro descartado (`repository.ts:333`, `professional-repository.ts:249`, `cases/repository.ts:214+`, `report-repository.ts:169`); autosave em sessão expirada. **Falso sucesso** — entrega P2; `includes("sucesso")` pintando erro de verde. **Fail-open** — blocklist; leads em preview; `42P01→[]` nas correções P002 (migration ausente vira "sem correções humanas"). **Sem observabilidade** — error boundaries ausentes em 6 segmentos; trace do Playwright nunca gerado localmente (`retries:0` + `on-first-retry`).

## 9. Autorização entre camadas (consolidação)

Sólido no servidor/banco (Fases 3–4). Desta fase: `evidencePanelCan` — booleanos `true` literais com o nome da policy **em comentário** (autorização de UI declarada em prosa); `concierge` (módulo) sem nenhum guard próprio (depende da página); guard divergente layout×página em `/coa/atendimento`; actions de anexo confiando 100% na RLS (monocamada declarada); a única API service-role sem guard de papel é a de leads (com o segredo condicional).

## 10. Operações compostas (consolidação Fase 3 §6 — raiz de código)

A raiz única: **`curadoria` e `profiles` não usam RPC para escrita** enquanto o gabarito existe no repositório (`transfer_case_responsibility`, módulo connection). Os 4 críticos (entrega, conversão de lead, seleção, competências) + criação de paciente são todos multi-statement PostgREST com o antipadrão do erro descartado. `closeMesa` orquestra 2 actions do cliente com recuperação textual.

## 11. Tipagem e paridade

Sem tipos gerados (decisão nunca registrada); 19 schemas Zod (8 na convenção, 6 inline); enum fantasma em 2 arquivos; `verification_status` com 3 verdades; estados impossíveis compiláveis (`em_verificacao`); `lead.caseId!` garantido por branch 240 linhas acima; `Array.isArray(x) ? x[0] : x` (6×) descartando o segundo em silêncio; `SEM_REGISTRO` vs `NAO_INFORMADO` distinguíveis só por string; datas como ISO strings (ok); `catalog_version` com dois defaults. FormData: conversões null→undefined centralizadas (`emptyToUndefined`) após o incidente — bom padrão.

## 12. Rotas e navegação (consolidação + estrutura)

Fase 2 §3/§10 integral. Estruturalmente: os 3 endereços do curador são **dívida de renomeação de diretório** paga em juros contínuos (`ROLE_HOME` via redirect a cada login; `revalidatePath` errável — e errado no Briefing hoje); `/portal-paciente/:path*` com 308 que descarta o subcaminho; helpers de navegação duplicados. **Dependência de contorno de runtime**: 3 pontos (reload do reconhecimento, âncora do Gerenciar, âncora do lead-workspace sem dívida registrada) + prefetch desligado mascarando GET-que-grava (causa raiz aberta por decisão registrada, STORY-GET-WRITE-001).

## 13. Componentes críticos (12 analisados — síntese)

| Arquivo | Linhas | Responsabilidades | Risco central |
|---|---|---|---|
| `crm/repository.ts` | 1113 | 6 | `changePipelineStage` = guard+domínio+3 escritas não-atômicas num bloco de 103 linhas |
| `mesa-workspace.tsx` | 755 | 7 | regras do Método no reducer não-exportado; `REOPEN` só-cliente; ordem→`position` sem proteção |
| `curadoria/actions.ts` | 657 | 5 | 3 nomes que mentem; `revalidateCuradoria` com strings já-erradas-uma-vez sem teste de amarração |
| `mesa-evidencias-panel.tsx` | 644 | 5 | 6 transitions independentes; autorização por objeto `can` montado com `true` literais |
| `curadoria_tecnica/page.tsx` | 499 | 6 | `*6` literal; round-trip lossy `join(" ")`×`join("\n")` |
| `report-editor.tsx` | 424 | 5 | **fluxo por substring de erro**; `favorablePoints: []` destrutivo; campo que apaga e não exibe |
| `lead-workspace.tsx` | 381 | 4 | `setEncaminhado(true)` antes do await (tela afirma sucesso sobre falha); `caseId!` |
| `crm-contact-detail-panel.tsx` | 383 | 4 | sucesso/erro por `includes("sucesso")`; prop morta; confirmação humana auto-preenchida |
| `use-story-draft.tsx` | 287 | 6 | invariante de correção em prosa; 2 eslint-disable de deps sustentando a serialização |
| `dossie.ts` / `relatorio-inteligente.ts` / `evidencias-pratica.ts` | 596/540/657 | 4/1/4 | os melhores do recorte; riscos pontuais (`now` opcional; `.slice(0,2)`; regras por-código fora do catálogo) |

Funções >80 linhas em domínio: `runAceExecution` (338), `loadCuradoriaRecord` (267 — o carregador único da Mesa), `loadMesaCruzamento` (208), +5. Zero cobertura de unidade nos 4 componentes que mais escrevem (22 actions somadas).

## 14. Configuração e ambiente (estrutural × workaround)

**Estruturais sólidos**: `resolverAmbienteDoBackend`, `.build-id`, `verify-bundle-backend`, `clean-next-output`, `env-guard` (exemplar), `check-migration-ledger`, trava de exclusão mútua, `assertLocalSupabase`, zero `ignoreBuildErrors`. **Workarounds que mereciam decisão**: os 3 endereços do curador; `NEXT_PUBLIC_BUILD_TIME` com o defeito de dupla avaliação que o `.build-id` corrigiu para o id; `reuseExistingServer` + `test:e2e` sem build/stop-stale + porteiro morto + 600s sem `actionTimeout` (**o buraco dos 10 minutos, reaberto**); `origin ?? localhost`; service keys `?? ""` no webServer; `stop-stale-server` com caminho-1 morto e Windows-only; trace nunca gerado localmente. **Docs de ambiente**: 8 variáveis fora da tabela oficial (incl. `CRM_SITE_LEAD_SECRET`, `VERCEL_ENV`, `SUPABASE_ACCESS_TOKEN`, os 5 `NEXT_PUBLIC_` do build-info); `isProductionEnvironment` declarado fonte única e reimplementado inline 2×; ambiguidade preview (NODE_ENV=production na Vercel: preview sem CLAUDE_API_KEY falha o ACE em vez de usar o fake); `test:e2e` == `test:e2e:local` byte a byte; `.build-id`/`.e2e-run.lock` fora do `.gitignore`.

## 15. Segredos e dados sensíveis (redigido — sem valores)

**Git limpo (working tree + histórico completo)**: nenhum segredo real jamais versionado; hits de padrão são guards e fakes intencionais; dados pessoais 100% sintéticos (zero CPF, zero paciente real); `CREDENTIALS.md` só inventário; dump de produção **ausente do repo** (confirmar guarda externa — backlog S2). **Exposição concentrada em `.env.local` (não versionado)**: service role key de produção + API key de fornecedor + token de gestão da conta + connection string com senha do banco de produção + **duas senhas de contas humanas reais em comentário de texto claro** com e-mails — risco ALTO de vazamento por acidente único. **Mitigação de bundle confirmada na prática** (varredura de `.next` contra os valores reais: zero) — lacuna: o verificador só compara hosts. **Médios**: e-mail pessoal do proprietário tracked em `RUNBOOK.md:113` e `validation-lib.mjs:58`; fragmento de token em doc histórico. **Baixos**: credenciais de teste sintéticas, config local padrão, `.gitignore` verificado item a item.

## 16. Manutenibilidade

**Ativos**: comentário-de-porquê como memória de incidentes (ajuda de verdade — `use-story-draft`, `revalidate.ts`, `crm/repository`); domínio puro exemplar; meta-testes; consistência macro de idioma (domínio pt / infra en). **Passivos**: 3 invariantes de correção **exclusivamente em prosa**; comentários-lápide (50/657 linhas de `actions.ts` descrevem o que o arquivo não faz); ruído de idioma no nível de variável (inclusive dentro do mesmo tipo: `SelecaoCandidato`); dependência de conhecimento tácito nos 12 críticos (delete-all+insert, `persisted.closed` sempre true, `favorablePoints`); raio de explosão: **mudar uma frase de erro remove um botão; mudar um label quebra E2E; reordenar um array muda o documento do paciente; renomear uma rota silencia a revalidação; um terceiro status de história inverte a precedência lexicográfica.**

## 17. Relação com as Fases 1–4 (raiz estrutural de cada família)

| Achado das fases | Raiz de código |
|---|---|
| Atomicidade (F3 críticos 1–2) | curadoria/profiles sem RPC + antipadrão erro-descartado (4 pontos) |
| Invariantes sem banco (F4) | guardas nascidas na camada onde o bug apareceu, nunca promovidas; gabarito existente não replicado |
| Catálogo ×4 (F1/F3) | tipagem manual sem paridade + arrays hard-coded + teste de coerência incompleto |
| Rotas mortas/3 endereços (F2) | diretório nunca renomeado + rewrite permanente + strings de revalidação sem amarra |
| Órfãos (F2) | `actions-have-callers` cobrindo 4/12 módulos; componentes sem meta-teste equivalente |
| Decisões silenciosas (F4) | defaults sem comentário-no-schema (o padrão `contact_mode` existe e não foi replicado) |
| Docs defasados (F1) | invariantes e ADRs sem mecanismo de versionamento acoplado (§12 do MODELO ignorado impunemente) |
| Incidente 10-min (sessão atual) | porteiro morto + cadeia test:e2e incompleta + timeout sem teto de ação |

## 18. Achados por gravidade

**Críticos (5):** porteiro de ambiente morto + `test:e2e` sem build/stop-stale + 600s sem actionTimeout (buraco composto) · `favorablePoints: []` apagando o rascunho assistido no primeiro save (destrutivo, silencioso, atinge o documento do paciente) · controle de fluxo por substring de erro (botão "Regenerar" desaparece com uma correção de copy) · `revalidatePath` do Briefing apontando para rota legada (bug da classe já ocorrida em produção, ativo hoje) · concentração de segredos de produção + senhas humanas em texto claro no `.env.local`.

**Altos (12):** curadoria sem RPC de escrita (raiz da atomicidade) · regra-de-3 sem constante (10×) · ordem de apresentação sem proteção (6 pontos) · round-trip lossy dos pareceres (2 separadores, nenhum split) · 3 ciclos de módulo · contornos amarrados ao Next 15.5.20 sem guarda das premissas · `setEncaminhado` otimista sem reversão · zero testes nomeados em `profiles` · 4 componentes de maior escrita sem cobertura de unidade · enum fantasma (2 arquivos) sem mecanismo de paridade · `NEXT_PUBLIC_BUILD_TIME` com dupla avaliação · autorização de UI por `true` literal com policy em comentário.

**Médios (seleção):** nomes que mentem (5 actions) · invariantes em prosa (3) · `loadCuradoriaRecord` 267 linhas · duplicação parecer UI×domínio · 3 páginas com query própria · `*6` literal · `.slice(0,2)` sem nome · `dossie(now?)` · prop morta com query descartada · `explicitCompletionConfirmed` auto-preenchido · 8 env vars fora da doc · `isProductionEnvironment` reimplementado · e-mails do proprietário tracked · `platform/runtime` sem consumidor · `test:e2e`==`test:e2e:local` · trace local nunca gerado · comentários-lápide · ruído de idioma em tipo.

**Baixos/informativos:** módulos-promessa (ADR-004) · `.build-id`/locks fora do gitignore · `lint` depreciado · fragmento de token em doc histórico · search_path cosmético.

## 19. Estruturalmente sólido

Domínio puro do Método (motor, dossiê, relatório-inteligente, mesa, evidências) · meta-testes arquiteturais · fronteira componente↔dados absoluta · injeção de cliente por rota · módulo connection inteiro (o gabarito) · guardas de ambiente e build (env-guard, bundle-verify, ledger-check, trava de exclusão) · sistema de erros com referência (onde aplicado) · optimistic locking da história · git limpo de segredos com guards ativos contra regressão · zero ignores de build · a própria cultura de registrar incidentes no código.

## 20. O que favorece deriva ou regressão

As cinco estruturas do resumo executivo, mais: strings como contratos (mensagens, rotas de revalidação, labels que o E2E assere) · duplicação UI↔domínio sem teste de paridade · defaults de negócio sem comentário-no-schema · meta-testes com cobertura parcial (4/12 módulos) exatamente onde as órfãs passaram · tipagem manual sem cinto · conhecimento tácito concentrado (delete-all+insert; `persisted.closed`; premissa das rotas dinâmicas) · docs normativos sem acoplamento de versão.

## 21. Decisões necessárias

1. **Transação**: promover entrega/seleção/conversão/criação-de-paciente/competências a RPCs (gabarito interno pronto).
2. **Constante e paridade**: `SELECTION_SIZE`; teste de paridade enum↔banco (ou geração de tipos); teste de amarração das listas de `revalidatePath` às rotas reais; paridade parecer UI↔domínio; resultado de action tipado (fim do `includes`).
3. **Cadeia E2E**: religar o porteiro; `actionTimeout`/`navigationTimeout`; `test:e2e` com build-ou-verificação-de-atualidade; trace local.
4. **Runtime**: plano de upgrade do Next tratando as 3 dívidas como um pacote; guarda da premissa "rotas do paciente dinâmicas".
5. **Rotas**: pagar a renomeação do diretório do curador ou registrar o rewrite como permanente com teste dos alvos de revalidação; corrigir o Briefing.
6. **Higiene**: limpar `.env.local` (e rotacionar o exposto); mortos comprovados; `.gitignore` dos artefatos; env vars na doc.
7. **Cobertura**: `profiles` e os 4 componentes de escrita; estender `actions-have-callers` a 12/12.
8. **Nomes e invariantes**: renomear as 5 actions ou registrar o efeito no nome; promover os 3 invariantes-em-prosa a assertion/teste.

## 22. Veredicto

**"A arquitetura e o código ainda favorecem regressões ou perda de integridade."**

Não por falta de qualidade — o núcleo do domínio é dos melhores que uma auditoria encontra, e os mecanismos de defesa que existem (meta-testes, guardas de ambiente, memória de incidentes em comentário) são raros. O problema é de **distribuição**: as proteções nasceram onde os incidentes doeram e não foram generalizadas. O resultado é um sistema onde o mesmo tipo de mudança é seguro num módulo e destrutivo no vizinho — RPC aqui, três statements soltos ali; constante nomeada aqui, literal replicado em dez arquivos ali; comentário-no-schema aqui, default tácito ali. Para um produto cuja promessa central é imutabilidade e rastro, a sustentabilidade exige que o padrão da casa — que já existe e está provado — vire regra aplicada, não exemplo admirado.

*Nenhuma correção foi proposta em código, nenhum arquivo foi alterado ou removido.*
