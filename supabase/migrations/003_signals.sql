-- Run this in the Supabase SQL editor after 002_auth_and_features.sql.
-- The Sentinel: a background watcher that flags issues the instant they
-- appear (a ticket going blocked, a risky document, a risky new project),
-- separate from the heavier Reports approval workflow.

create table if not exists signals (
  id bigint generated always as identity primary key,
  project_id text not null references projects(id),
  source text not null check (source in ('ticket', 'document', 'project')),
  source_id text not null,
  severity text not null check (severity in ('minor', 'moderate', 'major')),
  summary text not null,
  escalated_report_id bigint references reports(id),
  created_at timestamptz not null default now()
);

create index if not exists signals_project_id_idx on signals(project_id);
create index if not exists signals_created_at_idx on signals(created_at desc);
