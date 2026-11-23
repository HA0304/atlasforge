import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { moveFeatureInDocument } from "./features";
import type { MapFeature } from "./types";

function createPolygons(count: number): MapFeature[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: "polygon" as const,
    id: `polygon-${index}`,
    name: `Region ${index}`,
    points: [
      { x: index, y: index },
      { x: index + 10, y: index },
      { x: index + 5, y: index + 10 },
    ],
    fill: "#B8D4A5",
    stroke: "#657F61",
  }));
}

function benchmark(count: number): number {
  const features = createPolygons(count);
  const start = performance.now();

  for (let repetition = 0; repetition < 200; repetition += 1) {
    moveFeatureInDocument(features, `polygon-${count - 1}`, {
      x: 0.25,
      y: -0.25,
    });
  }

  return (performance.now() - start) / 200;
}

describe("polygon drag benchmark", () => {
  it("keeps median complete-document feature movement routine under 50 ms", () => {
    const measurements: [string, number][] = [
      ["100 polygons", benchmark(100)],
      ["500 polygons", benchmark(500)],
      ["1,000 polygons", benchmark(1_000)],
    ];

    for (const [label, measurement] of measurements) {
      console.log(`${label}: ${measurement.toFixed(3)} ms per operation`);
      expect(measurement).toBeLessThan(50);
    }
  });
});
