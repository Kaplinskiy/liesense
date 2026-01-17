import { ThemePicker } from "@/components/session/theme-picker";
import { HomeButton } from "@/components/home-button";

export default function StartPage() {
  return (
    <main className="space-y-6">
      <HomeButton />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Шаг 1</p>
        <h1 className="text-3xl font-semibold text-ink">Выбери тему</h1>
        <p className="text-base text-ink-light">LieSense подготовил 10 направлений: выбери одно и переходи к предметам.</p>
      </header>
      <ThemePicker />
    </main>
  );
}
