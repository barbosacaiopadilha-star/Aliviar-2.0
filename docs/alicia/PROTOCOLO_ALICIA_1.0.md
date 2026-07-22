# Protocolo AliCIA 1.0

**Versão:** 1.0  
**Status:** Canônico — governança de catálogo  
**Data:** 22 de julho de 2026  
**Aplicação:** Todo médico publicado na AliCIA deve cumprir este protocolo integralmente.

---

## Como usar este documento

Este protocolo é o ativo central da AliCIA. Ele define **critérios objetivos, verificáveis e reproduzíveis** para decidir quem entra no catálogo, com que informações, em que nível de confirmação e quando pode ser publicado.

**Regra de ouro:** duas pessoas diferentes, aplicando este protocolo ao mesmo conjunto de fontes sobre o mesmo médico, devem chegar **exatamente à mesma conclusão** em cada etapa.

Se dois analistas discordam, o protocolo está incompleto ou a evidência está insuficiente — não há “critério de desempate” por opinião.

---

# Capítulo 1 — Missão

## Por que o Protocolo AliCIA existe?

A AliCIA organiza **informações públicas** sobre formação e trajetória de médicos especialistas para que pacientes possam decidir com mais clareza.

Sem protocolo, cada perfil seria montado de forma diferente. Isso gera:

- inconsistência entre perfis;
- risco de publicar informação sem fonte;
- risco de o paciente interpretar organização como recomendação;
- impossibilidade de auditar decisões;
- perda de confiança no produto.

O Protocolo AliCIA existe para garantir que **todo perfil publicado segue as mesmas regras**, com a mesma rigorosidade, independentemente de quem opera o catálogo.

## Qual problema resolve?

| Problema | Como o protocolo resolve |
|----------|---------------------------|
| Informação inventada ou não rastreável | Exige fonte documentada para cada afirmação publicada |
| Perfis incompletos apresentados como completos | Define níveis internos de verificação e regras de publicação |
| Interpretação como ranking ou indicação | Proíbe critérios subjetivos de qualidade clínica |
| Decisões opacas | Toda decisão de entrada, edição, suspensão ou exclusão é registrada |
| Catálogo inconsistente | Checklist operacional único para todo médico novo |

## O que o protocolo não é

- Não é avaliação da qualidade do atendimento.
- Não é recomendação médica.
- Não é ranking de médicos.
- Não é substituto do julgamento clínico do paciente.
- Não é permissão para publicar dados sem fonte “porque parece correto”.

**A AliCIA informa. O paciente decide.**

---

# Capítulo 2 — Escopo

## Versão 1.0

| Dimensão | Escopo |
|----------|--------|
| **Estado** | Espírito Santo (ES) |
| **Especialidades** | Ortopedia · Neurocirurgia |
| **Idioma do catálogo** | Português (Brasil) |

## Fora de escopo nesta versão

- Outros estados brasileiros
- Outras especialidades médicas
- Avaliação de desfecho clínico, satisfação de pacientes ou reputação online
- Agendamento, telemedicina, marketplace ou qualquer transação comercial
- Perfis de clínicas, hospitais ou redes (apenas vínculos institucionais do médico)

## Regra de expansão

Qualquer ampliação de escopo (novo estado, nova especialidade) exige **nova versão do protocolo**, aprovada antes da publicação de novos perfis nesse escopo.

---

# Capítulo 3 — Critérios de elegibilidade

Um médico só pode **entrar no processo de catalogação** se cumprir **todos** os critérios abaixo.

## 3.1 CRM ativo

| Critério | Regra objetiva | Evidência aceita |
|----------|----------------|------------------|
| Registro profissional | CRM ativo no Conselho Regional de Medicina | Consulta pública ao CRM (preferencialmente CRM-ES para atuação no ES) |
| Identificação | Nome no CRM compatível com o nome do perfil (variações de abreviação documentadas) | Print ou captura datada da consulta + URL de origem |
| Situação | Situação “ativo” ou equivalente na base consultada | Mesma fonte |

**Não elegível** se: CRM suspenso, cancelado, falecido ou não encontrado após busca em duas fontes independentes (CRM + outra fonte institucional).

## 3.2 RQE (Registro de Qualificação de Especialista)

