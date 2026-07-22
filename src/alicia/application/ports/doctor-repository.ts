import type { Doctor, DoctorReadModel } from "@/alicia/domain/doctor";

export interface DoctorRepository {
  findAll(): Doctor[];
  findById(id: string): Doctor | undefined;
  findReadModelById(id: string): DoctorReadModel | undefined;
  findAllReadModels(): DoctorReadModel[];
}
