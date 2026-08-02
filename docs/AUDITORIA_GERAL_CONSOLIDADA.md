# AUDITORIA GERAL CONSOLIDADA — ALIVIAR

**Data:** 2026-08-02 · **Fase 10** da Auditoria Geral (consolidação, GO/NO-GO e escopo de correções)
**Natureza:** análise e decisão somente. Nenhum código, banco, migration, teste, documento canônico ou credencial foi alterado. Artefatos desta fase: este documento, `REGISTRO_UNICO_DE_ACHADOS.md` e `GO_NO_GO_FINAL.md`.
**Fontes:** leitura integral das nove auditorias (`AUDITORIA_01..09`), todas de 2026-08-02, sobre HEAD `fd031d9` + working tree.

---

## 1. Resumo executivo

Nove auditorias, seis a sete frentes paralelas cada, produziram ~200 achados brutos. Consolidados e deduplicados, são **68 problemas distintos: 15 P0, 27 P1, 22 P2, 4 P3** (`REGISTRO_UNICO_DE_ACHADOS.md`).

O estado real cabe em três frases:

1. **O Método está implementado, fiel e certificado.** As quatro Portas com declaração humana, a Rede com política única, o Motor de 4 resultados sem nenhum score, a seleção de exatamente três com autoria, o Relatório qualitativo com proveniência, a fronteira da paciente intacta — tudo verificado com evidência, protegido por teste onde o teste existe, e provado ponta a ponta pelo E2E 12/12 em build de produção. Nenhuma violação dos princípios inegociáveis foi encontrada em código executável. **O código executa o Método aprovado com mais fidelidade do que os documentos o descrevem.**
2. **A confiança que o produto promete não está no sistema — está na interface e na boa vontade.** As imutabilidades centrais são reversíveis em silêncio por credencial legítima; as quatro operações compostas mais importantes não são atômicas (uma retorna sucesso numa falha real); quatro defeitos destroem ou perdem dados no caminho normal (competências, rascunho assistido, carimbo de emissão, história em sessão expirada); a Rede tem um fail-open que reabre a NC-22 no cenário de falha; e o canal de entrada de leads está morto sem que ninguém saiba.
3. **A operação em volta do produto não existe ainda.** A release certificada não é um commit; backup é uma contradição documental não verificada; rollback deixa de existir na primeira migration; credenciais expostas seguem sem rotação (com duas senhas humanas em claro, uma de paciente); não há política de privacidade num produto de dado clínico; não há alerta para nenhuma falha grave; e uma única pessoa — numa única conta — é o administrador, o curador, o aprovador, o respondedor de incidente e o cofre.

**Veredicto único (fundamentado em `GO_NO_GO_FINAL.md`): NO-GO.** Não é um NO-GO de reconstrução — nada do núcleo precisa ser reescrito. É um NO-GO de **consolidação**: fechar furos com padrões que já existem dentro do próprio repositório, tomar ~20 decisões que só o responsável pode tomar, e transformar uma operação que vive na memória de uma pessoa numa operação que sobrevive a ela.

## 2. Estado real do produto

**O que o Aliviar é hoje:** um produto funcional de ponta a ponta no caminho principal (Admin cadastra e publica → paciente conta a história e anexa → Case → Acolhimento → Mapa de 28 → reconhecimento pela paciente → Portas → Rede → seleção de 3 → Relatório assistido → entrega em 2 etapas → leitura, escolha e contato), rodando sobre um banco com RLS universal (`anon` a zero, 191 testes negativos com sessões reais), com um domínio puro de qualidade rara e uma voz de produto acima do padrão do setor. A virada ADR-042 (Mapa substitui pontos; reconhecimento é ato da paciente) é real e completa em código.

**O que o Aliviar ainda não é:** um sistema cuja promessa central — "o que foi reconhecido, emitido e entregue jamais muda, e toda mudança tem autor" — seja garantida pelo sistema em vez de pela interface; um produto operável por mais de uma pessoa; um serviço implantável, monitorável e recuperável; e um tratamento de dado de saúde com base documental de privacidade.

