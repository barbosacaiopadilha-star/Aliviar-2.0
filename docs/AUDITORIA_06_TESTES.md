# AUDITORIA 06 — TESTES, QUALIDADE E CONFIABILIDADE DA CERTIFICAÇÃO

**Data:** 2026-08-02 · **Fase:** 6 da Auditoria Geral (após Fases 1–5)
**Natureza:** inspeção somente — nenhum teste, código, configuração ou dado foi alterado; nenhuma suíte foi executada por esta auditoria.
**Pergunta:** *os testes demonstram de forma confiável que o sistema preserva o domínio, a segurança e a integridade — ou existem lacunas, falsos positivos e certificações frágeis?*

**Nota de método.** Três frentes de leitura (inventário/fixtures/oráculos; cobertura dos 20 críticos + travas + matriz negativa; meta-testes + RLS/migrations + padrões frágeis) + verificação direta de CI + análise de primeira mão da certificação 12/12, que foi conduzida nesta mesma sessão de trabalho — os incidentes citados nas §6–7 são observações diretas, não reconstrução.

## 1. Resumo executivo

**Veredicto: a estratégia de testes ainda possui lacunas que impedem confiança de produção.**

O retrato tem dois lados nítidos:

**O que é excepcional** — e está acima do padrão de mercado: a suíte de integração exercita **RLS com sessões reais** (login de verdade, nunca `set local role` — zero simulação), com **43 arquivos contendo 191 testes negativos** (a Fase 3 subestimou em 4×), atores múltiplos por cenário, limpeza por snapshot com sentinela final que prova "não sobrou nada", trava de exclusão mútua **realmente conectada dos dois lados**, fixtures que se recusam a pular o gatilho de publicação, e um teste de migration sobre dados sujos com 7 cenários incluindo os que exigem decisão humana. Os meta-testes arquiteturais são uma prática rara.

**O que mina a confiança** — em três camadas:

1. **Falsas proteções**: dos 20 críticos das Fases 1–5, **11 estão desprotegidos e 5 têm testes que travam o defeito como comportamento esperado**. O pior caso: `favorablePoints: []` (o apagamento do rascunho assistido) está **replicado em 8 arquivos de teste como payload normal** — consertar o defeito não faria um único teste falhar. A integração **bypassa a action de entrega** (chama os dois repositórios separadamente), então a não-atomicidade, o erro descartado e o sobrescrito de `emitted_at` nunca são exercitados. A RPC `open_case_from_lead` — que anula a própria guarda de idempotência — não tem uma linha de teste.
2. **Densidade invertida**: a matriz de testes negativos é forte exatamente onde **não há superfície de produto** (Concierge órfão: 24 casos; Mapa: 16) e vazia onde há (seleção, upload, conversão de lead, declaração de área). Testes robustos de domínio mascaram a ausência de interface — quatro vezes.
3. **A malha do E2E tem os buracos do próprio incidente vivido**: o porteiro de ambiente nunca executa; `test:e2e` não builda; sem `actionTimeout`, uma ação travada consome os 600s inteiros; `trace` nunca é gerado localmente (`retries:0` + `on-first-retry`); **19 de 24 specs não limpam nada** (a explicação estrutural dos 156 profissionais acumulados — o incidente que a integração resolveu e o E2E reabriu); **zero oráculos de banco** em todo o E2E (a certificação prova que a tela *diz* que entregou, nunca que entregou); e **não existe CI** — nenhuma suíte bloqueia merge algum.

## 2. Inventário

Números reais (as fases anteriores contavam *arquivos*, incluindo helpers): **~1.516 testes unit** (136 arquivos, dos quais 33 são testes de arquitetura estática sobre código-fonte) · **~404 integration** (47 arquivos + 7 helpers; banco real, sessões reais, `fileParallelism:false`, snapshot+sentinela) · **~386 components** (47 arquivos; jsdom, spies) · **~132 e2e** (24 specs; browser + `next start`, `fullyParallel`, workers ilimitados fora de CI) · **6 golden** (LLM real, gated por env). Infra notável: `limpeza/inventario.ts` (385 linhas, ordem de FK explícita, descarte via RPC real, falha de deleteUser **lança**), `zz-sentinela` (igualdade com baseline), `execucao-exclusiva.ts` (PID+suite+projeto+execução; conectada em `playwright.config:96-97` e `vitest.integration.config:12` — **verificado chamador a chamador**).

