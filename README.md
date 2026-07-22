# Vantage

AI-native management reporting for engineering leadership. Rolls up delivery, risk, security, cost, and capacity signals across multiple projects, answers natural-language questions via RAG with cited sources, and routes AI-drafted executive reports through a human-approval workflow before publishing.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + pgvector) for data and vector search
- Local embeddings via `@huggingface/transformers` (no external API calls)
- Groq (Llama) for RAG answer generation

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Groq keys
npm run dev
```
