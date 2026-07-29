-- Run this in the Supabase SQL editor after 008_unassigned_tickets.sql.
-- Adds a plain-language "why" to every signal, grounded in the actual
-- evidence the Sentinel saw -- not just a summary of what happened.

alter table signals add column if not exists reason text;
