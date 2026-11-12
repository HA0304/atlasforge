import { describe, expect, it } from "vitest";

import { moveFeature, moveFeatureInDocument } from "./features";

describe("feature movement", () => {
  it("moves every polygon point without changing its shape", () => {
    const polygon = {
      kind: "polygon" as const,
      id: "polygon-1",
      name: "Island",
      points: [
        { x: 10, y: 20 },
        { x: 40, y: 20 },
        { x: 25, y: 50 },
      ],
      fill: "#fff",
      stroke: "#000",
    };

    expect(moveFeature(polygon, { x: 5, y: -8 })).toMatchObject({
      points: [
        { x: 15, y: 12 },
        { x: 45, y: 12 },
        { x: 30, y: 42 },
      ],
    });
  });

  it("moves a label position", () => {
    const label = {
      kind: "label" as const,
      id: "label-1",
      text: "Port",
      position: { x: 100, y: 80 },
      fontSize: 20,
      color: "#222",
    };

    expect(moveFeature(label, { x: -12, y: 6 })).toMatchObject({
      position: {
        x: 88,
        y: 86,
      },
    });
  });

  it("only moves the requested document feature", () => {
    const features = [
      {
        kind: "label" as const,
        id: "label-1",
        text: "Port",
        position: { x: 100, y: 80 },
        fontSize: 20,
        color: "#222",
      },
      {
        kind: "label" as const,
        id: "label-2",
        text: "Bay",
        position: { x: 200, y: 180 },
        fontSize: 20,
        color: "#222",
      },
    ];

    expect(moveFeatureInDocument(features, "label-2", { x: 3, y: 4 })[0]).toEqual(
      features[0],
    );
    expect(moveFeatureInDocument(features, "label-2", { x: 3, y: 4 })[1]).toMatchObject({
      position: { x: 203, y: 184 },
    });
  });
});
