# AtlasForge

AtlasForge is a browser-based fictional map editor built with Next.js, TypeScript,
Tailwind CSS, and native SVG rendering.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production checks:

```bash
npm run lint
npm run test
npm run build
```

## Editor controls

- **Select / V**: select and drag polygons or labels.
- **Pan / H**: pan the canvas.
- **Polygon / P**: click points, then finish the polygon.
- **Text / T**: enter label text, then click the map.
- **Undo / Redo**: use the toolbar or `Ctrl/Cmd+Z` and `Ctrl/Cmd+Y`.
- **Mouse wheel or trackpad**: zoom around the cursor.
- **Fit**: reset the viewport to the complete map.

Maps autosave to browser storage. Use the toolbar to import or export the
versioned JSON map document.

## Architecture

- `src/lib/map/types.ts` defines the versioned document schema.
- `src/lib/map/serialization.ts` validates, loads, and saves map JSON.
- `src/lib/map/features.ts` contains pure world-coordinate feature movement.
- `src/lib/geometry/` contains pure screen/world and viewport mathematics.
- `src/components/MapViewport.tsx` renders the SVG and owns viewport interaction.
- `src/components/MapEditor.tsx` owns document history, selection, and tools.

Geometry remains in fixed world coordinates. Pointer movement is converted from
screen pixels to world units by dividing by the current viewport scale, so
objects keep their shape and move consistently at every zoom level.
