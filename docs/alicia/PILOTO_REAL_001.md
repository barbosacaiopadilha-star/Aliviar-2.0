# AliCIA — Piloto Real 001

**Versão:** 1.0  
**Data:** 22 de julho de 2026  
**Papel:** Product Research Lead  
**Status:** Pronto para execução — plataforma congelada  
**Catálogo vigente:** 34 perfis · Ortopedia e Neurocirurgia · 10 cidades prioritárias no ES  
**Documentos de referência (não alterados):** [`PROTOCOLO_ALICIA_1.0.md`](./PROTOCOLO_ALICIA_1.0.md) · [`OPERACAO_ALICIA_1.0.md`](./OPERACAO_ALICIA_1.0.md) · [`AUTORIDADE_ALICIA_1.0.md`](./AUTORIDADE_ALICIA_1.0.md) · [`PILOT_PLAN.md`](./PILOT_PLAN.md)

---

## Resposta direta

**O que estamos validando?**

Não o software. **O produto.**

Especificamente: se pessoas reais, em contexto de escolha de médico, **entendem o que a AliCIA é** e **confiam nas informações que ela organiza** — ou onde essa confiança quebra.

**Estamos prontos para o piloto real?**

**Sim — com escopo honesto, moderador neutro e propósito de aprendizado.**

A AliCIA tem catálogo publicado, metodologia declarada e linguagem de transparência definida. Ainda não tem validação com usuários externos. Este piloto fecha essa lacuna.

---

# Capítulo 1 — Objetivo do piloto

## O que queremos aprender?

O piloto real existe para responder **uma pergunta central**:

> **As pessoas realmente entendem e confiam na AliCIA?**

“Entender” e “confiar” são distintos e ambos são necessários.

| Dimensão | Pergunta de pesquisa | O que NÃO estamos testando |
|----------|---------------------|----------------------------|
| **Compreensão** | O participante sabe o que a AliCIA faz — e o que ela **não** faz? | Velocidade do servidor, bugs de layout, preferência de cor |
| **Confiança** | O participante usaria essas informações para apoiar uma escolha real? | Se o catálogo está “completo” ou “definitivo” |
| **Transparência** | O participante encontra e interpreta fontes e estados de verificação? | Se concorda com cada dado publicado |
| **Utilidade** | A AliCIA é uma etapa útil na jornada — ou um beco sem saída? | Conversão, agendamento, monetização |

## Hipóteses a explorar (não a provar estatisticamente)

1. Pessoas em busca ativa conseguem **encontrar** ortopedista e neurocirurgião sem ajuda.
2. A distinção entre informação **confirmada** e **“Estamos verificando”** é compreendida — e não lida como erro.
3. A seção de **fontes** aumenta confiança quando encontrada.
4. A maioria **não** interpreta a AliCIA como ranking, recomendação ou garantia de qualidade.
5. Perfis com campos em verificação **não destroem** a confiança no conjunto — desde que a limitação seja clara.

## O que este piloto produz

- Evidência qualitativa e comportamental de **8 a 10 sessões**
- Fichas padronizadas por participante (Capítulo 6)
- Métricas comparáveis entre sessões (Capítulo 5)
- Backlog tipado para Produto, Conteúdo, Catálogo e Operação (Capítulo 7)
- Decisão GO / NO-GO / GO com ressalvas (Capítulo 8)

## O que este piloto não é

- Lançamento público ou divulgação em mídia
- Validação regulatória ou médica do conteúdo
- Teste de usabilidade de componentes React
- Pesquisa representativa do Brasil ou do ES
- Aprovação para escalar marketing antes de ler os resultados

---

# Capítulo 2 — Quem participa?

## Tamanho da amostra

| Fase | Participantes | Duração por sessão |
|------|---------------|-------------------|
| **Piloto principal** | 8 a 10 pessoas | 25 a 30 min |
| **Reserva** | 2 pessoas | Substituição por no-show ou perfil faltante |

**Total recrutado:** 10 a 12 · **Meta realizada:** ≥ 8 sessões completas.

Amostra pequena, por design. Buscamos **padrões recorrentes**, não representatividade estatística.

## Perfis obrigatórios

Incluir **pelo menos um participante de cada perfil** abaixo. Não precisa ser proporcional — precisa ser diverso o suficiente para expor falhas diferentes.

### Perfil 1 — Paciente em busca ativa

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Pessoa que está escolhendo ortopedista ou neurocirurgião agora ou nos últimos 30 dias |
| **Por que incluir** | Testa o caso de uso central: decisão real, urgência cognitiva, critérios próprios |
| **Risco se omitido** | Validar só curiosos que não decidiriam nada de qualquer forma |
| **Recrutamento** | Indicação de clínicas, grupos de pacientes, redes pessoais |

### Perfil 2 — Familiar decidindo por outra pessoa

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Filho, cônjuge ou cuidador escolhendo médico para pai/mãe, cônjuge ou familiar próximo |
| **Por que incluir** | Testa se a linguagem funciona para quem não é o paciente e pode ter menos vocabulário médico |
| **Risco se omitido** | Superestimar clareza para quem decide em nome de outro |
| **Recrutamento** | Mesmos canais; filtrar na triagem: “A decisão é para você ou para alguém da família?” |

