import type { SourceConnector } from "./ports/source-connector";
import { validateNormalizedRecord } from "./validation-layer";
import type { NormalizedConnectorRecord, ValidationResult } from "./types";

export type NormalizerPipelineResult = {
  valid: NormalizedConnectorRecord[];
  invalid: Array<{ record: NormalizedConnectorRecord; validation: ValidationResult }>;
};

export class NormalizerPipeline {
  process<TRaw>(
    connector: SourceConnector<TRaw>,
    rawItems: TRaw[],
  ): NormalizerPipelineResult {
    const valid: NormalizedConnectorRecord[] = [];
    const invalid: NormalizerPipelineResult["invalid"] = [];

    for (const raw of rawItems) {
      const normalized = connector.normalize(raw);
      for (const record of normalized) {
        const validation = connector.validate(record);
        const layerValidation = validateNormalizedRecord(record);
        const mergedIssues = [...validation.issues, ...layerValidation.issues];
        const isValid = validation.valid && layerValidation.valid;

        if (isValid) {
          valid.push(record);
        } else {
          invalid.push({
            record,
            validation: { valid: false, issues: mergedIssues },
          });
        }
      }
    }

    return { valid, invalid };
  }
}