| Especialidade | RQE obrigatório? | Regra |
|---------------|------------------|-------|
| Ortopedia | **Sim** | RQE em Ortopedia e Traumatologia, ou título de especialista reconhecido (ex.: TEOT/SBOT) documentado em fonte de confiança nível 1 ou 2 |
| Neurocirurgia | **Recomendado; obrigatório para publicação plena** | RQE em Neurocirurgia ou título equivalente documentado; sem RQE/título: perfil pode entrar em processamento, mas **não pode ser publicado em Nível A** (ver Capítulo 7) |

**Evidência aceita para RQE/título:** CRM, sociedade de especialidade (SBOT, SBN), ou instituição de formação credenciada.

## 3.3 Especialidade

O médico deve atuar **comprovadamente** em Ortopedia ou Neurocirurgia no Espírito Santo.

**Evidência mínima (pelo menos uma):**

1. RQE ou título de especialista na área; **ou**
2. Vínculo institucional público como especialista na área (hospital, instituto, consultório com descrição explícita da especialidade); **ou**
3. Registro em diretório profissional que declare explicitamente a especialidade **e** confirmação por segunda fonte de nível igual ou superior.

**Não elegível** se: especialidade declarada apenas em rede social sem confirmação; generalista sem evidência de atuação na especialidade do escopo.

## 3.4 Documentação mínima

Para iniciar catalogação, o dossiê deve conter **no mínimo**:

| Documento / dado | Obrigatório |
|------------------|-------------|
| Nome completo | Sim |
| CRM (número e UF) | Sim |
| Especialidade no escopo | Sim |
| Cidade de atuação principal no ES | Sim |
| Pelo menos 1 fonte de nível 1 ou 2 (ver Capítulo 6) | Sim |
| Registro de quem coletou e quando | Sim |

Sem esses itens, o perfil **não entra** no pipeline — fica em fila de “dados insuficientes”.

## 3.5 Trajetória verificável

“Trajetória verificável” significa que **pelo menos um marco de formação ou atuação** pode ser confirmado por fonte de nível 1, 2 ou 3 (Capítulo 6).

Não é exigido que toda a trajetória esteja confirmada na entrada. É exigido que **nada seja publicado como confirmado sem fonte**.

## 3.6 Documentos obrigatórios no dossiê

Todo médico catalogado deve ter arquivo de dossiê com:

1. **Ficha de elegibilidade** (checklist Capítulo 12, seção A)
2. **Lista de fontes** com URL, data de acesso e tipo
3. **Capturas ou referências** das fontes primárias
4. **Registro de conflitos** (se houver divergência entre fontes)
5. **Decisão de publicação** assinada por revisor autorizado (Capítulo 10)

---

# Capítulo 4 — Critérios de formação

Avaliação **somente por evidência documental**. Nunca por reputação subjetiva, “nome conhecido” ou opinião da equipe.

## 4.1 Graduação

| Campo | Critério de confirmação | Nível mínimo da fonte |
|-------|-------------------------|------------------------|
| Instituição | Nome oficial da faculdade de medicina | Nível 1, 2 ou 3 |
| Curso | Medicina | Implícito se instituição é faculdade de medicina |
| Período (ano) | Ano de conclusão | Nível 2 ou superior; se só nível 4: marcar como não confirmado |

**Publicação:** instituição pode ser exibida se confirmada. Período só é exibido se confirmado. Sem confirmação: campo marcado internamente como **Nível C** e exibido ao paciente como *“Estamos verificando esta informação.”*

## 4.2 Residência

| Campo | Critério de confirmação |
|-------|-------------------------|
| Existência | Programa de residência médica em Ortopedia/Neurocirurgia (ou área compatível documentada) |
| Instituição | Nome oficial do hospital/serviço de residência |
| Programa | Nome do programa conforme fonte |
| Período | Ano início/fim somente se constar em fonte nível 1–3 |

**Residência em outro estado/país:** permitida; localidade deve constar quando confirmada.

**Múltiplas residências:** cada uma avaliada independentemente.

## 4.3 Fellowship / treinamento complementar

| Campo | Critério |
|-------|----------|
| Definição | Pós-residência com programa nomeado (fellowship, subespecialização, ano adicional) |
| Confirmação | Fonte nível 1–3 que cite programa e instituição |
| Sem confirmação | Não publicar como confirmado; pode constar em notas internas de revisão |

## 4.4 Treinamentos, estágios e títulos

