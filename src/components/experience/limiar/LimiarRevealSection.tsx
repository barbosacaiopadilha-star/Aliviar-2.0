import type { LandingRevealLine } from "./landing-line-model";

type LimiarRevealSectionProps = {
  lines: LandingRevealLine[];
  className: string;
  label?: string;
};

export function LimiarRevealSection({ lines, className, label }: LimiarRevealSectionProps) {
  return (
    <section className={className} {...(label ? { "aria-label": label } : {})}>
      {lines.map((line, index) => (
        <p
          key={line.text}
          className={`limiar__voice limiar__reveal-line limiar__reveal-line--${index + 1}`}
          style={{ animationDelay: `${line.delayMs}ms` }}
        >
          {line.text}
        </p>
      ))}
    </section>
  );
}
