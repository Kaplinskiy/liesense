import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type SupabaseServer = SupabaseClient<Database>;

export async function upsertGuestProfile(client: SupabaseServer, guestId: string) {
  const existing = await client
    .from("user_profile")
    .select("id, streak_current, streak_last_date")
    .eq("guest_id", guestId)
    .maybeSingle();

  if (existing.error && existing.status !== 406) throw existing.error;

  if (existing.data) {
    const existingRow = (existing.data as unknown) as {
      id: string;
      streak_current: number | null;
      streak_last_date: string | null;
    };
    const updateRow: Database["public"]["Tables"]["user_profile"]["Update"] = {
      last_seen_at: new Date().toISOString()
    };
    await client
      .from("user_profile")
      // @ts-expect-error Supabase types misinfer update payload
      .update(updateRow)
      .eq("id", existingRow.id);
    return existingRow;
  }

  const insertRow: Database["public"]["Tables"]["user_profile"]["Insert"] = {
    guest_id: guestId
  };

  const inserted = await client
    .from("user_profile")
    // @ts-expect-error Supabase types misinfer insert payload
    .insert(insertRow)
    .select("id, streak_current, streak_last_date")
    .single();

  if (inserted.error) throw inserted.error;
  return inserted.data;
}
