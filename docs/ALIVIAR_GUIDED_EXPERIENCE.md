# ALIVIAR GUIDED EXPERIENCE — Documento Fundador da Experiência

**Estado**: Proposto (Missão 0, 2026-07-25). Não canônico até aprovação do Fundador — `DOCUMENTATION_GOVERNANCE_POLICY.md` §4. Nenhum código foi alterado para produzir este documento.

**Autoridade pretendida**: quando aprovado, toda superfície nova ou alterada deve obedecer a este documento, a `JOURNEYS.md`, a `UX_PRINCIPLES.md` e a `INFORMATION_ARCHITECTURE.md`. Onde conflitar com documentos anteriores de UX, este prevalece; onde conflitar com o Método (`FUNDAMENTOS_DO_METODO_ALIVIAR.md`, Ontologia, Constituição), **o Método prevalece sempre** — a experiência serve o Método, nunca o contrário.

---

## 1. Filosofia

A Aliviar não vende software. A Aliviar **conduz pessoas por decisões importantes de saúde**.

Disso decorre a regra que funda tudo:

> **A plataforma se organiza pela jornada mental de quem a usa — nunca pela estrutura interna do sistema.**

Uma tela existe porque ajuda alguém a dar o próximo passo de uma decisão. Nunca porque existe uma entidade no banco. "História", "Filtros", "Decision Case", "Artefatos" são nomes de engenharia; o Curador pensa "entender a pessoa", "definir o que importa para ela", "comparar caminhos". A distância entre esses dois vocabulários é a dívida de experiência que esta Constituição elimina.

Isso **não** muda domínio, banco, APIs, RLS ou regras de negócio. O Case único, a responsabilidade auditada, os invariantes por trigger — tudo permanece. Muda o que a pessoa vê, em que ordem, e com que palavras.

## 2. Princípio Central — as Cinco Perguntas

Toda superfície autenticada responde, sem que ninguém precise procurar:

1. **Onde estou?** — nome do momento em linguagem da jornada, não da entidade
2. **O que já aconteceu?** — o passado visível, com autor e data (nada se perde, nada recomeça do zero)
3. **O que está acontecendo agora?** — o estado atual, honesto ("com a equipe" ≠ "esperando você")
4. **O que depende de mim?** — a ação da pessoa, nomeada pelo efeito ("Registrar revisão"), nunca "Continuar"
5. **O que acontecerá depois?** — o próximo momento, mesmo quando não é dela ("depois disso, o Curador…")

Se uma dessas respostas exige explicação verbal, a tela está errada — não a pessoa.

**Teste prático** (usado nesta auditoria e obrigatório nas próximas): abrir a tela como o papel real e responder as cinco perguntas em voz alta em menos de 30 segundos. A tela do Acolhimento reprovou nesse teste em produção (respondia 1, 2 e 4, mas o item 4 não tinha onde ser executado e o 5 não existia) — e foi corrigida. Esse é o padrão do erro que esta Constituição impede.

## 3. Os Cinco Perfis

Análises completas por perfil (missão, pergunta, objetivos, decisões, ansiedades, próxima ação) em `JOURNEYS.md`. O resumo de identidade:

| Perfil | Missão na plataforma | Pergunta ao abrir o sistema |
|---|---|---|
| **Paciente** | Viver uma decisão de saúde acompanhado, entendendo cada passo | *"Estão cuidando de mim? O que falta e o que é meu para fazer?"* |
| **Atendente** | Transformar um contato humano em um Case bem iniciado | *"Quem chegou e quem está esperando um passo meu?"* |
| **Curador** | Conduzir a Curadoria de UMA pessoa por vez, com rigor e evidência | *"Quem precisa de mim agora, e qual é o próximo passo dessa pessoa?"* |
| **Concierge** | Garantir que a decisão tomada vire cuidado real | *"Quem escolheu e ainda não foi atendido? Onde algo pode esfriar?"* |
| **Administrador** | Governar a operação sem operá-la | *"Onde a operação precisa de atenção — e há gente em cada nível?"* |

Nenhum perfil compartilha a pergunta de outro. Por isso nenhum compartilha a home de outro — e por isso o Administrador **não** é o fallback de nenhum deles (Correção do Administrador §1).

