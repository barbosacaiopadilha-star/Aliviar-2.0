# Shadow Launch da Aliviar — Plano Operacional

Documento de planejamento operacional, não normativo. Não altera código, banco de dados, protocolos do ACE ou especificações. É uma simulação de um dia de operação, pensada do ponto de vista de Diretor de Operações — o que quebra, o que gera atrito, o que falta, antes de qualquer paciente real.

## 0. Correção de premissa (achado antes mesmo de simular)

O enunciado da missão presume a jornada `Landing → Cadastro → Sua História → ...`. **Essa jornada não existe hoje como fluxo público.** A rota pública `/sua-historia` diz, literalmente, ao visitante:

> *"Para contar sua história você precisa já ter uma conta na Aliviar — se ainda não tem, entre em contato com a nossa equipe."*

Não existe self-signup. Contas de paciente só são criadas pelo Admin (`admin/pacientes/novo`), nunca pelo próprio paciente. A jornada real é:

**Landing → Contato (fora do sistema — telefone/WhatsApp/e-mail) → Admin cria a conta → Paciente recebe credenciais → Login → Sua História → Caso → ACE → Human Review → Entrega → Portal do Paciente.**

Isso não é um bug — é uma escolha deliberada (curadoria assistida, nunca self-service anônimo) — mas é um ponto operacional crítico para o Shadow Launch: **o gargalo inicial é humano, não o produto**, e nenhuma das 5 personas abaixo "se cadastra" sozinha — cada uma pressupõe um primeiro contato humano já feito pela equipe.

---

## 1. Pacientes sintéticos (5, extremamente diferentes)

Campos usados são exatamente os que o wizard "Sua História" captura hoje: `paraQuem`, `motivo`, `historia`, `informacoesImportantes`, `preferenciaModalidade` (todos opcionais no schema atual — o que já é, por si só, um achado de risco, ver seção 4).

### P1 — Marina, 34 anos
- **paraQuem**: para mim
- **motivo**: "Ansiedade que piorou nas últimas semanas, relacionada ao trabalho."
- **historia**: relato objetivo, decisão e objetivo claros — quer conversar com um psicólogo, sem necessidade de acompanhamento estruturado.
- **informacoesImportantes**: (vazio)
- **preferenciaModalidade**: online
- **Perfil**: caso "limpo" — espelha o cenário que já vimos passar consistentemente no Golden Set (P002/P003/P004).

### P2 — Roberto, 58 anos, sobre o próprio pai
- **paraQuem**: para outra pessoa
- **motivo**: "Meu pai está com dores no joelho há meses e não sabemos se precisa de cirurgia."
- **historia**: menciona que o pai tem mobilidade reduzida e prefere não se deslocar muito.
- **informacoesImportantes**: "Ele tem dificuldade de locomoção, presencial só se for perto de casa."
- **preferenciaModalidade**: presencial
- **Perfil**: introduz uma restrição prática (mobilidade/localização) que **o sistema não tem onde guardar estruturadamente** — não existe campo de cidade/raio de atendimento em `professional_profiles` nem no wizard. Ver achado na seção 4.

### P3 — Juliana, 29 anos
- **paraQuem**: para mim
- **motivo**: "Já tentei de tudo e ninguém me ouve de verdade."
- **historia**: longa, emocionalmente carregada, menciona fisioterapia, medicação e exames prévios sem melhora; não tem uma decisão específica ainda, só quer ser compreendida antes de qualquer indicação.
- **informacoesImportantes**: "Já fui a muitos médicos, estou cansada de repetir minha história."
- **preferenciaModalidade**: tanto faz
- **Perfil**: espelha o "caso complexo" do P002 (`decision: null`) — testa se o CaseAudit/P004 tratam bem a ausência de decisão sem parecer que a "empurraram para trás" na fila.

### P4 — Carlos, 45 anos
- **paraQuem**: para mim
- **motivo**: "Preciso decidir se continuo o tratamento atual ou busco uma segunda opinião."
- **historia**: menciona uma viagem de trabalho em dois meses e que gostaria de resolver isso antes.
- **informacoesImportantes**: "Viajo a trabalho em breve e queria ter uma decisão antes disso."
- **preferenciaModalidade**: online
- **Perfil**: **é exatamente o cenário da CAL-003 em aberto** (prazo operacional vs. urgência clínica) — não uma coincidência, é deliberado: este paciente testa, na prática, a ambiguidade normativa que ainda não foi decidida. Se rodado hoje, o resultado de `urgency` é imprevisível entre execuções.

