# Mapa dos Protocolos — os 28 conceitos, lado a lado

> Para cada conceito: quem tem lado, como o Curador usa, se o Motor entra, e o que o Relatório pode dizer. Perguntas: `P*` = PROTOCOLO_PESSOA · `Q*` = PROTOCOLO_PRATICA_PROFISSIONAL.

## Legenda de uso pelo Motor

- **direto** — o par (importância do Case × estado do profissional) entra nas 15 células
- **indireto** — a resposta estruturada sustenta a declaração humana que o Motor não faz (sinalizações fora da matriz; `criterion_declarations`)
- **nunca** — proibido por contrato (viabilidade; preferências/restrições)

## EIXO 1 — ACESSO AO CUIDADO

| Conceito | Pessoa | Profissional | Curador — como e quando | Motor | Relatório |
|---|---|---|---|---|---|
| `ACESSO_MODALIDADE` | **SIM** (P1) | **SIM** (Q1) | na Mesa, confere correspondência e condição; usa a sinalização de barreira quando essencial sem flexibilidade | direto + sinalização | *"Você procura remoto; a prática registrada inclui remoto"* |
| `ACESSO_LOCAL_DE_ATENDIMENTO` | **SIM** (P2) | **SIM** (Q2) | cruza cidade/UF; pondera deslocamento real (transporte, estado clínico) — juízo dele | direto (cidade/UF); deslocamento **indireto** | *"Atende em [cidade]; você consegue se deslocar até [faixa]"* |
| `ACESSO_DISPONIBILIDADE` | **SIM** (P3) | **SIM** (Q3) | interseção de janelas na Mesa; janela vazia = condição relevante a conversar | direto | *"Você precisa após as 18h; as janelas registradas são…"* |
| `ACESSO_PRAZO_PARA_CONSULTA` | **SIM** (P4) | **SIM** (Q4) | compara faixas; prazo maior que a necessidade → atenção antes da seleção | direto | *"O prazo habitual registrado é [faixa]"* |

## EIXO 2 — CONTINUIDADE DO CUIDADO

| Conceito | Pessoa | Profissional | Curador | Motor | Relatório |
|---|---|---|---|---|---|
| `CONTINUIDADE_RETORNOS` | **SIM** (P5) | **SIM** (Q5) | presença de conduta cruza; adequação da frequência ao quadro é juízo dele | direto (conduta); frequência indireto | *"O retorno costuma sair programado da própria consulta"* |
| `CONTINUIDADE_CANAIS` | **SIM** (P6) | **SIM** (Q6) | canal necessário × canal existente; `NAO_HA_CANAL` com necessidade essencial → condição relevante dita antes da entrega | direto | *"Entre consultas, o contato registrado é [canais]"* |
| `CONTINUIDADE_POS_PROCEDIMENTO` | **NÃO — declarado pelo Curador** (P8): a pessoa não sabe, antes do diagnóstico, se haverá procedimento | **SIM** (Q7) | projeta do quadro clínico; declara importância no Mapa; julga adequação | indireto | *"Após procedimento, a conduta registrada é [conduta], por [duração]"* |
| `CONTINUIDADE_EQUIPE_DE_APOIO` | **NÃO — declarado pelo Curador** (P9), traduzindo a história quando ela já revela | **SIM** (Q8) | tipo a tipo, nunca por contagem | direto (por tipo) | *"A equipe registrada inclui [tipos]"* |
| `CONTINUIDADE_COORDENACAO` | **SIM** (P7) | **SIM** (Q9) | quem já acompanha a pessoa × condutas de coordenação | direto | *"Na coordenação, a conduta registrada é [condutas]"* |

## EIXO 3 — MODELO DE ATENDIMENTO

| Conceito | Pessoa | Profissional | Curador | Motor | Relatório |
|---|---|---|---|---|---|
| `MODELO_COMUNICACAO` | **SIM** (P10) | **SIM** (Q10) | conduta a conduta; jamais "comunicação boa" | direto (por conduta) | *"Você precisa de explicação sem termos técnicos; as práticas registradas incluem…"* |
| `MODELO_DECISAO_COMPARTILHADA` | **SIM** (P11) | **SIM** (Q11) | **leitura obrigatoriamente dele**: a mesma conduta do profissional serve a uma pessoa e colide com outra | **indireto — nunca automático** | frase só validada pelo Curador |
| `MODELO_ALTERNATIVAS` | **SIM** (P12) | **SIM** (Q12) | o que ela precisa saber × o que ele costuma apresentar | direto | *"Costuma apresentar a opção de não intervir, que você pediu para conhecer"* |
| `MODELO_PARTICIPACAO_FAMILIAR` | **SIM** (P13) | **SIM** (Q13) | regra escrita: abertura ≠ inclusão obrigatória | direto | *"Acompanhantes mediante autorização — compatível com seu desejo de privacidade"* |
| `MODELO_PREFERENCIAS_E_RESTRICOES` | **SIM** (P14 — texto guiado) | **SIM** (Q14) | único conceito com texto da pessoa; ele estrutura, conversa e conclui | **nunca** | nenhuma frase automática |