## 4. IA — onde ajuda, onde nunca decide

O Ciclo do Motor é constitucional: **o Motor reconhece → explica → entrega ao Curador → o Curador decide → o Motor registra.**

A IA **pode e deve**:
- **Resumir** — a história organizada a partir do que o paciente contou (Narrative), sempre reabrível ao original
- **Organizar** — ordenar a fila do Curador por quem precisa dele; agrupar evidências por critério
- **Sugerir** — apontar lacunas ("nenhuma evidência cobre o critério X"), nunca preencher a lacuna
- **Justificar** — toda saída carrega a fonte rastreável; artefato sem fonte não é exibido
- **Alertar** — inconsistências, prazos, ausências ("ausência não vira negativa" — estado de informação explícito)

A IA **nunca**:
- decide, ranqueia para o paciente, ou produz "vencedor" (Ontologia §8 — o vocabulário nem existe nas telas)
- transforma hipótese em fato, preferência em restrição, ausência em negativa
- sobrescreve correção humana (regeneração preserva o que o Curador corrigiu — P002 field corrections)
- fala com o paciente sem que um humano tenha validado a entrega
- marca uma revisão, confirmação ou decisão em nome de alguém — declarar é ato humano

**JSON técnico nunca é a interface principal** — é anexo auditável para o Curador, invisível ao paciente.

## 5. Vocabulário — mapa oficial interno → humano

O nome interno continua existindo em código, banco e auditoria. A tela usa o nome humano.

| Interno (código/banco) | Na tela — Curador/equipe | Na tela — Paciente |
|---|---|---|
| `patient_stories` / História | "O que a pessoa contou" | "Minha história" |
| Filtros obrigatórios | "O que não pode faltar" | (invisível — instrumento do Curador) |
| Perfil de Prioridades | "O que importa para esta pessoa" (100 pontos com a palavra dela em cada peso) | "Minhas prioridades" |
| Narrative | "História organizada" *(já corrigido em tela)* | não exibido cru |
| DecisionCase | "Caso de decisão" *(já corrigido)* | não exibido |
| Shortlist / seleção | "Os três caminhos" | "Três caminhos legítimos — sem ordem de preferência" |
| Score interno | visível só ao Curador, com cobertura | banda qualitativa, nunca número |
| `case.status` enums | rótulo traduzido (`CASE_STATUS_LABELS`) | frase de estado ("Sua curadoria está em andamento.") |
| transferência de responsabilidade | "Encaminhar ao Curador/Concierge" com motivo | "Seu caso está com a equipe de…" |

Regra permanente: **enum, ID, protocolo (P00x), nome de tabela e sigla interna jamais aparecem em tela** — há teste pinando isso para o paciente; estende-se a todos os perfis.

## 6. Relação com o que já existe

Esta Constituição **consolida** decisões já vividas nesta linha de trabalho, e as eleva a norma:

- As nove fases do COS já são jornada, não módulos — o padrão a generalizar
- O funil do Atendente já ordena "pelo que falta fazer, não pela data" — vira princípio (P6 em `UX_PRINCIPLES.md`)
- Estados vazios honestos ("a fila está atualizada; nada carregando") — vira norma
- `null` ≠ zero no dashboard executivo — vira norma
- "O sistema nunca marca por você" (Acolhimento) — vira norma para toda declaração humana

O que ela **corrige** está diagnosticado em `INFORMATION_ARCHITECTURE.md` §2 (dualidades de rota, telas-explicação sem execução, mudanças de contexto).

## 7. Critério de conclusão da própria Constituição

Qualquer designer, dev, PM ou o Fundador deve conseguir responder **"como uma tela da Aliviar deve funcionar?"** apenas lendo estes quatro documentos: esta filosofia → a jornada do perfil (`JOURNEYS.md`) → os princípios e componentes (`UX_PRINCIPLES.md`) → o lugar da tela na arquitetura (`INFORMATION_ARCHITECTURE.md`). Se sobrar pergunta que exige explicação verbal, abre-se revisão desta Constituição — nunca uma exceção silenciosa.