### P5 — Beatriz, 22 anos, sobre a irmã de 16 anos
- **paraQuem**: para outra pessoa
- **motivo**: "Minha irmã mais nova está muito ansiosa na escola e meus pais não sabem o que fazer."
- **historia**: menciona que a irmã é menor de idade, mora com os pais, e que ela (Beatriz) está ajudando a organizar a busca.
- **informacoesImportantes**: "Ela tem 16 anos, mora com nossos pais — não sei se preciso do consentimento deles."
- **preferenciaModalidade**: presencial
- **Perfil**: **caso genuinamente novo, fora de tudo que o ACE já foi auditado para lidar** — levanta uma pergunta real de governança/consentimento (quem autoriza o atendimento de um menor, quem é o titular da conta, quem assina a Curadoria) que nenhum protocolo P001–P010 trata hoje. Ver achado crítico na seção 4.

---

## 2. Profissionais sintéticos — Espírito Santo (5)

Campos reais de `professional_profiles`/`professional_competency_areas`. **Achado imediato**: a tabela não tem campo de cidade, modalidade ou preço — essas informações abaixo (cidade, "presencial/online") são **narrativas para a simulação**, não algo que o sistema hoje armazena estruturadamente. Isso por si só é um risco operacional para um Shadow Launch regional (ver checklist).

| | Dra. Camila Rocha | Dr. André Salles | Dra. Fernanda Lyra | Dr. Bruno Tavares | Dra. Patrícia Nogueira |
|---|---|---|---|---|---|
| Cidade (narrativa, não estruturada) | Vitória | Vila Velha | Vitória | Serra | Vitória |
| `domain` | saude_emocional_mental | saude_fisica | saude_emocional_mental | saude_fisica | saude_emocional_mental |
| `focus` | avaliacao | avaliacao | intervencao | esclarecimento | acompanhamento_continuo |
| `experience_level` | experiente | altamente_experiente | altamente_experiente | geral | experiente |
| `intake_approach` | ambos | avaliacao_inicial | aprofundamento_previo | conexao_direta | ambos |
| `offers_continuous_care` | true | false | true | false | true |
| `availability_window` | flexible | limited | unavailable_soon | flexible | flexible |
| `crm_uf` | — (psicóloga, CRP) | ES | ES | ES | — (psicóloga, CRP) |
| Especialização narrativa | Psicóloga, primeira escuta | Ortopedista | Psiquiatra | Clínico geral | Psicóloga infanto-juvenil |

Nenhum destes 5 perfis atende, hoje, a P5 (Beatriz/irmã menor) de forma estruturalmente diferenciada — o sistema não distingue "atende menor de idade" como competência ou requisito.

---

## 3. Simulação — cada paciente pela jornada completa

Jornada real (corrigida): **Contato humano → Admin cria conta → Login → Sua História → Caso (`NEW`) → `IN_REVIEW` → `READY_FOR_CURATION` → ACE (P001–P008) → `IN_CURATION`/`HUMAN_REVIEW` → Entrega (P010) → `DELIVERED` → Portal do Paciente.**

**P1 (Marina)** — fluxo mais raso possível: conta criada, história enviada, Caso avança sem atrito até `READY_FOR_CURATION`, ACE roda P001–P008 sem bloqueio (DecisionContext `conexao_direta`/`baixa`), Shortlist provavelmente `COMPOSED` com Dra. Camila entre os três (domínio/foco batem). Human Review: decisão simples, `APPROVE` esperado. **Sem atrito identificado** — é o "caminho feliz".

**P2 (Roberto, sobre o pai)** — o wizard nunca pergunta explicitamente "é para você ou para outra pessoa, e essa pessoa sabe/concorda?" além do campo `paraQuem`. A restrição de mobilidade/localização vai parar em `informacoesImportantes` (texto livre) — e como `professional_profiles` não tem campo de cidade, **nada no P006/P007 consegue filtrar ou avaliar essa restrição estruturalmente**. Ela cai em `constraintAlignment: INSUFFICIENT` (dado insuficiente para verificar, comportamento já documentado do P007) para todo profissional, sempre — não é um bug pontual, é uma lacuna estrutural do modelo de dados de Care Provider. O Curador Médico só vai saber da restrição de mobilidade lendo o texto livre do Caso manualmente, não pela CompatibilityMatrix.

