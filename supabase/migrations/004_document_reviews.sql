-- Run this in the Supabase SQL editor after 003_signals.sql.
-- Adds: a confidential flag on documents, and a structured multi-category
-- review the Sentinel produces for every uploaded document.

alter table narrative_docs add column if not exists confidential boolean not null default false;

create table if not exists document_reviews (
  id bigint generated always as identity primary key,
  narrative_doc_id text not null references narrative_docs(id),
  project_id text not null references projects(id),
  compliance text[] not null default '{}',
  security text[] not null default '{}',
  timelines text[] not null default '{}',
  risks text[] not null default '{}',
  terms text[] not null default '{}',
  agreements text[] not null default '{}',
  must_read text[] not null default '{}',
  departments text[] not null default '{}',
  severity text not null check (severity in ('minor', 'moderate', 'major')),
  created_at timestamptz not null default now()
);

create index if not exists document_reviews_doc_id_idx on document_reviews(narrative_doc_id);
create index if not exists document_reviews_project_id_idx on document_reviews(project_id);
create index if not exists document_reviews_created_at_idx on document_reviews(created_at desc);
