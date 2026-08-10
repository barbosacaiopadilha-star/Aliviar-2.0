import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { StateMark } from "@/components/ui/state-mark";
import { Textarea } from "@/components/ui/textarea";
import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { PAPEIS_VISUAIS } from "@/foundation/estado-visual";

export const metadata = {
  title: "Fundação — superfície de prova",
  robots: { index: false, follow: false },
};

/**
 * SUPERFÍCIE DE PROVA DA FUNDAÇÃO.
 *
 * Não é tela de produto e não pertence a nenhuma trilha: existe para que a
 * Fundação possa ser **vista**, comparada entre viewports e verificada por
 * alguém que não escreveu o código. É rota autenticada (o middleware exige
 * sessão), não indexável, e nenhuma superfície do produto liga para cá.
 *
 * Reprodução: `/foundation`, com qualquer sessão válida. Sem seed, sem fixture,
 * sem dado real — os estados abaixo são derivados de fatos sintéticos escritos
 * no próprio arquivo.
 */

const CENARIOS: ReadonlyArray<{ nome: string; fatos: FatosDoCaso }> = [
  {
    nome: "história não iniciada",
    fatos: { historia: { existe: false, enviadaEm: null }, caso: null, relatorio: null, pendencia: null },
  },
  {
    nome: "história enviada",
    fatos: {
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: null,
      relatorio: null,
      pendencia: null,
    },
  },
  {
    nome: "em curadoria",
    fatos: {
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "curador-1", concluidoEm: null },
      relatorio: null,
      pendencia: null,
    },
  },
  {
    nome: "emitido — ainda NÃO entregue",
    fatos: {
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "curador-1", concluidoEm: null },
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: null },
      pendencia: null,
    },
  },
  {
    nome: "entregue",
    fatos: {
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "curador-1", concluidoEm: null },
      relatorio: { existe: true, emitidoEm: "2026-08-01T10:00:00Z", entregueEm: "2026-08-02T10:00:00Z" },
      pendencia: null,
    },
  },
  {
    nome: "pendência aguarda a paciente",
    fatos: {
      historia: { existe: true, enviadaEm: "2026-07-01T10:00:00Z" },
      caso: { curadorResponsavel: "curador-1", concluidoEm: null },
      relatorio: null,
      pendencia: { aberta: true, aguardando: "PACIENTE" },
    },
  },
  {
    nome: "indeterminado (fallback seguro)",
    fatos: { historia: null, caso: null, relatorio: null, pendencia: null },
  },
];

