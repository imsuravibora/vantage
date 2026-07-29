-- Run this in the Supabase SQL editor after 004_document_reviews.sql.
-- Links a Project Manager's login account to the specific projects they're
-- staffed on. Only meaningful for profiles with role = 'project_manager' --
-- Management already sees everything and doesn't need an assignment row.

create table if not exists project_assignments (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles(id) on delete cascade,
  project_id text not null references projects(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (profile_id, project_id)
);

create index if not exists project_assignments_profile_id_idx on project_assignments(profile_id);
create index if not exists project_assignments_project_id_idx on project_assignments(project_id);
