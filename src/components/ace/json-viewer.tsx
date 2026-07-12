type JsonViewerProps = {
  value: unknown;
  maxHeightClassName?: string;
};

// Visualizador genérico de qualquer payload do ACE — os 8 tipos de artefato
// (Narrative..Shortlist) e os metadados de evento já têm sua própria forma;
// em vez de 8+ renderizadores dedicados, um JSON legível e navegável (rolar,
// selecionar, copiar) atende à necessidade real desta sprint (observar e
// depurar), sem inventar uma representação visual por tipo.
export function JsonViewer({ value, maxHeightClassName = "max-h-96" }: JsonViewerProps) {
  return (
    <pre
      className={`overflow-auto rounded-md border border-border bg-canvas/60 p-3 text-xs leading-relaxed text-ink ${maxHeightClassName}`}
    >
      <code>{JSON.stringify(value, null, 2)}</code>
    </pre>
  );
}
