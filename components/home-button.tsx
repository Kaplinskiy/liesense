import Link from "next/link";
import { Button } from "@/components/components/ui/button";

interface Props {
  label?: string;
}

export function HomeButton({ label = "На главную" }: Props) {
  return (
    <div className="flex justify-end">
      <Button asChild variant="ghost" size="sm" className="text-sm">
        <Link href="/">← {label}</Link>
      </Button>
    </div>
  );
}
