import { activityFromDb, db, jsonOrError, newId } from "../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const leadId = Number(new URL(request.url).searchParams.get("leadId"));
  if (!Number.isSafeInteger(leadId)) return Response.json({ error: "Valid leadId is required" }, { status: 400 });
  const response = await db(`activities?lead_id=eq.${leadId}&select=*&order=created_at.desc`);
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  return Response.json({ activities: result.map(activityFromDb) });
}

export async function POST(request: Request) {
  const input = await request.json() as { leadId?: number; kind?: string; note?: string };
  const leadId = Number(input.leadId);
  if (!Number.isSafeInteger(leadId) || !input.kind?.trim() || !input.note?.trim()) return Response.json({ error: "leadId, kind and note are required" }, { status: 400 });
  const row = { id: newId(), lead_id: leadId, kind: input.kind.trim(), note: input.note.trim(), created_at: new Date().toISOString() };
  const response = await db("activities", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
  const result = await jsonOrError(response);
  if (result instanceof Response) return result;
  return Response.json({ activity: activityFromDb(result[0]) }, { status: 201 });
}
