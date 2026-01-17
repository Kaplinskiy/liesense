import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseServer } from "@/lib/server/user";
import type { Database } from "@/lib/types/database";

type DuelRow = Database["public"]["Tables"]["duel"]["Row"];

interface Props {
  params: { token: string };
}

export async function GET(_: Request, { params }: Props) {
  if (!params.token) {
    return NextResponse.json({ error: "Token missing" }, { status: 400 });
  }

  const supabase: SupabaseServer = getSupabaseServerClient();
  const duel = await supabase
    .from("duel")
    .select("id, status, expires_at, question_set_id, creator_session_id, opponent_session_id")
    .eq("token", params.token)
    .maybeSingle();

  if (duel.error || !duel.data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const duelData = duel.data as DuelRow;

  let status = duelData.status;
  if (status === "open" && new Date(duelData.expires_at).getTime() < Date.now()) {
    status = "expired";
    // session/start endpoint persists expiry; здесь достаточно вернуть статус пользователю
  }

  const sessionIds = [duelData.creator_session_id, duelData.opponent_session_id].filter(Boolean);
  const sessions = sessionIds.length
    ? await supabase.from("session").select("id, score").in("id", sessionIds)
    : null;

  type SessionScoreRow = Pick<Database["public"]["Tables"]["session"]["Row"], "id" | "score">;
  const scores = (sessions?.data ?? []) as SessionScoreRow[];
  const creatorScore = scores.find((row) => row.id === duelData.creator_session_id)?.score ?? null;
  const opponentScore = scores.find((row) => row.id === duelData.opponent_session_id)?.score ?? null;

  return NextResponse.json({
    status,
    questionSetId: duelData.question_set_id,
    creatorScore,
    opponentScore
  });
}
