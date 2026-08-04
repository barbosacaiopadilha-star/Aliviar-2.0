# Mapa dos Pacotes — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-00) |
| **Data** | 2026-08-04 |
| **Status** | **Vigente — fonte única dos pacotes da Curadoria 2.0** (nível derivado) |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §15 (autoridade sobre ondas e escopo) · [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) |
| **Documentos relacionados** | [`ROADMAP_EXECUTIVO_CURADORIA_2_0.md`](ROADMAP_EXECUTIVO_CURADORIA_2_0.md) · [`PLANO_EXECUTIVO_CURADORIA_2_0.md`](PLANO_EXECUTIVO_CURADORIA_2_0.md) (superado em parte, §5) |
| **Origem** | Pacote F-00 |

> **Taxonomia adotada:** a da **Arquitetura §15** (Ondas 0–5, itens `0.x`, `1.x`, `1.A`,
> `2.x`, `2.C`, `3.x`). A taxonomia anterior do Implementador (`F-`, `C-`, `L-`, `K-`) fica
> **superada** e é preservada apenas na coluna de rastreabilidade e no §5.
>
> **Estados possíveis:** `PLANEJADO` · `AUTORIZADO` · `EM EXECUÇÃO` · `CONCLUÍDO` ·
> `BLOQUEADO` · `RETIRADO`. Hoje, **um** pacote está fora de `BLOQUEADO`/`PLANEJADO`.

---

## 1. Onda 0 — Verificar e decidir (nenhuma linha de código)

| Código | Nome | Objetivo | Dependências | Critérios de aceite | Estado | Responsável | Rollback |
|---|---|---|---|---|---|---|---|
| **0.1** | Veredito sobre P15 | Confirmar/refutar se o Motor recebe viabilidade | — | Veredito escrito, sem ambiguidade: guarda executável **ou** correção do Congelamento §4.3 | **BLOQUEADO** (DP-1) | Arquiteto + Guardião | n/a |
| **0.2** | Destino formal do ACE | Descontinuado, suspenso ou ativo; destino do dado histórico e das superfícies | — | Decisão registrada (ADR-E) | **BLOQUEADO** (DP-2) | **Fundador** | n/a |
| **0.3** | Listas provisórias P3–P7 | Fechar as cinco listas `OPCOES_PROVISORIAS_*` | — | Listas definitivas; efeito sobre dados gravados declarado | **BLOQUEADO** (DP-3) | Método | n/a |
| **0.4** | Aprovação da Arquitetura | Tornar a v1.2 canônica nas seções DOMÍNIO/ARQUITETURA/GOVERNANÇA | 0.1 | Parecer do Guardião **versionado** (DP-11) e cabeçalho da Arquitetura atualizado (G-01) | **BLOQUEADO** | Agente 00 | n/a |
| **0.5** | Nomear a Autoridade de Método sobre Regras de Derivação | Dar dono à regra de derivação (§10.5) | — | Ocupante nomeado por escrito | **BLOQUEADO** (DP-4 / RR-3) | **Fundador** | n/a |
| **0.6** | **Versionar os documentos da 2.0** | Governança documental controlada e rastreável | — | Documentos criados, indexados, versionados; pacote de segurança separado; commit autorizado | **EM EXECUÇÃO — este pacote (F-00)**; commit **pendente de autorização** | Implementador + engenharia | remover os arquivos criados |

## 2. Onda 1 — Corrigir defeitos e construir a base de auditabilidade

**Entrada:** Onda 0 fechada · P15 com veredito · Autoridade nomeada.
**Proibição da onda:** nenhuma proposta persistida, nenhuma proposta apresentada a humano.

