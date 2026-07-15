# Auditoria de Implementação — Landing

Contrato de verificação, não de execução. Não redefine nenhum dos seis documentos canônicos (`BRAND_GUIDELINES.md`, `LANDING_CREATIVE_DIRECTION.md`, `LANDING_EXPERIENCE_PHILOSOPHY.md`, `LANDING_UX_WRITING.md`, `LANDING_FUNCTIONAL_SPEC.md`, `LANDING_IMPLEMENTATION_ARCHITECTURE.md`) nem o `LANDING_IMPLEMENTATION_PLAYBOOK.md` — todos permanecem canônicos e inalterados. Este documento existe para uma única pergunta, repetida em todo Code Review, QA, validação de Produto e aceite final: **isto que foi implementado ainda é o que os seis documentos decidiram?**

Não contém teste automatizado nem caso de teste — contém **critério de auditoria**, verificável por leitura e inspeção direta da implementação.

**Três divergências já conhecidas** (WhatsApp placeholder, FAQ sobre Busca Direta, deriva do vídeo institucional) continuam registradas em `LANDING_UX_WRITING.md` (Parte 2), `LANDING_FUNCTIONAL_SPEC.md` (Parte 3) e `LANDING_IMPLEMENTATION_ARCHITECTURE.md` (observações finais). Aparecem aqui só como linhas da matriz (marcadas **[DIVERGÊNCIA JÁ CONHECIDA]**), nunca corrigidas.

---

## Parte 1 — Decisões obrigatórias por documento canônico

### `BRAND_GUIDELINES.md`
- **Obrigatório na implementação**: personalidade (Serena, Culta sem distante, Acolhedora sem informal, Discreta, Direta); arquétipo Sábio + Cuidador; tom acolhedor/claro/seguro/consultivo.
- **Violação crítica**: qualquer trecho que leia como arquétipo Herói (dramatização, urgência) ou Tech visionário (tecnologia como protagonista).
- **Aceitável temporariamente**: pequena inconsistência de registro adjetivo entre seções recém-escritas, enquanto o texto ainda amadurece — nunca em seções já marcadas [REAL]/aprovadas.
- **Sinal de deriva**: uso crescente de exclamação, superlativo ou verbo de venda aparecendo aos poucos em texto novo, sem que ninguém tenha decidido mudar o tom.

### `LANDING_CREATIVE_DIRECTION.md` (ADR-017)
- **Obrigatório**: critério máximo de sucesso ("é exatamente esse tipo de ajuda que eu estava precisando"); ACE/protocolos/scores nunca visíveis ao paciente (§2); ordem emocional de 9 passos nunca invertida (§3); Landing nunca parece site médico (§5); as 12 seções aprovadas (§6); inovação só em forma, nunca em fluxo/clareza/usabilidade/navegação (§7); WhatsApp como extensão, nunca fuga, nunca link inventado (§8).
- **Violação crítica**: qualquer vocabulário interno do ACE (protocolo, matriz, score, shortlist, ranking) exposto ao paciente; iconografia médica literal; ordem emocional invertida; qualquer inovação visual que confunda fluxo ou navegação (violação do princípio "a interface pode surpreender, a experiência nunca pode confundir").
- **Aceitável temporariamente**: composição visual que intercala a ordem numérica das 12 seções por razão de composição, desde que a ordem emocional (§3) seja preservada — já explicitamente permitido pelo próprio documento.
- **[RESOLVIDO — LAND DO PACIENTE, Fase 10]**: as duas divergências abaixo, ambas registradas repetidamente sem decisão até esta fase, foram decididas pelo responsável do produto e executadas. (1) Link de WhatsApp genérico (violava §8 diretamente) — **removido** (Decisão 1; nenhum destino real existe). (2) Vídeo institucional real divergia do vídeo de 10 minutos descrito em §4 — **§3/§4 atualizados** para aprovar formalmente o vídeo ambiente já implementado como o vídeo de lançamento (Decisão 3, `docs/DECISIONS.md` ADR-026). Nenhuma das duas permanece como divergência aberta.
- **Sinal de deriva**: qualquer comentário de código ou commit começando a nomear artefatos internos do ACE como se fossem conceito de produto.

