import { normalizeEmail, normalizePhone } from "./phone";
import type { CrmContactSummary } from "./types";

export type DuplicateMatchReason = "phone" | "email";

export type DuplicateMatch = {
  contact: CrmContactSummary;
  reasons: DuplicateMatchReason[];
};

export function findPossibleDuplicates(
  candidates: CrmContactSummary[],
  input: { phone?: string | null; email?: string | null; excludeContactId?: string },
): DuplicateMatch[] {
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);

  if (!phone && !email) return [];

  const matches = new Map<string, DuplicateMatch>();

  for (const contact of candidates) {
    if (input.excludeContactId && contact.id === input.excludeContactId) continue;

    const reasons: DuplicateMatchReason[] = [];
    if (phone && contact.phoneNormalized && contact.phoneNormalized === phone) {
      reasons.push("phone");
    }
    if (email && contact.emailNormalized && contact.emailNormalized === email) {
      reasons.push("email");
    }

    if (reasons.length > 0) {
      const existing = matches.get(contact.id);
      if (existing) {
        existing.reasons = Array.from(new Set([...existing.reasons, ...reasons]));
      } else {
        matches.set(contact.id, { contact, reasons });
      }
    }
  }

  return Array.from(matches.values());
}
