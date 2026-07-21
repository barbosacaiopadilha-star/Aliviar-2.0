# Política de Evolução da Arquitetura Documental

Governa como documentos nascem, evoluem, entram em conflito e se aposentam — nunca o que eles podem decidir sobre produto, ACE, Compatibility Intelligence, Landing ou qualquer outro domínio de conteúdo. É subordinada a `docs/ace/00-constitution/constitution.md` (a Constituição da Aliviar) e a `docs/AGENTS.md` (governança dos agentes) exatamente como qualquer outro documento deste repositório — nunca equivalente a eles, apenas mais um documento sob a mesma autoridade. Nenhum documento existente foi alterado para produzir esta política.

**Base empírica**: esta política não parte de teoria de governança genérica — parte de padrões reais já observados neste projeto ao longo desta sessão: (a) uma mesma divergência (link de WhatsApp inventado) registrada, sem nunca ser decidida, em cinco documentos sucessivos (`LANDING_UX_WRITING.md`, `LANDING_FUNCTIONAL_SPEC.md`, `LANDING_IMPLEMENTATION_ARCHITECTURE.md`, `LANDING_IMPLEMENTATION_AUDIT.md`, `PATIENT_ENTRY_ARCHITECTURE.md`); (b) dois documentos (`ENGINEERING_PLAN.md`, `LANDING_STRATEGY.md`) com autoridade dividida dentro do próprio arquivo, sem uma convenção formal para isso; (c) um domínio de decisão inteiro (Compatibility Intelligence) existindo só em memória de agente, nunca materializado como documento (`docs/ARCHITECTURE_KNOWLEDGE_MAP.md`); (d) múltiplos documentos se autodeclarando "canônicos" independentemente, sem um registro central que confirme não haver sobreposição.

---

## 1. Ciclo de vida de uma divergência

Uma divergência é qualquer diferença encontrada entre documentação, implementação, produto ou operação — hoje só tratada por um verbo (registrar). Esta política define três destinos possíveis, e a regra objetiva de quando cada um se aplica.

- **Permanece registrada** quando: (a) resolvê-la depende de uma decisão que só o responsável do projeto pode tomar — não é uma correção técnica óbvia; e (b) ela não viola um princípio inegociável (Constituição do ACE, Princípios de Produto) nem cria risco real ao paciente. Exemplo real: o vídeo institucional de 10 minutos descrito em `LANDING_CREATIVE_DIRECTION.md` versus o vídeo ambiente real — decidir qual dos dois é o vigente é uma escolha de produto, não uma urgência.
- **Deve ser corrigida**, não apenas registrada, quando: (a) é violação ativa de uma regra explícita já escrita (não uma interpretação) — exemplo real: o link de WhatsApp genérico, que contraria `LANDING_CREATIVE_DIRECTION.md` §8 diretamente; ou (b) cria risco real de segurança, confiança ou dado do paciente (prioridade 1 do protocolo de investigação já em vigor); ou **(c) já apareceu em três auditorias independentes sem nenhuma decisão explícita ter sido tomada sobre ela**. A terceira repetição de uma mesma divergência não pode mais ser só registrada de novo — precisa virar uma decisão (corrigir, aceitar permanentemente, ou abrir prazo formal de resolução). Esta regra existe porque é exatamente o que já aconteceu nesta sessão: o achado do WhatsApp foi citado cinco vezes sem nunca virar decisão — sob esta política, isso já teria deixado de ser aceitável na terceira citação.
- **É aceita permanentemente** quando o responsável do projeto declara isso explicitamente, por escrito, em algum lugar rastreável. A partir desse momento, a divergência deixa de ser uma divergência — vira uma regra de negócio documentada (uma atualização do documento-fonte ou uma nova ADR, conforme a seção 2). "Aceitar permanentemente" nunca é um silêncio prolongado sendo interpretado como aceite.

---

## 2. Quando uma mudança exige o quê

| Situação | Exige |
|---|---|
| Implementa exatamente o que um documento já especifica, sem decisão nova | Só código |
| Corrige um bug, trazendo o código de volta à conformidade com uma especificação já existente | Só código |
| Corrige uma descrição desatualizada de algo que já é fato consumado em outro lugar (já implementado, já decidido) | Atualização do próprio documento, sem ADR |
| Envolve algo que **poderia ter sido decidido diferente**, e a escolha faz diferença real | ADR novo em `docs/DECISIONS.md` |
| Introduz um domínio de decisão que não cabe no escopo de nenhum documento existente sem forçar sobreposição | Novo documento canônico (ver seção 4) |
| Resolve uma divergência já registrada (qualquer que seja o caminho escolhido) | ADR, no mínimo — porque resolver é sempre uma escolha entre caminhos possíveis, mesmo quando um deles parece óbvio |

