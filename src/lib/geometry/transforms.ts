export interface Vec2 {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 20;

export function clampScale(
  scale: number,
  min = MIN_SCALE,
  max = MAX_SCALE,
): number {
  if (!Number.isFinite(scale)) {
    return 1;
  }
  return Math.min(max, Math.max(min, scale));
}

export function worldToScreen(point: Vec2, viewport: Viewport): Vec2 {
  return {
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y,
  };
}

export function screenToWorld(point: Vec2, viewport: Viewport): Vec2 {
  return {
    x: (point.x - viewport.x) / viewport.scale,
    y: (point.y - viewport.y) / viewport.scale,
  };
}

export function translateViewport(
  viewport: Viewport,
  delta: Vec2,
): Viewport {
  return {
    ...viewport,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  };
}

export function zoomAtPoint(
  viewport: Viewport,
  screenPoint: Vec2,
  factor: number,
): Viewport {
  if (!Number.isFinite(factor) || factor <= 0) {
    return viewport;
  }

  const nextScale = clampScale(viewport.scale * factor);

  if (nextScale === viewport.scale) {
    return viewport;
  }

  const ratio = nextScale / viewport.scale;

  return {
    scale: nextScale,
    x: screenPoint.x - (screenPoint.x - viewport.x) * ratio,
    y: screenPoint.y - (screenPoint.y - viewport.y) * ratio,
  };
}

export function wheelZoomFactor(deltaY: number, deltaMode = 0): number {
  if (!Number.isFinite(deltaY)) {
    return 1;
  }

  const deltaInPixels =
    deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 800 : deltaY;
  return Math.exp(-deltaInPixels * 0.0015);
}

export function fitViewport(
  bounds: Bounds,
  size: Size,
  padding = 48,
): Viewport {
  if (
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0 ||
    !Number.isFinite(size.width) ||
    !Number.isFinite(size.height) ||
    size.width <= 0 ||
    size.height <= 0
  ) {
    return { x: 0, y: 0, scale: 1 };
  }

  const availableWidth = Math.max(0, size.width - padding * 2);
  const availableHeight = Math.max(0, size.height - padding * 2);

  if (availableWidth <= 0 || availableHeight <= 0) {
    return { x: 0, y: 0, scale: 1 };
  }

  const scale = clampScale(
    Math.min(availableWidth / bounds.width, availableHeight / bounds.height),
  );

  return {
    scale,
    x: padding + (availableWidth - bounds.width * scale) / 2 - bounds.x * scale,
    y:
      padding +
      (availableHeight - bounds.height * scale) / 2 -
      bounds.y * scale,
  };
}

export function centerWorldPoint(viewport: Viewport, size: Size): Vec2 {
  return screenToWorld(
    { x: size.width / 2, y: size.height / 2 },
    viewport,
  );
}

export function resizeViewport(
  viewport: Viewport,
  previousSize: Size,
  nextSize: Size,
): Viewport {
  if (previousSize.width <= 0 || previousSize.height <= 0) {
    return viewport;
  }

  const center = centerWorldPoint(viewport, previousSize);

  return {
    scale: viewport.scale,
    x: nextSize.width / 2 - center.x * viewport.scale,
    y: nextSize.height / 2 - center.y * viewport.scale,
  };
}