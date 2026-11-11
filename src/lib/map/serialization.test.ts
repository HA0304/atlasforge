import { describe, expect, it } from "vitest";

import {
  MapDocumentError,
  createEmptyMapDocument,
  parseMapDocument,
  serializeMapDocument,
  validateMapDocument,
} from "./serialization";
import { MAP_DOCUMENT_VERSION, type MapDocument } from "./types";

function createSampleDocument(): MapDocument {
  return {
    version: MAP_DOCUMENT_VERSION,
    name: "Test map",
    width: 1000,
    height: 800,
    features: [
      {
        kind: "polygon",
        id: "island",
        name: "Island",
        points: [
          { x: 100, y: 100 },
          { x: 300, y: 120 },
          { x: 250, y: 300 },
        ],
        fill: "#d9c7a3",
        stroke: "#6b5b45",
      },
      {
        kind: "label",
        id: "label-1",
        text: "Island",
        position: { x: 200, y: 200 },
        fontSize: 24,
        color: "#222222",
      },
    ],
  };
}

describe("validateMapDocument", () => {
  it("accepts a valid document", () => {
    const document = createSampleDocument();
    expect(validateMapDocument(document)).toEqual(document);
  });

  it("accepts an empty map", () => {
    expect(validateMapDocument(createEmptyMapDocument("Empty", 500, 400))).toEqual(
      {
        version: MAP_DOCUMENT_VERSION,
        name: "Empty",
        width: 500,
        height: 400,
        features: [],
      },
    );
  });

  it("rejects non-object documents", () => {
    expect(() => validateMapDocument(null)).toThrow(MapDocumentError);
    expect(() => validateMapDocument([])).toThrow(MapDocumentError);
  });

  it("rejects unsupported document versions", () => {
    const document = { ...createSampleDocument(), version: 99 };
    expect(() => validateMapDocument(document)).toThrow(/version/);
  });

  it("rejects empty or missing names", () => {
    expect(() =>
      validateMapDocument({ ...createSampleDocument(), name: "" }),
    ).toThrow(/name/);
    expect(() =>
      validateMapDocument({ ...createSampleDocument(), name: undefined }),
    ).toThrow(/name/);
  });

  it("rejects invalid dimensions", () => {
    expect(() =>
      validateMapDocument({ ...createSampleDocument(), width: 0 }),
    ).toThrow(/greater than zero/);
    expect(() =>
      validateMapDocument({ ...createSampleDocument(), height: Number.NaN }),
    ).toThrow(/height/);
  });

  it("rejects malformed feature arrays", () => {
    expect(() =>
      validateMapDocument({ ...createSampleDocument(), features: {} }),
    ).toThrow(/features/);
  });

  it("rejects unknown feature kinds", () => {
    expect(() =>
      validateMapDocument({
        ...createSampleDocument(),
        features: [{ kind: "circle", id: "circle-1" }],
      }),
    ).toThrow(/feature kind/);
  });

  it("rejects polygons with fewer than three points", () => {
    expect(() =>
      validateMapDocument({
        ...createSampleDocument(),
        features: [
          {
            kind: "polygon",
            id: "triangle",
            name: "Triangle",
            points: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
            fill: "#fff",
            stroke: "#000",
          },
        ],
      }),
    ).toThrow(/three points/);
  });

  it("rejects non-finite points", () => {
    expect(() =>
      validateMapDocument({
        ...createSampleDocument(),
        features: [
          {
            kind: "polygon",
            id: "triangle",
            name: "Triangle",
            points: [
              { x: 0, y: 0 },
              { x: Infinity, y: 1 },
              { x: 1, y: 1 },
            ],
            fill: "#fff",
            stroke: "#000",
          },
        ],
      }),
    ).toThrow(/finite number/);
  });

  it("rejects duplicate feature ids", () => {
    const document = createSampleDocument();
    const duplicate = { ...document.features[0], id: "label-1" };
    expect(() =>
      validateMapDocument({ ...document, features: [duplicate, duplicate] }),
    ).toThrow(/duplicate feature id/);
  });

  it("rejects labels without text or position", () => {
    expect(() =>
      validateMapDocument({
        ...createSampleDocument(),
        features: [
          {
            kind: "label",
            id: "label-1",
            text: "",
            position: { x: 1, y: 2 },
            fontSize: 12,
            color: "#000",
          },
        ],
      }),
    ).toThrow(/text/);

    expect(() =>
      validateMapDocument({
        ...createSampleDocument(),
        features: [
          {
            kind: "label",
            id: "label-1",
            text: "Missing position",
            fontSize: 12,
            color: "#000",
          },
        ],
      }),
    ).toThrow(/position/);
  });
});

describe("parseMapDocument", () => {
  it("rejects invalid JSON", () => {
    expect(() => parseMapDocument("{not json")).toThrow(/invalid JSON/);
  });

  it("parses valid JSON", () => {
    const document = createSampleDocument();
    expect(parseMapDocument(JSON.stringify(document))).toEqual(document);
  });
});

describe("serializeMapDocument", () => {
  it("round-trips a document through JSON", () => {
    const document = createSampleDocument();
    const serialized = serializeMapDocument(document);

    expect(serialized).toContain("\n");
    expect(parseMapDocument(serialized)).toEqual(document);
  });
});