| Tipo | Quando incluir no perfil |
|------|-------------------------|
| Título de especialista (TEOT, etc.) | Quando constar em fonte nível 1 ou 2 |
| Estágio / observação | Somente se programa e instituição forem identificáveis em fonte nível 1–3 |
| Curso de curta duração | **Não incluir** por padrão; exceção se for marco central da atuação declarada em fonte nível 1–2 |
| Mestrado/doutorado | Incluir se confirmado e relevante à especialidade; não é obrigatório |

## 4.5 Regras universais de formação

1. **Nenhum dado inventado.** Se não há fonte, o campo não é preenchido com suposição.
2. **Uma afirmação = uma fonte mínima** do nível exigido para aquele campo.
3. **Conflito entre fontes:** prevalece fonte de nível superior (Capítulo 6); empate exige revisão humana e registro — perfil não sobe de nível até resolução.
4. **Períodos:** ano isolado aceito; intervalo só se ambas as datas constarem na fonte.
5. **Linguagem ao paciente:** “Fellowship” não é usado na interface; usar *treinamento complementar*.

---

# Capítulo 5 — Instituições

Instituições são **classificadas**, nunca ranqueadas.

## 5.1 Categorias oficiais

| Categoria | Definição objetiva | Exemplos |
|-----------|-------------------|----------|
| **Universidade** | Instituição de ensino superior credenciada pelo MEC | UFES, EMESCAM |
| **Hospital universitário** | Hospital vinculado a programa de graduação/residência documentado | HUCAM-UFES |
| **Hospital especializado** | Hospital com foco declarado em área (ortopedia, neurologia, trauma) | ICOT, INEST, INTO |
| **Hospital geral** | Hospital de atendimento amplo sem foco único declarado | HEC, Hospital Meridional |
| **Instituto / centro especializado** | Entidade com nome e missão específica na área | Institutos de ortopedia/neurocirurgia |
| **Sociedade médica** | Associação profissional de especialidade | SBOT, SBN |
| **Consultório / clínica** | Local de atuação ambulatorial identificado publicamente | Consultório com endereço público |
| **Centro internacional** | Instituição fora do Brasil com registro verificável | Harvard Medical School, Brigham and Women's Hospital |
| **Fonte não classificada** | Instituição citada mas sem metadados suficientes | Usar até classificação; não inferir tipo |

## 5.2 Regras de classificação

1. Categoria vem do **nome oficial + tipo declarado na fonte**, não de “prestígio”.
2. Mesma instituição deve ter **um único nome canônico** no catálogo (evitar duplicatas por grafia).
3. Cidade e UF são obrigatórios quando a fonte informar.
4. **Proibido** usar categoria para ordenar médicos ou sugerir superioridade.

## 5.3 Instituições pendentes

Se o nome da instituição não puder ser confirmado: **não publicar o nome**; marcar campo como verificação pendente (Nível C).

---

# Capítulo 6 — Fontes

## 6.1 Hierarquia de confiança (ordem decrescente)

| Nível | Tipo de fonte | Exemplos | Uso |
|-------|---------------|----------|-----|
| **1** | Registro profissional oficial | CRM-ES, RQE, consulta CRM | Identidade, especialidade, situação profissional |
| **2** | Instituição oficial | Site do hospital, UFES, instituto | Vínculo, formação, atuação |
| **3** | Sociedade médica de especialidade | SBOT, SBN, TEOT | Título, especialidade, membresia |
| **4** | Hospital / serviço público de saúde | Portal do SUS, página de corpo clínico | Atuação, especialidade |
| **5** | Currículo oficial do médico | Site pessoal profissional, Lattes | Formação e trajetória (seção confirmada cruzada com nível 1–3) |
| **6** | Diretório profissional | Catálogos médicos, Doctoralia, Google Business | **Somente** como pista; exige confirmação por fonte nível 1–4 para publicar como confirmado |
| **7** | Outras fontes | Redes sociais, notícias, indicação verbal | **Não publicável** como fato; apenas nota interna de lead |

## 6.2 Regra de publicação por fonte

- **Fato confirmado ao paciente:** exige fonte nível **1, 2 ou 3** (ou 4 para atuação institucional simples).
- **Fato com confirmação parcial:** fonte nível 5 ou 6 + confirmação parcial → Nível B interno.
- **Sem fonte nível 1–6 utilizável:** Nível C; não exibir como fato confirmado.

## 6.3 Resolução de conflitos

Quando duas fontes divergem (instituição diferente, ano diferente, especialidade diferente):

