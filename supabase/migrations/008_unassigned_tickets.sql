-- Run this in the Supabase SQL editor after 007_engineer_accounts.sql.
-- Lets a PM leave a new ticket unassigned so any engineer can pick it up
-- themselves, instead of every ticket needing an assignee at creation time.

alter table tickets alter column assignee_id drop not null;
