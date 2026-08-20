# OPS-G4 — Auditoria visual e operacional read-only do Admin e da Rede Profissional

Data/hora da medição: 13/08/2026, aproximadamente 15:21–15:33 BRT  
Ambiente: Production (`aliviar-2-0.vercel.app`)  
Ator visualmente confirmado: Administrador  
Rotas anonimizadas: `/admin`, `/admin/profissionais`, `/admin/profissionais/[PROF]`  
Registro examinado: perfil explicitamente marcado como DEMO, inativo e não publicado.  
Modo: exclusivamente read-only. Nenhum campo foi preenchido/alterado; nenhum salvamento, ativação, publicação, upload, retirada ou exclusão foi acionado.

## Resumo executivo

**FATO VISUALMENTE MEDIDO:** a lista contém 9 profissionais: 6 DEMO inativos/não publicados e 3 ativos/publicados. A lista não mostra área, completude, protocolo, evidência ou divergência; a única ação é “Editar”.

**FATO VISUALMENTE MEDIDO:** o detalhe DEMO concentra oito formulários, 153 campos e duas trilhas diferentes:

- Protocolo da Prática Profissional: **0/29 respondidas**, explicitamente autodeclaração não verificada.
- Mapa do Profissional: **23/29 tratados**, explicitamente “o que a operação verificou”, com estados Confirmado/Não confirmado/Não informado e observação opcional.

Os 29 conceitos do Mapa usam identificadores canônicos estáveis e correspondem aos conceitos vistos na paciente/Mesa. Entretanto, não há fonte, data, validade, revisão, confiança, responsável ou evidência vinculada por conceito. Assim, a UI permite visualmente marcar “Confirmado” com mera observação opcional, enquanto OPS-G2/OPS-G3 exibiram Base 0/29 e categorias “Ainda não foi possível confirmar”, mas compatibilidades conclusivas.

**CONCLUSÃO:** existe simetria nominal e por identidade no Mapa, mas a origem e a regra de satisfação não são auditáveis pela interface. O Protocolo e o Mapa funcionam como duas entradas paralelas; a relação entre ambos e `CatalogoOpcao.satisfiedBy` não é apresentada.

## A. Corrigir agora

| ID | Sev. | Natureza | Rota / viewport | Fato visualmente medido | Consequência | Menor correção possível | Risco |
|---|---|---|---|---|---|---|---|
| OPS-G4-01 | crítica | evidência/Método | Detalhe; todos | Protocolo 0/29 e Mapa 23/29 coexistem; “Confirmado” exige apenas rádio + observação opcional, sem evidência vinculada. | Compatibilidade pode nascer de afirmação manual sem sustentação auditável. | Exigir origem tipada por conceito (protocolo, documento, fonte oficial, entrevista, juízo), referência e autor; “Confirmado” sem evidência deve ficar explicitamente “autodeclarado/não verificado”. | Migração dos 23 estados existentes e Cases emitidos. |
| OPS-G4-02 | alta | publicação/erro | Publicação; todos | “Publicar” está visualmente habilitado (`disabled=false`) apesar de 4 pendências e aviso “DEMO nunca é publicado”. | A affordance contradiz a regra e convida a uma tentativa perigosa; o bloqueio real fica não observável. | Desabilitar o controle e associar `aria-describedby` às pendências; validar a mesma regra no servidor. | Fluxos de override administrativo. |
| OPS-G4-03 | alta | fronteira/Método | Detalhe; todos | O Protocolo declara autodeclaração não verificada; o Mapa declara “operação verificou”, mas não mostra como uma resposta vira estado nem se há revisão humana. | Dois motores aparentes podem divergir sem explicação. | Mostrar, em cada conceito, “derivado de Qx”, transformação aplicada e confirmação humana; não criar motor novo, expor `satisfiedBy` e a decisão humana existentes. | Versionamento do catálogo e respostas antigas. |
| OPS-G4-04 | alta | origem | Detalhe/Mapa; todos | Nenhum campo ou texto por conceito exibe fonte, data, validade, revisão, confiança ou responsável; “evidência” nem aparece na página. | Não é possível auditar por que a Mesa/paciente recebeu linguagem conclusiva. | Adicionar painel de proveniência por conceito e impedir linguagem conclusiva sem origem compatível. | Volume de dados e permissões de fonte. |
| OPS-G4-05 | alta | elegibilidade | Lista e detalhe; todos | Lista mostra ativo/publicado, mas não completude, área, evidência, protocolo, divergência ou Connection; detalhe explica só pré-condições de publicação. | Admin não consegue saber na lista quem está realmente pronto para novas Curadorias. | Colunas/badges de completude canônica, verificação, protocolo, divergência e elegibilidade efetiva, com próximo ato. | Cálculo de elegibilidade em escala. |