| Passo | Ação |
|-------|------|
| 1 | Registrar ambas as versões no dossiê |
| 2 | Aplicar hierarquia: prevalece fonte de nível menor (1 vence 6) |
| 3 | Se mesmo nível e divergência: **não publicar o campo** até nova fonte ou revisão |
| 4 | Documentar decisão e responsável |
| 5 | Nunca “escolher a versão mais favorável” ao médico |

## 6.4 Metadados obrigatórios por fonte

Cada fonte citada no perfil deve registrar:

- Nome da fonte
- Tipo (conforme tabela acima)
- URL ou referência de consulta
- Data de acesso
- Analista que registrou

---

# Capítulo 7 — Verificação

Níveis **internos**. Não são exibidos ao paciente com esses rótulos.

## 7.1 Nível A — Totalmente confirmado

**Definição:** todos os campos **obrigatórios para publicação plena** estão confirmados por fontes nível 1–3.

| Campo | Exigência para Nível A |
|-------|------------------------|
| Identidade (nome + CRM) | Confirmado (fonte 1) |
| Especialidade no escopo | Confirmado (fonte 1 ou 3) |
| Cidade de atuação no ES | Confirmado (fonte 1–4) |
| Graduação (instituição) | Confirmado |
| Pelo menos 1 marco de formação pós-graduação OU atuação institucional principal | Confirmado |
| Atuação atual (instituição ou consultório) | Confirmado |
| Áreas de atuação | Confirmadas se exibidas |
| Fontes no perfil | Mínimo 2, sendo ≥ 1 de nível 1 ou 2 |
| Campos pendentes | Nenhum campo crítico em aberto |

**Exibição ao paciente:** informação apresentada sem ressalva de verificação pendente nos campos críticos.

## 7.2 Nível B — Confirmado parcialmente

**Definição:** elegível e publicável com **transparência explícita** sobre lacunas.

Critérios:

- CRM e especialidade confirmados (fonte 1 ou equivalente)
- Pelo menos 1 fonte nível 1–3
- Um ou mais campos de formação ou atuação **sem confirmação suficiente**
- Nenhuma informação não confirmada é exibida como confirmada

**Exibição ao paciente:** *“Estamos verificando esta informação”* nos campos pendentes; seção “O que ainda estamos verificando” preenchida.

## 7.3 Nível C — Aguardando confirmação

**Definição:** há lead ou dados insuficientes; **não publicável** na versão pública.

Critérios (qualquer um):

- CRM não confirmado
- Especialidade no escopo não confirmada
- Apenas fontes nível 6–7
- Conflito não resolvido em campo crítico
- Dúvida sobre identidade (homônimos)

**Exibição ao paciente:** perfil **oculto** (Capítulo 8).

## 7.4 Mapeamento interno → linguagem ao paciente

| Nível interno | Linguagem ao paciente |
|---------------|----------------------|
| A | Informação apresentada; fontes listadas |
| B | Informação confirmada + campos com *“Estamos verificando…”* |
| C | Perfil não visível |

**Nunca** usar ao paciente: “Nível A/B/C”, “score”, “confiabilidade 80%”, “perfil completo/incompleto”.

---

# Capítulo 8 — Publicação

## 8.1 Quando um perfil pode ser publicado

Um perfil pode ser **publicado** (visível na AliCIA) se:

| # | Condição |
|---|----------|
| 1 | Elegibilidade (Capítulo 3) aprovada |
| 2 | Nível interno **A ou B** |
| 3 | Checklist operacional (Capítulo 12) 100% concluído |
| 4 | Revisão por operador autorizado (Capítulo 10) |
| 5 | Nenhum bloqueador de qualidade estrutural (ID duplicado, conflito de identidade, CRM irregular) |
| 6 | Dossiê arquivado com fontes e data |

## 8.2 Quando deve permanecer oculto

| Situação | Ação |
|----------|------|
| Nível C | Oculto |
| Elegibilidade não comprovada | Oculto |
| Em duplicidade não resolvida | Oculto |
| Aguardando documentação mínima | Oculto (fila de ingestão) |
| Suspenso (Capítulo 9) | Oculto |

## 8.3 Quando deve voltar para revisão

Revisão obrigatória se:

- Nova fonte contradiz dado publicado
- CRM passa a situação irregular
- Denúncia fundamentada de erro factual (com evidência)
- Passaram-se **180 dias** desde a última verificação de campos críticos
- Médico solicita correção (via canal oficial)
- Mudança de escopo do protocolo

