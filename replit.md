# Workspace

## Overview

AI News Hub — a full-stack web application that aggregates the latest AI news from popular websites, highlights updates relevant to software product development and testing, and provides user authentication with personalized saved posts.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Auth**: express-session + bcryptjs
- **Forms**: react-hook-form + @hookform/resolvers
- **Animations**: framer-motion
- **Date handling**: date-fns

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── web/                # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Application Features

### Authentication
- Login with username/password
- Guest login (no credentials required)
- Create account (alphanumeric username max 30 chars, password min 8 chars with 1 uppercase, 1 digit, 1 special char)
- Forgot/reset password (username + new password → redirects to login)
- Sessions via HTTP cookies (express-session)
- Passwords hashed with bcryptjs

### Homepage (after login)
- AI news feed from popular RSS sources (TechCrunch, The Verge, Google AI, OpenAI, Microsoft AI, HuggingFace, DeepMind, VentureBeat)
- Articles relevant to software dev/testing are highlighted with a "Dev & Testing" badge
- 10-minute server-side cache for RSS feeds
- "Save for Later" button for authenticated non-guest users
- Sign Out button in navbar

### Saved Posts
- View saved articles
- Remove saved articles
- Stored in PostgreSQL per user account

## Database Schema

- `users` table: id, username (unique), hashed_password, created_at
- `saved_posts` table: id, user_id (FK → users), article_url, article_title, article_source, article_date, article_description, saved_at

## API Routes

All routes prefixed with `/api`:

- `GET /healthz` — Health check
- `POST /auth/register` — Register new account
- `POST /auth/login` — Login with username/password
- `POST /auth/guest` — Guest login
- `POST /auth/logout` — Logout (clears session)
- `POST /auth/reset-password` — Reset password by username
- `GET /auth/me` — Get current session user
- `GET /news` — Get latest AI news (paginated, 10-min cache)
- `GET /saved-posts` — Get saved posts (auth required)
- `POST /saved-posts` — Save a post (auth required, non-guest)
- `DELETE /saved-posts/:id` — Remove a saved post (auth required)

## Frontend Routes

- `/login` — Login page (starting page, redirects here if not authenticated)
- `/register` — Create Account page
- `/forgot-password` — Reset Password page
- `/` — Homepage with news feed (protected)
- `/saved-posts` — Saved Posts page (protected, non-guest only)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Codegen

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

## Database

Push schema: `pnpm --filter @workspace/db run push`

Environment variables set automatically by Replit: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
