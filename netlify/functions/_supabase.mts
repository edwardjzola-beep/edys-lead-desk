const SUPABASE_URL =
  process.env.SUPABASE_URL ?? Netlify.env.get("SUPABASE_URL");
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? Netlify.env.get("SUPABASE_SECRET_KEY");

export async function db(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY)
    return Response.json(
      { error: "Database is not configured" },
      { status: 503 },
    );
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_SECRET_KEY);
  headers.set("authorization", `Bearer ${SUPABASE_SECRET_KEY}`);
  headers.set("content-type", "application/json");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers });
}

export function newId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

export function leadFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    contactName: row.contact_name,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    country: row.country,
    caseType: row.case_type,
    source: row.source,
    stage: row.stage,
    applicationOpened: Boolean(row.application_opened),
    nextAction: row.next_action,
    followUpDate: row.follow_up_date ?? "",
    summary: row.summary,
    emailDraft: row.email_draft,
    tags: JSON.stringify(row.tags ?? []),
    status: row.status,
    convertedAt: row.converted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function activityFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    leadId: row.lead_id,
    kind: row.kind,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function jsonOrError(response: Response) {
  if (response.ok) return response.json();
  const detail = await response.text();
  return Response.json(
    { error: "Database request failed", detail },
    { status: response.status },
  );
}