### Perfil 3 — Médico da região (não listado no catálogo)

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Médico que atua no ES, preferencialmente ortopedia ou neurocirurgia, **sem** perfil publicado na AliCIA |
| **Por que incluir** | Olhar crítico sobre credibilidade, risco de interpretação errada e precisão da formação |
| **Risco se omitido** | Surpresa negativa quando médicos descobrirem o produto depois |
| **Recrutamento** | Rede profissional, CRM-ES, sociedades — com transparência sobre o propósito de pesquisa |
| **Exclusão** | Médico listado no catálogo atual (conflito de interesse) |

### Perfil 4 — Fisioterapeuta ou profissional de saúde não médico

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Fisioterapeuta, enfermeiro, fonoaudiólogo ou outro profissional que orienta pacientes na rede |
| **Por que incluir** | Lê formação com olhar técnico; detecta imprecisões que leigos ignoram |
| **Risco se omitido** | Falsa sensação de precisão para público leigo |
| **Recrutamento** | Associações de fisioterapia, clínicas de reabilitação, grupos profissionais locais |

### Perfil 5 — Pessoa recém-chegada ao Espírito Santo

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Morou no ES há menos de 12 meses ou está escolhendo médico na região sem conhecer a rede local |
| **Por que incluir** | Depende totalmente de fontes externas; não tem “médico da família” como âncora |
| **Risco se omitido** | Validar só quem já conhece nomes e instituições locais |
| **Recrutamento** | Grupos de recém-chegados, empresas com realocação, comunidades de expatriados capixabas |

### Perfil 6 — Pessoa cética em relação a plataformas de saúde

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Já teve experiência negativa com Doctoralia, Google, indicações pagas ou “lista de melhores médicos” |
| **Por que incluir** | Expõe barreiras de confiança que entusiastas e early adopters ignoram |
| **Risco se omitido** | Superestimar confiança do público geral |
| **Recrutamento** | Triagem com pergunta: “Você já desconfiou de site ou app que lista médicos? Conte brevemente.” |

### Perfil bônus (recomendado se possível) — Morador do interior do ES

| Campo | Descrição |
|-------|-----------|
| **Quem é** | Pessoa em Guarapari, Linhares, Colatina, Cachoeiro, São Mateus ou Aracruz buscando especialista na própria cidade ou na região |
| **Por que incluir** | Catálogo agora cobre interior; testar se a expansão é **percebida e útil** |
| **Meta** | 1 a 2 participantes deste perfil entre as 8–10 sessões |

## Critérios de inclusão

- Idade 18+
- Consegue usar smartphone ou computador sem assistência constante
- Nos últimos 12 meses, passou ou está passando por decisão de médico especialista (ortopedia ou neurocirurgia) — própria ou de familiar próximo
- Mora no Espírito Santo **ou** está escolhendo médico para atendimento no ES
- Concorda com gravação de áudio e uso anônimo dos aprendizados (termo assinado)

## Critérios de exclusão

- Trabalha na equipe Aliviar / AliCIA
- Médico com perfil publicado no catálogo AliCIA
- Participou de testes internos da AliCIA nas últimas 4 semanas
- Não consegue completar tarefas em português
- Moderador da sessão é quem construiu a interface (viés de defesa)

## Mensagem de recrutamento (honesta)

> *"Estamos testando uma ferramenta gratuita que organiza informações públicas sobre formação médica de ortopedistas e neurocirurgiões no Espírito Santo. Não é consulta, não é indicação, não é agendamento. Queremos observar como você usaria isso na vida real, se estivesse escolhendo um médico. A sessão dura cerca de 30 minutos, pode ser gravada em áudio, e seus dados ficam anônimos."*

## Matriz de cobertura de recrutamento

Preencher antes de iniciar as sessões:

| Perfil | Meta | Recrutado | Sessão realizada | ID ficha |
|--------|------|-----------|------------------|----------|
| Paciente em busca ativa | ≥ 2 | | | |
| Familiar | ≥ 1 | | | |
| Médico (não listado) | ≥ 1 | | | |
| Fisioterapeuta / saúde | ≥ 1 | | | |
| Recém-chegado ao ES | ≥ 1 | | | |
| Cético em plataformas | ≥ 1 | | | |
| Interior do ES (bônus) | 1–2 | | | |

---

# Capítulo 3 — Roteiro

## Princípio fundamental

**Não explicar a plataforma.**

O participante deve explorar sozinho, como faria em casa. O moderador observa, registra e só faz perguntas neutras — nunca demonstra onde clicar.

## Princípios do moderador

| Fazer | Não fazer |
|-------|-----------|
| Pedir para pensar em voz alta | Ensinar a interface |
| Observar em silêncio antes de perguntar | Defender decisões de produto |
| Registrar tempo, hesitações e frases literais | Corrigir o participante |
| Usar perguntas abertas após cada tarefa | Sugerir “o caminho certo” |
| Intervir só se bloqueio total > 2 min | Mostrar entusiasmo ou frustração |