### `LANDING_EXPERIENCE_PHILOSOPHY.md`
- **Obrigatório**: manifesto de intenção (reconhecimento, não persuasão); os 10 princípios; lista do que nunca fazer (urgência artificial, prova social fabricada, exposição de mecanismo interno, promessa de resultado clínico, simular humano, comparar concorrente); lista do que toda tela futura precisa garantir (próximo passo claro, saída sempre disponível, ritmo calmo, decisão sempre do paciente, WCAG AA como piso).
- **Violação crítica**: qualquer promessa de resultado clínico; urgência artificial (contagem regressiva, "vagas limitadas"); qualquer interrupção não solicitada (modal, pop-up, autoplay de som); qualquer tela sem saída disponível.
- **Aceitável temporariamente**: ausência de elementos opcionais já explicitamente marcados como "não recomendado implementar agora" em `LANDING_UX_WRITING.md` (ex.: subtítulo do Hero) — a ausência aqui não é violação, é a decisão correta already tomada.
- **Sinal de deriva**: fluxo começando a se comportar como funil (etapas obrigatórias em sequência forçada) em vez de jornada com saída sempre disponível.

### `LANDING_UX_WRITING.md`
- **Obrigatório**: todo texto marcado [REAL] presente e inalterado sem justificativa registrada; glossário de palavras proibidas nunca violado; guia editorial de 8 regras respeitado em texto novo.
- **Violação crítica**: qualquer palavra do glossário proibido (algoritmo, IA, protocolo, score, ranking, usuário, lead, funil, grátis/oferta, urgente/agora, garantido/comprovado, diagnóstico/cura/resultado clínico, vagas limitadas) em copy voltada ao paciente.
- **Aceitável temporariamente**: blocos marcados [PROPOSTO] no próprio documento (ex.: alternativa a "Acompanhamento em tempo real") não implementados — são opcionais por definição, ausência não é violação.
- **[DIVERGÊNCIA JÁ CONHECIDA]**: carta 3 do FAQ, que assume Busca Direta como caminho hoje disponível.
- **Sinal de deriva**: nova seção ou tela lançada sem nenhuma entrada correspondente neste documento.

### `LANDING_FUNCTIONAL_SPEC.md`
- **Obrigatório**: comportamento de cada uma das 12 seções (gatilhos, estados, transições) conforme especificado; regras de acessibilidade (movimento reduzido respeitado automaticamente, operável só por teclado, nenhuma informação exclusivamente visual).
- **Violação crítica**: preferência de movimento reduzido ignorada; qualquer interação inoperável por teclado; perda de informação no modo estático em relação ao modo animado; um gatilho de saída que prende o visitante num fluxo.
- **Aceitável temporariamente**: diferença fina de tempo/curva de uma animação em relação à descrição conceitual — a especificação é de comportamento, não de milissegundo exato.
- **Sinal de deriva**: uma seção nova sem nenhum dos estados/gatilhos descritos neste documento — comportamento "implícito" nunca documentado.

### `LANDING_IMPLEMENTATION_ARCHITECTURE.md`
- **Obrigatório**: hierarquia de motores de mão única (10 motores, sem dependência circular nem lateral); nenhuma seção lê estado/DOM de outra seção; os 6 invariantes técnicos (soma das paradas = altura total; nenhuma parada sem emoção documentada; paridade de conteúdo entre modos; todo CTA com destino real; ordem de foco sem pular seção; nenhum motor importando motor de nível superior).
- **Violação crítica**: dependência circular entre motores; um valor contínuo (luz/calor/intensidade) disparando re-renderização de componente; vazamento de memória por ausência de desligamento simétrico; qualquer um dos 6 invariantes quebrado.
- **Aceitável temporariamente [DIVERGÊNCIA JÁ CONHECIDA]**: decomposição em motores ainda lógica (dentro de um único componente), não física em módulos separados; acoplamento leve entre o Motor de Vídeo e o Motor Narrativo (compartilham um índice de parada).
- **Sinal de deriva**: o acoplamento leve já conhecido crescendo em vez de diminuir; novos motores sendo adicionados dentro do componente monolítico existente em vez de extraídos como módulo próprio, ampliando a distância entre a decomposição lógica e a física.

---

## Parte 2 — Matriz de auditoria

