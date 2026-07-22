import type { FilaOperacionalCodigo } from "@/workflow-flow/contracts/filas-operacionais";
import type { ResponsavelView } from "@/experience-flow/contracts/jornada-view";

export interface SlaPolicyConfig {
  fila: FilaOperacionalCodigo;
  tempo_esperado_horas: number;
  tempo_limite_horas: number;
  responsavel: ResponsavelView["tipo"];
}

export interface UploadLimitsConfig {
  max_bytes: number;
  allowed_mime_types: string[];
}

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
}

export interface GlobalMessagesConfig {
  banner: string | null;
}

export interface SystemConfigurationSnapshot {
  sla_policies: SlaPolicyConfig[];
  upload_limits: UploadLimitsConfig;
  maintenance: MaintenanceConfig;
  global_messages: GlobalMessagesConfig;
  atualizado_em: string;
}

export type SystemConfigurationKey =
  | "sla_policies"
  | "upload_limits"
  | "maintenance"
  | "global_messages";
