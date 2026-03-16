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
  - `/test-prep` — Test paper generator with marks schemes (authenticated)
  - `/payment/success` — Stripe checkout success page (verifies session, updates plan)
  - `/payment/cancel` — Stripe checkout cancellation page
  - `/about` — About Us page (public)
  - `/terms` — Terms and Conditions page (public)
  - `/privacy` — Privacy Policy page (public)
  - `/refund-policy` — Refund and Cancellation Policy page (public)
  - `/contact` — Contact Us page with FAQ (public)
  - `/my-notes` — My Textbook Notes (authenticated): upload textbook page photos, OCR extract via AI vision, manage content library
- **State Management**: `@tanstack/react-query` for server state, `react-hook-form` for form state
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS for styling
- **Color Theme**: Instagram-inspired gradient (purple → pink → orange) using CSS custom properties; worksheet accent color is electric blue (#0066FF)
- **Animations**: `framer-motion` for page transitions
- **Validation**: Zod schemas shared between client and server via `@hookform/resolvers`
- **Print Support**: Uses `@media print` CSS and `window.print()` for generating printable worksheets
- **PDF Download**: Uses `html2canvas` + `jspdf` for direct PDF download
- **Star Rating**: Rating popup dialog appears on first worksheet view; custom StarRating component
- **Answer Key**: Compact answer sheet rendered below worksheet with page break for printing
- **Graphics**: AI-generated worksheets include descriptions for minimalist, colorful graphics; emoji decorations for Nursery/KG/Grade 1-5
- **Watermark**: Logo watermark on all worksheets; hidden for "no_watermark" plan users
- **Child Selector**: WorksheetForm and TestPrep auto-fill grade/board from selected child profile; when children exist, form is locked until a child is selected
- **NCERT Books**: When board is CBSE and a subject is entered, NCERT recommended textbook names are displayed (via `client/src/lib/ncertBooks.ts`)
- **NCERT Chapter Selection**: Full chapter lists for all CBSE NCERT books (Maths, Science, English, Hindi, EVS, Social Science, Sanskrit, Grades 1-10) available in the "Chapters" tab of WorksheetForm (via `client/src/lib/ncertChapters.ts`). Single-book subjects show direct chapter dropdown; multi-book subjects (English, Social Science) show book selector first. When a chapter is selected, the NCERT book name is sent to the server as `ncertBook` in the API payload. The AI prompt uses the textbook name to generate content strictly aligned with the specific NCERT chapter.
- **State Board Chapter Data**: Comprehensive, research-backed textbook and chapter data for three state boards (via `client/src/lib/stateBoardChapters.ts`):
  - **Maharashtra (Balbharati)**: All subjects Grades 1-10 including Mathematics, English, Marathi, EVS, General Science, History, Geography, Science & Technology. Grade 9-10 Math split into Algebra (Part I) and Geometry (Part II). Grade 9-10 English uses Kumarbharati textbook. Grade 10 Science split into Part 1 and Part 2.
  - **Andhra Pradesh (SCERT AP)**: All subjects Grades 1-10 including Mathematics, English, EVS, General Science, Physical Science, Biological Science, Social Studies. Grade 8-10 Science split into Physical Science and Biological Science.
  - **Tamil Nadu (Samacheer Kalvi / TN SCERT)**: All subjects Grades 1-10 including Mathematics, English, EVS, Science, Social Science. Published by Tamil Nadu Textbook and Educational Services Corporation.
  - Subject alias matching: "Science" matches "General Science"/"Physical Science"/"Biological Science"; "Social Science" matches "Social Studies"/"History"/"Geography"; "Maths"/"Math" matches "Mathematics"
  - AI prompt includes grammar questions for language subjects (tenses, active/passive voice, synonyms/antonyms, vocabulary) and social science-specific question types (map-based, timeline, key personalities)
- **My Notes (Content Upload)**: Users upload photos of textbook pages → AI OCR extracts text → stored per board/class/subject/chapter → injected into worksheet generation prompt for chapter-accurate questions. Dashboard shows "Boost Worksheet Accuracy" card. Low ratings (≤3 stars) on WorksheetView trigger a polite popup explaining the process and linking to /my-notes.
- **Mobile Nav**: Shared `AppNav` component (`client/src/components/AppNav.tsx`) with hamburger menu for mobile; used across Home, Children, History, TestPrep pages
- **Logo**: Qik Worksheet logo (`@assets/IMG_6540_(1)_1772323458180.png`) shown in nav bars across all pages (w-20 mobile, w-32 desktop), and as watermark on worksheets
- **Landing Page Auth State**: Landing page shows "Go to Dashboard" button when user is logged in, Login/Sign Up buttons when not
- **Dark Mode**: Automatic dark/light mode based on system preference; manual toggle available in nav bars; ThemeProvider wraps app in App.tsx; CSS variables defined for `.dark` class in index.css
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
  - `users` — id, email, password (hashed), name, plan, planExpiresAt, maxChildren, worksheetsGenerated, stripeCustomerId, stripeSubscriptionId, createdAt
  - `children` — id, userId, name, board, className, createdAt
  - `worksheets` — id, userId, className, board, subject, chapter, topic, difficulty, length, colorMode, worksheetType, content (JSON), rating, createdAt
  - `session` — created automatically by connect-pg-simple
- **Migrations**: Managed via `drizzle-kit push`

### Razorpay Integration
- **Payment Gateway**: Razorpay via `razorpay` npm package with API keys stored as environment secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- **Checkout Flow**: Landing page plan buttons → POST `/api/razorpay/create-order` → Razorpay checkout modal (in-page) → POST `/api/razorpay/verify-payment` (server-side signature verification) → `/payment/success`
- **Plans API**: GET `/api/razorpay/plans` returns hardcoded plan list; GET `/api/razorpay/key` returns publishable key
- **Subscription Status**: GET `/api/razorpay/subscription` returns current user's plan and expiry
- **Signature Verification**: HMAC-SHA256 verification of `razorpay_order_id|razorpay_payment_id` against `razorpay_signature`
- **Plan Config**: `server/planConfig.ts` maps `plan_key` to app plan names and maxChildren
- **Files**: `server/razorpayClient.ts`, `server/planConfig.ts`

### Subscription Plans
- Free: ₹0, 5 worksheets total, 1 child
- Starter Monthly: ₹99/month, unlimited, 1 child
- Starter Annual: ₹999/year, unlimited, 1 child
- Family Monthly: ₹189/month, unlimited, 2-3 children
- Family Annual: ₹1,799/year, unlimited, 2-3 children
- No Watermark: ₹349/year, unlimited worksheets, unlimited children, no watermark on worksheets

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