| # | Origem documental | Critério objetivo de verificação | Evidência esperada na implementação | Criticidade | Impacto se violado |
|---|---|---|---|---|---|
| 1 | `LANDING_CREATIVE_DIRECTION.md` §2 | Nenhum termo interno do ACE (protocolo, matriz de compatibilidade, score, shortlist, ranking) aparece em texto ou atributo visível ao paciente | Busca textual por esses termos em todo o conteúdo renderizado da Landing, resultado vazio | Alta | Quebra o sigilo do Método — risco direto à Constituição do ACE, não só à Landing |
| 2 | `LANDING_CREATIVE_DIRECTION.md` §3 | A sequência de 9 tons emocionais aparece na ordem descrita, independentemente de como as 12 seções estão compostas visualmente | Leitura da página do início ao fim reconhece a sequência sem inversão | Alta | Quebra a premissa central de "filme, não página" |
| 3 | `LANDING_CREATIVE_DIRECTION.md` §5 | Nenhuma iconografia médica literal (estetoscópio, cruz vermelha, jaleco) nem estética clínica fria | Inspeção visual de todos os assets usados | Média | Aliviar passa a parecer clínica/hospital — contradiz posicionamento |
| 4 | `LANDING_CREATIVE_DIRECTION.md` §6 | As 12 seções oficiais estão todas presentes, na ordem declarada | Checklist seção a seção contra §6 | Alta | Estrutura aprovada não implementada — a Landing deixa de ser a que foi decidida |
| 5 | `LANDING_CREATIVE_DIRECTION.md` §8 | Todo link de WhatsApp/canal externo aponta para um destino real, nunca inventado | Clicar o botão leva a um canal funcional de verdade | Alta | **[RESOLVIDO — Fase 10, Decisão 1]** — CTA removido de `final-actions.tsx`; nenhum link inventado permanece. Não há mais botão para violar este critério |
| 6 | `LANDING_EXPERIENCE_PHILOSOPHY.md`, nunca fazer | Nenhuma urgência artificial, prova social fabricada ou promessa de resultado clínico | Leitura de todo o texto contra a lista de "nunca" | Alta | Quebra confiança de forma difícil de recuperar (Princípio 7, `PRODUCT_PRINCIPLES.md`) |
| 7 | `LANDING_EXPERIENCE_PHILOSOPHY.md`, sempre presente | Toda tela tem próximo passo claro e saída sempre disponível | Navegação manual de cada seção confirmando ambos | Alta | Visitante se sente preso — direto contra o Princípio 14 (não paternalismo) |
| 8 | `LANDING_UX_WRITING.md`, Parte 5 | Nenhuma palavra do glossário proibido aparece em copy nova | Busca textual do glossário completo contra todo o conteúdo | Alta | Linguagem publicitária ou tecnicista reintroduzida silenciosamente |
| 9 | `LANDING_UX_WRITING.md`, Parte 1, seção 10 | Conteúdo do FAQ não afirma um caminho (Busca Direta) que não existe no produto | Leitura das 6 cartas contra o que o produto realmente oferece hoje | Média | **[RESOLVIDO — Fase 10, Decisão 2]** — carta 3 reescrita (`faq-cards.ts`); não nomeia mais Busca Direta nem promete escolha de caminho |
| 10 | `LANDING_FUNCTIONAL_SPEC.md`, Motor compartilhado | Preferência de movimento reduzido é respeitada automaticamente, sem exigir configuração dentro da página | Teste manual com a preferência de sistema ativada | Alta | Exclui usuários que dependem dessa preferência — falha de acessibilidade grave |
| 11 | `LANDING_FUNCTIONAL_SPEC.md`, Parte 2.10 | Toda a experiência é operável só por teclado | Navegação de ponta a ponta sem mouse/toque | Alta | Exclui usuários de tecnologia assistiva — falha de acessibilidade grave |
| 12 | `LANDING_FUNCTIONAL_SPEC.md`, seção 10 (FAQ) | O avanço do FAQ funciona por rolagem, toque/clique e teclado, com paridade entre os três | Teste dos três métodos de avanço | Média | Um método de navegação fica inoperante para parte dos visitantes |
| 13 | `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §2 | Nenhum motor importa um motor de nível superior na hierarquia declarada | Inspeção de dependências do código-fonte | Alta | Risco de dependência circular e comportamento imprevisível |
| 14 | `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §6 | Valores contínuos (luz/calor/intensidade) não disparam re-renderização de componente | Inspeção de performance (contagem de renders durante scroll) | Alta | Degradação de performance perceptível durante a rolagem |
| 15 | `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §5 | Nenhuma seção lê estado ou DOM de outra seção diretamente | Inspeção de imports/referências entre módulos de seção | Média | Acoplamento oculto que dificulta manutenção e viola a decomposição aprovada |
| 16 | `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §7, invariante 1 | Soma das extensões de todas as paradas do Portal = altura total declarada | Verificação do cálculo de configuração das paradas | Baixa | Salto ou espaço morto perceptível entre paradas |
| 17 | `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §7, invariante 4 | Todo CTA/link tem destino real e não-vazio | Verificação de todos os `href`/destinos da página | Alta | **[RESOLVIDO — Fase 10, Decisão 1]** — mesmo achado do item 5; todos os `href` restantes (`/sua-historia`, `/login`, `#duvidas`) são reais e não-vazios |
| 18 | `BRAND_GUIDELINES.md` | Nenhum trecho de texto lê como arquétipo Herói ou Tech visionário | Leitura editorial contra a lista de arquétipos proibidos | Média | Dissonância de marca perceptível, mesmo sem quebra funcional |
| 19 | `LANDING_FUNCTIONAL_SPEC.md`, Parte 2.7-2.8 | Falha de carregamento de imagem/vídeo não deixa área quebrada visível | Teste proposital de falha de carregamento | Média | Percepção de descuido técnico numa página que promete cuidado |

