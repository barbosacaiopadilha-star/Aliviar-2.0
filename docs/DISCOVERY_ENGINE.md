# Discovery Engine — Aliviar Conexão

Documento de arquitetura conceitual de produto. Define **o que é, por que existe e como se comporta** o mecanismo que ajuda uma pessoa a encontrar o profissional, instituição ou recurso certo — não define schema, API, RLS ou qualquer artefato de implementação. A implementação técnica é trabalho futuro, a partir deste documento, respeitando `docs/ENGINEERING_PLAN.md` (módulo `discovery`, já previsto no MVP — ADR-004) e `docs/DECISIONS.md` (ADR-006, modelo extensível de catálogo).

**Premissa inegociável, repetida ao longo de todo o documento porque orienta cada decisão:** o Discovery Engine **não escolhe o profissional pelo paciente**. Ele organiza, clareia e explica as opções — a decisão final é sempre do paciente.

Baseado em: `docs/PRODUCT_VISION.md`, `docs/PRODUCT_PRINCIPLES.md` (especialmente os princípios 1, 2, 6, 9, 12, 13, 14), `docs/BRAND_GUIDELINES.md` (tom de voz), `docs/ENGINEERING_PLAN.md` (escopo do módulo `discovery`).

---

## 1. Visão geral

**Objetivo do Discovery Engine:** ajudar a pessoa que busca cuidado a organizar, entender e comparar as opções reais disponíveis — profissionais, e futuramente instituições e recursos — de forma clara, honesta e sem viés comercial, para que ela tome uma decisão melhor por conta própria.

**Problema que resolve:** hoje, buscar cuidado é uma experiência fragmentada e opaca — diretórios cheios de perfis parecidos, sem contexto real do que diferencia um profissional de outro, com posição de destaque frequentemente comprada (SEO pago, anúncio) e não relacionada a critério nenhum de cuidado. Isso empurra a decisão para quem paga mais, não para quem serve melhor à pessoa. O Discovery Engine existe para inverter isso: organizar informação real ao redor da pessoa que busca, não ao redor de quem paga.

O Discovery Engine **não é**: um algoritmo de recomendação que "escolhe o melhor médico", um sistema de triagem clínica, um mecanismo de ranking pago, ou uma IA que decide por alguém. Ele **é**: uma camada de organização, clareza e explicação sobre um conjunto de opções curadas por humanos.

---

## 2. Princípios que orientam o Discovery Engine

Herda integralmente `docs/PRODUCT_PRINCIPLES.md` — aqui, aplicados especificamente ao mecanismo de descoberta:

- **Nenhum resultado é comprado.** Pagamento, patrocínio ou posição paga nunca são insumo de nenhuma ordenação, filtro ou destaque (princípio 2, independência acima de conveniência).
- **A pessoa sempre vê todas as opções relevantes**, nunca só as "recomendadas" — recomendação é uma lente adicional sobre o conjunto completo, nunca um filtro que esconde alternativas (princípio 14, não paternalismo).
- **Toda ordenação ou destaque é explicável em linguagem simples** — se um critério não pode ser explicado a uma pessoa leiga em uma frase, ele não deveria decidir nada (princípio 9, explicabilidade).
- **Nenhuma inferência além do que a pessoa forneceu explicitamente** — o motor nunca deduz condição de saúde, situação financeira ou qualquer outro dado sensível a partir de comportamento (princípio 12, segurança; princípio 13, consentimento e controle).
- **Diversidade deliberada de resultados** — o motor nunca converge sistematicamente para o mesmo pequeno conjunto de profissionais; isso seria, na prática, um viés de fato mesmo sem intenção.
- **IA, quando existir aqui, é apoio — nunca decisão final** (princípio 6). Ver seção 7.3.

---

## 3. Arquitetura conceitual — entidades

Descrição conceitual, não schema. Cada entidade abaixo é um **conceito de domínio**, não uma tabela — a modelagem técnica (nomes de coluna, tipos, relações) é decisão de uma tarefa de engenharia futura, ancorada neste documento.

