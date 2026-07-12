import { z } from "zod";

import { MANAGEABLE_ROLE_SLUGS } from "./types";

export const teamRoleActionSchema = z.object({
  profileId: z.string().uuid(),
  roleSlug: z.enum(MANAGEABLE_ROLE_SLUGS),
});

export type TeamRoleActionInput = z.infer<typeof teamRoleActionSchema>;
