import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDuelByToken } from "@/lib/game/duel";
import { DuelAccept } from "@/components/session/duel-accept";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `LieSense duel ${params.token}`,
    description: "Прими вызов и пройди тот же набор вопросов."
  };
}

export default async function DuelLandingPage({ params }: Props) {
  const duel = await getDuelByToken(params.token);
  if (!duel) return notFound();

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">LieSense Duel</p>
        <h1 className="text-3xl font-semibold text-ink">Тебе бросили вызов</h1>
        <p className="text-ink-light">Пройди тот же сет из семи вопросов и сравни счёт после финиша.</p>
      </header>
      {duel.status === "completed" ? (
        <Card>
          <CardHeader>
            <CardTitle>Дуэль завершена</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-ink">
            <p>Создатель: <strong>{duel.creatorScore ?? "–"}</strong></p>
            <p>Оппонент: <strong>{duel.opponentScore ?? "–"}</strong></p>
          </CardContent>
        </Card>
      ) : duel.status === "expired" ? (
        <Card>
          <CardHeader>
            <CardTitle>Срок дуэли истёк</CardTitle>
          </CardHeader>
          <CardContent className="text-ink-light">
            Создайте новую дуэль с другим сетом вопросов.
          </CardContent>
        </Card>
      ) : (
        <DuelAccept token={params.token} />
      )}
    </main>
  );
}
