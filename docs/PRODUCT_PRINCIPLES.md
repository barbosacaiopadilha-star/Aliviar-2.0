# Princípios de Produto — Aliviar Conexão

Princípios permanentes que orientam toda decisão futura de produto, UX, engenharia, comunicação e IA. Complementam (não substituem) a missão/visão/valores de `docs/PRODUCT_VISION.md` — aqui o foco é o **como decidir**, não o **o que somos**.

Quando um princípio abaixo entrar em conflito com um pedido específico (de negócio, técnico ou de prazo), o princípio prevalece, a menos que o responsável pelo produto registre explicitamente uma exceção — e, mesmo assim, a exceção deve ser documentada, não silenciosa.

1. **Representar exclusivamente o interesse do paciente** — todo desenho de produto começa perguntando "isso serve a quem busca cuidado?", nunca "isso maximiza receita ou conveniência da plataforma?". Em qualquer conflito entre o interesse do paciente e o de um profissional, parceiro ou da própria Aliviar, o paciente vence.

2. **Independência acima de conveniência** — a curadoria nunca é comprada. Nenhuma posição de destaque, nenhuma recomendação, nenhum resultado de busca é influenciado por pagamento. Isso vale mesmo quando seria mais conveniente comercialmente ceder.

3. **Clareza acima de complexidade** — se uma funcionalidade não cabe numa explicação de uma frase para quem está usando, ela precisa ser simplificada antes de ser lançada, não documentada em letras miúdas.

4. **Transparência acima de persuasão** — nunca usar padrões de design que empurrem uma decisão (urgência artificial, contagem regressiva falsa, pré-seleção enganosa). A pessoa decide com informação completa, no seu tempo.

5. **Tecnologia invisível** — a tecnologia nunca deve ser o assunto da experiência. Se o usuário está pensando em "como o sistema funciona" em vez de "o que eu preciso fazer agora", a interface falhou.

6. **IA como apoio, nunca como decisão final** — toda sugestão gerada por IA (recomendação, triagem, resumo) é assistiva e revisável por humano, nunca autoritativa. Nenhuma decisão de cuidado é tomada exclusivamente por um modelo.

7. **Confiança é construída lentamente** — nunca prometer o que não pode ser cumprido. Preferimos entregar menos e cumprir integralmente a prometer mais e decepcionar. Confiança perdida por uma promessa quebrada custa muito mais do que o ganho de tê-la feito.

8. **Nenhuma interface deve aumentar ansiedade** — tom, ritmo, cor, densidade de informação e linguagem são sempre calmos, especialmente em fluxos sensíveis (erro, espera, ausência de resultado). Nunca um alarme visual ou textual desproporcional à situação real.

9. **Explicabilidade** — toda decisão relevante do sistema (por que essa recomendação, por que esse erro, por que esse profissional apareceu primeiro) deve poder ser explicada em linguagem simples, sem jargão técnico, para quem perguntar.

10. **Simplicidade** — resistir à tentação de adicionar funcionalidade, abstração ou configuração antes de validar que a essencial funciona bem. Três linhas parecidas são melhores que uma abstração prematura (mesmo princípio já aplicado em engenharia, elevado aqui a princípio de produto).

11. **Acessibilidade** — WCAG AA é o piso mínimo aceitável, nunca uma meta aspiracional a ser alcançada "depois". Nenhuma funcionalidade vai ao ar sem ser utilizável por teclado, leitor de tela e com contraste adequado.

12. **Segurança** — dado de saúde e de cuidado é sensível por definição. Tratado com o rigor que isso exige: nunca exposto além do necessário, nunca usado para outra finalidade além do cuidado da própria pessoa, sempre com a menor superfície de acesso possível (mesmo princípio já aplicado em RLS/autorização, elevado a princípio de produto).

13. **Consentimento e controle** — a pessoa sempre sabe o que compartilhou, com quem, e pode revisar ou revogar isso. Nunca um dado circula "por baixo dos panos".

14. **Não paternalismo** — o papel da plataforma é informar e capacitar a pessoa a decidir por si mesma, nunca decidir por ela ou esconder opções "para o próprio bem" dela.

15. **Continuidade** — o relacionamento de cuidado não termina numa conexão única; a plataforma existe para acompanhar a jornada ao longo do tempo (coerente com o modelo modular e evolutivo de `docs/PRODUCT_VISION.md`), não para resolver uma transação isolada.