function Bloco({ id, titulo, nota, children }: { id: string; titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3 border-t border-border pt-6">
      <div>
        <h2 className="font-sans text-lg font-semibold text-ink">{titulo}</h2>
        {nota ? <p className="mt-1 max-w-reading text-sm text-ink-muted">{nota}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function FoundationShowcasePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl text-ink">Fundação da repaginação</h1>
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Superfície de prova. Não é tela de produto: existe para que os primitivos e o contrato de
          estado possam ser vistos lado a lado, em desktop e no celular, por quem for verificar.
        </p>
      </header>

      <Bloco
        id="ev-fnd-001"
        titulo="EV-FND-001 · Button"
        nota="Quatro variantes semanticamente justificadas, três tamanhos, e os estados que um botão precisa ter. Nenhuma variante por tela."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primária</Button>
          <Button variant="secondary">Secundária</Button>
          <Button variant="ghost">Discreta</Button>
          <Button variant="danger">Destrutiva</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Desabilitado</Button>
          <Button isLoading>Carregando</Button>
          <Button variant="secondary" disabled>
            Secundária desabilitada
          </Button>
        </div>
      </Bloco>

      <Bloco
        id="ev-fnd-002"
        titulo="EV-FND-002 · StateMark — cor, símbolo e texto"
        nota="Os cinco papéis da gramática certificada. Cada um traz símbolo próprio: em escala de cinza, no daltonismo ou impresso, a distinção sobrevive."
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {PAPEIS_VISUAIS.map((papel) => (
            <StateMark key={papel} papel={papel}>
              {papel}
            </StateMark>
          ))}
        </div>
        <p className="max-w-reading text-xs text-ink-muted">
          Verde é processual — nunca desfecho favorável. Vermelho é impedimento — nunca divergência.
        </p>
      </Bloco>

      <Bloco
        id="ev-fnd-003"
        titulo="EV-FND-003 · Badge"
        nota="Decorativo por decisão: não tem variante de sucesso nem de erro. Quem afirma estado é o StateMark, acima."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge>padrão</Badge>
          <Badge variant="accent">accent</Badge>
          <Badge variant="sage">sage</Badge>
          <Badge variant="gold">gold</Badge>
          <Badge variant="attention">attention</Badge>
        </div>
      </Bloco>

      <Bloco
        id="ev-fnd-004"
        titulo="EV-FND-004 · Contrato de estado"
        nota="O mesmo conjunto de fatos, lido uma vez. Paciente e Curador leem traduções diferentes do MESMO estado — e é isso que impede duas telas de se contradizerem."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-2 pr-4 font-medium">cenário</th>
                <th className="py-2 pr-4 font-medium">estado</th>
                <th className="py-2 pr-4 font-medium">paciente lê</th>
                <th className="py-2 pr-4 font-medium">Curador lê</th>
                <th className="py-2 font-medium">de quem é a vez</th>
              </tr>
            </thead>
            <tbody>
              {CENARIOS.map(({ nome, fatos }) => {
                const leitura = lerEstado(fatos);
                return (
                  <tr key={nome} className="border-b border-border align-top">
                    <td className="py-2 pr-4 text-ink-muted">{nome}</td>
                    <td className="py-2 pr-4">
                      <StateMark papel={leitura.tom}>{leitura.estado}</StateMark>
                    </td>
                    <td className="py-2 pr-4 text-ink">{leitura.rotuloPaciente}</td>
                    <td className="py-2 pr-4 text-ink">{leitura.rotuloCurador}</td>
                    <td className="py-2 text-ink-muted">{leitura.quemAge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Bloco>

      <Bloco
        id="ev-fnd-005"
        titulo="EV-FND-005 · Card e EmptyState"
        nota="Uma superfície, um vazio. O vazio diz título, motivo e próximo passo — nunca só “nada aqui”."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2">
            <h3 className="font-sans text-base font-semibold text-ink">Superfície</h3>
            <p className="text-sm text-ink-muted">
              O contêiner compartilhado. A densidade muda por sotaque; a gramática, não.
            </p>
            <StateMark papel="atencao">Aguarda você</StateMark>
          </Card>
          <Card>
            <EmptyState
              title="Nenhum documento ainda"
              description="Quando a Aliviar enviar algo para você, aparece aqui."
            />
          </Card>
        </div>
      </Bloco>

      <Bloco
        id="ev-fnd-006"
        titulo="EV-FND-006 · Campos"
        nota="Semântica nativa primeiro: label associada, foco visível, alvo de toque adequado."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* `Input` EXIGE `label` na assinatura — a acessibilidade nasce com o
              primitivo, e não há caminho para esquecê-la. */}
          <Input id="fnd-input" label="Campo de texto" placeholder="Escreva aqui" />
          <Input id="fnd-erro" label="Campo com erro" error="Diga o que faltou." defaultValue="" />
          <div className="space-y-1">
            <label className="text-sm text-ink" htmlFor="fnd-select">
              Seleção
            </label>
            <Select id="fnd-select" defaultValue="a">
              <option value="a">Primeira opção</option>
              <option value="b">Segunda opção</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-ink" htmlFor="fnd-textarea">
              Texto longo
            </label>
            <Textarea id="fnd-textarea" rows={3} placeholder="Um parágrafo" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Marcação" />
            <Radio name="fnd-radio" label="Escolha única" defaultChecked />
          </div>
        </div>
      </Bloco>
    </main>
  );
}
