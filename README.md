# LieSense

Mobile-first trivia that makes you spot the fake statement fast, built with Next.js App Router, Supabase, and PostHog tracking.

## Getting started

### Environment
1. `cp .env.local.example .env.local` — copy шаблон.
2. `nano .env.local` — заполните `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BASE_URL`, PostHog ключи, `SESSION_LENGTH`, `DAILY_SCHEDULE_DAYS`.

### Dependencies
1. `npm install` — install packages.

### Database (Supabase CLI)
1. `supabase login` — authenticate with Supabase.
2. `supabase link --project-ref YOUR_REF` — link the local folder to the project.
3. `supabase db push` — apply SQL migrations from `supabase/migrations`.
4. `npm run seed` — загрузите 5×50 троек из `supabase/seed/topics`.
5. `npm run daily` — заполните таблицу `daily_challenge` на N дней вперёд (по умолчанию 14).

### Local development
1. `npm run dev` — старт Next.js.

### Deploy to Vercel
1. `vercel` — линк и предпросмотр.
2. `vercel --prod` — релиз после проверок (см. чеклист).

## Project layout
- `app/` — App Router routes, включая `/play`, `/daily`, `/d/[token]`, `/result/[sessionId]`, и API handlers.
- `components/` — client components: игровой UI, guest bootstrapper, PWA helpers.
- `lib/` — Supabase client, PostHog helper, domain utilities, shared types.
- `public/` — статика, `manifest.json`, `sw.js`.
- `supabase/migrations/` — SQL миграции для модели данных.
- `supabase/seed/` — JSON schema + файлы тем (5×50).
- `scripts/` — TS-скрипты (`seed-content`, `generate-daily`).

## Running migrations and seeds
1. `supabase db push` — примените свежие SQL в линкнутый проект.
2. `npm run seed` — импорт вопросов (idempotent).
3. `npm run daily` — запланировать daily-наборы на 14 дней (использует `DAILY_SCHEDULE_DAYS`).

## Verifying analytics events
1. `POSTHOG_API_KEY=phc_test POSTHOG_HOST=https://app.posthog.com npm run dev` — dev-сервер с тестовым ключом.
2. Пройдите локальную сессию (regular/daily/duel) — `session_start`, `answer_submit`, `session_complete`, `duel_create` отправятся автоматически.
3. `curl -X POST http://localhost:3000/api/share -H 'Content-Type: application/json' -d '{"shareType":"result"}'` — ручной `share_click`.
4. Проверка в PostHog Live Events подтверждает отправку `guest_id`.
