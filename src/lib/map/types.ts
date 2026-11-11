export const MAP_DOCUMENT_VERSION = 1 as const;

export interface Point {
  x: number;
  y: number;
}

export interface PolygonFeature {
  kind: "polygon";
  id: string;
  name: string;
  points: Point[];
  fill: string;
  stroke: string;
}

export interface LabelFeature {
  kind: "label";
  id: string;
  text: string;
  position: Point;
  fontSize: number;
  color: string;
}

export type MapFeature = PolygonFeature | LabelFeature;

export interface MapDocument {
  version: typeof MAP_DOCUMENT_VERSION;
  name: string;
  width: number;
  height: number;
  features: MapFeature[];
}

export function isPolygonFeature(
  feature: MapFeature,
): feature is PolygonFeature {
  return feature.kind === "polygon";
}

export function isLabelFeature(feature: MapFeature): feature is LabelFeature {
  return feature.kind === "label";
}