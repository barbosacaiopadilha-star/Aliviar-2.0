# PLANO OFICIAL DE LANÇAMENTO — ALIVIAR 1.0

**Documento de execução, não de desenvolvimento.**

| Revisão | Data | Autor | Motivo |
|---|---|---|---|
| 1 | 2026-08-03 | Claude (CTO da execução) | Versão inicial do plano |
| 2 | 2026-08-03 | Claude, sob Decisão Estratégica do Fundador | Reclassificação: Bloco A obrigatório × Bloco B pós-Go-Live |
| **3** | **2026-08-03** | **Claude (CTO da execução)** | **Alinhamento ao `RELATORIO_FINAL_DE_PRONTIDAO_1_0.md`: correção da contingência (PITR inexistente), registro da infraestrutura de publicação em dois pipelines, SEG-01/SEG-02, e estado real das fases após a execução do Bloco A** |

> **Precedência documental:** em caso de conflito entre este plano e o `RELATORIO_FINAL_DE_PRONTIDAO_1_0.md`, **prevalece o Relatório Final** quanto ao *estado* do projeto. Este documento é a autoridade sobre o *caminho*; o Relatório é a autoridade sobre a *situação*. Ver Parte 13.

---

## Registro da decisão

Em 2026-08-03 o Fundador decidiu que a versão 1.0 será lançada em **modo controlado**: não é um lançamento público em escala, é o **início da operação assistida da Aliviar**.

Em consequência, três frentes deixam de bloquear o GO e passam a ser executadas durante a operação:

- **Governança** — a infraestrutura está construída; os textos jurídicos definitivos serão concluídos durante a fase inicial, antes da abertura em escala.
- **Operação** — a validação completa da infraestrutura de produção (restore em produção, monitoramento avançado) continua sendo feita, mas não impede o início.
- **Rede** — será construída gradualmente; a 1.0 depende apenas de profissionais suficientes para os primeiros casos.

**Novo objetivo da 1.0:** *estar pronta para iniciar uma operação real, controlada, acompanhada de perto pela equipe fundadora.*

Este registro fica no documento porque uma reclassificação de risco precisa ter autor e data.

---

## O que sustenta esta decisão

A reclassificação é defensável por uma razão concreta, não por otimismo: **na 1.0 tudo entra pela mão da equipe.** Não existe autocadastro de paciente nem de profissional. Ninguém chega sozinho.

Isso muda a natureza do risco. Uma falha em escala atingiria muita gente sem aviso; uma falha em operação assistida atinge **uma pessoa que a equipe conhece pelo nome e consegue telefonar**. O controle compensatório não é técnico — é o tamanho da operação.

Esse controle só vale enquanto a operação for realmente pequena e acompanhada. Por isso a Parte 8 define o **ponto de saturação**: o volume a partir do qual as frentes pós-GO voltam a ser bloqueadoras.

---

## Estado técnico na abertura *(histórico — Revisão 1, preservado)*

`main` está em `ef7b7e9`. O trabalho das últimas seis Sprints vive em `remediacao/b2-verificacao-release` (`b1129d9`), com CI verde em cada commit, **sem merge**. Nada está publicado.

> ⚠️ **Correção registrada na Revisão 3.** A última frase estava **errada**. A aplicação estava publicada em produção desde 2026-08-03 06:30Z e vinha sendo publicada automaticamente a cada push em `main`. O parágrafo permanece como registro histórico do que se acreditava na abertura.

## Estado técnico atual *(Revisão 3 — 2026-08-03 22:50Z)*

| Dimensão | Estado |
|---|---|
| `main` = `origin/main` | `4ad2f1f02fabe3c538ff6782a3cfd8bf330ce59c` — 12 commits das seis Sprints incorporados |
| Tag | `lancamento-v1.0.0` (anotada) → `4ad2f1f` |
| CI | ✅ verde no commit da release (run `30857578623`) |
| Código em produção | `ef7b7e9` — **não publicado ainda**; publicação pausada por `vercel.json` |
| Schema de produção | **91 migrations**, `20260803150000`; equivalência com `4ad2f1f` provada |
| Backup / PITR | 🔴 **inexistentes** — organização em plano Free |
| Rede publicada | 1 profissional (mínimo operacional: 3) |
| Documentos jurídicos | 0 publicados |

**Papéis:** *Fundador* (decide, responde pela LGPD), *Técnico* (deploy e recuperação), *Jurídico* (redige e aprova textos), *Curador* (opera a Curadoria).

---

# PARTE 1 — FASES

## BLOCO A — OBRIGATÓRIO ANTES DO GO

Somente o que impede iniciar a operação controlada. Cinco fases.

**Estado das fases após a execução de 2026-08-03:**

| Fase | Estado |
|---|---|
| 1 — Fechamento técnico | ✅ **CONCLUÍDA** |
| 2 — Base legal mínima | 🔴 não iniciada |
| 3 — Rede mínima viável | 🟡 em curso — 1 de 3 |
| 4 — Publicação | 🟡 parcial — schema aplicado, código não publicado |
| 5 — Prontidão para operar | 🔴 não iniciada |

