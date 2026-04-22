# WebGenesis Project Context

## Purpose

This document captures the current state of the `web-genesis` project so that new contributors, AI coding agents, and future sessions can quickly understand what the product does, how it is structured, what has already been fixed, and what still needs attention.

## Project Snapshot

- Project name: `web-genesis`
- Current stage: MVP / early production-hardening phase
- Primary goal: generate web app prototypes from user prompts and present both a live preview and generated code
- Current status: the core architecture is in place, but production deployment and background generation reliability are still being stabilized

## Product Overview

WebGenesis is an AI-powered web app builder. A signed-in user can:

- create a new project from a prompt
- continue an existing project by sending follow-up messages
- trigger an AI generation workflow in the background
- view generated output inside a preview iframe
- inspect generated files in a code explorer
- track usage / credits

## Tech Stack

- Framework: Next.js 15 App Router
- UI: React 19, Tailwind CSS, Radix UI, custom UI components
- Auth: Clerk
- API layer: tRPC
- Database: PostgreSQL with Prisma
- Background orchestration: Inngest
- Code sandbox / preview runtime: E2B Code Interpreter
- LLM provider currently wired in generation flow: Groq
- State / data fetching: TanStack Query

## Current Architecture

### Frontend

- Home page lets users create a project from a prompt
- Project page shows:
  - message history
  - prompt input
  - generated fragment preview
  - generated file explorer

### Backend

- tRPC is the main application API
- Prisma handles persistence for projects, messages, fragments, and usage
- Inngest receives events from tRPC mutations and runs the generation workflow asynchronously
- The generation workflow uses E2B for sandboxed file creation and preview hosting

### Persistence Model

Current Prisma models:

- `Project`
- `Message`
- `Fragment`
- `Usage`

High-level relationship:

- a `Project` has many `Message` records
- an assistant `Message` may have one `Fragment`
- a `Fragment` stores generated files plus a sandbox preview URL

## Core User Flow

1. User signs in with Clerk.
2. User creates a project or sends a follow-up message.
3. A tRPC mutation stores the user message.
4. The server sends an Inngest event.
5. Inngest runs the background generator.
6. Generated files are written to an E2B sandbox.
7. A result `Message` and `Fragment` are saved to Prisma.
8. The project UI polls messages and displays the completed fragment.

## Key Source Areas

### App and Routing

- `src/app/(home)/page.tsx`
- `src/app/projects/[projectId]/page.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/inngest/route.ts`

### Server Logic

- `src/trpc/init.ts`
- `src/trpc/routers/index.ts`
- `src/modules/projects/server/procedures.ts`
- `src/modules/messages/server/procedures.ts`
- `src/modules/usage/server/procedures.ts`

### AI / Background Generation

- `src/inngest/client.ts`
- `src/inngest/functions.ts`
- `src/inngest/prompt.ts`
- `src/inngest/utils.ts`

### Database

- `prisma/schema.prisma`
- `prisma/migrations/`

## Important Recent Fixes

The following issues have already been addressed in the current local codebase:

### Routing and Next.js Compatibility

- fixed the dynamic route param handling for Next.js 15 by awaiting `params` in `src/app/projects/[projectId]/page.tsx`
- removed legacy / conflicting API handler files under `src/app/api` that did not belong in the active App Router path

### tRPC and Runtime Behavior

- improved tRPC URL resolution so server and browser requests behave correctly in production environments such as Vercel
- set the Inngest route runtime to Node.js and configured `maxDuration = 300`

### Inngest Event Publishing

- the code now explicitly checks for `INNGEST_EVENT_KEY` before sending events in production
- the project and message mutations now return a clearer error if Inngest is not configured
- duplicate `inngest.send(...)` logic in the message flow was removed

### AI Tool Parsing

- the generation pipeline parser was hardened to better handle fenced JSON responses from the LLM
- this was important because generated JSX content inside JSON strings was causing false parsing failures and fallback output

### UI Loading State

- the project UI no longer declares a timeout after only 45 seconds
- current behavior:
  - at 45 seconds, generation is marked as slow
  - at 5 minutes, generation is treated as potentially stalled

### Prisma / Deployment

- the build script now runs `prisma migrate deploy && next build`
- the repo no longer ignores `prisma/migrations/`
- an initial migration has been created and can now be committed and deployed

## Current Deployment Reality

The product architecture is mostly complete, but production deployment still needs careful validation.

### Known Production Pain Points

- Vercel may still be serving an older deployment if the latest commits were not pushed
- missing Inngest environment variables will break prompt execution even if the site loads
- missing or unapplied Prisma migrations will break any DB-backed query on production
- local `.env` values do not automatically exist in Vercel

### Required Production Environment Variables

Do not store secrets in this document. Only the variable names are listed here.

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `GROQ_API_KEY`
- `E2B_API_KEY`

## Prisma / Migration Status

Current migration folders present locally:

- `20260422120000_init`
- `20260422131942_neon_db`

Notes:

- `20260422120000_init` is the important initial migration that creates the core schema
- `20260422131942_neon_db` currently contains a very small schema change and should be reviewed before final deployment
- if these migrations are not committed, Vercel will not apply them

## Current Quality Level

The project is beyond prototype stage in terms of structure, but not yet fully hardened for production.

### Strong Areas

- modern stack and good separation between UI, server procedures, and background jobs
- clear project/message/fragment data model
- working preview + code-inspection concept
- AI generation loop already integrated with persistence

### Weak Areas / Risk Areas

- no dedicated automated test suite yet
- deployment correctness still depends heavily on environment configuration
- production background processing remains sensitive to Inngest, E2B, and provider configuration
- some generated output paths still need stronger guardrails and observability

## What an AI Model Should Know Before Editing

- this project uses the Next.js App Router, not the Pages Router
- Clerk auth is enforced by middleware and protected tRPC procedures
- Prisma is the source of truth for persistence
- Inngest is required for asynchronous generation
- the project page relies on polling new messages to detect generation completion
- generated fragments are the main output unit shown in preview and code tabs

## What to Verify After Any Significant Change

- `npx tsc --noEmit`
- project creation flow
- message follow-up flow
- Inngest event dispatch
- background generation result persistence
- fragment preview rendering
- project page loading in production

## Immediate Next Priorities

1. Commit and push the current migration files so Vercel can apply them.
2. Confirm the latest production deployment includes the most recent code changes.
3. Verify all required environment variables exist in Vercel.
4. Verify the deployed `/api/inngest` endpoint is synced with Inngest.
5. Review and confirm whether the `20260422131942_neon_db` migration should remain.
6. Add better logging or surfaced status around long-running generation jobs.
7. Add basic automated verification for the main create-message and generation flow.

## Recommended Short Description for Future AI Sessions

WebGenesis is a Next.js 15 + tRPC + Clerk + Prisma + Inngest project that lets users generate and iterate on web app prototypes from prompts. The core UI and background generation flow exist, but the project is currently in a production-hardening phase focused on Vercel deployment, Prisma migrations, Inngest configuration, and generation reliability.