**Única intervenção permitida durante bloqueio:**

> *"O que você está pensando agora?"*

Nunca: *"Tenta clicar no mapa"* ou *"Lá embaixo tem as fontes"*.

## Ambiente

| Item | Especificação |
|------|---------------|
| **Dispositivo** | Do participante — prioridade **celular** |
| **Conexão** | Estável; URL em aba anônima |
| **URL** | `/alicia` (produção ou staging idêntico ao público) |
| **Moderador** | Roteiro impresso + cronômetro + ficha (Capítulo 6) |
| **Gravação** | Áudio autorizado; vídeo opcional (rosto não obrigatório) |
| **Presença** | Sessão individual — sem observadores na sala |

## Roteiro minuto a minuto (25–30 min)

| Tempo | Etapa | Ação do moderador |
|-------|-------|-------------------|
| 0–3 min | **Acolhida e consentimento** | Agradecer, confirmar gravação, explicar regras (pensar em voz alta, sem respostas certas) |
| 3–4 min | **Contexto mínimo** | *"Imagine que você precisa escolher um médico especialista no Espírito Santo. Use o que aparecer na tela como apoiaria essa decisão."* — **sem** abrir a URL ainda |
| 4–7 min | **Exploração livre** | Entrega acesso à home. Observa primeiro clique, leitura, hesitações |
| 7–22 min | **Tarefas 1–5** | Uma tarefa por vez (Capítulo 4). Cronometrar cada uma |
| 22–27 min | **Perguntas finais** | Cinco perguntas obrigatórias (ver Tarefa 5 e pós-tarefas) |
| 27–30 min | **Encerramento** | Agradecer, explicar que não há resposta certa/errada, confirmar se tem dúvidas sobre o processo de pesquisa |

## Script de abertura (literal)

> "Obrigado por participar. Vou pedir que você use um site como faria na vida real — no seu celular, do seu jeito. **Eu não vou te ajudar a navegar.** Quero entender como a experiência é para você.
>
> Pensa em voz alta: o que você está vendo, o que esperava, o que te confunde. Não existe resposta certa. Posso gravar o áudio para não perder nada do que você disser?"

## Script de transição entre tarefas (literal)

> "Ótimo. Agora uma coisa diferente:"

*(ler o prompt da próxima tarefa)*

## Script de encerramento (literal)

> "Isso já me ajuda muito. Tenho mais algumas perguntas e terminamos. Lembrando: não estou avaliando você — estou aprendendo com a experiência."

---

# Capítulo 4 — Tarefas

As tarefas são ditas **uma de cada vez**, em linguagem natural. O moderador anota na ficha: tempo, cliques, hesitações, frases em voz alta, sucesso/parcial/falha.

---

## Tarefa 1 — Primeira impressão (3 min)

**Prompt:**

> *"Você precisa escolher um médico especialista no Espírito Santo. Use o que estiver na tela para começar."*

**Observar:**

- O que a pessoa entende que o site faz nos primeiros 30 segundos?
- Encontra mapa, lista ou busca sozinha?
- Lê aviso de escopo / piloto na home?
- Demonstra expectativa de agendamento, ranking ou consulta?

**Critério de sucesso:** Participante inicia navegação sem pedir ajuda em ≤ 60 s.

---

## Tarefa 2 — Encontrar um ortopedista (4 min)

**Prompt:**

> *"Encontre um ortopedista que faça sentido para você — pode ser em qualquer cidade do Espírito Santo que apareça no site."*

**Observar:**

- Usa mapa, lista, busca ou filtro de cidade?
- Quanto tempo até abrir um perfil?
- Menciona critério próprio (cidade, hospital, formação)?
- Desiste ou expressa frustração com tamanho do catálogo?

**Critério de sucesso:** Abre perfil de ortopedista em ≤ 3 min sem ajuda do moderador.

**Registrar:** ID do perfil aberto · cidade escolhida · caminho (mapa/lista/busca)

---

## Tarefa 3 — Encontrar um neurocirurgião (4 min)

**Prompt:**

> *"Agora encontre um neurocirurgião. Pode ser na mesma cidade ou em outra."*

**Observar:**

- Aplica aprendizado da tarefa anterior?
- Troca filtro de especialidade corretamente?
- Percebe diferença entre ortopedia e neurocirurgia na interface?
- Compara ou volta ao ortopedista anterior?

**Critério de sucesso:** Abre perfil de neurocirurgião em ≤ 3 min sem ajuda.

**Registrar:** ID do perfil · se usou mesma cidade ou diferente

---

## Tarefa 4 — Explicar por que confiou (ou não) (4 min)

**Prompt:**

> *"Olhando para o perfil que você abriu: o que te faria confiar nessas informações? O que te deixaria em dúvida?"*

**Observar:**

- Menciona CRM, RQE, hospital, formação, fontes?
- Confiança condicional ("confiaria, mas conferiria") vs. absoluta vs. bloqueio?
- Confunde organização de informação com recomendação?
- Cita algo que **não** está na AliCIA como critério (avaliações, preço, agenda)?

