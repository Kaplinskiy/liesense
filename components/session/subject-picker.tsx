"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ThemeOption } from "@/lib/data/themes";
import { Card } from "@/components/components/ui/card";
import { Button } from "@/components/components/ui/button";

interface Props {
  theme: ThemeOption;
}

export function SubjectPicker({ theme }: Props) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const selectedSubject = useMemo(() => theme.subjects.find((s) => s.id === subjectId) ?? null, [theme, subjectId]);

  const handleStart = () => {
    if (!selectedSubject) return;
    router.push(`/play?subject=${selectedSubject.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {theme.subjects.map((subject) => (
          <Card
            key={subject.id}
            role="button"
            tabIndex={0}
            onClick={() => setSubjectId(subject.id)}
            className={`cursor-pointer border transition hover:border-ink ${
              subjectId === subject.id ? "border-ink bg-sand" : ""
            }`}
          >
            <div className="space-y-2 p-4">
              <h3 className="text-lg font-semibold text-ink">{subject.name}</h3>
              <p className="text-sm text-ink-light">{subject.description}</p>
            </div>
          </Card>
        ))}
      </div>
      <Button size="lg" className="w-full" disabled={!selectedSubject} onClick={handleStart}>
        Начать с выбранным предметом
      </Button>
    </div>
  );
}
