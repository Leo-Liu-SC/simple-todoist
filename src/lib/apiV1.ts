import { NextRequest, NextResponse } from "next/server";
import { requireApiToken } from "./auth";
import { STATUSES } from "./taskMeta";

// Shared helpers for the external bearer-token API (/api/v1).

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Send 'Authorization: Bearer <API_TOKEN>'." },
    { status: 401 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Gate a handler behind the API token. Returns null if authorized, or a
// 401 response to return early.
export function checkAuth(req: NextRequest): NextResponse | null {
  return requireApiToken(req) ? null : unauthorized();
}

export const VALID_STATUSES = STATUSES.map((s) => s.value);

// Normalize a task record (flatten label join rows) for API output.
export function serializeTask(t: Record<string, unknown>) {
  const labels = (t.labels as { label: unknown }[] | undefined)?.map((tl) => tl.label) ?? t.labels;
  return { ...t, labels };
}