**Não induzir:** Não mencionar fontes, CRM ou "estamos verificando" antes da pessoa falar.

**Registrar código de confiança:** C1 / C2 / C3 (ver Capítulo 5)

---

## Tarefa 5 — Mostrar onde encontrou as fontes (3 min)

**Prompt:**

> *"Mostre na tela de onde vêm essas informações. O que você conseguiria conferir por conta própria, fora deste site?"*

**Observar:**

- Encontra seção de fontes / transparência / metodologia?
- Entende diferença entre tipos de fonte?
- Procura links clicáveis?
- Vai à página de metodologia (`/alicia/metodologia`)?

**Critério de sucesso:** Aponta origem das informações em ≤ 90 s (com ou sem link externo).

---

## Tarefa 6 — Interpretar "Estamos verificando" (4 min)

**Preparação do moderador:** Antes da sessão, identificar um perfil com campos em verificação visíveis. Se o participante não abriu um durante as tarefas, pedir que abra qualquer perfil que mostre essa indicação.

**Prompt:**

> *"Você consegue ver alguma informação marcada como 'estamos verificando' ou algo parecido? O que isso significa para você?"*

**Observar:**

- Encontra o marcador sem ajuda?
- Interpreta como: honestidade / erro / perfil incompleto / site falho / desistência do médico?
- A marcação **aumenta** ou **reduz** confiança?
- Pergunta o que falta para confirmar?

**Critério de compreensão (codificar sim/parcial/não):** Participante entende que é limitação de evidência, não erro técnico nem avaliação negativa.

---

## Perguntas finais obrigatórias (após tarefas)

Fazer em tom neutro, na ordem:

1. **"O que você entendeu que a AliCIA faz?"**
2. **"O que gerou confiança em algum momento?"**
3. **"O que gerou dúvida ou desconfiança?"**
4. **"Se você estivesse escolhendo médico amanhã, o que faria depois de usar isso?"**
5. **"Tem algo que você esperava encontrar e não encontrou?"**

### Perguntas de aprofundamento (se sobrar tempo)

- *"Em algum momento você achou que estávamos recomendando um médico?"*
- *"O que significou para você ver 'estamos verificando'?"*
- *"Você se sentiria diferente se tivesse um link para conferir a fonte?"*

### O que NÃO perguntar

- "Você gostou?"
- "Nota de 0 a 10?"
- "O design está bonito?"
- "Você pagaria por isso?"
- "O que você acha que deveríamos construir?"

---

# Capítulo 5 — Métricas

## Princípio

Métricas servem para **comparar sessões** e **identificar padrões** — não para publicar resultados de marketing. Uso interno exclusivo.

---

## 5.1 Métricas de tempo (objetivas)

| Métrica | Como medir | Meta do piloto |
|---------|------------|----------------|
| **T1 — Tempo até primeira ação** | Da abertura da home até primeiro clique significativo | ≤ 60 s em ≥ 70% das sessões |
| **T2 — Tempo até perfil de ortopedista** | Tarefa 2 | ≤ 3 min em ≥ 70% das sessões |
| **T3 — Tempo até perfil de neurocirurgião** | Tarefa 3 | ≤ 3 min em ≥ 70% das sessões |
| **T4 — Tempo até apontar fontes** | Tarefa 5 | ≤ 90 s em ≥ 60% das sessões |
| **T5 — Duração total da sessão** | Acolhida ao encerramento | 25–35 min (alerta se < 20 ou > 40) |

---

## 5.2 Métricas de erro (objetivas)

| Métrica | Definição | Como registrar |
|---------|-----------|----------------|
| **E1 — Pedido de ajuda** | Participante pede "onde clico?" ou equivalente | Contagem por tarefa |
| **E2 — Intervenção do moderador** | Moderador usa frase de desbloqueio | Contagem (meta: 0 por sessão) |
| **E3 — Abandono de tarefa** | Participante desiste antes de completar | Sim/não + em qual tarefa |
| **E4 — Caminho incorreto** | Busca especialidade errada, cidade inexistente, perfil não encontrado | Descrição breve |
| **E5 — Interpretação incorreta grave** | Acredita que AliCIA recomenda, garante qualidade ou agenda consulta | Sim/não — **dispara alerta imediato** |

**Taxa de sucesso por tarefa:** % de sessões que completam sem E2 (intervenção do moderador).

| Tarefa | Meta de sucesso |
|--------|-----------------|
| Tarefa 1 — Primeira impressão | ≥ 90% |
| Tarefa 2 — Ortopedista | ≥ 75% |
| Tarefa 3 — Neurocirurgião | ≥ 75% |
| Tarefa 4 — Confiança (verbal) | 100% (sempre possível responder) |
| Tarefa 5 — Fontes | ≥ 60% |
| Tarefa 6 — "Estamos verificando" | ≥ 60% encontram o marcador |

---

## 5.3 Métricas de confiança

Pergunta única, codificada pelo moderador **após Tarefa 4**, com base na fala do participante (não mostrar escala ao usuário):

**"Com base na sessão até aqui, o participante confiaria nas informações para apoiar uma escolha?"**

