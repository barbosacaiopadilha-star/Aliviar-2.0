import { Badge } from "@/components/ui/badge";
import type { PracticeEvidenceSummary } from "@/modules/curadoria/evidencias-pratica-repository";

/**
 * BASE DE EVIDÊNCIAS NA MESA — o estado da INFORMAÇÃO, nunca a correspondência.
 *
 * @metodo GRAMATICA §6 — estado da informação e correspondência não se
 *         confundem: aqui só existe confiança do dado ("verificada",
 *         "declarada", "vencida"), jamais "atende"/"não atende", que é
 *         declaração humana em outro lugar da Mesa.
 *
 * Por isso os rótulos falam de informação e os tons são neutros — nenhum
 * verde/vermelho de veredito. Contagem, não juízo.
 */

type Props = {
  professionals: { professionalProfileId: string; displayName: string }[];
  evidencias: Record<string, PracticeEvidenceSummary>;
};

export function MesaEvidenciasPanel({ professionals, evidencias }: Props) {
  if (professionals.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem profissionais na Rede deste Case.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {professionals.map((professional) => {
        const resumo = evidencias[professional.professionalProfileId];
        if (!resumo || resumo.registrados === 0) {
          return (
            <li key={professional.professionalProfileId} className="rounded border p-2">
              <span className="font-medium">{professional.displayName}</span>
              <p className="text-muted-foreground">Nenhuma evidência de prática registrada ainda.</p>
            </li>
          );
        }
        return (
          <li key={professional.professionalProfileId} className="rounded border p-2 space-y-1">
            <span className="font-medium">{professional.displayName}</span>
            <div className="flex flex-wrap gap-1">
              <Badge variant="default">{`${resumo.registrados} conceitos com informação`}</Badge>
              {resumo.verificados > 0 ? (
                <Badge variant="sage">{`${resumo.verificados} com informação verificada`}</Badge>
              ) : null}
              {resumo.declarados > 0 ? (
                <Badge variant="default">{`${resumo.declarados} apenas declaradas`}</Badge>
              ) : null}
              {resumo.revisaoPendente > 0 ? (
                <Badge variant="default">{`${resumo.revisaoPendente} com verificação vencida`}</Badge>
              ) : null}
              {resumo.divergentes > 0 ? (
                <Badge variant="default">{`${resumo.divergentes} com divergência aberta`}</Badge>
              ) : null}
              {resumo.desatualizados > 0 ? (
                <Badge variant="default">{`${resumo.desatualizados} desatualizadas`}</Badge>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