### 3.1 Profissional
Representado por identidade verificada (nome, credencial, especialidade(s)), abordagem e modalidade de atendimento, uma biografia em linguagem própria — nunca reduzida só a credencial fria — e um **status de curadoria** (verificado ou não, um selo qualitativo, nunca uma nota numérica competitiva tipo "4,8 estrelas"). Nunca representado por métrica de engajamento (cliques, visualizações) nem por qualquer indicador que recompense volume em vez de cuidado.

### 3.2 Instituições (previsto, fora do MVP — ADR-004)
Entidade própria que agrega profissionais/recursos, com **processo de curadoria independente** — uma instituição nunca herda automaticamente a confiança de um profissional individual afiliado a ela, nem o contrário.

### 3.3 Especialidades
Catálogo aberto e evolutivo — mesma filosofia de catálogo extensível já adotada para papéis de usuário (ADR-006), não uma lista fechada arbitrária. Cada especialidade carrega uma descrição em linguagem simples para quem não é da área (o paciente não deveria precisar já saber o jargão para entender do que se trata).

### 3.4 Preferências do paciente
Conjunto de sinais **explícitos e revisáveis** — nunca um perfil "oculto" construído nas costas da pessoa a partir de comportamento observado. A pessoa pode ver, editar e apagar suas preferências a qualquer momento.

### 3.5 Contexto clínico
Tratado com o máximo de cautela. O Discovery Engine **não é** um sistema de triagem clínica e não coleta diagnóstico. Se a pessoa opta por descrever o que busca (ex.: "apoio para ansiedade"), isso é usado só para refinar a busca — nunca para inferir gravidade, nunca para priorizar uma pessoa sobre outra, nunca compartilhado com o profissional antes do primeiro contato sem consentimento explícito.

### 3.6 Localização
Representada na granularidade mínima necessária (região/cidade), nunca endereço exato a menos que a própria pessoa o forneça deliberadamente para atendimento presencial. Localização nunca é usada para inferir renda ou perfil socioeconômico.

### 3.7 Disponibilidade
Representada de forma honesta e simples (ex.: "aceitando novos atendimentos" / "com espera") — nunca uma promessa de agenda em tempo real que o produto ainda não sustenta de fato, e nunca usada para criar urgência artificial ("só 2 vagas!" — proibido por princípio, `docs/PRODUCT_PRINCIPLES.md` item 8).

### 3.8 Custos
Sempre transparentes antes de qualquer contato — nunca escondidos até o último passo, nunca "a combinar" quando o profissional já tem uma faixa definida. Custo nunca é critério de ordenação (não privilegia o mais caro nem o mais barato) — é só informação para a decisão da pessoa.

### 3.9 Convênios
Dado factual e verificável (aceita ou não determinado convênio). Nunca usado para segmentar ou reduzir a visibilidade de um profissional.

### 3.10 Experiência profissional
Representada em termos qualitativos e verificáveis — tempo de atuação, formação, abordagem. Nunca como "número de atendimentos" ao estilo métrica de e-commerce, que incentivaria volume em vez de qualidade de cuidado.

### 3.11 Evidências
Onde a abordagem terapêutica tiver base científica estabelecida, isso é comunicado com honestidade, distinguindo consenso científico de abordagem alternativa — sem apresentar as duas com a mesma autoridade, mas também sem excluir nada arbitrariamente sem transparência do critério usado.

### 3.12 Qualidade
Nunca um score numérico competitivo. Representada pelo processo de curadoria/verificação humana (seção 5) — um selo qualitativo, não um ranking algorítmico de "melhor para pior".

---

## 4. Fluxo completo

1. **A pessoa informa** o que busca (seção 6) — só o estritamente necessário, o resto opcional.
2. **O motor organiza** o conjunto de opções curadas (profissionais verificados que atendem aos critérios informados), sem excluir nada só por não estar "no topo".
3. **O motor apresenta com explicação** — cada opção mostrada carrega o motivo simples e legível de por que aparece (seção 4.1).
4. **A pessoa decide** — o motor nunca avança uma decisão em nome dela; a próxima ação (solicitar contato) é sempre uma escolha ativa dela.
5. **A decisão e o contexto ficam auditáveis** (seção 6.3) — não para vigiar a pessoa, mas para permitir revisão humana da qualidade da curadoria ao longo do tempo.

