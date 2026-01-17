import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateGuestId } from "@/lib/utils/guest";
import { captureEvent } from "@/lib/analytics/posthog";
import { upsertGuestProfile } from "@/lib/server/user";
import type { Database } from "@/lib/types/database";
import type { SupabaseServer } from "@/lib/server/user";

export async function POST(request: Request) {
  const { sessionId, questionId, chosenOption, timeMs } = await request.json();
  const option = String(chosenOption ?? "").toUpperCase();
  if (!sessionId || !questionId || !["A", "B", "C"].includes(option)) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const supabase: SupabaseServer = getSupabaseServerClient();
  const guestId = getOrCreateGuestId(request.headers.get("x-guest-id") ?? undefined);
  const user = await upsertGuestProfile(supabase, guestId);

  type SessionMeta = { id: string; user_id: string; question_set_id: string };
  const session = await supabase
    .from("session")
    .select("id, user_id, question_set_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (session.error || !session.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  const rawSession: unknown = session.data;
  const sessionData = rawSession as SessionMeta;
  if (sessionData.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  type QuestionMeta = {
    id: string;
    question_set_id: string;
    lie_option: "A" | "B" | "C";
    explanation: string;
    correct_fact: string;
  };
  const question = await supabase
    .from("question")
    .select("id, question_set_id, lie_option, explanation, correct_fact")
    .eq("id", questionId)
    .eq("question_set_id", sessionData.question_set_id)
    .maybeSingle();

  if (question.error || !question.data) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const rawQuestion: unknown = question.data;
  const questionData = rawQuestion as QuestionMeta;

  const isCorrect = questionData.lie_option === option;
  const insertPayload: Database["public"]["Tables"]["session_answer"]["Insert"] = {
    session_id: sessionId,
    question_id: questionId,
    chosen_option: option as "A" | "B" | "C",
    is_correct: isCorrect,
    time_ms: timeMs ?? null
  };
  const insert = await supabase
    .from("session_answer")
    // @ts-expect-error Supabase typed client misinfers insert payload
    .insert(insertPayload)
    .select("id")
    .single();

  if (insert.error) {
    if (insert.error.code === "23505") {
      return NextResponse.json({ error: "Answer already recorded" }, { status: 409 });
    }
    console.error("answer insert failed", insert.error);
    return NextResponse.json({ error: "Could not store answer" }, { status: 500 });
  }

  const wrong = await supabase
    .from("session_answer")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId)
    .eq("is_correct", false);

  const total = await supabase
    .from("session_answer")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);

  const wrongRate = computeWrongRate(wrong.count ?? 0, total.count ?? 0);
  const response = {
    isCorrect,
    lieOption: questionData.lie_option,
    explanation: questionData.explanation,
    correctFact: questionData.correct_fact,
    stats: { wrongRate }
  };

  captureEvent("answer_submit", {
    guest_id: guestId,
    session_id: sessionId,
    question_id: questionId,
    is_correct: isCorrect,
    chosen: option,
    time_ms: timeMs
  });

  return NextResponse.json(response);
}

function computeWrongRate(wrong: number, total: number) {
  if (!total) return undefined;
  return Number((wrong / total).toFixed(2));
}
