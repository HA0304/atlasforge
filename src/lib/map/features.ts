import type { MapFeature, Point } from "./types";

export function translatePoints(points: Point[], delta: Point): Point[] {
  return points.map((point) => ({
    x: point.x + delta.x,
    y: point.y + delta.y,
  }));
}

export function moveFeature(feature: MapFeature, delta: Point): MapFeature {
  if (feature.kind === "polygon") {
    return {
      ...feature,
      points: translatePoints(feature.points, delta),
    };
  }

  return {
    ...feature,
    position: {
      x: feature.position.x + delta.x,
      y: feature.position.y + delta.y,
    },
  };
}

export function moveFeatureInDocument(
  features: MapFeature[],
  featureId: string,
  delta: Point,
): MapFeature[] {
  return features.map((feature) =>
    feature.id === featureId ? moveFeature(feature, delta) : feature,
  );
}