**Durante revisão:** perfil pode permanecer publicado em Nível B com banner interno de revisão, **exceto** se houver risco de informação incorreta — nesse caso, suspender imediatamente.

## 8.4 Estados do perfil

```
[Lead] → [Em catalogação] → [Em revisão] → [Publicado A/B] → [Suspenso] → [Arquivado]
                                    ↑              |
                                    └──────────────┘
                                      (revisão periódica ou incidente)
```

---

# Capítulo 9 — Exclusão

## 9.1 Remoção definitiva (arquivamento)

| Motivo | Exemplo | Ação |
|--------|---------|------|
| CRM cancelado ou falecimento | Registro CRM | Arquivar; remover da busca pública |
| Especialidade fora do escopo | Deixou de atuar em ortopedia/neuro no ES | Arquivar |
| Solicitação válida do titular | Médico comprova identidade e pede remoção | Arquivar (salvo obrigação legal de manter registro interno) |
| Fraude de identidade | Perfil não corresponde ao CRM | Excluir e registrar incidente |
| Duplicata confirmada | Mesmo médico, dois perfis | Fundir ou arquivar duplicata |

## 9.2 Suspensão temporária

| Motivo | Duração | Ação |
|--------|---------|------|
| Conflito de fontes não resolvido | Até resolução | Ocultar público |
| CRM em processo disciplinar | Até confirmação da situação | Ocultar público |
| Erro factual grave reportado | Até correção verificada | Ocultar público |
| Revisão periódica vencida | Até revisão concluída | Ocultar ou manter B com revisão — decisão do revisor sênior |

## 9.3 Registro de exclusão ou suspensão

Todo evento deve registrar:

- ID do perfil
- Motivo (código padronizado)
- Evidência (link, print, referência)
- Data e hora
- Responsável
- Ação tomada (suspender / arquivar / republicar)
- Próxima revisão (se aplicável)

**Retenção:** registros de auditoria mantidos por no mínimo **5 anos**, mesmo após arquivamento do perfil.

---

# Capítulo 10 — Governança

## 10.1 Papéis e permissões

| Papel | Criar lead | Catalogar | Revisar | Publicar | Suspender | Republicar | Arquivar |
|-------|:----------:|:---------:|:-------:|:--------:|:---------:|:----------:|:--------:|
| **Operador de ingestão** | ✓ | ✓ | — | — | — | — | — |
| **Revisor de catálogo** | ✓ | ✓ | ✓ | ✓ (Nível B) | ✓ | ✓ | — |
| **Curador sênior** | ✓ | ✓ | ✓ | ✓ (A e B) | ✓ | ✓ | ✓ |
| **Auditor (somente leitura)** | — | — | — | — | — | — | — |

**Regra:** publicação em **Nível A** exige curador sênior ou segundo revisor (quatro olhos).

## 10.2 Auditoria

Toda alteração no catálogo gera registro com:

- Quem alterou
- O que alterou (campo anterior → campo novo)
- Por quê (referência ao protocolo ou ticket)
- Fonte que sustenta a alteração
- Timestamp

## 10.3 Conflito de interesse

Quem revisa um perfil **não pode**:

- Ser o próprio médico listado
- Ter vínculo financeiro ou familiar documentável com o médico
- Ter participado da captação comercial (inexistente na AliCIA por princípio — se existir no futuro, recusar revisão)

## 10.4 Versionamento do protocolo

- Alterações no protocolo geram nova versão (1.1, 2.0).
- Perfis publicados são reavaliados apenas nos campos afetados pela mudança.
- Versão do protocolo aplicada fica registrada no dossiê de cada perfil.

---

# Capítulo 11 — Princípios

Estes princípios **não têm exceção** operacional.

1. **Nunca vender posição** no catálogo.
2. **Nunca aceitar pagamento** de médico, clínica ou intermediário para inclusão, destaque ou ordem.
3. **Nunca alterar critérios** para beneficiar alguém específico.
4. **Nunca publicar informação sem fonte** rastreável.
5. **Nunca esconder informação relevante** que conste em fonte pública (ex.: campo em verificação deve ser visível como pendente, não omitido).
6. **Nunca afirmar** que um médico é “o melhor”, “referência”, “top” ou equivalente.
7. **Nunca recomendar** médicos — nem por algoritmo, nem por curadoria editorial, nem por ordem de lista.
8. **A AliCIA informa. O paciente decide.**

Violação destes princípios é falha grave de governança e exige revisão imediata dos perfis afetados.

