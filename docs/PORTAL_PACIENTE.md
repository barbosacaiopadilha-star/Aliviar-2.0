# Portal do Paciente — Jornada (MISSÃO 205)

**Estado**: em construção. Dados de demonstração; sem banco, autenticação ou serviço externo.

**Onde vive hoje.** `/portal-paciente`, aberto no middleware enquanto usa mocks. O `/paciente` atual permanece intocado, autenticado e lendo o banco. Quando a integração acontecer, esta Jornada assume `/paciente`.

---

## A decisão de arquitetura que sustenta o Método

O Portal do Paciente **não tem estado próprio**. Ele é uma **projeção** do mesmo `CuradoriaRecord` que o Curador usa — `buildJornada(record)`, pura e determinística.

Isso é decisão de método, não de conveniência técnica. A Experiência §6 determina que **não existe "versão do paciente"** de um artefato compartilhado. Derivar em vez de duplicar torna estruturalmente impossível:

- a tela do paciente mostrar algo que o registro não contém;
- as duas telas divergirem;
- o nível interno vazar.

Um teste varre todo o texto gerado procurando `score`, `interno`, `ranking`, `melhor médico`, `processando`, `cobertura`, `eliminado`, `Motor`, `protocolo` — e falha se qualquer um aparecer. Outro garante que nenhum nome de profissional analisado apareça na Jornada.

---

## Telas

| # | Tela | Rota | Estado |
|---|---|---|---|
| 1 | Minha Jornada | `/portal-paciente` | **Implementada** |
| 2 | Meu Perfil de Prioridades | `/portal-paciente/prioridades` | **Implementada** |
| 3 | Como está sendo feita | `/portal-paciente/como-funciona` | **Implementada** |
| 4 | Dossiê | — | Pendente (depende da MISSÃO 204) |
| 5 | Minhas opções | — | Pendente (depende da MISSÃO 204) |
| 6 | Minha decisão | — | Pendente |
| 7 | Acompanhamento | — | Pendente |
| — | Central de documentos | — | Pendente |
| — | Mensagens | — | Pendente |

---

## Tela 1 — Minha Jornada

**Pergunta que responde:** *"Em que etapa está minha Curadoria, e o que acontece agora?"* — o princípio central da missão é que o paciente **nunca precise fazer essa pergunta**.

| Decisão | Origem |
|---|---|
| **"Agora" vem antes da linha do tempo** — quem abre o Portal quer a resposta imediata, não procurá-la | Experience §5 (UX3) |
| **Quatro estados, não dois**: `Sua vez` é distinto de `Acontecendo agora` — uma coisa é a equipe trabalhando, outra é a vez dele | Jornada §Momento 5 |
| **Ação da equipe nunca vira botão** para o paciente — ele acompanha, não executa | Experience §2.4 |
| **Etapa futura diz o que vai acontecer**, nunca caixa cinza vazia | MISSÃO 205 (proibição explícita) |
| **A etapa da Curadoria usa a data em que uma pessoa trabalhou**, nunca a do cálculo | Experience §2.4 |
| **Sem percentual, sem barra de progresso** | Fundamentos §5.2 — voltar de etapa não é retrocesso |
| **Prazo só aparece se existir** no registro; o Portal nunca inventa um | Experiência §Momento 5 |

## Tela 2 — Meu Perfil de Prioridades

É **o mesmo Perfil** que o Curador vê — sem simplificação. Cada peso vem com a evidência: o paciente não vê um número do sistema, vê a si mesmo (Experiência §Momento 4).

Traz a frase obrigatória da missão e uma segunda que impede a leitura errada mais provável: **os pesos nunca representam nota de médico**.

## Tela 3 — Como está sendo feita

Existe para que o silêncio da etapa técnica não vire abandono (Jornada §Momento 5 — o vale). Mostra trabalho **humano**: quem faz o quê, em que ordem. Nenhum nome interno de fase aparece.

Fecha com "três coisas que nunca mudam": ninguém paga para entrar, a seleção é sempre de uma pessoa com nome, e a decisão é dele sem prazo.

---

## WhatsApp

Número oficial **(11) 97903-7133**, fornecido pelo responsável na MISSÃO 205. Isso **fecha uma lacuna documentada**: `LANDING_CREATIVE_DIRECTION.md` §8 proibia inventar um número porque nenhum oficial existia em documento aprovado.

Vive como fonte única em `whatsapp-contact.tsx` (`ALIVIAR_WHATSAPP`) — nenhuma superfície reescreve o literal. Cada ponto de contato chega com o assunto já escrito, e nunca é navegação principal.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `JornadaTimeline` | As sete etapas com status, descrição, atualização, responsável e de quem é a próxima ação |
| `WhatsappContact` | Contato contextualizado por assunto; fonte única do número oficial |
| `EvidenceCard` | Reutilizado da Mesa — a mesma evidência, para os dois lados |

---

## Rastreabilidade

Fonte nova no registro: **`Jornada`** → `EXPERIENCIA_CURADORIA_COMPARTILHADA.md`. Deliberadamente **não** chamada "Experiência": uma fonte que diferisse de `Experience` só por um acento seria risco de leitura para quem revisa meses depois. Também registrada **`AQS`** → `ALIVIAR_QUALITY_SYSTEM.md`.

---

## Verificações

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` | Sem erros |
| `next lint` | Sem avisos ou erros |
| Testes | 14 novos (`jornada-paciente.test.ts`); suíte 786 passando |
| Fronteira do paciente | Verificada por teste: nenhum termo interno atravessa |
| Mobile 375px | Sem overflow; nav rola sozinha; nenhum alvo de toque abaixo de 24px |
| Acessibilidade | Corrigido link de 16px de altura para 44px (WCAG 2.5.8) |

---

## Pendências

1. **Telas 4 e 5 dependem da MISSÃO 204** — o editor do Dossiê não existe. A Jornada já mostra "Dossiê preparado" e "Ler meu Dossiê" a partir do registro, mas o destino ainda não foi construído.
2. **Telas 6 e 7** (decisão e acompanhamento) — não implementadas.
3. **Central de documentos e Mensagens** — não implementadas.
4. **Sem persistência** — a Jornada lê mocks; registrar decisão ainda não escreve nada.
5. **Um único paciente de demonstração** (Rosa, `caso-2024`) — não há seletor de caso nem estado de lista vazia.
