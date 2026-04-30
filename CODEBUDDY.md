# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Commands

```bash
pnpm dev          # Dev server with Turbopack (http://localhost:3000)
pnpm build        # Production build (also generates static pages from sources/)
pnpm start        # Serve production build
pnpm lint         # oxlint
pnpm fmt          # oxfmt format in-place
pnpm fmt:check    # oxfmt dry-run check
```

No test framework is configured yet.

## Architecture

### Data Flow: sources/ → SSR → Client Components

1. **`sources/`** is the content layer. Each Python example is a pair of files:
   - `*.py` — the Python source code displayed to the user
   - `*.steps.json` — manually authored step-by-step execution trace (the visualization data)
   - Both must share the same filename and live in the same directory. Subdirectories become categories.

2. **`src/lib/sources.ts`** (server-only) recursively walks `sources/`, reads `.py` + `.steps.json` pairs, and exposes `getSourceFiles()`, `getSourceBySlug()`, `getSourceCategories()`. These functions use `node:fs` and must only run on the server.

3. **`src/app/learn/[slug]/page.tsx`** is a Server Component. It calls `generateStaticParams()` at build time to pre-render all source pages (SSG). It passes the `SourceFile` data as a prop to the client component.

4. **`src/app/learn/[slug]/LearnPageClient.tsx`** is the `"use client"` boundary. It receives the full source data as a prop, hydrates the Zustand store with `setSteps()`, and renders all visualizer + playback components.

### Key Pattern: Server/Client Boundary

All file I/O and data loading happens in server components (`page.tsx`, `src/lib/sources.ts`). Client components (`LearnPageClient`, all visualizer/player components) receive data only via props or the Zustand store. Never import `sources.ts` from a client component.

### State Management

`src/stores/playback.ts` (Zustand) owns playback state: `currentStep`, `isPlaying`, `speed`, `steps`. The `play()` method uses `setTimeout` recursion for auto-advance. All visualizer components read `currentStep` and derive their display from `steps[currentStep]`.

### Step Data Model (`src/types/visualizer.ts`)

- `Step.line` (1-based) maps to the line number in the `.py` file — `CodeStepper` highlights this line.
- `Step.action` determines the badge color and label in `FlowAnimator`.
- `Step.vars` is a snapshot: `VariableTracker` replays all vars from step 0 to `currentStep` to show current state (later steps overwrite earlier ones for the same var name).
- `Step.changed` on a `StepVar` triggers the amber highlight in `VariableTracker`.
- `Step.callStack` is only present in recursion examples; `CallStack` component renders conditionally.

### Adding a New Python Example

1. Create `sources/<category>/<name>.py` with the Python code
2. Create `sources/<category>/<name>.steps.json` with `{ title, description, steps: [...] }` — line numbers must match the `.py` file
3. Rebuild — the page is auto-generated at `/learn/<category>/<name>`

### UI System

- Dark theme with CSS custom properties defined in `src/app/globals.css` (`--bg-primary: #050816`, etc.)
- Utility classes `gradient-text`, `glow-card`, `gradient-btn`, `category-badge` are defined in `globals.css` — use these for consistent styling
- Tailwind CSS v4 with `@theme inline` for design tokens
- framer-motion `AnimatePresence` + `layoutId="highlight"` for the line-highlight animation in `CodeStepper`

### Config Files

- `oxlintrc.json` — oxlint rules (no `oxlint.config.*` filename)
- `.oxfmtrc.json` — oxfmt config (2-space indent, no semicolons, double quotes, trailing commas)
- Path alias: `@/*` → `./src/*`

## Next.js Version Note

This project uses Next.js 16.x with breaking changes from earlier versions. When modifying App Router code, consult `node_modules/next/dist/docs/` for current API signatures — particularly `params` is now a `Promise` that must be awaited in page components.
