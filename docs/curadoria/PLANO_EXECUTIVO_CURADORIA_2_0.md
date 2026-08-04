# Plano Executivo de Implantação — Curadoria 2.0

> **Agente:** 03 — Implementador · **Missão:** planejamento executivo · **Autoridade:** planejamento técnico.
>
> **Natureza:** planejamento. **Nenhum código, migration, banco, API, componente, teste,
> commit ou PR foi produzido ou alterado.** Este arquivo é o único produto.
>
> **Data:** 2026-08-04 · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` · **HEAD:** `97ed8b2`
>
> **Premissa declarada:** a Arquitetura da Curadoria 2.0 foi declarada aprovada
> constitucionalmente pelo Fundador. O documento correspondente **ainda não está
> materializado** em `docs/`; aplica-se a regra de `governance.md` (documento não
> materializado é tratado como aprovado, nunca como bloqueio). Os pacotes abaixo derivam
> de [`AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md`](AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md) §12
> e dos canônicos vigentes. **Se a arquitetura escrita divergir deste plano, ela vence e o
> plano é refeito.**
>
> **Substitui, para fins de execução,** o [`PLANO_DE_PACOTES_CURADORIA_2_0.md`](PLANO_DE_PACOTES_CURADORIA_2_0.md)
> (que permanece válido como registro do impedimento e da partição).
>
> **Atualização documental (pacote F-00, 2026-08-04):** a
> [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 passou a existir na
> árvore **depois** deste plano, e prevalece sobre ele. A **fonte única dos pacotes** passa a
> ser o [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md), cujo §5 registra as oito divergências
> (RC-1..RC-8) — incluindo **dois pacotes retirados** (chave de ordenação) e **um reescrito**
> (proposta de filtro). Este documento permanece como registro do raciocínio de
> sequenciamento, **não** como lista de trabalho vigente. Ponto de entrada da 2.0:
> [`INDICE_DA_CURADORIA_2_0.md`](INDICE_DA_CURADORIA_2_0.md).

---

## 1. Mapa de Pacotes

Legenda de classificação (Etapa 4): **BD** banco · **MOT** motor · **API** APIs ·
**UI** interfaces · **REL** relatórios · **GOV** governança · **DOC** documentação ·
**SEG** segurança · **MIG** migração · **OPE** operação.

Legenda de autorização: **L** livre · **F** exige decisão do Fundador · **A** exige ADR aprovada.

Duração em **dias de engenharia** (esforço, não calendário).

---

### Bloco 0 — Fundação e destravamento

#### F-00 · Higiene da árvore e versionamento dos insumos
| | |
|---|---|
| **Classe** | OPE · GOV |
| **Objetivo** | Partir de árvore limpa e com os insumos canônicos versionados. |
| **Escopo** | Fechar ou arquivar o pacote de segurança em curso (`20260803170000_menor_privilegio_nas_funcoes_de_governanca.sql` + teste de integração); versionar a auditoria, este plano e a arquitetura da 2.0. |
| **Fora de escopo** | Qualquer código de produto. |
| **Dependências** | Nenhuma. **É o primeiro ato.** |
| **Duração** | 0,5 d |
| **Risco** | Baixo. Não fazer = todos os pacotes seguintes misturam escopo (§14). |
| **Rollback** | N/A (nenhuma alteração de produto). |
| **Aceite** | `git status` limpo; auditoria e arquitetura commitadas; branch da 2.0 criado a partir de `main`. |
| **Documentos** | Papel do Implementador §14, §16. |

#### F-01 · Guarda executável do invariante "viabilidade nunca entra no Motor"
| | |
|---|---|
| **Classe** | MOT · SEG |
| **Objetivo** | Provar por teste o comportamento real do Motor diante de subcritérios de viabilidade/preferência e emitir veredito sobre P15/RI8. |
| **Escopo** | Teste de caracterização + veredito escrito. |
| **Fora de escopo** | **Nenhuma alteração em `motor-compatibilidade.ts`.** A correção (guarda no Motor **ou** correção do Congelamento §4.3) é pacote posterior, após decisão. |
| **Dependências** | F-00. |
| **Duração** | 1 d |
| **Risco** | Baixo tecnicamente; alto informacionalmente (pode expor invariante congelada violada). |
| **Rollback** | Remover o arquivo de teste. |
| **Aceite** | Teste verde descrevendo o comportamento atual; veredito sem ambiguidade sobre o cumprimento do Congelamento §4.3. |
| **Documentos** | Congelamento §4.3, I-1; Auditoria P15/RI8. |

#### F-02 · Reconciliação do ledger e abertura da janela de publicação
| | |
|---|---|
| **Classe** | MIG · OPE |
| **Objetivo** | Tornar publicável qualquer pacote com migration. |
| **Escopo** | Executar o [`PLANO_RECONCILIACAO_LEDGER.md`](PLANO_RECONCILIACAO_LEDGER.md); definir a janela autorizada de PR/merge em `main` com a integração Supabase↔GitHub aplicando DDL em produção. |
| **Fora de escopo** | Qualquer migration da 2.0. |
| **Dependências** | F-00. Autorização do Fundador para a janela. |
| **Duração** | 2 d + espera de janela |
| **Risco** | **Alto** — DDL em produção sem backup/PITR confirmado. |
| **Rollback** | Definido pelo próprio plano de reconciliação; nenhuma migration da 2.0 entra junto. |
| **Aceite** | Ledger local == produção; janela declarada; procedimento de backup verificado antes do primeiro merge. |
| **Documentos** | Congelamento §7.1; plano de reconciliação. |

#### F-03 · Decisão formal sobre o ACE **[F]**
| | |
|---|---|
| **Classe** | GOV · DOC |
| **Objetivo** | Declarar o ACE descontinuado, suspenso ou ativo, e o destino de `ace_artifacts`, execuções e `/admin/ace/*`. |
| **Escopo** | Documento de decisão. Zero código. |
| **Dependências** | F-00. **Decisão do Fundador.** |
| **Duração** | 0,5 d após a decisão |
| **Risco** | Nenhum técnico. Bloqueia C-61 e o fim das duas entregas concorrentes (P9/RI5). |
| **Rollback** | N/A. |
| **Aceite** | Decisão registrada com destino do dado histórico e das superfícies. |
| **Documentos** | Auditoria D5, P3, P9, P20, RI5. |

#### F-04 · Decisão das listas provisórias P3–P7 **[F]**
| | |
|---|---|
| **Classe** | GOV |
| **Objetivo** | Fechar as cinco listas `OPCOES_PROVISORIAS_*` que hoje operam sem decisão de Método. |
| **Escopo** | Decisão de Método registrada. |
| **Dependências** | F-00. **Decisão do Fundador.** |
| **Duração** | 1 d após a decisão |
| **Risco** | Bloqueia toda a cadeia da ponte grau → importância. **É o primeiro nó do caminho crítico.** |
| **Rollback** | N/A. |
| **Aceite** | As cinco listas declaradas definitivas ou substituídas, com efeito sobre dados já gravados declarado. |
| **Documentos** | Auditoria P19, §12.4 Fase 0.3. |

#### F-05 · ADR — ponte grau → importância **[A][F]**
| | |
|---|---|
| **Classe** | GOV |
| **Objetivo** | Decidir a correspondência entre a escala de grau (4, da pessoa) e a de importância (5, do Case). |
| **Escopo** | ADR contendo: tabela de correspondência; tratamento dos conceitos sem lado da pessoa; forma de registro da confirmação humana; impacto sobre I-10; guarda de teste que passa a proteger a decisão nova. |
| **Dependências** | F-04. |
| **Duração** | 2 d (redação) |
| **Risco** | **Máximo do programa.** Toca I-10 e o §4.2 do Congelamento. O §6 exige necessidade observada em **operação real** — que hoje não existe (RI10, F-70). |
| **Rollback** | ADR revogada por ADR nova; nenhum dado afetado enquanto não houver implementação. |
| **Aceite** | ADR aprovada, não contraditória com a Constituição, com plano de compatibilidade para os `case_priority_map` já gravados. |
| **Documentos** | Congelamento §4.2, §6, I-10; ADR-039, ADR-042; Auditoria O3, §12.2. |

#### F-06 · ADR — divisão da etapa AVALIAÇÃO **[A]**
| | |
|---|---|
| **Classe** | GOV |
| **Objetivo** | Declarar quais dos 6 critérios passam a ser derivados do Motor e quais permanecem juízo humano. |
| **Escopo** | ADR. |
| **Dependências** | F-01 (o veredito muda o que o Motor pode sustentar). |
| **Duração** | 1,5 d |
| **Risco** | Médio — muda o que a paciente lê (via C-42). |
| **Rollback** | ADR revogada. |
| **Aceite** | Divisão declarada critério a critério, com o argumento de `dossie.ts` referenciado ou refutado explicitamente. |
| **Documentos** | Auditoria O2, D3, §2.8; `dossie.ts`. |

#### F-07 · ADR — chave de ordenação interna de leitura **[A]**
| | |
|---|---|
| **Classe** | GOV |
| **Objetivo** | Fechar a pendência do §11 do Modelo: hoje a comparação chega ao Curador em ordem arbitrária. |
| **Escopo** | ADR definindo a chave, e reafirmando que ordenação interna **não é ranking** e nunca alcança a paciente. |
| **Dependências** | F-00. |
| **Duração** | 1 d |
| **Risco** | Médio — o §4.8 do Congelamento proíbe ordenação; a ADR precisa distinguir ordem de leitura interna de colocação. |
| **Rollback** | ADR revogada. |
| **Aceite** | Chave declarada, determinística, e guarda de teste especificada garantindo que a ordem não atravessa a fronteira da paciente. |
| **Documentos** | Modelo §11; Congelamento §4.8; Auditoria P14, G8. |

---

### Bloco 1 — Quick wins (correções de defeito, sem ADR)

#### C-10 · Assinatura do Curador no Relatório da paciente
| | |
|---|---|
| **Classe** | REL · UI |
| **Objetivo** | `curatorName` deixar de ser `null` fixo em `loadPatientCuradoria`. |
| **Escopo** | Resolução e exibição do responsável. |
| **Fora de escopo** | Qualquer outro campo da entrega; a gramática de apresentação. |
| **Dependências** | F-00. |
| **Duração** | 1 d |
| **Risco** | Baixo técnico; **verificar** exposição de nome interno contra a fronteira de vocabulário e a política de dados pessoais. |
| **Rollback** | Reverter commit; campo volta a `null`. Sem dado novo. |
| **Aceite** | Nome exibido; ausência de responsável não vira placeholder enganoso; `PATIENT_FORBIDDEN_TERMS` intacto. |
| **Documentos** | Auditoria P7, §3.5. |

#### C-11 · Preservar a abertura escrita pelo Curador
| | |
|---|---|
| **Classe** | REL |
| **Objetivo** | `saveReport` parar de sobrescrever `composition_rationale` humano na regeneração. |
| **Escopo** | Regra de preservação do texto humano. |
| **Fora de escopo** | Geração do rascunho; guardas de emissão da ADR-064; demais seções. |
| **Dependências** | F-00. |
| **Duração** | 1,5 d |
| **Risco** | Médio — interação com as duas guardas de emissão. |
| **Rollback** | Reverter commit. Nenhum dado destruído: o pacote só deixa de destruir. |
| **Aceite** | Regenerar nunca apaga autoria humana; a frase-sentinela segue bloqueando emissão. |
| **Documentos** | ADR-064; Auditoria P12, RI7. |

#### C-12 · Remover a dependência inexistente COMPATIBILIDADE → AVALIAÇÃO
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | `mesa-etapas.ts` parar de declarar pendente uma leitura que o domínio não faz depender de `criterion_declarations`. |
| **Escopo** | Estado e frase da etapa COMPATIBILIDADE. |
| **Fora de escopo** | As outras cinco etapas; a etapa AVALIAÇÃO (objeto de F-06); o Motor. |
| **Dependências** | F-00. |
| **Duração** | 0,5 d |
| **Risco** | Baixo. |
| **Rollback** | Reverter commit. |
| **Aceite** | Estado reflete a leitura do Motor; a Mesa continua não bloqueando nenhuma etapa. |
| **Documentos** | Auditoria P11, §2.9. |

#### C-13 · Checkboxes do Acolhimento derivados **[F]**
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | "Contexto revisado" / "documentos revisados" deixarem de ser declaração burocrática. |
| **Escopo** | Derivação do fato observado. |
| **Dependências** | F-00 + **definição de Método do que conta como "aberto"**. Sem ela o pacote não abre. |
| **Duração** | 1,5 d |
| **Risco** | Médio — enfraquecer um gate do COS por acidente. |
| **Rollback** | Reverter commit; checkboxes voltam a manuais. |
| **Aceite** | Nenhum critério de saída do COS enfraquece; o Curador ainda pode discordar do que o sistema observou. |
| **Documentos** | `cos/phases.ts`; Auditoria P13, §2.3. |

#### C-14 · Painel de prontidão para emissão
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | Mostrar antes o que hoje só se descobre ao tentar emitir. |
| **Escopo** | Superfície apenas (componente evolutivo, Congelamento §3). |
| **Fora de escopo** | As guardas da ADR-064 — **não podem ser reimplementadas**, só consumidas. |
| **Dependências** | F-00. |
| **Duração** | 2 d |
| **Risco** | Baixo, **exceto** o risco proibido do §11 do papel: duplicar regra no frontend. |
| **Rollback** | Remover o componente. |
| **Aceite** | O painel deriva das mesmas funções de guarda; nenhuma segunda interpretação existe no código. |
| **Documentos** | ADR-064; Auditoria O8, G6. |

#### C-15 · Avanço do funil do CRM por fatos gravados **[F]**
| | |
|---|---|
| **Classe** | API · OPE |
| **Objetivo** | Derivar os 5 estágios hoje movidos à mão (`sent_to_curator`, `curation_in_progress`, `report_ready`, `report_delivered`, `doctor_selected`). |
| **Escopo** | Derivação a partir de fatos já gravados. |
| **Fora de escopo** | Os outros 13 estágios do funil; a conversa humana. |
| **Dependências** | F-00 + decisão de negócio sobre precedência (hoje `pipelineStage` vence e produz o efeito de RI6). |
| **Duração** | 3 d |
| **Risco** | Médio — a paciente vê o responsável derivado daí. |
| **Rollback** | Reverter; funil volta a manual. Estágios já derivados permanecem gravados. |
| **Aceite** | Os 5 estágios avançam sozinhos; o responsável visível à paciente nunca contradiz quem de fato a acompanha. |
| **Documentos** | Auditoria O5, R6, RI6, §1.4. |

#### C-16 · Abertura automática do Case **[F]**
| | |
|---|---|
| **Classe** | BD · API |
| **Objetivo** | Eliminar G5 — história enviada parada esperando clique. |
| **Escopo** | Regra "história `enviada` + paciente com papel = Case `NEW`". |
| **Dependências** | F-00, F-02 (tem migration). **Regra de negócio nova: exige declaração do Fundador**, incluindo o destino das histórias já enviadas (backfill sim/não). |
| **Duração** | 2 d |
| **Risco** | Médio — cria Cases sem intervenção; efeito sobre o funil e sobre a fila do Curador. |
| **Rollback** | Desligar por flag; Cases criados permanecem (não são destruídos). |
| **Aceite** | Nenhum Case duplicado; idempotência comprovada; comportamento com histórias preexistentes conforme decidido. |
| **Documentos** | Auditoria O6, G5, §2.2. |

#### C-17 · Proposta de filtro obrigatório a partir de grau `ESSENCIAL` **[F]**
| | |
|---|---|
| **Classe** | UI · API |
| **Objetivo** | Eliminar R8 — redigitação de `ESSENCIAL` como `FILTRO_OBRIGATORIO`. |
| **Escopo** | **Proposta**, nunca filtro automático. Confirmação humana obrigatória. |
| **Dependências** | F-00, F-04 (as opções canônicas de P3–P7 alimentam a proposta). |
| **Duração** | 2 d |
| **Risco** | **Alto se mal feito** — um filtro é eliminatório; proposta virando filtro elimina profissional sem juízo humano. |
| **Rollback** | Desligar por flag; propostas não confirmadas não têm efeito. |
| **Aceite** | Nenhum filtro existe sem confirmação com autor e data; recusar a proposta custa o mesmo que aceitar (§12.2.3 da auditoria). |
| **Documentos** | Auditoria O7, R8, §2.4. |

---

### Bloco 2 — Ponte do lado do profissional (O1)

#### L-20 · Contrato puro de derivação do Mapa do Profissional
| | |
|---|---|
| **Classe** | MOT |
| **Objetivo** | Função pura `practice_evidence` → **proposta** de estado por subcritério, com proveniência. |
| **Escopo** | Módulo puro determinístico + testes. Nenhum consumidor. |
| **Fora de escopo** | Persistência, interface, qualquer chamada do Motor ou da Mesa. |
| **Dependências** | F-00, F-01. |
| **Duração** | 4 d |
| **Risco** | Baixo — código sem consumidor por desenho. |
| **Rollback** | Remover o módulo. |
| **Aceite** | Toda proposta carrega evidência, versão, autor e data; ausência de evidência produz **lacuna**, nunca estado positivo (I-8); nenhum estado fora dos três da ADR-040; reprodutível. |
| **Documentos** | ADR-040; `deriveRelationalState`, `MOTOR_PARTICIPATION`; Auditoria O1, D2, RI2. |

#### L-21 · Persistência da confirmação e proveniência no Mapa do Profissional **[F]**
| | |
|---|---|
| **Classe** | BD · MIG · SEG |
| **Objetivo** | Registrar autor, data e proposta de origem de cada estado confirmado. |
| **Escopo** | Migration de colunas de proveniência em `professional_subcriterion_map`; backfill declarado dos registros existentes (que **não têm** proveniência); revisão de RLS. |
| **Fora de escopo** | Alterar os 3 estados; alterar o Motor. |
| **Dependências** | L-20, F-02. **RLS é item congelado (ADR-040 item 6, Congelamento §4.7): alterar quem escreve exige decisão do Fundador.** |
| **Duração** | 4 d |
| **Risco** | **Alto** — migration + RLS congelada + backfill sobre dado sem proveniência. |
| **Rollback** | Migration reversível (colunas aditivas, nullable); nenhum estado existente é reescrito. |
| **Aceite** | Registros antigos permanecem legíveis e marcados como **sem proveniência** — nunca falsamente providos; RLS não enfraquece (teste de permissão por papel). |
| **Documentos** | ADR-040; Congelamento §4.4, §4.7, I-6, I-7. |

#### L-22 · Superfície de confirmação da proposta
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | Permitir confirmar/recusar proposta a proposta, com a origem à vista. |
| **Escopo** | Componente + estados. |
| **Dependências** | L-21. |
| **Duração** | 4 d |
| **Risco** | **Alto de desenho** — se aceitar 28 propostas é um clique e recusar uma é um formulário, a proposta vira decisão automática disfarçada (§12.2.3). |
| **Rollback** | Flag desliga a superfície; preenchimento manual permanece disponível. |
| **Aceite** | Simetria comprovada entre aceitar e recusar; a frase de origem ("proposto a partir de …, em …") é parte do dado exibido. |
| **Documentos** | Auditoria §12.2; papel do Implementador §11. |

#### L-23 · Descontinuação do preenchimento manual como fonte primária **[F]**
| | |
|---|---|
| **Classe** | GOV · OPE |
| **Objetivo** | Encerrar a dependência de `administrador` como único autor do Mapa (G4/RI4). |
| **Escopo** | Decisão + ajuste de papel/permissão. |
| **Dependências** | L-22 em operação real. **Mudança de responsabilidade: decisão do Fundador, proibida ao Implementador.** |
| **Duração** | 2 d após decisão |
| **Risco** | Médio. |
| **Rollback** | Restaurar a permissão anterior. |
| **Aceite** | Nenhum Case fica sem Mapa por indisponibilidade de uma única pessoa. |
| **Documentos** | Auditoria G4, RI4. |

---

### Bloco 3 — Ponte do lado da pessoa (O3) — **caminho crítico**

#### L-30 · Contrato puro da correspondência grau → importância
| | |
|---|---|
| **Classe** | MOT |
| **Objetivo** | Implementar, como função pura, a tabela decidida em F-05. |
| **Escopo** | Módulo puro + testes exaustivos. Sem consumidor. |
| **Fora de escopo** | Persistência, interface, Motor. |
| **Dependências** | **F-05** (ADR) e **F-04** (listas). |
| **Duração** | 3 d |
| **Risco** | Médio — é a tradução que hoje é mental; errá-la é tornar auditável uma regra errada. |
| **Rollback** | Remover o módulo. |
| **Aceite** | Conceitos sem lado da pessoa **não recebem proposta**; a tabela do ADR é reproduzida célula a célula por teste; I-10 permanece verdadeira (as escalas continuam sem valor em comum — há correspondência declarada, não igualdade). |
| **Documentos** | F-05; Congelamento I-10; ADR-039. |

#### L-31 · Proposta de importância na superfície do Mapa de Prioridades
| | |
|---|---|
| **Classe** | UI · BD |
| **Objetivo** | O Curador confirmar ~17 propostas com o texto dela ao lado, em vez de classificar 28 do zero. |
| **Escopo** | Superfície + registro da confirmação (autor, data, proposta de origem). |
| **Dependências** | L-30, F-02 (migration de proveniência em `case_priority_map`). |
| **Duração** | 5 d |
| **Risco** | **Alto** — `case_priority_map` é a única entrada do Motor pelo lado do Case (ADR-039). |
| **Rollback** | Flag desliga a proposta; a classificação manual permanece intacta e é o caminho padrão. |
| **Aceite** | Nada entra no Motor sem confirmação humana registrada; simetria aceitar/recusar; a origem é exibida; os 11 conceitos técnicos continuam sem proposta. |
| **Documentos** | ADR-039; Auditoria §12.2, O3, G1. |

#### L-32 · Perfil lido pela paciente refletir o que ela declarou **[F]**
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | Corrigir P8 — hoje `buildPerfilView` mostra `case_priority_map` (classificação do Curador) num texto que afirma ter sido construído com ela. |
| **Escopo** | O que a paciente lê no Perfil e o texto de reconhecimento. |
| **Dependências** | L-31. **Toca o ato mais protegido do sistema (Invariante 12 / ADR-042): exige decisão do Fundador sobre o que exatamente ela reconhece.** |
| **Duração** | 3 d |
| **Risco** | **Alto** — mexe no único gate verdadeiro da Mesa. |
| **Rollback** | Reverter; reconhecimentos já registrados permanecem válidos. |
| **Aceite** | O que ela reconhece e o que o texto afirma coincidem; `reconhecerPerfilAction` continua exclusivo dela. |
| **Documentos** | ADR-042; Auditoria P8, §2.6, §4.4. |

#### L-33 · Retrocompatibilidade dos Cases existentes
| | |
|---|---|
| **Classe** | MIG |
| **Objetivo** | Cases já classificados continuarem válidos e legíveis. |
| **Escopo** | Marcação dos `case_priority_map` anteriores como **sem proposta de origem**; nenhum recálculo retroativo. |
| **Dependências** | L-31. |
| **Duração** | 1,5 d |
| **Risco** | Médio — a tentação de "reprocessar" muda decisões já tomadas. **Proibido.** |
| **Rollback** | Migration aditiva reversível. |
| **Aceite** | Zero Case tem sua classificação alterada pelo pacote; a distinção antigo/novo é legível. |
| **Documentos** | Congelamento I-7 (histórico imutável). |

---

### Bloco 4 — Ponte da avaliação e da transparência (O2, O4)

#### L-40 · Derivação dos três critérios do lado da pessoa
| | |
|---|---|
| **Classe** | MOT |
| **Objetivo** | ACESSO/CONTINUIDADE/MODELO passarem a vir da leitura do Motor, conforme F-06. |
| **Escopo** | Derivação pura + testes. |
| **Fora de escopo** | FORMACAO/EXPERIENCIA/HISTORICO — permanecem juízo humano. |
| **Dependências** | **F-06**, C-12. |
| **Duração** | 3 d |
| **Risco** | Médio. |
| **Rollback** | Remover o módulo. |
| **Aceite** | Exatamente os critérios declarados no ADR são derivados; lacuna do Motor nunca vira avaliação positiva (I-8). |
| **Documentos** | F-06; `dossie.ts`; Auditoria O2, D3. |

#### L-41 · Mesa reduzida a 3×N declarações
| | |
|---|---|
| **Classe** | UI |
| **Objetivo** | Retirar da Mesa a digitação que o Motor já respondeu. |
| **Escopo** | Etapa AVALIAÇÃO da Mesa. |
| **Dependências** | L-40. |
| **Duração** | 3 d |
| **Risco** | Médio — o Curador perde uma superfície familiar. |
| **Rollback** | Flag restaura as 6×N declarações. |
| **Aceite** | As declarações derivadas exibem origem; as humanas continuam com texto livre de evidência. |
| **Documentos** | Auditoria §2.8, R2, G3. |

#### L-42 · Dimensões da paciente derivadas do Motor
| | |
|---|---|
| **Classe** | REL · UI |
| **Objetivo** | Corrigir D4/P6 — hoje ela lê "ainda precisamos confirmar" mesmo com leitura do Motor completa. |
| **Escopo** | Fonte das cinco dimensões em `patient-curadoria.ts`. |
| **Dependências** | L-40. |
| **Duração** | 3 d |
| **Risco** | **Alto** — muda o documento mais sensível do produto. |
| **Rollback** | Flag restaura a fonte atual. |
| **Aceite** | Sem score, ranking, percentual ou juízo sobre pessoa; `PATIENT_FORBIDDEN_TERMS` verde; lacuna continua sendo dita como lacuna (I-8, I-9). |
| **Documentos** | Congelamento §4.8, I-8, I-9; Auditoria O4, D4, P6. |

#### L-43 · Chave de ordenação interna de leitura
| | |
|---|---|
| **Classe** | MOT · UI |
| **Objetivo** | Implementar a chave decidida em F-07. |
| **Escopo** | Ordenação **interna** da Mesa. |
| **Fora de escopo** | Qualquer ordem visível à paciente. |
| **Dependências** | **F-07**. |
| **Duração** | 2 d |
| **Risco** | Médio — proximidade com a proibição de ordenação (§4.8). |
| **Rollback** | Reverter; volta à ordem da Rede. |
| **Aceite** | Determinística; guarda de teste impede que a ordem atravesse a fronteira da paciente. |
| **Documentos** | F-07; Modelo §11. |

---

### Bloco 5 — Consolidação

#### K-60 · Modelo de progresso derivado **[F]**
| | |
|---|---|
| **Classe** | GOV · API |
| **Objetivo** | Eliminar R6 — seis relógios sincronizados à mão. |
| **Escopo** | Um modelo canônico; os demais projetados dele por contrato. |
| **Dependências** | C-15, F-03. **Decisão do Fundador sobre qual é o canônico.** |
| **Duração** | 6 d |
| **Risco** | **Alto** — atravessa CRM, Case, COS, Mesa e jornada da paciente. |
| **Rollback** | Reverter as projeções; os seis modelos voltam a coexistir. |
| **Aceite** | Nenhum estado é escrito em dois lugares; a paciente nunca vê responsável divergente (RI6). |
| **Documentos** | Auditoria D6, R6, P4, RI6. |

#### K-61 · Encerramento das superfícies mortas
| | |
|---|---|
| **Classe** | OPE · DOC |
| **Objetivo** | Remover `/curador/*`, `/portal-paciente/*`, `/admin/ace/*` e a segunda entrega ao paciente (P9). |
| **Dependências** | **F-03**. |
| **Duração** | 2,5 d |
| **Risco** | Baixo tecnicamente (são inalcançáveis); **médio** quanto ao dado histórico do ACE. |
| **Rollback** | Reverter commit; nenhum dado apagado — o pacote **não deleta** dado histórico. |
| **Aceite** | Uma única entrega na página da paciente; zero rota morta; dado histórico preservado conforme F-03. |
| **Documentos** | Auditoria P9, P20, D5, RI5. |

#### K-62 · Reescrita dos canônicos vencidos
| | |
|---|---|
| **Classe** | DOC |
| **Objetivo** | Corrigir P17 (`MODELO_CURADORIA_V1.md` §7 ainda descreve 0–100) e P18 (`PRODUCT_ARCHITECTURE.md` descreve produto substituído). |
| **Dependências** | Todos os pacotes publicados até então. **É o último pacote de cada onda, não o primeiro.** |
| **Duração** | 3 d |
| **Risco** | Baixo. Não fazer = RI9 permanece. |
| **Rollback** | Reverter commit. |
| **Aceite** | Zero divergência conhecida entre código e documento; §11 do Modelo atualizado. |
| **Documentos** | Auditoria P17, P18, RI9. |

#### K-63 · Consolidação dos instrumentos de captação **[F]**
| | |
|---|---|
| **Classe** | UI · GOV |
| **Objetivo** | Eliminar R4/R5 — três instrumentos para a pessoa, dois para o profissional. |
| **Dependências** | K-60. **Decisão do Fundador: é redesenho de experiência, não ligação de fios.** |
| **Duração** | 8 d |
| **Risco** | Alto. |
| **Rollback** | Por flag, instrumento a instrumento. |
| **Aceite** | Ninguém responde duas vezes a mesma pergunta; nenhuma resposta histórica é perdida. |
| **Documentos** | Auditoria R4, R5, D7. |

---

### Bloco 6 — Operação e validação

#### F-70 · Rede real em produção **[F]**
| | |
|---|---|
| **Classe** | OPE |
| **Objetivo** | Existirem profissionais reais publicados. |
| **Dependências** | Externa ao repositório. **Fundador.** |
| **Duração** | Indeterminada |
| **Risco** | **Bloqueante absoluto (RI10)** — sem ela a Curadoria não roda, e o §6 do Congelamento não pode ser satisfeito para reabrir o congelado. |
| **Rollback** | N/A. |
| **Aceite** | ≥1 Case real completo ponta a ponta. |
| **Documentos** | Congelamento §7.2; Auditoria G7, RI10. |

#### V-71 · Homologação ponta a ponta a partir do zero
| | |
|---|---|
| **Classe** | OPE · SEG · MIG |
| **Objetivo** | Validação do zero exigida pelo §13 do papel, ao fim de cada onda que toque banco, permissões, motor ou fixtures. |
| **Escopo** | Reset completo · migrations · seeds · contas de teste · suítes · fluxo crítico ponta a ponta. |
| **Dependências** | A onda correspondente. |
| **Duração** | 1,5 d por onda |
| **Risco** | Compartilhamento da stack Supabase local entre worktrees pode corromper a validação — exige stack quieta. |
| **Rollback** | N/A. |
| **Aceite** | Ambiente limpo reproduz o resultado; nenhuma falha ignorada; falhas preexistentes comprovadas como anteriores. |
| **Documentos** | Papel do Implementador §13; Congelamento §1. |

---

## 2. Mapa de Dependências

### 2.1 DAG (nenhuma dependência implícita)

```
F-00 ─┬─> F-01 ─┬─────────────────────────> L-20 ─> L-21 ─> L-22 ─> L-23
      │         └─> F-06 ─> L-40 ─┬─> L-41
      │                           └─> L-42
      ├─> F-02 ──────────────────────────────> (habilita L-21, L-31, L-33, C-16)
      ├─> F-03 ─────────────────────────────> K-61 ─> K-62
      ├─> F-04 ─┬─> F-05 ─> L-30 ─> L-31 ─┬─> L-32
      │         │                          └─> L-33
      │         └─> C-17
      ├─> F-07 ─────────────────────────────> L-43
      ├─> C-10
      ├─> C-11
      ├─> C-12 ─────────────────────────────> L-40
      ├─> C-13   (+ definição de Método)
      ├─> C-14
      ├─> C-15 ─────────────────────────────> K-60 ─> K-63
      └─> C-16   (+ F-02)

F-70 (Rede real) ─> satisfaz o gatilho do Congelamento §6 ─> pré-condição de VALIDAÇÃO de F-05
                 ─> V-71 (homologação real)

V-71 pendura-se ao fim de cada onda que toque BD/permissões/motor/fixtures.
```

### 2.2 Arestas explicitadas (leitura do DAG)

| Pacote | Depende de | Natureza da dependência |
|---|---|---|
| F-01 | F-00 | árvore limpa |
| F-05 | F-04 | as listas alimentam a tabela de correspondência |
| L-30 | F-05, F-04 | ADR + listas |
| L-31 | L-30, F-02 | contrato + janela de migration |
| L-32 | L-31 | o Perfil só pode refletir a declaração depois da ponte |
| L-33 | L-31 | retrocompatibilidade do que a ponte introduz |
| L-20 | F-01 | o veredito define o tratamento de `MOTOR_PARTICIPATION: "NUNCA"` |
| L-21 | L-20, F-02 | contrato + janela |
| L-40 | F-06, C-12 | ADR + remoção da dependência falsa |
| L-42 | L-40 | as dimensões derivam da avaliação derivada |
| L-43 | F-07 | ADR da chave |
| K-60 | C-15, F-03 | funil derivado + destino do ACE |
| K-61 | F-03 | destino do dado histórico |
| K-62 | tudo publicado | documenta o que existe, não o que se pretende |

---

## 3. Etapa 5 — Autonomia por pacote

| Pacote | Publicável só? | Reversível só? | Testável só? | Homologável só? | Feature flag? |
|---|---|---|---|---|---|
| F-00 | sim | n/a | n/a | sim | não |
| F-01 | sim | sim | sim | sim | não |
| F-02 | sim | parcial | sim | sim | não |
| F-03 / F-04 / F-05 / F-06 / F-07 | sim (doc) | sim | n/a | sim | não |
| C-10 | sim | sim | sim | sim | não (trivial) |
| C-11 | sim | sim | sim | sim | não |
| C-12 | sim | sim | sim | sim | não |
| C-13 | sim | sim | sim | sim | sim |
| C-14 | sim | sim | sim | sim | sim |
| C-15 | sim | sim | sim | sim | **sim (obrigatória)** |
| C-16 | sim | parcial (Cases criados ficam) | sim | sim | **sim (obrigatória)** |
| C-17 | sim | sim | sim | sim | **sim (obrigatória)** |
| L-20 | sim (inerte) | sim | sim | sim | desnecessária |
| L-21 | sim | sim (colunas aditivas) | sim | sim | não (dado) |
| L-22 | sim | sim | sim | sim | **sim (obrigatória)** |
| L-23 | sim | sim | sim | sim | não (permissão) |
| L-30 | sim (inerte) | sim | sim | sim | desnecessária |
| L-31 | sim | sim | sim | sim | **sim (obrigatória)** |
| L-32 | sim | sim | sim | **não** — exige paciente real | **sim (obrigatória)** |
| L-33 | sim | sim | sim | sim | não (dado) |
| L-40 | sim (inerte) | sim | sim | sim | desnecessária |
| L-41 | sim | sim | sim | sim | **sim (obrigatória)** |
| L-42 | sim | sim | sim | **não** — exige paciente real | **sim (obrigatória)** |
| L-43 | sim | sim | sim | sim | sim |
| K-60 | **não** — exige C-15 publicado | parcial | sim | sim | sim |
| K-61 | sim | sim | sim | sim | não |
| K-62 | sim | sim | n/a | sim | não |
| K-63 | não | parcial | sim | não | sim |
| F-70 | n/a | n/a | n/a | n/a | não |
| V-71 | n/a | n/a | n/a | n/a | não |

**Regra derivada:** todo pacote que altera o que o Curador ou a paciente **vê** nasce atrás
de flag. Todo pacote que grava dado novo nasce com colunas aditivas e nullable, para que a
reversão nunca destrua registro.

---

## 4. Etapa 6 — Matriz

| Pacote | Classe | Complexidade | Risco | Dependências | Publicável isoladamente |
|---|---|---|---|---|---|
| F-00 | OPE/GOV | Trivial | Baixo | — | Sim |
| F-01 | MOT/SEG | Baixa | Baixo | F-00 | Sim |
| F-02 | MIG/OPE | Média | **Alto** | F-00 + Fundador | Sim |
| F-03 | GOV/DOC | Trivial | Baixo | Fundador | Sim |
| F-04 | GOV | Baixa | **Alto (bloqueia)** | Fundador | Sim |
| F-05 | GOV | **Alta** | **Máximo** | F-04 | Sim |
| F-06 | GOV | Média | Médio | F-01 | Sim |
| F-07 | GOV | Baixa | Médio | F-00 | Sim |
| C-10 | REL/UI | Trivial | Baixo | F-00 | Sim |
| C-11 | REL | Baixa | Médio | F-00 | Sim |
| C-12 | UI | Trivial | Baixo | F-00 | Sim |
| C-13 | UI | Baixa | Médio | F-00 + Método | Sim |
| C-14 | UI | Média | Baixo | F-00 | Sim |
| C-15 | API/OPE | Média | Médio | F-00 + Fundador | Sim |
| C-16 | BD/API | Média | Médio | F-00, F-02 + Fundador | Sim |
| C-17 | UI/API | Média | **Alto** | F-00, F-04 | Sim |
| L-20 | MOT | **Alta** | Baixo | F-01 | Sim (inerte) |
| L-21 | BD/MIG/SEG | **Alta** | **Alto** | L-20, F-02 + Fundador | Sim |
| L-22 | UI | Média | **Alto (desenho)** | L-21 | Sim |
| L-23 | GOV/OPE | Baixa | Médio | L-22 + Fundador | Sim |
| L-30 | MOT | Média | Médio | F-05, F-04 | Sim (inerte) |
| L-31 | UI/BD | **Alta** | **Alto** | L-30, F-02 | Sim |
| L-32 | UI | Média | **Alto** | L-31 + Fundador | Sim |
| L-33 | MIG | Baixa | Médio | L-31 | Sim |
| L-40 | MOT | Média | Médio | F-06, C-12 | Sim (inerte) |
| L-41 | UI | Média | Médio | L-40 | Sim |
| L-42 | REL/UI | Média | **Alto** | L-40 | Sim |
| L-43 | MOT/UI | Baixa | Médio | F-07 | Sim |
| K-60 | GOV/API | **Alta** | **Alto** | C-15, F-03 + Fundador | Não |
| K-61 | OPE/DOC | Baixa | Baixo | F-03 | Sim |
| K-62 | DOC | Baixa | Baixo | ondas publicadas | Sim |
| K-63 | UI/GOV | **Alta** | **Alto** | K-60 + Fundador | Não |
| F-70 | OPE | — | **Bloqueante** | Fundador | n/a |
| V-71 | OPE/SEG/MIG | Média | Médio | onda | n/a |

---

## 5. Etapa 7 — Classificação estratégica

**Pacotes críticos** (falha compromete o programa): F-05, L-30, L-31, L-21, K-60, F-70.

**Pacotes bloqueadores** (travam outros): F-00 (trava tudo), F-04 (trava F-05 → todo o Bloco 3
e C-17), F-02 (trava toda migration), F-03 (trava K-61/K-60), F-01 (trava L-20 e F-06),
F-06 (trava o Bloco 4), F-70 (trava a validação real de F-05).

**Quick wins** (≤2 d, risco baixo, valor imediato, sem ADR): **C-12** (0,5 d), **C-10** (1 d),
**F-01** (1 d), **C-11** (1,5 d), **C-14** (2 d). Somados: **6 dias** que eliminam quatro
defeitos declarados e produzem o veredito do invariante.

**Alto impacto** (movem o critério de sucesso "<20 atos por Case"): L-21+L-22 (−28 atos por
profissional), L-31 (−17 atos por Case), L-41 (−3×N atos por Case), L-42 (liga a
transparência ao Motor).

---

## 6. Etapa 8 — Sprints

Sprint = 2 semanas. Capacidade suposta: **1 engenheiro dedicado (10 d úteis por sprint)**.
Onde a capacidade real for outra, o cronograma escala proporcionalmente — a **ordem** não muda.

### Sprint 1 — Destravar e provar (10 d)
F-00 (0,5) · F-01 (1) · C-12 (0,5) · C-10 (1) · C-11 (1,5) · C-14 (2) · F-02 (2) · F-07 (1) · V-71 (0,5 parcial)
**Em paralelo, fora da engenharia:** decisões F-03, F-04 do Fundador.
**Saída:** quatro defeitos corrigidos, veredito do invariante emitido, janela de publicação aberta, ADR da ordenação escrita.

### Sprint 2 — Ponte do profissional + ADRs (10 d)
F-05 (2, se F-04 entregue) · F-06 (1,5) · L-20 (4) · L-43 (2) · V-71 (1,5)
**Saída:** contrato de derivação do Mapa do Profissional pronto e inerte; as três ADRs existentes; ordenação implementada.

### Sprint 3 — Ligar as duas pontes (10 d)
L-21 (4) · L-22 (4) · L-30 (3, paralelizável se houver segunda frente) · V-71 (1,5)
**Saída:** Mapa do Profissional proposto a partir da Base, atrás de flag; contrato da ponte grau→importância pronto.

### Sprint 4 — Ponte do Case e transparência (10 d)
L-31 (5) · L-33 (1,5) · L-40 (3) · V-71 (1,5)
**Saída:** proposta de importância atrás de flag; avaliação derivada pronta.

### Sprints 5–6 — Fechamento (não solicitados, registrados para o cronograma macro)
L-41 · L-42 · L-32 · C-15 · C-16 · C-17 · C-13 · L-23 · K-61 · K-62 · K-60 · K-63.

---

## 7. Etapa 9 — Cronograma macro

```
        S1        S2        S3        S4        S5        S6        S7+
Fund.  [F00 F01 F02 F07]
ADRs        [F05 F06]
Prof.            [L20]  [L21 L22]                   [L23]
Case                          [L30]  [L31 L33]  [L32]
Aval.                                      [L40] [L41 L42]
Quick  [C10 C11 C12 C14]                    [C13 C15 C16 C17]
Consol.                                                 [K61 K62]  [K60 K63]
Valid.   [V71]   [V71]   [V71]   [V71]   [V71]   [V71]
Fundad. [F03 F04]……………………………………………………… F-70 (indeterminado) ………………………………>
```

**Horizonte:** 6 sprints (≈12 semanas) para os Blocos 0–4 com um engenheiro. Bloco 5
(K-60, K-63) adiciona 2–3 sprints. **F-70 não está sob controle da engenharia** e pode
deslocar tudo que depende de validação real.

---

## 8. Sequência de Execução (recomendação de ordem)

1. **F-00** — árvore limpa. Nada começa antes.
2. **Decisões do Fundador em paralelo:** F-03, F-04. Enviar hoje; são o gargalo real.
3. **F-01** — o veredito do invariante muda L-20 e F-06.
4. **Quick wins C-12 → C-10 → C-11 → C-14** — valor imediato, risco baixo, zero dependência.
5. **F-02** — abre a janela; sem ela nenhuma migration da 2.0 existe.
6. **F-07 → L-43**, e **F-06 → L-40** — frentes independentes.
7. **F-05 → L-30 → L-31 → L-33 → L-32** — caminho crítico. Não antecipar L-31 sem L-30 verde.
8. **L-20 → L-21 → L-22 → L-23** — frente do profissional, paralela ao item 7.
9. **L-41, L-42** — depois de L-40.
10. **C-15 → K-60**, **F-03 → K-61**, e **K-62 por último**.
11. **V-71 ao fim de cada onda** que toque banco, permissões, motor ou fixtures.

---

## 9. Critérios de Aceite do programa (Etapa transversal)

Consolidados do §12.6 da auditoria — o programa está concluído quando, em um Case com
seis elegíveis:

1. o Curador pratica **menos de 20 atos**, todos de juízo, confirmação ou autoria;
2. **nenhuma** entrada do Motor existe sem origem declarada e rastreável;
3. a paciente lê, no Relatório, as mesmas conclusões que o Motor produziu;
4. *"por que este médico?"* é reconstruível do começo ao fim sem memória humana;
5. as **treze decisões humanas** do §4 da auditoria permanecem humanas;
6. as **oito garantias** do §4 do Congelamento permanecem verdadeiras, com guarda de teste;
7. zero divergência conhecida entre código e documento canônico.

---

## 10. Dependências

### 10.1 Técnicas
Janela de publicação com DDL em produção (F-02) · stack Supabase local quieta durante
suítes longas (V-71) · reversibilidade por colunas aditivas nullable (L-21, L-31, L-33) ·
feature flags disponíveis por superfície (todos os pacotes de UI).

### 10.2 De negócio
Definição de Método do que conta como "documento aberto" (C-13) · precedência entre funil e
Memória para o responsável visível (C-15) · destino das histórias já enviadas (C-16) ·
qual dos seis modelos de progresso é canônico (K-60) · redesenho dos instrumentos (K-63).

### 10.3 De ADR
**F-05** ponte grau → importância (bloqueia L-30, L-31, L-32, L-33) ·
**F-06** divisão da AVALIAÇÃO (bloqueia L-40, L-41, L-42) ·
**F-07** chave de ordenação (bloqueia L-43) ·
**revisão da ADR-040 item 6** se L-21/L-23 alterarem quem escreve o Mapa do Profissional ·
**correção do Congelamento §4.3 ou guarda nova** conforme o veredito de F-01.

### 10.4 Do Fundador
F-03 (ACE) · F-04 (listas provisórias — **primeiro nó do caminho crítico**) ·
F-05 (aprovação da ponte, e do próprio ato de reabrir I-10 sem operação real) ·
janela de publicação (F-02) · L-21/L-23 (quem escreve o Mapa) · L-32 (o que ela reconhece) ·
C-15, C-16, C-17, C-13 · K-60, K-63 · **F-70 (Rede real)**.

---

## 11. Etapa 10 — Caminho crítico e ameaças

### 11.1 Caminho crítico

```
F-00 → F-04 → F-05 → L-30 → L-31 → L-33 → L-32 → V-71
(0,5)  (1)    (2)    (3)    (5)    (1,5)  (3)    (1,5)   = 17,5 d de engenharia
                                                          + tempo de decisão do Fundador
```

O caminho crítico **não é limitado por engenharia**. É limitado por **F-04 e F-05** — duas
decisões humanas. Os 17,5 dias de código só começam a contar depois delas.

### 11.2 O que mais ameaça o cronograma

1. **F-70 — Rede real inexistente.** É a ameaça número um, e é externa. O §6 do
   Congelamento exige necessidade observada em **operação real** para reabrir o congelado;
   F-05 reabre I-10. Formalmente, **F-05 não pode ser validada** enquanto F-70 não
   existir. O programa pode ser construído, mas não certificado.
2. **F-05 rejeitada ou revista após L-30/L-31 prontos.** Descarta ~10 dias. Mitigação: não
   iniciar L-31 antes da ADR assinada.
3. **F-02 — janela de publicação.** Sete pacotes têm migration. Sem janela, eles ficam
   prontos e não publicados; o risco é acumular um lote grande de DDL para uma janela só —
   exatamente o que se quer evitar.
4. **L-21 sobre RLS congelada.** Se a decisão sobre quem escreve o Mapa demorar, a frente do
   profissional para no meio, com L-20 inerte no repositório.
5. **Simetria aceitar/recusar (L-22, L-31).** Se for tratada como detalhe de UI, a 2.0
   entrega o oposto do que promete: proposta virando decisão automática disfavarçada.
6. **Stack Supabase local compartilhada.** Sessões concorrentes corrompem V-71 e produzem
   vermelho falso, que custa dias de investigação.
7. **Capacidade de uma frente só.** O plano assume um engenheiro; as frentes do profissional
   (Bloco 2) e do Case (Bloco 3) são independentes e **paralelizáveis com duas frentes** —
   a segunda frente encurta o programa em ~2 sprints.

---

## 12. Pacotes paralelizáveis

| Frente | Pacotes | Condição |
|---|---|---|
| A — Quick wins | C-10, C-11, C-12, C-14 | independentes entre si e de tudo |
| B — Profissional | L-20 → L-21 → L-22 → L-23 | independente da frente C |
| C — Case | L-30 → L-31 → L-33 → L-32 | independente da frente B |
| D — Avaliação | L-40 → L-41, L-42 | independente de B e C |
| E — Documentação | K-62 | sempre por último de cada onda |

As frentes B, C e D só convergem em V-71 e em K-62.

---

## 13. Plano de Rollback (programa)

**Princípios:**
1. Toda migration é **aditiva e nullable** — reverter nunca destrói registro.
2. Todo pacote de superfície nasce **atrás de flag**; reverter é desligar, não deploy.
3. **Nenhum pacote recalcula decisão já tomada.** Cases classificados antes da ponte
   permanecem como estão (L-33), por I-7.
4. **Nenhum pacote apaga dado histórico** — inclusive o do ACE (K-61).
5. Rollback é sempre **por pacote**, nunca por onda: é o que torna cada um publicável só.

**Ordem de reversão em incidente:** desligar flag → reverter commit de superfície →
reverter commit de lógica → **manter a migration** (aditiva, inerte) → reverter migration
apenas em janela dedicada e nunca junto do incidente.

---

## 14. Riscos consolidados

| # | Risco | Sev. | Mitigação planejada |
|---|---|---|---|
| X1 | F-05 reabre I-10 sem operação real (Congelamento §6 insatisfeito) | **Bloqueante formal** | F-70 antes da certificação; ou decisão explícita do Fundador de reabrir sem o gatilho, registrada na ADR |
| X2 | Proposta vira decisão automática disfarçada | **Alto** | Simetria aceitar/recusar como critério de aceite de L-22 e L-31 |
| X3 | DDL em produção sem backup/PITR | **Alto** | F-02 antes de qualquer migration; backup verificado no procedimento |
| X4 | RLS do Mapa do Profissional enfraquecida (L-21/L-23) | **Alto** | Teste de permissão por papel como aceite; ADR-040 item 6 revisada, não contornada |
| X5 | Lacuna virando estado positivo em L-20/L-30/L-40 | **Alto** | I-8 como critério de aceite explícito dos três |
| X6 | Ordenação interna vazando para a paciente (L-43) | Médio | Guarda de teste na fronteira |
| X7 | Perda de trabalho por F-05 tardia | Médio | Não iniciar L-31 sem ADR assinada |
| X8 | Vermelho falso por stack local compartilhada | Médio | V-71 só com stack quieta |
| X9 | Documentos canônicos vencidos durante o programa | Médio | K-62 ao fim de **cada onda**, não só no fim |
| X10 | Acúmulo de migrations não publicadas | Médio | Publicar por pacote assim que a janela abrir |

---

## 15. Conformidade

Este plano **não implementa nada**; não altera arquitetura, domínio, princípios, critérios,
pesos ou responsabilidades; não cria regra de negócio; e enumera, sem escolher, todas as
decisões que pertencem ao Fundador ou a ADR.