### 2.1 Correções de defeito

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **1.1** | Guarda executável de participação no Motor | Tornar executável o invariante P15/RI8 | **0.1 / DP-1** | A4 verde: conceito `MOTOR_PARTICIPATION: NUNCA` nunca aparece em cruzamento | **BLOQUEADO** — a **evidência** já existe (caracterização F-03 do pacote F-01); falta a decisão | Arquiteto + Guardião, depois Implementador | reverter commit | F-01 |
| **F-01** | **Guardas executáveis da Curadoria 2.0** | 21 guardas + 1 caracterização, sem tocar código de produto | — | 53 testes verdes; suíte unitária e typecheck limpos; nenhuma alteração funcional | **CONCLUÍDO** (2026-08-04), **retificado por F-01A** | Implementador | apagar `tests/unit/guardas-curadoria-2-0/` | — |
| **F-01A** | **Retificação dirigida das guardas** | Executar os sete itens da verificação do Agente 04 | F-01; relatório do Agente 04 | achado F-01/04 removido; F-01/01 e F-01/02 reclassificados como dívida documental; F-02 protegendo de verdade; teste tautológico eliminado; 55 testes verdes | **CONCLUÍDO** (2026-08-04) — segue para o Agente 04 | Implementador | reverter os dois arquivos de teste ao estado de F-01 | — |
| **F-02** | **Modelo de Dados da 2.0** (`derivation_proposals`, `curator_judgments`) | Materializar a camada de persistência da 2.0 | **~~ADR-A/B/D~~ lavradas (066/067/068)** · restam: **Onda 1 verde**, **DP-4** (Autoridade de Método), **guarda C-01** | — | **IMPEDIDO** (2026-08-04, relatório v2.0) — o bloqueio é **declarado pelas próprias ADRs**; nada implementado | Fundador (sequenciamento e nomeação) + Guardião/Arquiteto/Governança (C-01) | n/a — nada foi criado | 2.1 + 2.4 |
| **1.2** | Assinatura do Curador | `curatorName` deixa de ser `null` | **RLS de `curadoria.profiles`** | X3 verde | **BLOQUEADO** — nenhuma policy permite ao paciente ler o perfil do Curador; corrigir exige mudança de RLS, vedada à Onda 1. Ver achado **G-10** | Guardião + Arquiteto decidem a via | reverter; volta a `null` | C-10 |
| **1.3** | Abertura preservada na regeneração | Fim da sobrescrita do texto humano (P12) | — | O5 verde; guardas da ADR-064 intactas | **CONCLUÍDO** (2026-08-04) — 9 testes novos, falseabilidade provada | Implementador | reverter os dois arquivos; o pacote só deixa de destruir | C-11 |
| **1.4** | Remoção da dependência falsa COMPAT→AVALIAÇÃO | P11 | — | Estado da etapa reflete a leitura; Mesa segue não bloqueando | PLANEJADO | Implementador | reverter | C-12 |
| **1.5** | Checkboxes derivados do Acolhimento | P13 | definição de Método do que é "aberto" | Nenhum critério de saída do COS enfraquece | **BLOQUEADO** (decisão de Método) | Implementador | reverter | C-13 |
| **1.6** | Painel de prontidão para emissão | G6/O8 | — | O3 verde; a prontidão **deriva** das mesmas guardas, não as reimplementa | PLANEJADO | Implementador | remover componente | C-14 |
| **1.7** | Retirada da segunda entrega e das superfícies mortas | P9/P20/RI5 | **0.2** | X4 verde; **nenhum dado histórico apagado** | **BLOQUEADO** (DP-2) | Implementador | reverter | K-61 |

### 2.2 Base de auditabilidade — **nasce antes da primeira proposta**

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **1.8** | **Ficha de Explicação** (§11) | Explicabilidade obrigatória, incluindo explicação de proposta | 1.1 | **AC-EXPLICA** (bloqueante): sem explicação, a superfície **não renderiza**; fallback genérico proibido | PLANEJADO | Implementador | remover a Ficha desliga o consumo, não a regra | **novo** |
| **1.9** | Cadeia de proveniência ponta a ponta (§11.4) | Reconstruir qualquer frase até a origem | 1.8 | M3 verde | PLANEJADO | Implementador | reverter | **novo** |
| **1.10** | Reconhecimento em duas colunas (§6.2.1) | Ela lê **o que declarou** ao lado da tradução (P8) | 1.9 | X2 verde; Perfis antigos exibidos no formato da época (R-07) | PLANEJADO | Implementador + decisão sobre o texto de reconhecimento | flag; reconhecimentos feitos permanecem válidos | L-32 (antecipado) |
| **1.11** | Painel de discordância, vazio | Existir antes da primeira regra | 1.8 | O6: taxa de discordância observável por conceito e por versão | PLANEJADO | Implementador | remover | **novo** |
| **1.12** | Mecanismo de discordância na Fronteira Humana | Discordar custar o mesmo que concordar | 1.11 | O2 verde (P-10 como contrato testado) | PLANEJADO | Implementador | remover | **novo** |
| **1.A** | **Função pura de derivação do Mapa do Profissional** | Contrato puro, **sem persistência, sem consumidor, sem superfície** | 1.1 | Zero chamadores (verificável); lacuna nunca vira estado positivo (P-04/I-8) | PLANEJADO | Implementador | remover o módulo — não tem chamador | L-20 |

