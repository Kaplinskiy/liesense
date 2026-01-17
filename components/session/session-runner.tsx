"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import type { SessionPayload, AnswerPayload, CompletePayload } from "@/lib/types/api";
import { Button } from "@/components/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card";
import { Progress } from "@/components/components/ui/progress";
import { cn } from "@/components/lib/utils";

type AnswerState = AnswerPayload & { chosen: "A" | "B" | "C" };

interface Props {
  initialSession: SessionPayload;
  subjectSlug?: string;
  onComplete?: (payload: CompletePayload) => void;
}

export function SessionRunner({ initialSession, onComplete, subjectSlug }: Props) {
  const session = initialSession;
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState<CompletePayload | null>(null);
  const [duelLink, setDuelLink] = useState<{ token: string; url: string } | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const question = session.questions[questionIndex];
  const answered = question ? answers[question.id] : null;
  const totalQuestions = session.questions.length;
  const correctCount = Object.values(answers).filter((ans) => ans.isCorrect).length;
  const progressValue = ((questionIndex + (answered ? 1 : 0)) / totalQuestions) * 100;
  const replayHref = subjectSlug ? `/play?subject=${subjectSlug}` : "/start";

  useEffect(() => {
    setQuestionStartedAt(Date.now());
  }, [questionIndex]);

  if (!question) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Нет вопросов</CardTitle>
          </CardHeader>
          <CardContent className="text-ink-light">{error ?? "Подождите и попробуйте снова."}</CardContent>
        </Card>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Score {complete.score}/{totalQuestions}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-ink">
            <p>Ты нашёл {complete.numCorrect} ложных утверждений.</p>
            {complete.streak && (
              <p>
                Streak: <strong>{complete.streak.current}</strong>
                {complete.streak.updated ? " 🔥" : ""}
              </p>
            )}
            {complete.errorProfile.length > 0 && (
              <div>
                <p className="text-sm uppercase tracking-wider text-muted-foreground">Топ ловушек</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {complete.errorProfile.map((item) => (
                    <span
                      key={item.trapType}
                      className="rounded-full border border-sand-accent px-3 py-1 text-sm font-medium text-ink"
                    >
                      {item.trapType}: {item.count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href={replayHref}>Сыграть ещё</Link>
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => handleShare("result")}>
            Поделиться результатом
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleCreateDuel} disabled={!!duelLink}>
            {duelLink ? "Ссылка готова" : "Вызвать друга"}
          </Button>
        </div>
        {duelLink && (
          <Card>
            <CardHeader>
              <CardTitle>Поделись дуэлью</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Скинь ссылку другу, он пройдёт тот же сет.</p>
              <div className="rounded-xl bg-muted px-3 py-2 font-mono text-sm break-all">{duelLink.url}</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => void copyLink(duelLink.url)}>
                  Скопировать
                </Button>
                <Button type="button" onClick={() => handleShare("duel_invite", duelLink)}>
                  Поделиться
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sand-accent bg-white/70 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Вопрос {questionIndex + 1}/{totalQuestions}
          </span>
          <span>Score: {correctCount}</span>
        </div>
        <Progress value={progressValue} className="mt-3 h-2" />
      </div>
      <Card>
        <CardHeader className="pb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Найди ложь</p>
          <CardTitle className="text-xl text-ink">{question.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0">
          {question.options.map((option, idx) => {
            const isSelected = answered?.chosen === option.label;
            const isLie = answered?.lieOption === option.label;
            const isWrongChoice = answered && isSelected && !answered.isCorrect;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!!answered || submitting}
                onClick={() => submitAnswer(option.label)}
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "flex items-start gap-3",
                  answered
                    ? isLie
                      ? "border-green-500 bg-green-50"
                      : isWrongChoice
                        ? "border-red-500 bg-red-50"
                        : "opacity-70"
                    : "border-sand-accent bg-white hover:border-primary hover:bg-white"
                )}
              >
                <span className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-sand-accent text-xs font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
                <span className="text-base text-ink">{option.text}</span>
              </button>
            );
          })}
          {answered && (
            <div className="space-y-2 rounded-2xl border border-sand-accent bg-sand/60 p-3 text-sm">
              <p className="text-base font-semibold text-ink">{answered.isCorrect ? "Верно!" : "Это правда"}</p>
              <p className="text-ink">{answered.explanation}</p>
              <p className="font-semibold text-ink">
                Правильный факт: <span className="font-normal">{answered.correctFact}</span>
              </p>
              {typeof answered.stats?.wrongRate === "number" && (
                <p className="text-xs text-muted-foreground">
                  Ошиблись {Math.round(answered.stats.wrongRate * 100)}% игроков
                </p>
              )}
              <Button type="button" className="w-full" onClick={handleNext}>
                {questionIndex + 1 === totalQuestions ? "Завершить сессию" : "Следующий вопрос"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  async function submitAnswer(option: "A" | "B" | "C") {
    if (!question || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const timeMs = Date.now() - questionStartedAt;
      const response = await fetch("/api/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: question.id,
          chosenOption: option,
          timeMs
        })
      });
      if (!response.ok) {
        throw new Error("answer failed");
      }
      const payload = (await response.json()) as AnswerPayload;
      setAnswers((prev) => ({ ...prev, [question.id]: { ...payload, chosen: option } }));
      posthog.capture("answer_reveal", { sessionId: session.sessionId, questionId: question.id, option });
    } catch {
      setError("Не удалось сохранить ответ. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (questionIndex + 1 >= totalQuestions) {
      finishSession();
      return;
    }
    setQuestionIndex((idx) => idx + 1);
  }

  async function finishSession() {
    try {
      const response = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      if (!response.ok) throw new Error("complete failed");
      const payload = (await response.json()) as CompletePayload;
      setComplete(payload);
      onComplete?.(payload);
    } catch {
      setError("Не удалось завершить сессию. Обновите страницу.");
    }
  }

  async function handleCreateDuel() {
    try {
      const res = await fetch("/api/duel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
      if (!res.ok) throw new Error("duel error");
      const data = await res.json();
      setDuelLink(data);
    } catch {
      setError("Не удалось создать дуэль");
    }
  }

  async function handleShare(type: "result" | "duel_invite", duelData?: { token: string; url: string }) {
    const text =
      type === "result"
        ? `Я нашёл ложь: ${complete?.score ?? 0}/${totalQuestions}. Проверь себя!`
        : "Дуэль LieSense: угадай ложь и сравним результаты.";
    const url = duelData?.url ?? `${window.location.origin}/result/${session.sessionId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "LieSense", text, url });
        await recordShare(type, duelData?.token, "native");
        return;
      } catch {
        // ignore, fall back
      }
    }
    await copyLink(url);
    await recordShare(type, duelData?.token, "copy");
  }

  async function recordShare(type: "result" | "duel_invite", duelToken?: string, channel?: string) {
    await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareType: type, sessionId: session.sessionId, duelToken, channel })
    });
  }
}

async function copyLink(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  } catch {
    console.warn("clipboard copy failed");
  }
}