| Código | Significado | Exemplo de fala |
|--------|-------------|-----------------|
| **C1** | Sim, com ressalvas claras e aceitáveis | "Confio no que está confirmado; conferiria o CRM" |
| **C2** | Talvez — precisaria conferir fora | "É um começo; eu buscaria no hospital também" |
| **C3** | Não — desconfiança bloqueia uso | "Parece propaganda" / "Não confio em site de médico" |

**Meta:** ≥ 60% em C1 ou C2 · Alerta se ≥ 40% em C3 pelo **mesmo motivo** em ≥ 3 sessões.

---

## 5.4 Métricas de compreensão

Após cada sessão, moderador classifica (sim / parcial / não):

| ID | Pergunta de codificação | "Sim" significa |
|----|-------------------------|-----------------|
| **K1** | Entendeu que a AliCIA **não recomenda** médicos? | Explica com suas palavras; não acha ranking |
| **K2** | Entendeu o **escopo** do catálogo (ES, ortopedia e neurocirurgia)? | Não acha que é qualquer especialidade ou Brasil inteiro |
| **K3** | Entendeu **confirmado vs. em verificação**? | Descreve corretamente na Tarefa 6 |
| **K4** | Encontrou **origem das informações**? | Aponta fontes na Tarefa 5 |
| **K5** | Entendeu que AliCIA **não garante qualidade** do médico? | Diferencia formação de resultado clínico |

**Meta:** K1 e K5 em "sim" em ≥ 80% das sessões.

---

## 5.5 Métricas de comportamento (documentar, sem meta rígida)

| Métrica | Por que documentar |
|---------|-------------------|
| Mapa vs. lista vs. busca | Preferência de descoberta |
| Perfis Nível A vs. B abertos | Impacto de campos em verificação |
| Cidade filtrada vs. explorada no mapa | Uso da expansão interior |
| Acesso à metodologia | Interesse por regras vs. perfis |
| Número de perfis abertos por sessão | Profundidade de exploração |

---

## 5.6 Painel consolidado (preencher após todas as sessões)

| Métrica | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | Média / % |
|---------|----|----|----|----|----|----|----|----|----|----|-----------|
| T2 ortopedista (s) | | | | | | | | | | | |
| T3 neurocirurgião (s) | | | | | | | | | | | |
| T4 fontes (s) | | | | | | | | | | | |
| Confiança C1/C2/C3 | | | | | | | | | | | |
| K1 não recomenda | | | | | | | | | | | |
| K3 em verificação | | | | | | | | | | | |
| Sucesso T2–T6 | | | | | | | | | | | |

---

# Capítulo 6 — Registro

## Princípio

Uma ficha padronizada por participante. Preenchida **durante** e **imediatamente após** a sessão — nunca de memória no dia seguinte.

Moderador: _______________ · Data da síntese coletiva: _______________

---

## Ficha de participante — PILOTO REAL 001

### Identificação da sessão

| Campo | Preenchimento |
|-------|---------------|
| **ID da sessão** | PR-001-___ (ex.: PR-001-01) |
| **Data** | ___/___/2026 |
| **Horário** | |
| **Moderador** | |
| **Dispositivo** | ☐ Celular Android ☐ Celular iOS ☐ Computador ☐ Tablet |
| **URL / ambiente** | ☐ Produção ☐ Staging |
| **Gravação** | ☐ Áudio ☐ Vídeo ☐ Não · Arquivo: _______ |
| **Duração total** | ___ min |

### Perfil do participante (autodeclarado + triagem)

| Campo | Preenchimento |
|-------|---------------|
| **Perfil principal** | ☐ Paciente busca ativa ☐ Familiar ☐ Médico ☐ Fisioterapeuta/saúde ☐ Recém-chegado ES ☐ Cético plataformas ☐ Interior ES |
| **Cidade de residência** | |
| **Busca para si ou familiar?** | |
| **Especialidade buscada na vida real** | ☐ Ortopedia ☐ Neurocirurgia ☐ Ambas ☐ Nenhuma agora |
| **Conhecia a AliCIA antes?** | ☐ Sim ☐ Não |
| **Já usou Doctoralia / Google / outro?** | ☐ Sim ☐ Não · Qual: _______ |

### Tarefa 1 — Primeira impressão

| Campo | Registro |
|-------|----------|
| Tempo até primeira ação (T1) | ___ s |
| Primeiro elemento tocado | |
| Frase literal (primeiros 30 s) | |
| Entendeu o propósito? | ☐ Sim ☐ Parcial ☐ Não |
| Sucesso sem ajuda? | ☐ Sim ☐ Não |

### Tarefa 2 — Ortopedista

| Campo | Registro |
|-------|----------|
| Tempo (T2) | ___ min ___ s |
| Caminho usado | ☐ Mapa ☐ Lista ☐ Busca ☐ Filtro cidade |
| Cidade escolhida | |
| ID / nome do perfil aberto | |
| Critério mencionado pelo participante | |
| Erros (E1–E4) | |
| Sucesso? | ☐ Sim ☐ Parcial ☐ Não |

### Tarefa 3 — Neurocirurgião

