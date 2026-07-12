import { ReviewItem } from "@/components/story/review-item";
import type { SuaHistoriaData } from "@/modules/story/types";

const PARA_QUEM_LABELS: Record<string, string> = {
  "para-mim": "Para mim",
  "para-outra-pessoa": "Para outra pessoa que eu acompanho",
};

const MODALIDADE_LABELS: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  "tanto-faz": "Tanto faz",
};

type StorySummaryProps = {
  data: SuaHistoriaData;
  editable?: boolean;
};

// Apresentação somente-leitura da História — reaproveitada pela etapa de
// revisão do wizard (edição habilitada) e pela tela de detalhe do Caso
// (leitura, ÉPICO 1/SPRINT 2), para nunca duplicar os rótulos.
export function StorySummary({ data, editable = false }: StorySummaryProps) {
  return (
    <div>
      <ReviewItem
        label="Para quem é esta busca?"
        value={data.paraQuem ? PARA_QUEM_LABELS[data.paraQuem] : ""}
        editHref={editable ? "/sua-historia/para-quem" : undefined}
      />
      <ReviewItem
        label="O que motivou esta busca?"
        value={data.motivo ?? ""}
        editHref={editable ? "/sua-historia/motivo" : undefined}
      />
      <ReviewItem
        label="História"
        value={data.historia ?? ""}
        editHref={editable ? "/sua-historia/historia" : undefined}
      />
      <ReviewItem
        label="Informações importantes"
        value={data.informacoesImportantes ?? ""}
        editHref={editable ? "/sua-historia/informacoes" : undefined}
      />
      <ReviewItem
        label="Preferência de conexão"
        value={data.preferenciaModalidade ? MODALIDADE_LABELS[data.preferenciaModalidade] : ""}
        editHref={editable ? "/sua-historia/preferencias" : undefined}
      />
    </div>
  );
}
