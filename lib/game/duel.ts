import type { DuelSummary } from "@/lib/types/duel";

export async function getDuelByToken(token: string): Promise<DuelSummary | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const response = await fetch(`${base}/api/duel/${token}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch duel");
  return (await response.json()) as DuelSummary;
}