| Campo | Registro |
|-------|----------|
| Tempo (T3) | ___ min ___ s |
| Mesma cidade da T2? | ☐ Sim ☐ Não · Cidade: _____ |
| ID / nome do perfil aberto | |
| Erros (E1–E4) | |
| Sucesso? | ☐ Sim ☐ Parcial ☐ Não |

### Tarefa 4 — Confiança

| Campo | Registro |
|-------|----------|
| Código de confiança | ☐ C1 ☐ C2 ☐ C3 |
| O que gerou confiança (citação) | |
| O que gerou dúvida (citação) | |
| Mencionou recomendação/ranking? | ☐ Sim ☐ Não |
| E5 — interpretação grave? | ☐ Sim ☐ Não · Descrição: _____ |

### Tarefa 5 — Fontes

| Campo | Registro |
|-------|----------|
| Tempo (T4) | ___ s |
| Encontrou seção de fontes? | ☐ Sim ☐ Não |
| Foi à metodologia? | ☐ Sim ☐ Não |
| O que disse que conferiria fora | |
| Sucesso? | ☐ Sim ☐ Parcial ☐ Não |

### Tarefa 6 — "Estamos verificando"

| Campo | Registro |
|-------|----------|
| Perfil usado | |
| Encontrou o marcador? | ☐ Sim ☐ Não |
| Interpretação (citação literal) | |
| Aumentou ou reduziu confiança? | ☐ Aumentou ☐ Neutro ☐ Reduziu |
| K3 — compreensão | ☐ Sim ☐ Parcial ☐ Não |

### Perguntas finais (síntese)

| Pergunta | Resposta resumida (palavras do participante) |
|----------|-----------------------------------------------|
| O que a AliCIA faz? | |
| O que gerou confiança? | |
| O que gerou dúvida? | |
| O que faria depois? | |
| O que esperava e não encontrou? | |

### Codificação final do moderador

| ID | Sim | Parcial | Não |
|----|-----|---------|-----|
| K1 — Não recomenda | ☐ | ☐ | ☐ |
| K2 — Escopo ES / especialidades | ☐ | ☐ | ☐ |
| K3 — Em verificação | ☐ | ☐ | ☐ |
| K4 — Fontes | ☐ | ☐ | ☐ |
| K5 — Não garante qualidade | ☐ | ☐ | ☐ |

### Observações livres

```
(Espaço para hesitações, expressões faciais, comentários não solicitados, 
momentos de surpresa positiva ou negativa)
```

### Backlog imediato (hipóteses — não decisões)

| # | Observação em uma linha | Tipo provável (P/Ct/Ca/Op) |
|---|-------------------------|----------------------------|
| 1 | | |
| 2 | | |
| 3 | | |

*P = Produto · Ct = Conteúdo · Ca = Catálogo · Op = Operação*

---

# Capítulo 7 — Análise

## Princípio

O piloto produz **evidência**, não lista de pedidos. Cada achado passa por um funil antes de virar trabalho — e só então é roteado para o destino correto.

```
Observação → Padrão → Hipótese → Prioridade → Backlog tipado
```

---

## 7.1 Síntese coletiva (D+1 após última sessão)

**Duração:** 90 minutos  
**Participantes:** moderadores + Product Research + representante de Conteúdo/Catálogo (ouvinte, sem defender produto)

**Agenda:**

1. (15 min) Cada moderador apresenta 2 sessões em 5 min cada — só fatos e citações
2. (30 min) Agrupamento em cluster wall (físico ou digital): navegação · confiança · linguagem · escopo · catálogo
3. (30 min) Aplicação da regra dos 3 (abaixo)
4. (15 min) Roteamento para Produto / Conteúdo / Catálogo / Operação

**Regra de ouro na síntese:** Separar **fato observado** de **interpretação do moderador**.

| Fraco | Forte |
|-------|-------|
| "Acho que o mapa confunde" | "4 de 8 participantes tocaram no mapa e voltaram para a lista em < 20 s" |
| "Ninguém confia" | "3 de 8 disseram 'estamos verificando' soa como erro; citações nas fichas PR-001-02, -05, -07" |

---

## 7.2 Regra dos 3 — quando vira padrão

Um achado só vira **padrão** se:

- Aparece em **≥ 3 sessões**, ou
- Aparece em **2 sessões** com o **mesmo perfil** de participante, ou
- Aparece **1 vez** com **risco alto** (confusão legal, interpretação de recomendação, garantia de qualidade)

Padrões que não passam na regra dos 3 ficam em **observações isoladas** — registrados, não priorizados.

---

## 7.3 Roteamento — Produto · Conteúdo · Catálogo · Operação

Cada padrão vai para **um destino primário**. Pode ter secundário, mas nunca "todos".

### Produto

**O que entra aqui:** Compreensão da proposta de valor, jornada de descoberta, interpretação de estados da interface, confusão sobre o que a AliCIA é.

