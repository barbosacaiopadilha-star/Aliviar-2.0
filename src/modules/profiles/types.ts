// Tipos do módulo profiles (SPRINT PRODUTO 2). Cobre a fundação de perfil
// de paciente e o registro administrativo de profissional — nunca dado
// clínico, história ou Caso (esses pertencem aos módulos story/ace,
// docs/PRODUCT_ARCHITECTURE.md, seção 11).

export type ProfileStatus = "ativo" | "inativo";
export type PublicationStatus = "publicado" | "nao_publicado";

// Situação do registro conforme consulta ao conselho profissional. `null`
// significa que ninguém consultou — nunca "regular".
export type RegistrationStatus = "regular" | "irregular" | "nao_localizado";

export type ActionResult = { success: true } | { success: false; error: string };

export type PatientProfile = {
  profileId: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationChannel = "email" | "sms" | "whatsapp";

export type CommunicationPreferences = {
  preferredChannel: CommunicationChannel;
  acceptsReminders: boolean;
};

export const DEFAULT_COMMUNICATION_PREFERENCES: CommunicationPreferences = {
  preferredChannel: "email",
  acceptsReminders: true,
};

// Registro administrativo — nunca criado por autocadastro (princípio
// obrigatório da Sprint Produto 2). profileId é opcional: pode existir
// antes de haver conta de login vinculada.
export type ProfessionalProfile = {
  id: string;
  profileId: string | null;
  status: ProfileStatus;
  publicationStatus: PublicationStatus;
  // Perfil de demonstração: existe para exercitar o fluxo, nunca para ser
  // oferecido a um paciente. O banco impede que um deles seja publicado,
  // entre numa seleção ou vire conexão.
  isDemo: boolean;
  displayName: string;
  professionalIdentifier: string;
  crm: string | null;
  crmUf: string | null;
  registrationStatus: RegistrationStatus | null;
  registrationSource: string | null;
  registrationVerifiedAt: string | null;
  registrationVerifiedBy: string | null;
  professionalSummary: string | null;
  institutionName: string | null;
  experienceLevel: string | null;
  intakeApproach: string | null;
  offersContinuousCare: boolean | null;
  availabilityWindow: string | null;
  competencyDomains: string[];
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

// Metadados de documento administrativo do profissional (SPRINT OPERACIONAL
// 1) — o arquivo em si vive no bucket de storage "professional-documents".
export type ProfessionalDocument = {
  id: string;
  filePath: string;
  fileName: string;
  contentType: string | null;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
};

// Documento do próprio paciente (PORTAL DO PACIENTE) — bucket
// "patient-documents", uma pasta por profile_id.
export type PatientDocument = {
  id: string;
  filePath: string;
  fileName: string;
  contentType: string | null;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
};

// Notificação real do paciente (PORTAL DO PACIENTE) — sempre gerada por um
// evento que de fato aconteceu (boas-vindas, ação administrativa).
export type PatientNotification = {
  id: string;
  profileId: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};
