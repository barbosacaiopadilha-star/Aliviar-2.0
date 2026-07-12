// Módulo profiles (SPRINT PRODUTO 2) — fundação de perfil de paciente e
// registro administrativo de profissional. Comunicação com outros módulos
// só pelo que é exportado aqui, nunca por acesso direto a tabela
// (docs/ENGINEERING_PLAN.md, seção 2).

export * from "./types";
export * from "./patient-schema";
export * from "./professional-schema";
export * from "./patient-account-schema";
export * from "./patient-repository";
export * from "./professional-repository";
export * from "./patient-account-repository";
export * from "./professional-document-repository";
export * from "./patient-document-repository";
export * from "./patient-notification-repository";
export * from "./patient-actions";
export * from "./professional-actions";
export * from "./patient-account-actions";
export * from "./professional-document-actions";
export * from "./patient-document-actions";
export * from "./patient-notification-actions";
