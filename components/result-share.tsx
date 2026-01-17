"use client";

import { useState } from "react";
import { Button } from "@/components/components/ui/button";

interface Props {
  sessionId: string;
  score: number;
  numQuestions: number;
}

export function ResultShare({ sessionId, score, numQuestions }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" onClick={() => share("native")}>
        Поделиться
      </Button>
      <Button type="button" variant="secondary" onClick={() => share("copy")}>
        {copied ? "Скопировано" : "Скопировать ссылку"}
      </Button>
    </div>
  );

  async function share(channel: "native" | "copy") {
    const url = `${window.location.origin}/result/${sessionId}`;
    const text = `Я нашёл ложь: ${score}/${numQuestions}. Проверь себя!`;

    if (channel === "native" && navigator.share) {
      try {
        await navigator.share({ title: "LieSense", text, url });
        await recordShare("native");
        return;
      } catch {
        // fall back to copy
      }
    }

    try {
      await copy(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await recordShare("copy");
    } catch {
      console.warn("clipboard failure");
    }
  }

  async function recordShare(channel: string) {
    await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareType: "result", sessionId, channel })
    });
  }
}

async function copy(value: string) {
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
}
