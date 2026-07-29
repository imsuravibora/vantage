-- Run this in the Supabase SQL editor after 006_report_draft_workflow.sql.
-- Adds a third real role: engineers can now have their own login account,
-- linked back to their existing roster row, instead of only existing as a
-- name tickets/allocations point at.

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('project_manager', 'management', 'engineer'));

alter table engineers add column if not exists profile_id uuid references profiles(id);
create unique index if not exists engineers_profile_id_key on engineers(profile_id) where profile_id is not null;
