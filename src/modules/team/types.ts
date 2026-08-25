// Tipos do módulo team (SPRINT OPERACIONAL 1) — gestão de papéis/permissões
// de equipe interna. Nunca lida com "paciente"/"profissional" como papéis
// concedíveis por aqui (esses têm fluxo próprio de criação, ver
// src/modules/profiles) — só papéis internos.
//
// ATENDENTE E CONCIERGE ENTRARAM EM 25/08 — achado da curadoria simulada do
// Fundador. A lista era do MVP e nunca acompanhou a Correção de Domínio: os
// dois papéis ganharam telas, RLS e transferência auditada, mas o admin não
// tinha COMO concedê-los — a própria tela de Equipe mostrava "Concierge 0"
// no painel e não oferecia o botão. Sem Concierge com papel, o Case não tem
// para quem ser transferido depois da Curadoria: era bloqueador do primeiro
// dia. A exclusão deliberada continua sendo só paciente/profissional.
export const MANAGEABLE_ROLE_SLUGS = [
  "administrador",
  "curador_medico",
  "atendente",
  "concierge",
] as const;

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
