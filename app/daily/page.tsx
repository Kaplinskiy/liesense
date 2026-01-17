import { Suspense } from "react";
import { getSession } from "@/lib/game/session";
import { SessionRunner } from "@/components/session/session-runner";

export default async function DailyChallengePage() {
  const session = await getSession({ mode: "daily" });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">LieSense Daily</p>
        <h1 className="text-3xl font-semibold text-ink">Челлендж дня</h1>
        <p className="text-ink-light">Один сет из семи вопросов публикуем каждое утро. Проходи и держи streak.</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Загружаем daily…</p>}>
        <SessionRunner initialSession={session} />
      </Suspense>
    </main>
  );
}
