import Link from "next/link";
import { Button } from "@/components/components/ui/button";

export default function HomePage() {
  return (
    <main className="home">
      <section className="space-y-6">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">LieSense</p>
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Три утверждения. Найди ложь за секунды.</h1>
        <p className="text-lg text-ink-light">
          250 фактов про культуру, науку и технологии. В каждом раунде две правды и одна ложь — угадай её быстрее друзей.
        </p>
        <div className="cta-group">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/play">Играть</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="min-w-[160px]">
            <Link href="/daily">Сегодняшний челлендж</Link>
          </Button>
        </div>
        <p className="micro-copy">Контент проверяет редакция, играешь как гость без регистрации.</p>
      </section>
    </main>
  );
}
