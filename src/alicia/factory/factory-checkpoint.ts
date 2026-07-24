import type { FactoryCheckpointStage } from "./types";
import { FACTORY_STAGES } from "./constants";

export class FactoryCheckpointManager {
  getNextStage(completedStages: FactoryCheckpointStage[]): FactoryCheckpointStage | null {
    for (const stage of FACTORY_STAGES) {
      if (!completedStages.includes(stage)) {
        return stage;
      }
    }
    return null;
  }

  getResumeStage(checkpoints: FactoryCheckpointStage[]): FactoryCheckpointStage | null {
    return this.getNextStage(checkpoints);
  }

  stagesToSkip(checkpoints: FactoryCheckpointStage[]): FactoryCheckpointStage[] {
    return [...checkpoints];
  }
}