---

## Parte 3 — Checklists

### 1. Checklist de revisão de Pull Request
- [ ] O PR tem objetivo único, rastreável a uma etapa do `LANDING_IMPLEMENTATION_PLAYBOOK.md`.
- [ ] Nenhum termo do glossário proibido (`LANDING_UX_WRITING.md`, Parte 5) foi introduzido.
- [ ] Nenhuma nova dependência lateral ou circular entre motores (`LANDING_IMPLEMENTATION_ARCHITECTURE.md` §2).
- [ ] Nenhuma seção nova lê estado/DOM de outra seção.
- [ ] Todo `useEffect`/observer/listener novo tem desligamento simétrico.
- [ ] Nenhuma re-renderização nova introduzida no caminho de valores contínuos.
- [ ] O comportamento sob movimento reduzido foi verificado, não só o modo animado.
- [ ] Se o PR toca uma das três divergências já conhecidas, a mudança resolve, mantém ou piora a divergência — e isso está explícito na descrição do PR, nunca implícito.

### 2. Checklist de aceite de Produto
- [ ] As 12 seções oficiais estão presentes, na ordem declarada em `LANDING_CREATIVE_DIRECTION.md` §6.
- [ ] O critério máximo de sucesso (§0) é reconhecível numa leitura de ponta a ponta.
- [ ] Nenhuma funcionalidade além do que os documentos canônicos descrevem foi adicionada sem decisão registrada.
- [ ] As divergências já conhecidas foram avaliadas conscientemente antes do aceite — aceitar por ora é válido, ignorar não é.
- [ ] Nenhum vocabulário do ACE (protocolo, score, matriz) vazou para qualquer superfície visível ao paciente.

### 3. Checklist de UX
- [ ] A sequência emocional de 9 passos (`LANDING_CREATIVE_DIRECTION.md` §3) é reconhecível ao vivo.
- [ ] Nenhuma seção interrompe o visitante sem que ele peça.
- [ ] Toda tela tem próximo passo claro e saída sempre disponível.
- [ ] O comportamento de cada seção corresponde a `LANDING_FUNCTIONAL_SPEC.md`, seção a seção.
- [ ] Nenhuma inovação visual compromete fluxo, clareza, usabilidade ou navegação (§7).

### 4. Checklist de Performance
- [ ] Nenhum valor contínuo dispara re-renderização de componente.
- [ ] Um único relógio de quadro serve a todos os motores contínuos de uma mesma região.
- [ ] Motores pausam fora da área visível.
- [ ] Nenhum vazamento de memória (toda assinatura tem desligamento simétrico verificado).
- [ ] Nenhuma concorrência entre motores escrevendo a mesma propriedade visual.

### 5. Checklist de Acessibilidade
- [ ] Movimento reduzido é respeitado automaticamente, sem configuração dentro da página.
- [ ] Toda a experiência é operável só por teclado, do Header ao Rodapé.
- [ ] Nenhuma informação existe exclusivamente como efeito visual/animado.
- [ ] Contraste adequado (WCAG AA) em todas as seções, incluindo as de fundo escuro.
- [ ] Paridade total de conteúdo entre modo animado e modo estático.
- [ ] Foco de teclado sempre visível, ordem sem pular seção.

