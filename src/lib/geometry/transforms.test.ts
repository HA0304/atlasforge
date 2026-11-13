import { describe, expect, it } from "vitest";

import {
  MAX_SCALE,
  MIN_SCALE,
  centerWorldPoint,
  clampScale,
  fitViewport,
  resizeViewport,
  screenToWorld,
  translateViewport,
  wheelZoomFactor,
  worldToScreen,
  zoomAtPoint,
  type Size,
  type Viewport,
} from "./transforms";

const identity: Viewport = { x: 0, y: 0, scale: 1 };

function expectClose(actual: { x: number; y: number }, expected: { x: number; y: number }) {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
}

describe("coordinate transforms", () => {
  it("maps world coordinates to screen coordinates", () => {
    const viewport: Viewport = { x: 120, y: -40, scale: 2 };
    expect(worldToScreen({ x: 10, y: 20 }, viewport)).toEqual({
      x: 140,
      y: 0,
    });
  });

  it("inverts world-to-screen conversion", () => {
    const viewport: Viewport = { x: 75, y: 33, scale: 1.75 };
    const world = { x: -12, y: 48 };
    expect(screenToWorld(worldToScreen(world, viewport), viewport)).toEqual(world);
  });

  it("round-trips through screen-to-world conversion", () => {
    const viewport: Viewport = { x: -20, y: 80, scale: 0.5 };
    const screen = { x: 300, y: 240 };
    expect(worldToScreen(screenToWorld(screen, viewport), viewport)).toEqual(screen);
  });

  it("translates the viewport by a delta", () => {
    expect(
      translateViewport({ x: 10, y: 20, scale: 2 }, { x: -5, y: 7 }),
    ).toEqual({ x: 5, y: 27, scale: 2 });
  });

  it("clamps scale to supported limits", () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(Number.NaN)).toBe(1);
  });
});

describe("zoomAtPoint", () => {
  it("keeps the world point under the cursor fixed", () => {
    const viewport: Viewport = { x: 100, y: 40, scale: 1 };
    const cursor = { x: 240, y: 180 };
    const worldBefore = screenToWorld(cursor, viewport);

    const zoomed = zoomAtPoint(viewport, cursor, 1.25);
    expect(zoomed.scale).toBeCloseTo(1.25);
    expectClose(screenToWorld(cursor, zoomed), worldBefore);
  });

  it("keeps the cursor point fixed while zooming out", () => {
    const viewport: Viewport = { x: -80, y: 15, scale: 4 };
    const cursor = { x: 500, y: 300 };
    const worldBefore = screenToWorld(cursor, viewport);

    const zoomed = zoomAtPoint(viewport, cursor, 0.5);
    expect(zoomed.scale).toBeCloseTo(2);
    expectClose(screenToWorld(cursor, zoomed), worldBefore);
  });

  it("clamps zooming in and out", () => {
    const cursor = { x: 100, y: 100 };
    const zoomedIn = zoomAtPoint(identity, cursor, 1000);
    const zoomedOut = zoomAtPoint(identity, cursor, 0.000001);

    expect(zoomedIn.scale).toBe(MAX_SCALE);
    expect(zoomedOut.scale).toBe(MIN_SCALE);
  });

  it("ignores invalid zoom factors", () => {
    expect(zoomAtPoint(identity, { x: 10, y: 10 }, 0)).toBe(identity);
    expect(zoomAtPoint(identity, { x: 10, y: 10 }, Number.NaN)).toBe(identity);
  });
});

describe("wheelZoomFactor", () => {
  it("returns 1 for a zero delta", () => {
    expect(wheelZoomFactor(0)).toBe(1);
  });

  it("zooms in when scrolling up", () => {
    expect(wheelZoomFactor(-100)).toBeGreaterThan(1);
  });

  it("zooms out when scrolling down", () => {
    expect(wheelZoomFactor(100)).toBeLessThan(1);
  });

  it("ignores non-finite deltas", () => {
    expect(wheelZoomFactor(Number.NaN)).toBe(1);
  });

  it("normalizes line and page wheel deltas", () => {
    expect(wheelZoomFactor(1, 1)).toBeCloseTo(wheelZoomFactor(16, 0));
    expect(wheelZoomFactor(1, 2)).toBeCloseTo(wheelZoomFactor(800, 0));
  });
});

describe("fitViewport", () => {
  it("fits a map inside the available space and centers it", () => {
    const size: Size = { width: 800, height: 600 };
    const viewport = fitViewport(
      { x: 0, y: 0, width: 1000, height: 800 },
      size,
      48,
    );

    expect(viewport.scale).toBeCloseTo(0.63);
    expect(viewport.x).toBeCloseTo(85);
    expect(viewport.y).toBeCloseTo(48);

    expectClose(worldToScreen({ x: 0, y: 0 }, viewport), { x: 85, y: 48 });
    expectClose(worldToScreen({ x: 1000, y: 800 }, viewport), {
      x: 715,
      y: 552,
    });
  });

  it("fits bounds that do not start at the origin", () => {
    const viewport = fitViewport(
      { x: 100, y: 50, width: 200, height: 100 },
      { width: 400, height: 300 },
      20,
    );

    expect(viewport.scale).toBeCloseTo(1.8);
    expectClose(worldToScreen({ x: 100, y: 50 }, viewport), { x: 20, y: 60 });
    expectClose(worldToScreen({ x: 300, y: 150 }, viewport), {
      x: 380,
      y: 240,
    });
  });

  it("falls back to an identity viewport for invalid input", () => {
    expect(
      fitViewport(
        { x: 0, y: 0, width: 0, height: 100 },
        { width: 800, height: 600 },
      ),
    ).toEqual(identity);

    expect(
      fitViewport(
        { x: 0, y: 0, width: 100, height: 100 },
        { width: 0, height: 600 },
      ),
    ).toEqual(identity);
  });
});

describe("viewport helpers", () => {
  it("finds the world point at the center of the viewport", () => {
    const viewport: Viewport = { x: 100, y: 50, scale: 2 };
    expect(centerWorldPoint(viewport, { width: 800, height: 600 })).toEqual({
      x: 150,
      y: 125,
    });
  });

  it("keeps the world center fixed when resizing", () => {
    const viewport: Viewport = { x: 100, y: 50, scale: 2 };
    const previousSize: Size = { width: 800, height: 600 };
    const nextSize: Size = { width: 1000, height: 400 };
    const resized = resizeViewport(viewport, previousSize, nextSize);

    expect(resized).toEqual({ x: 200, y: -50, scale: 2 });
    expectClose(centerWorldPoint(resized, nextSize), { x: 150, y: 125 });
  });
});