import { NextResponse } from "next/server";
import type { SupabaseServer } from "@/lib/server/user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateGuestId } from "@/lib/utils/guest";
import { captureEvent } from "@/lib/analytics/posthog";
import { upsertGuestProfile } from "@/lib/server/user";
import type { Database } from "@/lib/types/database";
import type { SessionPayload } from "@/lib/types/api";

type QuestionRow = Database["public"]["Tables"]["question"]["Row"];

type SelectParams = {
  mode: "regular" | "daily" | "duel";
  duelToken?: string;
  date?: string;
  topicSlug?: string;
  questionSetTitle?: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const mode: "regular" | "daily" | "duel" = body.mode ?? "regular";
  const duelToken: string | undefined = body.duelToken;
  const date: string | undefined = body.date;
  const numQuestions = clampQuestions(body.numQuestions);
  const topicSlug: string | undefined = body.topicSlug;
  const questionSetTitle: string | undefined = body.questionSetTitle;
  const subjectSlug: string | undefined = body.subjectSlug;

  const supabase = getSupabaseServerClient();
  const guestId = getOrCreateGuestId(request.headers.get("x-guest-id") ?? undefined);
  const user = await upsertGuestProfile(supabase, guestId);
  const userProfile = (user as unknown) as { id: string };

  const selection = await selectQuestionSet(supabase, {
    mode,
    duelToken,
    date,
    topicSlug,
    questionSetTitle
  });

  if (!selection) {
    return NextResponse.json({ error: "No question set available" }, { status: 404 });
  }

  const questions = await fetchQuestions(supabase, selection.questionSetId);
  if (!questions.length) {
    return NextResponse.json({ error: "Question set has no content" }, { status: 409 });
  }

  const preparedQuestions =
    mode === "duel" ? questions.slice(0, numQuestions) : selectRandomQuestions(questions, numQuestions);

  const newSession: Database["public"]["Tables"]["session"]["Insert"] = {
    user_id: userProfile.id,
    question_set_id: selection.questionSetId,
    mode,
    duel_id: selection.duelId ?? null,
    num_questions: numQuestions
  };

  const sessionInsert = await supabase
    .from("session")
    // @ts-expect-error Supabase types misinfer insert payload
    .insert(newSession)
    .select("id, score")
    .single();

  if (sessionInsert.error) {
    console.error("session insert failed", sessionInsert.error);
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  const sessionRow = (sessionInsert.data as unknown) as { id: string; score: number | null };

  if (mode === "duel" && selection.duelId) {
    await attachDuelOpponent(supabase, selection.duelId, userProfile.id, sessionRow.id);
  }

  const payload: SessionPayload = {
    sessionId: sessionRow.id,
    questionSetId: selection.questionSetId,
    score: sessionRow.score ?? 0,
    questions: preparedQuestions.slice(0, numQuestions).map(mapQuestion)
  };

  captureEvent("session_start", {
    guest_id: guestId,
    mode,
    question_set_id: selection.questionSetId,
    duel_id: selection.duelId ?? undefined,
    subject_slug: subjectSlug,
    topic_slug: topicSlug
  });

  return NextResponse.json(payload);
}

function clampQuestions(value?: number) {
  const requested = Number(value ?? 7);
  return Math.min(7, Math.max(5, requested || 7));
}

async function selectQuestionSet(client: SupabaseServer, params: SelectParams) {
  if (params.questionSetTitle) {
    const columns = params.topicSlug ? "id, topic!inner(slug)" : "id";
    const query = client.from("question_set").select(columns).eq("title", params.questionSetTitle);
    if (params.topicSlug) {
      query.eq("topic.slug", params.topicSlug);
    }
    const match = await query.maybeSingle();
    if (match.error) {
      if (match.status === 406) return null;
      throw match.error;
    }
    if (!match.data) return null;
    const row = (match.data as unknown) as { id: string };
    return { questionSetId: row.id };
  }

  if (params.mode === "daily") {
    const targetDate = params.date ? new Date(params.date) : new Date();
    const isoDate = targetDate.toISOString().slice(0, 10);
    const daily = await client
      .from("daily_challenge")
      .select("question_set_id")
      .eq("date", isoDate)
      .maybeSingle();

    if (daily.error) {
      if (daily.status === 406) return null;
      throw daily.error;
    }
    if (!daily.data) return null;
    const dailyData = (daily.data as unknown) as { question_set_id: string };
    return { questionSetId: dailyData.question_set_id };
  }

  if (params.mode === "duel") {
    if (!params.duelToken) return null;
    const duel = await client
      .from("duel")
      .select("id, status, expires_at, question_set_id, creator_user_id, opponent_user_id")
      .eq("token", params.duelToken)
      .maybeSingle();

    if (duel.error) {
      if (duel.status === 406) return null;
      throw duel.error;
    }
    if (!duel.data) return null;
    const duelData = (duel.data as unknown) as {
      id: string;
      status: "open" | "completed" | "expired";
      expires_at: string;
      question_set_id: string;
    };
    if (duelData.status !== "open") return null;
    const expired = new Date(duelData.expires_at).getTime() < Date.now();
    if (expired) {
      await client
        .from("duel")
        // @ts-expect-error Supabase types
        .update({ status: "expired" })
        .eq("id", duelData.id);
      return null;
    }
    return { questionSetId: duelData.question_set_id, duelId: duelData.id };
  }

  const regular = await client
    .from("question_set")
    .select("id")
    .eq("type", "regular")
    .eq("is_active", true);

  if (regular.error) {
    if (regular.status === 406) return null;
    throw regular.error;
  }

  if (!regular.data || regular.data.length === 0) {
    return null;
  }

  const regularRows = (regular.data as unknown as { id: string }[]) ?? [];
  const randomIndex = Math.floor(Math.random() * regularRows.length);
  const chosen = regularRows[randomIndex];
  return { questionSetId: chosen.id };
}

async function fetchQuestions(client: SupabaseServer, questionSetId: string) {
  const { data, error } = await client
    .from("question")
    .select("id, prompt, stmt_a, stmt_b, stmt_c")
    .eq("question_set_id", questionSetId)
    .order("created_at");
  if (error) throw error;
  return data as QuestionRow[];
}

function selectRandomQuestions(rows: QuestionRow[], limit: number) {
  if (rows.length <= limit) return [...rows];
  const pool = [...rows];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, limit);
}

function mapQuestion(question: QuestionRow) {
  const options = shuffleOptions([
    { id: `${question.id}-A`, label: "A" as const, text: question.stmt_a },
    { id: `${question.id}-B`, label: "B" as const, text: question.stmt_b },
    { id: `${question.id}-C`, label: "C" as const, text: question.stmt_c }
  ]);
  return {
    id: question.id,
    prompt: question.prompt,
    options
  };
}

function shuffleOptions<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function attachDuelOpponent(
  client: SupabaseServer,
  duelId: string,
  userId: string,
  sessionId: string
) {
  const existing = await client
    .from("duel")
    .select("creator_user_id, opponent_user_id, opponent_session_id")
    .eq("id", duelId)
    .maybeSingle();
  if (existing.error || !existing.data) return;
  const duelExisting = (existing.data as unknown) as {
    opponent_session_id: string | null;
  };
  if (duelExisting.opponent_session_id) return;
  await client
    .from("duel")
    // @ts-expect-error Supabase types
    .update({ opponent_user_id: userId, opponent_session_id: sessionId })
    .eq("id", duelId);
}