**Critério objetivo para a linha mais difícil** (atualização simples vs. ADR): pergunte "poderíamos ter decidido diferente aqui, e isso faria diferença real?" — se sim, é ADR; se não (é só a realidade alcançando a descrição), é atualização direta do documento.

---

## 3. Como tratar cada tipo de documento problemático

- **Parcialmente superado**: nunca marcar o documento inteiro como superado quando só parte dele é — a prática já em uso no projeto (`ENGINEERING_PLAN.md`, `LANDING_STRATEGY.md`, uma nota explícita no topo delimitando o que vale e o que não vale) é formalizada aqui como a regra oficial, não uma exceção. A parte superada nunca é apagada — é histórico de decisão, mantido no mesmo arquivo.
- **Órfão** (nenhum outro documento o referencia): não é, por si só, um problema — mas todo documento novo precisa ser registrado em `docs/INDEX.md` no mesmo ciclo em que nasce (ver seção 4). Um documento que segue órfão por muito tempo, sem nunca ser citado por nada, é candidato a uma revisão de relevância — nunca a exclusão automática.
- **Duplicado** (dois documentos decidindo o mesmo tema): não deveria existir sob esta política — exatamente um documento é a autoridade declarada por tema (formalizado pela Matriz "Fonte da Verdade", `docs/ARCHITECTURE_KNOWLEDGE_MAP.md`, seção 4). Se dois parecem decidir a mesma coisa, um precisa ser reclassificado como referência que aponta para o outro — nunca dois autoritativos simultâneos sobre o mesmo tema.
- **Conflitante** (duas decisões diferentes sobre o mesmo tema): prevalece sempre o documento de maior autoridade na hierarquia já estabelecida (Constituição da Aliviar > Framework/Ontologia/Kernel do ACE > especificações de protocolo, para o Método; Constituição > Visão > Princípios > documentos derivados, para produto). O conflito em si é sempre registrado como achado de auditoria antes de ser resolvido — nunca resolvido silenciosamente escolhendo um lado sem deixar rastro de que havia dois.
- **Histórico**: nunca removido do repositório — permanece por rastreabilidade, marcado desde a primeira linha como não-normativo (mesmo padrão já usado em `docs/tasks/`).

---

## 4. Nascimento e morte de um documento canônico

- **Como nasce**: um documento se torna canônico quando (a) o responsável do projeto aprova explicitamente seu conteúdo como vigente, e (b) ele passa a ser referenciado como fonte de verdade por pelo menos um outro documento ou pela prática real do código. **A frase "documento canônico" escrita no topo de um arquivo não é, por si só, a autoridade** — é uma declaração de intenção que só se torna real com a aprovação do responsável. (Honestidade: hoje, vários documentos deste projeto se autodeclaram canônicos no próprio texto — esta política não corrige isso retroativamente, só define a regra daqui para frente.)
- **Quem tem autoridade para isso**: só o responsável do projeto ("arquiteto do projeto", já nomeado assim em `docs/AGENTS.md` e na governança do ACE). O agente de engenharia pode **propor** um documento como candidato a canônico — nunca declará-lo canônico por iniciativa própria, mesma regra já em vigor para decisões arquiteturais (`docs/AGENTS.md`, "a decisão sempre pertence ao usuário").
- **Quando perde a autoridade**: (a) automaticamente, quando um documento de nível superior o contradiz explicitamente — não precisa de nenhuma ação para isso acontecer; (b) quando o responsável do projeto declara explicitamente que foi substituído — nunca implicitamente, por um documento simplesmente parar de ser mencionado; (c) quando a realidade que ele descreve deixa de existir (um módulo documentado é removido, por exemplo) — nesse caso o documento não é apagado, vira histórico (seção 3).

---

## 5. Auditoria contínua

- **Quem pode abrir uma auditoria**: qualquer sessão de trabalho, humana ou do agente de engenharia, que encontrar uma divergência real durante um trabalho já em andamento — abrir uma auditoria não exige autorização prévia separada, porque auditar é sempre "observar e registrar", nunca "corrigir" (mesma disciplina já praticada em toda esta sessão). Uma auditoria nasce só de encontrar algo, não de decidir procurar por algo.
- **Quem pode encerrar uma auditoria**: só o responsável do projeto. Encerrar significa decidir o destino da divergência (corrigir, aceitar permanentemente, ou definir um critério de revisão futura) — o agente nunca encerra uma auditoria por conta própria, mesmo quando a correção parece óbvia.
- **Quando uma auditoria deve permanecer aberta**: enquanto a divergência que a originou não tiver uma decisão explícita registrada em algum lugar rastreável. Ser mencionada muitas vezes não a encerra sozinha — mas, pela regra da seção 1, a terceira menção **obriga** que ela vire uma decisão, não apenas mais um registro.
- **Reafirmar não é reabrir**: citar um achado já registrado em um novo documento (como esta sessão já fez repetidamente com o achado do WhatsApp) não é uma nova auditoria — é a mesma auditoria sendo carregada adiante. Isso existe para impedir que o mesmo problema seja redescoberto do zero seis vezes em vez de resolvido uma.