> **Revisão 3:** a estimativa original de "5 a 9 dias no total" pressupunha que backup e PITR já existissem. Com a contratação de infraestrutura acrescentada (ver Parte 11), o Bloco A passa a **7 a 11 dias**, dos quais a maior parte corre em paralelo com as Fases 2 e 3.

---

### Fase 1 — Fechamento técnico ✅ CONCLUÍDA
**Objetivo:** levar para `main` o que já está provado.
**Duração:** 1 dia · **Responsável:** Técnico · **Depende de:** nada.

Merge do branch em `main`, CI verde no merge, tag de release.

**Critério de saída:** `main` com os seis commits, CI verde, tag criada.

**Por que é obrigatório:** não se publica código que não passou pelo portão. É o passo mais barato do plano.

> **Executada em 2026-08-03.** Merge `4ad2f1f02fabe3c538ff6782a3cfd8bf330ce59c` (12 commits, 55 arquivos, +4.554/−164); CI verde no run `30857578623`; tag anotada `lancamento-v1.0.0` → `4ad2f1f`, publicada no remoto. Um passo extra, não previsto na Revisão 2, precedeu o merge: a pausa da publicação automática (commit `6dcbc02`) — ver Parte 11. Detalhe completo em `RELATORIO_FINAL_DE_PRONTIDAO_1_0.md`, seção 2.

---

### Fase 2 — Base legal mínima
**Objetivo:** ter o mínimo publicado para receber história clínica de uma pessoa real.
**Duração:** 2 a 5 dias · **Responsável:** Fundador (+ Jurídico se disponível) · **Depende de:** Fase 1.

O Fundador decidiu que os textos **definitivos** ficam para depois. O plano acata. O que permanece antes do GO é menor e diferente disso: **existir alguma coisa publicada**, ainda que provisória e marcada como tal.

Escopo mínimo:
- Um **Aviso de Privacidade** — mesmo curto — dizendo quem trata, o que trata, para quê, e com quem compartilha.
- Um **consentimento específico e destacado** para dado de saúde, e outro para o compartilhamento com o profissional escolhido.
- **Encarregado nomeado com contato publicado** — uma linha, um e-mail.
- Marcar as versões como provisórias, com revisão prevista.

Publicar é inserir uma linha: hash, imutabilidade, permalink e gate de aceite já funcionam sozinhos.

**Critério de saída:** `/privacidade`, `/termos` e `/consentimentos` servindo texto real; consentimentos ativos; contato do Encarregado publicado.

> **Registro técnico, uma vez:** este é o único item do Bloco A que mantenho como obrigatório contra a leitura mais permissiva da decisão. A razão é estreita — a primeira paciente entrega história clínica no primeiro acesso, e um consentimento não coletado naquele momento não é recuperável depois. O custo é de dias, não de semanas, e o texto pode ser provisório. Se ainda assim o Fundador preferir mover a fase inteira para pós-GO, o caminho está registrado na Parte 9 e a execução segue sem nova discussão.

---

### Fase 3 — Rede mínima viável
**Objetivo:** existir profissional real para a Curadoria escolher.
**Duração:** paralela às Fases 1–2 · **Responsável:** Curador · **Depende de:** Fase 2 (aceites).

A Curadoria apresenta **exatamente três opções** — abaixo disso o sistema recusa concluir, e com razão.

**Mínimo:** três profissionais reais, publicados e verificados, **que passem os filtros de elegibilidade do primeiro caso previsto**. Não é um número abstrato: é área compatível com aquela pessoa. Confortável seria de 5 a 6, para haver escolha de verdade.

**Critério de saída:** a Rede elegível daquele caso retorna três ou mais candidatos.

**Por que é obrigatório:** sem isso a jornada trava no meio, com uma pessoa real esperando.

> **Estado em 2026-08-03:** **1 profissional publicado**, de 7 perfis existentes em produção (o primeiro foi publicado às 22:02:49Z, por ação da equipe). Faltam 2 para o mínimo. A Fase deixou de estar em zero e passou a estar em curso.

---

### Fase 4 — Publicação
**Objetivo:** colocar a 1.0 no ar.
**Duração:** 1 dia + janela · **Responsável:** Técnico · **Depende de:** Fase 1 **e Fase 4.0**.

#### Fase 4.0 — Contratação de infraestrutura de recuperação *(nova na Revisão 3)*
**Responsável:** Fundador · **Duração:** minutos de contratação + até 24 h de espera pela cobertura.

A organização `aliviar-alpha` está no **plano Free**: **não existe backup automático nem PITR**. Antes de qualquer publicação ou operação destrutiva:

1. Contratar plano **Pro** e o **add-on de PITR**.
2. Aguardar a cobertura passar a existir — **nenhum backup é retroativo**.
3. Confirmar pelo **timestamp do ponto de restauração mais antigo**, não pela mensagem do painel.

> **Correção da Revisão 2.** O texto anterior dizia *"confirmar no painel que o backup automático e o PITR estão ligados. Conferência de minutos"*. Isso pressupunha que existissem. **Não existem.** A conferência vira contratação, com custo e decisão do Fundador.

