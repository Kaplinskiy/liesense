import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ResultShare } from "@/components/result-share";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card";
import { HomeButton } from "@/components/home-button";

interface Props {
  params: { sessionId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const title = `LieSense result ${params.sessionId}`;
  return {
    title,
    description: "Поделись счётом и зови друзей на дуэль.",
    openGraph: {
      title,
      description: "Сможешь ли ты найти ложь быстрее?",
      url: `${base}/result/${params.sessionId}`,
      siteName: "LieSense"
    }
  };
}

export default async function SessionResultPage({ params }: Props) {
  const supabase = getSupabaseServerClient();
  const session = await supabase
    .from("session")
    .select("id, score, num_questions, mode")
    .eq("id", params.sessionId)
    .maybeSingle();

  if (session.error || !session.data) {
    notFound();
  }

  type SessionSummary = {
    id: string;
    score: number;
    num_questions: number;
    mode: string;
  };
  const sessionData = (session.data as unknown) as SessionSummary;

  return (
    <main className="space-y-6">
      <HomeButton />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">LieSense Result</p>
        <h1 className="text-3xl font-semibold text-ink">Счёт сессии {sessionData.mode}</h1>
        <p className="text-ink-light">Поделись ссылкой — друзья увидят твой прогресс и смогут пройти тот же набор.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Score {sessionData.score}/{sessionData.num_questions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-ink-light">Mode: {sessionData.mode}</p>
          <ResultShare
            sessionId={sessionData.id}
            score={sessionData.score}
            numQuestions={sessionData.num_questions}
          />
        </CardContent>
      </Card>
    </main>
  );
}
