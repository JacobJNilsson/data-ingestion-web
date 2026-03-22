# data-ingestion-web

Next.js frontend for the Data Contract Analyzer. 6-tab demo: CSV, JSON, API, PostgreSQL, Supabase, Transform.

## Session Start

```bash
ml prime        # Load project expertise into context
sd prime        # Load issue tracking context
sd ready        # Find unblocked work
```

## Project Rules

- **Design**: Clean editorial aesthetic, warm OKLCH neutrals, light mode only. No AI slop patterns. See `design` Mulch domain for full color system.
- **Components**: Reusable AnalyzerPanel for source/destination. Destination-centric MappingEditor. Shared badges.tsx for constraints and types.
- **API**: API_BASE in lib/constants.ts. All fetch calls handle errors (check response.ok, parse JSON body, fall back to status text).
- **Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, pnpm.
- **All code, comments, and documentation must be in English.**

## Before You Finish

```bash
ml learn        # See what changed, get suggestions for what to record
ml record <domain> --type <type> --description "..."
sd close <id>   # Close completed issues
ml sync && sd sync
```

Domains: `design`, `components`, `api-integration`
