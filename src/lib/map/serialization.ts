import {
  MAP_DOCUMENT_VERSION,
  type LabelFeature,
  type MapDocument,
  type MapFeature,
  type Point,
  type PolygonFeature,
} from "./types";

export class MapDocumentError extends Error {
  readonly path: string;

  constructor(message: string, path = "document") {
    super(`${path}: ${message}`);
    this.name = "MapDocumentError";
    this.path = path;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new MapDocumentError("expected an object", path);
  }
  return value;
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const field = value[key];
  if (typeof field !== "string" || field.trim().length === 0) {
    throw new MapDocumentError(`expected a non-empty string`, `${path}.${key}`);
  }
  return field;
}

function requireFiniteNumber(
  value: Record<string, unknown>,
  key: string,
  path: string,
): number {
  const field = value[key];
  if (typeof field !== "number" || !Number.isFinite(field)) {
    throw new MapDocumentError(`expected a finite number`, `${path}.${key}`);
  }
  return field;
}

function validatePoint(value: unknown, path: string): Point {
  const point = requireRecord(value, path);
  return {
    x: requireFiniteNumber(point, "x", path),
    y: requireFiniteNumber(point, "y", path),
  };
}

function validatePolygon(value: unknown, path: string): PolygonFeature {
  const polygon = requireRecord(value, path);
  const points = polygon.points;

  if (!Array.isArray(points) || points.length < 3) {
    throw new MapDocumentError(
      "expected at least three points",
      `${path}.points`,
    );
  }

  return {
    kind: "polygon",
    id: requireString(polygon, "id", path),
    name: requireString(polygon, "name", path),
    points: points.map((point, index) =>
      validatePoint(point, `${path}.points[${index}]`),
    ),
    fill: requireString(polygon, "fill", path),
    stroke: requireString(polygon, "stroke", path),
  };
}

function validateLabel(value: unknown, path: string): LabelFeature {
  const label = requireRecord(value, path);

  return {
    kind: "label",
    id: requireString(label, "id", path),
    text: requireString(label, "text", path),
    position: validatePoint(label.position, `${path}.position`),
    fontSize: requireFiniteNumber(label, "fontSize", path),
    color: requireString(label, "color", path),
  };
}

function validateFeature(value: unknown, index: number): MapFeature {
  const path = `features[${index}]`;
  const feature = requireRecord(value, path);

  if (feature.kind === "polygon") {
    return validatePolygon(feature, path);
  }
  if (feature.kind === "label") {
    return validateLabel(feature, path);
  }
  throw new MapDocumentError("unknown feature kind", `${path}.kind`);
}

export function validateMapDocument(value: unknown): MapDocument {
  const document = requireRecord(value, "document");

  if (document.version !== MAP_DOCUMENT_VERSION) {
    throw new MapDocumentError(
      `unsupported version ${String(document.version)}`,
      "document.version",
    );
  }

  const width = requireFiniteNumber(document, "width", "document");
  const height = requireFiniteNumber(document, "height", "document");

  if (width <= 0 || height <= 0) {
    throw new MapDocumentError(
      "map width and height must be greater than zero",
      "document",
    );
  }

  const rawFeatures = document.features;
  if (!Array.isArray(rawFeatures)) {
    throw new MapDocumentError("expected an array", "document.features");
  }

  const features = rawFeatures.map(validateFeature);
  const ids = new Set<string>();

  for (const feature of features) {
    if (ids.has(feature.id)) {
      throw new MapDocumentError(
        `duplicate feature id "${feature.id}"`,
        "document.features",
      );
    }
    ids.add(feature.id);
  }

  return {
    version: MAP_DOCUMENT_VERSION,
    name: requireString(document, "name", "document"),
    width,
    height,
    features,
  };
}

export function parseMapDocument(json: string): MapDocument {
  let value: unknown;

  try {
    value = JSON.parse(json);
  } catch {
    throw new MapDocumentError("invalid JSON");
  }

  return validateMapDocument(value);
}

export function serializeMapDocument(document: MapDocument): string {
  return JSON.stringify(validateMapDocument(document), null, 2);
}

export function createEmptyMapDocument(
  name = "Untitled map",
  width = 1000,
  height = 1000,
): MapDocument {
  return {
    version: MAP_DOCUMENT_VERSION,
    name,
    width,
    height,
    features: [],
  };
}