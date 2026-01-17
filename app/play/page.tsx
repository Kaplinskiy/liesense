import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/game/session";
import { SessionRunner } from "@/components/session/session-runner";
import { getSubjectById } from "@/lib/data/themes";
import { HomeButton } from "@/components/home-button";

interface PlaySessionPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function PlaySessionPage({ searchParams }: PlaySessionPageProps) {
  const subjectParam = typeof searchParams?.subject === "string" ? searchParams?.subject : undefined;
  const selection = getSubjectById(subjectParam);

  if (!selection) {
    redirect("/start");
  }

  const session = await getSession({
    mode: "regular",
    topicSlug: selection.subject.topicSlug,
    questionSetTitle: selection.subject.questionSetTitle,
    subjectSlug: selection.subject.id
  });

  return (
    <main className="space-y-5">
      <HomeButton />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          {selection.theme.name} · {selection.subject.name}
        </p>
        <h1 className="text-3xl font-semibold text-ink">Найди ложь в 7 вопросах</h1>
        <p className="text-ink-light">{selection.subject.description}</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Загружаем сет…</p>}>
        <SessionRunner initialSession={session} subjectSlug={selection.subject.id} />
      </Suspense>
    </main>
  );
}
