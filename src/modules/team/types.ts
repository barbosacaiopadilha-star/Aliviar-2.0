// Tipos do módulo team (SPRINT OPERACIONAL 1) — gestão de papéis/permissões
// de equipe interna. Nunca lida com "paciente"/"profissional" como papéis
// concedíveis por aqui (esses têm fluxo próprio de criação, ver
// src/modules/profiles) — só papéis internos (administrador, curador_medico).

export const MANAGEABLE_ROLE_SLUGS = ["administrador", "curador_medico"] as const;

export type ManageableRoleSlug = (typeof MANAGEABLE_ROLE_SLUGS)[number];

export type TeamMember = {
  profileId: string;
  displayName: string;
  email: string;
  roles: string[];
};

export type AuditAction = "role_granted" | "role_revoked";

export type AuditLogEntry = {
  id: number;
  actorId: string | null;
  actorName: string | null;
  action: AuditAction;
  targetProfileId: string | null;
  targetName: string | null;
  roleName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type TeamActionResult = { success: true } | { success: false; error: string };
