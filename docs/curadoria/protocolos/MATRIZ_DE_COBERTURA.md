# Matriz de Cobertura — 28 conceitos × 5 usos

> Prova de completude dos Protocolos Oficiais: **nenhum conceito sem cobertura, nenhuma pergunta sem conceito.**
> Pessoa: `P1..P16` (14 perguntas + 2 declarações do Curador). Profissional: `Q1..Q28`. Curador: sempre presente — é ele quem conclui. Motor: direto / indireto / nunca. Relatório: A = frase automática permitida · V = só com validação do Curador · — = nenhuma frase.

| # | Conceito | Pessoa | Profissional | Curador | Motor | Relatório |
|---|---|---|---|---|---|---|
| 1 | `ACESSO_MODALIDADE` | P1 | Q1 | ✓ | direto | A |
| 2 | `ACESSO_LOCAL_DE_ATENDIMENTO` | P2 | Q2 | ✓ | direto (cidade/UF) | A |
| 3 | `ACESSO_DISPONIBILIDADE` | P3 | Q3 | ✓ | direto | A |
| 4 | `ACESSO_PRAZO_PARA_CONSULTA` | P4 | Q4 | ✓ | direto | A |
| 5 | `CONTINUIDADE_RETORNOS` | P5 | Q5 | ✓ | direto | A |
| 6 | `CONTINUIDADE_CANAIS` | P6 | Q6 | ✓ | direto | A |
| 7 | `CONTINUIDADE_POS_PROCEDIMENTO` | P8 · Curador | Q7 | ✓ | indireto | V |
| 8 | `CONTINUIDADE_EQUIPE_DE_APOIO` | P9 · Curador | Q8 | ✓ | direto (por tipo) | A |
| 9 | `CONTINUIDADE_COORDENACAO` | P7 | Q9 | ✓ | direto | A |
| 10 | `MODELO_COMUNICACAO` | P10 | Q10 | ✓ | direto (por conduta) | A |
| 11 | `MODELO_DECISAO_COMPARTILHADA` | P11 | Q11 | ✓ | **indireto — nunca automático** | V |
| 12 | `MODELO_ALTERNATIVAS` | P12 | Q12 | ✓ | direto | A |
| 13 | `MODELO_PARTICIPACAO_FAMILIAR` | P13 | Q13 | ✓ | direto | A |
| 14 | `MODELO_PREFERENCIAS_E_RESTRICOES` | P14 (texto guiado) | Q14 | ✓ | **nunca** | — |
| 15 | `FORMACAO_GRADUACAO` | — (sem lado) | Q15 | ✓ | indireto | A (fato) |
| 16 | `FORMACAO_RESIDENCIA` | — | Q16 | ✓ | indireto | A (fato) |
| 17 | `FORMACAO_ESPECIALIZACAO` | — | Q17 | ✓ | indireto | A (fato) |
| 18 | `FORMACAO_FELLOWSHIP` | — | Q18 | ✓ | indireto | A (fato) |
| 19 | `FORMACAO_COMPLEMENTAR` | — | Q19 | ✓ | indireto | A (fato) |
| 20 | `EXPERIENCIA_TEMPO_DE_PRATICA` | — | Q20 | ✓ | indireto | A (faixa) |
| 21 | `EXPERIENCIA_NO_TIPO_DE_CASO` | — | Q21 | ✓ | indireto | V |
| 22 | `EXPERIENCIA_VOLUME_DE_ATUACAO` | — | Q22 | ✓ | indireto | A (frequência, sem mérito) |
| 23 | `PRATICA_LIMITES_DE_ATUACAO` | — | Q23 | ✓ | indireto | A |
| 24 | `HISTORICO_TRAJETORIA_INSTITUCIONAL` | — | Q24 | ✓ | indireto | A (fato) |
| 25 | `HISTORICO_ATIVIDADE_ACADEMICA` | — | Q25 | ✓ | indireto | A (fato) |
| 26 | `HISTORICO_AREAS_DE_ATUACAO` | — | Q26 | ✓ | indireto (gate) | A (fato) |
| 27 | `VIABILIDADE_COBERTURA_E_CONVENIO` | P15 | Q27 | ✓ | **nunca** | V |
| 28 | `VIABILIDADE_CUSTO_E_PAGAMENTO` | P16 | Q28 | ✓ | **nunca** | V |

## Conferência

- **28/28 com lado do profissional** (Q1–Q28, bijeção).
- **16/28 com lado da pessoa**: 14 perguntas diretas/traduzidas (P1–P7, P10–P16) + 2 declaradas pelo Curador (P8, P9). Os 12 restantes (Eixo 4) não têm lado por definição do Método — ausência justificada, não lacuna.
- **28/28 usados pelo Curador** — ele é o destino de tudo.
- **Motor:** 11 diretos · 14 indiretos · 3 nunca (`MODELO_PREFERENCIAS_E_RESTRICOES`, `VIABILIDADE_*`). As 15 células permanecem intocadas.
- **Relatório:** 22 com frase automática possível · 5 só com validação (`CONTINUIDADE_POS_PROCEDIMENTO`, `MODELO_DECISAO_COMPARTILHADA`, `EXPERIENCIA_NO_TIPO_DE_CASO`, `VIABILIDADE_*`) · 1 sem frase (`MODELO_PREFERENCIAS_E_RESTRICOES`).
- **Nenhuma pergunta órfã:** toda P* e toda Q* aponta para exatamente um conceito da tabela.