### 6. Checklist de Conteúdo
- [ ] Todo texto corresponde a `LANDING_UX_WRITING.md` — nenhuma frase inventada sem justificativa registrada.
- [ ] Nenhuma palavra do glossário proibido presente.
- [ ] O guia editorial de 8 regras foi seguido em qualquer texto novo.
- [ ] Nenhuma promessa no texto que o produto real não cumpre hoje (mesmo teste que revelou as duas divergências de conteúdo já conhecidas).

### 7. Checklist de Consistência Arquitetural
- [ ] A hierarquia de motores permanece de mão única, sem exceção nova.
- [ ] Nenhuma seção nova foi construída sem seu contrato de motor correspondente declarado.
- [ ] A decomposição física (módulos separados) não regrediu em relação ao estado já registrado — se um motor novo foi adicionado, ele nasceu como módulo próprio, não dentro do componente monolítico existente.
- [ ] O acoplamento leve já conhecido entre Vídeo e Narrativo não cresceu.
- [ ] Todos os 6 invariantes técnicos de `LANDING_IMPLEMENTATION_ARCHITECTURE.md` §7 continuam verdadeiros.

---

## Parte 4 — O que exige revisão dos documentos canônicos, e o que não exige

### Mudanças que obrigatoriamente exigem revisão de algum documento canônico
- Qualquer alteração na estrutura, quantidade ou ordem das 12 seções (`LANDING_CREATIVE_DIRECTION.md`).
- Qualquer nova afirmação, promessa ou garantia sobre o que o produto faz, que ainda não exista em `LANDING_UX_WRITING.md`.
- Qualquer novo motor, ou mudança na hierarquia/dependência entre motores já existentes (`LANDING_IMPLEMENTATION_ARCHITECTURE.md`).
- Qualquer mudança de personalidade, arquétipo ou tom de voz (`BRAND_GUIDELINES.md`).
- Rebaixar o piso de acessibilidade hoje garantido (WCAG AA só pode subir, nunca descer, sem revisar `LANDING_EXPERIENCE_PHILOSOPHY.md` e `LANDING_FUNCTIONAL_SPEC.md`).
- Decidir, de uma vez por todas, o que o "vídeo institucional" realmente é (o de 10 minutos originalmente descrito, ou o vídeo ambiente já implementado) — qualquer uma das duas respostas exige atualizar `LANDING_CREATIVE_DIRECTION.md` §4, porque hoje ele descreve algo que não é o que existe.
- Resolver a divergência do WhatsApp (seja fornecendo um canal real, seja removendo a ação) — qualquer caminho toca uma regra já escrita em `LANDING_CREATIVE_DIRECTION.md` §8.
- Resolver a divergência da carta do FAQ sobre Busca Direta (seja construindo o caminho, seja reescrevendo a carta) — toca `LANDING_UX_WRITING.md`.

### Mudanças que podem ocorrer só no código, sem alterar documentação
- Extrair os motores hoje concentrados em um único componente para módulos separados — é literalmente implementar o que `LANDING_IMPLEMENTATION_ARCHITECTURE.md` já descreve, não uma nova decisão.
- Otimizações de performance que não mudam comportamento, estado ou gatilho de nenhuma seção.
- Correção de um bug que traz o código de volta à conformidade com uma especificação já existente (ex.: consertar uma tecla que não funciona, quando `LANDING_FUNCTIONAL_SPEC.md` já exigia que funcionasse).
- Preencher o link de WhatsApp com um número real, quando ele existir — `LANDING_CREATIVE_DIRECTION.md` §8 já autoriza essa ação estruturalmente; só faltava o dado real, não uma nova decisão de produto.
- Ajuste fino de timing/curva de uma animação que continua dentro do comportamento conceitual já especificado.
- Correção ortográfica ou de digitação num texto já aprovado, sem mudar seu sentido.

---

**Como usar este documento**: a Parte 2 (matriz) é a referência linha a linha para qualquer disputa específica ("isso é uma violação, ou está dentro do aceitável?"). As Partes 1 e 3 são o ponto de partida rápido por papel (quem audita a arquitetura vai direto à Parte 1/seção correspondente; quem revisa PR vai direto ao checklist 1). A Parte 4 decide, antes de qualquer trabalho começar, se ele pode ser só código ou se precisa passar por uma decisão documentada primeiro.
