# ACE v1.0 Calibration Roadmap

Documento não normativo, complementar a [`CALIBRATION_REPORT.md`](CALIBRATION_REPORT.md) — mesma precedência (Constituição → Framework → Ontologia → Kernel → especificações → ADRs prevalecem sempre sobre este documento). Não implementa nada; organiza a sequência de trabalho das três calibrações já registradas (CAL-001, CAL-002, CAL-003), mapeadas às entradas de `CALIBRATION_REPORT.md` por protocolo:

- **CAL-001** → entrada "2026-07-14 — P010 — Golden Set rejeitou negações legítimas de 'ranking'"
- **CAL-002** → entrada "2026-07-14 — P003 — lacuna não essencial classificada como bloqueio"
- **CAL-003** → entrada "2026-07-14 — P004 — urgência instável frente a prazo operacional"

**Regra que governa todo este roadmap:** nenhuma calibração é aprovada porque faz o Golden Set passar. É aprovada porque o Método está correto — o Golden Set passar é a *consequência* verificável disso, nunca o critério de aceitação em si. Todo Fase abaixo inclui uma revisão conceitual explícita antes de qualquer validação automatizada ser aceita como prova de correção.

---

## CAL-001 (P010) — negação de "ranking"

1. **Princípio protegido:** Constituição, Princípio 2 (independência da curadoria) e Princípio 9 (nenhum artefato intermediário tem valor decisório) — a entrega final nunca pode parecer que já decidiu por quem cabe decidir: o cliente.
2. **Comportamento desejado do Curador Médico:** o Curador aprova (P009) três providers como igualmente compatíveis, sem hierarquia entre eles; a entrega final precisa refletir fielmente essa neutralidade — nunca introduzir uma ordem ou preferência que o próprio Curador nunca estabeleceu.
3. **Onde está o problema:** **mecanismo** (principal — lista finita de padrões de negação não cobre toda variação legítima de linguagem) e, secundariamente, **prompt** (incentiva corretamente frases humanas variadas, o que estruturalmente escapa de qualquer lista finita). Não está na especificação, no protocolo, no comportamento do modelo (ele faz o que foi pedido) nem no Golden Set (está capturando o real corretamente).
4. **Menor ajuste possível:** ampliar o conjunto pequeno e auditável de padrões de negação para cobrir construções verbais adicionais observadas (ex.: "não funciona como um ranking"), mantendo determinismo — nunca introduzir NLP ou um segundo modelo validando o primeiro.
5. **Risco de alterar:** se os novos padrões forem desenhados de forma frouxa, uma frase que de fato afirma ranking poderia escapar da verificação (falso negativo) — o pior risco possível aqui, pois deixaria passar exatamente o que a Constituição proíbe.
6. **Risco de não alterar:** falsos positivos continuam bloqueando entregas já aprovadas pelo Curador, gerando atrito operacional e possível atraso na entrega ao paciente depois de uma decisão humana já validada.
7. **Essa calibração muda:** **apenas implementação** (o mecanismo de verificação). A regra em si ("nunca ranking") não muda.

## CAL-002 (P003) — lacuna não essencial classificada como bloqueio

1. **Princípio protegido:** Constituição, Princípio 4 (confiança construída lentamente, nunca antecipa conclusão além do que já foi estabelecido) e Princípio 5 (nenhuma interface aumenta ansiedade).
2. **Comportamento desejado do Curador Médico:** o Curador só deve ver um Caso `BLOCKED` quando genuinamente falta informação essencial para agir com responsabilidade — nunca por uma preferência prática não essencial. Isso preserva o valor do próprio sinal `BLOCKED`: se ele aparecer raramente e sempre por motivo genuíno, o Curador confia nele; se aparecer por qualquer detalhe, o sinal se esvazia.
3. **Onde está o problema:** **prompt** (principal — não reafirma explicitamente a regra que a especificação já tem) e, como consequência direta, **comportamento do modelo** (preencheu a lacuna de orientação com julgamento próprio). Não está na especificação (já é clara e inequívoca), não está no protocolo (`computeStatus` só reflete fielmente a severidade recebida), não está no Golden Set (validou a intenção certa).
4. **Menor ajuste possível:** uma linha em `prompt.md`, replicando literalmente o Caso de Exceção já existente em `specification.md` ("qualquer lacuna que não seja decisão/objetivo ausente é sempre Warning, nunca Blocking").
5. **Risco de alterar:** baixo — é um reforço de uma regra já existente e não-ambígua; não introduz comportamento novo, só remove uma inferência desnecessária deixada em aberto para o modelo.
6. **Risco de não alterar:** alto — Casos prontos para prosseguir continuam podendo ser devolvidos ao cliente pedindo informação desnecessária, e nunca chegam ao Curador (o Caso é barrado antes do P004-P009).
7. **Essa calibração muda:** **apenas implementação** (o `prompt.md` é implementação do protocolo, não a especificação em si). A regra normativa já existe e está correta.

