import type { SupabaseClient } from "@supabase/supabase-js";

import type { PublicToPortalFlowResult } from "@/vertical-slice/services/run-public-to-portal-flow";

export interface PatientPortalFlowRecord {
  patientId: string;
  authUserId: string;
  journeyId: string;
  handoffId: string;
  sessionId: string | null;
}

export class PatientPortalFlowStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByPatientId(patientId: string): Promise<PatientPortalFlowRecord | null> {
    const { data, error } = await this.supabase
      .from("patient_portal_flows")
      .select("patient_id, auth_user_id, journey_id, handoff_id, session_id")
      .eq("patient_id", patientId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      patientId: data.patient_id,
      authUserId: data.auth_user_id,
      journeyId: data.journey_id,
      handoffId: data.handoff_id,
      sessionId: data.session_id,
    };
  }

  async findByJourneyId(journeyId: string): Promise<PatientPortalFlowRecord | null> {
    const { data, error } = await this.supabase
      .from("patient_portal_flows")
      .select("patient_id, auth_user_id, journey_id, handoff_id, session_id")
      .eq("journey_id", journeyId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      patientId: data.patient_id,
      authUserId: data.auth_user_id,
      journeyId: data.journey_id,
      handoffId: data.handoff_id,
      sessionId: data.session_id,
    };
  }

  async upsert(flow: PatientPortalFlowRecord): Promise<void> {
    const { error } = await this.supabase.from("patient_portal_flows").upsert({
      patient_id: flow.patientId,
      auth_user_id: flow.authUserId,
      journey_id: flow.journeyId,
      handoff_id: flow.handoffId,
      session_id: flow.sessionId,
    });

    if (error) throw new Error(error.message);
  }

  toPublicFlow(record: PatientPortalFlowRecord): PublicToPortalFlowResult {
    return {
      handoffId: record.handoffId,
      journeyId: record.journeyId,
      patientId: record.patientId,
      sessionId: record.sessionId ?? record.handoffId,
    };
  }
}