**Critério de saída da Onda 1:** as **dez dependências do §15.0** existem e são testadas ·
a paciente já lê o que o Motor concluiu · nenhum invariante do Motor é mais promessa sem guarda.

## 3. Onda 2 — A virada do eixo (cada item exige ADR)

**Entrada:** Onda 1 integralmente verde · ADRs aprovadas · Autoridade ativa · DP-1 respondido.
**Rollback mestre da onda:** suspender a regra devolve o sistema ao regime de declaração
direta **sem perder dado** — confirmações feitas permanecem válidas, propostas param de nascer.

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **2.1** | `derivation_proposals` append-only | Materializar a Camada de Derivação | **ADR-A**, todas as dez do §15.0 | A3 verde; falta de proveniência ⇒ não persiste | BLOQUEADO | Implementador | migration aditiva reversível | (parte de L-21) |
| **2.2** | Ponte grau→importância — **forma e governança**, valores provisórios | Proposta de importância nos ~17 conceitos com lado da pessoa | **ADR-A**, 0.3, 2.1 | A1, A2 verdes; reabertura de I-10 declarada (§10.3.0); teste `importancia-vs-grau.test.ts` protegido até a ADR-A | BLOQUEADO | Implementador | flag; classificação manual permanece o caminho padrão | L-30 + L-31 |
| **2.3** | Divisão da etapa AVALIAÇÃO | 3 critérios do lado da pessoa passam a vir do Motor | **ADR-B**, 1.4 | X1 verde; FORMACAO/EXPERIENCIA/HISTORICO permanecem humanos | BLOQUEADO | Implementador | flag restaura 6×N | L-40 + L-41 |
| **2.4** | `curator_judgments` **sem `AREA`** | Registrar juízo humano onde não há célula | **ADR-B**, 2.1 | Append-only; `AREA` ausente (RS-03) | BLOQUEADO | Implementador | migration aditiva | **novo** |
| **2.5** | ~~Regime de confirmação em bloco~~ | — | **DP-5** | **AC-BLOCO:** nenhum mecanismo no repositório, **nem atrás de feature flag** | **PROIBIDO** até DP-5 por ADR (§5.4.0) | — | n/a | (não existia) |
| **2.6** | Governança de quem confirma o Mapa do Profissional | Corrigir G4/RI4 | **ADR-D** (toca ADR-040 item 6) | RLS não enfraquece; teste de permissão por papel | BLOQUEADO | Implementador + Guardião | restaurar permissão anterior | L-23 |
| **2.C** | Persistência e apresentação da derivação do Mapa do Profissional — **confirmação item a item** | Ligar 1.A ao mundo real | 1.A, 2.1, 2.6, **todas as dez do §15.0** | Fronteira Humana com os nove elementos (A2c); ausência de ato nunca confirma (A2d) | BLOQUEADO | Implementador | flag desliga a superfície; preenchimento manual permanece | L-21 + L-22 |

## 4. Ondas 3, 4 e 5

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **3.1** | Modelo único de progresso + projeções | Um relógio (R6/P4) | Onda 1; **DP-8** | O4: nenhuma projeção é escrita diretamente | BLOQUEADO | Implementador | manter coluna antiga em paralelo por uma janela | K-60 |
| **3.2** | Responsável derivado por fato | Fim de RI6 | 3.1 | A paciente nunca vê responsável divergente | BLOQUEADO | Implementador | idem 3.1 | C-15 |
| **3.3** | Protocolo Único da Pessoa | Uma pessoa, um instrumento (R4/D7) | Onda 1 | Nada se perde; nenhum briefing antigo reinterpretado | BLOQUEADO | Fundador + Implementador | flag por instrumento | K-63 (parte) |
| **3.4** | Instrumento único do profissional | R5 | Onda 1 | idem | BLOQUEADO | Fundador + Implementador | idem | K-63 (parte) |
| **3.5** | Fonte única da decisão da paciente | R9 | Onda 1 | Um registro só; histórico preservado | BLOQUEADO | Implementador | migration aditiva | **novo** |
| **3.6** | Reescrita de `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md` | P17/P18/RI9 | ondas publicadas | Zero divergência conhecida entre código e documento | BLOQUEADO | Arquiteto | reverter | K-62 |
| **4** | Refinamento | Mesma informação, melhor apresentada | Ondas 1–3 | **Não pode** introduzir explicação nova nem ordenação indireta | BLOQUEADO | Implementador | trivial (apresentação) | — |
| **5** | Calibração por operação real | Fixar valores (DP-6), dimensionar juízo relacional | **Rede real + Cases reais** | Nenhuma calibração por hipótese | **BLOQUEADO — Rede real inexistente** | Fundador + Método | n/a | F-70 |