#### Fase 4.1 — Publicação do código
Deploy do commit `4ad2f1f`, verificação por `/api/health`, `/privacidade` e `/api/build-info`.

> **As migrations já foram aplicadas.** Em 2026-08-03 às 22:10:08Z, pela integração Supabase↔GitHub, disparada pelo push do merge (ver Parte 11). Produção está em `91 / 20260803150000`, com equivalência estrutural provada. **O dossiê REC-03 deixa de ser plano de execução e passa a ser registro *a posteriori*.**

**Critério de saída:** `/api/health` respondendo 200 em produção; `/privacidade` respondendo 200; BUILD_ID conferido; ledger remoto sincronizado; **cobertura de backup confirmada por timestamp**.

---

### Fase 5 — Prontidão para operar
**Objetivo:** poder interromper e poder atender.
**Duração:** 1 dia · **Responsável:** Fundador · **Depende de:** Fase 4.

Quatro itens pequenos, todos de horas:

1. **Remover contas de teste de produção** (DAD-02) — dado de teste ao lado de dado de paciente real é confusão que sai caro depois. **São 40 de 47 contas.** ⚠️ **Operação destrutiva: só depois da Fase 4.0 concluída e da cobertura confirmada.**
2. **Rotacionar credenciais expostas** (SEG-01) — deixou de ser condicional. A exposição está confirmada e inventariada: token de administração, chave de serviço e **senha do banco em texto claro** em `.env.local`. Ver Parte 12. **Deve ser antecipada para antes da Fase 4.0**, para que o dump manual use a chave nova.
3. **Nomear quem atende quando quebrar** — nome e telefone, escrito. Não precisa ser plano de incidentes; precisa ser um nome.
4. **Ensaio ponta a ponta em produção** com caso sintético, removido ao final: conta, aceites, história, Case, Mapa, Rede elegível, seleção, Relatório, entrega, escolha.

**Critério de saída:** ensaio completo sem erro estruturado no log; caso sintético removido; plantão nomeado; nenhuma conta de teste remanescente.

**Por que é obrigatório:** o ensaio é o que impede que a primeira paciente real seja também o primeiro teste real.

---

### ➤ **GO** — a primeira paciente entra aqui.

---

## BLOCO B — PÓS-GO-LIVE

Executado durante as primeiras semanas, em paralelo à operação. **Continua obrigatório — muda o momento, não a exigência.** Cada item tem prazo-alvo e um gatilho que o devolve a bloqueador.

---

### P1 — Recuperação verificada
**Prazo-alvo:** primeiras 2 semanas · **Responsável:** Técnico

Executar um **restore real** em produção ou staging (o procedimento está provado localmente, RTO 3,9s, nunca contra o ambiente real). Definir RPO e RTO aceitáveis. Escrever o rollback das migrations e a matriz código × schema. Monitor externo apontado para `/api/health`, com destinatário definido.

**Gatilho de reclassificação — endurecido na Revisão 3:** ~~antes do 5º paciente~~ → **antes do 1º paciente**.

> **Por que mudou.** O gatilho original foi calibrado supondo que existisse PITR — isto é, supondo que houvesse *alguma* rede enquanto a P1 não fosse feita. Não havia. Com a Fase 4.0 contratada passa a haver capacidade, mas **capacidade não é o mesmo que restauração provada**. Recuperação não testada é recuperação suposta, e não se coloca dado clínico de uma pessoa real atrás de uma suposição.

---

### P2 — Textos jurídicos definitivos
**Prazo-alvo:** 4 a 6 semanas, **antes da abertura em escala** · **Responsável:** Jurídico + Fundador

Política de Privacidade e Termos definitivos, revistos por profissional jurídico. As seis decisões que só o Fundador toma: Controlador e Encarregado formalizados, prazos de retenção (Art. 16), tratamento da Anthropic como suboperadora, analytics em rotas de paciente, escopo do log de leitura, política de documentos na exclusão.

Publicar uma nova versão **não invalida os aceites anteriores** — a infraestrutura versiona e pede novo aceite quando a versão vigente muda. Os aceites provisórios ficam registrados com o texto que a pessoa realmente leu.

**Gatilho:** bloqueador absoluto para qualquer divulgação pública ou canal aberto de entrada.

---

### P3 — Expansão da Rede
**Prazo-alvo:** contínuo · **Responsável:** Curador

Atividade permanente de operação. A qualidade do cruzamento depende do **Perfil Relacional** (Protocolo da Prática) de cada profissional — sem ele, tudo vira lacuna honesta mas pouco informativa.

**Gatilho:** se a Rede elegível de um caso devolver menos de três candidatos, aquele caso para até a Rede crescer. É um bloqueio por caso, não do sistema.

---

### P4 — Plano de incidentes e bus factor
**Prazo-alvo:** 3 a 4 semanas · **Responsável:** Fundador

Incident Commander nomeado, **break-glass para o bus factor 1** (OPS-01: credenciais em cofre com segundo detentor e procedimento de emergência, testado uma vez), canal de suporte com horário declarado, runbooks com coordenadas corrigidas (DOC-06), inventário de credenciais concluído (SEG-02).

**Gatilho:** volta a ser bloqueador se a equipe crescer ou se o Fundador ficar indisponível por mais de uma semana.