## 3. Matriz de cobertura por domínio (síntese)

| Domínio | Positiva | Negativa | Concorrência | Idempotência | Falha parcial | Autorização | Persistência conferida | Estado final | Auditoria |
|---|---|---|---|---|---|---|---|---|---|
| História | ✅ | ✅ | ✅ (revision) | parcial | — | ✅ | parcial (retorno, não banco) | ❌ (regressão de status) | via versões |
| Documentos/upload | ✅ | ❌ (só anexo alheio) | — | — | ✅ (compensação) | ✅ | ✅ | ❌ | — |
| Perfil/Mapa | ✅ | ✅ (9) | — | — | — | ✅ | ✅ | ❌ (pós-VALIDATED) | ❌ |
| Portas/Rede | ✅ | ✅ | — | upsert | — | ✅ | ✅ | ❌ (redeclaração) | ❌ |
| Seleção | ✅ | **❌** | **❌** | **❌** | **❌** | parcial | parcial | **❌** (trigger nunca provado) | ❌ |
| Relatório/entrega | ✅ | parcial | ❌ | ❌ | **❌** | parcial | **bypassa a action** | ❌ (lifecycle não provado) | ❌ |
| Profissional/publicação | ✅ | ✅✅ (12) | — | — | — | ✅ | ✅ | ✅ (gate) | — |
| Connection/Relationship | ✅ | ✅✅ | ✅ (real) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRM/Atendente/conversão | pura apenas | **pura apenas** (a action não usa a função testada) | ❌ | falsa (função não importada) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Concierge (aproximação) | ✅✅ (24, por RPC) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ — **sem superfície** |
| Segurança/RLS | ✅✅ | ✅✅ (191) | — | — | — | ✅✅ | ✅ | — | — |
| Migrations | dados sujos ✅ (7 cenários) | guardas ✅ | — | — | — | — | — | rollback **❌** | — |
| Build/ambiente | ✅✅ (env-guard executa scripts reais) | ✅ | — | — | — | — | — | — | — |

## 4. Cobertura dos críticos (20 itens — tabela integral no relatório da frente 2)