| Exemplo de padrão | Exemplo de resposta permitida (sem código neste piloto) |
|-------------------|--------------------------------------------------------|
| ≥ 3 pessoas acham que AliCIA recomenda médicos | Revisar copy da home e primeiros elementos visíveis |
| Ninguém encontra metodologia | Revisar rótulo ou posição do link — ajuste de apresentação |
| "Estamos verificando" lido como erro do site | Revisar texto explicativo adjacente ao marcador |
| Mapa ignorado por todos | Documentar preferência por lista; decisão de produto futura |

**O que NÃO entra:** Dado errado em perfil, médico faltando, fonte desatualizada.

### Conteúdo

**O que entra aqui:** Copy, tom de voz, clareza de textos, explicações públicas, alinhamento com Autoridade AliCIA.

| Exemplo de padrão | Exemplo de resposta permitida |
|-------------------|-------------------------------|
| Participantes não entendem diferença confirmado/verificando | Reescrever microcopy com linguagem da Autoridade (Cap. 2) |
| Metodologia parece jurídica demais | Simplificar sem reduzir rigor |
| Aviso de piloto não é lido | Testar posição e redação do aviso |
| Médico cético acha tom "marketing" | Ajustar adjetivos e promessas implícitas |

**O que NÃO entra:** Bug de UI, CRM faltando, processo de verificação.

### Catálogo

**O que entra aqui:** Dados publicados, completude de perfis, fontes, cobertura geográfica percebida, impacto de Nível B na confiança.

| Exemplo de padrão | Exemplo de resposta permitida |
|-------------------|-------------------------------|
| Participantes abrem só perfis com formação pendente e perdem confiança | Priorizar elevação Nível A dos perfis mais acessados |
| "Só tem 3 médicos em Vitória" (falso) | Verificar se filtro está ativo; se não, problema de Produto |
| Cidade do interior sem resultado quando filtrada | Lacuna real de catálogo — ciclo operacional |
| Fonte citada sem link gera desconfiança | Adicionar URL nas fontes onde Protocolo permite |

**O que NÃO entra:** Mudança de layout, novo componente de busca.

### Operação

**O que entra aqui:** Processos internos revelados indiretamente, prazos de verificação, correções, consistência entre fontes.

| Exemplo de padrão | Exemplo de resposta permitida |
|-------------------|-------------------------------|
| Participante médico aponta inconsistência CRM vs. site | Abrir caso de correção ALC-ES |
| "Informação desatualizada" em perfil específico | Revisão operacional do perfil |
| Pergunta "por que esse médico está e outro não?" | Resposta pública conforme Autoridade Cap. 5 — não expansão automática |
| Link de fonte quebrado | Correção imediata na operação |

**O que NÃO entra:** Redesign, nova feature, mudança de Protocolo.

---

## 7.4 Matriz de decisão rápida

| Se o participante disse/fez… | Destino primário |
|------------------------------|------------------|
| "Não entendi o que o site faz" | **Produto** + Conteúdo |
| "Parece que vocês indicam o melhor" | **Conteúdo** + Produto |
| "Esta formação está errada" | **Catálogo** + Operação |
| "Cadê médico em [cidade]?" | **Catálogo** (se lacuna real) ou Produto (se filtro) |
| "Não achei de onde veio a informação" | **Produto** |
| "O que é 'estamos verificando'?" | **Conteúdo** |
| "Quero agendar consulta" | Registrar · **fora de escopo** |
| Link de fonte não abre | **Operação** |

---

## 7.5 Template de item de backlog pós-piloto

```markdown
## [PR-001-___] Título curto

**Evidência:** O que 3+ pessoas fizeram ou disseram (IDs de sessão: PR-001-__)
**Citação:** "___________" — PR-001-__
**Hipótese:** Por que isso acontece
**Risco se ignorarmos:** Confiança / Compreensão / Uso
**Destino primário:** ☐ Produto ☐ Conteúdo ☐ Catálogo ☐ Operação
**Proposta de resposta:** Ajuste mínimo — sem descrever feature nova
**Exige mudança de Protocolo?** ☐ Sim ☐ Não
**Critério de validação:** Como saberemos que melhorou no Piloto Real 002
```

---

## 7.6 Decisão de próxima fase

Após backlog priorizado, **uma única decisão**:

| Decisão | Quando |
|---------|--------|
| **Piloto Real 002** — mais participantes, mesmo escopo | GO com ressalvas; correções de copy/conteúdo/catálogo pontuais |
| **Piloto Real 002** — incluir interior ou novos perfis | GO pleno + demanda explícita por cidades do interior |
| **Pausa** | NO-GO em confiança ou compreensão (Capítulo 8) |
| **Ampliação pública controlada** | GO pleno + nenhum NO-GO + backlog crítico endereçado |

---

# Capítulo 8 — Critério de sucesso

## Quando podemos dizer: "O piloto foi bem-sucedido"?

O piloto **bem-sucedido** não significa "todo mundo amou". Significa: **aprendemos o suficiente com confiança estatística qualitativa para decidir o próximo passo sem adivinhar.**

Requer **≥ 8 sessões completas** e aplicação dos critérios abaixo.

---

## 8.1 Sucesso — GO

**Todos** os critérios obrigatórios + **≥ 4 de 6** critérios fortes.

### Critérios obrigatórios (todos necessários)

