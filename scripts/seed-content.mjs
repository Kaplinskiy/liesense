import nextEnv from "@next/env";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const records = await loadSeedRecords(resolve(process.cwd(), "supabase/seed/topics"));
  if (!records.length) {
    console.warn("No seed records found. Add JSON files under supabase/seed/topics.");
    return;
  }

  const topicCache = new Map();
  const setCache = new Map();
  const clearedSets = new Set();

  for (const record of records) {
    const topicId = await ensureTopic(supabase, record, topicCache);
    const questionSetId = await ensureQuestionSet(supabase, record, topicId, setCache);

    if (!clearedSets.has(questionSetId)) {
      await supabase.from("question").delete().eq("question_set_id", questionSetId);
      clearedSets.add(questionSetId);
    }

    const insertResult = await supabase.from("question").insert({
      topic_id: topicId,
      question_set_id: questionSetId,
      prompt: record.prompt,
      stmt_a: record.stmt_a,
      stmt_b: record.stmt_b,
      stmt_c: record.stmt_c,
      lie_option: record.lie_option,
      explanation: record.explanation,
      correct_fact: record.correct_fact,
      trap_type: record.trap_type,
      difficulty: record.difficulty ?? 1,
      source_url: record.source_url ?? null
    });

    if (insertResult.error) {
      console.error("Failed to insert question", record.prompt, insertResult.error);
      process.exitCode = 1;
    }
  }

  console.log(`Seeded ${records.length} questions across ${setCache.size} sets.`);
}

async function loadSeedRecords(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const records = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const raw = await readFile(join(dir, entry.name), "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.forEach((record) => records.push(record));
    }
  }

  return records;
}

async function ensureTopic(client, record, cache) {
  const slug = record.topic.trim().toLowerCase();
  if (cache.has(slug)) return cache.get(slug);

  const existing = await client.from("topic").select("id").eq("slug", slug).maybeSingle();
  if (existing.error && existing.status !== 406) throw existing.error;

  if (existing.data) {
    cache.set(slug, existing.data.id);
    return existing.data.id;
  }

  const insert = await client
    .from("topic")
    .insert({ slug, name: record.topic_name ?? toTitle(slug) })
    .select("id")
    .single();
  if (insert.error) throw insert.error;
  cache.set(slug, insert.data.id);
  return insert.data.id;
}

async function ensureQuestionSet(client, record, topicId, cache) {
  const key = `${record.topic}:${record.question_set}`;
  if (cache.has(key)) return cache.get(key);

  const title = record.question_set_title ?? record.question_set;
  const existing = await client
    .from("question_set")
    .select("id")
    .eq("topic_id", topicId)
    .eq("title", title)
    .maybeSingle();

  if (existing.error && existing.status !== 406) throw existing.error;

  if (existing.data) {
    cache.set(key, existing.data.id);
    return existing.data.id;
  }

  const insert = await client
    .from("question_set")
    .insert({
      topic_id: topicId,
      type: record.question_set_type ?? "regular",
      title,
      seed_version: 1,
      is_active: true
    })
    .select("id")
    .single();

  if (insert.error) throw insert.error;
  cache.set(key, insert.data.id);
  return insert.data.id;
}

function toTitle(slug) {
  return slug
    .split(/[-_\s]+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
