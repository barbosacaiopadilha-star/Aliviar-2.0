export interface RegisterCaseRequest {
  patient:
    | { type: "existing"; patient_id: string }
    | {
        type: "new";
        full_name: string;
        preferred_name?: string | null;
        email?: string | null;
        phone?: string | null;
        cpf?: string | null;
        birth_date?: string | null;
        city?: string | null;
        state?: string | null;
        health_plan?: string | null;
      };
  context: {
    title: string;
    objective?: string | null;
    declared_need?: string | null;
    source?: "INTAKE" | "STAFF" | "REFERRAL";
  };
  ownership: {
    manager_id: string;
    operation_id?: string | null;
    curator_id?: string | null;
  };
}

export interface RegisterCaseResponse {
  case_id: string;
  patient_id: string;
  journey_id: string;
  journey_stage: string;
  owner_id: string;
}

export interface CaseRegistrationErrorResponse {
  code: "FORBIDDEN" | "VALIDATION_ERROR" | "DOMAIN_ERROR";
  message: string;
}

export type CaseRegistrationApiResult<T> =
  | { status: 201; body: T }
  | { status: 403; body: CaseRegistrationErrorResponse }
  | { status: 422; body: CaseRegistrationErrorResponse };