---

### P5 — Observabilidade completa
**Prazo-alvo:** 4 a 8 semanas · **Responsável:** Técnico

Observabilidade de negócio (OBS-04), alertas de negócio, staging (OPS-03), granularidade por spec no gate de erros estruturados.

**Gatilho:** bloqueador antes de qualquer volume que a equipe não consiga acompanhar manualmente.

---

# PARTE 2 — Checklist técnico do GO

**Obrigatório antes do deploy:**

- [ ] Merge em `main`, tag de release criada
- [ ] CI verde **no commit exato** que vai ao ar
- [ ] `npm run build:local` verde; BUILD_ID anotado
- [ ] `npm run supabase:ledger:check` sincronizado local
- [x] ~~Dossiê de migração remota reescrito e conferido (REC-03)~~ → **vira registro *a posteriori***; migrations já aplicadas
- [ ] **Plano Pro contratado** (organização `aliviar-alpha` está em Free)
- [ ] **Add-on de PITR contratado**
- [ ] **Cobertura de backup confirmada pelo timestamp do ponto de restauração mais antigo**
- [ ] **Dump manual de produção capturado e guardado fora da estação de trabalho**
- [ ] **Integração Supabase↔GitHub contida** (Estratégia A — ver Parte 11)
- [ ] Variáveis de ambiente conferidas (incluindo `CLAUDE_API_KEY`, sem a qual produção falha explicitamente)
- [ ] `/api/health` respondendo 200 em produção
- [ ] `/privacidade` respondendo 200 em produção
- [ ] `/api/build-info` confirmando commit e ambiente esperados
- [ ] Smoke pós-deploy: login, história, anexo, Mesa, emissão, entrega
- [ ] Credenciais expostas rotacionadas — Grupo 1 e Grupo 2 (SEG-01, ver Parte 12)

**Movido para P1:** restore real executado, RPO/RTO definidos, rollback escrito, monitor externo, suíte completa após restauração.

# PARTE 3 — Checklist operacional antes da primeira paciente

**Obrigatório:**

- [ ] Aviso de Privacidade, Termos e Consentimentos publicados — ainda que provisórios, marcados como tal
- [ ] Encarregado nomeado, com contato publicado
- [ ] Gate de aceite funcionando em produção
- [ ] Três ou mais profissionais reais publicados, elegíveis para o primeiro caso
- [ ] Curador treinado no fluxo completo
- [ ] Aceites da equipe registrados (Confidencialidade)
- [ ] **Backup e PITR operantes, com cobertura confirmada** *(novo na Revisão 3)*
- [ ] Contas de teste removidas de produção — 40 de 47 (DAD-02)
- [ ] Ensaio ponta a ponta em produção concluído e limpo
- [ ] Quem atende quando quebra: nome e telefone escritos

**Movido para P2/P4:** textos definitivos, retenção formalizada, plano de incidentes completo, break-glass, canal de suporte com SLA.

---

# PARTE 4 — A primeira paciente, passo a passo

| # | Passo | Quem | Gargalo |
|---|---|---|---|
| 1 | Contato inicial e triagem | Atendente | — |
| 2 | Criação da conta; **senha exibida uma única vez** | Admin | **Alto.** Perdida a senha, o caminho é reset. Entregar por canal seguro e confirmar o acesso na hora. |
| 3 | Primeiro acesso: aceites obrigatórios | Paciente | Médio — primeira fricção da jornada; a clareza do texto é o que decide |
| 4 | História (6 etapas do wizard) | Paciente | Baixo — autosave provado |
| 5 | Abertura do Case e atribuição | Admin | — |
| 6 | Acolhimento: história chega sozinha, devolução e reconhecimento | Curador | Baixo |
| 7 | **Mapa de Prioridades: 29 conceitos** | Curador | **Alto.** 29 classificações, uma a uma |
| 8 | **Protocolo da Pessoa: 15 conversas** | Curador | **Alto.** Conversa real, não formulário |
| 9 | **Rede elegível: declarar área de cada candidato** | Curador | **O maior.** Uma declaração por profissional que passa os filtros — cresce com a Rede |
| 10 | Seleção de três + pareceres (3 campos × 3) | Curador | Médio |
| 11 | Relatório: rascunho, juízos humanos, emissão | Curador | Médio — a emissão **recusa** com sentinela ou abertura de sistema pendente, por desenho |
| 12 | Entrega, em duas confirmações | Curador | Baixo |
| 13 | Paciente lê os três caminhos e escolhe | Paciente | Baixo |
| 14 | Consentimento de compartilhamento com **aquele** profissional | Paciente | Baixo |
| 15 | Primeira consulta (fora do sistema) | Paciente | **Alto** — sem instrumentação; só registro manual depois |
| 16 | Confirmação do atendimento e acompanhamento | Concierge | Médio |

**Leitura honesta:** os passos 7, 8 e 9 concentram o custo humano. Em operação assistida isso é **desejável** — o Curador vê tudo, e é exatamente essa visão que substitui os controles automáticos adiados para pós-GO. Vira problema quando o volume tirar essa atenção; é o primeiro candidato da 1.1.

