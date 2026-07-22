# Aliviar — Experience Governance

**Versão:** 1.0  
**Status:** Canônico — Constituição Operacional da Experiência  
**Escopo:** Toda superfície pública e toda experiência voltada ao paciente  
**Autoridade:** Subordinado a `CREATIVE_DIRECTION_1.0.md`. Em conflito, a Constituição Criativa prevalece.

**Documentos que esta governança operacionaliza:**

| Hierarquia | Documento | Função |
|------------|-----------|--------|
| 1 | `CREATIVE_DIRECTION_1.0.md` | Identidade — o que a Aliviar é e nunca será |
| 2 | `ALIVIAR_EXPERIENCE_PRINCIPLES.md` | Promessa — como o paciente deve se sentir |
| 3 | `EXPERIENCE_DESIGN_SYSTEM.md` | Padrões — linguagem, ritmo, arquétipos, capítulos |
| 4 | `PRODUCTION_NOTES.md` | Palco — tempos, luz, silêncio, filme |
| 5 | `EXPERIENCE_GOVERNANCE.md` | Processo — quem decide, como revisar, como evoluir |

---

## Por que este documento existe

A experiência da Aliviar não se protege sozinha. Com o tempo, pressões de produto, prazos e conveniência técnica empurram para:

- mais CTAs,
- mais velocidade,
- mais interface,
- mais conversão,
- menos silêncio.

Este documento responde à pergunta central:

> **Como impedimos que a experiência seja descaracterizada daqui a um ano?**

Com quatro mecanismos permanentes:

1. **Hierarquia documental** — identidade antes de implementação; nenhum PR "resolve no código" o que é decisão de experiência.
2. **Autoridade explícita** — toda mudança pública tem um aprovador nomeado por tipo de impacto.
3. **Checklist obrigatório** — nenhum merge em superfície pública sem conformidade verificável.
4. **Evolução governada** — crescer por acréscimo compatível, não por substituição silenciosa.

---

## Papéis de governança

| Papel | Responsabilidade |
|-------|------------------|
| **Guardião da Direção Criativa** | Custódia de `CREATIVE_DIRECTION_1.0.md`; aprova identidade, narrativa, emoção, vídeo, copy público |
| **Guardião da Experiência** | Custódia de `ALIVIAR_EXPERIENCE_PRINCIPLES.md` e `EXPERIENCE_DESIGN_SYSTEM.md`; aprova jornada, tom, arquétipos, capítulos |
| **Guardião de Produção** | Custódia de `PRODUCTION_NOTES.md` e `stage-tokens`; aprova tempos, luz, transições, palco |
| **Revisor Técnico de Experiência** | Valida implementação fiel aos documentos; não redefine identidade |
| **Autor da mudança** | Quem abre o PR; demonstra conformidade via checklist |

*Em equipes pequenas, um mesmo humano pode acumular papéis — mas nunca pode auto-aprovar mudança de identidade sem revisão explícita do Guardião da Direção Criativa.*

---

## 1. Quem pode alterar a experiência pública

| Tipo de mudança | Quem pode propor | Quem pode aprovar e mergear |
|-----------------|------------------|----------------------------|
| Copy público (qualquer frase visível ao visitante/paciente) | Qualquer membro da equipe | Guardião da Experiência + Guardião da Direção Criativa |
| Narrativa e sequência emocional | Guardião da Experiência | Guardião da Direção Criativa |
| Vídeo institucional (conteúdo, ordem, presença) | Guardião da Direção Criativa | Guardião da Direção Criativa |
| Palco, tempos, luz, animação do limiar | Qualquer membro | Guardião de Produção |
| Capítulos da jornada (estrutura, copy, ritmo) | Qualquer membro | Guardião da Experiência |
| Componentes compartilhados do EDS | Qualquer membro | Guardião da Experiência + Revisor Técnico |
| Correção de bug sem alteração perceptível | Engenharia | Revisor Técnico de Experiência |
| Superfícies internas (staff, curador, operação) | Engenharia / produto interno | Revisor Técnico — desde que não vazem linguagem ou padrão público |

**Regra:** se a mudança é perceptível por um visitante ou paciente, **não é só técnica**.

---

## 2. Quando exige revisão de direção criativa

Revisão do **Guardião da Direção Criativa** é obrigatória quando a mudança toca:

- Metáfora do Caminho Hospedado
- Sequência emocional pública (reconhecimento → abertura → compreensão → confiança → desejo de contar)
- Papel, momento ou tratamento do vídeo institucional
- Copy do limiar, da landing ou de qualquer superfície de descoberta
- Tom, promessa ou limites éticos (`ALIVIAR_EXPERIENCE_PRINCIPLES.md` §3)
- Inclusão de CTA, captura, urgência ou linguagem de conversão
- Personagens, vozes e quem fala em nome da Aliviar
- Qualquer palavra da lista proibida em `CREATIVE_DIRECTION_1.0.md` §6
- Reordenação, remoção ou substituição de fases do limiar
- Decisão de autoplay, controles visíveis ou competição visual com o filme

