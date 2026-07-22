export interface FeatureFlagView {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  description: string;
  atualizado_em: string;
}

export interface FeatureFlagUpdateInput {
  enabled: boolean;
  rollout_percentage: number;
  description?: string;
}
