# AtlasForge — Final Roadmap to 10 December 2026

**Start:** 13 November 2026 · **Public release:** 10 December 2026  
**Rule:** Deploy early; ship tested vertical slices; reserve the final week for stability.

## Phase 0 — Audit and deploy the existing MVP (13–14 Nov)

- [ ] Read current `AGENTS.md`, code, CI status and branch history.
- [ ] Add these finalized planning docs and link from README.
- [ ] Inventory existing features against `ED-*`, `GEN-*`, `IO-*`, `REL-*` IDs.
- [ ] Confirm `npm ci`, lint, tests, production build, and first Vercel deployment.
- [ ] Create small GitHub issues for gaps; keep working features intact.

**Exit:** Live URL exists and the actual P0 gap list is known.

## Phase 1 — Editing + deterministic map foundation (15–20 Nov)

- [ ] Finish selection, polygon and label dragging, vertex editing (`ED-04`–`ED-08`).
- [ ] Correct pan/zoom math and one-action undo/redo (`ED-02`, `ED-10`).
- [ ] Seeded irregular landmass generator (`GEN-01`).
- [ ] Bounded procedural region subdivision (`GEN-02`).
- [ ] Add geometry, reproducibility, validity, and undo tests.
- [ ] Deploy working vertical slice.

**Exit:** A generated landmass and its regions are editable at 50%, 100%, and 200% zoom.

## Phase 2 — Prompt-to-map AI (21–27 Nov)

- [ ] Define strict `GenerationSpec` and validation tests (`GEN-04`).
- [ ] Add server-side model route, input bounds, timeout, provider error mapping (`GEN-03`, `GEN-07`).
- [ ] Convert spec into deterministic map geometry and document objects (`GEN-05`).
- [ ] AI-assisted place naming, duplicate handling, and fallback naming (`GEN-06`).
- [ ] Handle malformed response, missing key, provider quota, and explicit procedural fallback (`GEN-08`).
- [ ] Generation as a single undoable transaction (`GEN-09`).
- [ ] Test and deploy prompt-to-map end to end with configured provider.

**Exit:** User prompt → valid plan → editable map; simulated AI failure does not break the editor.

## Phase 3 — Product polish and portability (28 Nov–3 Dec)

- [ ] Light floating editor UI, contextual inspector, object list/layers (`ED-09`, `ED-12`).
- [ ] Three map themes and region styling (`ED-11`).
- [ ] Autosave, schema-safe JSON import/export, generated-map round-trip (`IO-01`–`IO-03`, `GEN-10`).
- [ ] Reliable PNG export (`IO-04`).
- [ ] Responsive and keyboard usability smoke tests.
- [ ] Sample world map and short walkthrough.

**Exit:** Another person can generate/edit/style/save/export a map on the live URL.

## Phase 4 — Stabilize and freeze (4–5 Dec)

- [ ] Run all release acceptance scenarios in `REQUIREMENTS.md`.
- [ ] Verify no exposed secrets and enforceable AI quota/rate/budget controls.
- [ ] Confirm CI, Vercel preview and production build.
- [ ] Fix blocker bugs; stop all new feature work by end of 5 Dec.

**Exit:** Release candidate with no known P0 blockers.

## Phase 5 — Release preparation (6–9 Dec)

- [ ] Recheck public AI generation and procedural fallback.
- [ ] Test clean browser session and JSON round-trip.
- [ ] Finalize README, architecture diagram, screenshots, demo video (optional), limitations and deployment guide.
- [ ] Produce example maps and release notes; verify links.
- [ ] Check all other portfolio projects against the shared release standard.

**Exit:** CV-ready public demo, reproducible build and evidence.

## Release day (10 Dec)

- [ ] Green GitHub Actions on release commit.
- [ ] Live URL smoke test: blank map, prompt-to-map, drag/edit, autosave, import/export, PNG.
- [ ] Confirm AI request controls and fallback behavior.
- [ ] Tag `v1.0.0` and publish release notes.
- [ ] Update portfolio/CV links with verified URLs only.