---

# PARTE 5 — A primeira profissional (homologação)

Não há autocadastro e não há Portal do Profissional na 1.0. A Rede é construída pela equipe.

| # | Passo | Quem | Registro |
|---|---|---|---|
| 1 | Identificação | Curadoria | — |
| 2 | Contato e convite | Curadoria | — |
| 3 | Validação documental: CRM, situação no conselho, área | Admin | `registration_status`, fonte, data, autor |
| 4 | Construção do Perfil | Admin | `professional_profiles` |
| 5 | Construção do **Perfil Relacional** (Protocolo da Prática) | Admin/Curador | `practice_evidence` — append-only, versionada, com fonte e autor |
| 6 | **Aceites**: Termos, Declaração de Veracidade, autorização de participação e publicação | Curador registra | `legal_acceptances`, `natureza = registrado_pela_equipe`, **forma de obtenção obrigatória**, evidência quando existir |
| 7 | Validação final | Curador | — |
| 8 | Publicação | Admin | Gatilho do banco exige CRM, registro consultado e área verificada |
| 9 | Disponível para a Curadoria | — | Entra na Rede elegível dos Cases compatíveis |

**Gargalo:** o passo 5. É o que dá substância ao cruzamento relacional.

**Ponto de atenção jurídica:** o aceite registrado pela equipe vale menos que o eletrônico do titular. A `forma_de_obtencao` é obrigatória no banco por isso — e quanto melhor a evidência (assinatura digitalizada, e-mail), mais sólida a posição.

---

# PARTE 6 — Contingência

Esta parte **ganhou peso** com a reclassificação. Com validações adiadas, a capacidade de parar e de comunicar é o principal controle compensatório.

**Quem decide:** o Fundador. Se indisponível, o Técnico pode **interromper** (nunca ampliar) e suspender a entrada de novos pacientes.

**Quem comunica:** o Fundador fala com pacientes e profissionais. O Técnico informa o estado do sistema.

**Quem executa:** o Técnico.

> 🔴 **CORREÇÃO CRÍTICA — Revisão 3.** O texto da Revisão 2 oferecia, no item 3, *"PITR do provedor"* como caminho de recuperação do banco. **O PITR não existe** — a organização está em plano Free. Este documento chegou a prometer, como recurso de emergência, algo indisponível. É a correção mais grave desta revisão e a razão pela qual ela foi feita.

**Como voltar:**
1. `/api/health` e log estruturado dizem se é aplicação, banco ou provedor.
2. **Se for o deploy:** voltar ao BUILD_ID anterior — **desde que nenhuma migration nova tenha rodado**. Enquanto P1 não estiver concluída, essa resposta depende de conferência manual do ledger; **é a fragilidade conhecida do período pós-GO** e precisa ser feita com calma antes de qualquer rollback. Alvo de rollback conhecido: deployment `dpl_EjKqv1HScXh3ftDb5Bt2Fe9dxUJM` (`ef7b7e9`).
3. **Se for o banco — antes da Fase 4.0:**

   > **Não há como voltar.** Não existe backup automático, não existe PITR, e o restore da plataforma não está disponível no plano atual. A única cópia é o **dump manual** que a Fase 4.0 exige capturar. Sem ele, uma perda de dados é **irreversível**.
   >
   > Consequência operacional obrigatória enquanto este estado durar: **nenhuma operação destrutiva em produção** — incluindo a limpeza das contas de teste — e nenhuma migration.

4. **Se for o banco — depois da Fase 4.0:** restauração pelo PITR contratado, com `restore-local.mjs` como **modelo do procedimento** — verificar contagens **e** acessos, e rodar a suíte completa depois.
5. Nunca dar por restaurado sem verificação de acesso: **dado presente não é dado acessível.** (Lição do Bloco I: um restore com contagens corretas entregou um banco inacessível.)

**Como interromper novos pacientes:** o gargalo é humano e isso é uma vantagem. Não existe autocadastro — **basta parar de criar contas.** Nenhuma mudança de código. *(Confirmado na auditoria: segue verdadeiro.)*

**Como interromper alterações de schema:** *(novo na Revisão 3)* enquanto a integração Supabase↔GitHub estiver ativa, **parar de mergear `.sql` em `main` é a única forma** — ou desligá-la, conforme a Parte 11. Não existe congelamento parcial.

**Como preservar os casos existentes:** os estados finais são protegidos por trigger no banco (seleção entregue, Perfil reconhecido, história enviada, Relatório emitido). Paciente com Curadoria entregue **não perde nada** com o sistema fora do ar — o documento dela já é definitivo. Em incidente, a prioridade é comunicar, não corrigir às pressas.

---

# PARTE 7 — Critérios de sucesso

**Marcos objetivos:**

| # | Marco | Verificação |
|---|---|---|
| 1 | Primeira conta criada com aceites registrados | `legal_acceptances` com hash e data |
| 2 | Primeira história enviada | `patient_stories` em `enviada` |
| 3 | Primeiro Perfil reconhecido pela paciente | `profile_recognized` na auditoria |
| 4 | Primeira Curadoria concluída com três opções | seleção encerrada |
| 5 | Primeiro Relatório emitido | `report_emitted` |
| 6 | Primeiro Relatório entregue | `delivered_at` preenchido |
| 7 | Primeira escolha da paciente | `connection_records` |
| 8 | Primeira consulta confirmada | `PRIMEIRO_ATENDIMENTO_REALIZADO` |
| 9 | Primeiro acompanhamento ativo | `relationship_records` |

