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
 * 2. **A cena é `patientStudy` — e isto é um FALLBACK TEMPORÁRIO.**
 *
 *    Uma passagem anterior trocou esta cena por `landingAtrium`
 *    (`grand-finale.jpg`), com o argumento de que era o salão que a landing
 *    usa nas próprias bandas. O argumento estava errado porque o arquivo nunca
 *    foi aberto: `grand-finale.jpg` **não é o edifício da Aliviar**. É um
 *    apartamento vazio genérico — luz fria, armários escuros, piso laminado,
 *    radiador, janela europeia. Ficou atrás da casa inteira da paciente.
 *
 *    A revisão foi feita comparando as imagens, não os nomes, e é essa a regra
 *    daqui em diante: asset se confere abrindo.
 *
 *    `cena-6-detalhe.jpg` é o estado imediatamente anterior, confirmado no
 *    histórico (`18d5a04`), e pertence de fato ao conjunto Aliviar em uso. Ele
 *    **não corresponde ao Master Visual oficial** — a referência aprovada
 *    mostra outro edifício, em travertino, cujos arquivos ainda não existem
 *    neste repositório. É um fallback do edifício Aliviar existente enquanto os
 *    assets oficiais não chegam.
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
      <ImmersiveBackdrop scene="patientStudy" variant="patient-intimate" imageOpacity={16} />
    </div>
  );
}
