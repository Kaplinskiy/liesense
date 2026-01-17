import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const DAYS_AHEAD = Number(process.env.DAILY_SCHEDULE_DAYS ?? 14);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars missing for daily generator");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: sets, error } = await supabase
    .from("question_set")
    .select("id, type")
    .eq("is_active", true)
    .order("created_at");

  if (error) throw error;
  if (!sets?.length) {
    throw new Error("No active question sets found; seed them first");
  }

  const rotation = sets.filter((set) => set.type === "daily" || set.type === "regular");
  if (!rotation.length) {
    throw new Error("No regular/daily sets available for scheduling");
  }

  const today = startOfDay(new Date());
  for (let i = 0; i < DAYS_AHEAD; i += 1) {
    const targetDate = addDays(today, i);
    const isoDate = targetDate.toISOString().slice(0, 10);
    const set = rotation[i % rotation.length];

    const upsert = await supabase
      .from("daily_challenge")
      .upsert({ date: isoDate, question_set_id: set.id }, { onConflict: "date" });

    if (upsert.error) {
      console.error("Failed to upsert daily challenge", isoDate, upsert.error);
      process.exitCode = 1;
    } else {
      console.log(`daily_challenge ${isoDate} -> ${set.id}`);
    }
  }
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
