import Link from "next/link";
import { THEMES } from "@/lib/data/themes";
import { Card } from "@/components/components/ui/card";

export function ThemePicker() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {THEMES.map((theme) => (
        <Card key={theme.id} className="border transition hover:border-ink">
          <Link href={`/start/${theme.id}`} className="block space-y-2 p-4">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">{theme.name}</p>
            <p className="text-ink">{theme.description}</p>
            <p className="text-xs text-muted-foreground">{theme.subjects.length} предмета</p>
          </Link>
        </Card>
      ))}
    </div>
  );
}
