import type { Doctor, DoctorFilters, FilterOptions } from "@/alicia/types";
import { BRAZIL_MAP_CENTER, getRadiusCenter, haversineDistanceKm, type MapBounds } from "@/alicia/lib/geo";
import { canonicalizeCityName } from "@/alicia/lib/city-standardization";
import { ES_PRIORITY_CITY_NAMES } from "@/alicia/lib/es-cities";import { isUnconfirmedInstitution } from "@/alicia/lib/profile-narrative";
import { isDoctorWithinBounds } from "@/alicia/lib/discovery-summary";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(doctor: Doctor, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const query = normalize(search);
  const haystack = [
    doctor.name,
    doctor.specialty,
    doctor.location.city,
    doctor.location.state,
    doctor.mainInstitution,
    ...doctor.institutions.map((item) => item.name),
    doctor.graduation.institution,
    ...doctor.residency.map((item) => item.institution),
    ...doctor.fellowships.map((item) => item.institution),
    ...doctor.practiceAreas,
  ]
    .map(normalize)
    .join(" ");

  return haystack.includes(query);
}

export function filterDoctorsByBounds(doctors: Doctor[], bounds: MapBounds): Doctor[] {
  return doctors.filter((doctor) => isDoctorWithinBounds(doctor, bounds));
}

export function filterDoctors(doctors: Doctor[], filters: DoctorFilters): Doctor[] {
  return doctors.filter((doctor) => {
    if (filters.specialty && doctor.specialty !== filters.specialty) {
      return false;
    }

    if (filters.city && canonicalizeCityName(doctor.location.city) !== canonicalizeCityName(filters.city)) {
      return false;
    }
    if (filters.state && doctor.location.state !== filters.state) {
      return false;
    }

    if (filters.university && doctor.graduation.institution !== filters.university) {
      return false;
    }

    if (
      filters.residency &&
      !doctor.residency.some((entry) => entry.institution === filters.residency)
    ) {
      return false;
    }

    if (
      filters.fellowship &&
      !doctor.fellowships.some((entry) => entry.institution === filters.fellowship)
    ) {
      return false;
    }

    if (
      filters.institution &&
      !doctor.institutions.some((entry) => entry.name === filters.institution) &&
      doctor.mainInstitution !== filters.institution
    ) {
      return false;
    }

    if (
      filters.practiceArea &&
      !doctor.practiceAreas.some((area) => area === filters.practiceArea)
    ) {
      return false;
    }

    if (filters.radiusKm && filters.radiusKm > 0) {
      const center = filters.city ? getRadiusCenter(filters.city) : BRAZIL_MAP_CENTER;
      const distance = haversineDistanceKm(
        center.lat,
        center.lng,
        doctor.location.lat,
        doctor.location.lng,
      );
      if (distance > filters.radiusKm) {
        return false;
      }
    }

    if (!matchesSearch(doctor, filters.search)) {
      return false;
    }

    return true;
  });
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)]
    .filter((value) => !isUnconfirmedInstitution(value))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function getFilterOptions(doctors: Doctor[]): FilterOptions {
  const doctorCities = uniqueSorted(doctors.map((doctor) => canonicalizeCityName(doctor.location.city)));
  const cities = uniqueSorted([...ES_PRIORITY_CITY_NAMES, ...doctorCities]);

  return {
    specialties: uniqueSorted(doctors.map((doctor) => doctor.specialty)),
    cities,    states: uniqueSorted(doctors.map((doctor) => doctor.location.state)),
    universities: uniqueSorted(doctors.map((doctor) => doctor.graduation.institution)),
    residencies: uniqueSorted(doctors.flatMap((doctor) => doctor.residency.map((r) => r.institution))),
    fellowships: uniqueSorted(doctors.flatMap((doctor) => doctor.fellowships.map((f) => f.institution))),
    institutions: uniqueSorted([
      ...doctors.map((doctor) => doctor.mainInstitution),
      ...doctors.flatMap((doctor) => doctor.institutions.map((item) => item.name)),
    ]),
    practiceAreas: uniqueSorted(doctors.flatMap((doctor) => doctor.practiceAreas)),
  };
}
