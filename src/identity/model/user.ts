/** Usu├írio autentic├ível ÔÇö identidade de login, independente de papel. */
export type UserKind = "staff" | "patient" | "anonymous";

export interface User {
  id: string;
  email: string | null;
  kind: UserKind;
}

export function createAnonymousUser(): User {
  return { id: "", email: null, kind: "anonymous" };
}

export function createStaffUser(id: string, email: string | null): User {
  return { id, email, kind: "staff" };
}

export function createPatientUser(id: string, email: string | null): User {
  return { id, email, kind: "patient" };
}
