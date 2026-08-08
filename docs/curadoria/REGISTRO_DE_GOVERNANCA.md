# Registro de Governança — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-00) |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` |
| **Status** | **Vigente** — nível derivado; registra, não decide |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §18 · [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) · [`../DECISIONS.md`](../DECISIONS.md) |
| **Documentos relacionados** | [`INDICE_DA_CURADORIA_2_0.md`](INDICE_DA_CURADORIA_2_0.md) · [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md) · [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md) |
| **Origem** | Pacote F-00 |

> **Natureza deste documento:** registro. Ele **não cria** autoridade, **não decide** nada e
> **não interpreta** o domínio. Onde ele divergir da Arquitetura ou do Modelo, vale o
> documento com autoridade — e a divergência é defeito deste registro.

---

## 1. Autoridades

| Papel | Quem | Autoridade sobre | Estado |
|---|---|---|---|
| **Fundador** | responsável de negócio | Método, Constituição, reabertura de decisão congelada, nomeações | **Ativo** |
| **Agente 00 — Guardião** | revisão constitucional | aprovar arquitetura; aprovar princípios que não exigem ADR (P-12); DP-7, DP-8, DP-9 | **Ativo** — parecer **não versionado** (DP-11) |
| **Agente 01 — Auditor** | diagnóstico | auditoria operacional | **Concluído** (2026-08-04) |
| **Agente 02 — Arquiteto** | arquitetura da 2.0 | documento arquitetural | **Concluído** — v1.2 aguardando revisão |
| **Agente 03 — Implementador** | planejamento e execução de pacotes | ordem de execução, pacotes, testes, rollback | **Ativo** — **implementação não autorizada** |
| **Agente 04 — Verificador** | verificação independente de pacote | aceite técnico | **Sem parecer emitido** |
| **Certificador** | certificação de release | publicação | **Sem parecer emitido para a 2.0** |
| **Autoridade de Método sobre Regras de Derivação** | §10.5 da Arquitetura | criar, versionar, suspender e retificar regra de derivação | **ATIVA — ocupante: `DT-01 — Fundador`**, desde **2026-08-05**, em **acumulação temporária** (DP-4 fechada; ver §1.1) |
| **Responsável de engenharia** | operação do repositório | versionamento, janela de publicação, ambiente | **Ativo** |

**Regra estrutural:** o Implementador não decide domínio. Toda ambiguidade retorna ao
Arquiteto; toda decisão de Método retorna ao Fundador ou ao Guardião.

### 1.1 Autoridade de Método sobre Regras de Derivação — nomeação

**Decisão do DT-01 — Fundador, em 2026-08-05 (fecha a DP-4).**

| Campo | Valor |
|---|---|
| **Função** | Autoridade de Método sobre Regras de Derivação (§10.5 da Arquitetura) |
| **Ocupante** | **`DT-01 — Fundador`** |
| **Situação** | **ATIVA** |
| **Início** | **2026-08-05** |
| **Natureza** | **Acumulação temporária** |
| **Escopo** | Regras de Derivação da Curadoria 2.0 |
| **Substituição** | **somente por decisão formal versionada** |

**Autoridade conferida:** aprovar regra · promover para `VIGENTE` · suspender ·
reativar · revogar. **Obrigação de motivo, e de ADR onde a ADR-069 a exige.**
**Autoria individual preservada** — cada ato é praticado e registrado em nome
próprio.

**A nomeação NÃO autoriza:**

| # | Proibição |
|---|---|
| 1 | `service_role` como autoridade humana |
| 2 | conta técnica sem vínculo com o DT-01 |
| 3 | delegação informal |
| 4 | aprovação pelo Implementador |

### Vínculo técnico — **RESOLVIDO E LAVRADO em 2026-08-08**

