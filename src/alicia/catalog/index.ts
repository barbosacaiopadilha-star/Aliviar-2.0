import { createCatalogRepositories } from "@/alicia/catalog/composition-root";
import {
  mapDoctorReadModelToViewModel,
  mapDoctorReadModelsToViewModels,
} from "@/alicia/infrastructure/mappers/doctor-view-mapper";
import type { Doctor } from "@/alicia/types";

const { doctorRepository } = createCatalogRepositories("mock");

export function listDoctors(): Doctor[] {
  return mapDoctorReadModelsToViewModels(doctorRepository.findAllReadModels());
}

export function getDoctorById(id: string): Doctor | undefined {
  const readModel = doctorRepository.findReadModelById(id);
  return readModel ? mapDoctorReadModelToViewModel(readModel) : undefined;
}

export { createCatalogRepositories } from "@/alicia/catalog/composition-root";