| # | Critério |
|---|----------|
| O1 | ≥ 75% das sessões completam Tarefas 2, 3 e 5 sem intervenção do moderador |
| O2 | ≥ 80% codificam K1 como "sim" (entende que AliCIA não recomenda) |
| O3 | ≥ 80% codificam K5 como "sim" (entende que não garante qualidade) |
| O4 | **Nenhum** participante relata acreditar que AliCIA **garante** qualidade ou resultado clínico |
| O5 | ≥ 60% em C1 ou C2 na métrica de confiança |
| O6 | Nenhum bloqueador crítico (E5) repetido em ≥ 3 sessões pelo mesmo motivo |

### Critérios fortes (≥ 4 de 6)

| # | Critério |
|---|----------|
| F1 | ≥ 70% encontram ortopedista em ≤ 3 min (T2) |
| F2 | ≥ 70% encontram neurocirurgião em ≤ 3 min (T3) |
| F3 | ≥ 60% apontam fontes em ≤ 90 s (T4) |
| F4 | ≥ 60% interpretam "estamos verificando" corretamente (K3 = sim) |
| F5 | ≥ 50% mencionam que **confeririam** informação fora — sinal de confiança madura, não bloqueio |
| F6 | Participante "busca ativa" completa T2 e T3 em ≥ 3 de 4 sessões desse perfil |

**Veredito GO:** Produto compreendido e confiança suficiente para **Piloto Real 002** ou ampliação controlada.

---

## 8.2 Falha — NO-GO

**Qualquer um** destes dispara NO-GO — pausar exposição pública e corrigir antes de novas sessões:

| # | Critério NO-GO |
|---|----------------|
| N1 | ≥ 40% acreditam que AliCIA **indica ou ranqueia** médicos (K1 = não em ≥ 4 sessões) |
| N2 | ≥ 50% não encontram origem das informações na Tarefa 5 |
| N3 | ≥ 40% em C3 pelo **mesmo motivo** recorrente |
| N4 | "Estamos verificando" é sistematicamente lido como **erro ou abandono** em ≥ 5 sessões |
| N5 | ≥ 50% das sessões "busca ativa" falham T2 ou T3 em 5 min |
| N6 | Médico participante identifica **erro factual grave** em perfil aberto durante sessão |

**Veredito NO-GO:** Pausa · síntese de emergência em 48 h · backlog crítico antes de qualquer nova exposição.

---

## 8.3 Resultado intermediário — GO com ressalvas

GO numérico atingido, mas padrão claro em 2–3 sessões (ex.: links de fonte ausentes geram desconfiança).

**Condições para continuar:**

1. Padrão documentado com evidência e citações
2. Plano de correção mínima (Conteúdo / Catálogo / Operação) antes do Piloto 002
3. **Sem** divulgação ampla (mídia, redes abertas, SEO) até reavaliação
4. Próximas sessões usam mesmo roteiro para medir se correção funcionou

---

## 8.4 O que comunicar após o piloto

| Audiência | Mensagem |
|-----------|----------|
| **Equipe interna** | Veredito GO/NO-GO/ressalvas + top 5 padrões + backlog tipado |
| **Participantes** | Agradecimento; sem resultados individuais |
| **Público externo** | Nada — piloto não é lançamento |
| **Médicos / imprensa** | Nada — até decisão explícita pós-Piloto 002 |

---

## 8.5 Resumo executivo

| Pergunta | Resposta esperada após o piloto |
|----------|--------------------------------|
| As pessoas entendem a AliCIA? | Medido por K1, K2, K5 e pergunta final "o que a AliCIA faz?" |
| As pessoas confiam na AliCIA? | Medido por C1/C2/C3 e Tarefa 4 |
| Onde a confiança quebra? | Padrões roteados para Produto / Conteúdo / Catálogo / Operação |
| Podemos ir além? | GO · GO com ressalvas · NO-GO |
| O software funcionou? | **Pergunta explicitamente fora de escopo** |

---

## Checklist operacional pré-piloto

- [ ] URL `/alicia` acessível em celular (produção ou staging = público)
- [ ] Roteiro impresso para moderador
- [ ] Termo de consentimento (gravação + uso anônimo + LGPD)
- [ ] Fichas PR-001 em branco (10 cópias)
- [ ] Planilha ou painel do Capítulo 5.6
- [ ] Matriz de recrutamento (Capítulo 2) com perfis marcados
- [ ] Pelo menos 2 perfis identificados antes da sessão 1: um Nível A + um Nível B
- [ ] Moderador **não** é quem construiu a interface
- [ ] Sessão teste a seco (15 min) com colega interno que **não** trabalhou no produto

---

## O que este documento não autoriza

- Alterar código, UX, React, arquitetura ou catálogo
- Alterar Protocolo, Operação ou Dashboard
- Publicar resultados como marketing
- Concluir que o produto está "pronto para o Brasil"
- Implementar features sugeridas por participantes sem passar pelo funil do Capítulo 7

---

**Parar para revisão.**

*Documento gerado em 22 de julho de 2026 — Epic 09 Piloto Real.*
