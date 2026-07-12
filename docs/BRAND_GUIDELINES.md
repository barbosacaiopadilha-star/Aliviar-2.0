# Diretrizes de Marca — Aliviar Conexão

Documento canônico de personalidade, voz e uso da marca. Não duplica tokens visuais nem especificações técnicas de paleta/tipografia — essas vivem em `docs/DESIGN_SYSTEM.md` e são só referenciadas aqui. Este documento define **como a marca se comporta e fala**, não os valores hexadecimais ou o CSS.

Baseado em: `docs/PRODUCT_VISION.md` (posicionamento, valores), `docs/PRODUCT_PRINCIPLES.md`, `docs/DESIGN_SYSTEM.md` (tokens, contexto de marca na seção 0).

## Posicionamento

Curadoria médica e de cuidado independente — premium, humana, consultiva (ver `docs/PRODUCT_VISION.md`, seção "Posicionamento"). Toda comunicação da marca reforça isso: nunca soa como diretório de anúncios, nunca como sistema hospitalar, nunca como startup "tech" apressada.

## Personalidade

- **Serena** — nunca apressada, nunca alarmista.
- **Culta, sem ser distante** — fala com propriedade, sem jargão desnecessário.
- **Acolhedora, sem ser informal demais** — calorosa, mas nunca infantilizada.
- **Discreta** — confiança se comunica por consistência e espaço, não por volume.
- **Direta** — nunca enrola nem usa eufemismo para evitar uma informação desconfortável.

## Arquétipos de marca

Arquétipo primário: **Sábio(a)** — guia com conhecimento e critério, existe para trazer clareza onde há confusão, nunca vende, orienta. Arquétipo secundário: **Cuidador(a)** — acolhe genuinamente, prioriza o bem-estar de quem busca ajuda acima de qualquer outro interesse.

Explicitamente **não são** arquétipos da marca:
- **Herói** — dramatização e urgência não combinam com a proposta de calma e independência.
- **Bobo da Corte** — humor leve pode existir em contextos institucionais pontuais, mas nunca no produto ou em comunicação sobre saúde/cuidado.
- **Todo-poderoso/tech visionário** — a marca não vende tecnologia como protagonista (princípio "tecnologia invisível", `docs/PRODUCT_PRINCIPLES.md`).

## Tom de voz

Acolhedor, claro, seguro, consultivo. Sem jargão técnico, sem tom infantil, sem frases alarmistas (já estabelecido para a interface em `docs/DESIGN_SYSTEM.md`, seção 7 — a mesma voz vale para toda comunicação da marca, não só o produto).

**Evitar:**
- "Nenhum registro encontrado."
- "Erro 500."
- "Usuário inválido."
- Qualquer superlativo exagerado ("o melhor", "garantido", "revolucionário").
- Qualquer urgência artificial ("só hoje", "vagas limitadas", "não perca").

**Preferir:**
- "Ainda não há informações para exibir."
- "Não foi possível concluir esta etapa agora. Tente novamente."
- "Confira seus dados e tente outra vez."
- Afirmações verificáveis e específicas, sem promessa vaga.

## Linguagem e vocabulário

**Palavras e ideias recomendadas:** cuidado, acompanhar, acolhimento, clareza, confiança, junto, apoio, orientação, com calma, critério, independente, curadoria.

**Palavras e ideias proibidas:** urgente / última chance, garantido, 100% (em qualquer promessa de resultado), cura / milagre, promoção / oferta imperdível, jargão médico não traduzido para quem não é da área, linguagem infantilizada ("seu amiguinho", diminutivos excessivos), qualquer superlativo não verificável.

Mensagens de erro nunca revelam informação sensível (dado de outro usuário, detalhe técnico de infraestrutura, stack trace) — mesma regra já aplicada em produto (`docs/DESIGN_SYSTEM.md`, seção 7), estendida a toda comunicação escrita da marca (e-mail, suporte, redes).

## Fotografia

Editorial e real — pessoas reais, luz natural, momentos genuínos de escuta ou conversa. Nunca "stock genérico" (sorriso artificial, pose de banco de imagens óbvia), nunca clichê de "profissional de jaleco com estetoscópio posando para câmera", nunca sofrimento explícito ou sensacionalizado. Fotografia editorial é reservada a páginas institucionais/públicas — nunca aparece dentro do produto autenticado (`docs/DESIGN_SYSTEM.md`, seção 8).

## Ícones

