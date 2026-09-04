import { JourneyHeader } from "@/components/journey";

import { KitDaCuradoriaCard } from "@/components/admin/kit-da-curadoria-card";

export const metadata = { title: "Documentos" };

/**
 * Os documentos do Supervisor de Jornada — ADR-114.
 *
 * O ACHADO QUE ISTO FECHA. A documentação existia inteira e o Supervisor não
 * alcançava nenhuma peça: o Kit da Curadoria era renderizado só na Visão
 * geral do `/admin`, cujo guard admite `administrador` ou `concierge`. Quem
 * tinha o papel do Supervisor batia em `/acesso-negado` — e é ele quem faz o
 * primeiro contato, quem entrega os três documentos à assistida e quem, pela
 * ADR-100, não desaparece no repasse. **Construção correta, completa e
 * desligada de quem mais precisa dela** — a mesma forma do `/api/health`, que
 * media a saúde para um monitor que não existia.
 *
 * POR QUE É O MESMO COMPONENTE, e não uma lista nova. A ADR-114 diz que a
 * metade "baixar" já existe e está no lugar errado: levar o Kit a uma
 * superfície alcançável é **corrigir alcance**, não construir função nova —
 * e é por isso que cabe na exceção da ADR-073, que congela construção. Uma
 * segunda lista seria uma segunda fonte da verdade sobre quais documentos
 * são os vigentes, e a primeira vez que alguém atualizasse um PDF as duas
 * divergiriam em silêncio. `KIT_DA_CURADORIA` já tem guarda que prova que
 * todo link aponta para arquivo existente: link morto não nasce.
 *
 * PÁGINA PRÓPRIA, e não um cartão na fila. `/atendimento` é a fila de quem
 * chegou — ferramenta do dia, ordenada pelo que falta fazer. Documento não é
 * pendência de ninguém; enfiá-lo ali disputaria atenção com pessoas
 * esperando um gesto.
 *
 * O QUE ESTA TELA NÃO FAZ, dito para ninguém procurar: **enviar**. A ADR-114
 * pede "baixar ou enviar" e o produto não manda e-mail — até 03/09 nem o de
 * redefinição de senha saía para quem não fosse da equipe (`SIM-105`).
 * Enviar depende de a entrega estar provada primeiro. Hoje o envio é o
 * Supervisor anexando à mão, e os pacotes por pessoa na pasta da operação
 * existem exatamente para isso.
 */
export default function DocumentosDoSupervisorPage() {
  return (
    <div className="space-y-6">
      <JourneyHeader
        moment="Documentos"
        context="Tudo o que você usa na operação, sempre na versão vigente. Baixe daqui em vez de guardar cópia — cópia guardada envelhece sem avisar."
        nothingPendingLabel="Nada aqui depende de você: é material de consulta, não fila."
      />

      <KitDaCuradoriaCard />
    </div>
  );
}
