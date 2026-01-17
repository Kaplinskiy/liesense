create extension if not exists "pgcrypto";

create table if not exists topic (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists question_set (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topic(id),
  type text not null,
  code text null unique,
  title text null,
  seed_version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint question_set_type_check check (type in ('regular','daily','duel','code')),
  constraint question_set_code_unique unique(code)
);

create index if not exists question_set_topic_type_idx on question_set(topic_id, type);

create table if not exists question (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topic(id),
  question_set_id uuid not null references question_set(id) on delete cascade,
  prompt text not null,
  stmt_a text not null,
  stmt_b text not null,
  stmt_c text not null,
  lie_option char(1) not null,
  explanation text not null,
  correct_fact text not null,
  trap_type text not null,
  difficulty smallint not null default 1,
  source_url text null,
  created_at timestamptz not null default now(),
  constraint question_lie_option_check check (lie_option in ('A','B','C'))
);

create index if not exists question_question_set_idx on question(question_set_id);
create index if not exists question_topic_idx on question(topic_id);
create index if not exists question_trap_idx on question(trap_type);

create table if not exists user_profile (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz null,
  locale text null,
  streak_current int not null default 0,
  streak_last_date date null,
  created_at timestamptz not null default now()
);

create index if not exists user_profile_last_seen_idx on user_profile(last_seen_at);

create table if not exists session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profile(id),
  question_set_id uuid not null references question_set(id),
  mode text not null,
  duel_id uuid null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  score int not null default 0,
  num_questions int not null,
  client_fingerprint text null,
  created_at timestamptz not null default now(),
  constraint session_mode_check check (mode in ('regular','daily','duel')),
  constraint session_completed_check check (completed_at is null or completed_at >= started_at)
);

create index if not exists session_user_idx on session(user_id, started_at desc);
create index if not exists session_question_set_idx on session(question_set_id);
create index if not exists session_duel_idx on session(duel_id);

create table if not exists duel (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  question_set_id uuid not null references question_set(id),
  creator_user_id uuid not null references user_profile(id),
  creator_session_id uuid not null references session(id),
  opponent_user_id uuid null references user_profile(id),
  opponent_session_id uuid null references session(id),
  status text not null default 'open',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint duel_status_check check (status in ('open','completed','expired'))
);

create index if not exists duel_status_expires_idx on duel(status, expires_at);

alter table session
  add constraint session_duel_fk foreign key (duel_id) references duel(id);

create table if not exists session_answer (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references session(id) on delete cascade,
  question_id uuid not null references question(id),
  chosen_option char(1) not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  time_ms int null,
  created_at timestamptz not null default now(),
  constraint session_answer_option_check check (chosen_option in ('A','B','C')),
  constraint session_answer_unique unique(session_id, question_id)
);

create index if not exists session_answer_session_idx on session_answer(session_id);
create index if not exists session_answer_question_idx on session_answer(question_id);
create index if not exists session_answer_correct_idx on session_answer(is_correct);

create table if not exists share_event (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profile(id),
  session_id uuid null references session(id),
  duel_id uuid null references duel(id),
  share_type text not null,
  channel text null,
  created_at timestamptz not null default now(),
  constraint share_type_check check (share_type in ('result','duel_invite','daily'))
);

create index if not exists share_event_user_idx on share_event(user_id, created_at desc);
create index if not exists share_event_type_idx on share_event(share_type);
create index if not exists share_event_channel_idx on share_event(channel);

create table if not exists daily_challenge (
  date date primary key,
  question_set_id uuid not null references question_set(id),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists daily_question_set_idx on daily_challenge(question_set_id);
