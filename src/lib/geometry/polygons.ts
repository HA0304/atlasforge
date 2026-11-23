import type { Point } from "@/lib/map/types";

const GEOMETRY_EPSILON = 1e-8;

export function areDistinctPoints(points: Point[]): boolean {
  const unique = new Set(points.map((point) => `${point.x}:${point.y}`));
  return unique.size === points.length;
}

export function polygonSignedArea(points: Point[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function isBetween(a: Point, b: Point, c: Point): boolean {
  return (
    c.x >= Math.min(a.x, b.x) - GEOMETRY_EPSILON &&
    c.x <= Math.max(a.x, b.x) + GEOMETRY_EPSILON &&
    c.y >= Math.min(a.y, b.y) - GEOMETRY_EPSILON &&
    c.y <= Math.max(a.y, b.y) + GEOMETRY_EPSILON
  );
}

function segmentsIntersect(
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point,
): boolean {
  const first = orientation(firstStart, firstEnd, secondStart);
  const second = orientation(firstStart, firstEnd, secondEnd);
  const third = orientation(secondStart, secondEnd, firstStart);
  const fourth = orientation(secondStart, secondEnd, firstEnd);

  if (
    Math.abs(first) <= GEOMETRY_EPSILON &&
    isBetween(firstStart, firstEnd, secondStart)
  ) {
    return true;
  }
  if (
    Math.abs(second) <= GEOMETRY_EPSILON &&
    isBetween(firstStart, firstEnd, secondEnd)
  ) {
    return true;
  }
  if (
    Math.abs(third) <= GEOMETRY_EPSILON &&
    isBetween(secondStart, secondEnd, firstStart)
  ) {
    return true;
  }
  if (
    Math.abs(fourth) <= GEOMETRY_EPSILON &&
    isBetween(secondStart, secondEnd, firstEnd)
  ) {
    return true;
  }

  return (first > 0) !== (second > 0) && (third > 0) !== (fourth > 0);
}

export function hasSelfIntersections(points: Point[]): boolean {
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;

    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      if (
        first === second ||
        firstNext === second ||
        secondNext === first
      ) {
        continue;
      }

      if (
        segmentsIntersect(
          points[first],
          points[firstNext],
          points[second],
          points[secondNext],
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

export function isValidPolygon(points: Point[]): boolean {
  return (
    points.length >= 3 &&
    points.every(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ) &&
    areDistinctPoints(points) &&
    Math.abs(polygonSignedArea(points)) > GEOMETRY_EPSILON &&
    !hasSelfIntersections(points)
  );
}

export function updatePolygonVertex(
  points: Point[],
  index: number,
  nextPoint: Point,
): Point[] | null {
  if (index < 0 || index >= points.length) {
    return null;
  }

  const nextPoints = points.map((point, pointIndex) =>
    pointIndex === index ? nextPoint : point,
  );

  return isValidPolygon(nextPoints) ? nextPoints : null;
}
