# RELEASE CHARTER — RELEASE DE REMEDIAÇÃO DO ALIVIAR

**Data do congelamento:** 2026-08-02 · **Fase 0A** da Fase de Execução
**Autoridade desta Release (fixa, fechada):** `AUDITORIA_GERAL_CONSOLIDADA.md` · `REGISTRO_UNICO_DE_ACHADOS.md` · `GO_NO_GO_FINAL.md` · `MASTER_REMEDIATION_PLAN.md`
**Regime:** nenhuma nova auditoria será aberta; nenhum novo requisito será incorporado; nenhuma funcionalidade nova será aceita.

---

## Objetivo da Release

Levar o Aliviar do veredicto **NO-GO** (2026-08-02) a um estado julgável como **GO** pela mesma régua (`GO_NO_GO_FINAL.md §6`), executando o `MASTER_REMEDIATION_PLAN.md` bloco a bloco: fechar os 15 P0, tratar os 27 P1 (correção ou aceite formal por escrito), registrar as 21 decisões do responsável (D-01..D-21) e satisfazer o checklist operacional de 11 critérios da Fase 9 §27 — **sem reconstruir nada do núcleo** (a lista do que está sólido, `AUDITORIA_GERAL_CONSOLIDADA.md §7`, é intocável por reescrita).

## Escopo

Está incluído nesta release, exclusivamente:

1. Os **68 achados** do `REGISTRO_UNICO_DE_ACHADOS.md`, pela organização em blocos do Plano Mestre (15 P0 obrigatórios; 27 P1 corrigidos ou aceitos por escrito; P2/P3 conforme os blocos K/I os cobrirem ou receberem prazo registrado).
2. As **decisões D-01..D-21**, convertidas em ADRs quando decididas.
3. As **migrations** previstas nos blocos B, C, E, H (e as 5 já pendentes), aplicadas remotamente apenas no Bloco J.
4. Os **testes** dos blocos G1/G2 e os exigidos pelos critérios de aceite por bloco.
5. A **documentação** listada no Plano Mestre §7 (runbooks, dossiê 2.0, política de privacidade, ADRs, MODELO/MANUAL conforme D-17).
6. O **versionamento e a publicação** (Blocos 0 e J).

## Fora do escopo

Automaticamente **fora** desta release — sem exceção por conveniência:

- Qualquer **funcionalidade nova** não derivada de um achado do Registro (novas telas além das decididas em D-03/D-04, novos fluxos, novas integrações, melhorias de produto).
- Qualquer **alteração de domínio/Método** que não seja a regularização já mapeada (D-01, D-06, D-07, D-16). Mudanças conceituais novas = outra release.
- Qualquer **ADR nova** fora da lista do Plano Mestre §7. Uma necessidade de ADR imprevista é, por definição, mudança de escopo (ver critério abaixo).
- Os itens **explicitamente fora do bloqueio** (`GO_NO_GO_FINAL.md §7`): reativação do ACE, reconstruções, staging se D-12 aceitar operar sem, desconhecidos de capacidade, upgrade do Next (apenas planejado em K, não executado).
- **Refactors oportunistas**: nenhuma correção "de carona" sem ID do Registro (regra do checklist de bloco).
- Evolução orientada a evidências do Observatório, CI (Compatibility Intelligence), Landing/filme, e qualquer item dos backlogs que não seja um achado.

## Estado atual (resumo do diagnóstico)

- **68 achados únicos** consolidados de ~200 brutos das 9 auditorias — `REGISTRO_UNICO_DE_ACHADOS.md`.
- **13 causas raiz** (CR-1..CR-13) — `AUDITORIA_GERAL_CONSOLIDADA.md §4`.
- **15 P0 · 27 P1 · 22 P2 · 4 P3.**
- **Veredicto vigente: NO-GO** — `GO_NO_GO_FINAL.md` ("O Aliviar não pode ir para produção neste estado.").
- Diagnóstico-síntese: o Método está implementado, fiel e certificado (E2E 12/12, build `fd031d9-msbh0tko`); os bloqueadores são de **consolidação** (versionamento, integridade sob credencial legítima, atomicidade, operação, privacidade, governança), não de reconstrução.

## Blocos aprovados

Exatamente os do `MASTER_REMEDIATION_PLAN.md`, na ordem lá definida (sequência ótima §8, DAG §3), sem alteração:

