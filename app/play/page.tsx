import { Suspense } from "react";
import { getSession } from "@/lib/game/session";
import { SessionRunner } from "@/components/session/session-runner";

export default async function PlaySessionPage() {
  const session = await getSession({ mode: "regular" });

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">LieSense Session</p>
        <h1 className="text-3xl font-semibold text-ink">Семь раундов, в каждом спрятана ложь</h1>
        <p className="text-ink-light">После выбора сразу показываем объяснение и корректный факт, чтобы знание закрепилось.</p>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Загружаем сет…</p>}>
        <SessionRunner initialSession={session} />
      </Suspense>
    </main>
  );
}
