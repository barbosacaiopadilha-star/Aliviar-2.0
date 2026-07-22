import type { Institution } from "@/alicia/domain/institution";

export interface InstitutionRepository {
  findById(id: string): Institution | undefined;
  findAll(): Institution[];
}
