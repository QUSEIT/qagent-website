# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chinese-language marketing landing page for Q Agent — an enterprise AI agent platform built on the OpenClaw open-source ecosystem. Single-page SPA with iframe-compatibility for embedding.

## Development Commands

```bash
npm run dev      # Start webpack-dev-server on port 3266
npm run build    # Production build to docs/
npm run typecheck # TypeScript type check (no emit)
```

## Architecture

- **Entry:** `src/index.tsx` → `src/App.tsx` (entire landing page in one file, ~1100 lines)
- **Sections in App.tsx:** Navigation, Hero, Principle (architecture diagram), Features, Deployment, Showcase, CTA, Footer
- **Theme system** (`src/hooks/useTheme.ts`): Light/dark modes; theme is set via `<script>` in `index.html` before React loads to prevent flash. App listens for `postMessage` from parent window for iframe embedding.
- **Styling:** Tailwind with `class`-based dark mode toggle. Custom scrollbar in `src/styles/index.css`.
- **Animations:** Framer Motion for scroll-triggered `whileInView` animations.

## Build Output

Production build goes to `docs/` (configured for static hosting). The `CNAME` file maps to `agent.quseit.com`.

## Notes

- Some dependencies (Recharts, Supabase, date-fns) are installed but unused in the current codebase.
- Content is entirely in Chinese (zh-CN).
