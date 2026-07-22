import type { FeatureFlagUpdateInput, FeatureFlagView } from "@/governance-flow/contracts/feature-flag";
import { createClient } from "@/lib/supabase/server";

export class FeatureFlagsService {
  async listar(): Promise<FeatureFlagView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, enabled, rollout_percentage, description, updated_at")
      .order("key");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      key: row.key,
      enabled: row.enabled,
      rollout_percentage: row.rollout_percentage,
      description: row.description,
      atualizado_em: row.updated_at,
    }));
  }

  async atualizar(key: string, input: FeatureFlagUpdateInput, updatedBy: string): Promise<FeatureFlagView> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .update({
        enabled: input.enabled,
        rollout_percentage: input.rollout_percentage,
        description: input.description,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select("key, enabled, rollout_percentage, description, updated_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "feature_flag_not_found");
    }

    return {
      key: data.key,
      enabled: data.enabled,
      rollout_percentage: data.rollout_percentage,
      description: data.description,
      atualizado_em: data.updated_at,
    };
  }

  async estaAtiva(key: string): Promise<boolean> {
    const flags = await this.listar();
    const flag = flags.find((f) => f.key === key);
    return flag?.enabled ?? false;
  }
}

export const featureFlags = new FeatureFlagsService();
