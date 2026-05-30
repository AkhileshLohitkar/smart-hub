# Objective
Multiple feature additions:
1. Increase watermark size on worksheets
2. Add child selector to WorksheetForm that locks grade + board based on selected child
3. Add reviews/testimonials section to Landing page
4. Add small relevant emoji/unicode graphics to worksheets for class 1-5 (Nursery, KG1, KG2, Grade 1-5)
5. Add Nursery, KG1, KG2 to grades in WorksheetForm and Children page
6. Restrict max questions to 30
7. Add Test Prep page for multi-topic tests with marks schemes (20, 50, 80)

# Tasks

### T001: Increase watermark size + restrict questions to 30
- **Blocked By**: []
- **Details**:
  - In `client/src/components/WorksheetRender.tsx`: Change watermark image from `w-[350px] h-[350px]` to `w-[500px] h-[500px]`
  - In `client/src/components/WorksheetForm.tsx`: Change max question limit from 50 to 30 in formSchema (z.coerce.number().min(1).max(30)) and in the Input max={30}
  - Files: `client/src/components/WorksheetRender.tsx`, `client/src/components/WorksheetForm.tsx`
  - Acceptance: Watermark is larger, max questions capped at 30

### T002: Add Nursery/KG grades + child selector in WorksheetForm
- **Blocked By**: []
- **Details**:
  - In `client/src/components/WorksheetForm.tsx`:
    - Add Nursery, KG 1, KG 2 to the grade SelectItems (before Grade 1)
    - Import and use `useChildren` hook from `@/hooks/use-children`
    - Add a "Select Child" dropdown at the top of the form (before Grade Level)
    - When a child is selected, auto-fill and lock (disable) the Grade Level and Curriculum Board fields with the child's board and className
    - Add a "Clear" option to deselect child and unlock fields
    - When no children exist, don't show the child selector
  - In `client/src/pages/Children.tsx`: Add Nursery, KG 1, KG 2 to the grades array
  - Files: `client/src/components/WorksheetForm.tsx`, `client/src/pages/Children.tsx`
  - Acceptance: Child selector appears, selecting a child locks grade + board

### T003: Add reviews/testimonials section to Landing page
- **Blocked By**: []
- **Details**:
  - In `client/src/pages/Landing.tsx`:
  - Add a "What Parents & Teachers Say" section between "How it works" and the CTA section
  - Include 5-6 hardcoded testimonial cards with:
    - Name, role (Parent/Teacher), quote, star rating (4-5 stars)
    - Avatar initial circle with gradient
  - Testimonials should be relevant to Indian education context (CBSE/ICSE parents, teachers)
  - Use a 2-3 column grid layout matching the existing design
  - Files: `client/src/pages/Landing.tsx`
  - Acceptance: Reviews section visible between "How it works" and CTA

### T004: Update AI prompt for small graphics for younger classes + Nursery/KG curriculum
- **Blocked By**: []
- **Details**:
  - In `server/routes.ts`:
  - Update the AI prompt to add: "If the class is Nursery, KG 1, KG 2, or Grade 1-5, include a 'graphicEmojis' array with 3-5 relevant emoji characters (e.g. 🌻🐝🌈) that match the topic. These will be displayed as decorative elements on the worksheet."
  - Also add to the prompt: "For Nursery, KG 1, and KG 2 classes, focus on age-appropriate activities: tracing, coloring, simple matching, picture identification, basic counting, letter/number recognition. Use very simple language."
  - In `client/src/components/WorksheetRender.tsx`: If the worksheet has className matching Nursery/KG/Grade 1-5, render graphicEmojis from content as decorative elements scattered around the worksheet header and between sections
  - Files: `server/routes.ts`, `client/src/components/WorksheetRender.tsx`
  - Acceptance: Young class worksheets include emoji graphics

### T005: Test Prep page
- **Blocked By**: []
- **Details**:
  - Create `client/src/pages/TestPrep.tsx`:
    - A page to create a test paper on multiple topics at once
    - Form fields:
      - Child selector (same as worksheet form, locks board/grade)
      - Grade, Board (auto from child or manual)
      - Subject (text input)
      - Topics: Allow adding multiple topics (tag-style input or multiple text inputs with add/remove)
      - Marks scheme: Select from 20, 50, or 80 marks
      - Difficulty level
    - Submit generates a test paper via POST `/api/test-prep/generate`
    - Same nav bar as other pages
    - Show the generated test as a worksheet with marks distribution
  - Add route in `server/routes.ts`:
    - POST `/api/test-prep/generate` - authenticated, generates a test paper using AI
    - The AI prompt should create a structured test with sections, marks per question, total marks matching the scheme
    - Store the result as a worksheet in the database (reuse worksheets table with topic set to "Test Prep - [Subject]")
  - Add route `/test-prep` to `client/src/App.tsx`
  - Add "Test Prep" link in Home nav bar
  - Files: `client/src/pages/TestPrep.tsx`, `server/routes.ts`, `client/src/App.tsx`, `client/src/pages/Home.tsx`
  - Acceptance: Can create test papers with marks schemes, stored as worksheets