## B. Simplificar no próximo corte

| ID | Sev. | Natureza | Rota / viewport | Fato medido | Consequência | Menor correção | Risco |
|---|---|---|---|---|---|---|---|
| OPS-G4-06 | média | responsividade | Lista; 390×844 | `scrollWidth=554` para viewport de 390; tabela cria overflow horizontal e esconde Status/Publicação/Ação. | No mobile, o ato e o estado decisivos ficam fora da tela. | Cards responsivos ou colunas prioritárias fixas; evitar tabela mais larga que viewport. | Densidade e ordenação. |
| OPS-G4-07 | média | carga cognitiva | Detalhe; todos | Página tem 10.651 px no desktop e 13.693 px no mobile, 329–331 alvos e 281 abaixo de 44 px. | Alta chance de erro, perda de contexto e toque impreciso. | Navegação lateral/accordions por etapa, resumo persistente e alvos efetivos ≥44 px. | Preservação de foco/rascunho. |
| OPS-G4-08 | média | operação | Lista e detalhe | “Novo profissional” é destacado; consulta usa “Editar”; não há modo leitura nem distinção visual entre consultar e escrever. | Auditoria e manutenção cotidiana entram imediatamente em superfície mutável. | Criar “Ver” read-only e reservar “Editar” para intenção explícita. | Rotas, permissões e histórico. |
| OPS-G4-09 | média | duplicação | Detalhe | O Admin percorre cadastro, registro, área, documento, protocolo e Mapa em 8 forms/salvamentos; protocolo e Mapa repetem 29 conceitos. | Preenchimento duplicado e divergência entre autodeclaração e verificação. | Gerar proposta do Mapa a partir do Protocolo via identidade canônica, exigindo revisão humana e evidência, sem copiar silenciosamente. | Não pré-preencher julgamento. |
| OPS-G4-10 | média | semântica | Mapa | A copy distingue “Ainda não avaliado” de “Não informado”, mas não explica “Não confirmado”; não há “não se aplica”, “incompatível” ou “compatível”. | “Não confirmado” pode significar ausência real ou falta de prova. | Definir cada estado junto ao controle; separar fato ausente de evidência insuficiente. | Conversão dos estados atuais. |
| OPS-G4-11 | média | autoria | Protocolo | A copy fala com “você/sua prática”, mas a tela pertence ao Administrador e não identifica se responde o médico ou um Admin em nome dele. | A origem da autodeclaração fica ambígua. | Registrar declarante, coletor, data e método (autopreenchimento, entrevista, documento). | Privacidade e auditoria. |
| OPS-G4-12 | baixa | acessibilidade | Detalhe; desktop | Todos os 153 campos têm label/ARIA computável; porém, foco do Protocolo usa anel reforçado e o Mapa cai no outline padrão do navegador. | Experiência de teclado inconsistente numa página longa. | Unificar `:focus-visible` e manter agrupamentos `fieldset/legend`. | Contraste e temas. |

## C. Preservar

