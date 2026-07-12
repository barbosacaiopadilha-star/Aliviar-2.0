# Exemplos — P002 (Case Builder)

Reaproveita as três narrativas de `docs/ace/04-specs/P001-intake/examples.md` como entrada, para manter rastreabilidade entre os dois protocolos.

## Caso simples

**Entrada (Narrative, do P001):**

> "A cliente relata ansiedade crescente nas últimas oito semanas, associada a uma mudança recente de emprego. Não há tratamento anterior relacionado. Ela busca um espaço de conversa com um psicólogo, sem sentir necessidade de um acompanhamento mais estruturado neste momento. A decisão que precisa tomar é encontrar esse profissional; o objetivo esperado é ter um espaço de escuta para lidar com a ansiedade atual."

**Saída (DecisionCase, representação legível):**

- **Declaração de decisão**
  - Decisão: "Encontrar um profissional (psicólogo) para conversar sobre a ansiedade atual."
  - Objetivo: "Ter um espaço de escuta para lidar com a ansiedade."
  - Tipo: fato relatado.
  - Evidência de origem: "A decisão que precisa tomar é encontrar esse profissional; o objetivo esperado é ter um espaço de escuta..."
- **Restrições obrigatórias:** nenhuma relatada.
- **Preferências:**
  - "Prefere um espaço de conversa, sem necessidade de acompanhamento mais estruturado." — fato relatado; evidência: "sem sentir necessidade de um acompanhamento mais estruturado neste momento".
- **Informações ausentes:** nenhuma essencial sinalizada.

## Caso intermediário

**Entrada (Narrative, do P001):**

> "O cliente foi orientado por seu médico a avaliar uma cirurgia no joelho, já realizou ressonância e uma consulta com ortopedista há duas semanas. Sua principal dúvida é decidir se a cirurgia é realmente necessária — ele relata receio de passar por um procedimento sem necessidade real. Uma restrição relevante para a decisão é uma viagem de trabalho importante prevista para daqui a três meses, período em que ele não gostaria de estar em recuperação. A decisão que precisa tomar é se segue ou não com a cirurgia; o objetivo esperado é ter clareza e segurança antes de decidir."

**Saída (DecisionCase, representação legível):**

- **Declaração de decisão**
  - Decisão: "Decidir se a cirurgia no joelho é realmente necessária."
  - Objetivo: "Ter clareza e segurança antes de decidir."
  - Tipo: fato relatado.
  - Evidência de origem: "Sua principal dúvida é decidir se a cirurgia é realmente necessária."
- **Restrições obrigatórias:**
  - "Não estar em recuperação durante a viagem de trabalho prevista para daqui a três meses." — fato relatado; evidência: "uma viagem de trabalho importante prevista para daqui a três meses, período em que ele não gostaria de estar em recuperação".
- **Preferências:** nenhuma além da restrição acima.
- **Informações ausentes:** nenhuma essencial sinalizada.

## Caso complexo

**Entrada (Narrative, do P001):**

> "O cliente relata um quadro de dor/desconforto presente há quase um ano, já tendo passado por fisioterapia, uso de medicação para dor, e exames de imagem (ressonância e tomografia), sem melhora percebida. Ele expressa cansaço com tentativas anteriores e o receio de não ser realmente ouvido antes de receber um diagnóstico. Neste momento, ainda não tem uma decisão específica definida — está em uma etapa de entender quais opções existem antes de decidir qualquer próximo passo. O objetivo esperado é sentir que sua história foi de fato compreendida antes de qualquer indicação."

**Saída (DecisionCase, representação legível):**

- **Declaração de decisão**
  - Decisão: `null`.
  - Objetivo: "Sentir que sua história foi de fato compreendida antes de qualquer indicação."
  - Tipo: fato relatado (quanto ao objetivo).
  - Evidência de origem: "o objetivo esperado é sentir que sua história foi de fato compreendida antes de qualquer indicação".
- **Restrições obrigatórias:** nenhuma relatada.
- **Preferências:**
  - "Prefere ser ouvido integralmente antes de receber qualquer diagnóstico ou indicação." — fato relatado; evidência: "o receio de não ser realmente ouvido antes de receber um diagnóstico".
- **Informações ausentes:**
  - `relatedField: "decision"` — "A decisão específica que o cliente precisa tomar ainda não está definida — ele está em fase de entender as opções disponíveis."
