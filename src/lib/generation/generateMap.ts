import type { PromptToMapSpec } from "../ai/mapSpec";
import type { MapDocument } from "../map/types";
import { MAP_DOCUMENT_VERSION } from "../map/types";
import { extractMarchingSquares } from "./coastlines";
import { generateLandMask } from "./mask";
import { simplifyAndSmoothRing } from "./smoothing";

export interface GeneratedGeography {
  map: MapDocument;
  svg: string;
  ringCount: number;
  runtimeMs: number;
}

function centroid(points: { x: number; y: number }[]): { x: number; y: number } {
  const total = points.reduce(
    (result, point) => ({
      x: result.x + point.x,
      y: result.y + point.y,
    }),
    { x: 0, y: 0 },
  );
  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

export function generateGeography(
  spec: PromptToMapSpec,
  width = 1200,
  height = 800,
): GeneratedGeography {
  const started = performance.now();
  const mask = generateLandMask(spec, { width: 120, height: 80 });
  const coastlines = extractMarchingSquares(mask, width, height);
  const epsilon = 6 - spec.coastlineComplexity;
  const rings = coastlines
    .map((ring) => simplifyAndSmoothRing(ring, epsilon, width, height))
    .filter((ring): ring is NonNullable<typeof ring> => ring !== null)
    .filter((ring) => ring.area >= 600);

  const polygons = rings.map((ring, index) => ({
    kind: "polygon" as const,
    id: `land-${spec.seed}-${index}`,
    name: `Landmass ${index + 1}`,
    points: ring.points,
    fill: index % 3 === 0 ? "#B8D4A5" : index % 3 === 1 ? "#A9C79A" : "#C3D5A8",
    stroke: "#657F61",
  }));

  const labels = spec.settlements.map((settlement, index) => {
    const ring = rings[index % rings.length];
    const position = ring ? centroid(ring.points) : { x: width / 2, y: height / 2 };
    return {
      kind: "label" as const,
      id: `settlement-${spec.seed}-${index}`,
      text: settlement.name,
      position,
      fontSize: settlement.kind === "city" ? 24 : settlement.kind === "port" ? 20 : 18,
      color: "#353F39",
    };
  });

  const paths = rings
    .map(
      (ring) =>
        `<path d="${ring.points
          .map(
            (point, index) =>
              `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
          )
          .join(" ")} Z" fill="#B8D4A5" stroke="#657F61"/>`,
    )
    .join("");

  return {
    map: {
      version: MAP_DOCUMENT_VERSION,
      name: `Seeded world ${spec.seed}`,
      width,
      height,
      features: [...polygons, ...labels],
    },
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`,
    ringCount: rings.length,
    runtimeMs: performance.now() - started,
  };
}