- **FATO VISUALMENTE MEDIDO:** DEMO é identificado e a copy diz que nunca pode ser publicado.
- **FATO VISUALMENTE MEDIDO:** Publicação explica CRM verificado, área verificada e ausência de divergência crítica, com caminhos de correção.
- **FATO VISUALMENTE MEDIDO:** Área de Atuação preserva texto original, tags normalizadas, fonte e verificação condicionada à fonte.
- **FATO VISUALMENTE MEDIDO:** Protocolo evita ranking e explicita autodeclaração não verificada.
- **FATO VISUALMENTE MEDIDO:** Mapa usa 29 IDs canônicos estáveis, sem nota/peso, e distingue item não tratado de falta de informação.
- **FATO VISUALMENTE MEDIDO:** Q1–Q15, Q21–Q22, Q26 e partes de Q28–Q29 usam opções estruturadas; texto livre permanece onde contexto profissional é necessário.
- **FATO VISUALMENTE MEDIDO:** todos os campos examinados têm label ou nome acessível computável; há `role=status` para pendências e `aria-live=polite` para completude do Mapa.

## D. Decisão do Guardião da Curadoria 2.0

1. Definir qual estado do Mapa pode satisfazer `CatalogoOpcao.satisfiedBy`: confirmado documentalmente, autodeclarado, juízo humano ou combinação versionada.
2. Definir se o Mapa é projeção revisável do Protocolo ou registro independente. A UI atual permite divergência total.
3. Definir requisitos mínimos de evidência para linguagem “alta/média compatibilidade” e para publicação/elegibilidade.
4. Definir semântica exata de “Não confirmado”: ausência comprovada, prova insuficiente ou negação do profissional.
5. Definir atos de ciclo de vida: desativar, despublicar, retirar da Rede, arquivar e excluir, com preservação histórica e Connections.

## E. Não observável

- Detalhe de um profissional ativo/publicado: por segurança, somente DEMO foi aberto.
- Desativar, despublicar, retirar, arquivar e excluir: nenhum controle/mensagem apareceu no DEMO inativo; não foi aberto perfil real para fabricar evidência.
- Impacto em Connections e Cases históricos: “Connection” não aparece na lista/detalhe DEMO.
- Áreas de competência: nenhuma seção ou ocorrência de “competência” foi exibida.
- Evidências de prática como entidades: não há seção, vínculo, revisão, validade ou responsável visível; documentos não foram abertos.
- Histórico/auditoria do profissional: não há trilha de alterações visível.
- Regra interna de satisfação, execução de `CatalogoOpcao.satisfiedBy` e eventual comparação por ID/rótulo.
- Blocklist, divergências críticas detalhadas e preview do que a paciente verá.
- Confirmação de que o servidor realmente rejeita “Publicar” com pendências; o botão não foi acionado.

## Inventário operacional do detalhe DEMO

| Seção | Campos/estrutura | Obrigatoriedade visível | Evidência/origem | Consumidor aparente |
|---|---|---|---|---|
| Identidade | nome, identificador, CRM/UF, instituição, resumo | CRM necessário para publicar | Admin; sem autoria exibida | Lista/publicação |
| Verificação do registro | situação + fonte | fonte implícita para verificação | fonte oficial sugerida | Publicação/elegibilidade |
| Área de Atuação | texto original, tags, fonte, checkbox verificado | fonte exigida para verificar | site/entrevista sugeridos | Rede elegível/filtro |
| Documentos | upload | não indicado | documento global, sem conceito vinculado | verificação não explícita |
| Protocolo | 29 perguntas em 5 grupos | incompletude permitida; submit bloqueado em 0/29 | autodeclaração não verificada | Mapa/Mesa, relação não exposta |
| Mapa | 29 conceitos × 3 estados + observação opcional | completude legítima, não obrigatória | “operação verificou”, sem fonte por item | cruzamento da Mesa |
| Publicação/status | ativar, publicar, pendências | 4 pendências no DEMO | regras gerais visíveis | entrada na Rede |

Textos livres indispensáveis: endereços, formação específica, condições/procedimentos, limites de atuação, vínculos, áreas atuais e notas de contexto. Textos livres que não deveriam determinar satisfação sozinhos: resumo profissional, observações do Mapa, tags digitadas e redações genéricas sem fonte.

## Protocolo: cobertura visível

