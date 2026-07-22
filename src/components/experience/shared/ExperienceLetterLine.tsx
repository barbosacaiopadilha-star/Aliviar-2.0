type ExperienceLetterLineProps = {
  text: string;
  animationDelay: string;
  className: string;
  signoffClassName?: string;
};

export function ExperienceLetterLine({
  text,
  animationDelay,
  className,
  signoffClassName = "curation-presence__signoff",
}: ExperienceLetterLineProps) {
  const isSignoff = text.startsWith("Com presença");

  return (
    <p
      className={`${className}${isSignoff ? ` ${signoffClassName}` : ""}`}
      style={{ animationDelay }}
    >
      {text.split("\n").map((part, partIndex, parts) => (
        <span key={partIndex}>
          {part}
          {partIndex < parts.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}
