# AtlasForge — Final v1.0 Requirements Specification

**Deadline:** 10 December 2026  
**Priority:** **P0** required to release · **P1** stretch · **P2** later  
**Traceability:** Reference IDs in issues, tests, and PRs. A checked box in a spreadsheet is not proof; verify behavior.

## A. Editor functional requirements

| ID | Priority | Requirement | Verifiable acceptance |
|---|---|---|---|
| ED-01 | P0 | Blank map | A new versioned editable document opens without login. |
| ED-02 | P0 | Viewport | Pan, wheel zoom around cursor, buttons, reset; screen/world transforms are correct. |
| ED-03 | P0 | Polygon drawing | User closes a valid polygon of ≥3 distinct vertices; invalid polygons are rejected with feedback. |
| ED-04 | P0 | Object movement | Drag region/label/marker at 0.5×, 1×, 2× zoom without deformation or accidental panning. |
| ED-05 | P0 | Vertex editing | Drag one region vertex without moving others; save/load preserves result. |
| ED-06 | P0 | Region properties | Rename, fill, stroke, select, and delete regions. |
| ED-07 | P0 | Text labels | Add, edit, position, select, and delete labels. |
| ED-08 | P0 | Settlements | Add, name, position, select, and delete settlement markers. |
| ED-09 | P0 | Layers/object list | Select, hide/show, and reorder objects using a simple understandable UI. |
| ED-10 | P0 | Undo/redo | One completed drag = one history action; redo works; generating a map is undoable. |
| ED-11 | P0 | Themes | Minimalist, political, parchment presets plus per-region color editing. |
| ED-12 | P0 | Floating UI | Canvas-first light UI with contextual inspector, keyboard-accessible named controls. |
| ED-13 | P0 | Clear state | Selected tool, pending drawing, save status, errors, and generation progress are visible. |

## B. Generation functional requirements

| ID | Priority | Requirement | Verifiable acceptance |
|---|---|---|---|
| GEN-01 | P0 | Seeded landmasses | Same seed and settings generate equivalent editable land polygons. |
| GEN-02 | P0 | Region subdivision | A landmass can be divided into multiple nonempty, bounded, editable regions. |
| GEN-03 | P0 | Natural-language prompt | User enters a geography prompt and starts generation through the UI. |
| GEN-04 | P0 | AI map specification | Server converts prompt to a **schema-validated** map plan, not executable content or direct raster art. |
| GEN-05 | P0 | Editable conversion | Generator turns the plan into standard region, label, and settlement document objects. |
| GEN-06 | P0 | AI-assisted naming | Model provides region/place names; generated text is treated as untrusted data. |
| GEN-07 | P0 | Safe limits | Prompt length, counts, coordinates, response size, provider timeout, and request rate/budget are bounded. |
| GEN-08 | P0 | Failure behavior | Invalid output, quota exhaustion, timeout, or no key gives honest error + explicit procedural fallback. |
| GEN-09 | P0 | Generation undo | User can undo a completed generation/import transaction without corrupting the previous map. |
| GEN-10 | P0 | Portability | AI-generated objects survive autosave, JSON round-trip, and PNG export like manually drawn objects. |
| GEN-11 | P1 | Terrain features | Generate simple rivers/mountain symbols as editable or regenerable map objects. |
| GEN-12 | P1 | Prompt-based edits | Apply a validated natural-language change to selected objects, with preview/undo. |

## C. Persistence, export and deployment requirements

| ID | Priority | Requirement | Verifiable acceptance |
|---|---|---|---|
| IO-01 | P0 | Autosave | Reload in same browser restores last successfully persisted document; storage failures are visible. |
| IO-02 | P0 | JSON export | Download versioned JSON with IDs, geometry, labels, settings, and style. |
| IO-03 | P0 | JSON import | Invalid/malformed/unsupported files do not overwrite active document. |
| IO-04 | P0 | PNG export | Valid readable image with full map bounds, no editor controls, at documented resolution. |
| IO-05 | P1 | SVG export | Standalone valid SVG with artwork and no UI overlays. |
| REL-01 | P0 | CI | GitHub Actions runs install, lint, tests, production build on PRs. |
| REL-02 | P0 | Live deployment | Production Vercel URL loads and supports core editing, save/load, export, and generation. |
| REL-03 | P0 | Public demo | Sample project, usage instructions, screenshots and reproducible demo scenario exist. |
| REL-04 | P0 | Release artifact | Tagged `v1.0.0` and documented deployment configuration/limitations. |

## D. Nonfunctional requirements

| ID | Priority | Requirement | Verification |
|---|---|---|---|
| NFR-01 | P0 | Type safety | `npm run build` passes without suppressing TypeScript errors. |
| NFR-02 | P0 | Testability | Pure geometry, transforms, schema, generator modules have deterministic tests. |
| NFR-03 | P0 | Data integrity | IDs, world coordinates and styles preserved; invalid import cannot destroy existing work. |
| NFR-04 | P0 | Layout | No essential control overlap at 1366×768 and 1920×1080. |
| NFR-05 | P0 | Responsiveness | A map of 100 regions + 200 labels remains usable; record actual performance on development hardware. |
| NFR-06 | P0 | Accessibility | Focus visible, keyboard tool selection, accessible names, sufficient contrast, no color-only feedback. |
| NFR-07 | P0 | Secrets/security | Provider keys server-only; no unsafe HTML; untrusted model and import data validated. |
| NFR-08 | P0 | AI reliability | Explicit timeout, output parsing failure, bounded retries, clear user feedback and procedural fallback. |
| NFR-09 | P0 | Local-first privacy | Maps remain in browser/local files by default; only the **prompt** and necessary generation options are sent to the model provider with user action. |
| NFR-10 | P0 | Maintainability | Editor state, viewport, geometry, AI spec, document serialization separated; reviewable commits. |
| NFR-11 | P0 | Deployability | Fresh clone `npm ci && npm run lint && npm run test && npm run build` passes (with documented env handling). |