| Grupo | Perguntas | Correspondência canônica |
|---|---:|---|
| Acesso | Q1–Q4 | modalidade, disponibilidade, prazo, local |
| Continuidade | Q5–Q9 | retornos, pós-procedimento, equipe, coordenação, canais |
| Modelo | Q10–Q15 | comunicação, decisão, acompanhantes, alternativas, restrições, notícia difícil |
| Prática e trajetória | Q16–Q27 | formação, experiência, limites, trajetória, academia, áreas |
| Viabilidade | Q28–Q29 | cobertura/convênio, custo/pagamento |

Pergunta central: **o protocolo é amplamente simétrico às 29 necessidades, não apenas genérico**. O problema não é cobertura nominal; é proveniência e transformação: a UI não mostra como respostas autodeclaradas viram estados verificados e satisfação.

## Matriz paciente × profissional

Em todas as linhas, a necessidade do lado paciente foi observada nas OPS-G2/G3; o Admin oferece a pergunta indicada e um Mapa com ID canônico. A coluna “Regra” não é exibida visualmente.

| Necessidade/conceito | ID canônico do Mapa | Campo profissional | Evidência/estado visível | Regra / julgamento |
|---|---|---|---|---|
| Graduação | `FORMACAO_GRADUACAO` | Q16 | 3 estados + observação; sem fonte | `satisfiedBy` não visível; revisão humana não identificada |
| Residência | `FORMACAO_RESIDENCIA` | Q17 | idem | idem |
| Especialização | `FORMACAO_ESPECIALIZACAO` | Q18 | idem | idem |
| Fellowship | `FORMACAO_FELLOWSHIP` | Q19 | idem | idem |
| Formação complementar | `FORMACAO_COMPLEMENTAR` | Q20 | idem | idem |
| Tempo de prática | `EXPERIENCIA_TEMPO_DE_PRATICA` | Q21 estruturada | idem | idem |
| Volume | `EXPERIENCIA_VOLUME_DE_ATUACAO` | Q22 estruturada | idem | idem |
| Experiência no tipo de caso | `EXPERIENCIA_NO_TIPO_DE_CASO` | Q23 livre | idem | idem |
| Limites de atuação | `PRATICA_LIMITES_DE_ATUACAO` | Q24 livre + encaminhamento | DEMO ainda não avaliado | idem |
| Trajetória institucional | `HISTORICO_TRAJETORIA_INSTITUCIONAL` | Q25 livre | 3 estados + observação | idem |
| Atividade acadêmica | `HISTORICO_ATIVIDADE_ACADEMICA` | Q26 estruturada | idem | idem |
| Áreas de atuação | `HISTORICO_AREAS_DE_ATUACAO` | Q27 livre | DEMO ainda não avaliado | idem |
| Modalidade | `ACESSO_MODALIDADE` | Q1 estruturada | 3 estados + observação | idem |
| Disponibilidade | `ACESSO_DISPONIBILIDADE` | Q2 estruturada | idem | idem |
| Prazo | `ACESSO_PRAZO_PARA_CONSULTA` | Q3 estruturada | idem | idem |
| Local | `ACESSO_LOCAL_DE_ATENDIMENTO` | Q4 endereço/tipo | idem | idem |
| Retornos | `CONTINUIDADE_RETORNOS` | Q5 estruturada | idem | idem |
| Pós-procedimento | `CONTINUIDADE_POS_PROCEDIMENTO` | Q6 estruturada | idem | idem |
| Equipe | `CONTINUIDADE_EQUIPE_DE_APOIO` | Q7 estruturada | idem | idem |
| Coordenação | `CONTINUIDADE_COORDENACAO` | Q8 estruturada | idem | idem |
| Canais | `CONTINUIDADE_CANAIS` | Q9 estruturada | DEMO ainda não avaliado | idem |
| Como explica | `MODELO_COMUNICACAO` | Q10 estruturada | 3 estados + observação | idem |
| Como decide | `MODELO_DECISAO_COMPARTILHADA` | Q11 estruturada | idem | idem |
| Acompanhantes | `MODELO_PARTICIPACAO_FAMILIAR` | Q12 estruturada | idem | idem |
| Alternativas | `MODELO_ALTERNATIVAS` | Q13 estruturada | idem | idem |
| Recusas/restrições | `MODELO_PREFERENCIAS_E_RESTRICOES` | Q14 estruturada | idem | idem |
| Notícias difíceis | `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` | Q15 estruturada | DEMO ainda não avaliado | idem |
| Cobertura/convênio | `VIABILIDADE_COBERTURA_E_CONVENIO` | Q28 mista | DEMO ainda não avaliado; fora do Motor | barreira objetiva; regra não exibida |
| Custo/pagamento | `VIABILIDADE_CUSTO_E_PAGAMENTO` | Q29 mista | DEMO ainda não avaliado; fora do Motor | proibido ranquear por preço; regra não exibida |