**P3 (Juliana)** — decisão ausente aciona `BlockingIssue` (correto, determinístico, P003). Caso vai para `WAITING_FOR_INFORMATION`. **Ponto de atrito real**: a pergunta recomendada gerada é sobre "qual decisão específica você precisa tomar" — para alguém que já disse "estou cansada de repetir minha história", uma pergunta que devolve a ela a responsabilidade de "definir uma decisão" pode soar como o oposto de acolhimento (ver seção 5, "onde a experiência deixa de parecer acolhimento").

**P4 (Carlos)** — exatamente o cenário CAL-003 em aberto. Rodar isso hoje: `urgency` pode sair `nao_determinado`, `baixa` ou (segundo o exemplo antigo, ainda não corrigido) `media`, de forma instável entre execuções. Isso significa que **o mesmo paciente, no mesmo dia, poderia receber um CompatibilityMatrix com avaliação de `contextAlignment` diferente dependendo puramente de aleatoriedade do modelo** — um risco metodológico real e já documentado (`CALIBRATION_REPORT.md`), não hipotético.

**P5 (Beatriz, sobre a irmã menor)** — **acumula ambiguidades em cascata**: `paraQuem: para outra pessoa` não distingue "outra pessoa adulta que autorizou" de "um menor de idade sem conta própria". A conta seria criada em nome de quem — Beatriz, ou os pais? O Caso e a Curadoria final seriam endereçados a quem? Nenhum protocolo P001–P010 modela "responsável legal" ou "titular versus solicitante". Do ponto de vista de Diretor de Operações, **este é o caso que eu pausaria manualmente hoje, fora do sistema, até haver uma política clara** — não é um caso para simular até o fim, é um caso para escalar.

---

## 4. Achados consolidados

**Gargalos**: criação de conta 100% manual (Admin) — não escala além de um volume pequeno sem virar o próprio gargalo do Shadow Launch. Ausência de campo de localização/modalidade no perfil profissional — todo `constraintAlignment` sobre restrição prática cai em `INSUFFICIENT` sempre, nunca é realmente avaliado.

**Decisões humanas**: toda vez que o Caso entra em `WAITING_FOR_INFORMATION` (P3) alguém da equipe precisa decidir se contata o paciente ou aguarda; P5 exige uma decisão de política (não técnica) sobre atendimento a menores antes mesmo de entrar no pipeline.

**Pontos de atrito**: pergunta recomendada devolvendo "qual é a decisão" a um paciente que já verbalizou exaustão (P3); ausência de qualquer sinal ao paciente sobre "quanto tempo isso costuma levar" entre o envio da história e a entrega.

**Informações faltantes**: cidade/raio de atendimento e modalidade do profissional; consentimento/titularidade quando `paraQuem: para outra pessoa` envolve um menor; nenhum campo captura se o "outra pessoa" sabe que a busca está sendo feita.

**Mensagens ruins (candidatas a revisar)**: a frase de `/sua-historia` ("entre em contato com nossa equipe") não diz *como* entrar em contato (nenhum canal, telefone, e-mail, WhatsApp) — para quem chega direto nessa URL sem ter vindo de um contato prévio, é um beco sem saída.

**Riscos operacionais**: volume de criação manual de conta; ausência de SLA visível para o paciente entre etapas; P007 avaliando restrição prática como sempre insuficiente (silencioso, sem alarme).

**Riscos metodológicos**: CAL-001 (P010, negação de ranking, residual), CAL-003 (P004, urgência instável, sem decisão normativa) — ainda abertos, capazes de afetar um paciente real do Shadow Launch (P4 acima foi desenhado para cair em CAL-003). **CAL-002 (P003) foi fechado** desde a redação original desta seção: formalizado e implementado como Content Invariant (ADR-024, `docs/DECISIONS.md`) — uma restrição prática opcional classificada como bloqueio pelo modelo agora é rejeitada deterministicamente (`failureCode: CONTENT_INVARIANT_VIOLATION`, reexecução manual), nunca mais bloqueia silenciosamente um Caso pronto como `CASE_AUDIT_BLOCKED`. O risco de bloqueio indevido silencioso está fechado; o risco residual é apenas a necessidade de reexecução manual quando o modelo produzir essa resposta inválida.

**Riscos de UX**: tela de revisão do wizard (`revisao`) pode parecer burocrática se só listar campos de volta sem uma transição de tom; ausência de indicação de prazo/expectativa em qualquer etapa entre envio e entrega.

