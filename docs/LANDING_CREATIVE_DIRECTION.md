# Direção Criativa — Landing Page da Aliviar Curadoria Médica

Documento canônico (ADR-017) que governa toda decisão futura de UX/UI/Design/Conteúdo/Implementação da Landing Page. Estende a lista de documentos canônicos de produto/marca da ADR-010. Baseado em `docs/PRODUCT_VISION.md`, `docs/PRODUCT_PRINCIPLES.md`, `docs/BRAND_GUIDELINES.md`, `docs/DESIGN_SYSTEM.md` e `docs/PRODUCT_ARCHITECTURE.md` (posicionamento de produto único, sigilo do Método) — nenhum é contradito aqui.

Supersede a **estrutura** de `docs/LANDING_STRATEGY.md` (fluxo antigo de 8 seções); o conteúdo de tom de voz, FAQ e SEO daquele documento permanece válido como referência.

## 0. O que a Landing é

Não é uma página institucional. É a primeira experiência da Aliviar. Todo visitante deve sair dela pensando uma única frase: **"É exatamente desse tipo de ajuda que eu estava precisando."** Esse é o critério máximo de sucesso — todo o resto (SEO, conversão, métricas) é secundário a isso.

**Objetivo principal:** transmitir confiança e reduzir ansiedade antes mesmo da contratação. Cada decisão de design responde a uma pergunta: *isso melhora a experiência emocional do paciente?* Se não, não entra.

## 1. Posicionamento — um único produto

"Curadoria Médica Aliviar" é o único produto. Busca Direta e Concierge de Saúde são duas portas de entrada da mesma experiência — o paciente nunca deve perceber dois produtos diferentes (consistente com `docs/PRODUCT_ARCHITECTURE.md`).

## 2. Princípio central

O paciente nunca interage com protocolos. Vive uma experiência contínua de curadoria médica. O ACE, os protocolos (P001–P010), a Compatibility Matrix, a Shortlist, o Competency Profile, rankings, scores, pesos e qualquer critério ou lógica interna de IA **nunca** aparecem na Landing nem em nenhuma superfície voltada ao paciente (`docs/PRODUCT_ARCHITECTURE.md`, sigilo do Método). A IA nunca é protagonista. O paciente é sempre protagonista.

## 3. A Landing é um filme, não uma página

Cada seção deve conduzir naturalmente para a próxima. O visitante nunca deve sentir que está "rolando uma página" — deve sentir que está sendo conduzido por uma história.

### Ordem emocional (guia de tom e transição — não uma reordenação da estrutura de seções da seção 6)

1. "Você não precisa enfrentar isso sozinho." → **Hero**
2. "Existe uma forma organizada de tomar essa decisão." → **CTA principal** (ponte, não venda)
3. *(Vídeo institucional)* — agora o paciente entende completamente o conceito → **Vídeo**
4. "É assim que funciona." → **Como funciona**
5. "É por isso que as pessoas confiam." → **Por que confiar**
6. "É isso que você recebe." → **Benefícios**
7. "Este será o seu acompanhamento." → **Processo**
8. "Estas são as dúvidas mais comuns." → **FAQ**
9. "Quando estiver pronto, estamos aqui." → **Concierge de Saúde + CTA Final**

Nunca inverter essa lógica de tom, mesmo quando a ordem estrutural aprovada (seção 6) intercala seções por razões de composição visual.

## 4. O vídeo é o centro

O vídeo institucional (~10 minutos — roteiro em `docs/VIDEO_INSTITUCIONAL_LANDING.md`, **distinto** do filme de marca de 80 segundos da FASE 7/Helena, que continua existindo para outros canais) não é um componente qualquer — é o centro da Landing. Toda a página existe para preparar o visitante para assistir a ele e, depois, reforçar o que acabou de ser visto. Nenhuma outra seção repete o conteúdo do vídeo — cada uma aprofunda apenas o que merece mais detalhe.

## 5. Não parecer um site médico

A Aliviar não deve parecer hospital, clínica, laboratório, marketplace, plano de saúde ou comparador de médicos. A experiência deve parecer uma **consultoria premium extremamente humana**. Nunca usar iconografia médica literal (estetoscópio, cruz vermelha, jaleco), nunca estética "corporativo de saúde" (azul clínico frio, ícones de prancheta/hospital).

## 6. Estrutura aprovada (12 seções)

1. Header — 2. Hero — 3. CTA principal — 4. Vídeo institucional (grande destaque) — 5. Como funciona — 6. Benefícios — 7. Processo — 8. Por que confiar — 9. Concierge de Saúde — 10. FAQ — 11. CTA Final — 12. Footer.

Referência visual: `aliviar-temp.vercel.app` — inspiração de ritmo/impacto emocional apenas, nunca cópia (paleta/ilustração cartoon já rejeitadas, `docs/DESIGN_SYSTEM.md` seção 0).

## 7. Direção de arte — onde inovar, onde nunca inovar

**Inovação autorizada apenas em:** tipografia, composição, ritmo, animações, transições, identidade visual, fotografia, vídeo, uso de espaço, cinematografia.

**Inovação proibida em:** fluxo, clareza, usabilidade, navegação. "A interface pode surpreender. A experiência nunca pode confundir."

## 8. WhatsApp como extensão, nunca como fuga

O WhatsApp faz parte da experiência, mas a Landing nunca deve dar a sensação de "jogar" o paciente para fora e abandoná-lo. A sensação correta é **"o site continua"** — o WhatsApp é uma extensão natural da mesma experiência de curadoria, não uma saída de emergência. Nenhum link de WhatsApp genérico/externo deve ser inventado na Landing — a Aliviar não tem hoje um número de atendimento público registrado em nenhum documento deste repositório; nenhum é fabricado aqui (princípio "nenhum dado fictício apresentado como real", `docs/PRODUCT_VISION.md`). Toda ação da Landing aponta para o fluxo real do produto (`/sua-historia`, `/login`).

## 9. O momento da consultoria

Quando ocorre o encontro ao vivo (por WhatsApp ou outro canal), há participação humana real da equipe Aliviar, conduzindo a experiência simultaneamente, explicando passo a passo. Por isso, a Landing **não precisa ensinar todos os detalhes operacionais** — precisa gerar confiança suficiente para que o paciente queira iniciar essa experiência. Profundidade operacional pertence ao momento humano, não à página.

## 10. Linguagem

Acolhimento, segurança, independência, critério, humanidade, confiança — nunca propaganda, nunca marketplace, nunca comparação automática de médicos. Vocabulário permitido/proibido em `docs/BRAND_GUIDELINES.md` aplica-se integralmente.