**FALSA PROTEÇÃO (5):** #1 competências (o teste fixa a entrada da destruição e nada asserta a jusante) · #2 autosave (os testes normalizam o engolimento do erro; nenhum renderiza o indicador que mente) · #8 SUPERSEDED (testes de função pura para um estado que nada escreve) · #14/15/16 (domínio testado mascarando superfície ausente) · #17 favorablePoints (8 arquivos replicam).
**DESPROTEGIDOS (11):** história editável/regressível · entrega não-atômica+P2 · emitted_at · seleção mutável · mapa pós-reconhecimento · lead-fantasma · duplicação de Case (#10 — zero testes na RPC) · endpoint de leads (testes existentes leem strings do handler; o middleware nunca é tocado) · upload · F2 (delete de documento anexado — só leitura coberta) · Briefing revalidando rota legada (os dois guardas de revalidação são allowlists estreitas que não varrem `briefing/`).
**PARCIAL:** #19 catálogo (compara conceitos/grupos/nomes; **não compara opções, códigos de opção, ordem, tipos**) · #20 actions-have-callers (**25 de 104 actions, 4 de 27 módulos**; mecanismo `includes` sobre blob sem remover comentários — o próprio arquivo órfão satisfaz a asserção das 3 actions do MandatoryFilters).

## 5. Testes que travam defeitos

Além dos acima: `revalidacao-caminhos-vigentes` fixa `window.location.reload()` como contrato — **trava de dívida legítima na intenção** (cita incidente, versão, variantes) **mas sem cláusula de saída** (proíbe para sempre a volta ao padrão correto quando o bug do Next for corrigido) **e com mecanismo frágil** (ordem de índice de string). Distinção importante: esta é documentada; as de `favorablePoints` e do autosave não têm nem intenção declarada.

## 6. Falsos positivos (com os incidentes da certificação como evidência)

- **Asserção tautológica**: `sua-historia-persistence.spec.ts:80` — o teste "história enviada não pode ser editada" aceita o heading de rascunho **ou** o de enviada; passa nos dois mundos. Sintoma da dependência de conta compartilhada entre execuções (§7).
- **Espera que não espera**: `reconstrucao:290-294` — `toHaveCount(0)` de "Salvando…" é satisfeito **antes** de o indicador montar, ×28 iterações com `force:true`. O trecho mais provável de flake da suíte.
- **Seletor posicional puro**: `reconstrucao:404` — `locator("textarea").last()`; qualquer textarea novo redireciona a escrita em silêncio.
- **Cliques sem confirmação intermediária**: duplo `selecionar.first().click()` (:376-379); "Salvar rascunho"→"Emitir" sem confirmar o primeiro (:426-427).
- **Vivido nesta certificação**: 6 correções de spec foram necessárias *durante* a execução (aba errada com nomes visíveis via painel lateral — os `expect` de visibilidade passavam pela razão errada; 3 rótulos de botão errados que penduraram cliques por até 10 minutos; 2 seletores ambíguos de strict mode; 1 assert de estado que não correspondia ao desenho real). Cada uma dessas era um falso-verde ou um falso-vermelho em potencial.
- **Positivo a registrar**: a doutrina "persistência OBSERVADA, nunca presumida" (`reconstrucao:255`) e `admin-professionals.spec.ts` (cada clique com confirmação + `toBeChecked` pós-reload) são o modelo — construído incidente a incidente, não universalizado.

## 7. Falsos negativos e flakes

`retries:0` local + `trace:"on-first-retry"` = **zero traces onde se diagnostica** (screenshot/video em `off`) · `reuseExistingServer` + `test:e2e` sem build + porteiro morto = o buraco dos 10 minutos · `actionTimeout` ausente (default 0 = ilimitado) — as defesas por-wait de 15s existem só onde alguém já se queimou · **E2E paralelo local** (workers=CPU/2) sobre banco único e 3 specs compartilhando a mesma conta `paciente` — a trava protege *entre* suítes, nada protege *dentro* do E2E · regexes de URL frouxas em 3 pontos dos 2 specs maiores · container Docker hardcoded em 4 testes de integração · classificação produto/automação/ambiente/fixture das falhas: **não mecanizada** — nesta certificação, cada uma das ~10 falhas exigiu diagnóstico humano (e 2 delas consumiram timeouts de 10 minutos antes de qualquer evidência).

## 8. Isolamento

Trava entre suítes: **conectada e correta** (PID-reuse tratado; ressalvas: por projeto e não por banco — dois clones se atropelam; locks fora do `.gitignore`). **Dentro do E2E: nada** — 19/24 specs sem limpeza; `reconstrucao` cria 5 profissionais publicados operacionais + paciente + Case + entrega **por execução e não apaga**; esses perfis entram na baseline da integração se o E2E rodar antes. Storage nunca limpo (nenhum `remove` em tests/). Auth órfãos: integração limpa e verifica duplamente; 5 specs e2e limpam com erro-observado-não-interrompe; 19 não limpam. `SEED_MESA` no ambiente **desliga toda a limpeza da integração em silêncio**.

## 9. Ambiente

Validado o achado da Fase 5 por dois auditores independentes: **`ambiente-integro.setup.ts` nunca executa** (`.setup.ts` não casa o testMatch default; zero referências; sem projects/dependencies). Cadeia oficial `test:e2e` = ledger→verify-backend→playwright: garante o *backend* do bundle, **não a atualidade** dele. `assertLocalSupabase` no topo do config: real e correto. Fallbacks `?? ""` das keys no webServer: falham tarde, dentro do primeiro teste, como erro de aplicação.

## 10. Fixtures e seeds

**Dois regimes opostos convivem**: `certificacao-fixture`/`rede-fixture`/`createDeliveredCase` **recusam-se a pular o gatilho** (publicam pelo trigger real; percorrem o fluxo função a função) — com comentários justificando; `legacy-ace-chain-fixture` (745 linhas) **insere HumanReview/entrega terminais por SQL puro** — os testes de histórico ACE leem estados que nenhum fluxo produziu. `seed.sql` bypassa até o GoTrue (mas exercita `handle_new_user`). 8 specs e2e preparam por service-role (ex.: história marcada `enviada` por UPDATE) — se a UI de envio quebrar, `connection-choice` continua verde. Riscos pontuais: fixture publicada com `tags:[]`/domínio neutro (motores de área passam por vacuidade); 6 contas permanentes compartilhadas em estado genérico.

## 11. Migrations e RLS

Cobertura negativa de RLS: **43 arquivos / 191 testes** — padrão sessão-real multi-ator exemplar. SECURITY DEFINER: `documento_esta_em_case_do_curador` (exemplar: search_path+prosecdef+grants+5 atores), `discard_case_admin`, grants canônicos via `has_function_privilege` — cobertos; **`acknowledge_priority_profile` (o ato central da ADR-042) sem nenhum teste**, e todo o eixo CRM (`convert_lead`, `open_case_from_lead`, `qualify_lead`) idem. Triggers: **8 com recusa provada, 6 sem prova, 4 parciais** — os sem-prova concentrados no ciclo Relatório/Seleção (`enforce_selection_has_three`, `enforce_report_has_three`, `assert_report_lifecycle`), exatamente onde o E2E cobre a interface e cria impressão de cobertura. Dados sujos: `consolidacao-rascunhos-duplicados` (7 cenários) — ressalva: **transcreve o SQL em vez de ler a migration** (o padrão certo existe em `catalogos-coerentes`). Rollback: **zero testes**. 23505: bem coberto nos dois lados da fronteira, incluindo não-vazamento na UI.

## 12. Testes negativos (matriz — íntegra no relatório da frente 2)

Linhas densas: Concierge (15), publicação (12), certificação (12), Mapa (9) — **as duas primeiras sem superfície de produto**. Linhas vazias: **seleção** (nenhum negativo real), **declaração de área** (nenhum), **upload** (só posse de anexo alheio), **conversão de lead** (todos os negativos são de uma função pura que a action não importa — falsa sensação de idempotência coberta). Entrega: sem ator-errado, sem estado-errado, sem repetição.

## 13. Oráculos

Integration: **banco na maioria** (699 `.from(` em asserts) — forte; exceções que só reconferem o próprio retorno (`team` — que já deixou papel vazar por isso; `patient-stories`). E2E: **DOM/URL/texto exclusivamente — zero verificação de banco pós-ação em 24 specs**. Oráculos-modelo: `descarte-de-case` ("o outro Case continua existindo"; "falha no meio desfaz tudo" com contagem de audit), `relationship-persistence` (concorrência real: "exatamente uma sucede", contando eventos; recusa **sem gravação parcial**), sentinela (igualdade de 6 contagens). "Criou só 1?" quase nunca perguntado fora desses. Components: spy = intenção, nunca efeito (correto para a camada; descoberto quando o E2E acima também só olha texto).

## 14. Meta-testes (15 auditados — robustez individual)

**Robustos**: `env-guard` (executa os scripts reais + valida package.json), `canonical-function-grants` (pergunta ao catálogo, asserta o tamanho do resultado), `autoridade-vigente` (híbrido import+grep; buracos estreitos: janela de 200 chars; % só em 2 pastas). **Frágeis**: `actions-have-callers` (4/27 módulos; `includes` sem tirar comentários; satisfeito por órfão); `journey-no-orphans` (**`|| dinamica` anula a checagem inteira** — o [id] existente liga o bypass permanente; asserts de string exata de JSX); `paleta-unica` (lista de CSS hardcoded — cobre 100% *por coincidência*); `governanca-alcancavel` (`slice(0, indexOf)` devolve o arquivo quase inteiro se `-1`); `erros-rastreaveis` (testa a lib; **nada exige que as 104 actions a usem** — a promessa do cabeçalho é maior que o teste); `forbidden-vocabulary` (testa política *inventada*; nenhum teste prova que a real é aplicada a texto que chega ao usuário); `revalidacao-caminhos-vigentes` (allowlist de 2 caminhos; ordem de índices); `catalogos-coerentes` (lê 1 migration hardcoded; não cobre opções/ordem).

## 15. Performance

Green run do E2E completo: **~72s** (12 testes; passos de 0,1s a 12,9s). Cada falha por rótulo/aba errada: **10–11 minutos** (600s de timeout + overhead) — nesta certificação, 2 falhas dessas custaram ~21 minutos contra ~90s de execução útil. Integration: serializada por necessidade (justificada em comentário), sentinela por último. Unit: rápida, **exceto** `env-guard`/`migration-ledger` (6 subprocessos com timeouts de 30–60s dentro da suíte "rápida"). Build:local completo: ~2min. Paralelismo seguro possível: E2E por worker com namespace (hoje é paralelo *inseguro*); nada mais recomendável antes das correções de isolamento.

## 16. Certificação 12/12 — o que provou e o que não provou

**Provou (valor real, não retirado):** o fluxo completo Admin→Curador→Paciente **pela interface**, com dados nascidos na própria execução (nunca seed — verificado por stamp), asserts de comportamento (contagens, navegação, negativos de conteúdo: sem score/ranking/200 pontos, excluídos ausentes), bloqueio de <3 pela pendência real, persistência ao reabrir em 3 pontos, reconhecimento condicionado ao Mapa completo, entrega em duas etapas, e o painel final da paciente. Em build de produção verificado (buildId×3, bundle-backend). É uma prova legítima de que **o caminho principal existe e funciona de ponta a ponta**.

**Não provou:** persistência real de nenhum passo (zero oráculos de banco — "entregou" = o texto "entregue" ficou visível); nenhum caminho negativo de autorização (vive em spec separado que cobre 3 dos 6 papéis); nenhuma invariante de imutabilidade (as Fases 3–4 mostraram que são violáveis — o E2E nem tentaria); atomicidade de nada; idempotência de nada (o duplo clique é prevenido por `disabled`, não testado contra o servidor).

**Dependeu de workarounds:** o passo 8 só passa por `window.location.reload()` (RECONHECE-REFRESH-001) e o passo 5 por âncora de documento (NAV-COMMIT-001) — a certificação valida o produto *com* os contornos, e os contornos têm regressões que os fixam.

**Interferência de dados acumulados:** real e contornada — a Rede tinha ~116-156 profissionais de execuções anteriores; os seletores precisaram de escopo (`.last()` no cartão, busca por stamp) e o painel "Quem não participa (133)" evidencia o acúmulo. A certificação **não limpou atrás de si** (5+ perfis publicados adicionados por execução).

**Reprodutibilidade:** parcial — o comando oficial `test:e2e` **não rebuilda**; a certificação só é fiel com `build:local` manual antes, e essa exigência não está codificada em lugar nenhum. Artefatos: saída de console + error-contexts das falhas; sem trace (retries:0), sem vídeo, sem relatório HTML persistido.

**Delimitação honesta:** a certificação 12/12 é uma prova de *existência e coerência do caminho feliz na interface*, executada com disciplina acima da média (stamps, asserts negativos de conteúdo, persistência-por-reabertura). Não é — e não poderia ser — uma prova de integridade, atomicidade, imutabilidade ou segurança, que são exatamente as dimensões onde as Fases 3–4 encontraram os riscos.

## 17. CI

**Não existe** — verificado diretamente: sem `.github/`, sem workflows, sem `vercel.json` versionado. Nenhuma suíte roda em PR ou main; nenhum bloqueio de merge; os meta-testes que guardam as invariantes do Método dependem de alguém lembrar de rodá-los. Backlog I1 confirmado, agora com o agravante das seis fases: **toda a malha de proteção descrita neste documento é opcional na prática.**

## 18. Achados por gravidade

**Críticos (7):** 5 falsas proteções (destaque: favorablePoints ×8 arquivos; competências) · integração bypassa a action de entrega (não-atomicidade jamais exercitada) · `open_case_from_lead` sem teste com guarda auto-anulada · porteiro morto + test:e2e sem build + sem actionTimeout + sem trace local (o pacote do incidente) · E2E sem limpeza/sentinela/oráculo de banco · densidade invertida da matriz negativa · ausência total de CI.

**Altos (10):** `acknowledge_priority_profile` sem teste · triggers do ciclo Relatório/Seleção sem prova de recusa · `journey-no-orphans` auto-anulado · `actions-have-callers` 25/104 · asserção tautológica da imutabilidade da história · race dos 28 checkboxes · `textarea.last()` · specs `sua-historia*` dependentes de conta compartilhada · `erros-rastreaveis`/`forbidden-vocabulary` prometendo mais do que testam · E2E paralelo local sobre estado compartilhado.

**Médios (seleção):** SQL transcrito na consolidação · rollback sem teste · paleta com lista hardcoded · `governanca-alcancavel` slice frágil · eixo CRM zero coberto · storage nunca limpo · `SEED_MESA` desliga limpeza em silêncio · subprocessos caros na suíte unit · container hardcoded ×4 · locks fora do gitignore.

## 19. O que é confiável

A malha de integração inteira (RLS multi-ator com sessão real; 191 negativos; sentinela; trava; limpeza que lança; 23505 dos dois lados; publicação com 12 negativos; Connection/Relationship com concorrência real e prova de não-gravação-parcial) · `descarte-de-case` e `relationship-persistence` como oráculos-modelo · `certificacao-fixture` · `env-guard`/`canonical-function-grants` · a doutrina de persistência-observada do spec principal · a análise de dados sujos da consolidação.

## 20. O que produz falsa segurança

As 5 travas de defeito · os 4 mascaramentos domínio-sem-superfície · o E2E como prova de persistência (não é) · os meta-testes de escopo parcial lidos como guardas totais (`actions-have-callers`, `paleta-unica`, `erros-rastreaveis`, `forbidden-vocabulary`, `journey-no-orphans`) · a cobertura "de entrega" que nunca chama a entrega · os testes puros de conversão de lead que a action não usa · a contagem de arquivos lida como contagem de testes.

## 21. Decisões necessárias

1. **Desarmar as 5 travas de defeito** junto com a correção de cada defeito (senão a correção quebra 8 arquivos sem explicação — ou pior, ninguém corrige porque "os testes passam").
2. **Uma suíte de invariantes de banco**: os 6 triggers sem prova + as violações que as Fases 3–4 listaram como contornáveis (cada linha da matriz §16 da Fase 4 vira um teste que hoje **falharia** — é a definição de reproduzir antes de corrigir).
3. **Actions como camada testada**: hoje zero testes de integração chamam qualquer Server Action — decidir o mecanismo (harness de action com sessão? contrato?) e cobrir ao menos as 8 operações compostas críticas.
4. **E2E: pacote de honestidade** — religar o porteiro; `actionTimeout`/`navigationTimeout`; `trace: retain-on-failure` local; oráculo de banco nos 3 momentos terminais (entrega, reconhecimento, publicação); limpeza-ou-namespace por spec; workers=1 até haver isolamento.
5. **CI mínimo** (I1): unit+components+meta-testes em PR já pagaria a maior parte do risco de deriva; integration/E2E por job com stack.
6. **Ampliar os guardas parciais**: actions-have-callers 27/27 com mecanismo de import real; paleta por glob; revalidação por varredura genérica de `src/modules`.
7. **Política de fixtures**: proibir o padrão `legacy-ace-chain` para domínio vigente (SQL só para legado congelado, com rótulo).

## 22–23. Veredicto

**"A estratégia de testes ainda possui lacunas que impedem confiança de produção."**

Com a delimitação justa: a camada de **segurança de acesso** é genuinamente bem testada — se o veredito fosse só sobre RLS, seria positivo, e a infraestrutura de isolamento da integração é um ativo raro. Mas confiança de produção exige que os testes protejam os riscos *reais* deste sistema — que as Fases 1–5 identificaram com precisão: imutabilidade, atomicidade, autoridade e superfícies ausentes. Nessas dimensões, a suíte hoje não apenas não protege: em cinco pontos ela **certifica o defeito**, em quatro ela **mascara a ausência de produto**, e a única execução que amarra tudo (o E2E) confirma texto na tela, acumula dados operacionais e roda sem porteiro, sem trace, sem CI e sem nenhum oráculo de persistência. A certificação 12/12 mantém seu valor — prova de existência do caminho feliz pela interface, com disciplina real — desde que ninguém a leia como prova de integridade. Os padrões para fechar cada lacuna já existem dentro do próprio repositório; como nas fases anteriores, o que falta é generalização, não invenção.

*Nenhum teste, código ou configuração foi alterado por esta auditoria.*
