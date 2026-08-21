/**
 * A OPÇÃO COMO A PACIENTE A LÊ — a forma, não a origem.
 *
 * Este tipo nasceu dentro do motor ACE (`artifacts/final-curadoria.ts`) e era
 * a forma que AQUELE pipeline entregava. O motor saiu; a forma ficou, porque
 * quem a consome nunca dependeu dele: os painéis do Portal do Paciente
 * (conexão, acompanhamento, relacionamento) recebem estes campos vindos da
 * Curadoria do Método, montados na própria rota a partir de
 * `curadoria.options`.
 *
 * Mantido com os nomes originais de propósito: renomear os campos aqui
 * mudaria quatro componentes e seus testes sem mudar nada do que a pessoa lê.
 * A tradução do vocabulário é trabalho próprio, e não se mistura com a
 * remoção do motor.
 *
 * O que este tipo NUNCA carrega: nota, posição, ranking ou qualquer forma de
 * "melhor". As três opções são caminhos legítimos, e nada aqui as ordena.
 */
export type ProviderPresentation = {
  providerId: string;
  displayName: string;
  professionalSummary: string;
  whyIncluded: string;
  strengthsForThisCase: string[];
  relevantLimitations: string[];
  practicalConsiderations: string[];
};
