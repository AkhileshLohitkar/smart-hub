# Replit.md

## Overview

**Qik Worksheets** — an AI-powered educational worksheet generator app. Users select a class/standard, education board (e.g., CBSE, ICSE), subject, chapter, topic, difficulty level, and desired number of questions. The app uses OpenAI to generate curriculum-aligned, print-ready worksheets. Generated worksheets are stored in a PostgreSQL database and can be viewed, rated, downloaded as PDF, and printed directly from the browser.

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
  - `/` — Landing page (public)
  - `/auth` — Login / Registration page
  - `/dashboard` — Worksheet generator (authenticated)
  - `/worksheet/:id` — Worksheet view with rating & download
  - `/children` — Children profile management (authenticated)
  - `/history` — Worksheet history (authenticated)
- **State Management**: `@tanstack/react-query` for server state, `react-hook-form` for form state
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS for styling
- **Color Theme**: Instagram-inspired gradient (purple → pink → orange) using CSS custom properties
- **Animations**: `framer-motion` for page transitions
- **Validation**: Zod schemas shared between client and server via `@hookform/resolvers`
- **Print Support**: Uses `@media print` CSS and `window.print()` for generating printable worksheets
- **PDF Download**: Uses `html2canvas` + `jspdf` for direct PDF download
- **Star Rating**: Rating popup dialog appears on first worksheet view; custom StarRating component
- **Answer Key**: Compact answer sheet rendered below worksheet with page break for printing
- **Graphics**: AI-generated worksheets include descriptions for minimalist, colorful graphics
- **Fonts**: Inter (sans), Outfit (display), Lora (serif)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (`server/`)
- **Framework**: Express 5 on Node.js, wrapped in a standard HTTP server
- **Authentication**: Passport.js with Local Strategy, express-session with PostgreSQL session store (connect-pg-simple)
  - Registration: POST `/api/auth/register`
  - Login: POST `/api/auth/login`
  - Logout: POST `/api/auth/logout`
  - User check: GET `/api/auth/user`
  - Social login buttons (Google, Facebook) are UI-only placeholders
- **API Pattern**: REST endpoints defined in `server/routes.ts`
- **AI Integration**: OpenAI SDK configured via Replit AI Integrations (gpt-5.1 model)
- **Dev Server**: Vite dev server is used as middleware in development; in production, static files are served from `dist/public`

### Database
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for automatic Zod schema generation
- **Schema location**: `shared/schema.ts`
- **Tables**:
  - `users` — id, email, password (hashed), name, plan, planExpiresAt, maxChildren, worksheetsGenerated, createdAt
  - `children` — id, userId, name, board, className, createdAt
  - `worksheets` — id, userId, className, board, subject, chapter, topic, difficulty, length, colorMode, content (JSON), rating, createdAt
  - `session` — created automatically by connect-pg-simple
- **Migrations**: Managed via `drizzle-kit push`

### Subscription Plans
- Free: ₹0, 5 worksheets total, 1 child
- Starter Monthly: ₹99/month, unlimited, 1 child
- Starter Annual: ₹999/year, unlimited, 1 child
- Family Monthly: ₹189/month, unlimited, 2-3 children
- Family Annual: ₹1,799/year, unlimited, 2-3 children

### Key Data Flow
1. User registers/logs in on the Auth page
2. User fills out the worksheet form on the Dashboard
3. Form submits to `POST /api/worksheets/generate` with all parameters
4. Server checks free plan limits, then constructs an OpenAI prompt
5. AI response is parsed and stored in the `worksheets` table
6. Client redirects to `/worksheet/:id` to view the rendered worksheet
7. User rates the worksheet (1-5 stars)
8. User downloads PDF or prints directly

## External Dependencies

### Required Services
- **PostgreSQL**: Database for storing users, worksheets, sessions
- **OpenAI API (via Replit AI Integrations)**: Used for worksheet content generation

### Key NPM Packages
- `express` v5 — HTTP server
- `passport` + `passport-local` — Authentication
- `express-session` + `connect-pg-simple` — Session management with PostgreSQL store
- `drizzle-orm` + `drizzle-zod` + `drizzle-kit` — Database ORM
- `openai` — AI content generation
- `react`, `react-dom` — UI framework
- `@tanstack/react-query` — Async state management
- `wouter` — Client-side routing
- `react-hook-form` + `@hookform/resolvers` — Form handling
- `zod` — Schema validation
- `framer-motion` — Animations
- `tailwindcss` — Utility-first CSS
- `html2canvas` + `jspdf` — PDF download generation
- `vite` — Frontend build tool