### 4.1 Explicabilidade da recomendação
Toda vez que uma opção aparece em destaque ou em uma posição de uma lista ordenada, o motor deve poder responder, em linguagem simples e visível para a pessoa: *"por que isto está aqui"* — por exemplo, "atende sua região e modalidade preferida, tem especialidade em X e disponibilidade atual." Nunca "porque o algoritmo decidiu". Isso é um requisito de desenho desde a primeira versão, não algo adicionado depois — um motor que não nasce explicável precisa ser refeito, não remendado.

---

## 5. Responsabilidades

| Camada | Responsabilidade | Quem decide |
|---|---|---|
| Curadoria de profissionais/instituições | Verificação de credencial, aprovação de entrada na plataforma | **Humano** (administrador/curador) — o motor nunca aprova ninguém sozinho |
| Organização/apresentação de resultados | Filtrar, agrupar e ordenar conforme critérios explícitos e explicáveis | **Motor** (regras determinísticas na primeira versão — seção 7) |
| Explicação de cada resultado | Gerar o texto simples de "por que isto aparece" | **Motor**, com o critério sempre rastreável a uma regra específica |
| Decisão de contato | Escolher com quem falar | **Sempre e só a pessoa** |
| Revisão de qualidade da curadoria | Auditar distribuição de resultados, revisar vieses (seção 6.2) | **Humano**, periodicamente |

---

## 6. Regras

### 6.1 Informação que a pessoa fornece
O que está buscando (em linguagem livre ou categorias amplas — nunca diagnóstico obrigatório), preferência de modalidade (presencial/online), localização/região (se buscar presencial), preferência de horário, idioma, gênero do profissional (se a própria pessoa quiser filtrar por isso — nesse caso é preferência dela, nunca um viés do sistema), faixa de investimento (se quiser compartilhar), convênio (se tiver e quiser usar). Tudo opcional, exceto o mínimo essencial para a busca funcionar.

### 6.2 Informação que nunca deve ser usada
- Histórico de navegação fora da plataforma, ou qualquer dado comprado de terceiros.
- Inferência de condição de saúde não declarada explicitamente.
- Dado de redes sociais ou fonte externa não autorizada pela própria pessoa.
- Tempo de sessão ou padrão de comportamento usado para pressionar decisão.
- Qualquer dado usado para finalidade que não seja a própria busca de cuidado da pessoa — nunca revenda, nunca publicidade de terceiros.
- Pagamento do profissional/instituição — nunca insumo de nenhuma ordenação.

### 6.3 Como evitar vieses
- Nenhuma categoria protegida (raça, gênero, orientação, classe) é usada como critério de ordenação, exceto quando a própria pessoa pede um filtro explícito sobre si mesma ou sua preferência (nesse caso é preferência dela, não viés do sistema).
- Auditoria humana periódica da distribuição de resultados — verificar que o motor não está sub-representando sistematicamente certos profissionais sem motivo declarado.
- Diversidade deliberada nos resultados apresentados.
- Nenhum profissional pode comprar posição, em nenhuma circunstância.

### 6.4 Transparência
Deve existir, de forma acessível à pessoa (não só em termos de uso jurídicos), uma explicação simples de como a curadoria funciona: o que é considerado, o que não é, e a afirmação explícita de que não há posição paga. Isso é responsabilidade de produto, não só de compliance.

### 6.5 Revisão humana
Toda curadoria (verificação de profissional, aprovação de instituição) passa por revisão humana antes de entrar no motor — o motor organiza e apresenta o que já foi curado, nunca decide sozinho quem entra na plataforma. Qualquer resultado do motor pode ser contestado e revisado por um responsável humano.

### 6.6 Auditoria
Toda decisão relevante do motor — por que uma opção apareceu antes de outra, mudança de critério de busca ao longo do tempo — deve ser, por princípio de desenho, rastreável e revisável posteriormente. Isso não é um requisito técnico de log detalhado (decisão de implementação futura); é o princípio de que o sistema nunca deve ser uma caixa preta, nem para quem opera a Aliviar por dentro.

---

