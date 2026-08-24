/**
 * A ATMOSFERA DA CASA — a cena do Fundador, na receita da landing (24/08).
 *
 * "Vamos implementar as configurações visuais da landing": a casa da
 * paciente deixa o corredor a 16% de opacidade e passa a ter a MESMA
 * gramática da vitrine — uma cena fotográfica em força total como cenário
 * contínuo, e os cards de vidro por cima, cristalizando na leitura.
 *
 * A cena é dela em casa, à noite, ao telefone com a pasta da Aliviar no
 * colo — o retrato exato do que esta casa é: o acompanhamento chegando até
 * onde a pessoa está. Duas versões geradas (retrato 941×1672 para o
 * celular, 16:9 1672×941 para o computador) servidas por `<picture>`: o
 * aparelho baixa SÓ a que vai usar. WebP primeiro, JPEG de reserva; a
 * fotografia é decorativa (`alt=""`) — todo o conteúdo vive em HTML.
 *
 * Sobre a cena corre um véu de marfim leve (no CSS): a landing não tem
 * texto solto sobre a foto, esta casa tem (limiares, linhas, links) — o
 * véu é o que garante a leitura deles sem apagar o ambiente.
 */
export function PatientAmbientLayer() {
  const base = "/paciente/inicio";
  return (
    <div className="patient-ambient-layer" aria-hidden="true">
      <picture>
        <source
          media="(min-width: 768px)"
          type="image/webp"
          srcSet={`${base}-desktop.webp`}
          width={1672}
          height={941}
        />
        <source
          media="(min-width: 768px)"
          type="image/jpeg"
          srcSet={`${base}-desktop.jpg`}
          width={1672}
          height={941}
        />
        <source type="image/webp" srcSet={`${base}-mobile.webp`} width={941} height={1672} />
        {/* eslint-disable-next-line @next/next/no-img-element -- fotografia de
            ambiente servida por <picture>: o next/image não expressa a troca
            por breakpoint com dois arquivos de proporções diferentes. */}
        <img
          src={`${base}-mobile.jpg`}
          alt=""
          width={941}
          height={1672}
          decoding="async"
          loading="eager"
          fetchPriority="high"
          className="patient-ambient-layer__img"
        />
      </picture>
      <div className="patient-ambient-layer__veu" />
    </div>
  );
}
