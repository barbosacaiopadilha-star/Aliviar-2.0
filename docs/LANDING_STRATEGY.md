# Estratégia de Landing Page — Aliviar Conexão

Documento de **estratégia**, não de implementação — nenhum HTML, nenhum copy final de produção. Define objetivo, estrutura e critério de cada seção da landing institucional (`(public)` no produto — `docs/ENGINEERING_PLAN.md`, seção 4). A implementação (copy final, HTML/componentes) é uma tarefa futura própria, a partir deste documento.

A referência pública `aliviar-temp.vercel.app` é **só inspiração visual de estrutura** (ex.: uso de vídeo no hero, cards de diferencial) — não copiar texto de lá, e sua paleta/ilustração cartoon diverge da direção aprovada (ver `docs/DESIGN_SYSTEM.md`, seção 0).

Baseado em: `docs/PRODUCT_VISION.md` (posicionamento, proposta de valor, diferenciais) e `docs/BRAND_GUIDELINES.md` (tom de voz, vocabulário proibido/recomendado).

## Objetivo geral da landing

Comunicar, em menos de 10 segundos de leitura, que a Aliviar Conexão é uma curadoria independente de cuidado — não um diretório de anúncios, não um sistema hospitalar — e conduzir a pessoa a entender "como funciona" antes de pedir qualquer ação.

## Fluxo de leitura

Hero (o que é, em uma frase) → Problema (por que isso importa) → Método/Como funciona (como resolvemos) → Diferenciais (por que confiar em nós especificamente) → Vídeo institucional (reforço emocional/humano) → Confiança (prova social estrutural) → FAQ (objeções finais) → CTA final.

Cada seção existe para responder exatamente **uma** pergunta da pessoa lendo, na ordem em que ela naturalmente surgiria — nunca duas mensagens concorrentes na mesma seção.

## Hero

**Objetivo:** comunicar o posicionamento (curadoria independente de cuidado) e diferenciar de um diretório médico comum, em uma leitura de poucos segundos.

- **Headline** — direção: afirmação curta que una "cuidado" + "critério/independência", nunca uma pergunta genérica tipo "precisa de ajuda?". Exemplo de direção (não copy final): *"Cuidado encontrado com critério, não com anúncio."*
- **Subheadline** — direção: uma frase que explique o mecanismo (curadoria conectando pessoa a profissional certo), reforçando "independente".
- **CTA principal** — ação de descoberta (ex.: "Encontrar um profissional"), sempre em primeira pessoa da perspectiva de quem busca cuidado, nunca genérico tipo "Saiba mais".
- **CTA secundário** — ação para quem é profissional (ex.: "Sou profissional de cuidado"), claramente secundário visualmente (evita competir com o CTA principal, que é sempre voltado a quem busca cuidado, coerente com "representar exclusivamente o interesse do paciente" — `docs/PRODUCT_PRINCIPLES.md`).

## Seção problema

**Objetivo:** nomear a fragmentação/frieza da busca por cuidado hoje, sem tom alarmista, para que a pessoa se reconheça na dor sem se sentir explorada emocionalmente. Nunca usar estatística de sofrimento sensacionalizada. Tom: reconhecimento calmo, não dramatização.

## Seção método (como funciona)

**Objetivo:** explicar o mecanismo de curadoria em 3 passos simples e verificáveis (ex.: 1. conte o que busca → 2. veja profissionais com curadoria independente → 3. conecte-se diretamente). Cada passo deve caber em uma frase (princípio de clareza, `docs/PRODUCT_PRINCIPLES.md`). Nenhum passo deve descrever uma funcionalidade que ainda não existe no produto (evitar prometer o que a Fase atual do roadmap não entrega — ver `docs/ENGINEERING_PLAN.md`).

## Seção diferenciais

**Objetivo:** justificar por que confiar nesta curadoria especificamente. Estrutura de 3–4 cartões, cada um mapeado 1:1 a um diferencial já registrado em `docs/PRODUCT_VISION.md` (independência, cuidado humano acima de tecnologia, modelo modular/evolutivo, identidade discreta e sofisticada) — não inventar diferencial novo aqui; se um diferencial não está em `PRODUCT_VISION.md`, ele não entra na landing sem antes ser registrado lá.

## Seção vídeo

**Objetivo:** reforço emocional e humano do posicionamento, complementando (não repetindo) o texto das seções acima. Vídeo institucional de ~80 segundos — roteiro completo em `docs/VIDEO_STORYBOARD.md`. Posição sugerida: depois de "diferenciais", antes de "confiança" — a pessoa já entende o que é e por quê, o vídeo humaniza antes da prova social.

## Seção confiança

**Objetivo:** prova social estrutural. **Estrutura, não conteúdo fictício**: espaço para número real de profissionais curados (só quando existir dado real — nunca inventado, princípio "nenhum dado fictício apresentado como real", `docs/PRODUCT_VISION.md`), espaço para depoimento real de paciente/profissional (só quando coletado com consentimento), selo/menção institucional real quando existir. Enquanto não houver dado real, esta seção fica **vazia ou omitida** — nunca preenchida com placeholder que pareça real.

## FAQ (perguntas frequentes)

**Objetivo:** resolver objeções finais antes do CTA de conversão. Estrutura sugerida de perguntas (respostas a escrever na implementação, alinhadas ao tom de `docs/BRAND_GUIDELINES.md`):
- Como funciona a curadoria? (reforça "independente", nunca paga)
- Quanto custa para quem busca cuidado?
- Como um profissional entra na plataforma?
- Meus dados estão seguros? (linka para política de privacidade real, nunca resposta vaga)
- A Aliviar Conexão substitui atendimento médico/psicológico? (resposta honesta — não substitui, conecta)

## Depoimentos (estrutura)

**Objetivo:** humanizar a prova social. Estrutura por depoimento: nome (ou iniciais, com consentimento de exposição), papel (paciente ou profissional), uma frase curta e específica (nunca genérica tipo "ótimo serviço!"), contexto opcional (área de busca, sem expor dado sensível de saúde). **Nenhum depoimento fictício** — esta estrutura só é preenchida quando houver depoimento real e consentido.

## Como funciona (resumo de página, se distinto da seção método)

Se a landing tiver uma página própria "Como funciona" (além da seção da home), ela expande os 3 passos da seção método com mais detalhe operacional — sem introduzir informação nova de posicionamento (isso pertence a `PRODUCT_VISION.md`).

## SEO e palavras-chave

Direção de intenção de busca (a validar com pesquisa de palavra-chave real antes de produção): "curadoria médica independente", "encontrar profissional de saúde de confiança", "conexão com psicólogo/terapeuta", "apoio emocional profissional", "plataforma de cuidado humanizado". Evitar palavras-chave que impliquem promessa médica não sustentável ("cura", "tratamento garantido") — mesmo vocabulário proibido de `docs/BRAND_GUIDELINES.md` se aplica a SEO.

## Objetivo de cada seção — resumo

| Seção | Pergunta que responde |
|---|---|
| Hero | O que é isso, em uma frase? |
| Problema | Por que isso importa para mim? |
| Método | Como isso resolve meu problema? |
| Diferenciais | Por que confiar nesta curadoria e não em outra? |
| Vídeo | Quem está por trás disso, humanamente? |
| Confiança | Outras pessoas confiaram nisso de verdade? |
| FAQ | O que ainda me impede de agir? |
| CTA final | Qual é o próximo passo, exatamente? |
