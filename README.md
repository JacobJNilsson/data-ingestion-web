# data-ingestion-web

Frontend for the data ingestion platform. Provides a browser-based interface for analyzing data sources and destinations before building ingestion pipelines.

**Live:** [https://data-ingestion-web.vercel.app](https://data-ingestion-web.vercel.app)

## Features

- **CSV Analysis** -- Drag-and-drop CSV upload with instant structural analysis: encoding, delimiter, column types, data profiling, sample data preview, and quality issues.
- **PostgreSQL Analysis** -- Connect to a PostgreSQL database and inspect table schemas, column types, constraints, and foreign key relationships.
- **Supabase Analysis** -- Connect to a Supabase project via URL and API key to analyze database structure.

All analysis is performed by the [data-ingestion-api](https://github.com/JacobJNilsson/data-ingestion-api) backend hosted on Koyeb. This app is a pure frontend -- no server-side logic.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- pnpm

## Project Structure

```
app/
  layout.tsx              Root layout (fonts, global CSS)
  page.tsx                Main page (tabbed UI, API calls)
  globals.css             Global styles and theme
components/
  CSVUpload.tsx           Drag-and-drop CSV file upload
  ContractDisplay.tsx     CSV analysis results display
  PostgresForm.tsx        PostgreSQL connection form
  SupabaseForm.tsx        Supabase connection form
  DatabaseDisplay.tsx     Database schema display
types/
  contract.ts             TypeScript interfaces for API responses
```

## Deployment

Deployed to [Vercel](https://vercel.com). Auto-deploys on push to `main`.
