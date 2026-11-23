# Deterministic Geography Engine

## Algorithm

1. `createSeededRandom` and grid value noise provide deterministic multiscale
   variation.
2. `generateLandMask` combines seeded elliptical continent fields with fractal
   noise. It sorts the field scores and thresholds the lowest cutoff needed to
   approach the requested land coverage.
3. `extractMarchingSquares` traces the outer boundary edges of the boolean mask.
   This grid-edge tracer is a documented equivalent to contour extraction:
   land-to-water edges are directed around each component, chained by exact
   endpoints, and closed into rings. It supports multiple islands and produces
   closed contours for touching diagonal masks only through deterministic
   component separation.
4. `simplifyAndSmoothRing` applies Ramer-Douglas-Peucker simplification and
   guarded one-pass Chaikin smoothing. The result is rejected and, where valid,
   falls back to unsmoothed simplified geometry if smoothing creates
   intersections or leaves bounds.

## Tradeoffs

- The mask is sampled on a 120 x 80 grid for predictable interactive runtime;
  it is not a resolution-independent raster source.
- Scalar percentile thresholding approximates the requested land coverage but
  is influenced by coarse-grid resolution.
- Grid-edge contours are stair-stepped before smoothing. Controlled smoothing
  improves coastline appearance but can remove very small features.
- Tiny rings are filtered from generated output. Ring simplification and
  smoothing are always validated against bounds, area and self-intersection.
- The implementation intentionally does not merge or create holes. Separate
  generated rings remain separate polygon topology.

## Output and UI

Generated rings are converted into the existing `MapDocument` polygon features,
so JSON serialization, selection, dragging, vertex editing and undo history
remain compatible. A pure SVG path/string is also produced for vector preview.

The existing editor has a **G / Generate seeded map** control. It creates a
deterministic map from a built-in validated example specification.

## Evidence

- Three seed fixtures are stored at
  `src/lib/generation/fixtures/three-seeds.json`.
- Repeatability tests compare masks and complete generated SVG data.
- Representative 1200 x 800 generation measured 68.322 ms in the development
  Vitest environment.
- This is one measured run, not a browser-frame guarantee or sustained FPS
  result.