*(Histórico: de 2026-08-05 a 2026-08-08 este campo registrou "vínculo técnico
pendente de resolução operacional, sem alterar a validade da nomeação humana".
O pré-flight da Regra 001 mediu o efeito — `derivation_rules.proposed_by` e
`derivation_rule_transitions.actor_id` são `uuid not null`, logo nenhuma regra
podia sequer nascer. A pendência foi resolvida pelo ato abaixo.)*

| Campo | Valor |
|---|---|
| **Identidade normativa** | **`DT-01 — Fundador / Autoridade de Método`** (DP-4, 2026-08-05) |
| **Identidade técnica** | **`54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b`** |
| **Conta humana** | `barbosacaiopadilha@gmail.com` |
| **Fonte canônica** | `auth.users` do projeto **`aliviar-2-prod`** |
| **Verificador técnico** | **Agente 01 — Implementador / Responsável de Engenharia** |
| **Data da comprovação** | **2026-08-08** |
| **Ratificação** | **DT-01**, no mesmo ato |

**Qualificação comprovada da conta:** humana · pessoal · ativa · e-mail
confirmado · **anterior a esta missão** · **não** fixture · **não** service
account · **não** conta técnica compartilhada · **não** conta de Curador ·
**não** conta do Concierge · **não** criada para satisfazer constraint.

**Compatibilidade técnica verificada** com `derivation_rules.proposed_by`,
`derivation_rules.approved_by` e `derivation_rule_transitions.actor_id` —
nenhuma dessas colunas possui FK que impeça o uso do identificador.

> **UUID ≠ autoridade.** O identificador prova **quem é a pessoa**; a autoridade
> continua derivando **exclusivamente** da governança que constituiu o papel
> `DT-01 — Fundador / Autoridade de Método` (DP-4). O vínculo legítimo é
> **pessoa técnica comprovada + papel normativo já lavrado** — e as quatro
> proibições acima permanecem integralmente em vigor.

**Nenhuma tabela de mapeamento foi criada**: nenhuma autoridade vigente a exige,
e este registro é a fonte documental do vínculo.

**Nenhum segredo ou credencial foi publicado** — apenas identidade e vínculo
normativo.

Detalhamento e consequências em
[`PREFLIGHT_MATERIALIZACAO_REGRA_001.md`](PREFLIGHT_MATERIALIZACAO_REGRA_001.md) §3.

**Nota de risco herdada (ADR-068 item 6, RA-1 do PA-2):** a acumulação concentra,
na mesma pessoa, propor · aprovar · confirmar · responder. A ADR-060 já registrou
a mesma classe de risco como **aceito e datado**, vinculado à segunda conta ali
prevista. **A acumulação é declarada, não silenciosa** — e é essa declaração que
impede que ela vire o normal.

## 2. Ordem de precedência entre documentos