## EIXO 4 — PRÁTICA E TRAJETÓRIA (sem lado da pessoa — ninguém declara preferência por fellowship; o Case declara importância, o Curador julga relevância)

| Conceito | Pessoa | Profissional | Curador | Motor | Relatório |
|---|---|---|---|---|---|
| `FORMACAO_GRADUACAO` | NÃO | **SIM** (Q15) | dossiê técnico → declaração por Case com evidência | indireto | fato com proveniência: *"Graduação em [instituição], verificada em [data]"* |
| `FORMACAO_RESIDENCIA` | NÃO | **SIM** (Q16) | idem | indireto | idem |
| `FORMACAO_ESPECIALIZACAO` | NÃO | **SIM** (Q17) | idem | indireto | idem |
| `FORMACAO_FELLOWSHIP` | NÃO | **SIM** (Q18) | idem; verificação redobrada | indireto | idem |
| `FORMACAO_COMPLEMENTAR` | NÃO | **SIM** (Q19) | relevância para ESTE caso é juízo dele | indireto | idem |
| `EXPERIENCIA_TEMPO_DE_PRATICA` | NÃO | **SIM** (Q20) | faixa como fato; nunca "muito experiente" | indireto | *"Atua há [faixa] na especialidade"* |
| `EXPERIENCIA_NO_TIPO_DE_CASO` | NÃO | **SIM** (Q21) | o coração do julgamento técnico por Case | indireto | fato; adequação só pela pena dele |
| `EXPERIENCIA_VOLUME_DE_ATUACAO` | NÃO | **SIM** (Q22) | fato de frequência; **volume nunca vira mérito** | indireto | *"Atende este tipo de caso [frequência]"* |
| `PRATICA_LIMITES_DE_ATUACAO` | NÃO | **SIM** (Q23) | primeiro filtro humano: o que ele não atende elimina esforço antes da espera | indireto | *"Não atende [situações]; encaminha com indicação"* |
| `HISTORICO_TRAJETORIA_INSTITUCIONAL` | NÃO | **SIM** (Q24) | contexto do dossiê | indireto | fato com proveniência |
| `HISTORICO_ATIVIDADE_ACADEMICA` | NÃO | **SIM** (Q25) | contexto; relevância é juízo | indireto | fato |
| `HISTORICO_AREAS_DE_ATUACAO` | NÃO | **SIM** (Q26) | gate de área vigente (declaração por Case, eliminação humana) | indireto (gate) | *"Área de atuação verificada em [data]"* |

## EIXO 5 — VIABILIDADE DE ACESSO (fora da matriz do Motor, por contrato)

| Conceito | Pessoa | Profissional | Curador | Motor | Relatório |
|---|---|---|---|---|---|
| `VIABILIDADE_COBERTURA_E_CONVENIO` | **SIM** (P15) | **SIM** (Q27) | vê sinalização de barreira/condição/pendência; conversa; conclui | **nunca** | frase factual, só com validação dele |
| `VIABILIDADE_CUSTO_E_PAGAMENTO` | **SIM** (P16) | **SIM** (Q28) | idem; *"acima do limite que ela reconheceu como viável"* sinaliza, nunca elimina | **nunca** | idem; proibido comparar preços |

---

# Registro da auditoria — os 7 testes

Cada pergunta dos dois protocolos foi submetida aos 7 testes da gramática. Resultados que merecem registro:

**Eliminadas na auditoria (reprovaram no Teste 7 — o Método não recomendaria pior sem elas):**
- *"O que te deixa mais ansiosa nesse processo?"* (rascunho do bloco pessoa) — relevante para acolhimento, já coberto pela jornada de Acolhimento vigente; não alimenta conceito.
- *"Há quanto tempo você sente isso?"* — pertence à história clínica, não ao Perfil do Case; duplicaria a Consulta Inicial.
- *"Você indicaria seu último médico?"* — não é conceito do catálogo; produziria opinião, não evidência.
- Pergunta separada de "adaptação de linguagem" ao profissional — já é opção de Q10; pergunta própria seria redundância (Teste 3).
- *"Quantos pacientes você atende por mês?"* — número exato não melhora o casamento além da faixa de Q22 e convida a leitura de volume como mérito (Testes 2 e 5).

**Decisões de forma registradas:**
- P8/P9 não são perguntas à pessoa por decisão de Método (mapa de perguntas do Catálogo): projeção clínica é do Curador.
- P14 é o único texto guiado do lado da pessoa; Q14 permanece múltipla escolha.
- Nenhuma pergunta do Eixo 4 ao profissional é comportamental-situacional porque coleta **fatos datados**, não condutas — a gramática de situação vale para condutas (Partes A–C e E).

**Tempo estimado, conceito a conceito:** pessoa ≈ 9–11 min (14 perguntas, mediana 40s cada, incluindo tradução); profissional ≈ 18–22 min (16 de conduta/viabilidade a ~45s + 12 fatos estruturados a ~30s, coletáveis em parte por documento prévio).