Não foi encontrado conceito paciente sem campo profissional entre os 29. Também não foi encontrado campo canônico principal sem equivalente paciente. A assimetria observada é de **estado e evidência**, não de cobertura do catálogo.

## Facilidade operacional

Para um DEMO vazio, o caminho visual envolve pelo menos: cadastro → verificação de CRM → área/fonte/verificação → documento opcional → 29 respostas → revisão/submissão → tratamento de 29 conceitos no Mapa → publicação. A página não fornece estimativa de passos nem preview, e a lista não mostra progresso. Há orientação local boa, mas o próximo ato global depende de percorrer uma página de até 13,7 mil px.

## Responsividade

| Superfície | 1440×900 | 768×1024 | 390×844 | Overflow horizontal |
|---|---:|---:|---:|---|
| Lista | 968 px | 1.024 px | 1.060 px | **sim no mobile: 554 px** |
| Detalhe completo | 10.651 px | 10.767 px | 13.693 px | não |
| Publicação/status | medido | medido | medido | não |
| Protocolo | medido | medido | medido | não |
| Mapa/evidências | medido | medido | medido | não |

Competências e retirada não possuíam superfícies observáveis; não foram substituídas por inferência.

## Console e rede

- **FATO VISUALMENTE MEDIDO:** zero warnings/erros de console.
- **FATO VISUALMENTE MEDIDO:** nenhum HTTP 4xx/5xx capturado.
- **FATO VISUALMENTE MEDIDO:** três requests abortadas durante navegação, sem erro visível.
- **FATO VISUALMENTE MEDIDO:** a rota de detalhe foi solicitada 10 vezes no buffer observado; a causa não é determinável visualmente e pode incluir prefetch/revalidação.
- **LIMITE INSTRUMENTAL:** o buffer indicou truncamento; payloads não foram inspecionados.

## Evidências visuais seguras

Todas: Production, Administrador, 13/08/2026; nomes, identificadores e valores foram cobertos localmente.

| Arquivo | Rota | Viewport | Prova |
|---|---|---|---|
| `evidencia-lista-1440x900.png` | `/admin/profissionais` | 1440×900 | Estados e única ação “Editar”. |
| `evidencia-lista-overflow-390x844.png` | `/admin/profissionais` | 390×844 | Overflow horizontal e colunas ocultas. |
| `evidencia-detalhe-390x844.png` | `/admin/profissionais/[PROF]` | 390×844 | Superfície imediatamente editável e status DEMO. |
| `evidencia-publicacao-390x844.png` | mesma | 390×844 | Pendências e condições de publicação. |
| `evidencia-protocolo-390x844.png` | mesma | 390×844 | 0/29, autodeclaração e opções estruturadas. |
| `evidencia-mapa-390x844.png` | mesma | 390×844 | 23/29, estados manuais e observação opcional. |

## Veredito

**OPS-G4 ADMIN/REDE — AUDITORIA VISUAL E OPERACIONAL READ-ONLY CONCLUÍDA, ORIGEM DOS DADOS PROFISSIONAIS E SIMETRIA COM AS NECESSIDADES AVALIADAS, ACHADOS PRIORIZADOS E ZERO MUTAÇÃO.**

Superfícies/viewports medidos: lista, detalhe, publicação/status, protocolo e Mapa/evidências em 1440×900, 768×1024 e 390×844. Competências, Connections, histórico, retirada/desativação/despublicação/arquivamento/exclusão não estavam expostos no DEMO seguro e foram classificados como não observáveis.
