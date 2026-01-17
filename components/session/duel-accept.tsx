"use client";

import { useState } from "react";
import type { SessionPayload, CompletePayload } from "@/lib/types/api";
import { SessionRunner } from "@/components/session/session-runner";
import { Button } from "@/components/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card";

interface Props {
  token: string;
}

export function DuelAccept({ token }: Props) {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ creatorScore: number | null; opponentScore: number | null } | null>(null);

  if (session) {
    return (
      <div className="space-y-4">
        <SessionRunner initialSession={session} onComplete={refreshSummary} />
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Сравнение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-ink">
              <p>Создатель: <strong>{summary.creatorScore ?? "–"}</strong></p>
              <p>Ты: <strong>{summary.opponentScore ?? "–"}</strong></p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Принять вызов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Ты пройдёшь тот же сет из 7 вопросов. После завершения покажем сравнение.</p>
        <Button type="button" onClick={startDuel} disabled={loading}>
          {loading ? "Загружаем…" : "Играть"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );

  async function startDuel() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "duel", duelToken: token })
      });
      if (!response.ok) {
        throw new Error("duel start failed");
      }
      const payload = (await response.json()) as SessionPayload;
      setSession(payload);
    } catch {
      setError("Дуэль недоступна. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshSummary(payload: CompletePayload) {
    void payload;
    try {
      const response = await fetch(`/api/duel/${token}`);
      if (!response.ok) return;
      const data = (await response.json()) as { creatorScore: number | null; opponentScore: number | null };
      setSummary({ creatorScore: data.creatorScore ?? null, opponentScore: data.opponentScore ?? null });
    } catch {
      // ignore
    }
  }
}
