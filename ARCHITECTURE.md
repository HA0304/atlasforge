# AtlasForge — Final v1.0 Architecture

**Guiding principle:** Extend the existing Next.js/TypeScript/SVG MVP; **do not rebuild** working features.

## 1. Technology decisions

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, SVG map rendering, lightweight React state or existing store.
- **Persistence:** localStorage autosave + versioned JSON import/export. No accounts or database.
- **AI integration:** a **server-side Next.js route** calling a configured LLM provider (e.g., OpenRouter) to return a structured `GenerationSpec`. Do not call a provider directly from browser code with a secret.
- **Procedural engine:** pure deterministic TypeScript functions for coastlines, subdivision, placement and seeded random numbers.
- **Validation:** schema validation for user inputs, imported JSON, and model outputs (e.g., Zod if already installed/justified).
- **Quality/deploy:** Vitest or existing test runner, GitHub Actions, Vercel previews and production.

## 2. Logical pipeline

```text
User prompt (client)
   ↓ explicit Generate click
POST /api/generate-map (server; rate/size/time controls)
   ↓ LLM provider with server-side credentials
Untrusted structured response
   ↓ parse + strict GenerationSpec validation
Validated GenerationSpec
   ↓ deterministic procedural geometry engine (client or server)
MapDocument: regions + settlements + labels + styles
   ↓ atomic editor transaction + undo history
Editable SVG canvas → local save / JSON export / PNG export
```

**Fallback:** If provider unavailable or invalid, explain failure and offer **procedural-only** generation with user-specified seed and parameters. Do not silently call it AI.

## 3. Suggested modules (adapt to existing paths)

```text
src/
  app/
    page.tsx
    api/generate-map/route.ts       # server-only provider access
  components/editor/               # canvas, floating toolbar, inspector, layers
  components/generation/           # prompt form, status, procedural fallback
  lib/geometry/                    # transforms, polygon validity, hit testing
  lib/generation/                  # seeded RNG, coastlines, subdivision, placement
  lib/ai/                          # GenerationSpec schema, prompt adapter, response parser
  lib/document/                    # versioned map schema, migration, JSON import/export
  lib/editor/                      # selection, commands, undo/redo
  lib/export/                      # PNG export
  types/                           # shared types where useful
tests/ or co-located *.test.ts
.github/workflows/ci.yml
```

Keep model-provider code server-only; avoid accidentally importing it into client bundles. These are logical boundaries, not mandatory folders.

## 4. State ownership

- **Document:** world dimensions, polygons, labels, settlements, style, layers, IDs, schemaVersion. Serializable.
- **Viewport:** pan, zoom, CSS canvas size. Does not mutate document geometry.
- **Transient UI:** active tool, selection, hover, draft polygon, drag state, open panels, generation status.
- **History:** capture a completed gesture/generation as one command or snapshot; do not store every pointer frame.

## 5. World/screen coordinate math

For screen coordinates local to the canvas:

```text
screenX = worldX * zoom + panX
screenY = worldY * zoom + panY
worldX = (screenX - panX) / zoom
worldY = (screenY - panY) / zoom
worldDragDelta = screenDragDelta / zoom
```

For cursor-centered zoom, find world point under cursor **before** changing zoom, then update pan so that point stays at the same canvas pixel. Handle canvas offsets, pointer capture, cancel events, and device scaling consistently. Test at zoom 0.5, 1, 2 with nonzero pan.

## 6. Generation design

- LLM **interprets semantics** (counts, layout intent, themes, names); it does not generate thousands of polygon coordinates.
- Generator consumes a validated spec and seed, and creates geometry inside world bounds.
- Start with bounded irregular polygons and simple nonoverlapping subdivisions. Avoid self-intersections and degenerate regions; test validity.
- Place settlements inside regions when requested; if impossible, return a documented warning or deterministic safe placement.
- AI names are untrusted strings: length-limit, escape on rendering, avoid duplicate names where practical.
- Generation should be deterministic for a fixed validated spec + seed, regardless of provider variability.
- A new generation replaces/adds objects only after successful validation; make it undoable.

## 7. AI API contract and security

Proposed endpoint: `POST /api/generate-map`

Request: `{ "prompt": "...", "seed": 12345, "options": { ... } }`  
Response on success: `{ "spec": { ... }, "warnings": [] }`  
Failure: `{ "error": { "code": "PROVIDER_UNAVAILABLE", "message": "..." } }` with appropriate HTTP status.

- Configure provider credentials in **Vercel server environment variables** (e.g., `OPENROUTER_API_KEY`); never use `NEXT_PUBLIC_` for secrets.
- Validate input before provider call and output after provider response; reject excessive payloads, unsupported fields, non-finite numbers and malformed JSON.
- Use strict timeout, limited retries, capped output tokens, and an explicit error state.
- For a public anonymous demo, use an enforceable rate/budget control appropriate to serverless hosting (gateway quotas, managed rate limiter, or provider account caps). **Do not rely solely on process-local counters** in serverless functions.
- Prevent sensitive map documents from being sent implicitly; only send the prompt and required options after user action. Disclose that prompts go to a third-party model provider.
- Never log provider secrets or raw sensitive prompts by default.
- If no server key is configured, disable AI requests gracefully; editor and procedural fallback must remain operational.

## 8. Save/export and resilience

- Use `schemaVersion`, stable IDs and atomic validation before import/replacement.
- Existing documents should remain loadable; add migrations only when schema changes require them.
- Autosave errors (quota/storage denied) must surface; provide manual JSON export.
- PNG export renders map artwork only, at documented resolution; hide editor overlays, selection handles and controls.
- Preserve local-only map content unless the user explicitly submits a generation prompt.

## 9. UI direction

- Hyacinths-inspired **light canvas-first** design: warm off-white canvas, floating top pill toolbar, subtle shadows, small zoom controls, contextual popovers, optional collapsed object list.
- Suggested tokens: canvas `#F7F5EF`, land `#B8D4A5`, water `#8DB7B2`, accent `#D8C49A`, ink `#353F39`.
- Build an original design, not a clone of the reference website. Avoid permanent heavy sidebars and ornamental animation.
- All visible buttons must function; accessible names and focus states required.

## 10. Engineering workflow

- Read `AGENTS.md` and all `docs/*.md` before implementing a feature.
- Branches and small reviewable commits; no direct push to protected `main`, force-push or auto-merge.
- GitHub Actions: `npm ci`, lint, tests, build. Deploy Vercel previews from PRs and production from main.
- Keep app deployable throughout the month. A feature is not complete if it breaks production build.
- Record requirements IDs in issues and PRs; document any intentional divergence from this architecture.

## 11. Post-v1 options

Richer terrain and climate, computer-vision map tracing, multiscale city maps, collaboration, and WebGL renderer are future tracks. They are **not** v1 blockers.