---

## 5. Perguntas específicas

**Quais informações um Curador Médico provavelmente sentirá falta?** Localização/raio de deslocamento e modalidade real do profissional (não existe hoje, nem para o Curador nem para o sistema); se o "outra pessoa" da busca sabe e concorda com o processo; contexto de convênio/orçamento (explicitamente fora de escopo do produto hoje, mas o Curador vai sentir falta na prática).

**Quais perguntas poderiam aumentar a qualidade da Curadoria?** Uma pergunta explícita sobre localização/preferência de deslocamento (hoje só aparece de forma incidental em texto livre, se o paciente mencionar); uma pergunta sobre se já existe um profissional/tratamento em andamento (relevante para P4, e hoje só aparece se o paciente mencionar espontaneamente).

**Quais perguntas deveriam ser removidas?** Nenhuma do wizard atual parece redundante — são poucas e já enxutas. O risco não é excesso de perguntas, é a pergunta *recomendada pelo P003* em cima de um caso já emocionalmente carregado (P3) — não uma pergunta do wizard, mas uma gerada pelo próprio ACE.

**Quais telas podem gerar insegurança ao paciente?** A ausência de qualquer indicação de prazo entre "Sua História" enviada e "Curadoria pronta" — sem isso, o silêncio do sistema pode ser lido como abandono, não como cuidado.

**Quais telas parecem burocráticas?** A tela de revisão (`revisao`) do wizard, se apresentar os campos de volta como uma lista de confirmação de formulário, sem nenhuma frase de transição humana.

**Onde a experiência deixa de parecer acolhimento?** No exato momento em que o P003 devolve uma pergunta genérica e estruturalmente correta ("qual decisão você precisa tomar?") para alguém que, na própria história, já disse estar cansada de ser perguntada — a regra está certa (Kernel, nunca inventar a resposta por ela), mas a *entrega* dessa regra ao paciente é onde a experiência corre o risco de soar clínica, não cuidadosa.

---

## CHECKLIST DE GO LIVE

### Produto
- [ ] Decidir e documentar como um visitante sem conta descobre o canal de contato (telefone/WhatsApp/e-mail) a partir da Landing e de `/sua-historia`.
- [ ] Avaliar se algum campo de localização/modalidade do profissional deveria existir antes do Shadow Launch regional (ES), mesmo que apenas como texto livre administrativo.

### Operação
- [ ] Definir SLA interno (mesmo que não exposto ao paciente ainda) entre criação de conta → Caso `DELIVERED`.
- [ ] Definir processo de escalonamento para casos como P5 (menor de idade / titularidade ambígua) — política antes de qualquer caso real desse tipo aparecer.
- [ ] Confirmar capacidade da equipe de criar contas manualmente no volume esperado do Shadow Launch.

### Curadoria
- [x] CAL-002 (P003) — fechado via Content Invariant (ADR-024): bloqueio indevido de Casos prontos agora é rejeitado deterministicamente, nunca mais silencioso. Pendente apenas: 3 execuções reais autorizadas do Golden Set como critério formal de aprovação (ver ADR-024, seção 8).
- [ ] Decidir a alternativa normativa da CAL-003 (P004, urgência×prazo) — hoje instável entre execuções idênticas.
- [ ] Avaliar se o Curador deveria ver o texto livre completo do Caso (onde restrições práticas como mobilidade aparecem) de forma mais destacada, já que a CompatibilityMatrix não as captura estruturalmente.

### Experiência
- [ ] Revisar o tom da tela de revisão (`revisao`) do wizard — evitar leitura de formulário burocrático.
- [ ] Adicionar alguma indicação de expectativa de prazo entre etapas, mesmo que genérica.
- [ ] Revisar como uma `RecommendedQuestion` de bloqueio é apresentada ao paciente em casos emocionalmente carregados (P3).

### Segurança
- [ ] Confirmar que nenhuma tela do Portal do Paciente expõe artefato interno do ACE (payload bruto, protocolo, score) — só a Curadoria final em linguagem humana.
- [ ] Confirmar RLS de `professional_profiles`/Casos para o cenário "para outra pessoa" (quem tem acesso ao Caso quando o titular não é quem preencheu a história).