**Critérios de qualidade — não reclassificáveis:**

- Zero erro estruturado no log durante a jornada
- Zero texto interno do Curador no documento entregue
- Nenhum score, ranking ou comparação na tela da paciente
- Todos os aceites com hash e permalink recuperáveis
- Backup válido em todos os dias da jornada

**A 1.0 é declarada lançada com sucesso quando os nove marcos ocorrerem para uma paciente real, com os cinco critérios de qualidade intactos.** Não é volume — é a jornada inteira funcionando uma vez, de verdade.

---

# PARTE 8 — Ponto de saturação da operação assistida

A reclassificação vale **enquanto a operação couber na atenção da equipe fundadora**. Estes são os sinais de que ela deixou de caber — cada um devolve as frentes pós-GO à condição de bloqueador:

| Sinal | Frente que volta a bloquear | Revisão |
|---|---|---|
| **1º paciente real** ~~5º~~ | P1 — recuperação verificada | **endurecido na R3** |
| **Qualquer `.sql` novo mergeado em `main`** | Parte 11 — contenção da integração | **novo na R3** |
| **Qualquer operação destrutiva em produção** | Fase 4.0 — cobertura de backup confirmada | **novo na R3** |
| Qualquer divulgação pública ou canal aberto | P2 — textos definitivos | — |
| Rede elegível com menos de 3 candidatos | P3 — para aquele caso | — |
| Equipe cresce, ou Fundador indisponível > 1 semana | P4 — incidentes e break-glass | — |
| Volume acima do acompanhamento manual | P5 — observabilidade | — |

Escrever isto agora é o que impede que "pós-Go-Live" vire "nunca".

> **Por que os gatilhos foram endurecidos.** A Revisão 2 calibrou a saturação por **volume de pacientes**, partindo de dois pressupostos que a auditoria derrubou: que existia PITR, e que produção ainda não tinha uso real. Nenhum dos dois era verdadeiro — há 7 contas reais, com 3 logins nas duas horas anteriores a esta revisão. O que ainda protege a operação é que **ninguém completou uma Curadoria** (zero seleções, zero conexões). A saturação passa a ser medida também por **eventos**, não só por volume.

---

# PARTE 9 — Riscos aceitos conscientemente

Registro do que se assume ao entrar em operação com o Bloco B pendente. Nenhum destes é desconhecido.

**Classificação, mitigação, responsável e estado — atualizados na Revisão 3.**

| # | Risco | Classificação | Mitigação real | Responsável | Estado |
|---|---|---|---|---|---|
| 1 | **Ausência de backup e PITR** *(reescrito)* | 🔴 **Crítico** | ~~PITR ligado~~ → **não existe.** Restam apenas: volume pequeno e casos entregues protegidos por trigger. Correção: Fase 4.0 | Fundador | 🔴 **aberto** |
| 2 | Rollback sem matriz código × schema | 🟢 Baixo | Janela acompanhada; nenhum deploy sem o Técnico presente | Técnico | 🔴 aberto (P1) |
| 3 | Textos jurídicos provisórios | 🟠 Alto | Consentimento específico desde a primeira paciente; nova versão pede novo aceite sem invalidar o anterior | Jurídico + Fundador | 🔴 aberto (Fase 2) |
| 4 | Sem monitor externo até P1 | 🟡 Médio | Poucos pacientes, contato direto | Técnico | 🔴 aberto (P1) |
| 5 | Bus factor 1 | 🟠 Alto | Nenhuma no período. O mais concentrado da lista e o mais barato de reduzir — **antecipar P4 se houver um dia livre** | Fundador | 🔴 aberto (P4) |
| 6 | Rede pequena | 🟡 Médio | O Curador sabe disso e o documento entregue nunca promete o contrário | Curador | 🟡 em curso (1 de 3) |
| **7** | **Credenciais de produção em texto claro** *(novo)* | 🔴 **Crítico** | Rotação dos Grupos 1 e 2 e limpeza de `.env.local` — ver Parte 12 | Fundador | 🔴 aberto |
| **8** | **Integração aplica migrations sem janela** *(novo)* | 🟠 **Alto** | Estratégia A durante o Bloco A — ver Parte 11 | Fundador | 🔴 aberto |
| **9** | **Pausa do projeto por inatividade (Free)** *(novo)* | 🟠 **Alto** | Resolvido pela contratação do Pro na Fase 4.0 | Fundador | 🔴 aberto |
| **10** | **40 contas de teste em produção** *(promovido)* | 🟡 **Médio** | Limpeza **só após** cobertura de backup confirmada | Admin | 🔴 aberto |
| **11** | **22 funções `security definer` acessíveis a `anon`** *(novo)* | 🟡 **Médio** | Revisão pós-GO; classe já corrigida antes (`5e36d18`) e reincidente — criar guarda automatizada | Técnico | 🔴 aberto (1.1) |

