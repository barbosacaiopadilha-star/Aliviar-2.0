import { PublicFooter } from "@/components/landing/public-footer";
import { PublicHeader } from "@/components/landing/public-header";
import { cn } from "@/components/ui/cn";

type PublicChromeProps = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

export function PublicChrome({ children, className }: PublicChromeProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      <PublicHeader />

      <main id="conteudo-principal" className="flex-1">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