## CAL-003 (P004) — urgência instável frente a prazo operacional

1. **Princípio protegido:** em aberto entre duas leituras possíveis (Alternativa A/B, `CALIBRATION_REPORT.md`) — mas o Kernel já pesa numa direção: "urgency nunca cria senso de urgência artificial", reforçado pelo Princípio 5 da Constituição (tom nunca alarmista).
2. **Comportamento desejado do Curador Médico:** o Curador precisa poder confiar que `urgency` reflete genuinamente pressão de tempo sobre a decisão do cliente — não uma logística incidental — para priorizar corretamente sua atenção entre Casos. Se `urgency` for inflada por qualquer prazo mencionado, o Curador perde a capacidade de calibrar sua própria priorização com precisão.
3. **Onde está o problema:** **especificação** (principal — nunca operacionaliza a regra), **prompt** (herda a mesma vagueza), **comportamento do modelo** (instável entre execuções idênticas, consequência direta da ambiguidade upstream) e **Golden Set** (a fixture original testava uma leitura de `tests.md`/`examples.md` nunca formalmente promovida a regra da especificação).
4. **Menor ajuste possível:** não existe ajuste mínimo de código — exige decisão normativa (A ou B) do arquiteto, propagada depois para `specification.md`, `prompt.md`, `tests.md` e `examples.md`.
5. **Risco de alterar:** depende da alternativa escolhida e de sua implementação — Alternativa A mal implementada arrisca fabricar urgência artificial (contradiz o Kernel); Alternativa B mal implementada arrisca subestimar uma necessidade temporal genuína disfarçada de "logística".
6. **Risco de não alterar:** médio — a ambiguidade normativa continua produzindo classificações inconsistentes entre execuções e entre versões futuras de modelo, reduzindo a auditabilidade exigida pelo Kernel (seção 4: "mesma entrada, mesma saída").
7. **Essa calibração muda:** **filosofia** — é a única das três que exige uma decisão real sobre o que o Método *deveria* fazer, não apenas sobre como implementar corretamente algo já decidido.

---

## Priorização

| CAL | Impacto no paciente | Impacto na Curadoria | Risco de produção | Facilidade de correção | Prioridade |
|---|---|---|---|---|---|
| **CAL-001** (P010) | Médio — atraso na entrega após já aprovada pelo Curador; nunca uma informação errada chega ao paciente | Baixo — P009 já ocorreu; não afeta a decisão do Curador, só sua materialização | Médio — pode gerar backlog de entregas travadas se a taxa de falso-positivo não for desprezível | Média — ampliar padrões é simples, mas a classe do problema (verificação determinística de propriedade semântica aberta) não se fecha totalmente | **Média** |
| **CAL-002** (P003) | Alto — cliente pode ser devolvido pedindo informação desnecessária, com atraso e ansiedade direta | Alto — o Curador nunca chega a ver o Caso; ele é barrado antes do P004-P009 | Alto — ocorre logo no início do pipeline, afetando potencialmente qualquer Caso com esse padrão de lacuna | Alta — ajuste de uma linha, regra já 100% clara na especificação | **Alta** |
| **CAL-003** (P004) | Baixo-médio — não bloqueia nem atrasa nada visível ao cliente; desalinha uma classificação interna | Médio — pode afetar como o Curador percebe a urgência de um Caso, mas ele mantém autoridade final (Kernel, seção 6) | Médio — alimenta `contextAlignment` no P007, podendo variar avaliação de compatibilidade sem mudança real no caso | Baixa — exige decisão normativa do arquiteto antes de qualquer código, não é correção técnica isolada | **Média** |

Nenhuma prioridade acima foi definida por "qual é mais fácil de fazer o Golden passar" — CAL-002 é alta prioridade porque tem impacto real alto **e** confiança alta na correção (regra já inequívoca), não porque é o ajuste mais simples.

---

## Roadmap

As três calibrações tocam protocolos diferentes (P003, P004, P010), sem sobreposição de código ou especificação — são **independentes entre si**. A ordem abaixo reflete prioridade de impacto/confiança, não dependência técnica; CAL-001 e CAL-002 podem correr em paralelo entre si, e a decisão normativa de CAL-003 pode começar a qualquer momento (não bloqueia nem é bloqueada pelas outras duas).

### Fase 1 — CAL-002 (P003): ajuste de prompt sobre regra já existente

1. Revisão conceitual: confirmar que a linha proposta em `prompt.md` apenas repete o Caso de Exceção já escrito em `specification.md` — nenhuma regra nova sendo criada por trás do ajuste.
2. Aprovação explícita do arquiteto do texto exato a adicionar em `prompt.md`.
3. Implementação (edição de `prompt.md` — nunca de `specification.md`, que já está correta).
4. Golden Set — **múltiplas execuções** do caso "caso limpo" (não uma única amostra, dado que o modelo é estocástico), confirmando `READY` de forma consistente, não uma vez só.
5. Validação humana pontual — um Curador revisa uma amostra de Casos sintéticos pós-calibração, confirmando que nenhuma lacuna essencial deixou de ser sinalizada como bloqueio por engano (checagem de não-regressão na direção oposta).
6. Registro no `CALIBRATION_REPORT.md` (nova entrada ou adendo à CAL-002, nunca reescrevendo a original) com o resultado.
7. Produção.