## 7. Limitações (o que o Discovery Engine explicitamente não faz)

- Não escolhe o profissional "certo" pela pessoa — só organiza e explica opções.
- Não faz triagem clínica nem diagnóstico.
- Não promete disponibilidade em tempo real além do que o produto realmente sustenta.
- Não vende posição, destaque ou visibilidade.
- Não infere nada sobre a pessoa além do que ela informou explicitamente.
- Não decide sozinho quem entra na plataforma — isso é sempre curadoria humana.

## 7.1 Como integrar IA futuramente

IA pode, no futuro, ajudar a pessoa a **articular melhor o que busca** (ex.: uma conversa em linguagem natural que refina os critérios de busca) e a **organizar/resumir informação** para facilitar comparação entre opções. IA nunca decide sozinha quem é "o melhor profissional" para alguém. Toda sugestão gerada por IA deve ser identificada como tal na interface (nunca disfarçada de critério objetivo), sempre acompanhada de explicação (seção 4.1) e sempre ignorável/editável pela pessoa — mesmo requisito de qualquer IA no produto (`docs/PRODUCT_PRINCIPLES.md`, item 6).

---

## 8. Riscos

- **Viés por omissão de dado**: se a curadoria humana (seção 6.5) não for diversa e cuidadosa, o motor herda e amplifica o viés de quem aprova os profissionais, mesmo sem nenhum viés algorítmico explícito.
- **Pressão comercial futura**: à medida que a plataforma cresce, a tentação de "vender destaque" para sustentar o negócio é um risco real de desvio de princípio — precisa ser resistida explicitamente, não só documentada aqui.
- **Explicabilidade que degrada com a complexidade**: se o motor evoluir para heurísticas mais sofisticadas ou IA, manter a explicação simples exigirá disciplina deliberada — é fácil perder isso "por acidente" ao otimizar por outro critério (ex.: relevância).
- **Confusão de papel**: pacientes podem interpretar uma recomendação como "aprovação médica" da Aliviar sobre qual profissional escolher — a comunicação de produto (`docs/BRAND_GUIDELINES.md`) precisa reforçar ativamente que a decisão é sempre da pessoa.
- **Contexto clínico sensível**: mesmo coletado com boa intenção, qualquer dado de saúde é sensível por definição (`docs/PRODUCT_PRINCIPLES.md`, item 12) — a superfície de coleta deve permanecer mínima por design, não por conveniência de implementação.

## 9. Roadmap evolutivo

1. **V1 — Regras determinísticas e transparentes.** Filtros explícitos (especialidade, modalidade, localização, convênio, disponibilidade) e ordenação simples e declarada (ex.: correspondência de critérios, depois recência de verificação) — sem nenhum modelo de aprendizado de máquina. Todo critério é literalmente a mesma frase mostrada à pessoa.
2. **V2 — Refinamento assistido por IA na articulação da busca.** IA ajuda a pessoa a expressar melhor o que busca (linguagem natural → critérios estruturados), sem alterar a lógica de organização/ordenação em si.
3. **V3 — Heurísticas de relevância mais sofisticadas**, ainda determinísticas e explicáveis, incorporando sinais adicionais (ex.: abordagem terapêutica declarada) — só quando houver massa crítica de dado real para justificar, nunca especulativamente.
4. **V4 — Avaliação de modelos de recomendação mais complexos** (incluindo aprendizado de máquina), só se for possível manter explicabilidade e auditoria ao nível dos princípios desta seção — caso contrário, a evolução para esse estágio não deve acontecer, mesmo que tecnicamente possível.

**Como evoluir sem quebrar compatibilidade:** a arquitetura conceitual separa deliberadamente três camadas independentes — (a) o modelo de informação de entrada (perfil profissional, preferências da pessoa), (b) a lógica de organização/ordenação, e (c) a camada de explicação/apresentação. Trocar (b) — por exemplo, de regra determinística para IA — nunca deve exigir reescrever (a) ou (c). Qualquer nova categoria de informação (nova preferência, novo critério) é sempre aditiva ao modelo existente, nunca uma mudança destrutiva — mesma filosofia já adotada para o catálogo extensível de papéis (ADR-006).