| # | Bloco | Fase da sequência |
| --- | --- | --- |
| 0 | Fundação: versionar e estancar | 1º — bloqueia tudo |
| A | Governança das decisões | 2º (∥ G1, I-início) |
| G1 | Rede de segurança de testes | 2º (∥ A) |
| I | Operação, observabilidade e recuperação | inicia no 2º, conclui no penúltimo |
| B | Atomicidade | 3º (∥ D) |
| D | Falso sucesso e silêncios | 3º (∥ B) |
| C | Imutabilidade e auditoria | 4º (após B; ∥ E) |
| E | Fonte única | 4º (∥ C) |
| F | Superfícies e papéis | 5º (∥ H) |
| H | Privacidade e dado clínico | 5º (∥ F) |
| G2 | Honestidade do E2E | 6º |
| J | Publicação controlada | último técnico — único que toca produção |
| K | Documentação canônica e higiene | paralelo contínuo; fecha por último |

Aprovação humana de bloco é **obrigatória** em 0, A, C, G2 e J antes de liberar dependentes (checklist do Plano §10).

## Critério de aceite (de um bloco)

Um bloco está concluído quando — e somente quando — o **checklist de conclusão do Plano Mestre §10** está integralmente satisfeito:

1. Todos os achados do bloco marcados `encerrado` no Registro, com commit e evidência do critério de encerramento de cada um.
2. Testes que falhavam → verdes; nenhuma trava desarmada sem a correção no mesmo commit; nenhum teste skipped.
3. Suíte completa local verde + **E2E do fluxo completo verde** no estado do branch.
4. Migrations (se houver) com rollback no próprio arquivo, aplicadas somente no local.
5. ADRs/docs do bloco atualizados; nenhuma auditoria histórica editada.
6. Diff auditado contra o escopo (nada sem ID).
7. CI verde (a partir de G1).
8. Registro de conclusão (o que fechou; o que ficou explicitamente fora).
9. Aprovação humana onde obrigatória.

## Critério de encerramento da release (volta ao GO)

A release encerra com um **novo julgamento GO/NO-GO pela régua do `GO_NO_GO_FINAL.md §6`**, que exige:

1. **Zero P0 abertos**, cada um encerrado pelo seu critério objetivo (não por reclassificação).
2. **P1 fechados ou aceitos por escrito** pelo responsável, item a item, com risco e prazo (silêncio não é aceite).
3. **Decisões D-01, D-02, D-06, D-08, D-09, D-11..D-15 tomadas e registradas** (demais podem ter prazo).
4. **Checklist operacional da Fase 9 §27: 11/11** — incluindo restore testado e smoke canônico executado.
5. **Prova de regressão**: a suíte de invariantes (G1) escrita antes, vermelha contra o estado auditado, verde após as correções.
6. Bloco J executado (produção rodando o código versionado + migrations aplicadas + smoke OK).
7. Julgamento área a área (10 áreas) e veredicto único emitido em documento próprio.

## Critério de reabertura (novo problema → outra release)

Durante a execução, um problema **novo** (não presente no Registro) segue esta régua:

- **Se impede a conclusão de um bloco em andamento** (quebra o critério de aceite): registrado como sub-achado do bloco (`<ID-do-bloco>-Nx`), corrigido dentro dele — não é mudança de escopo, é descoberta de execução.
- **Se é independente dos blocos**: registrado num anexo do Registro (`ACHADOS_POS_AUDITORIA`) com gravidade e **não entra nesta release** — vira insumo da próxima, **exceto** se for P0 pela escala (perda/corrupção silenciosa, exposição, credencial, dado clínico), caso em que o responsável decide explicitamente: incorporar (com registro de mudança de escopo) ou pausar a release.
- **Após o encerramento**: qualquer problema novo abre outra release; esta não reabre. Regressões do que esta release corrigiu são falha do critério de regressão da próxima, tratadas lá.

## Critério para mudanças de escopo

**Qualquer funcionalidade nova · qualquer alteração de domínio · qualquer mudança de ADR fora da lista do Plano §7 — fica automaticamente fora desta release.** Sem exceções implícitas: se surgir uma necessidade real, o caminho é (1) registrar a proposta em uma linha no anexo do Registro, (2) seguir o rito da casa para ideia nova (Conselho de Guardiões / avaliação), (3) aguardar a próxima release. A única autoridade capaz de alterar o escopo desta release é uma instrução explícita e por escrito do responsável, que será registrada no próprio Charter como emenda datada.

---

## Preservação — reconfirmação (2026-08-02, Fase 0A)

