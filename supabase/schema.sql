-- Vantage schema. Run this once in the Supabase SQL editor before seeding data.

create extension if not exists vector;

create table if not exists teams (
  id text primary key,
  name text not null,
  focus_area text not null
);

create table if not exists engineers (
  id text primary key,
  name text not null,
  team_id text not null references teams(id),
  role text not null,
  weekly_capacity_hours int not null
);

create table if not exists projects (
  id text primary key,
  name text not null,
  team_id text not null references teams(id),
  status text not null check (status in ('on-track', 'at-risk', 'off-track')),
  start_date date not null,
  target_date date not null,
  budget_planned numeric not null,
  budget_spent numeric not null
);

create table if not exists tickets (
  id text primary key,
  project_id text not null references projects(id),
  assignee_id text not null references engineers(id),
  title text not null,
  status text not null check (status in ('todo', 'in-progress', 'done', 'blocked')),
  story_points int not null,
  sprint int not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists milestones (
  id text primary key,
  project_id text not null references projects(id),
  name text not null,
  due_date date not null,
  status text not null check (status in ('on-track', 'at-risk', 'off-track'))
);

create table if not exists security_findings (
  id text primary key,
  project_id text not null references projects(id),
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  package_name text not null,
  description text not null,
  discovered_at timestamptz not null,
  resolved boolean not null default false
);

create table if not exists incidents (
  id text primary key,
  project_id text not null references projects(id),
  severity text not null check (severity in ('sev1', 'sev2', 'sev3')),
  title text not null,
  started_at timestamptz not null,
  resolved_at timestamptz not null,
  mttr_minutes int not null,
  root_cause_summary text not null
);

create table if not exists allocations (
  engineer_id text not null references engineers(id),
  week_start date not null,
  allocated_hours int not null,
  primary key (engineer_id, week_start)
);

create table if not exists narrative_docs (
  id text primary key,
  project_id text not null references projects(id),
  type text not null check (type in ('retro', 'postmortem', 'status-update')),
  title text not null,
  content text not null,
  created_at timestamptz not null
);

-- RAG: chunks of narrative_docs with their embeddings.
-- Vector size (384) matches the Xenova/all-MiniLM-L6-v2 embedding model used by the app.
create table if not exists doc_chunks (
  id bigint generated always as identity primary key,
  doc_id text not null references narrative_docs(id) on delete cascade,
  project_id text not null references projects(id),
  chunk_index int not null,
  content text not null,
  embedding vector(384) not null
);

create index if not exists doc_chunks_embedding_idx
  on doc_chunks using hnsw (embedding vector_cosine_ops);

-- Executive reports drafted by AI, gated behind human approval before publishing.
create table if not exists reports (
  id bigint generated always as identity primary key,
  project_id text references projects(id), -- null = org-wide report
  title text not null,
  draft_content text not null,
  final_content text,
  status text not null default 'pending-review' check (status in ('pending-review', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by text,
  reviewed_at timestamptz
);

-- Similarity search RPC used by the RAG Q&A feature.
create or replace function match_doc_chunks(
  query_embedding vector(384),
  match_count int default 6
)
returns table (
  id bigint,
  doc_id text,
  project_id text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    doc_chunks.id,
    doc_chunks.doc_id,
    doc_chunks.project_id,
    doc_chunks.content,
    1 - (doc_chunks.embedding <=> query_embedding) as similarity
  from doc_chunks
  order by doc_chunks.embedding <=> query_embedding
  limit match_count;
$$;
