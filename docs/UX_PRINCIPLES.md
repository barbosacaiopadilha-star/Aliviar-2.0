# UX_PRINCIPLES — Princípios permanentes de experiência

**Estado**: Proposto (Missão 0, 2026-07-25). Par de `ALIVIAR_GUIDED_EXPERIENCE.md`. Cada princípio nasceu de um fato observado nesta plataforma — a origem está anotada para que ninguém o relativize depois.

---

## P1 — Uma tela, uma pergunta, uma ação principal
Toda tela responde UMA pergunta da jornada e tem NO MÁXIMO um botão primário. Segundas ações são secundárias visualmente. *(Origem: telas do COS; anti-exemplo: painéis-vitrine.)*

## P2 — A próxima ação nunca se esconde — nem quando está em outro lugar, nem quando não existe
Se a ação é da pessoa: botão nomeado pelo efeito. Se está em outra tela: link dizendo onde. Se não há ação: a tela DIZ que não há ("nada depende de você agora"). *(Origem: bug do Acolhimento — itens em aberto sem onde resolvê-los; e contrato do paciente: caso com a equipe = zero botões.)*

## P3 — Proibido "Continuar"
Todo botão nomeia o efeito: "Registrar revisão", "Converter em paciente", "Encaminhar ao Curador". Três de quatro ações da plataforma são irreversíveis; quem clica sabe antes. *(Origem: Missão 2.5 §3; guardado por revisão de copy.)*

## P4 — Estado derivado de fato, nunca de rótulo
"Qualificado" é ter `qualified_at`; "concluída" é o critério do Motor satisfeito. Nenhuma tela mantém um campo de etapa que alguém "lembra de atualizar". *(Origem: lead-next-step; fases do COS com `isMet(record)`.)*

## P5 — Declarar é ato humano
O sistema nunca marca revisão, confirmação ou decisão por alguém. E o registrado é acumulativo: revisão feita não regride — o paciente nunca recomeça do zero. *(Origem: AcolhimentoWorkspace; Ciclo do Motor.)*

## P6 — Filas ordenam pelo que falta fazer
Nunca por data de chegada, nunca por produtividade. Curador: bloqueio > alerta > ação > acompanhamento. Atendente: etapa pendente > antiguidade. Concierge: mais frio primeiro. *(Origem: fila do Atendente e painel do Curador.)*

## P7 — "Não sei" nunca vira zero — nem ausência vira negativa
Métrica sem fonte = "Informação indisponível". Dado ausente = estado de informação explícito, jamais um "não" inventado. *(Origem: dashboard executivo; EstadoInformacao do P002.)*

## P8 — Nada antes da hora, nada técnico na frente
Informação aparece no momento da jornada em que serve à decisão — não antes. Enum, ID, P00x, JSON: nunca em tela (JSON é anexo auditável do Curador). Score interno jamais chega ao paciente; banda qualitativa, sim. *(Origem: dois níveis de compatibilidade; testes de vocabulário do paciente.)*

## P9 — Vocabulário proibido não entra nem para ser negado
"Ranking", "score", "vencedor", "protocolo" não aparecem em tela de paciente — nem em frases como "sem ranking". Não se nomeia o que não deve existir. *(Origem: correção do relatório final na reintegração; Ontologia §8.)*

## P10 — Passagem de bastão deixa rastro e retira acesso
Encaminhar exige motivo e destinatário com papel real; quem entregou para de ver. A tela trata a perda de acesso como conclusão, não como erro. *(Origem: transfer_case_responsibility; RLS pós-transferência provada.)*

## P11 — Estado vazio é informação, não vazio
Título claro + por que está vazio + o que fará algo aparecer + se a lista está atualizada + ação real quando existir. Sem tom de erro, sem botão decorativo. *(Origem: norma da Missão de Polimento; estado vazio do Curador.)*

## P12 — Erro fala com gente
Mensagem diz o que falta e como resolver ("Explique por que o Case está mudando de responsável") — nunca código de erro cru. A validação de UI explica; **quem garante é o banco** — regra de autorização nunca é duplicada no cliente. *(Origem: actions do Case; mensagens das funções SECURITY DEFINER.)*

## P13 — Só em produção o que é de produção
Aviso de construção/demonstração não renderiza em produção — condicionado por código, não por CSS. *(Origem: rodapé "dados de demonstração"; teste pinando.)*

---

## Componentes conceituais (papéis, não desenhos)

Obrigatórios em praticamente toda superfície autenticada — implementação decide a forma; o papel é fixo:

| Componente | Papel | Responde |
|---|---|---|
| **Momento Atual** | nomeia onde a pessoa está na jornada, em linguagem humana | Onde estou? |
| **Progresso** | fases/etapas com estado e dependência explícita ("Depende de: …") | O que já aconteceu / falta? |
| **Próxima Ação** | O botão primário — ou a declaração de que nada depende da pessoa | O que depende de mim? |
| **Resumo** | o essencial do caso/da fila sem abrir nada | O que está acontecendo? |
| **Checklist de fase** | critérios do Motor com estado, cada item resolvível ali ou com link para onde se resolve | idem P2 |
| **Alertas** | bloqueios e inconsistências, com código auditável + título humano | O que exige atenção? |
| **Linha do Tempo** | eventos com autor e data — inclusive quando o autor foi o sistema | O que já aconteceu? |
| **Identidade** | AuthenticatedUserMenu: nome real, papel humano, saída sempre disponível | Quem sou aqui? |

## Microcopy — como a plataforma conversa

**Com o Paciente**: segunda pessoa, calor sem infantilizar; frases completas; nunca urgência artificial; o silêncio certo ("nada depende de você") é cuidado. Nomes: "sua história", "suas prioridades", "três caminhos".

**Com o Atendente**: operacional e direto; a pessoa no centro da frase ("2 contatos aguardam sua próxima ação"), não o registro.

**Com o Curador**: par técnico respeitoso; o Motor explica-se ("por que estou vendo isto"), nunca ordena; rigor sem jargão de engenharia — "História organizada", não "Narrative".

**Com o Concierge**: agenda e gente; verbos de acompanhamento ("retomar", "confirmar", "acompanhar"); nunca vocabulário de vendas sobre pacientes.

**Com o Administrador**: números com fonte e frase que interpreta ("uma pessoa acumula mais de um nível operacional — a separação existe no sistema, mas não na prática").

**Para todos**: sem siglas internas; datas absolutas com autor; motivo obrigatório escrito para o humano que lerá a auditoria amanhã.

## Acessibilidade — além de WCAG

1. **Carga cognitiva é acessibilidade**: uma decisão por tela; opções demais é falha, não riqueza
2. **Ansiedade é acessibilidade**: quem decide sobre saúde lê com medo — nunca cor sozinha para gravidade, nunca vermelho sem próxima ação, loading dizendo o que carrega
3. **Orientação permanente**: as cinco perguntas valem para leitor de tela — landmarks, um `h1` por tela = Momento Atual, skip link
4. **Teclado de primeira classe**: tudo operável sem mouse; Escape fecha e devolve foco; foco visível sempre; backdrop fora da ordem de tabulação *(origem: correções desta linha)*
5. **Toque**: alvos ≥44px nas superfícies autenticadas; ≥24px (AA) no editorial público
6. **Texto alternativo real**: todo gráfico com a MESMA informação em tabela — não um resumo diferente *(origem: ChartFrame)*
7. **Movimento respeita `prefers-reduced-motion`** e nada essencial existe só em animação
