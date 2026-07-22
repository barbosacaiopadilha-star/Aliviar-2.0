export interface RegistrarCasoDeclaradoRequest {
  full_name: string;
  preferred_name?: string;
  birth_date?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  health_plan?: string;
  journey_title: string;
  journey_objective?: string;
  manager_id: string;
  priority?: string;
  opened_at?: string;
}

export interface RegistrarCasoDeclaradoResponse {
  caso_id: string;
  paciente_id: string;
  jornada_id: string;
}
