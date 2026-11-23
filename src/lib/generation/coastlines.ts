import type { Point } from "../map/types";
import { hasSelfIntersections, isValidPolygon, polygonSignedArea } from "../geometry/polygons";
import type { LandMask } from "./mask";

export interface CoastlineRing {
  points: Point[];
  area: number;
}

interface Segment {
  start: Point;
  end: Point;
}

function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}

export function extractMarchingSquares(
  mask: LandMask,
  worldWidth: number,
  worldHeight: number,
): CoastlineRing[] {
  const cellWidth = worldWidth / mask.width;
  const cellHeight = worldHeight / mask.height;
  const segments: Segment[] = [];

  for (let row = 0; row < mask.height; row += 1) {
    for (let column = 0; column < mask.width; column += 1) {
      const land = mask.cells[row * mask.width + column];
      if (!land) {
        continue;
      }

      const x = column * cellWidth;
      const y = row * cellHeight;
      const right = column + 1;
      const bottom = row + 1;
      const landAt = (nextRow: number, nextColumn: number) =>
        nextRow >= 0 &&
        nextRow < mask.height &&
        nextColumn >= 0 &&
        nextColumn < mask.width &&
        mask.cells[nextRow * mask.width + nextColumn];

      if (!landAt(row - 1, column)) {
        segments.push({
          start: { x, y },
          end: { x: right * cellWidth, y },
        });
      }
      if (!landAt(row, column + 1)) {
        segments.push({
          start: { x: right * cellWidth, y },
          end: { x: right * cellWidth, y: bottom * cellHeight },
        });
      }
      if (!landAt(row + 1, column)) {
        segments.push({
          start: { x: right * cellWidth, y: bottom * cellHeight },
          end: { x, y: bottom * cellHeight },
        });
      }
      if (!landAt(row, column - 1)) {
        segments.push({
          start: { x, y: bottom * cellHeight },
          end: { x, y },
        });
      }
    }
  }

  const starts = new Map<string, Segment[]>();
  for (const segment of segments) {
    const key = pointKey(segment.start);
    starts.set(key, [...(starts.get(key) ?? []), segment]);
  }

  const rings: Point[][] = [];
  const consumed = new Set<string>();

  for (const segment of segments) {
    const segmentKey = `${pointKey(segment.start)}>${pointKey(segment.end)}`;
    if (consumed.has(segmentKey)) {
      continue;
    }

    const ring: Point[] = [segment.start];
    let current = segment;
    let guard = 0;

    while (guard < segments.length * 2) {
      guard += 1;
      consumed.add(`${pointKey(current.start)}>${pointKey(current.end)}`);
      ring.push(current.end);

      if (pointKey(current.end) === pointKey(ring[0])) {
        break;
      }

      const candidates = starts.get(pointKey(current.end)) ?? [];
      const next = candidates.find((candidate) => {
        const key = `${pointKey(candidate.start)}>${pointKey(candidate.end)}`;
        return !consumed.has(key);
      });

      if (!next) {
        break;
      }
      current = next;
    }

    if (
      ring.length >= 4 &&
      pointKey(ring[0]) === pointKey(ring[ring.length - 1])
    ) {
      ring.pop();
      if (ring.length >= 3) {
        rings.push(ring);
      }
    }
  }

  return rings
    .map((points) => ({ points, area: Math.abs(polygonSignedArea(points)) }))
    .filter((ring) =>
      ring.area >= 1 &&
      isValidPolygon(ring.points) &&
      !hasSelfIntersections(ring.points) &&
      ring.points.every(
        (point) =>
          point.x >= 0 &&
          point.x <= worldWidth &&
          point.y >= 0 &&
          point.y <= worldHeight,
      ),
    );
}