### Fase 2 — CAL-001 (P010): decisão sobre o mecanismo de verificação de ranking

**Status: Implementada (2026-07-15).** Decisão do arquiteto: aceitar deliberadamente uma taxa residual de falso-positivo como salvaguarda — trocando a lista fechada de verbos de negação por um gatilho de negação pequeno e fechado (`não`/`nunca`/`sem`/`nenhum`+flexões/`jamais`), delimitado à cláusula semântica local da ocorrência de "ranking" (nunca atravessando pontuação forte ou conjunção adversativa). Detalhe completo e validação em `CALIBRATION_REPORT.md`, Adendo — 2026-07-15.

1. ~~Decisão do arquiteto~~ — concluída: taxa residual de falso-positivo aceita como salvaguarda.
2. ~~Revisão conceitual do risco de falso negativo~~ — concluída: mitigada por delimitação de cláusula (pontuação forte + conjunções adversativas), validada com 4 casos adversariais de ruptura de oração.
3. ~~Implementação~~ — concluída, só em `final-curadoria.ts`; `specification.md`/`prompt.md` do P010 permanecem inalterados.
4. ~~Testes determinísticos ampliados~~ — concluído: 34 testes em `tests/unit/ace-final-curadoria.test.ts` (24 anteriores + 10 novos).
5. Golden Set — 1 execução real após a implementação não voltou a falhar por "ranking" (falhou por um achado orthogonal, "mais indicado" — ver nova entrada no `CALIBRATION_REPORT.md`); múltiplas execuções adicionais, observando taxa de falso-positivo residual em produção real, seguem recomendadas antes de considerar esta fase encerrada em definitivo.
6. ~~Registro no `CALIBRATION_REPORT.md`~~ — concluído.
7. Produção — pendente (commit local desta TASK ainda não deployado).

### Fase 3 — CAL-003 (P004): decisão normativa (Alternativa A ou B)

1. Decisão formal do arquiteto entre Alternativa A e B (`CALIBRATION_REPORT.md`) — esta fase não tem "menor correção técnica"; a calibração *é* a decisão.
2. Alteração de `specification.md` (parágrafo novo, operacionalizando a relação prazo↔urgência conforme a alternativa escolhida).
3. Alteração de `prompt.md`, refletindo a nova regra da especificação.
4. Reescrita de `tests.md` (T03) e correção (ou confirmação) do exemplo em `examples.md`, conforme a alternativa escolhida.
5. Golden Set — múltiplas execuções, confirmando classificação estável para a mesma entrada (o problema original era justamente instabilidade entre execuções idênticas).
6. Validação humana pontual — Curador revisa se a nova classificação de urgência corresponde ao que ele julgaria razoável para o mesmo caso.
7. Nova ADR, só neste momento (é a única das três calibrações que altera regra normativa de fato).
8. Registro no `CALIBRATION_REPORT.md`.
9. Produção.

---

## Validação

**1. Qual calibração você faria primeiro?** CAL-002 (P003) — maior impacto combinado (paciente + Curadoria + produção) e maior confiança na correção, já que a regra já está 100% clara na especificação.

**2. Qual deixaria por último?** CAL-003 (P004) — exige decisão normativa/filosófica antes de qualquer código; não tem menor ajuste técnico definido até essa decisão ser tomada.

**3. Existe alguma dependência entre elas?** Não. As três tocam protocolos diferentes, sem sobreposição de código, especificação ou prompt. A ordem é por prioridade de impacto/confiança, não por dependência técnica — CAL-001 e CAL-002 podem correr em paralelo; a decisão normativa de CAL-003 pode começar a qualquer momento.

**4. Alguma deve gerar ADR?** Só CAL-003, e só se/quando a Alternativa A ou B for formalmente adotada — é a única mudança de regra normativa real entre as três. CAL-001 e CAL-002 são ajustes de mecanismo/prompt dentro do que já está especificado, sem alterar arquitetura ou regra.

**5. Alguma exige alteração de `specification.md`?** Só CAL-003, e só após a decisão A/B.

**6. Alguma exige alteração de prompt?** CAL-002 (certamente) e CAL-003 (após a decisão normativa, para refletir a regra escolhida). CAL-001 não — o problema está no mecanismo de verificação em código, não no que o prompt pede ao modelo.

**7. Alguma exige alteração apenas de implementação?** CAL-001 — ajuste puro do mecanismo de verificação em `final-curadoria.ts`, sem tocar `specification.md` ou `prompt.md`.
