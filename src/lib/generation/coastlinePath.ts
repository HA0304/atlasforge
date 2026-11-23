import type { Point } from "../map/types";
import type { CoastlineRing } from "./coastlines";

export function ringToSvgPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }

  const commands = points.map(
    (point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
  );
  return `${commands.join(" ")} Z`;
}

export function ringsToSvgMarkup(
  rings: CoastlineRing[],
  width: number,
  height: number,
): string {
  const paths = rings
    .map(
      (ring) =>
        `<path d="${ringToSvgPath(ring.points)}" fill="#B8D4A5" stroke="#657F61"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${paths}</svg>`;
}
