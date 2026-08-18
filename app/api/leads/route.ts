import { db, jsonOrError, leadFromDb, newId } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const writable = new Set(["contactName", "organization", "email", "phone", "country", "caseType", "source", "stage", "nextAction", "followUpDate", "summary", "emailDraft", "tags", "status"]);
const columns: Record<string, string> = { contactName: "contact_name", organization: "organization", email: "email", phone: "phone", country: "country", caseType: "case_type", source: "source", stage: "stage", nextAction: "next_action", followUpDate: "follow_up_date", summary: "summary", emailDraft: "email_draft", tags: "tags", status: "status" };

function toDb(input: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const key of writable) {
    if (!(key in input)) continue;
    let value = input[key];
    if (key === "tags" && typeof value === "string") { try { value = JSON.parse(value); } catch { value = []; } }
    if (key === "followUpDate" && value === "") value = null;
    row[columns[key]] = value;
  }
  return row;
}

export async function GET() {
  const response = await db("leads?select=*&order=created_at.desc");
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  return Response.json({ leads: result.map(leadFromDb) });
}

export async function POST(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  if (!String(input.contactName ?? "").trim()) return Response.json({ error: "Contact name is required" }, { status: 400 });
  const now = new Date().toISOString();
  const row = { ...toDb(input), id: newId(), status: "active", created_at: now, updated_at: now };
  const response = await db("leads", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  return Response.json({ lead: leadFromDb(result[0]) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  const id = Number(input.id);
  if (!Number.isSafeInteger(id)) return Response.json({ error: "Valid lead id is required" }, { status: 400 });
  const row: Record<string, unknown> = { ...toDb(input), updated_at: new Date().toISOString() };
  if (input.status === "converted") row.converted_at = new Date().toISOString();
  const response = await db(`leads?id=eq.${id}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  if (!result.length) return Response.json({ error: "Lead not found" }, { status: 404 });
  return Response.json({ lead: leadFromDb(result[0]) });
}

export async function DELETE(request: Request) {
  const input = await request.json() as { id?: number };
  const id = Number(input.id);
  if (!Number.isSafeInteger(id)) return Response.json({ error: "Valid lead id is required" }, { status: 400 });
  const response = await db(`leads?id=eq.${id}`, { method: "DELETE", headers: { prefer: "return=representation" } });
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  if (!result.length) return Response.json({ error: "Lead not found" }, { status: 404 });
  return Response.json({ deleted: true, id });
}
