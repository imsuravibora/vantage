-- Run this in the Supabase SQL editor after schema.sql, to add accounts/roles
-- and the tables needed for document uploads and management feedback.

-- One row per authenticated user, storing their role. Enabled with RLS and no
-- policies: same pattern as every other table here -- all access goes through
-- our own server code with the service role key, never accessed directly by
-- the client with the anon key.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('project_manager', 'management')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Auto-create a profile row whenever someone signs up, using metadata passed
-- at signup time (full_name, role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'project_manager')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Allow narrative_docs to be tagged as user-uploaded content, not just
-- generator-seeded retros/postmortems/status-updates.
alter table narrative_docs drop constraint if exists narrative_docs_type_check;
alter table narrative_docs add constraint narrative_docs_type_check
  check (type in ('retro', 'postmortem', 'status-update', 'uploaded-doc'));

-- Upper-management feedback/comments on a report, separate from the
-- approve/reject decision.
create table if not exists report_feedback (
  id bigint generated always as identity primary key,
  report_id bigint not null references reports(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  author_name text not null,
  comment text not null,
  created_at timestamptz not null default now()
);
