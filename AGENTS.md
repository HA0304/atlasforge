
# AtlasForge — Agent Instructions

## Project
AtlasForge is a browser-based fictionagl map editor.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Native SVG rendering
- npm
- Vitest for unit tests
- Vercel deployment

## MVP
1. Canvas with pan and zoom
2. Polygon creation, selection and editing
3. Text labels
4. Browser autosave
5. JSON import/export
6. Undo for editor actions

## Architecture
- Store geometry in fixed world coordinates.
- Keep rendering separate from editor state.
- Separate geometry, serialization and UI modules.
- Use a versioned JSON document format.
- Do not introduce a backend or database.
- Avoid unnecessary dependencies.

## Quality Rules
- Use TypeScript types; avoid `any`.
- Implement real functionality, not mock buttons.
- Add unit tests for pure geometry functions.
- Validate imported JSON.
- Handle empty and malformed maps.
- Do not disable ESLint or TypeScript checks.
- Do not modify CI workflows without approval.
- Never commit credentials or secrets.
- Keep commits scoped and descriptive.

## Completion Checks
- npm run lint
- npm run test
- npm run build

## Git Workflow
- Work on feature branches.
- Make meaningful commits after each module.
- Never force-push or rewrite main history.
- Do not auto-merge pull requests.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
