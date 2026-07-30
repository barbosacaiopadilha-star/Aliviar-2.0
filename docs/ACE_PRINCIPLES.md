# ACE PRINCIPLES — Princípios permanentes do Aliviar Compatibility Engine

**Estado**: Proposto (2026-07-25). Par de [`ACE_FOUNDATION.md`](ACE_FOUNDATION.md).

Princípios são permanentes: não se suspendem por prazo, por volume, por pedido comercial ou por conveniência técnica. Alterar qualquer um exige decisão registrada do Fundador — nunca uma exceção silenciosa.

---

## P1 — Supervisão humana é constitutiva, não uma etapa

O ACE nunca decide, nunca aprova, nunca encerra, nunca assina. Toda saída é **material para o Curador**, e a Curadoria só existe quando um humano a conduz.

**Consequência operacional**: nenhuma observação do ACE pode chegar ao paciente sem passar por um Curador. Não existe canal direto ACE → paciente.

## P2 — Compatibilidade não é medida

Sem score, nota, percentual, ranking, estrela, medalha, posição, "top", "melhor", "recomendado". O ACE produz **frases explicadas**.

**Por que absoluto**: um número cria autoridade que ele não tem. "87%" parece um fato; é uma opinião com máscara de matemática. E convida à obediência de quem deveria julgar.

**Fronteira com o que já existe**: o score do Perfil de Prioridades mede aderência a critérios que o próprio paciente ponderou com as próprias palavras — outra coisa, protegida por outras regras (`ACE_FOUNDATION.md` §0.2). O ACE não herda essa licença.

## P3 — A necessidade clínica vem primeiro, sempre

Compatibilidade opera **dentro** do conjunto clinicamente adequado, nunca sobre ele. Afinidade jamais compensa inadequação técnica.

**Teste de violação**: se uma observação do ACE puder ser usada para justificar a inclusão de alguém que a necessidade clínica excluiu, a arquitetura está errada.

## P4 — Fato e interpretação nunca se misturam

Toda informação declara o que é:

| Tipo | Exemplo de forma | Quem pode gerar |
|---|---|---|
| **FATO** | "Concluiu residência em [X] em [ano]." | Médico (declarado), fonte pública verificada |
| **PREFERÊNCIA DECLARADA** | "O paciente disse: 'preciso entender cada passo'." | Paciente (com a fala preservada) |
| **INTERPRETAÇÃO** | "O Curador observou, em [data], que…" | Curador, sempre nomeado e datado |
| **OBSERVAÇÃO DO SISTEMA** | "Há alinhamento entre [fala] e [declaração]." | ACE, sempre com as duas pontas visíveis |

Interpretação **nunca** é apresentada como fato. Fato **nunca** é apresentado como conclusão.

## P5 — Origem obrigatória

Toda informação carrega: **origem** (Paciente · Médico · Curador · Sistema · Fonte pública verificada), **data** e, quando é interpretação, **autor**.

Informação sem origem não é exibida. Não existe "o sistema sabe".

## P6 — Explicabilidade legível por gente

O Curador deve poder perguntar "por que isto apareceu?" e receber resposta em português, referenciando as pontas concretas.

**Proibido**: "porque o algoritmo calculou", "score de similaridade", "modelo indicou". Se a justificativa não é legível, a observação não existe.

## P7 — Não discriminação

Nenhum atributo protegido ou pessoal sem relevância clínica entra, direta ou indiretamente. Proxies contam como violação: CEP como substituto de renda, nome como substituto de origem, foto como qualquer coisa.

Lista fechada em [`ACE_BOUNDARIES.md`](ACE_BOUNDARIES.md) §1.

## P8 — Direito à revisão

- **O Curador** discorda de qualquer observação; a discordância vira registro, não erro.
- **O médico** corrige o que declarou sobre si; nada sobre ele é imutável sem que ele possa responder.
- **O paciente** revê e corrige o que disse; a Evidência de Curadoria é dele.

Nenhuma observação vira julgamento permanente sobre uma pessoa.

## P9 — Ausência é ausência

Falta de informação nunca vira negativa, penalidade ou insinuação. Aparece como **lacuna nomeada**, com o que fazer a respeito.

Herdado do Método (`EstadoInformacao`) e inegociável: um médico com cadastro incompleto não é um médico pior.

## P10 — Situação, nunca essência

O ACE descreve **o que foi dito e o que foi declarado** — nunca o que alguém *é*.

✅ "Ela disse que prefere decidir com tempo."
❌ "Paciente indecisa." / "Perfil ansioso." / "Médico frio."

Rótulo sobre pessoa é defeito, não estilo.

## P11 — Contexto, não permanência

Uma observação vale **para este caso, neste momento**. Não cria histórico de reputação, não acompanha a pessoa entre Cases, não vira nota de cadastro.

## P12 — Simetria de dignidade

O que protege o paciente protege o médico. Nenhum dos dois é pontuado, rotulado, classificado ou exposto ao outro sem consentimento e propósito.

## P13 — Evidência antes de opinião

Onde houver fato declarado e opinião, o fato vem primeiro e a opinião vem nomeada. Reputação informal, boato e "todo mundo sabe" não entram (`ACE_BOUNDARIES.md` §1).

## P14 — Transparência de mudança

Toda regra do ACE é versionada e datada. Mudança de comportamento é registrada e revisável — nunca deriva silenciosa.

## P15 — Minimalismo de dado

Só entra o que serve a uma decisão concreta desta Curadoria. Dado "que pode ser útil um dia" não entra. Menos dado é menos risco, menos viés e menos dano possível.

## P16 — O sistema aceita ser desligado

Se o ACE ficar indisponível, a Curadoria **continua** — mais trabalhosa, nunca impossível. Nenhuma etapa do Método pode depender dele para existir.

É a prova final de que ele é auxílio, não autoridade.

---

## Como um princípio é testado

Cada princípio deve virar, na implementação, pelo menos um **teste automatizado** ou **regra de banco** — o padrão que a plataforma já usa (vocabulário do paciente testado, invariantes por trigger, append-only por trigger).

Princípio que não pode ser verificado é intenção, não princípio.