**A distância é enumerável.** Os 15 P0 e 27 P1 do Registro têm, em sua maioria, o gabarito de correção **dentro do próprio repositório**: o módulo Connection é o modelo das RPCs transacionais que faltam à Curadoria; `case_responsibility_changes` é o modelo da auditoria que falta à tríade administrativa; o trigger de anti-contaminação demo/fixture é o modelo da imutabilidade que falta aos estados finais; a compensação do upload é o modelo do tratamento de erro que falta à entrega; a limpeza da suíte de integração é o modelo que falta ao E2E. O padrão transversal de todas as fases: **a casa sabe fazer certo e prova isso em vários lugares — as proteções nasceram onde os incidentes doeram e nunca foram generalizadas.**

## 3. Síntese das nove auditorias

| Fase | Pergunta | Veredicto emitido | Núcleo |
| --- | --- | --- | --- |
| 1 Domínio | implementado = aprovado? | "ainda possui divergências" | Método aderente e protegido; Catálogo TS×banco divergente (4 fontes); decisões sem ADR; MODELO defasado |
| 2 Funcional | tudo completo e coerente? | "ainda possui lacunas" | 7 críticos (C1..C7); domínio-pronto-superfície-ausente como padrão dominante; 14 actions órfãs |
| 3 Banco | o banco preserva as regras sem a interface? | "ainda possui riscos" | invariantes sem guarda; ~22 ops sem transação; catálogo com dois donos; auditoria bipolar; dossiê remoto NÃO PRONTO |
| 4 Invariantes | quem garante cada regra? | NO-GO no coração do Método | acesso GO; trilhos GO; imutabilidades centrais com zero/meia camada; fail-open/silent mapeados |
| 5 Código | a arquitetura favorece deriva? | "ainda favorece regressões" | curadoria sem RPC; strings como contratos; porteiro E2E morto; segredos concentrados |
| 6 Testes | a certificação é confiável? | "lacunas impedem confiança" | 5 falsas proteções; densidade invertida; E2E sem oráculo de banco; CI inexistente |
| 7 UX | a experiência é compreensível e segura? | "riscos de compreensão/confiança" | promessas não sustentadas; papéis cobrados pelo impossível; destruição sem confirmação; 6 furos a11y |
| 8 Histórico | o registro impede deriva? | "ainda permite deriva" | release untracked; Catálogo sem aprovação; supersessão invisível; 98 docs fora do índice; decisões só-na-memória |
| 9 Produção | dá para operar e recuperar? | "operação não está pronta" | release não implantável; backup/rollback inexistentes; zero detecção; incidente de credenciais; bus factor 1 |

Nenhum veredicto de fase foi refutado pela consolidação; as correções de premissa (§6) são pontuais e estão incorporadas.

## 4. Causas raiz

Treze causas estruturais explicam ~90% dos 68 achados:

| # | Causa raiz | Achados derivados (IDs do Registro) |
| --- | --- | --- |
| CR-1 | **Invariantes nascem na camada onde o bug doeu e nunca são promovidas ao banco** (política de guarda inexistente) | IM-01, IM-02, IM-03, IM-04, IM-08, FS-03 (parcial), FUN-05 |
| CR-2 | **Curadoria/profiles sem RPC transacional** (o gabarito existe no Connection e não foi replicado) | AT-01..06, FS-05, IM-03 |
| CR-3 | **Fontes de verdade duplicadas sem mecanismo de paridade** (sem geração de tipos; arrays hard-coded; strings como contratos) | CAT-01, CAT-03, FUN-03, NAV-02, FS-07, UX-08 (parcial) |
| CR-4 | **Decisões executadas sem ADR / aprovação só-na-memória** | CAT-02, DOC-02, DOC-04, DOC-05, PAP-03, IM-07 |
| CR-5 | **Release e instrumentos fora do git** (trabalho certificado sem versionamento) | REL-01..04, REC-02 (parcial), DOC-05 |
| CR-6 | **Ausência de CI obrigatório** (toda a malha de proteção é opcional) | TST-04, SEG-04, TST-05 (agravado), REL-03 |
| CR-7 | **Ações e capacidades criadas sem superfície** (banco à frente da UI; decisão de produto por omissão) | ORF-01..05, PAP-01, PAP-02, OPS-02, OPS-05, IM-05 (parcial) |
| CR-8 | **Operações multi-escrita no cliente/PostgREST com erro descartado** | AT-01..05, FS-05, FS-06, AU-04 |
| CR-9 | **Auditoria como acidente de migration, não como política** (exemplar onde houve migration pensada; zero onde é update de TS) | AU-01..04, PAP-04, UX-03 (promessas de autoria), OPS-04 |
| CR-10 | **Ambiente sem staging + zero telemetria por decisão** | OPS-03, OBS-01..05, FS-01/FS-06 (agravados: falha silenciosa sem detector) |
| CR-11 | **Bus factor 1 em pessoa, conta e credencial** | OPS-01, OPS-02, SEG-01..02, PAP-01 (trava a mitigação), OBS-03 |
| CR-12 | **Falta de política de privacidade e retenção** (lacuna reconhecida e nunca decidida) | PRIV-01..05, AU-03, FUN-02 (parcial), DAD-02 |
| CR-13 | **Testes que certificam o presente em vez do correto** (travas de defeito; oráculos de tela; limpeza ausente) | TST-01..03, TST-06, DAD-01, DAD-03, FS-03/04 (perpetuados) |

## 5. Famílias de achados (dedupe e reclassificações)

As 19 famílias do Registro, com causa raiz, risco e coordenação de correção, estão na tabela única e nos blocos de detalhe do `REGISTRO_UNICO_DE_ACHADOS.md`. Reclassificações relevantes em relação às fases de origem, com justificativa:

- **Imutabilidades (IM-01/02/04) crítico→P1**: a escala única aloca "estado crítico mutável" a P1; a violação exige ação deliberada com credencial legítima — não ocorre espontaneamente. **IM-03 permanece P0**: destrói dado no caminho feliz, a cada entrega, confirmado em dado vivo.
- **PRIV-01 alto→P0**: "ausência de proteção de dado clínico" é P0 pela escala; a dimensão documental (nenhuma base de consentimento/informação) é essa ausência — e o produto trata história de saúde em texto livre.
- **OPS-01 (bus factor) crítico→P1**: bloqueia operação real (definição de P1), não a integridade imediata do sistema. Permanece bloqueador.
- **DOC-01 (MODELO defasado) e família DOC crítico/alto→P2**: permitem deriva (risco relevante), não corrompem operação imediata. As decisões associadas (D-17/D-18) permanecem obrigatórias.
- **FS-07 (substring como fluxo) crítico→P2**: fabrica regressão futura; não corrompe hoje.
- **Duplicações eliminadas** (exemplos): C7≡IM-03≡"carimbo destruído" (3 fases); fail-open da Rede (F1 §5.1 ≡ F4 fail-open ≡ F9 risco 7) → FS-01; "dossiê NÃO PRONTO" (F3 §12 ≡ F9 §7) → REC-03; "porteiro morto + test:e2e sem build + 600s" (F5 ≡ F6 ≡ F9) → TST-03; "158 sintéticos não marcados" (F3 #14 ≡ F6 §8 ≡ F9 P18-01) → DAD-01; "senhas em claro" (F5 §15 ≡ F9 P1-01/Parte 9) → SEG-01; "Concierge inexecutável" (F2 C6 ≡ F7 §15 ≡ F9 13.14) → ORF-01.

## 6. Correções de premissa (conclusões anteriores refutadas — a fonte que prevalece)

1. **Atendente TEM o ciclo completo** (qualificar→converter→abrir→encaminhar). F2 corrige F1/doc — prevalece F2 (evidência de superfície); o defasado é `PAPEL_ADMINISTRADOR_E_ENTRADA_DO_PACIENTE.md`.
2. **As 6 seções da Landing (ADR-033) existem como componentes** — "implementada e não publicada", não "não implementada". F2 corrige F1.
3. **A Mesa USA progressive disclosure real na área de trabalho** (uma etapa por vez, "Sua vez:"); o problema é o aside de 9 seções. F7 corrige leituras anteriores.
4. **LeadWorkspace apresenta UMA etapa por vez** — o melhor disclosure do backoffice. F7.
5. **`/curador` é código morto atrás de redirect** — disputa interna da F2 resolvida pela leitura do `next.config.ts`; prevalece a evidência direta.
6. **Exposição anônima real ≠ backlog S1**: 11 funções invocáveis por `anon`, **nenhuma sensível**; grants de tabela a zero. F3 corrige o backlog.
7. **Testes negativos de RLS: 191 em 43 arquivos** — F6 corrige a subestimativa (~4×) da F3.
8. **ADR-037 §3 (remoção física do ACE): OCORREU** — F8 reverificou e encerra a dúvida da F1. Permanece pendente apenas a revogação de grants da ADR-036.
9. **Comentário `repository.ts:216-217` está obsoleto**: a Mesa JÁ aplica a blocklist NC-22 (`mesa-cruzamento.ts:213`). F9 corrige a leitura — o defeito real é o comentário, não a lacuna.
10. **Profissional: não há promessa explícita de "notificar o selecionado" descumprida** — há ausência declarada de qualquer canal (`OPERATIONAL_ROLES_MODEL.md:242-243`). F8 precisa a F2.
11. **WhatsApp da Landing não é mais placeholder**: número real hardcoded com fonte única documentada (MISSÃO 205). F9 corrige os docs da era Landing.
12. **MANUAL_CURADOR não está "ausente" como material de treino** — existe, é bom, e traduz fielmente um modelo aposentado. F9 precisa; o problema é DOC-01.
13. **Ambiente de treino: o sandbox `is_certification` existe e é exemplar no banco** — o que falta é um writer de produção. F9 precisa o "não existe treino".
14. **Contagens de teste**: fases antigas contavam arquivos; números reais ~1.516 unit / ~404 integration / ~386 components / ~132 e2e. F6.
15. **Supersessão de ADRs**: o log é honesto e deliberado na unidirecionalidade (`DECISIONS.md:581`) — o achado correto é "vazio normativo + invisibilidade", não "desonestidade". F8.

## 7. Tudo que está sólido (não reconstruir)

1. **O Método central em código**: Portas, Rede (política única), Motor (matriz 5×3 pura, zero score — grep integral + testes), Seleção (exatamente 3, pareceres, autoria), Relatório qualitativo com proveniência por frase, fronteira da paciente (nada antes da entrega; comparação por textura). A virada ADR-042 completa.
2. **RLS e isolamento**: 100% das 71 tabelas; `anon` a zero; paciente↔paciente e curador↔curador provados por 191 testes negativos com sessões reais; view com `security_invoker`; 44 SECURITY DEFINER todas com search_path; zero SQL dinâmico; zero recursão.
3. **Autenticação e guards**: guard server-side em todas as páginas admin e árvores de papel; ~27 actions administrativas guardadas; open-redirect mitigado; reset de senha da paciente sem enumeração de contas.
4. **Locking otimista da história** (revision + banner de conflito + recuperação local) — referência.
5. **Connection/Relationship/Tentativas**: o único domínio onde "final" é final no banco — trigger+espelho+teste, RPCs atômicas, concorrência real provada ("exatamente uma sucede"). **É o gabarito.**
6. **Publicação**: gate de 5 condições vivo no trigger + espelho de pendências sincronizado por contrato + 12 negativos.
7. **Compensação de anexos** (3 passos + log de órfão) — o melhor tratamento de falha parcial do código.
8. **Domínio puro** (`motor-compatibilidade`, `dossie`, `relatorio-inteligente`, `mesa.ts`, `evidencias-pratica`) + meta-testes arquiteturais + fronteira componente↔dados absoluta.
9. **Anti-contaminação demo/fixture por trigger bidirecional** + `transfer_case_responsibility` + `discard_case_admin` — referências de RPC sensível.
10. **Wizard da história** (1 pergunta/tela, retomada, autosave anunciado) e a voz das confirmações/vazios editoriais.
11. **A11y por construção**: rótulo obrigatório por tipagem, 399 focus-visible, fieldsets, matriz com colgroup.
12. **Guardas de ambiente e build**: 10 camadas anti-remoto, cadeia de identidade de build, ledger 69/69 zero-drift, trava de exclusão mútua, limpeza de integração com sentinela.
13. **Git limpo de segredos** (histórico completo verificado) e dados 100% sintéticos no local.
14. **Preservação da árvore** (§11) — a release está externamente resguardada até a decisão de versionamento.

## 8. Tudo que está incompleto (síntese do Registro)

Por bloco: **integridade** (imutabilidades IM-*, atomicidade AT-*, falso-sucesso FS-*); **funcionalidade** (FUN-01/02, órfãs ORF-*, papéis PAP-*); **operação** (REL-*, REC-*, OBS-*, OPS-*, DAD-01/02); **segurança/privacidade** (SEG-*, PRIV-*, AU-*); **qualidade** (TST-*, CAT-*, NAV-02); **governança/experiência** (DOC-*, UX-*, CAP-*, GOV-*). A lista fechada, com critérios de encerramento por item, é o `REGISTRO_UNICO_DE_ACHADOS.md`.

## 9. Dependências entre os futuros blocos de correção

Sem definir sequência de implementação — apenas as precedências objetivas:

| Precede | O quê | Por quê |
| --- | --- | --- |
| **D-02/REL-01 (versionar a release)** | deploy, CI, rollback, dossiê, qualquer correção | sem commit não há base para nada — nem para corrigir com diff rastreável |
| **SEG-01 (rotação)** | qualquer janela de produção | credencial comprometida ativa anula qualquer GO |
| **D-01/CAT-02 (aprovação do Catálogo)** | REC-03 (dossiê/migração remota), CAT-01 (fonte única), DOC-01 (MODELO) | não se autoriza migração de uma decisão não registrada |
| IM-06 (política de guarda) + IM-* | TST-02 (suíte de invariantes), novos E2E com oráculo | os testes novos devem falhar contra o estado atual — invariantes primeiro definidas, depois provadas |
| AT-06 (RPCs) → AT-01 (entrega atômica) | AU-02 (autoria da entrega), OBS-01 (alerta de entrega parcial) | não se audita nem se alerta o que ainda é dois statements soltos |
| D-08 (política de documentos) | PRIV-04 (storage/exclusão), FUN-02 (validação), retenção | a técnica implementa a política, não o contrário |
| D-03/D-04 (Concierge/Profissional/órfãs) | ORF-*, PAP-02 (superfícies) | criar tela sem decisão repete a causa CR-7 |
| PRIV-01 (base de privacidade) | produção com dados clínicos | bloqueio legal/ético, não técnico |
| REC-01 (backup testado) | REC-03 (aplicação remota) | o DELETE da `120000` sem backup das tabelas de paciente é irreversível |
| PAP-01 (conceder papéis pela UI) | OPS-01 (segunda pessoa/conta) | hoje a mitigação do bus factor exige SQL contra produção |
| TST-01 (desarmar travas) | FS-03/FS-04 (correções) | em par, senão a correção "quebra os testes" |
| TST-04 (CI mínimo) | estabilidade de tudo acima | sem CI, cada correção pode regredir em silêncio |
| OBS-05 (smoke canônico) + OBS-01 (alertas) | primeira janela de produção real | critérios 6–8 do checklist Go/No-Go |

## 10. Decisões do responsável pelo produto

Consolidadas das nove fases; **nenhuma foi tomada nesta auditoria**. Para cada uma: contexto → opções → consequência de não decidir → prazo → decisor.

| ID | Decisão | Contexto e opções | Consequência de não decidir | Prazo | Decisor |
| --- | --- | --- | --- | --- | --- |
| **D-01** | **Aprovação formal do Catálogo 1.0.0** | Implementado contra o cabeçalho "não aprovada". Opções: ADR de aprovação; reverter para 0.9.0; aprovar com emendas | A autorização remota fica inautorizável; a decisão morre com a memória da sessão | antes do dossiê | Fundador (guardião do Método) |
| **D-02** | **Versionar ou descartar a release atual** | 155M+57?? preservados externamente. Opções: commit+tag; commit parcial; descarte (perde a certificação) | `git clean` destrói tudo; nenhum deploy/rollback/CI possível | imediato | Fundador |
| **D-03** | **Papel do Profissional no fluxo** | Zero canal (nem seleção, nem notificação, nem vínculo de conta). Opções: canal mínimo na v1; explicitamente fora da v1 com registro | Papel fantasma cobrado por docs; contas nunca vinculáveis | antes do plano | Fundador |
| **D-04** | **Escopo do Concierge e destino de cada órfã** | 14 actions + 3 componentes: publicar superfície, remover, ou adiar com registro — item a item (aproximação intermediada, Avaliação técnica, MandatoryFilters, resolução de pedidos, notificações) | Escolha da paciente continua sem efeito; pendências perpétuas; decisão por omissão | antes do plano | Fundador |
| **D-05** | **Fonte única do Catálogo** | Banco autoritativo (FK+validação+imutabilidade) × TS assumido como fonte | O pior dos mundos atual persiste: dois donos divergentes graváveis em silêncio | com D-01 | Fundador + engenharia |
| **D-06** | **Política de guarda das invariantes** | Quais imutabilidades exigem trigger/constraint (proposta da evidência: itens 2,3,5,6,8,9,11,14 da matriz F3) e o fluxo de retratação pós-entrega | Congelamento continua loteria por objeto; erro entregue permanece sem correção possível | antes das correções de banco | Fundador (é decisão de Método) |
| **D-07** | **Tratamento de SUPERSEDED** | Implementar a supersessão prevista × registrar que correção de Perfil é impossível na v1 | Estado contraditório: o caminho certo bloqueado, o errado aberto | com D-06 | Fundador |
| **D-08** | **Política de documentos** | Tipos/tamanho aceitos; download da equipe; exclusão (tombstone? verificação de storage? confirmação?); documento em Case ativo | Upload aberto a qualquer arquivo; "excluir" seguirá não eliminando | antes das correções de storage | Fundador |
| **D-09** | **Responsável por LGPD + política de retenção/exclusão** | A ADR "com quem responde por LGPD" nunca foi aberta. Definir: retenção por entidade, anonimização, log de leitura, direitos do titular | Produto de dado clínico sem base; pedidos de titular inatendíveis | antes de produção | Fundador (nomeando o responsável) |
| **D-10** | **Uso de Anthropic e analytics** | Anthropic como suboperadora informada × remoção do assistido; analytics com consentimento × removido das rotas de paciente | Compartilhamento de dado sensível sem base documentada | com D-09 | Fundador |
| **D-11** | **Nível mínimo de observabilidade para abrir** | Health check + alertas dos 3 silêncios críticos + destino dos logs (o que é indispensável × aceito como manual) | Primeira falha grave descoberta por uma paciente | antes de produção | Fundador |
| **D-12** | **Staging: criar ou aceitar formalmente operar sem** | Hoje produção é o primeiro remoto real. Aceitar exige registrar o risco + mitigações (smoke seguro, alertas) | Validação remota permanece = validação com pacientes, por omissão | antes de produção | Fundador |
| **D-13** | **Nível mínimo de backup + RTO/RPO** | Plano pago com PITR × rotina de dump verificado; alvos de RTO/RPO; teste de restore | Primeiro dia real sem ponto de retorno (NO GO do próprio playbook) | antes de produção | Fundador |
| **D-14** | **Segregação de funções e caminho humano** | Segunda conta (Admin ≠ Curador); segundo detentor de credenciais; regra para Studio/psql/CLI | Segregação exigida pelo próprio Método permanece inexequível; bus factor 1 | antes de produção | Fundador |
| **D-15** | **Responsável por incidentes/deploy (Incident Commander)** | Nomear; definir escalonamento e procedimento de ausência | Papel de organograma sem ocupante; RECOVERY às 3h sem executor | antes de produção | Fundador |
| **D-16** | **Fluxo de retratação/correção após entrega** | Errata/novo-Case-vinculado/reemissão versionada — mantendo a imutabilidade | Erro real entregue a uma paciente não tem resposta legítima | com D-06 | Fundador |
| **D-17** | **Destino do MODELO/MANUAL** | Versionar pós-042 × rebaixar a histórico × emendar por seção | Documento canônico seguirá ensinando o Método aposentado | pós-plano, antes de treinar alguém | Fundador |
| **D-18** | **Regularização de governança** | Regra de marcação de ADR supersedida; ADRs de regularização (papéis, Curador, renomeações, reabertura pós-021, ADR-003/005/009/011/021); registro das decisões só-na-memória | Deriva documental continua estruturalmente possível (veredicto da F8) | contínuo | Fundador |
| **D-19** | **Rotas e mortos** | Pagar a renomeação do curador × registrar rewrite como permanente; remover árvores mortas e órfãs sem função | Juros contínuos (revalidação errável — já errada no Briefing) | com o plano | Engenharia propõe, Fundador aprova |
| **D-20** | **Dados de teste em produção** | Remover as contas de teste × aceitar por escrito e marcar; categoria de marcação para resíduo de E2E | Critério NO GO não detecta o que já existe lá | antes de produção | Fundador |
| **D-21** | **Ação explícita para nova história** | Hoje: história única retomável; GET-que-grava fechado por índice (STORY-GET-WRITE-001/STORY-NOVA-001 no backlog). Definir se "iniciar nova história" é ato explícito da paciente | Comportamento implícito permanece decidido por acidente de rota | com o plano | Fundador |

## 11. Risco residual

Mesmo após fechar todos os P0/P1, permanecem (aceitos ou monitorados):

- **Lock-in Supabase arquitetural** (a autorização É o banco) — decisão consciente; sem plano B de provedor.
- **Contornos de runtime** (RECONHECE-REFRESH/NAV-COMMIT) até o upgrade do Next que os elimine — dívidas registradas com guarda.
- **Operação de pessoa única mitigada, não eliminada** — a segunda conta/pessoa reduz o bus factor a 2, não o dissolve; o julgamento do Método continua raro.
- **Sem staging (se D-12 aceitar)** — validação remota seguirá tocando produção, mitigada por smoke seguro + alertas.
- **Capacidade não medida** (ACE em produção, custo por curadoria, restore real) — os 14 desconhecidos da F9 §17 só se medem operando.
- **Escala** — os tetos conhecidos (K2 `.in()` ~200; Admin API 1000) têm gatilhos claros e ficam como P2 com data de revisão.
- **A memória desta própria auditoria** — as dez fases vivem em documentos untracked até D-02; o risco de perda é o mesmo H-C1 que elas diagnosticaram.

## 12. Conclusão

O Aliviar chega ao fim da Auditoria Geral com um diagnóstico incomum: **o que é difícil está pronto; o que falta é o que a maioria dos projetos faz primeiro e mal.** O Método — a parte que não se compra pronta — está implementado com fidelidade verificada linha a linha e certificado de ponta a ponta. O que o separa de produção não é engenharia nova: é versionar o que já existe, promover ao banco as promessas que a interface já faz, dar superfície (ou desligamento honesto) ao que o banco já sabe fazer, escrever as políticas que a operação já pressupõe, e registrar as ~21 decisões que hoje vivem na memória de uma pessoa.

O veredicto é **NO-GO** (`GO_NO_GO_FINAL.md`), com 15 P0 abertos — e com a observação de que nenhum deles é um projeto: são fechamentos enumeráveis, a maioria com gabarito interno, cuja ordem natural o §9 já desenha. A elaboração do Plano Mestre de Correções aguarda a aprovação humana destes três documentos.

*Fase 10 encerrada. Nenhuma correção foi aplicada; nenhum commit foi feito; nenhuma credencial foi tocada.*
