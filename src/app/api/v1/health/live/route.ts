import { createApiRequestContext, withRequestContextHeaders } from "@/lib/production/api-request-context";

export async function GET(request: Request) {
  const context = createApiRequestContext(request);
  const body = {
    status: "alive",
    timestamp: new Date().toISOString(),
  };
  return withRequestContextHeaders(Response.json(body, { status: 200 }), context);
}