Uma única biblioteca de traço fino e consistente (`lucide-react`, já adotada em produto — `docs/DESIGN_SYSTEM.md`, seção 8). Nunca emoji como ícone funcional. Nunca símbolo médico genérico e literal (cruz vermelha, estetoscópio) como recurso visual de marca — a marca já tem seu próprio símbolo (pessoa central, mãos de acolhimento, forma de coração).

## Uso da marca

Logo e variações são ativos oficiais, tratados como tal — nenhum agente de IA deve desenhar, recriar, reinterpretar ou gerar uma variação do logo. O `public/favicon.svg` atual (quadrado teal com "AC") é um **placeholder técnico**, não a marca aprovada — permanece até o arquivo de produção (SVG/vetorial) ser entregue. Uso do logo sempre com espaço de respiro mínimo ao redor, nunca distorcido, nunca sobre fundo que reduza o contraste ou a legibilidade.

A logo oficial ("Aliviar" em serif + "Curadoria Médica Independente" em versalete, símbolo de pessoa/mãos/coração em navy e sage) foi recebida e revisada — confirma a paleta de `docs/DESIGN_SYSTEM.md` (ADR-017). O lockup de duas linhas (nome + qualificador em versalete) é o padrão de wordmark textual a reproduzir em componentes enquanto o arquivo de imagem oficial não está disponível para uso direto.

## Espaço negativo

Generoso, deliberado, parte da comunicação de sofisticação e calma — "menos é mais" não é um cliché aqui, é a regra. Nunca lotar uma tela ou peça de comunicação para caber mais conteúdo; cortar conteúdo antes de reduzir o espaço.

## Paleta

Azul profundo/petróleo como cor primária de marca, verde sálvia como acento orgânico discreto, fundo marfim/branco, dourado só como pequeno acento (nunca preenchimento grande, nunca texto corrido). Valores exatos, contraste validado e tokens de implementação estão em `docs/DESIGN_SYSTEM.md`, seção 2.1 — não duplicados aqui.

## Tipografia

Serif editorial (`Fraunces`) só para marca, títulos institucionais e destaques editoriais; sans-serif funcional (`Inter`) para toda interface, formulário e texto operacional. Nunca misturar os papéis (serif em botão/formulário, ou sans-serif em destaque de marca). Detalhes de escala e pesos em `docs/DESIGN_SYSTEM.md`, seção 2.2.

## Animações

Sutis e sempre funcionais (indicam estado — carregando, transição, feedback), nunca decorativas por si só. Nunca efeito "bounce"/elástico/lúdico. Sempre respeitando `prefers-reduced-motion` (`docs/DESIGN_SYSTEM.md`, seção 9). Transições suaves (crossfade, deslizamento discreto), nunca corte abrupto ou flash.

## Uso do dourado

Estritamente como acento pontual: uma linha fina, um ícone isolado, um detalhe de borda em um card de destaque institucional. **Nunca**: fundo de botão, texto corrido, grande área preenchida, ou qualquer uso que o torne protagonista visual. O dourado marca um momento de distinção, não decora tudo.

## Exemplos positivos e negativos

**Positivo:** "Encontre o profissional certo para o seu momento, com curadoria independente." — claro, sem promessa exagerada, foco na pessoa.

**Negativo:** "O MELHOR app de saúde do Brasil! Garantido!" — superlativo não verificável, promessa impossível de sustentar, tom incompatível com a marca.

**Positivo (erro):** "Não foi possível enviar sua solicitação agora. Tente novamente em instantes." — calmo, sem culpar o usuário, sem jargão.

**Negativo (erro):** "ERRO: falha ao processar request. Código 500." — técnico, frio, aumenta ansiedade.

## Como escrever para cada público

- **Para pacientes**: acolhedor, simples, sem jargão técnico ou médico não traduzido. Frases curtas. Nunca infantilizado.
- **Para profissionais/médicos**: respeitoso da expertise deles, direto, sem explicar o óbvio da própria área — o tom reconhece que é um par profissional, não alguém que precisa ser guiado passo a passo.
- **Para parceiros e hospitais**: institucional, formal mas humano — foco em alinhamento de valores (curadoria independente) e processo, não em promessa comercial.
- **Para investidores**: estratégico e direto — mercado, modelo, tração e visão de longo prazo; menos vocabulário de "acolhimento", mais clareza de negócio, sem abandonar a honestidade (nunca projeção inflada apresentada como fato).
