# AtlasForge Test Handoff — November 19

## Automated checks completed November 18

- `npm run lint`: passed.
- `npm run test`: passed with 55 tests before the benchmark was added.
- `npm run build`: passed.
- Benchmark: `npx vitest run src/lib/map/performance.test.ts --reporter verbose`: passed.
  - 100 polygons: 0.018 ms per operation.
  - 500 polygons: 0.072 ms per operation.
  - 1,000 polygons: 0.054 ms per operation.
- Environment: Linux development machine in this workspace; Node/Vite Vitest
  benchmark repeated each operation 200 times. These are microbenchmark averages,
  not browser-frame or end-to-end performance measurements.

## Automated coverage already present

- Screen/world coordinate conversion and zoom behavior.
- Polygon validity, duplicate/collinear points, self-intersection and vertex
  rejection.
- Polygon and label movement.
- 50-entry bounded document history.
- Undo/redo and redo-branch invalidation.
- JSON round-trip, malformed JSON, unsupported versions and map bounds.

## Minimal browser smoke test

- The development server rendered the AtlasForge canvas and floating toolbar.
- The polygon tool can be selected and the draw hint appears.
- Browser coordinate-drawing attempts at this session did not provide enough
  verified evidence to mark drawing, closure or vertex dragging complete.
- Basic selection and undo behavior was not revalidated end-to-end tonight.

## Manual polygon/vertex scenarios for November 19

1. Enter Polygon mode and add three non-collinear points in empty map area.
2. Confirm Enter, first-point click and double-click each finish a polygon.
3. Confirm a second click/Enter does not add duplicate vertices.
4. Press Escape during unfinished drawing and confirm no map mutation/history.
5. Use Backspace during drawing and confirm the last point is removed.
6. Reject collinear, duplicate and self-intersecting polygons with visible feedback.
7. Select a polygon and verify the outline and vertex handles.
8. Drag the polygon body and verify vertices move together with no canvas pan.
9. Drag one vertex and verify only that vertex changes.
10. Escape mid-drag and verify the previous valid geometry is restored.
11. Trigger pointer cancellation and verify no completed history entry is added.
12. Delete a selected polygon and verify undo/redo restores/removes it once.

## Zoom scenarios

- Repeat drawing, body dragging and vertex dragging at 50%, 100%, 200% and 400%.
- Verify each click is converted through the same world-coordinate transform.
- Verify handle size remains usable and the polygon does not deform during pan.
- Verify a 100-pixel drag behaves as the same expected world delta at 50%, 100%
  and 200% according to the zoom-independent movement formula.

## Undo/redo edge cases

- One body drag or vertex drag must create exactly one history entry.
- Cancelled drag, hover and selection must not create history entries.
- Undo/redo after creation, deletion, body move and vertex move.
- Undo then a new edit must clear redo.
- Loading or importing a map must reset stale history coherently.
- Undo/redo state after autosave restore should be explicitly inspected.

## Save/load scenarios

- Export/import 10 polygons and 20 labels with stable IDs and coordinates.
- Import malformed JSON, unsupported version, duplicate IDs, out-of-bounds
  points and degenerate polygons.
- Verify invalid import leaves the active document unchanged.
- Reload the browser and verify autosave restoration.
- Verify quota/storage denial surfaces an error and JSON export remains available.

## Large-map performance

- The pure movement benchmark passed at 100, 500 and 1,000 polygons.
- It only measures feature-array movement, not React/SVG rendering, hit testing
  or browser frame time.
- Deeper validation: browser frame measurements and React profiler traces are
  needed for 100, 500 and 1,000 rendered polygons.

## Known limitations

- Browser-level pointer, zoom, touch and cancellation behavior is not fully
  verified in this environment.
- A full 400% zoom smoke test was not performed.
- Large-map browser rendering and hit-testing were not profiled.
- No automated interaction test framework is installed for SVG Pointer Events.
