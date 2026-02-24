# Replit.md

## Overview

This is an AI-powered educational worksheet generator app. Users select a class/standard, education board (e.g., CBSE, ICSE), subject, topic, difficulty level, and desired number of questions. The app uses OpenAI to generate curriculum-aligned, print-ready worksheets. Generated worksheets are stored in a PostgreSQL database and can be viewed and printed directly from the browser using `window.print()` with `@media print` CSS styling.

The app targets Indian education boards up to Class 10, generating different question types (MCQ, fill-in-the-blanks, short answer, long answer, matching) with proper formatting for A4 printing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
- **Monorepo layout** with three top-level code directories:
  - `client/` — React frontend (SPA)
  - `server/` — Express backend (API server)
  - `shared/` — Shared types, schemas, and route definitions used by both client and server

### Frontend (`client/src/`)
- **Framework**: React with TypeScript, built with Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: `@tanstack/react-query` for server state, `react-hook-form` for form state
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS for styling
- **Animations**: `framer-motion` for page transitions
- **Validation**: Zod schemas shared between client and server via `@hookform/resolvers`
- **Print Support**: Uses `@media print` CSS and `window.print()` for generating printable worksheets — no PDF library needed
- **Graphics**: AI-generated worksheets include descriptions for minimalist, colorful graphics that are rendered as placeholders in color mode.
- **Fonts**: Inter (sans), Outfit (display), Lora (serif) — configured via CSS variables `--font-sans`, `--font-display`, `--font-serif`
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express 5 on Node.js, wrapped in a standard HTTP server
- **API Pattern**: REST endpoints defined in `server/routes.ts`, with route manifests in `shared/routes.ts`
- **AI Integration**: OpenAI SDK configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` environment variables (Replit AI Integrations). The worksheet generation endpoint sends a structured prompt and expects JSON output.
- **Dev Server**: Vite dev server is used as middleware in development (via `server/vite.ts`); in production, static files are served from `dist/public`
- **Build**: Custom build script (`script/build.ts`) using Vite for the client and esbuild for the server. Output goes to `dist/`

### Database
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for automatic Zod schema generation from table definitions
- **Schema location**: `shared/schema.ts` — the `worksheets` table stores generated worksheet data including class, board, subject, topic, difficulty, length, color mode, and the AI-generated content as JSON
- **Migrations**: Managed via `drizzle-kit push` (schema push, not migration files)
- **Additional tables**: `shared/models/chat.ts` defines `conversations` and `messages` tables (part of Replit integrations scaffolding)

### Shared Route Manifest (`shared/routes.ts`)
- Defines API endpoints, HTTP methods, input schemas, and response schemas in a single object (`api`)
- Both frontend hooks and backend handlers reference this manifest, ensuring type safety across the stack
- Includes a `buildUrl` helper for constructing parameterized URLs

### Key Data Flow
1. User fills out the worksheet form on the Home page
2. Form submits to `POST /api/worksheets/generate` with class, board, subject, topic, difficulty, length, colorMode
3. Server constructs an OpenAI prompt, requests structured JSON output matching the worksheet format
4. AI response is parsed and stored in the `worksheets` table
5. Client redirects to `/worksheet/:id` to view the rendered worksheet
6. User can print directly from the browser

### Replit Integrations (Scaffolding)
- `server/replit_integrations/` and `client/replit_integrations/` contain pre-built modules for audio/voice chat, image generation, batch processing, and text chat. These are scaffolding provided by Replit and are not core to the worksheet functionality but are available for extension.

## External Dependencies

### Required Services
- **PostgreSQL**: Database for storing worksheets. Connection string via `DATABASE_URL` environment variable. Must be provisioned.
- **OpenAI API (via Replit AI Integrations)**: Used for worksheet content generation. Configured via:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Key NPM Packages
- `express` v5 — HTTP server
- `drizzle-orm` + `drizzle-zod` + `drizzle-kit` — Database ORM and schema management
- `openai` — OpenAI SDK for AI content generation
- `react`, `react-dom` — UI framework
- `@tanstack/react-query` — Async state management
- `wouter` — Client-side routing
- `react-hook-form` + `@hookform/resolvers` — Form handling with Zod validation
- `zod` — Schema validation (shared between client and server)
- `framer-motion` — Animations
- `tailwindcss` — Utility-first CSS
- `shadcn/ui` components (Radix UI primitives) — Pre-built accessible UI components
- `connect-pg-simple` — PostgreSQL session store (available but not currently used for auth)
- `vite` — Frontend build tool and dev server
- `esbuild` — Server bundling for production