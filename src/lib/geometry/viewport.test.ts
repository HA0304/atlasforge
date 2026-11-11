import { describe, expect, it } from "vitest";

import {
  fitViewport,
  resizeViewport,
  screenToWorld,
  type Viewport,
} from "./transforms";
import {
  panViewport,
  resetViewport,
  zoomViewportAtCenter,
  zoomViewportAtPointer,
} from "./viewport";

function expectClose(
  actual: { x: number; y: number },
  expected: { x: number; y: number },
) {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
}

describe("panning interactions", () => {
  it("moves the viewport by the pointer delta", () => {
    const viewport: Viewport = { x: 100, y: 50, scale: 1.5 };
    expect(panViewport(viewport, { x: 25, y: -10 })).toEqual({
      x: 125,
      y: 40,
      scale: 1.5,
    });
  });

  it("accumulates successive pointer moves", () => {
    const start: Viewport = { x: 100, y: 50, scale: 1.5 };
    const afterFirst = panViewport(start, { x: 10, y: 5 });
    const afterSecond = panViewport(afterFirst, { x: -3, y: 12 });

    expect(afterSecond).toEqual({ x: 107, y: 67, scale: 1.5 });
  });
});

describe("wheel zoom interactions", () => {
  it("keeps the world point under the cursor fixed when zooming in", () => {
    const viewport: Viewport = { x: 120, y: 30, scale: 1 };
    const pointer = { x: 300, y: 200 };
    const worldBefore = screenToWorld(pointer, viewport);

    const zoomed = zoomViewportAtPointer(viewport, pointer, -120);

    expect(zoomed.scale).toBeCloseTo(Math.exp(0.18));
    expectClose(screenToWorld(pointer, zoomed), worldBefore);
  });

  it("keeps the cursor point fixed when zooming out", () => {
    const viewport: Viewport = { x: -60, y: 90, scale: 4 };
    const pointer = { x: 450, y: 320 };
    const worldBefore = screenToWorld(pointer, viewport);

    const zoomed = zoomViewportAtPointer(viewport, pointer, 180);

    expect(zoomed.scale).toBeCloseTo(4 * Math.exp(-0.27));
    expectClose(screenToWorld(pointer, zoomed), worldBefore);
  });

  it("clamps extreme wheel zoom", () => {
    const viewport: Viewport = { x: 0, y: 0, scale: 1 };
    const pointer = { x: 200, y: 100 };

    expect(zoomViewportAtPointer(viewport, pointer, -100000).scale).toBe(20);
    expect(zoomViewportAtPointer(viewport, pointer, 100000).scale).toBe(0.1);
  });

  it("ignores non-finite wheel deltas", () => {
    const viewport: Viewport = { x: 40, y: 20, scale: 2 };
    expect(
      zoomViewportAtPointer(viewport, { x: 10, y: 10 }, Number.NaN),
    ).toEqual(viewport);
  });
});

describe("zoom button interactions", () => {
  it("zooms around the center of the viewport", () => {
    const viewport: Viewport = { x: 200, y: 100, scale: 0.5 };
    const size = { width: 800, height: 600 };
    const center = { x: 400, y: 300 };
    const worldBefore = screenToWorld(center, viewport);

    const zoomed = zoomViewportAtCenter(viewport, size, 1.25);

    expect(zoomed.scale).toBeCloseTo(0.625);
    expectClose(screenToWorld(center, zoomed), worldBefore);
  });

  it("clamps zoom buttons at the scale limits", () => {
    const size = { width: 800, height: 600 };

    expect(
      zoomViewportAtCenter(
        { x: 0, y: 0, scale: 19 },
        size,
        1.25,
      ).scale,
    ).toBe(20);

    expect(
      zoomViewportAtCenter(
        { x: 0, y: 0, scale: 0.2 },
        size,
        0.4,
      ).scale,
    ).toBe(0.1);
  });
});

describe("reset interactions", () => {
  it("fits the whole map and centers it", () => {
    const map = { width: 1200, height: 800 };
    const size = { width: 900, height: 700 };

    expect(resetViewport(map, size, 48)).toEqual(
      fitViewport({ x: 0, y: 0, width: 1200, height: 800 }, size, 48),
    );
  });
});

describe("resize interactions", () => {
  it("keeps the world point at the viewport center when resizing", () => {
    const viewport: Viewport = { x: 120, y: -40, scale: 1.25 };
    const previousSize = { width: 800, height: 600 };
    const nextSize = { width: 1200, height: 500 };

    const resized = resizeViewport(viewport, previousSize, nextSize);
    const center = { x: 600, y: 250 };

    expectClose(screenToWorld(center, resized), screenToWorld(
      { x: 400, y: 300 },
      viewport,
    ));
  });
});