## Scope-cutting order if behind

1. Drop P1 entirely (terrain, AI edit commands, SVG export, minimap, templates).
2. Reduce visual flourishes and advanced styling, **not** usable core controls.
3. Simplify procedural generation to a few bounded landmass/region presets.
4. Reduce AI prompt vocabulary to supported structured intents and show limitations clearly.
5. Preserve P0: editable output, validation, persistence, public deployment, tests, security.

**No invented functionality:** If an essential P0 cannot be finished, disclose it and do not label the release complete.

## Daily checkpoint (5–10 minutes)

- What changed in the deployed app?
- Which requirement IDs now pass?
- Did CI/build pass? Are production and preview URLs healthy?
- What is the next smallest PR?
- Did new scope displace an existing P0 task?

## Parallel portfolio constraint

AtlasForge is one project among several. Do not use the entire remaining month on AtlasForge polish while other projects remain undeployed. Use `PORTFOLIO_RELEASE_STANDARD.md` for shared release evidence and prioritize the three strongest flagships for CV prominence.

## Milestone: Naturalistic Vector Geography Engine

**Target:** November 18–23, 2026  
**Priority:** P0 — Mandatory for December 10 release  
**Dependencies:** Existing SVG viewport, map schema and coordinate transformations.

### Objective

Build a deterministic procedural geography engine capable of generating visually convincing fictional continents, coastlines and archipelagos as smooth, editable SVG geometry.

### Implementation tasks

- [ ] Implement seeded random generation for reproducible maps.
- [ ] Generate continent-scale landmass masks using multiscale coherent noise and spatial distortion.
- [ ] Support multiple continents with varied shapes, sizes and positions.
- [ ] Generate natural-looking bays, peninsulas, headlands and island chains.
- [ ] Extract polygon boundaries using Marching Squares or an equivalent contouring algorithm.
- [ ] Simplify coastline geometry while preserving important geographic features.
- [ ] Implement controlled vector smoothing without introducing invalid geometry.
- [ ] Validate generated polygons for self-intersections, degenerate rings and coordinate errors.
- [ ] Convert generated coastlines into the existing editable AtlasForge map schema.
- [ ] Add generation controls for seed, continent count, land coverage and coastline complexity.
- [ ] Write unit tests for determinism, polygon validity and serialization.
- [ ] Integrate generated maps into the existing editor with undo/redo support.

### Acceptance criteria

1. The same seed and settings produce identical geometry.
2. Different seeds produce visibly different continent layouts.
3. Coastlines remain visually smooth at 50%, 100%, 200% and 400% zoom.
4. Generated continents include varied coastal features rather than simple radial polygons.
5. Every generated landmass can be selected, edited, saved, reopened and exported.
6. Generated geometry passes validation and does not introduce self-intersections.
7. Generation completes within an interactive time budget, initially targeting under 3 seconds for a typical world map on the development laptop.
8. Existing manually created maps remain compatible.

### Git commit milestones

1. `feat: implement deterministic geography generation`
2. `feat: generate multiscale continental landmasses`
3. `feat: extract and simplify vector coastlines`
4. `feat: add polygon validation and smoothing`
5. `feat: integrate procedural maps into editor`
6. `test: verify procedural geography invariants`

### Engineering constraints

- Use TypeScript and the existing Next.js architecture.
- Use SVG paths for rendering.
- Keep generation logic separate from React components.
- Do not require an LLM for procedural generation.
- Do not introduce a database.
- Prefer pure functions with explicit inputs and outputs.
- Preserve the existing versioned JSON document format.
- Prioritize correct, editable geometry over decorative textures.

### Dependency on AI generation

AI prompt-to-map generation must reuse this procedural engine.

The LLM produces a validated structured map specification containing geographic parameters and constraints. The procedural engine converts that specification into editable vector geometry.

Do not generate entire coastlines directly as LLM-produced coordinate arrays.

### Definition of Done

The milestone is complete when a user can generate a believable fictional world, edit its continents, save the project, reopen it and export the resulting map successfully.