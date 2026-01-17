import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateGuestId } from "@/lib/utils/guest";
import { captureEvent } from "@/lib/analytics/posthog";
import { upsertGuestProfile } from "@/lib/server/user";
import type { Database } from "@/lib/types/database";

const SHARE_TYPES = new Set(["result", "duel_invite", "daily"]);

export async function POST(request: Request) {
  const { shareType, sessionId, duelToken, channel } = await request.json();
  if (!SHARE_TYPES.has(shareType)) {
    return NextResponse.json({ error: "Invalid shareType" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const guestId = getOrCreateGuestId(request.headers.get("x-guest-id") ?? undefined);
  const user = await upsertGuestProfile(supabase, guestId);
  const userProfile = (user as unknown) as { id: string };

  const duelId = duelToken ? await lookupDuelId(supabase, duelToken) : null;
  const shareRow: Database["public"]["Tables"]["share_event"]["Insert"] = {
    user_id: userProfile.id,
    session_id: sessionId ?? null,
    duel_id: duelId,
    share_type: shareType,
    channel: channel ?? null
  };
  const insert = await supabase
    .from("share_event")
    // @ts-expect-error Supabase types misinfer insert payload
    .insert(shareRow);

  if (insert.error) {
    console.error("share insert failed", insert.error);
    return NextResponse.json({ error: "Could not track share" }, { status: 500 });
  }

  captureEvent("share_click", { guest_id: guestId, share_type: shareType, channel });

  return NextResponse.json({ ok: true });
}

async function lookupDuelId(client: ReturnType<typeof getSupabaseServerClient>, token: string) {
  const duel = await client.from("duel").select("id").eq("token", token).maybeSingle();
  const duelData = (duel.data as unknown) as { id: string } | null;
  return duelData?.id ?? null;
}
