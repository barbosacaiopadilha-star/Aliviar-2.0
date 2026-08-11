import { ImmersiveBackdrop } from "@/components/shared/immersive-backdrop";

/**
 * A ATMOSFERA DA CASA — provisória, até o Master Visual chegar.
 *
 * A3b (adendo) · esta camada era feita à mão: três `div`s com gradiente
 * próprio, imagem a 22% de opacidade e um véu de 90–96% por cima. O resultado
 * é que a arquitetura **existia no DOM e não existia na tela** — a paciente
 * fazia login e o edifício desaparecia.
 *
 * Duas coisas mudam, e nenhuma delas é uma imagem nova:
 *
 * 1. **O componente passa a ser o da Aliviar pública.** `ImmersiveBackdrop` é
 *    o mesmo que compõe o hero e as bandas da landing, e ele já trazia — sem
 *    nunca ter sido usado aqui — a variante `patient-intimate`. A casa tinha
 *    uma segunda linguagem de ambiente para a mesma marca.
 *
 * 2. **A cena é o corredor de transição do pacote oficial** (03).
 *
 *    O fallback acabou. Este é o ambiente que o Master Visual designa para
 *    "entre etapas" — e é exatamente o que a casa da paciente é: ela não está
 *    numa sala específica, está *dentro* do edifício, entre uma etapa e a
 *    próxima.
 *
 *    Antes daqui já passaram dois erros que valem como aviso. `grand-finale.jpg`
 *    ficou atrás da casa inteira porque a chave se chamava "atrium" e ninguém
 *    abriu o arquivo — era um apartamento vazio genérico, nem Aliviar. Depois,
 *    `cena-6-detalhe.jpg` entrou como fallback declarado. A regra que sobrou:
 *    **asset se confere abrindo, nunca pelo nome.**
 *
 * A opacidade é a mesma das bandas da landing (`imageOpacity={16}` em
 * `LandingSection`), e é um teto de legibilidade, não um alvo estético: a 30%
 * a fotografia aparecia atrás do corpo do texto, e legibilidade não se negocia
 * por atmosfera. Quem carrega a arquitetura com força é o hero. Quando os
 * assets oficiais chegarem, os dois números voltam à mesa — mas a ordem é
 * sempre a mesma: **asset certo primeiro, opacidade depois.**
 */
export function PatientAmbientLayer() {
  return (
    <div className="patient-ambient-layer" aria-hidden="true">
      <ImmersiveBackdrop scene="transicao" variant="patient-intimate" imageOpacity={16} />
    </div>
  );
}
