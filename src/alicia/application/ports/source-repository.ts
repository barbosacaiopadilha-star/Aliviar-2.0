import type { Source } from "@/alicia/domain/source";

export interface SourceRepository {
  findById(id: string): Source | undefined;
  findByDoctorId(doctorId: string): Source[];
  findAll(): Source[];
}