---

# Capítulo 12 — Checklist operacional

Todo médico novo percorre **exatamente** estas etapas, na ordem.

## A — Elegibilidade (entrada no pipeline)

- [ ] **A1.** Nome completo coletado
- [ ] **A2.** CRM consultado (print + data + URL)
- [ ] **A3.** Situação do CRM: ativo
- [ ] **A4.** Especialidade no escopo confirmada (ortopedia ou neurocirurgia)
- [ ] **A5.** RQE ou título verificado (ortopedia: obrigatório; neuro: registrado)
- [ ] **A6.** Atuação no Espírito Santo confirmada (cidade + UF)
- [ ] **A7.** Pelo menos 1 fonte nível 1–3 documentada
- [ ] **A8.** Decisão: **ELEGÍVEL** / **NÃO ELEGÍVEL** (se não, encerrar e arquivar lead)

## B — Coleta de formação e atuação

- [ ] **B1.** Graduação: instituição + fonte
- [ ] **B2.** Residência(s): instituição, programa, período (se disponível) + fonte cada
- [ ] **B3.** Treinamento complementar: programa + instituição + fonte (se houver)
- [ ] **B4.** Títulos (TEOT, etc.): + fonte (se houver)
- [ ] **B5.** Instituições de atuação atual: nome, cidade, papel + fonte
- [ ] **B6.** Áreas de atuação: somente se declaradas em fonte nível 1–4
- [ ] **B7.** Conflitos entre fontes registrados e resolvidos ou marcados pendentes

## C — Classificação institucional

- [ ] **C1.** Cada instituição categorizada (Capítulo 5)
- [ ] **C2.** Nome canônico aplicado (sem duplicata de grafia)
- [ ] **C3.** Cidade/UF preenchidos quando conhecidos

## D — Verificação interna

- [ ] **D1.** Nível atribuído: **A** / **B** / **C**
- [ ] **D2.** Campos não confirmados listados em `unverifiedFields`
- [ ] **D3.** Nenhum campo pendente exibido como confirmado
- [ ] **D4.** Mínimo de 2 fontes no perfil (para publicação B ou A)

## E — Revisão editorial (linguagem ao paciente)

- [ ] **E1.** Textos em linguagem simples, sem jargão desnecessário
- [ ] **E2.** Sem adjetivos de qualidade clínica (“excelente”, “renomado”)
- [ ] **E3.** Sem linguagem de recomendação
- [ ] **E4.** Resumo responde: quem é, formação, especialização, atuação, pendências
- [ ] **E5.** Publicações: somente se houver; senão, texto padrão de “ainda não levantadas”

## F — Publicação

- [ ] **F1.** Checklist A–E 100% completo
- [ ] **F2.** Revisor identificado
- [ ] **F3.** Se Nível A: segundo revisor / curador sênior
- [ ] **F4.** Dossiê arquivado
- [ ] **F5.** Data de publicação e data de próxima revisão (180 dias) registradas
- [ ] **F6.** Decisão: **PUBLICAR** / **MANTER OCULTO**

## G — Pós-publicação

- [ ] **G1.** Perfil visível no ambiente correto (piloto ES)
- [ ] **G2.** Amostragem de QA: outro operador confere 10% dos campos (reproducibilidade)
- [ ] **G3.** Se QA falhar: voltar para revisão (Capítulo 8.3)

---

## Critério final de sucesso do protocolo

Ao terminar a leitura deste documento, qualquer novo colaborador deve saber:

| Pergunta | Resposta encontrável em |
|----------|-------------------------|
| **Quem entra?** | Capítulos 2, 3 e checklist A |
| **Quem não entra?** | Capítulo 3 (critérios de inelegibilidade) e Nível C |
| **Por quê?** | Capítulos 4–7 (formação, fontes, verificação) |
| **Quando publica?** | Capítulo 8 + checklist F |
| **Quando remove?** | Capítulo 9 |
| **Quem decide?** | Capítulo 10 |
| **O que nunca fazer?** | Capítulo 11 |

Sem precisar conversar com ninguém.

---

## Controle de versão

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-07-22 | Versão inicial — ES, ortopedia e neurocirurgia |

**Próxima revisão programada:** após primeiro ciclo completo de catalogação estadual ou 90 dias, o que ocorrer primeiro.

---

*Documento canônico da AliCIA. Em caso de conflito entre este protocolo e qualquer outro material operacional, prevalece este documento.*
