# AtlasForge — Final v1.0 Project Scope

**Status:** Approved planning baseline for implementation (supersedes earlier drafts)  
**Planning date:** 13 November 2026  
**Release deadline:** **10 December 2026**  
**Product:** Local-first, browser-based fictional cartography studio  
**Target audience:** Fantasy writers, TTRPG creators, worldbuilders, hobbyist cartographers

## 1. Product promise

AtlasForge lets someone **create a fictional map manually or from a natural-language prompt**, then **edit the actual map objects**, style the world, save a portable project, and export a finished image. It is a usable creative tool, not a static AI image generator or a full GIS simulator.

**One-line portfolio pitch:** *A browser-based fantasy map editor combining interactive SVG geometry, seeded procedural generation, and AI-driven prompt-to-map workflows.*

## 2. Non-negotiable v1.0 user journey

1. Open the public app without creating an account.
2. Start a blank map **or** enter a prompt such as “A five-island archipelago with three rival kingdoms and two port cities.”
3. For prompt mode: receive a validated map plan, then deterministic geometry and named, editable map objects. If AI is unavailable, see an explicit error and an offered procedural-only generator; do not misrepresent fallback as AI.
4. Select, move, reshape, name, recolor, reorder, and delete map regions; place and edit labels and settlement markers.
5. Apply a map theme; pan/zoom without corrupting world coordinates; undo/redo edits.
6. Refresh and recover the locally saved project, export/import versioned JSON, and export a readable PNG.
7. Repeat this journey on the **production deployment**, not just localhost.

## 3. P0 — release-blocking scope

### Core editor
- Full-screen responsive **SVG** map canvas, cursor-centered zoom, pan, reset, select/polygon/text tools.
- Draw, select, drag, rename, recolor, delete, and **vertex-edit** polygon regions.
- Add, edit, move, and delete labels and city/settlement markers.
- Simple layers/object list with visibility, selection, and ordering.
- Undo/redo of completed editing gestures; sensible keyboard shortcuts.
- Three presentable styles: **minimalist, political, parchment**.
- Minimal, light, Hyacinths-inspired floating toolbar and contextual object controls. Original styling/assets only.

### Map generation
- **Seeded procedural landmass generation** producing repeatable, editable polygons.
- **Procedural region subdivision** into multiple editable territories; valid polygon geometry is required.
- **Prompt-to-map AI**: model translates natural language into a **strictly validated structured map specification**, never arbitrary HTML/code or an enormous raw polygon list.
- Geometry engine converts the validated specification into ordinary AtlasForge document objects.
- AI-assisted **settlement/place naming** with a deterministic naming fallback.
- Generation has clear progress/error states, sensible complexity limits, and an explicit procedural-only fallback.

### Data, quality, and public release
- Local autosave and portable, versioned JSON import/export; validate before replacement.
- PNG export containing only the map artwork, not editor chrome.
- Automated geometry, validation, serialization, and generation tests; GitHub Actions lint/test/build.
- Live Vercel production deployment, documented setup, sample map, README, screenshots, and release tag.
- Server-side AI requests with protected secrets, input/output validation, request/time/size limits, and a budget/abuse-control strategy.

## 4. P1 — optional after P0 works

- Natural-language **editing of selected regions** (“make this kingdom mountainous”).
- Rivers, mountain symbols, and richer procedural terrain.
- SVG export, minimap, command palette, extra templates, touch pinch zoom, advanced typography.
- Additional generation presets or model providers.

**P1 never delays deployment.** Remove or defer P1 when the P0 timeline is threatened.

## 5. P2 — deliberately excluded

- Raster AI image generation as the map's editable source; image diffusion/texture pipeline.
- Azgaar-scale climate/biome/population/civilization simulation, real-world GIS projections.
- Roads, city street maps, complex hydrology, routing, 3D, multiplayer.
- OCR, scanned-map computer vision tracing, image-to-map boundary extraction.
- Accounts, cloud storage, shared editing, payments, marketplaces, native mobile apps.
- A permanent database or user-profile backend.

**Architecture note:** A small **server-side Next.js API route for AI requests is in scope**; a separate database-backed backend is not. This supersedes the earlier “no backend at all” statement.

## 6. Release acceptance (definition of done)

AtlasForge v1.0 is released only if all of these are true:

- Manual map editing and prompt-to-map generation both produce editable objects.
- A prompt-generated map can be renamed, vertex-edited, saved as JSON, re-imported, and exported as PNG.
- A fixed seed/settings combination yields equivalent geometry across repeated runs.
- A sample containing **10 polygons and 20 labels/settlements** round-trips through JSON with no loss of IDs or geometry.
- Polygon and label drag work at **50%, 100%, 200%** zoom; a drag creates one undo step.
- At least three themes render legibly, and the exported PNG excludes UI controls.
- No credentials are exposed in client bundles or source control.
- CI passes; the production URL is tested in a fresh browser session.
- The AI feature is demonstrable with an available configured provider, **and** the procedural fallback remains functional during provider outages/quota exhaustion.
- `README.md` links the live app and shows architecture, setup, screenshots, usage, limitations, and a short demo.

## 7. Schedule and scope control

- **13–14 Nov:** Baseline, repo audit, requirements, first working deployment.
- **15–20 Nov:** Direct manipulation, document stability, procedural geometry foundation.
- **21–27 Nov:** AI structured specification pipeline, subdivision, naming, validation.
- **28 Nov–3 Dec:** UI polish, themes, layers, exports, full integration.
- **4–5 Dec:** End-to-end testing, deployment hardening, feature freeze.
- **6–9 Dec:** Bugs, docs, screenshots, demo and release candidate.
- **10 Dec:** Production verification and `v1.0.0` release.

A new P0 request requires an explicit tradeoff against another task. **No new major features after 5 December.** A smaller reliable public product beats a bigger unshippable one.

## 8. Portfolio integration

**All portfolio projects** share a **10 December deployability deadline**. AtlasForge is one flagship, not an excuse to neglect other releases. See `PORTFOLIO_RELEASE_STANDARD.md`. A CLI/library can be CV-ready via a versioned reproducible release rather than an artificial hosted website.