**Critério prático:** se altera *o que a pessoa sente sobre quem a Aliviar é*, é direção criativa.

---

## 3. Quando exige apenas revisão técnica

Revisão do **Revisor Técnico de Experiência** basta quando **todas** as condições são verdadeiras:

- Comportamento percebido pelo visitante permanece equivalente
- Copy, narrativa e sequência emocional inalterados (byte a byte ou semanticamente idênticos)
- Tempos, opacidades e curvas permanecem nos tokens oficiais (`stage-tokens.ts`, `PRODUCTION_NOTES.md`)
- Nenhum elemento visual novo compete com o filme
- A mudança corrige bug, acessibilidade técnica, performance ou compatibilidade de navegador
- Testes de modelo/copy existentes continuam passando sem alteração dos asserts de conteúdo

**Exemplos válidos de revisão técnica apenas:**

- Corrigir `aria-label` que não altera copy visível
- Otimizar carregamento do vídeo sem mudar transição perceptível
- Refatorar componente mantendo mesmas classes, tempos e textos
- Atualizar dependência de build sem alterar render

**Se houver dúvida, tratar como revisão criativa.**

---

## 4. Decisões que nunca podem ser tomadas localmente

Estas decisões **não pertencem ao PR isolado**, ao agente autônomo, nem à conveniência de sprint:

| # | Decisão proibida localmente | Por quê |
|---|----------------------------|---------|
| 1 | Autoplay de vídeo ou áudio sem gesto do visitante | Viola hospitalidade e dignidade |
| 2 | CTA primário no limiar ou durante o filme | Viola confiança antes de conversão |
| 3 | Pular fase emocional da sequência pública | Viola regra de ouro da jornada |
| 4 | Introduzir palavras proibidas (lead, usuário, aguarde, status, etc.) | Viola linguagem canônica |
| 5 | Alterar metáfora central (funil, plataforma, app, pipeline) | Viola identidade |
| 6 | Mostrar controles de player, cards ou benefícios durante o filme | Viola protagonismo do vídeo |
| 7 | Remover pausa de assimilação pós-filme | Viola silêncio como narrativa |
| 8 | Substituir gesto do visitante por início automático | Viola autonomia antes de direção |
| 9 | Mudar copy público sem revisão do Guardião da Experiência | Viola promessa ao paciente |
| 10 | Inventar tempos, curvas ou opacidades fora dos tokens oficiais | Fragmenta o palco |
| 11 | Adicionar animação decorativa sem função emocional | Compete com o filme |
| 12 | Tratar paciente como lead, ticket ou usuário em qualquer superfície | Viola ética de produto |

---

## Matriz de impacto

Para cada tipo de mudança: **quem aprova** e **qual documento consultar**.

| Mudança | Impacto | Quem aprova | Documento primário |
|---------|---------|-------------|-------------------|
| **Copy** (frase, título, metadata pública) | Alto — identidade | Guardião da Experiência + Guardião da Direção Criativa | `CREATIVE_DIRECTION_1.0.md` §6 |
| **Narrativa** (ordem, arco, capítulo, emoção) | Crítico | Guardião da Direção Criativa | `CREATIVE_DIRECTION_1.0.md` §5 |
| **Vídeo** (roteiro, presença, transição, autoplay) | Crítico | Guardião da Direção Criativa + Guardião de Produção | `CREATIVE_DIRECTION_1.0.md` §4 · `PRODUCTION_NOTES.md` |
| **Animação** (limiar/palco) | Médio–alto | Guardião de Produção | `PRODUCTION_NOTES.md` |
| **Tipografia** (família, escala, peso público) | Alto | Guardião da Experiência + Guardião de Produção | `CREATIVE_DIRECTION_1.0.md` §7 · EDS |
| **Cor e luz** (tokens, glow, opacidade) | Médio | Guardião de Produção | `PRODUCTION_NOTES.md` |
| **Tempo e ritmo** (delays, fades, pausas) | Médio | Guardião de Produção | `stage-tokens.ts` · `PRODUCTION_NOTES.md` |
| **CTA ou captura** | Crítico | Guardião da Direção Criativa | `CREATIVE_DIRECTION_1.0.md` §9 |
| **Novo capítulo da jornada** | Alto | Guardião da Experiência | `EXPERIENCE_DESIGN_SYSTEM.md` |
| **Componente EDS compartilhado** | Médio | Guardião da Experiência + Revisor Técnico | `EXPERIENCE_DESIGN_SYSTEM.md` |
| **Arquétipo / quem fala** | Alto | Guardião da Experiência | EDS Cap. 2 |
| **Bugfix imperceptível** | Baixo | Revisor Técnico | Checklist abaixo |
| **Superfície interna (staff)** | Baixo (se isolada) | Revisor Técnico | Não exportar padrões públicos |

### Fluxo resumido

```
Mudança proposta
      ↓
Toca copy, narrativa, vídeo, CTA ou emoção?
      ↓ sim                          ↓ não
Revisão criativa obrigatória    Toca tempo, luz, animação?
                                      ↓ sim              ↓ não
                              Revisão de produção    Revisão técnica
                                      ↓                    ↓
                              Checklist + merge      Checklist + merge
```