> **A mudança de fundo:** a Revisão 2 listava seis riscos *aceitos*. Cinco continuam aceitáveis. **O nº 1 deixou de ser aceitável**, porque a mitigação que o sustentava não existia. Um risco aceito com base numa mitigação inexistente não é um risco aceito — é um risco não percebido.

---

# PARTE 10 — Backlog 1.1

Deliberadamente fora da 1.0:

*Produto* — Portal do Profissional; redução do custo humano nos passos 7, 8 e 9; frequência de condutas no cruzamento; Observatório da Experiência; Compatibility Intelligence.

*Governança* — execução verificada da exclusão sobre storage; tela `/aceites` e superfície do Curador para registrar aceite do profissional; exportação e retificação de história; limites de upload (FUN-02); log de leitura de dado clínico (AU-03).

*Operação* — suíte E2E segura em paralelo local; alertas de negócio (leads perdidos, Perfis aguardando reconhecimento).

*Blocos abertos do Plano Mestre, não bloqueantes* — **F** (superfícies e papéis, 9 achados), **G2** (honestidade do E2E, 6 achados), **K** (documentação e higiene, 14 achados).

---

# PARTE 11 — Infraestrutura de publicação *(nova na Revisão 3)*

## Registro oficial: existem dois pipelines, não um

O push em `main` dispara **dois** mecanismos independentes. Esta é a descoberta estrutural da execução do Bloco A, e ela não estava documentada em lugar nenhum do repositório.

```
                    git push origin main
              ┌──────────────┴──────────────┐
              ▼                             ▼
      VERCEL (código)              SUPABASE ↔ GITHUB (schema)
      lê vercel.json                clona main, conecta :5432,
                                    aplica migrations pendentes
```

### Pipeline 1 — Vercel

| Item | Estado |
|---|---|
| Gatilho | push em `main` (integração Git nativa) |
| Efeito | deploy em produção, alvo `production` |
| **Controle** | `vercel.json` com `git.deploymentEnabled: { "main": false }` |
| **Estado atual** | ⏸️ **PAUSADO** desde o commit `6dcbc02` (2026-08-03 21:56Z) |
| Confiabilidade do controle | **Comprovada 3×** — resistiu ao push da pausa, ao merge e ao push da tag |
| Proteção adicional | SSO da Vercel cobre todos os URLs **exceto** o domínio de produção — preview é ambiente inacessível ao público |
| Portão de CI | **Nenhum.** `main` tem `protected: false` e o Actions não bloqueia deploy |

### Pipeline 2 — Integração Supabase ↔ GitHub

| Item | Estado |
|---|---|
| Como foi habilitada | Painel Supabase → Integrations → GitHub. **Não há nenhum arquivo no repositório que a configure** |
| Branches | **Somente `main`** — 12 pushes em `remediacao/**` não geraram nenhuma execução |
| Quando dispara | 30 a 35 s após cada push em `main` |
| Operações | clona o repo → verifica saúde → conecta em `:5432` → **aplica migrations pendentes** → pula seed e configuração (branch protegido) → publica edge functions |
| Credencial | gerenciada pela plataforma; **não usa segredo do repositório** |
| Modo somente leitura | **não existe** |
| **Estado atual** | 🔴 **ATIVA** |
| Pendentes hoje | **0** — repositório e produção em 91 migrations |

**Registro do evento que a revelou:** em 2026-08-03 às 22:10:08Z, `workflow_run 1c724448f10945c3bb5a9eab71077203`, esta integração aplicou as três migrations do Bloco H em produção, disparada pelo push do merge `4ad2f1f`. A aplicação foi completa e correta — equivalência estrutural provada —, mas **fora de qualquer janela, sem backup e com usuários reais em sessão**.

## Estratégia oficial

| Período | Estratégia | Decisão |
|---|---|---|
| **Durante o Bloco A** | **A — desligar a integração** | Custo zero hoje (0 pendentes). Um gatilho, um efeito. Elimina a assimetria que produziu o incidente |
| **Após a P1** *(restore verificado)* | **B — religar e adaptar o processo** | Com recuperação provada, a integração é **melhor** que um humano com senha: migrations só chegam por commit revisado, mergeado e com CI verde |

**Estratégia C (substituir por fluxo manual permanente) está descartada**, e o motivo é registrado: ela exigiria manter a senha de produção acessível — exatamente o que a Parte 12 quer eliminar.

**Data de retorno da Estratégia B:** a definir na conclusão da P1. Registrar aqui quando ocorrer, para que "temporário" não vire permanente por inércia.

---

# PARTE 12 — Segurança: SEG-01 e SEG-02 *(nova na Revisão 3)*

## SEG-01 — Credenciais de produção expostas na estação de trabalho

`.env.local` contém sete entradas. **Cinco são de produção e nenhuma é necessária para desenvolver.**