**Sequenciamento (Arquitetura §15):**
`Onda 0 → Onda 1 → { Onda 2 → Onda 4 → Onda 5 ; Onda 3 (independente da Onda 2) }`

## 5. Reconciliação com o Plano Executivo anterior

O [`PLANO_EXECUTIVO_CURADORIA_2_0.md`](PLANO_EXECUTIVO_CURADORIA_2_0.md) foi escrito **antes**
de a Arquitetura estar disponível na árvore. Onde os dois divergem, **vence a Arquitetura**
(Registro de Governança §2). Divergências materiais:

| # | Item do Plano | Situação na Arquitetura | Efeito |
|---|---|---|---|
| **RC-1** | **F-07 + L-43** — ADR e implementação da chave de ordenação interna | **ADR-C retirada do caminho** (bloqueador B2): ordenar por prontidão é ranking por construção; fica a **ordem neutra da Rede** | **RETIRADOS.** A pendência §11 do Modelo permanece **aberta por decisão**, não por esquecimento |
| **RC-2** | **C-17** — propor filtro obrigatório a partir de grau `ESSENCIAL` | **Corrigido (RS-07/§5.5):** o sistema **sinaliza para discussão**; nunca propõe filtro pronto. Filtros são declarados **item a item**, nunca em bloco, nunca derivados | **REESCRITO.** Deixa de ser pacote de derivação e vira sinalização, dentro da Onda 1/3 conforme a ADR-A definir |
| **RC-3** | Critério de sucesso **"menos de 20 atos"** | **Abandonado (§3.6):** contagem de atos é a métrica errada — foi ela que tornou a confirmação em bloco atraente. A métrica é a **natureza** dos atos | **SUBSTITUÍDO.** Alvo: **zero atos de transcrição**; o total é consequência |
| **RC-4** | Sprint 3 colocava **L-21 (persistência da derivação)** antes da explicabilidade e do painel de discordância | **§15.0 proíbe:** nenhuma derivação persistida ou consumida antes das **dez** dependências | **RESSEQUENCIADO.** 1.A (puro, inerte) na Onda 1; persistência só em 2.C |
| **RC-5** | **L-32** (Perfil refletir o que ela declarou) posicionado depois da ponte | **Antecipado** para a Onda 1 (item 1.10, reconhecimento em duas colunas) | **ANTECIPADO** |
| **RC-6** | Cinco pacotes de base de auditabilidade **não existiam** no Plano | Arquitetura 1.8–1.12 | **ADICIONADOS** |
| **RC-7** | **C-16** (abertura automática do Case) | §5.1 item 5 marca **AUTOMATIZA**, mas o item **não aparece em nenhuma onda do §15** | **PENDÊNCIA PD-01** — sem onda atribuída |
| **RC-8** | Estimativas em dias e sprints do Plano | A Arquitetura não estima prazo | **Mantidas como referência do Implementador**, não como compromisso |

## 6. Contagem

| Onda | Pacotes | Bloqueados | Planejados | Em execução | Proibidos/Retirados |
|---|---|---|---|---|---|
| 0 | 6 | 5 | 0 | **1** (0.6) | 0 |
| 1 | 12 | 3 | 9 | 0 | 0 |
| 2 | 7 | 6 | 0 | 0 | 1 (2.5) |
| 3 | 6 | 6 | 0 | 0 | 0 |
| 4 e 5 | 2 | 2 | 0 | 0 | 0 |
| **Total** | **33** | **22** | **9** | **1** | **1** |

Mais **2 pacotes retirados** do plano anterior (RC-1) e **1 reescrito** (RC-2).
