# Modelo de Papéis Operacionais — Consolidação da Operação Humana

> ## ⚖️ Decisão tomada — 2026-07-24
>
> A tensão descrita abaixo **foi resolvida pelo Fundador**. A decisão está em
> **[`docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](CORRECAO_DOMINIO_PAPEIS_E_CASE.md)**,
> que tem autoridade sobre este documento em três pontos:
>
> 1. **Três níveis humanos operacionais**: Atendente (Nível 1, abre o Case) →
>    Curador (Nível 2, conduz a Curadoria) → Concierge (Nível 3, acompanha
>    depois da Curadoria).
> 2. **O CRM é plataforma, nunca ator.** Não abre Case, não conduz Curadoria,
>    não decide.
> 3. **Existe apenas `Case`** — um único registro percorre a jornada inteira,
>    mudando de responsável, nunca de identidade.
>
> O papel `atendente` já existe no catálogo de produção (migration
> `papel_atendente_nivel1`). Onde este documento divergir da Correção de
> Domínio, vale a Correção de Domínio.

**Estado**: **Proposto** — não canônico ainda. Conforme `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §4: _"Autoridade não é autodeclarada... o agente de engenharia pode propor um documento como candidato a canônico — nunca declará-lo canônico por iniciativa própria."_ Este documento consolida, pela primeira vez em um único lugar, decisões operacionais que foram comunicadas ao longo desta sessão (função da Atendente, função do Curador, Reunião de Acolhimento, entrega humana da Curadoria) — mas essas decisões, até este momento, **não têm correspondência em nenhum documento já aprovado como canônico** (`docs/architecture/DOMAIN_CURATION.md`, Implementado, define o Curador exclusivamente por P009/P010; a ADR-006, `docs/DECISIONS.md`, não lista "Atendente" no catálogo de papéis). Este documento passa a existir como **candidato**; torna-se autoridade real para os demais domínios só quando o responsável do projeto o aprovar explicitamente — inclusive decidindo se isso exige uma ADR nova (formalizar Atendente como papel do sistema) ou uma atualização direta dos documentos já existentes.

**Por que este registro não pode mais ser só um registro**: a tensão entre os papéis aqui descritos e o que já está implementado/documentado apareceu, de forma independente, em **quatro momentos** desta sessão: (1) `docs/DOMAIN_RELATIONSHIP_SPECIFICATION.md`, Etapa 11; (2) auditoria da Landing ("Retorno Controlado"), Etapa 2; (3) Relationship — Fase 3 (Modelo Operacional Humano), Etapa 9; (4) este documento. Pela própria `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §1, a terceira menção de uma mesma divergência já obrigava uma decisão explícita — esta é a quarta. Este documento não tenta resolver essa decisão sozinho (não é autoridade para isso); apenas deixa de tratá-la como novidade.

**Nenhum código, schema, migration ou API foi criado ou alterado para produzir este documento.**

---

## Etapa 1 — Catálogo oficial de papéis

### Paciente

- **Missão**: viver a experiência de cuidado e decidir sobre a própria jornada.
- **Quando entra**: no momento em que uma conta é criada em seu nome pela equipe (Journey, Camada 0 — `docs/PATIENT_ENTRY_ARCHITECTURE.md`).
- **Quando sai**: nunca sai enquanto o vínculo existir — é o único papel presente do início ao fim de todo ciclo.
- **Responsabilidade principal**: relatar fatos reais sobre a própria experiência (decisão, atendimento, continuidade, encerramento, troca, reabertura).
- **Responsabilidades secundárias**: comunicar necessidades e dúvidas; participar da Reunião de Acolhimento; receber a entrega da Curadoria.
- **Limites**: não decide o mérito clínico da própria condição (isso é do Profissional).
- **Nunca pode fazer**: decidir por outro paciente; alterar registro de terceiros; forçar decisão clínica de um profissional.
- **Autoridade de decisão**: primária, sobre quase todo fato do próprio ciclo (nascimento, continuidade, encerramento, troca, reabertura).
- **Autoridade de registro**: sempre a autoria de fato, mesmo quando um terceiro (Atendente) digita por ele (ver Etapa 4).
- **Quem supervisiona**: ninguém — é o decisor final, sujeito só aos invariantes estruturais do sistema.
- **Quem pode escalonar para ele**: ninguém — decisões não sobem "para" o paciente, nascem dele.
- **Para quem ele pode escalar**: Atendente (operacional), Curador (processo da Curadoria), Profissional (clínico, fora do sistema).

### Atendente

- **Missão**: ser a referência operacional contínua do paciente.
- **Quando entra**: no primeiro contato (ver nota crítica na Etapa 2 sobre esse ponto específico).
- **Quando sai**: no encerramento do ciclo — é, junto com o Paciente, o único papel presente do início ao fim.
- **Responsabilidade principal**: acompanhar, organizar e comunicar — nunca decidir.
- **Responsabilidades secundárias**: registrar fatos relatados pelo paciente por canais não digitais, preservando a autoria dele; encaminhar dúvidas para o papel certo.
- **Limites**: sem qualquer superfície de sistema hoje (achado repetido nesta sessão — ver nota de status).
- **Nunca pode fazer**: diagnosticar, prescrever, interpretar clinicamente, substituir o Curador, substituir médico, conduzir a Reunião de Acolhimento, decidir sobre a Curadoria ou pelo paciente.
- **Autoridade de decisão**: nenhuma sobre o mérito de qualquer fato — só operacional (como organizar, quando encaminhar).
- **Autoridade de registro**: pode registrar em nome do paciente; a autoria permanece dele.
- **Quem supervisiona**: Administrador (operacionalmente, fora do escopo desta teoria).
- **Quem pode escalonar para ela**: Paciente (qualquer dúvida ou pendência).
- **Para quem ela pode escalar**: Curador (dúvida sobre o processo da Curadoria), Profissional (dúvida clínica, fora do sistema), Administrador (situação excepcional).

### Curador

- **Missão**: ser o responsável humano pelo processo de Curadoria — do primeiro encontro à entrega.
- **Quando entra**: na Reunião de Acolhimento.
- **Quando sai**: depois da entrega da Curadoria — reentra só por escalonamento específico (dúvida sobre o processo, ou reavaliação após troca de profissional).
- **Responsabilidade principal**: conduzir a Reunião de Acolhimento; revisar/ajustar/aprovar a proposta técnica (P009, já implementado); realizar a entrega humana.
- **Responsabilidades secundárias**: explicar como ler o resultado; esclarecer próximos passos do processo.
- **Limites**: não realiza consulta, diagnóstico, prescrição ou tratamento.
- **Nunca pode fazer**: diagnosticar, prescrever, interpretar exames, escolher tratamento, emitir opinião médica, escolher o profissional pelo paciente, reinterpretar decisão médica.
- **Autoridade de decisão**: única autoridade que pode aprovar, ajustar ou rejeitar uma Shortlist antes da entrega (P009, real) — nunca decide qual profissional o paciente escolhe.
- **Autoridade de registro**: sobre o `HumanReviewResult` (P009, real); a Reunião de Acolhimento em si não tem registro formal no domínio hoje (achado, ver Etapa 9).
- **Quem supervisiona**: Administrador (operacionalmente).
- **Quem pode escalonar para ele**: Atendente (dúvida sobre o processo), Paciente (diretamente, na Reunião ou na entrega).
- **Para quem ele pode escalar**: Profissional (qualquer conteúdo clínico), Administrador (necessidade de nova Curadoria completa).

### Profissional

- **Missão**: prestar o cuidado real, fora do sistema Aliviar.
- **Quando entra**: no primeiro atendimento efetivo.
- **Quando sai**: no encerramento do relacionamento com aquele paciente específico.
- **Responsabilidade principal**: a relação clínica em si — inteiramente fora do escopo de qualquer domínio de produto.
- **Responsabilidades secundárias**: confirmar fatos de Relationship sob sua própria perspectiva, quando houver canal (hoje não existe).
- **Limites**: sem qualquer canal de sistema hoje para declarar fatos de Connection ou Relationship.
- **Nunca pode fazer**: decidir pelo paciente se o relacionamento continua ou encerra; acessar dados de Relationship de outros pacientes.
- **Autoridade de decisão**: exclusiva sobre as próprias ações clínicas — nunca sobre a vontade do paciente.
- **Autoridade de registro**: nenhuma hoje (lacuna técnica já registrada nas Fases 0/1/2).
- **Quem supervisiona**: ninguém dentro da Aliviar (é um parceiro externo).
- **Quem pode escalonar para ele**: Atendente/Curador, encaminhando dúvidas clínicas.
- **Para quem ele pode escalar**: ninguém dentro do sistema — a relação clínica com o paciente é direta.

### Administrador

- **Missão**: operação e moderação do sistema (ADR-006, já implementado).
- **Quando entra**: na criação da conta do paciente (Journey, Camada 0) e em qualquer situação excepcional.
- **Quando sai**: nunca sai estruturalmente — presença de fundo, ativada só quando necessário.
- **Responsabilidade principal**: criar contas, moderar cadastro de profissionais, operar o painel administrativo.
- **Responsabilidades secundárias**: encerramento administrativo excepcional de um Relationship, com evidência concreta.
- **Limites**: escrita de conteúdo restrita ao caso excepcional — leitura ampla, mesmo padrão já em produção em Connection.
- **Nunca pode fazer**: encerrar por inatividade/silêncio, diagnosticar, escolher profissional pelo paciente, agir sem evidência concreta e autoria nomeada.
- **Autoridade de decisão**: sobre criação de conta, moderação de cadastro; sobre encerramento administrativo, só excepcionalmente.
- **Autoridade de registro**: própria, quando agir excepcionalmente (autor e registrador coincidem nesse caso específico).
- **Quem supervisiona**: ninguém formalmente definido acima dele nesta teoria (fora de escopo).
- **Quem pode escalonar para ele**: Atendente, Curador (situações excepcionais).
- **Para quem ele pode escalar**: ninguém — é o topo operacional dentro do escopo desta teoria.

---

## Etapa 2 — Cadeia completa da jornada humana

```
Visitante
   │  ⚠ ver nota crítica abaixo
   ▼
Atendente (primeiro contato)
   │
   ▼
Paciente aderiu (conta criada — Journey, Camada 0)
   │
   ▼
Curador — Reunião de Acolhimento
   │
   ▼
Curadoria Médica (ACE + P009, automatizado + revisão humana)
   │
   ▼
Curador — Entrega da Curadoria
   │
   ▼
Atendente — acompanhamento contínuo
   │
   ▼
Relationship (Connection → Relationship, conforme Fases 0-2)
   │
   ▼
Encerramento
   │
   ▼
Fim do ciclo (ou Reabertura → novo ciclo completo)
```

**Nota crítica, obrigatória de registrar**: o primeiro passo desta cadeia ("Visitante → Atendente") descreve exatamente o canal que `docs/PATIENT_ENTRY_ARCHITECTURE.md` já investigou de forma exaustiva (LAND DO PACIENTE, Fase 11) e concluiu, com o responsável do projeto, **não existir hoje** — "Cenário C: nenhum canal real existe", decisão registrada de aceitar essa lacuna por ora. Colocar a Atendente como o ponto de entrada de um Visitante desconhecido, nesta cadeia, descreve um modelo operacional-alvo, não algo já sustentado por qualquer infraestrutura (nenhum provedor de e-mail/SMS/WhatsApp, nenhuma tabela de lead, nenhum canal registrado). Esta cadeia é válida como **teoria operacional**, mas o primeiro elo continua sem suporte técnico, exatamente como já registrado.

---

## Etapa 3 — Fronteiras entre papéis

| Situação                      | Quem faz                                               | Quem nunca faz                                 | Quem pode apoiar                         | Quem decide                           | Quem apenas comunica         |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------------- | ---------------------------------------- | ------------------------------------- | ---------------------------- |
| Primeiro contato              | Atendente (teoria; sem canal real hoje)                | Curador, Profissional                          | Administrador                            | Paciente (se aderir)                  | Atendente                    |
| Adesão (criação de conta)     | Administrador                                          | Atendente, Curador                             | —                                        | Administrador                         | Atendente                    |
| Reunião inicial (Acolhimento) | Curador                                                | Atendente, Administrador                       | —                                        | Curador conduz                        | Curador                      |
| Explicação do processo        | Curador (no Acolhimento); Atendente (reforço contínuo) | Profissional                                   | —                                        | —                                     | Ambos, em momentos distintos |
| Coleta das primeiras queixas  | Curador (Acolhimento)                                  | Atendente, Administrador                       | —                                        | Não se aplica (é escuta, não decisão) | Curador                      |
| Acompanhamento                | Atendente                                              | Curador (salvo escalonamento)                  | —                                        | Paciente (sobre o próprio fato)       | Atendente                    |
| Entrega da Curadoria          | Curador                                                | Atendente, Profissional                        | Administrador (aciona P010)              | Curador/Administrador (P010, real)    | Curador                      |
| Dúvidas administrativas       | Atendente                                              | Curador, Profissional                          | —                                        | Atendente                             | Atendente                    |
| Dúvidas clínicas              | Ninguém na Aliviar — encaminhado ao Profissional       | Atendente, Curador (nunca respondem)           | —                                        | Profissional, fora do sistema         | Atendente encaminha          |
| Troca de profissional         | Paciente, exclusivo                                    | Atendente, Curador, Profissional (não iniciam) | Atendente (organiza), Curador (reavalia) | Paciente                              | Atendente                    |
| Encerramento                  | Paciente (sempre); Administrador (excepcional)         | Curador, Profissional                          | Atendente                                | Paciente/Administrador                | Atendente                    |
| Reabertura                    | Paciente, exclusivo                                    | Administrador (nunca inicia sozinho)           | Atendente, novo Curador                  | Paciente                              | Atendente                    |

---

## Etapa 4 — Responsabilidades permanentes

**Permanece sob responsabilidade da Atendente durante todo o ciclo**: ser referência operacional; acompanhar pendências; organizar contatos; manter o paciente informado; encaminhar solicitações — do primeiro contato ao encerramento, sem interrupção.

**Permanece sob responsabilidade do Curador**: a associação ao processo de Curadoria daquele paciente específico — mas de forma **pontual**, não contínua: reativa só quando há escalonamento (dúvida sobre o processo, reavaliação por troca de profissional), nunca uma presença de fundo constante como a da Atendente.

**O que termina após a entrega**: a presença ativa e default do Curador — ele não acompanha o dia a dia do Relationship, só reentra por chamado específico.

**O que nunca pertence a nenhum dos dois**: qualquer decisão clínica (Profissional, exclusivo); qualquer decisão sobre o próprio fato vivido pelo paciente (nascimento, continuidade, encerramento, troca, reabertura — sempre do Paciente); qualquer decisão sobre elegibilidade técnica ou composição do ACE (protocolos, exclusivo do Método).

---

## Etapa 5 — Modelo operacional do Curador

### Função 1 — Reunião de Acolhimento

**Objetivos**: ouvir; explicar o funcionamento da Aliviar; reduzir ansiedade; apresentar o processo; entender as primeiras queixas; alinhar expectativas.

**Explicitamente, o Curador nesta função**:

- **não** diagnostica;
- **não** interpreta exames;
- **não** escolhe tratamento;
- **não** escolhe profissional;
- **não** realiza consulta médica.

### Função 2 — Entrega da Curadoria

**Objetivos**: apresentar o resultado; explicar a lógica da composição (sem nomear ACE, protocolos ou qualquer mecanismo interno — mesma regra já vigente em toda comunicação com o paciente, `docs/LANDING_CREATIVE_DIRECTION.md` §2); responder dúvidas sobre o processo; encaminhar o material ao paciente; garantir que os próximos passos foram compreendidos.

**Explicitamente, o Curador nesta função também**:

- **não** decide pelo paciente;
- **não** reinterpreta a decisão médica;
- **não** substitui o profissional escolhido;
- **não** garante resultado clínico.

**Achado técnico, registrado, não resolvido nesta fase**: das duas funções, só a Função 2 tem correspondência parcial com um evento já implementado (`deliverFinalCuradoriaAction`, P010) — a Função 1 (Reunião de Acolhimento) não tem, hoje, nenhum registro estruturado no sistema; é inteiramente extra-sistêmica.

---

## Etapa 6 — Modelo operacional da Atendente

A Atendente é a referência operacional contínua do paciente, acompanhando toda a extensão do ciclo:

```
primeiro contato → adesão → acolhimento → curadoria → Relationship → encerramento do ciclo
```

- **O que acompanha**: cada etapa da jornada, sem exceção — é o único papel (junto do Paciente) presente do início ao fim.
- **O que registra**: fatos relatados pelo paciente por canais não digitais, sempre preservando a autoria dele (nunca a própria).
- **O que comunica**: o status e os próximos passos ao paciente; escalona dúvidas para o papel certo.
- **O que organiza**: contatos, pendências, a logística de momentos conduzidos por outros papéis (ex.: agendar a Reunião de Acolhimento, sem conduzi-la).
- **O que nunca decide**: nada sobre o mérito de um fato do paciente (nascimento, continuidade, encerramento, troca, reabertura — sempre dele), nada clínico, nada sobre o conteúdo da Curadoria.

---

## Etapa 7 — Cadeia de autoridade

| Situação                            | Percebe                       | Registra           | Comunica                | Decide                       | Executa             | Nunca participa                 |
| ----------------------------------- | ----------------------------- | ------------------ | ----------------------- | ---------------------------- | ------------------- | ------------------------------- |
| Primeiro contato                    | Visitante/Atendente (teórico) | — (sem canal real) | Atendente               | Visitante (se aderir)        | —                   | Curador, Profissional           |
| Adesão                              | Administrador                 | Administrador      | Atendente               | Administrador                | Sistema             | Curador, Profissional           |
| Reunião de Acolhimento              | Curador, Paciente             | Não formalizado    | Curador                 | Curador conduz               | Curador             | Atendente, Sistema              |
| Primeiro atendimento (Relationship) | Paciente                      | Paciente/Atendente | Atendente               | Paciente                     | Sistema             | Curador, Administrador, CI      |
| Continuidade                        | Paciente/profissional(futuro) | Paciente/Atendente | Atendente               | — (registro, não decisão)    | Sistema             | Curador (salvo escalonamento)   |
| Entrega da Curadoria                | Curador                       | Sistema (artefato) | Curador                 | Curador/Administrador        | Curador + Sistema   | Atendente, Profissional         |
| Troca de profissional               | Paciente                      | Paciente           | Atendente + Curador     | Paciente, exclusivo          | Sistema             | Profissional, Administrador     |
| Encerramento (paciente)             | Paciente                      | Paciente/Atendente | Atendente               | Paciente                     | Sistema             | Curador, CI, Observatório       |
| Encerramento (administrativo)       | Administrador                 | Administrador      | Atendente               | Administrador, com evidência | Sistema             | Curador, Profissional           |
| Reabertura                          | Paciente                      | Paciente           | Atendente, novo Curador | Paciente, exclusivo          | Sistema (novo Caso) | Administrador iniciando sozinho |

---

## Etapa 8 — Relação com os domínios

| Domínio                        | Papel(is) que participam                                                                                                                                                | Papel(is) que nunca participam                                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Connection**                 | Paciente (autor exclusivo, já implementado e testado); Curador/Administrador (leitura)                                                                                  | Atendente (sem superfície de sistema hoje), Profissional (sem canal)                                                                   |
| **Relationship**               | Paciente (autor primário); Atendente (registro em nome do paciente, operacional, sem integração técnica ainda); Curador (escalonamento); Administrador (só excepcional) | Profissional (sem canal), CI, Observatório                                                                                             |
| **Curadoria (P009/P010)**      | Curador (autoridade central); Administrador (aciona a entrega)                                                                                                          | Atendente, Paciente (recebe, não decide sobre a própria Curadoria), Profissional                                                       |
| **Journey**                    | Administrador (cria Caso, ação manual); Paciente (relata a história)                                                                                                    | Curador, Atendente                                                                                                                     |
| **Compatibility Intelligence** | Nenhum papel humano participa diretamente — domínio de interpretação automática                                                                                         | Todos os papéis humanos, diretamente (a Equipe Clínica participa via Governança do Conhecimento, um domínio adjacente, não o CI em si) |
| **Landing**                    | Nenhum papel humano opera dentro dela (conteúdo público) — a Atendente seria o destino de um eventual canal de contato futuro, hoje inexistente                         | Curador, Profissional, Administrador                                                                                                   |
| **Produto autenticado**        | Paciente (`/paciente`), Curador (`/curador`), Administrador (`/admin`)                                                                                                  | Atendente (sem superfície própria hoje — achado repetido)                                                                              |

---

## Etapa 9 — Auditoria

- **Responsabilidade duplicada?** Não encontrada — cada papel tem escopo disjunto, reforçado pela distinção pontual (Curador) vs. contínua (Atendente).
- **Responsabilidade sem dono?** Sim, duas: (1) resolução de divergência de fato — já registrada desde a Fase 1, ainda sem autoridade nomeada; (2) o canal real de "Visitante → Atendente" (primeiro contato de um desconhecido) — tecnicamente sem dono, mesmo achado já formalizado em `docs/PATIENT_ENTRY_ARCHITECTURE.md` como Cenário C aceito.
- **Autoridade excessiva?** Não encontrada — mesmo o Administrador, candidato mais óbvio, tem escrita estritamente excepcional.
- **Papel sem função?** Não.
- **Função sem papel?** A "adesão" de um Visitante desconhecido é uma função sem papel claramente instrumentado hoje — atribuída aqui à Atendente operacionalmente, mas sem qualquer superfície digital real.
- **Conflito entre Curador e Atendente?** Não — fronteiras já claras (pontual vs. contínuo, clínico-adjacente vs. puramente operacional).
- **Conflito com ADR-006?** Sim — "Atendente" não existe no catálogo de papéis (`user_roles`: `administrador`, `curador_medico`, `paciente`, `profissional`). Esta é a quarta vez que essa tensão é registrada nesta sessão (ver nota de status, topo deste documento).
- **Conflito com Connection?** Não — nenhuma escrita nova é proposta para Atendente/Curador dentro de Connection; o Paciente continua autor exclusivo, exatamente como já testado (Fase 4, 14/14 testes de integração).
- **Conflito com Relationship?** Não diretamente, mas reforça o achado já registrado na Fase 3 desta linha: nenhum ponto de integração técnica existe ainda entre a operação humana (Atendente/Curador) e os eventos formais do domínio Relationship (Fase 2).

---

## Veredito obrigatório

**B) Modelo consistente, mas ainda possui lacunas.**

Justificativa: os cinco papéis têm missão, fronteiras e autoridade claramente disjuntas — nenhum conflito de responsabilidade real foi encontrado entre eles. Mas três lacunas seguem de pé, todas já registradas em fases ou documentos anteriores, nenhuma inventada agora: (1) resolução de divergência de fato, sem autoridade nomeada; (2) o canal real de entrada de um Visitante desconhecido, já formalmente aceito como lacuna operacional em `docs/PATIENT_ENTRY_ARCHITECTURE.md`; (3) a ausência de qualquer representação de "Atendente" no catálogo de papéis (ADR-006) e de qualquer registro estruturado da Reunião de Acolhimento no sistema — agora na sua quarta menção nesta sessão, exigindo, pela própria política de governança documental já escrita, uma decisão explícita antes de este documento poder se tornar autoridade canônica para os demais domínios.

---

## Documentos relacionados

- `docs/DOMAIN_RELATIONSHIP_SPECIFICATION.md` — primeira menção da tensão Curador/Atendente vs. `DOMAIN_CURATION.md`/ADR-006.
- `docs/PATIENT_ENTRY_ARCHITECTURE.md` — Cenário C (canal de entrada de visitante), aceito como lacuna pelo responsável do projeto.
- `docs/architecture/DOMAIN_CURATION.md` — fonte oficial e já implementada do papel real do Curador (P009/P010).
- `docs/DECISIONS.md` — ADR-006 (catálogo de papéis), referenciado como divergência não resolvida.
- `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` — regra da terceira/quarta menção, motivo pelo qual este documento não se autodeclara canônico.
