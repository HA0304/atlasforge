import { describe, expect, it } from "vitest";

import {
  areDistinctPoints,
  hasSelfIntersections,
  isValidPolygon,
  updatePolygonVertex,
} from "./polygons";

const triangle = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 50, y: 80 },
];

describe("polygon geometry", () => {
  it("accepts three or more distinct non-degenerate vertices", () => {
    expect(areDistinctPoints(triangle)).toBe(true);
    expect(isValidPolygon(triangle)).toBe(true);
  });

  it("rejects duplicate, collinear, and self-intersecting polygons", () => {
    expect(isValidPolygon([triangle[0], triangle[1], triangle[1]])).toBe(false);
    expect(
      isValidPolygon([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ]),
    ).toBe(false);
    const bowTie = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
      { x: 100, y: 0 },
    ];
    expect(hasSelfIntersections(bowTie)).toBe(true);
    expect(isValidPolygon(bowTie)).toBe(false);
  });

  it("accepts valid vertex movement and rejects invalid movement", () => {
    expect(updatePolygonVertex(triangle, 2, { x: 50, y: 100 })).toEqual([
      triangle[0],
      triangle[1],
      { x: 50, y: 100 },
    ]);
    expect(updatePolygonVertex(triangle, 2, { x: 50, y: 0 })).toBeNull();
  });
});