1. Decisões explícitas do Fundador.
2. ADRs vigentes (`../DECISIONS.md`).
3. [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) — o que não pode ser violado.
4. [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0 — canônico do domínio.
5. [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md) v1.0.
6. [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 — **seções DOMÍNIO/ARQUITETURA/GOVERNANÇA, quando aprovada**.
7. [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md) e [`ROADMAP_EXECUTIVO_CURADORIA_2_0.md`](ROADMAP_EXECUTIVO_CURADORIA_2_0.md) — derivados.
8. Comportamento atual do sistema.
9. Código existente.

## 3. Estado atual da Curadoria 2.0 *(reescrito em 2026-08-08, no fechamento da Onda 1 — a versão anterior descrevia o estado de 2026-08-04)*

| Fato | Situação | Evidência |
|---|---|---|
| **Onda 0** | Fechada na prática: DP-1 ratificada (PA-1) · DP-2 **fechada** (2026-08-08) · DP-3 resolvida · DP-4 fechada (DT-01) · documentos versionados | este registro §4; mapa |
| **Onda 1** | **FORMALMENTE ENCERRADA (2026-08-08)** — 12 itens encerrados; o **1.2** foi carregado e depois **encerrado por absorção autorizada no 2.6** (PA-14). **Sem pendência material ou formal bloqueante**: 1.5 e 1.7 encerrados (Atos 3 e 4 do ciclo); F-REC-1..3 resolvidos — a baixa recognitiva pelo Certificador é **paralela e não bloqueante** | dossiê `ddadcd7`; ciclo `66717ab`/`9afaead`; decisão do Guardião |
| **Onda 2** | **FORMALMENTE ENCERRADA (2026-08-08)** — 2.1 · série 2.2 · 2.3 · 2.4 · 2.6 · 2.C **todos encerrados**; **2.5 PROIBIDO POR ADR** enquanto DP-5 estiver aberta. **Pacote funcional obrigatório restante: NENHUM.** Veredito do Guardião: `ONDAS 1 E 2 — ENCERRAMENTO COM PENDÊNCIAS NÃO BLOQUEANTES` | dossiê [`DOSSIE_DE_FECHAMENTO_ONDAS_1_E_2.md`](DOSSIE_DE_FECHAMENTO_ONDAS_1_E_2.md) (`34132aa`); mapa §3 |
| ADRs da 2.0 | **ADR-066/067/068/069 lavradas**; ADR-C retirada; ADR-E recomendada (DP-2 já fechada sem ela) | `DECISIONS.md` |
| Contratos | 1.8-R1 cumprido · 1.11 e 1.12 aprovados e encerrados · 1.A aprovado e encerrado | índice 16d–16g |
| Camada de Derivação | estrutura completa: propostas, regras, ciclo de vida, ponte, atos de decisão, juízo humano. **Um único `EXECUTE` operacional — na decisora** (2.C). **Nenhum grant de tabela** na camada de derivação/juízo · **nenhuma policy nova** · **zero regra material real** · **zero proposta real** — os emissores (Case e profissional) permanecem **vazio-honestos**, devolvendo `SEM_REGRA_VIGENTE` enquanto nenhuma regra `VIGENTE` existir | migrations `20260805..20260808`; PA-17 |
| **Fronteira Humana** | **ABERTA NO RECORTE AUTORIZADO DO 2.C (2026-08-08)** — **um único `EXECUTE` de `decidir_proposta` a `authenticated`**, com **gate interno por alvo** (Curador do Case · `administrador` no profissional). **Fechados**: `anon` · `PUBLIC` · `service_role` sem autoria humana · **zero policy nova** · **zero grant de tabela** · nenhuma abertura lateral. **O recorte não é ampliável sem nova lavratura** | Contrato 2.C §8; PA-17 |
| Dez condições do §15.0 | **10/10 satisfeitas e testadas** | dossiê §12 |
| **R-1** | **INSTRUMENTADA E MITIGADA, NÃO RESOLVIDA.** A observação **ainda não começou** — começa no **primeiro ato operacional real**. **Discordância zero sustentada é ALARME**, não sucesso. **Nenhum threshold novo criado** | Arquitetura §16; Contrato 2.C §12 |
| **CD-1** | **bloqueia estabilizar ou inventar valores da ponte**; **não** bloqueia a infraestrutura, **não** bloqueia regra profissional legítima, **não** bloqueia a observação futura. **O lado Case continua vazio por construção** | Arquitetura; Contrato 2.C §8/§12 |
| **H-T-01** | **APROVADA — OPÇÃO C (guarda de regime)**, em **missão separada**: enumeração nominal das migrations de cada regime protegido; migration nova que toque o regime sem estar lavrada **derruba**. **Não bloqueia** o fechamento das Ondas nem a primeira regra material; **não reabre** pacote certificado; a lista **cresce só por lavratura**. F-2.3-1/F-2.4-1/F-2.6-1/F-2.C-1 seguem **não bloqueantes até a guarda existir — e então são consumidas por ela, não apagadas** | dossiê §6; decisão do Guardião |
| Certificação global | **não existe rito separado** — o fechamento **por onda** é suficiente no processo vigente | conclusão do Guardião |
| Rede real | **Inexistente** | Congelamento §7.2 |
| Janela de publicação | **Inexistente** | Congelamento §7.1 |

## 4. Decisões pendentes (DP-1 a DP-11)

Transcritas da Arquitetura §18. **Nenhuma é do Implementador.**

| # | Decisão | De quem | Bloqueia | Estado |
|---|---|---|---|---|
| **DP-1** | P15 — o Motor recebe viabilidade? Guarda executável ou correção do Congelamento §4.3 | Arquiteto + Guardião | Onda 1.1, e portanto tudo | **Aberta** |
| ~~**DP-2**~~ | Destino formal do ACE e do dado histórico | **Fundador** | retirada da segunda entrega (P9) | **FECHADA (2026-08-08)** — **aprovada e lavrada pelo Fundador.** Teor vinculante: **motor anterior permanece congelado** · **nenhuma operação nova** nele · **histórico existente preservado integralmente** · o congelamento **não autoriza exclusão, reescrita ou migração destrutiva** · novos fluxos seguem a arquitetura da Curadoria 2.0 · **a implementação existente do Item 1.7 (`2c039a3`) é reconhecida como execução desta decisão** — a decisão antecedeu materialmente a implementação; a lavratura formal ocorreu agora. ADR-E permanece **recomendada, não bloqueante** |
| **DP-3** | Listas provisórias P3–P7 (`OPCOES_PROVISORIAS_*`) | Método | ponte grau→importância | **Aberta** |
| ~~**DP-4**~~ | Quem exerce a Autoridade de Método sobre Regras de Derivação | Fundador | — | **FECHADA (2026-08-05)** — **DT-01 nomeado**, em acumulação temporária (§1.1). **Consequência operacional:** a condição 6 da ADR-066 §497 (*"nomeada e ativa"*) passa a estar satisfeita; regras de derivação podem ser aprovadas e promovidas a `VIGENTE`. **Não autoriza abrir o 2.2C** |
| **DP-5** | Régua de graduação por consequência + lista nominal do que nunca entra em bloco | Método, **por ADR** | subescopo 2.5; enquanto aberta, o regime de bloco é **proibido de existir no repositório** | **Aberta** |
| **DP-6** | Tabela grau→importância — os **valores** | Método, **após Cases reais** | estabilização da regra (Onda 5) | **Aberta, bloqueada por DP-Rede** |
| **DP-7** | P-07, P-08, P-10, P-11 viram domínio? | Guardião, por ADR | Onda 2 inteira | **RESPONDIDA** (ADR-066): P-07, P-08 e P-10 promovidos a princípios oficiais de domínio |
| **DP-8** | P-12 (um relógio) aprovado como princípio arquitetural? | Guardião, sem ADR | Onda 3 | **Aberta** |
| **DP-9** | Ampliar quem confirma o Mapa do Profissional (toca RLS congelada, ADR-040 item 6) | Guardião, por ADR-D | G4/RI4 | **RESPONDIDA com "não ampliar"** (ADR-068 item 7): a RLS **não** é reaberta; G4 resolve-se por redução de carga |
| **DP-10** | Versionar os documentos da 2.0 e separar o pacote de segurança | responsável de engenharia | qualquer decisão constitucional definitiva | **Aberta — endereçada por este pacote F-00, pendente de commit** |
| **DP-11** | Gravar o parecer do Guardião como arquivo | Agente 00 | validação das matrizes §0.2/§0.3 da Arquitetura | **RESPONDIDA em parte** — [`PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md`](PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md) consolida os pareceres do bloco de domínio; as ADR-066/067/068 registram que a lista original de ressalvas continua sem arquivo |

## 5. ADRs pendentes

| ADR | Objeto | Necessária para | Estado |
|---|---|---|---|
| **ADR-A** → **ADR-066** | Camada de derivação: `derivation_proposals`, ponte grau→importância (**forma e governança**), graduação por consequência, princípios P-07/P-08/P-10 | Onda 2 | **LAVRADA** 2026-08-04 — anexo [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md). **Não autoriza implementação** (ver §7) |
| **ADR-B** → **ADR-067** | Divisão da etapa AVALIAÇÃO, `curator_judgments`, e a emenda do Modelo para **v3.0** (§7.1–§7.4 e §11) | Onda 2 | **LAVRADA** 2026-08-04 — anexo [`ADR_B_JUIZO_HUMANO.md`](ADR_B_JUIZO_HUMANO.md) |
| ~~ADR-C~~ | ~~Chave de ordenação interna~~ | — | **RETIRADA DO CAMINHO** (bloqueador B2): decisão futura bloqueada por ausência de necessidade operacional real |
| **ADR-D** → **ADR-068** | Autoridade de confirmação e declaração; **RLS da ADR-040 item 6 não reaberta** | Onda 2 | **LAVRADA** 2026-08-04 — anexo [`ADR_D_AUTORIDADE_DE_CONFIRMACAO.md`](ADR_D_AUTORIDADE_DE_CONFIRMACAO.md) |
| **ADR-E** | Destino formal do ACE e do dado histórico | Onda 0/1 | **Não escrita** |

**Numeração:** o log tem **68** ADRs. Os rótulos A/B/D permanecem como apelidos de leitura;
a numeração oficial é **066/067/068**.

## 7. Bloqueio remanescente do pacote F-02 — declarado pelas próprias ADRs

Registro literal, porque é a fonte da decisão e não deve depender de interpretação:

> **ADR-066:** *"Esta ADR não autoriza implementação: o pacote F-02 permanece bloqueado por
> sequenciamento (Onda 1 não iniciada), pela nomeação da Autoridade de Método e pela guarda
> C-01, que deve continuar ativa."*
>
> **ADR-068:** *"nenhuma decisão de domínio falta ao pacote F-02. O bloqueio remanescente é
> de sequenciamento (Onda 1 não iniciada), de nomeação (Autoridade de Método) e de guarda
> (C-01, que deve permanecer ativa)."*

Detalhamento em [`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`](IMPEDIMENTO_F_02_MODELO_DE_DADOS.md) v2.0.

## 6. Divergências de governança registradas

| # | Divergência | Entre | Efeito | Encaminhamento |
|---|---|---|---|---|
| **G-01** | A Arquitetura declara-se **"aguardando revisão constitucional"**; a missão de planejamento declarou-a **aprovada constitucionalmente** | Arquitetura (cabeçalho) × instrução do Fundador | Sob a regra de precedência §2, a decisão do Fundador prevalece — **mas o cabeçalho do documento continua dizendo o contrário**, e quem o ler isoladamente concluirá que nada foi aprovado | O Agente 02 ou o Guardião deve atualizar o cabeçalho da Arquitetura. **O Implementador não altera documento de outro agente** |
| **G-02** | O parecer do Guardião **não existe como arquivo**; as matrizes §0.2/§0.3 da Arquitetura são reconstrução | Arquitetura §0.1 × repositório | Sete bloqueadores e doze ressalvas podem ter sido endereçados contra uma enumeração diferente da real | **DP-11** |
| **G-03** | O Congelamento §6 exige **operação real** para reabrir decisão congelada; a ADR-A reabre I-10 em substância sem Rede real | Congelamento × Arquitetura §10.3.0 | A ADR-A nasce sob exceção ao critério 1 do §6 | Decisão explícita do Fundador, **registrada na própria ADR-A** |
| **G-04** | O Plano Executivo (33 pacotes F/C/L/K) foi escrito antes de a Arquitetura estar disponível | Plano × Arquitetura §15 | Ordem, taxonomia e três pacotes divergem | **Reconciliado** em `MAPA_DOS_PACOTES.md` §5; a Arquitetura vence |
| **G-05** | `docs/INDEX.md` registra **1 de 11** documentos de `docs/curadoria/` | INDEX × pasta | Dez documentos órfãos do índice geral do projeto | **PD-04** — exige autorização para alterar `INDEX.md` |
| **G-06** | **Dívida documental da ADR-065:** o domínio tem **29 conceitos ativos** (banco e código concordam); documentos anteriores dizem 28 | Congelamento §2/§4.1 (2026-08-01) e Arquitetura §2.6/§17.1 × ADR-065 (2026-08-03) + migration `20260803100000` | O critério de aceite **A7** ("28 conceitos inalterados") está escrito sobre número superado | **Atualizar os documentos para 29.** Não cabe reconciliar o código para 28 — desfaria a ADR-065. Achado **F-01/01**, reclassificado no pacote **F-01A** |
| **G-07** | **Dívida documental da ADR-065:** a vigência única do catálogo é **1.1.0**; o Congelamento nomeia 1.0.0 | Congelamento (anterior à ADR-065) × `catalogo-gerado.ts` + migration `20260803100000` | Quem ler o Congelamento como estado atual usará versão superada | Mesma atualização de G-06. Achado **F-01/02**, reclassificado em **F-01A** |
| ~~**G-09**~~ | ~~"O banco tem 26 conceitos"~~ | — | — | **REMOVIDO em F-01A:** os 26 pertencem só à migration histórica `20260728010000`. Banco e código têm 29. O achado F-01/04 saiu da base oficial |
| **G-10** | **A assinatura do Curador (P7 / item 1.2) não é implementável sem tocar RLS** — e, pior, a paciente hoje lê o literal **"Curador"** em vez de um nome | `curadoria.profiles` tem quatro policies (`profiles_select_own_or_admin`, `profiles_insert_own`, `profiles_update_own_or_admin`, `profiles_select_paciente_por_curador`). **Nenhuma** permite ao paciente ler o perfil do Curador. `cos/repository.ts:84` resolve `names.get(assigned_curator_id) ?? "Curador"` — sob a RLS da paciente, o `get` sempre falha | A auditoria registrou o problema só na entrega (`curatorName: null`); ele é **maior**: atinge toda superfície dela que nomeia o responsável (`/paciente`, `/portal-paciente/como-funciona`) | **Decisão do Guardião + Arquiteto sobre a via** (policy nova · view · RPC · denormalização do nome assinado no Relatório). Item 1.2 fica **bloqueado** até lá — a Onda 1 não pode mudar RLS |
| **G-08** | **P15 confirmado por evidência executável:** o Motor cruza os quatro conceitos marcados `MOTOR_PARTICIPATION: NUNCA` | Congelamento §4.3 × `crossPriorityAndProfessional` | O invariante §4.3 é promessa sem guarda | **DP-1** — agora com a evidência que faltava ([`REGISTRO_DAS_GUARDAS_2_0.md`](REGISTRO_DAS_GUARDAS_2_0.md) §2, achado F-01/03) |

## 7. Garantias que a 2.0 se compromete a não violar

Transcritas do Congelamento §4 — **nenhum pacote pode enfraquecê-las**:

1. Número, nomes e semântica dos **28 conceitos**.
2. **15 células**, **4 resultados**, **5 níveis** de importância, **3 estados** do profissional.
3. **Viabilidade e preferências/restrições nunca entram no Motor.**
4. **Append-only** e **proveniência obrigatória** da Base.
5. Separação **Base (permanente) × Case (temporário)**.
6. **Autodeclaração nunca nasce verificada.**
7. **RLS do Mapa do Profissional** (ADR-040 item 6).
8. Ausência de **score, ranking, ordenação e conclusão automática**.

E as **treze decisões humanas** do §4 da Auditoria, que a Arquitetura §3.5 declara sem porta
de evolução.