| # | Credencial | Alcance | Necessária em dev? |
|---|---|---|---|
| 1 | URL do projeto de produção | endereço | ❌ |
| 2 | Chave `anon` de produção | leitura/escrita sujeitas a RLS | ❌ |
| 3 | **Chave `service_role`** | **ignora toda RLS — leitura e escrita totais** | ❌ |
| 4 | **Token de administração** | **Management API: configuração, projetos, migrations** | ❌ |
| 5 | **Senha do banco, em texto claro** | **DDL direto, nível de superusuário do projeto** | ❌ |
| 6 | Chave do motor do Relatório | — | ✅ |
| 7 | Identificador de modelo (não é segredo) | — | ✅ |

Além disso, `supabase/.temp/project-ref` vincula este diretório ao projeto de produção.

**Higiene que funcionou e deve ser preservada:** todos os `.env*` estão no `.gitignore`; **nenhum `.env` jamais foi commitado**, verificado em todo o histórico; `scripts/env-guard.mjs` mantém o projeto de produção em `PROJETOS_PROIBIDOS` e recusa antes da primeira chamada de rede; `scripts/guard-db-reset.mjs` bloqueia `--linked` e `--project-ref`. **Estas guardas não devem ser contornadas** — nem para capturar o dump da Fase 4.0.

## SEG-02 — Inventário de credenciais

Concluído nesta revisão para a estação de trabalho e para a CI. **A CI não possui nenhum segredo** — verificado: zero referências a `secrets.` em `.github`. Falta inventariar as variáveis de ambiente da Vercel, que exigem acesso ao painel.

## Plano de rotação — dois grupos com custos opostos

### Grupo 1 — rotação sem impacto, executável imediatamente
Token de administração (#4) e senha do banco (#5). **A aplicação em produção não usa nenhuma das duas**, e a integração Supabase usa credencial própria da plataforma.

1. Revogar o token; gerar novo apenas se houver uso justificado.
2. Redefinir a senha do banco.
3. Remover as cinco linhas de produção de `.env.local`.
4. Verificar: suíte de integração, `build:local`, `supabase:ledger:check`.
5. **Usar a senha nova para capturar o dump manual da Fase 4.0.**

### Grupo 2 — rotação com janela obrigatória
Chaves `anon` e `service_role` (#2, #3) derivam do JWT secret, e a chave do motor (#6) é lida pela aplicação. Rotacioná-las:

- **desloga todos os usuários em sessão** — havia 35 sessões registradas nesta revisão;
- exige atualizar as variáveis na Vercel **e um novo deploy** para tomar efeito.

**Portanto: rotacionar o Grupo 2 na mesma janela da Fase 4.1**, com aviso prévio aos usuários.

---

# PARTE 13 — Governança documental *(nova na Revisão 3)*

## Documentos da 1.0 e sua precedência

| Documento | Autoridade sobre | Estado |
|---|---|---|
| **`RELATORIO_FINAL_DE_PRONTIDAO_1_0.md`** | **o estado do projeto** — o que é verdade hoje, com evidência | ✅ vigente |
| **`PLANO_OFICIAL_DE_LANCAMENTO_1_0.md`** (este) | **o caminho** — fases, ordem, critérios de saída, contingência | ✅ vigente, Revisão 3 |
| **REC-03 — Registro de Aplicação Remota e Verificação das Migrations** | o que foi aplicado em produção, quando, por quem, e o aceite do responsável | 🔴 **a redigir** |
| `docs/OPERACAO_BACKUP_RESTORE.md` | o procedimento de backup e restore, medido no Bloco I | ✅ vigente como procedimento |

**Regra de precedência:** havendo conflito entre este plano e o Relatório Final quanto a **fatos**, prevalece o Relatório. Havendo conflito quanto ao **caminho**, prevalece este plano. Nenhum dos dois revoga decisões do Fundador registradas em "Registro da decisão".

## REC-03 — estrutura prevista

Deve conter: estado anterior conhecido · horário real da aplicação · migrations aplicadas com hashes SHA-256 · evidências do ledger · prova de equivalência estrutural · autoria · desvio em relação ao procedimento planejado · riscos gerados · validações realizadas após o fato · **decisão do responsável sobre aceitar o estado resultante** · anexo com os logs preservados.

> ⏳ **Urgência registrada:** os logs de `branch-action`, `postgres` e `auth` da janela do incidente têm **retenção de 24 horas** na plataforma. Se a prova documental for necessária depois disso, precisa ser extraída e anexada ao REC-03 antes do vencimento.

---

## Encerramento

Este documento é a referência operacional da operação assistida. A decisão de reclassificar é do Fundador, está registrada com data, e a execução segue por ela.

O que o plano garante em troca: **nada foi apagado.** Cada frente adiada tem prazo-alvo, responsável e um gatilho escrito que a devolve a bloqueador. A Parte 8 existe para que a decisão de hoje não se torne, por inércia, a arquitetura de amanhã.

~~O caminho até o GO é de **5 a 9 dias**.~~

**Revisão 3 — caminho até o GO:** o Bloco A passa a **7 a 11 dias**, com a Fase 4.0 acrescentada. O **caminho crítico continua sendo a Rede (Fase 3), de 1 a 2 semanas** — não o software, e não a infraestrutura, que corre em paralelo.

A engenharia está pronta e provada. O que falta não se escreve em código.
