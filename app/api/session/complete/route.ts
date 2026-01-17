import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateGuestId } from "@/lib/utils/guest";
import { captureEvent } from "@/lib/analytics/posthog";
import { upsertGuestProfile } from "@/lib/server/user";
import type { Database } from "@/lib/types/database";
import type { SupabaseServer } from "@/lib/server/user";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const supabase: SupabaseServer = getSupabaseServerClient();
  const guestId = getOrCreateGuestId(request.headers.get("x-guest-id") ?? undefined);
  const user = await upsertGuestProfile(supabase, guestId);
  const userProfile = (user as unknown) as {
    id: string;
    streak_current: number | null;
    streak_last_date: string | null;
  };

  type SessionMeta = {
    id: string;
    user_id: string;
    question_set_id: string;
    mode: "regular" | "daily" | "duel";
    num_questions: number;
    duel_id: string | null;
  };

  const session = await supabase
    .from("session")
    .select("id, user_id, question_set_id, mode, num_questions, duel_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (session.error || !session.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const sessionData = (session.data as unknown) as SessionMeta;
  if (sessionData.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  type AnswerRow = { is_correct: boolean; question: { trap_type: string } | null };

  const answers = await supabase
    .from("session_answer")
    .select("is_correct, question:question_id(trap_type)")
    .eq("session_id", sessionId);

  if (answers.error) {
    console.error("answers fetch failed", answers.error);
    return NextResponse.json({ error: "Could not fetch answers" }, { status: 500 });
  }

  const answerRows = (answers.data as unknown as AnswerRow[]) ?? [];
  const numCorrect = answerRows.filter((row) => row.is_correct).length;
  const score = numCorrect;
  const completedAt = new Date().toISOString();

  const sessionUpdate: Database["public"]["Tables"]["session"]["Update"] = {
    score,
    completed_at: completedAt
  };

  await supabase
    .from("session")
    // @ts-expect-error Supabase types misinfer update payload
    .update(sessionUpdate)
    .eq("id", sessionId);

  let streak = { current: userProfile.streak_current ?? 0, updated: false };
  if (sessionData.mode === "daily") {
    streak = await updateStreak(
      supabase,
      userProfile.id,
      userProfile.streak_current ?? 0,
      userProfile.streak_last_date
    );
  }

  const errorProfile = buildErrorProfile(answerRows);
  await maybeCompleteDuel(supabase, sessionData.duel_id);

  const result = {
    score,
    numCorrect,
    errorProfile,
    streak
  };

  captureEvent("session_complete", {
    guest_id: guestId,
    session_id: sessionId,
    score,
    num_correct: numCorrect,
    mode: sessionData.mode
  });

  return NextResponse.json(result);
}

function buildErrorProfile(
  rows: Array<{ is_correct: boolean; question: { trap_type: string } | null }>
) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    if (row.is_correct) return;
    const trap = row.question?.trap_type;
    if (!trap) return;
    counts.set(trap, (counts.get(trap) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trapType, count]) => ({ trapType, count }));
}

async function updateStreak(
  client: ReturnType<typeof getSupabaseServerClient>,
  userId: string,
  current: number,
  lastDate?: string | null
) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  let streakCurrent = current || 0;
  let updated = false;

  if (lastDate === todayStr) {
    return { current: streakCurrent, updated };
  }

  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (lastDate === yesterday) {
    streakCurrent += 1;
  } else {
    streakCurrent = 1;
  }

  updated = true;
  const profileUpdate: Database["public"]["Tables"]["user_profile"]["Update"] = {
    streak_current: streakCurrent,
    streak_last_date: todayStr
  };

  await client
    .from("user_profile")
    // @ts-expect-error Supabase types misinfer update payload
    .update(profileUpdate)
    .eq("id", userId);

  return { current: streakCurrent, updated };
}

async function maybeCompleteDuel(client: ReturnType<typeof getSupabaseServerClient>, duelId?: string | null) {
  if (!duelId) return;
  const duel = await client
    .from("duel")
    .select("id, status, creator_session_id, opponent_session_id")
    .eq("id", duelId)
    .maybeSingle();

  type DuelMeta = {
    id: string;
    status: "open" | "completed" | "expired";
    creator_session_id: string | null;
    opponent_session_id: string | null;
  };

  if (duel.error || !duel.data) return;
  const duelData = (duel.data as unknown) as DuelMeta;
  if (duelData.status !== "open") return;
  if (!duelData.creator_session_id || !duelData.opponent_session_id) return;

  const sessions = await client
    .from("session")
    .select("id, completed_at")
    .in("id", [duelData.creator_session_id, duelData.opponent_session_id]);

  if (sessions.error) return;
  type DuelSessionRow = { id: string; completed_at: string | null };
  const duelSessions = (sessions.data as unknown as DuelSessionRow[]) ?? [];
  const bothCompleted = duelSessions.every((session) => session.completed_at);
  if (bothCompleted) {
    await client
      .from("duel")
      // @ts-expect-error Supabase types misinfer update payload
      .update({ status: "completed" })
      .eq("id", duelId);
  }
}
