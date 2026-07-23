import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { NewPatientInput, PatientRecord } from "@/case-registration/model/patient";
import type { PatientRepositoryPort } from "@/case-registration/ports/case-registration-ports";

function mapPatientRow(row: Record<string, unknown>): PatientRecord {
  return {
    id: row.id as string,
    fullName: row.full_name as string,
    preferredName: (row.preferred_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    cpf: (row.cpf as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    status: (row.status as PatientRecord["status"]) ?? "ACTIVE",
    createdAt: row.created_at as string,
  };
}

export class SupabasePatientRepository implements PatientRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(input: NewPatientInput, createdAt: string): Promise<PatientRecord> {
    const { data, error } = await this.supabase
      .from("patients")
      .insert({
        id: randomUUID(),
        full_name: input.fullName.trim(),
        preferred_name: input.preferredName?.trim() ?? null,
        email: input.email?.trim() ?? null,
        phone: input.phone?.trim() ?? null,
        cpf: input.cpf?.trim() ?? null,
        birth_date: input.birthDate ?? null,
        city: input.city?.trim() ?? null,
        state: input.state?.trim() ?? null,
        health_plan: input.healthPlan?.trim() ?? null,
        status: "ACTIVE",
        created_at: createdAt,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Falha ao criar paciente.");
    }

    return mapPatientRow(data);
  }

  async findById(id: string): Promise<PatientRecord | null> {
    const { data, error } = await this.supabase.from("patients").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapPatientRow(data) : null;
  }

  async findByCpf(cpf: string): Promise<PatientRecord | null> {
    const normalized = cpf.trim();
    const { data, error } = await this.supabase.from("patients").select("*").eq("cpf", normalized).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapPatientRow(data) : null;
  }
}