## E. Data contracts and model boundaries

**MapDocument** (existing shape takes precedence):
- `schemaVersion` (required), stable IDs, world dimensions, regions, labels, settlements, theme/settings.
- Coordinates in **world space**, never viewport pixels. Camera is independent of document geometry.
- Import uses a validated, atomic replace operation; support migration or reject unsupported versions.

**GenerationSpec** (separate from MapDocument; example, not a mandatory exact schema):

```json
{
  "version": 1,
  "seed": 12345,
  "worldStyle": "archipelago",
  "landmassCount": 5,
  "regionCount": 3,
  "settlements": [
    {"name": "Northport", "kind": "port"},
    {"name": "Stonehaven", "kind": "town"}
  ],
  "theme": "parchment"
}
```

- AI may suggest counts, categories, names, and style preferences. **Procedural code** produces actual polygons and places objects within valid geometry.
- Validate with the project's chosen schema library or equivalent strict validator; clamp/reject unsupported counts and unknown properties.
- Establish safe configurable caps (e.g., 2,000 prompt characters; ≤12 landmasses; ≤40 regions; ≤100 settlements) and document them. These are planning defaults, not measured system limits.
- Generated IDs must be unique. Seeded geometry should be reproducible **independently of LLM sampling** when given the same validated spec and seed.

## F. Release acceptance tests

1. **Pan/zoom:** At 2× zoom, a 100-pixel drag moves an object 50 world units; at 0.5× it moves 200. Cursor-centered zoom keeps the pointer's world point fixed.
2. **Drag isolation:** Drag a label; viewport does not pan. Drag empty canvas in pan mode; objects do not move.
3. **Geometry:** Move a region without changing relative vertex positions; move one vertex independently.
4. **Undo:** Drag once → one undo action; undo generation restores prior document.
5. **Seed reproducibility:** Same seed and generator settings → equivalent region geometry; different seed usually changes it.
6. **Prompt-to-map:** Prompt for an archipelago with three regions and two named ports; receive a valid plan and editable map, not a static image.
7. **AI invalid response:** Simulate malformed or oversized model output; UI reports error, preserves existing map and offers fallback.
8. **Provider outage:** Simulate timeout/quota failure; procedural-only generation still works, clearly labeled as such.
9. **Round-trip:** 10 regions and 20 labels/settlements export/import with stable IDs, coordinates and styles.
10. **Import safety:** Malformed JSON and unsupported version leave the open document unchanged.
11. **Image export:** PNG has visible artwork and labels, without toolbar or inspector.
12. **Themes/UI:** All three themes readable at 1366×768 and 1920×1080; controls keyboard accessible.
13. **Security:** No provider secret appears in browser bundle, repository or network response; oversized inputs rejected.
14. **Production:** Fresh browser loads public deployment; manual and AI generation work with configured provider; save/export work; CI green.

## G. Completion rule

Each requirement must have a **test, reproducible manual verification, or deployment evidence**. Mark a requirement complete only when verified. P1 does not count toward P0 release readiness.

## Naturalistic Vector Geography — Mandatory v1.0

**GEO-01 — Naturalistic continental shapes (P0)**

Generate fictional continents using multiscale coherent noise and seeded shape variation. Coastlines must contain believable bays, peninsulas, headlands and varied landmass proportions rather than simple radial polygons.

**GEO-02 — Smooth vector coastlines (P0)**

Render generated landmasses as resolution-independent SVG paths. Apply contour simplification and controlled smoothing without introducing self-intersections or destroying significant coastal features.

**GEO-03 — Island generation (P0)**

Support multiple continents, smaller islands and clustered archipelagos, with reproducible placement from a numeric seed.

**GEO-04 — Editable generated geography (P0)**

All generated coastlines must remain editable. Moving vertices, reshaping landmasses, saving and reloading must preserve valid geometry. Smooth rendering must remain compatible with editing.

**GEO-05 — Geographic variation (P0)**

Expose generation parameters for continent count, land coverage, coastline complexity and seed.

**GEO-06 — Geometry validation (P0)**

Reject or repair invalid generated geometry, including self-intersections, degenerate polygons and out-of-bounds coordinates.

### Acceptance criteria

- Generate at least three visually distinct world layouts using different seeds.
- Regenerating with the same seed and settings produces identical geometry.
- Coastlines remain smooth at 50%, 100%, 200% and 400% zoom.
- Generated continents can be selected, reshaped, saved, reloaded and exported.
- Generated landmasses have visible variation in scale and coastline complexity.
- The generator completes within a reasonable interactive time for the supported map size.

### Out of scope for v1.0

- Scientific plate tectonic simulation.
- Erosion and hydrological simulation.
- Climate-driven biome generation.
- Real-world GIS geographic accuracy.