---

## 6. Ciclo de vida de um documento

A sequência proposta no pedido (Rascunho → Proposta → Canônico → Em Revisão → Substituído → Histórico) está quase certa, mas assume uma linha reta única — a evidência real deste projeto (seção "Base empírica" acima) mostra dois desvios reais que a sequência linear não acomoda. Proposta revisada, com justificativa:

```
Rascunho ──▶ Proposta ──▶ Canônico ──┬──▶ Em Revisão ──┬──▶ Canônico (revisão concluída sem mudança)
                                      │                 └──▶ Substituído ──▶ Histórico
                                      ├──▶ Substituído ──▶ Histórico
                                      │    (substituição direta, sem passar por Em Revisão —
                                      │     acontece quando uma nova decisão/ADR simplesmente
                                      │     torna o documento anterior obsoleto de uma vez,
                                      │     não por um processo gradual de reconsideração)
                                      │
                                      ├──▶ Parcialmente Substituído
                                      │    (estado ESTÁVEL, não uma etapa de passagem — um
                                      │     documento pode permanecer aqui indefinidamente,
                                      │     como ENGINEERING_PLAN.md e LANDING_STRATEGY.md já
                                      │     fazem hoje: parte do conteúdo continua Canônica,
                                      │     parte já é Histórico, no mesmo arquivo, para sempre,
                                      │     a menos que alguém decida separar os dois em arquivos
                                      │     distintos)
                                      │
                                      └──▶ Histórico
                                           (diretamente, sem Substituído — quando não existe
                                            documento sucessor, porque a realidade descrita
                                            simplesmente deixou de existir)
```

**Duas mudanças em relação à sequência original, e por quê**:
1. **"Substituído" não exige passar por "Em Revisão"** — a sequência original implica que todo documento precisa de um período formal de reconsideração antes de ser substituído. Na prática real deste projeto, um documento às vezes é tornado obsoleto de uma vez só, por uma decisão nova que nem menciona o documento anterior diretamente (o pivô de "descoberta e conexão direta" para o ACE, que tornou grande parte de `ENGINEERING_PLAN.md` obsoleta, não passou por um "Em Revisão" formal). Os dois caminhos são válidos.
2. **"Parcialmente Substituído" precisa existir como estado estável, não como um erro a ser corrigido** — a sequência original força uma escolha binária (Canônico ou Substituído) que não corresponde à prática real já em uso (e, por esta mesma política, seção 3, formalizada como correta). Um documento pode viver permanentemente nesse estado.

---

## Constituição da Governança Documental

O conjunto de regras acima, condensado como referência permanente para qualquer documento futuro deste projeto:

1. **Autoridade não é autodeclarada.** Nasce da aprovação explícita do responsável do projeto — nunca da frase "documento canônico" escrita por quem redige o documento.
2. **O documento de maior autoridade sempre prevalece**, e todo conflito entre documentos é registrado antes de ser resolvido — nunca resolvido em silêncio.
3. **Corrigir uma descrição desatualizada não é a mesma coisa que decidir algo novo.** Sincronizar um documento com uma realidade já consumada é atualização direta; qualquer coisa que poderia ter sido diferente exige ADR.
4. **Nenhuma divergência é resolvida por omissão.** Toda correção real e toda aceitação permanente é um registro explícito, em algum lugar rastreável — nunca um silêncio interpretado como decisão.
5. **A terceira menção de uma mesma divergência obriga uma decisão.** Registrar pela terceira vez sem decidir deixa de ser uma opção válida.
6. **Documento histórico nunca é apagado.** Rastreabilidade de decisão vale mais do que um repositório limpo.
7. **Um documento parcialmente superado é sinalizado por seção, nunca abandonado por inteiro** — e "parcialmente substituído" é um estado legítimo e estável, não uma pendência a resolver.
8. **Todo documento novo é registrado centralmente (`docs/INDEX.md`) no mesmo ciclo em que nasce.** Nenhum documento vive só por ser mencionado uma vez em texto corrido.
9. **O agente de engenharia audita e registra livremente. Só o responsável do projeto decide, corrige e encerra.** Abrir uma auditoria não exige permissão; fechá-la, sim.
10. **Esta Constituição rege como os documentos evoluem — nunca o que eles podem decidir.** É subordinada, sempre, à Constituição da Aliviar e a `docs/AGENTS.md`; nunca equivalente a elas, nunca uma autoridade sobre conteúdo de produto, ACE, Compatibility Intelligence, Landing ou qualquer outro domínio.