| Verificação | Resultado |
| --- | --- |
| Localização externa | `C:\Users\barbo\aliviar-preservacao\2026-08-02_fd031d9\` (fora do repositório) |
| Checksum do arquivo | `sha256sum -c SHA256SUM.txt` → **OK** — `d99b3e8043ac7249766d63b9d6fa2af8833992414dd775baeee3172940ac6823` |
| Conteúdo interno | 8 artefatos íntegros: HEAD.txt (=`fd031d9…f5`), git-status, listas de modificados/untracked, filtro (vazio), `tracked-diff.patch`, `untracked-files.tar.gz` |
| **Árvore íntegra** | HEAD atual = HEAD preservado (`fd031d9`); **diff dos rastreados byte-idêntico ao preservado** (`5696d854…9d4c` = `5696d854…9d4c`) |
| **Release íntegra** | os 57 arquivos untracked da release preservados; únicos deltas pós-preservação = **5 documentos da própria auditoria** (AUDITORIA_09, CONSOLIDADA, REGISTRO, GO_NO_GO, MASTER_REMEDIATION_PLAN) + este Charter — nenhuma linha de código, migration ou teste mudou desde a certificação |
| Zero segredos | filtro de exclusão retornou vazio (nada precisou ser removido; `.env*`/`node_modules`/`.next` já fora por `.gitignore`) |
| Reconstrutibilidade | `git checkout fd031d9` + `tracked-diff.patch` + `untracked-files.tar.gz` = árvore certificada exata |
| Risco residual | a preservação vive no **mesmo disco** da máquina de desenvolvimento — mitigado definitivamente pelo commit do Bloco 0; até lá, recomenda-se uma cópia do `.tar.gz` em mídia/nuvem do responsável (ação dele, fora do alcance dos agentes) |

## Plano de versionamento (nenhum commit foi feito nesta fase)

**Quais commits, em que ordem:**

1. **Commit 1 — a release certificada + a auditoria** (Bloco 0): `git add -A` da árvore atual **após** (a) higiene do `.gitignore` (`.build-id`, `.e2e-run.lock`, locks) e (b) remoção das 2 linhas de senha do `.env.local` (arquivo não versionado, mas a limpeza precede qualquer ato para eliminar o risco de inclusão acidental). Conteúdo: os 155 modificados + 1 staged + os 57 untracked da release + os 6 documentos da Fase 9/10/0A. Mensagem proposta: `release(reconstrucao): versionar o estado certificado 12/12 + Auditoria Geral (fases 1-10) e charter da remediação`. **Um único commit** — a release é um estado atômico certificado; fatiá-lo criaria estados intermediários que nunca existiram nem foram testados.
2. **Commit 2 — registro do incidente de credenciais** (Bloco 0, após a rotação pelo responsável): CREDENTIALS.md com o registro da rotação (sem valores) + CHANGELOG com a entrada da release.
3. **Commits seguintes**: um por achado resolvido, por bloco, em branch de bloco (regra do Plano §4) — fora do escopo da Fase 0A.

**Tag da release:** `reconstrucao-v1.2.0` sobre o **Commit 1** (o estado certificado). Racional: as tags de produto seguem `curadoria-v1.1.x`; esta é a linha sucessora. O nome exato pode ser ajustado pelo responsável antes da execução do Bloco 0 sem alterar o plano.

**Quando o commit ocorrerá:** na execução do **Bloco 0A do Plano Mestre**, imediatamente após a autorização explícita que sucede a aprovação deste Charter — não antes.

**Quando o branch será criado:** o Commit 1 e a tag nascem em `main` (o estado certificado É o novo baseline de `main`). Os **branches de bloco** (`remediacao/bloco-a`, `remediacao/bloco-g1`, …) nascem a partir da tag, cada um no início do seu bloco, e voltam a `main` por merge após o checklist de conclusão.

**Quando o deploy será permitido:** **somente no Bloco J**, com o checklist 11/11 da Fase 9 §27 satisfeito e autorização explícita na hora da janela. O `git push` do Commit 1 para o remoto `aliviar` será feito **com o auto-deploy da Vercel tratado antes** (pausa da integração ou push técnico coordenado — definido no runbook do Bloco 0), porque hoje um push a `main` dispara deploy, e publicar o código novo contra o banco antigo sem a janela do Bloco J é exatamente o cenário NO-GO documentado. Até o Bloco J, nenhum `db push`, nenhum deploy.

---

*Fase 0A executada: release oficialmente congelada. Nenhum bug corrigido, nenhum código alterado, nenhuma migration criada, nenhum commit feito, nenhum bloco técnico iniciado. Próximo passo — somente mediante autorização explícita: execução do Bloco 0 do Plano Mestre conforme o plano de versionamento acima.*
