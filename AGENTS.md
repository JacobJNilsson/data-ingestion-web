# data-ingestion-web

Next.js frontend for the Data Contract Analyzer. 7-tab demo: CSV, JSON, Excel, API, PostgreSQL, Supabase, Transform.

## Session Start

```bash
ml prime        # Load project expertise into context
sd prime        # Load issue tracking context
sd ready        # Find unblocked work
```

## Project Rules

- **Design**: Clean editorial aesthetic, warm OKLCH neutrals, light mode only. No AI slop patterns. See `design` Mulch domain for full color system.
- **Components**: Reusable AnalyzerPanel for source/destination. Destination-centric MappingEditor. Shared badges.tsx for constraints and types.
- **API**: `DATA_INGESTION_API_URL` in `lib/constants.ts` (overridable via `NEXT_PUBLIC_DATA_INGESTION_API_URL` env var). All fetch calls handle errors (check response.ok, parse JSON body, fall back to status text).
- **Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, pnpm.
- **All code, comments, and documentation must be in English.**

## Cross-Repo Testing

When a feature spans multiple repos (library → API → frontend), **write a Playwright e2e test first** before implementing the fix or feature. Unit tests in each repo are necessary but not sufficient -- they can't catch mismatches in how data flows between layers.

```bash
# Start the local API server
cd data-ingestion-api && go run cmd/server/main.go

# Run e2e tests (uses NEXT_PUBLIC_DATA_INGESTION_API_URL=http://localhost:8080)
pnpm test:e2e
```

E2e tests live in `e2e/`. They test the real user workflow against a local API server.

## Before You Finish

```bash
ml learn        # See what changed, get suggestions for what to record
ml record <domain> --type <type> --description "..."
sd close <id>   # Close completed issues
ml sync && sd sync
```

Domains: `design`, `components`, `api-integration`, `testing`
