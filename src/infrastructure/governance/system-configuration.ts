import type {
  GlobalMessagesConfig,
  MaintenanceConfig,
  SlaPolicyConfig,
  SystemConfigurationSnapshot,
  UploadLimitsConfig,
} from "@/governance-flow/contracts/system-configuration";
import { POLITICAS_SLA } from "@/workflow-flow/contracts/sla-operacional";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_UPLOAD_LIMITS: UploadLimitsConfig = {
  max_bytes: 10 * 1024 * 1024,
  allowed_mime_types: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const DEFAULT_MAINTENANCE: MaintenanceConfig = { enabled: false, message: "" };
const DEFAULT_GLOBAL_MESSAGES: GlobalMessagesConfig = { banner: null };

const DEFAULT_SLA: SlaPolicyConfig[] = POLITICAS_SLA.map((p) => ({
  fila: p.fila,
  tempo_esperado_horas: p.tempo_esperado_horas,
  tempo_limite_horas: p.tempo_limite_horas,
  responsavel: p.responsavel,
}));

export class SystemConfigurationService {
  async obterSnapshot(): Promise<SystemConfigurationSnapshot> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("system_configuration").select("key, value, updated_at");

    if (error || !data?.length) {
      return {
        sla_policies: DEFAULT_SLA,
        upload_limits: DEFAULT_UPLOAD_LIMITS,
        maintenance: DEFAULT_MAINTENANCE,
        global_messages: DEFAULT_GLOBAL_MESSAGES,
        atualizado_em: new Date().toISOString(),
      };
    }

    const byKey = new Map(data.map((row) => [row.key, row]));
    const latest = data.reduce((max, row) => (row.updated_at > max ? row.updated_at : max), data[0].updated_at);

    return {
      sla_policies: (byKey.get("sla_policies")?.value as SlaPolicyConfig[] | undefined) ?? DEFAULT_SLA,
      upload_limits: (byKey.get("upload_limits")?.value as UploadLimitsConfig | undefined) ?? DEFAULT_UPLOAD_LIMITS,
      maintenance: (byKey.get("maintenance")?.value as MaintenanceConfig | undefined) ?? DEFAULT_MAINTENANCE,
      global_messages:
        (byKey.get("global_messages")?.value as GlobalMessagesConfig | undefined) ?? DEFAULT_GLOBAL_MESSAGES,
      atualizado_em: latest,
    };
  }

  async atualizarParcial(
    input: Partial<{
      sla_policies: SlaPolicyConfig[];
      upload_limits: UploadLimitsConfig;
      maintenance: MaintenanceConfig;
      global_messages: GlobalMessagesConfig;
    }>,
    updatedBy: string,
  ): Promise<SystemConfigurationSnapshot> {
    const supabase = await createClient();
    const entries = Object.entries(input) as Array<[string, unknown]>;

    for (const [key, value] of entries) {
      const { error } = await supabase.from("system_configuration").upsert({
        key,
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        throw new Error(error.message);
      }
    }

    return this.obterSnapshot();
  }
}

export const systemConfiguration = new SystemConfigurationService();

export async function obterPoliticasSlaConfiguradas(): Promise<SlaPolicyConfig[]> {
  const snapshot = await systemConfiguration.obterSnapshot();
  return snapshot.sla_policies;
}

export async function obterLimitesUploadConfigurados(): Promise<UploadLimitsConfig> {
  const snapshot = await systemConfiguration.obterSnapshot();
  return snapshot.upload_limits;
}
