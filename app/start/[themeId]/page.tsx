import { notFound } from "next/navigation";
import { SubjectPicker } from "@/components/session/subject-picker";
import { getThemeById } from "@/lib/data/themes";
import { HomeButton } from "@/components/home-button";

interface Props {
  params: { themeId: string };
}

export default function SubjectPage({ params }: Props) {
  const theme = getThemeById(params.themeId);
  if (!theme) {
    notFound();
  }
  return (
    <main className="space-y-6">
      <HomeButton label="Вернуться" />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Шаг 2</p>
        <h1 className="text-3xl font-semibold text-ink">{theme.name}</h1>
        <p className="text-base text-ink-light">Выбери предмет и запускай сессию из семи вопросов.</p>
      </header>
      <SubjectPicker theme={theme} />
    </main>
  );
}
