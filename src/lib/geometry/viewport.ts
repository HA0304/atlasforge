import {
  fitViewport,
  translateViewport,
  wheelZoomFactor,
  zoomAtPoint,
  type Size,
  type Vec2,
  type Viewport,
} from "./transforms";

export interface MapSize {
  width: number;
  height: number;
}

export function panViewport(viewport: Viewport, delta: Vec2): Viewport {
  return translateViewport(viewport, delta);
}

export function zoomViewportAtPointer(
  viewport: Viewport,
  pointer: Vec2,
  deltaY: number,
): Viewport {
  return zoomAtPoint(viewport, pointer, wheelZoomFactor(deltaY));
}

export function zoomViewportAtCenter(
  viewport: Viewport,
  size: Size,
  factor: number,
): Viewport {
  return zoomAtPoint(
    viewport,
    { x: size.width / 2, y: size.height / 2 },
    factor,
  );
}

export function resetViewport(
  map: MapSize,
  size: Size,
  padding: number,
): Viewport {
  return fitViewport(
    { x: 0, y: 0, width: map.width, height: map.height },
    size,
    padding,
  );
}