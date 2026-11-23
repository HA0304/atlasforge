import type { Point } from "../map/types";
import { hasSelfIntersections, isValidPolygon, polygonSignedArea } from "../geometry/polygons";
import type { CoastlineRing } from "./coastlines";

function perpendicularDistance(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }
  const t =
    ((point.x - start.x) * dx + (point.y - start.y) * dy) /
    (dx * dx + dy * dy);
  const projectedX = start.x + t * dx;
  const projectedY = start.y + t * dy;
  return Math.hypot(point.x - projectedX, point.y - projectedY);
}

function simplifyOpen(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) {
    return points;
  }

  let maximum = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
    const distance = perpendicularDistance(points[pointIndex], start, end);
    if (distance > maximum) {
      maximum = distance;
      index = pointIndex;
    }
  }

  if (maximum <= epsilon) {
    return [start, end];
  }

  const left = simplifyOpen(points.slice(0, index + 1), epsilon);
  const right = simplifyOpen(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

export function simplifyRing(points: Point[], epsilon: number): Point[] {
  if (points.length < 4) {
    return points;
  }

  let splitIndex = 0;
  let maximumX = -Infinity;
  for (let index = 0; index < points.length; index += 1) {
    if (points[index].x > maximumX) {
      maximumX = points[index].x;
      splitIndex = index;
    }
  }

  const shifted = [
    ...points.slice(splitIndex),
    ...points.slice(0, splitIndex),
  ];
  const open = [...shifted, shifted[0]];
  const simplifiedOpen = simplifyOpen(open, epsilon);
  const simplified = simplifiedOpen.slice(0, -1);

  return simplified.length >= 3 ? simplified : points;
}

export function chaikinSmooth(points: Point[], iterations = 1): Point[] {
  let result = points;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next: Point[] = [];
    for (let index = 0; index < result.length; index += 1) {
      const current = result[index];
      const following = result[(index + 1) % result.length];
      next.push(
        {
          x: 0.75 * current.x + 0.25 * following.x,
          y: 0.75 * current.y + 0.25 * following.y,
        },
        {
          x: 0.25 * current.x + 0.75 * following.x,
          y: 0.25 * current.y + 0.75 * following.y,
        },
      );
    }
    result = next;
  }

  return result;
}

export function simplifyAndSmoothRing(
  ring: CoastlineRing,
  epsilon: number,
  worldWidth: number,
  worldHeight: number,
): CoastlineRing | null {
  const simplified = simplifyRing(ring.points, epsilon);
  const smoothed = chaikinSmooth(simplified, 1);

  if (
    smoothed.length < 3 ||
    !isValidPolygon(smoothed) ||
    hasSelfIntersections(smoothed) ||
    smoothed.some(
      (point) =>
        point.x < 0 ||
        point.x > worldWidth ||
        point.y < 0 ||
        point.y > worldHeight,
    )
  ) {
    if (
      simplified.length >= 3 &&
      isValidPolygon(simplified) &&
      !hasSelfIntersections(simplified) &&
      simplified.every(
        (point) =>
          point.x >= 0 &&
          point.x <= worldWidth &&
          point.y >= 0 &&
          point.y <= worldHeight,
      )
    ) {
      return {
        points: simplified,
        area: Math.abs(polygonSignedArea(simplified)),
      };
    }
    return null;
  }

  return {
    points: smoothed,
    area: Math.abs(polygonSignedArea(smoothed)),
  };
}
