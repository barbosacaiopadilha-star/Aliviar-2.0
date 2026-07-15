// Registro local, opcional e best-effort de falhas do Golden Set — ver
// docs/ace/05-knowledge/golden-set-testing.md. Só é chamado quando uma
// fixture falha; nunca em caso de sucesso. Nunca escreve chave, system
// prompt, prompt integral, headers ou dado de paciente real (as fixtures
// hoje são sempre sintéticas) — e mesmo assim passa todo `output` por
// `sanitizeForLog` antes de gravar. Nunca envia para Vercel, banco ou
// qualquer serviço externo — só um arquivo local, fora do Git.

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { sanitizeForLog } from "./sanitize-for-log";

export type GoldenFailureRecord = {
  protocol: string;
  fixture: string;
  runTimestamp: string;
  modelId: string | null;
  durationMs: number;
  output: unknown;
  failedExpectation: string;
  errorCode: string | null;
};

const RESULTS_ROOT = path.resolve(__dirname, "../../.golden-results");

// Remove por código de ponto (não por regex de caracteres combinantes,
// para evitar depender de literais Unicode difíceis de auditar no
// fonte) os diacríticos gerados por normalize("NFD") (ex.: "ã" -> "a" +
// acento combinante) — usado só para nomes de arquivo previsíveis em
// ASCII, nunca para alterar o conteúdo gravado.
const COMBINING_DIACRITICS_START = 0x0300;
const COMBINING_DIACRITICS_END = 0x036f;

function stripDiacritics(text: string): string {
  return Array.from(text)
    .filter((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      return codePoint < COMBINING_DIACRITICS_START || codePoint > COMBINING_DIACRITICS_END;
    })
    .join("");
}

function slugify(text: string): string {
  return stripDiacritics(text.toLowerCase().normalize("NFD"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function writeGoldenFailure(record: GoldenFailureRecord): void {
  try {
    const runDir = path.join(RESULTS_ROOT, record.runTimestamp);
    mkdirSync(runDir, { recursive: true });

    const fileName = `${slugify(record.protocol)}-${slugify(record.fixture)}.json`;
    const sanitized = {
      protocol: record.protocol,
      fixture: record.fixture,
      timestamp: record.runTimestamp,
      modelId: record.modelId,
      durationMs: record.durationMs,
      failedExpectation: record.failedExpectation,
      errorCode: record.errorCode,
      output: sanitizeForLog(record.output),
    };

    writeFileSync(path.join(runDir, fileName), JSON.stringify(sanitized, null, 2), "utf-8");
  } catch {
    // Nunca deixa a suíte falhar por causa do diagnóstico opcional — só
    // avisa no terminal, sem nenhum detalhe do erro original (que pode
    // conter caminho de arquivo ou outro detalhe de ambiente).
    console.warn(`[golden] não foi possível gravar o artefato de diagnóstico de ${record.protocol}/${record.fixture}.`);
  }
}
