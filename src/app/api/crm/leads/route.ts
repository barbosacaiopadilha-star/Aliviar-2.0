import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ingestSiteLead } from "@/modules/crm/integrations/site-lead";
import { siteLeadInputSchema } from "@/modules/crm/schema";

export async function POST(request: Request) {
  const secret = process.env.CRM_SITE_LEAD_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
      return NextResponse.json({ error: "Endpoint indisponível." }, { status: 503 });
    }
  } else {
    const provided = request.headers.get("x-crm-lead-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = siteLeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const created = await ingestSiteLead(supabase, parsed.data);
    return NextResponse.json({ success: true, contactId: created.contactId }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível registrar o lead." },
      { status: 500 },
    );
  }
}