### Observabilidade
- [ ] Confirmar que o Health Check do ACE (`admin/ace`) está sendo monitorado ativamente durante o Shadow Launch.
- [ ] Rodar `npm run test:golden` antes do primeiro Caso real do Shadow Launch, e registrar o resultado (ADR-022).

### Human Review
- [ ] Confirmar que o Curador sabe, na prática, o que fazer diante de `AMBIGUOUS_COMPOSITION`/`INSUFFICIENT_EVIDENCE` (Shortlist `BLOCKED`) — nenhum dos 5 profissionais sintéticos acima cobre todos os domínios/focos possíveis, então isso pode acontecer no Shadow Launch real.
- [ ] Ensaiar ao menos um `ADJUST` e um `REQUEST_MORE_INFORMATION` reais durante o Shadow Launch, não só `APPROVE`.

### Paciente
- [ ] Confirmar que a Curadoria entregue (P10) é legível por alguém sem vocabulário médico — testar com um dos 5 perfis sintéticos acima lendo a entrega final "a frio".
- [ ] Confirmar que o Portal do Paciente (`documentos`, `linha-do-tempo`, `perfil`) não fica vazio/confuso para um paciente cujo Caso ainda está em `WAITING_FOR_INFORMATION` (P3).

---

## 6. Extensão — simulação de uma semana completa

Estende a simulação de 1 dia (seções 1–5) com cenários que só aparecem ao longo do tempo — cada um testando um comportamento que a simulação de um dia não cobre.

**Dia 1–2 — Marina (caso simples)**: percorre a jornada inteira sem atrito, do login à entrega. Caminho feliz confirmado.

**Dia 2–3 — "Fernando" (paciente que desaparece, cenário novo)**: recebe conta, loga, preenche só o campo `motivo`, nunca volta para terminar "Sua História". **Achado**: não encontrei, no código auditado, nenhum lembrete automático (e-mail/notificação) para rascunho abandonado — `PatientStory.status: "rascunho"` fica parado indefinidamente, sem nenhum sinal para a equipe além de olhar manualmente a lista de histórias em aberto. Gargalo operacional real, não hipotético.

**Dia 3–4 — "Renata" (caso interrompido, cenário novo)**: Caso avança até `IN_CURATION`, mas a paciente liga desistindo (fora do sistema). A transição `IN_CURATION → CANCELLED` existe e é válida na máquina de estados. **Achado**: não há, no Portal do Paciente, nenhuma mensagem específica para o estado `CANCELLED` além do rótulo traduzido pela view — não sei, sem testar ao vivo, se isso soa como "encerramos com cuidado" ou como um estado tratado como erro genérico. Vale um teste manual antes do Go Live.

**Dia 5 — "Marcelo" (paciente insatisfeito, cenário novo)**: recebe a Curadoria Final com 3 profissionais, mas reclama que nenhum atende seu convênio. **Achado (reforça o já registrado)**: não existe campo de convênio/preço em nenhuma camada do sistema hoje — essa insatisfação é estruturalmente inevitável até essa informação existir em algum lugar (nem que seja só no `professional_summary` em texto livre, lido manualmente pelo Curador antes de aprovar).

**Dia 5 (mesmo dia) — acúmulo em Human Review**: se Roberto, Juliana (após responder a pergunta pendente) e Carlos chegarem a `HUMAN_REVIEW` no mesmo dia, uma única pessoa (Admin = Curador, `RUNBOOK.md` §9) precisa revisar três Casos com atenção genuína. **Achado**: nenhum mecanismo de fila ou priorização visível além da lista simples de Casos atribuídos — não é um bloqueio, mas é o primeiro lugar onde o ponto único de falha vira gargalo perceptível, não só teórico.

**Semana seguinte — Marina retorna (paciente que retorna depois de semanas, cenário novo)**: quer atualizar sua história ou abrir um novo motivo de busca. **Pergunta em aberto, não respondida por esta auditoria**: o produto prevê "acompanhamento periódico de 12 meses" (`docs/PRODUCT_ARCHITECTURE.md`), mas não confirmei se o sistema hoje permite a um paciente já com um Caso `DELIVERED`/`CLOSED` iniciar uma nova "Sua História"/novo Caso pela própria conta, ou se isso também depende de contato manual com a equipe. Recomendo confirmar isso especificamente antes do Shadow Launch avançar para esse cenário — não assumir nem uma resposta nem outra sem testar.

Nenhuma implementação realizada. Documento de planejamento, aguardando validação antes de qualquer execução real do Shadow Launch.
