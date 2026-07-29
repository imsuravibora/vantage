-- Run this in the Supabase SQL editor after 005_project_assignments.sql.
-- Adds a "draft" stage before "pending-review": a Project Manager can now
-- generate and edit a report privately, then explicitly send it for
-- Management's review -- at which point it behaves exactly as it did before.

alter table reports drop constraint if exists reports_status_check;
alter table reports add constraint reports_status_check
  check (status in ('draft', 'pending-review', 'approved', 'rejected'));

alter table reports add column if not exists created_by uuid references profiles(id);