---

## Checklist obrigatório antes de qualquer merge

Todo PR que altere arquivos em `src/components/experience/`, `src/app/page.tsx`, `src/app/globals.css` (bloco `.limiar`), modelos de copy (`*-model.ts`) ou documentos canônicos de experiência **deve** incluir este checklist no corpo do PR — com cada item marcado.

### Identidade e acolhimento

- [ ] A experiência continua **acolhendo** — não capturando?
- [ ] A Landing ainda parece um **lugar habitado**, não uma interface?
- [ ] O visitante ainda sente que pode **descansar** antes de entender?
- [ ] Nenhuma urgência fabricada foi introduzida?

### Narrativa e emoção

- [ ] A **ordem emocional** foi preservada (nenhuma fase pulada)?
- [ ] Nenhuma emoção é pedida antes da hora (confiança antes de convite)?
- [ ] O **conceito e a narrativa** permanecem os definidos na Creative Direction?

### Filme e palco

- [ ] O **vídeo continua protagonista** durante sua presença?
- [ ] Existe algum **elemento competindo** com o filme (CTA, card, animação, texto)?
- [ ] O filme **não** inicia sem gesto do visitante?
- [ ] A **pausa de assimilação** pós-filme foi preservada?
- [ ] Tempos e curvas vêm dos **tokens oficiais** — não de valores ad hoc?

### Linguagem e gesto

- [ ] Existe **apenas uma próxima ação** (ou ausência explícita de ação)?
- [ ] Nenhuma **palavra proibida** foi introduzida?
- [ ] Copy público foi revisado pelo **Guardião da Experiência** (quando aplicável)?

### Continuidade e técnica

- [ ] A transição pareceria **respeitosa em um cinema**?
- [ ] Testes de modelo/copy relevantes foram executados e passam?
- [ ] `prefers-reduced-motion` continua respeitado?
- [ ] A mudança está documentada nos artefatos canônicos corretos (se altera tempos ou regras)?

**Merge bloqueado** se qualquer item crítico (filme, gesto, sequência, palavras proibidas, CTA no limiar) falhar.

---

## Como evoluir sem perder identidade

A Aliviar vai crescer. Crescimento saudável **acrescenta capítulos compatíveis** — não reformula o limiar a cada sprint.

### Princípios de evolução

1. **Adicionar, não substituir** — novos blocos vêm depois do filme ou depois da consolidação; não antes do gesto.
2. **Mesma casa** — mesma luz, mesma tipografia, mesma voz; transições nunca parecem mudança de produto.
3. **Um gesto por vez** — cada nova superfície oferece uma próxima ação, nunca um menu.
4. **Silêncio é feature** — resistir à pressão de preencher pausas com conteúdo.
5. **Documentar antes de codificar** — mudança de tempo ou ritmo atualiza `PRODUCTION_NOTES.md` e `stage-tokens.ts` no mesmo PR.
6. **Revisão anual da Constituição** — `CREATIVE_DIRECTION_1.0.md` é revisado deliberadamente, com versão nova; nunca por drift acumulado em PRs pequenos.

### O que pode evoluir com relativa liberdade

- Capítulos novos da jornada do paciente — desde que sigam o EDS
- Conteúdo pós-limiar (identidade, curadoria, caminho, convite) — após emoção 3 consolidada
- Superfícies internas — desde que não contaminem linguagem pública
- Infraestrutura técnica — desde que invisível ao paciente

### O que exige revisão constitucional (nova versão da Creative Direction)

- Mudança de metáfora central
- Mudança do papel do vídeo
- Inversão da sequência emocional
- Admissão de linguagem de conversão no limiar
- Substituição de hospitalidade por performance de growth

### Pergunta de evolução

Antes de qualquer feature nova na experiência pública:

> *Isto serve o caminhante — ou serve a métrica?*

Se servir a métrica, não entra.

---

## Revisão e versionamento deste documento

| Evento | Ação |
|--------|------|
| Nova fase do limiar ou do filme | Atualizar `PRODUCTION_NOTES.md` + este documento se processo mudar |
| Novo capítulo da jornada | Atualizar `EXPERIENCE_DESIGN_SYSTEM.md`; checklist permanece |
| Mudança de identidade | Nova versão de `CREATIVE_DIRECTION_1.0.md`; revisar este documento |
| Drift detectado em produção | Incidente de governança — reverter ou regularizar com revisão explícita |

**Versão:** incrementar em mudanças de processo.  
**Não incrementar** por correções ortográficas sem alteração de regra.

---

## Hierarquia em uma frase

> **A Creative Direction define quem somos. Os Principles definem como o paciente deve se sentir. O EDS define como escrevemos capítulos. As Production Notes definem como o palco respira. Esta Governança define quem pode mudar o quê — e o que nunca pode ser mudado sem nós percebermos.**

---

*Este documento existe para que, daqui a um ano, quem chegar ao limiar ainda encontre a mesma casa — não um site que foi otimizado até esquecer por que foi construído.*
