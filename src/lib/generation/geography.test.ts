import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { VALID_PROMPT_TO_MAP_EXAMPLES } from "../ai/mapSpec";
import { extractMarchingSquares } from "./coastlines";
import { generateGeography } from "./generateMap";
import { generateLandMask, type LandMask } from "./mask";
import { chaikinSmooth, simplifyAndSmoothRing, simplifyRing } from "./smoothing";
import { hasSelfIntersections, isValidPolygon } from "../geometry/polygons";

function maskHash(mask: LandMask): string {
  let hash = 2166136261;
  for (const cell of mask.cells) {
    hash ^= cell ? 1 : 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

describe("deterministic geography", () => {
  it("reproduces identical masks and SVG data for repeated seeds", () => {
    const spec = VALID_PROMPT_TO_MAP_EXAMPLES[0];
    const first = generateLandMask(spec, { width: 96, height: 64 });
    const second = generateLandMask(spec, { width: 96, height: 64 });

    expect(first.cells).toEqual(second.cells);
    expect(maskHash(first)).toBe(maskHash(second));

    const outputOne = generateGeography(spec, 1200, 800);
    const outputTwo = generateGeography(spec, 1200, 800);
    expect(outputOne.svg).toBe(outputTwo.svg);
    expect(outputOne.map).toEqual(outputTwo.map);
  });

  it("produces distinct masks for three saved seeds", () => {
    const seeds = VALID_PROMPT_TO_MAP_EXAMPLES.slice(0, 3);
    const masks = seeds.map((spec) =>
      generateLandMask(spec, { width: 96, height: 64 }),
    );
    const hashes = masks.map(maskHash);

    expect(new Set(hashes).size).toBe(3);

    const output = seeds.map((spec) => {
      const mask = generateLandMask(spec, { width: 96, height: 64 });
      const rings = extractMarchingSquares(mask, 1200, 800);
      return {
        seed: spec.seed,
        maskHash: maskHash(mask),
        ringCount: rings.length,
        rings: rings.slice(0, 12).map((ring) =>
          ring.points.map((point) => ({
            x: Number(point.x.toFixed(2)),
            y: Number(point.y.toFixed(2)),
          })),
        ),
      };
    });

    mkdirSync("src/lib/generation/fixtures", { recursive: true });
    writeFileSync(
      "src/lib/generation/fixtures/three-seeds.json",
      `${JSON.stringify(output, null, 2)}\n`,
    );
  });

  it("supports concave shapes and tiny islands", () => {
    const concave = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 60, y: 100 },
      { x: 60, y: 40 },
      { x: 40, y: 40 },
      { x: 40, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(isValidPolygon(concave)).toBe(true);
    expect(hasSelfIntersections(concave)).toBe(false);

    const tiny = [
      { x: 10, y: 10 },
      { x: 11, y: 10 },
      { x: 11, y: 11 },
    ];
    expect(isValidPolygon(tiny)).toBe(true);
  });

  it("keeps touching diagonal contours as separate closed topology", () => {
    const mask: LandMask = {
      width: 4,
      height: 4,
      cells: [
        true, false, false, false,
        false, true, false, false,
        false, false, false, false,
        false, false, false, false,
      ],
    };
    const rings = extractMarchingSquares(mask, 400, 400);

    for (const ring of rings) {
      expect(ring.points.length).toBeGreaterThanOrEqual(3);
      expect(isValidPolygon(ring.points)).toBe(true);
      expect(hasSelfIntersections(ring.points)).toBe(false);
    }
  });

  it("simplifies concave rings and rejects invalid smoothing", () => {
    const ring = {
      area: 1000,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 60, y: 100 },
        { x: 60, y: 40 },
        { x: 40, y: 40 },
        { x: 40, y: 100 },
        { x: 0, y: 100 },
      ],
    };
    const simplified = simplifyRing(ring.points, 20);
    expect(simplified.length).toBeLessThan(ring.points.length);
    expect(isValidPolygon(simplified)).toBe(true);

    const smoothed = chaikinSmooth(simplified, 2);
    expect(smoothed.length).toBeGreaterThan(simplified.length);
    expect(
      simplifyAndSmoothRing(ring, 4, 120, 120),
    ).not.toBeNull();

    expect(
      simplifyAndSmoothRing(
        {
          area: 2,
          points: [
            { x: -10, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
          ],
        },
        1,
        100,
        100,
      ),
    ).toBeNull();
  });

  it("completes representative generation within a recorded interactive budget", () => {
    const spec = VALID_PROMPT_TO_MAP_EXAMPLES[1];
    const started = performance.now();
    const generated = generateGeography(spec, 1200, 800);
    const elapsed = performance.now() - started;

    expect(generated.ringCount).toBeGreaterThan(0);
    expect(generated.svg.startsWith("<svg")).toBe(true);
    expect(generated.svg).toContain("<path");
    expect(elapsed).toBeLessThan(1_000);
  });
});
