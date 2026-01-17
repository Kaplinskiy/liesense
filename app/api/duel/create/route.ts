import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateGuestId } from "@/lib/utils/guest";
import { captureEvent } from "@/lib/analytics/posthog";
import { upsertGuestProfile } from "@/lib/server/user";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseServerClient() as SupabaseClient<any>;
  const guestId = getOrCreateGuestId(request.headers.get("x-guest-id") ?? undefined);
  const user = await upsertGuestProfile(supabase, guestId);
  const userId = (user as { id: string }).id;

  type SessionMeta = {
    id: string;
    user_id: string;
    question_set_id: string;
    completed_at: string | null;
  };

  const { data: sessionRow, error: sessionError } = await supabase
    .from("session")
    .select("id, user_id, question_set_id, completed_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const rawSession: unknown = sessionRow;
  const sessionData = rawSession as SessionMeta;
  if (sessionData.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!sessionData.completed_at) {
    return NextResponse.json({ error: "Finish the session first" }, { status: 409 });
  }

  const token = await createUniqueToken(supabase);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const insertPayload: Database["public"]["Tables"]["duel"]["Insert"] = {
    token,
    question_set_id: sessionData.question_set_id,
    creator_user_id: userId,
    creator_session_id: sessionId,
    status: "open",
    expires_at: expiresAt
  };
  const duelInsert = await supabase
    .from("duel")
    .insert(insertPayload)
    .select("id")
    .single();

  if (duelInsert.error) {
    console.error("duel insert failed", duelInsert.error);
    return NextResponse.json({ error: "Could not create duel" }, { status: 500 });
  }

  await supabase.from("session").update({ duel_id: duelInsert.data.id }).eq("id", sessionId);

  captureEvent("duel_create", { guest_id: guestId, token });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  return NextResponse.json({ token, url: `${baseUrl}/d/${token}` });
}

async function createUniqueToken(client: ReturnType<typeof getSupabaseServerClient>) {
  for (let i = 0; i < 5; i += 1) {
    const token = randomUUID().replace(/-/g, "").slice(0, 8);
    const existing = await client.from("duel").select("id").eq("token", token).maybeSingle();
    if (existing.error && existing.status !== 406) throw existing.error;
    if (!existing.data) return token;
  }
  throw new Error("Unable to generate duel token");
}
