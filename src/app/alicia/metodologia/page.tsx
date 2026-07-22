import type { Metadata } from "next";
import Link from "next/link";

import { AliciaShell } from "@/components/alicia/AliciaShell";

export const metadata: Metadata = {
  title: "Como funciona — AliCIA",
  description: "Entenda como a AliCIA organiza informações sobre formação médica.",
};

const sections = [
  {
    title: "De onde vêm os perfis",
    body: "Montamos cada perfil com informações que já são públicas — registros profissionais, histórico de formação e vínculos com instituições de saúde. O médico não precisa se cadastrar para aparecer aqui.",
  },
  {
    title: "Como conferimos os dados",
    body: "Reunimos o que encontramos em fontes públicas — conselhos regionais, registros acadêmicos, sites de hospitais e universidades. Quando um dado ainda não foi confirmado, marcamos explicitamente no perfil.",
  },
  {
    title: "O que “formação” quer dizer",
    body: "Graduação, residência, especializações e instituições onde a pessoa atua. Isso ajuda a entender a trajetória — não diz como é a consulta nem o resultado de um tratamento.",
  },
  {
    title: "O que não quer dizer",
    body: "Ter perfil aqui não é indicação, selo de qualidade nem promessa de resultado. Organizamos fatos para você decidir com mais clareza — a escolha continua sendo sua.",
  },
];

export default function MetodologiaPage() {
  return (
    <AliciaShell compact>
      <div className="space-y-8">
        <header>
          <h1 className="font-serif text-3xl font-semibold text-ink">Como a AliCIA funciona</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft">
            Transparência para quem está escolhendo um médico. Aqui explicamos o que mostramos, como
            conferimos — e o que fica de fora.
          </p>
        </header>

        {sections.map((section) => (
          <section key={section.title} className="space-y-3 border-b border-line pb-6 last:border-0">
            <h2 className="font-serif text-xl font-semibold text-ink">{section.title}</h2>
            <p className="text-base leading-relaxed text-ink-soft">{section.body}</p>
          </section>
        ))}

        <section className="rounded-xl bg-coral-soft/35 px-6 py-5">
          <h2 className="font-serif text-xl font-semibold text-ink">Nossa posição</h2>
          <p className="mt-3 text-base leading-relaxed text-ink">
            A AliCIA não recomenda médicos. Organizamos informações públicas sobre formação e
            trajetória para que você possa decidir com mais clareza.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/alicia/mapa" className="btn-primary">
            Explorar mapa
          </Link>
          <Link href="/alicia" className="btn-secondary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </AliciaShell>
  );
}
