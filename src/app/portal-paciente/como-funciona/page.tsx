import { SemCuradoria } from "@/components/curadoria/sem-curadoria";
import type { Metadata } from "next";

import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { Card } from "@/components/ui/card";
import { buildJornada } from "@/modules/curadoria/jornada";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";

export const metadata: Metadata = { title: "Como está sendo feita" };

// TELA 3 — COMO SUA CURADORIA ESTÁ SENDO REALIZADA
//
// Qual pergunta esta tela responde?
//   "O que exatamente vocês fazem com o que eu contei?"
//
// A tela existe para que o silêncio da etapa técnica não vire abandono
// (Experiência §Momento 5 — o vale da jornada). Ela mostra que há trabalho
// acontecendo mostrando **trabalho humano**: quem faz o quê, em que ordem.
//
// O que nunca faz: nomear mecanismo interno, protocolo ou cálculo; usar
// "processando"; ou prometer etapa que o registro não sustenta.

// Carrega a Curadoria do próprio paciente. A RLS já garante que ele só
// enxerga o Caso dele — nunca passamos id pela URL, para que não exista nem
// a tentação de olhar o de outra pessoa.
async function loadMinhaCuradoria() {
  await requireRole("paciente");
  const supabase = await createServerSupabaseClient();
  const [caseId] = await listCaseIds(supabase);
  if (!caseId) return null;
  return loadCuradoriaRecord(supabase, caseId);
}

// As seis etapas, ditas como o paciente as vive. Os nomes internos das fases
// do COS nunca aparecem aqui (Experience §7).
const PASSOS = [
  {
    titulo: "Sua história",
    texto:
      "Seu Curador escuta tudo antes de organizar qualquer coisa, e devolve organizado até você reconhecer: “é exatamente isso”.",
    quem: "Você e seu Curador",
  },
  {
    titulo: "O que precisa ser decidido",
    texto:
      "A conversa vira material de trabalho: o que é necessidade, o que é limite, o que é receio. Nada é acrescentado além do que você disse.",
    quem: "Seu Curador",
  },
  {
    titulo: "Suas prioridades",
    texto:
      "Vocês distribuem cem pontos entre o que mais importa para você. Cada peso fica registrado com a frase que o originou — e nada avança sem a sua validação.",
    quem: "Você decide, seu Curador registra",
  },
  {
    titulo: "A análise",
    texto:
      "Suas prioridades são aplicadas aos profissionais que a Aliviar já aprovou, por critério próprio e independente. Nenhum profissional paga para estar aqui.",
    quem: "Seu Curador, apoiado pela organização do sistema",
  },
  {
    titulo: "Seu Dossiê",
    texto:
      "Seu Curador escolhe três caminhos e escreve, para cada um, por que ele está ali, o que oferece e o que custa. A escolha das três é dele — nunca do sistema.",
    quem: "Seu Curador",
  },
  {
    titulo: "A apresentação",
    texto:
      "As opções são sempre apresentadas por uma pessoa, que explica as diferenças e responde suas dúvidas. A decisão final é exclusivamente sua.",
    quem: "Você e seu Curador",
  },
] as const;

export default async function ComoFuncionaPage() {
  const record = await loadMinhaCuradoria();
  if (!record) return <SemCuradoria />;
  const jornada = buildJornada(record);

  return (
    <div className="space-y-8">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">Como sua Curadoria é feita</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Toda Curadoria da Aliviar segue exatamente a mesma sequência — a sua não é diferente.
          Isto é o que acontece entre a nossa conversa e o momento em que você decide.
        </p>
      </header>

      <ol className="space-y-4">
        {PASSOS.map((passo, index) => (
          <li key={passo.titulo}>
            <Card className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-xl text-brand-gold" aria-hidden="true">
                  {index + 1}
                </span>
                <h2 className="font-sans text-base font-medium text-ink">{passo.titulo}</h2>
              </div>
              <p className="max-w-reading text-sm leading-relaxed text-ink-muted">{passo.texto}</p>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{passo.quem}</p>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="border-brand-gold/40 space-y-3">
        <h2 className="font-sans text-base font-semibold text-ink">
          Três coisas que nunca mudam
        </h2>
        <ul className="max-w-reading space-y-2 text-sm leading-relaxed text-ink">
          <li>Nenhum profissional paga para estar na nossa rede, nem para aparecer no seu Dossiê.</li>
          <li>Nenhuma opção é escolhida por um sistema — a seleção é sempre de uma pessoa, com nome.</li>
          <li>A decisão final é sua, no seu tempo. Não existe prazo para você responder.</li>
        </ul>
      </Card>

      <p className="max-w-reading text-sm text-ink-muted">
        Sua Curadoria está sendo conduzida por {jornada.curatorName}.
      </p>

      <WhatsappContact topics={["duvida"]} />
    </div>
  );
}
