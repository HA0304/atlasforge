"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  fitViewport,
  resizeViewport,
  screenToWorld,
  type Size,
  type Vec2,
  type Viewport,
} from "@/lib/geometry/transforms";
import {
  panViewport,
  resetViewport,
  zoomViewportAtCenter,
  zoomViewportAtPointer,
} from "@/lib/geometry/viewport";
import { MapFeature } from "@/components/MapFeature";
import type { MapDocument } from "@/lib/map/types";

const INITIAL_SIZE: Size = { width: 0, height: 0 };
const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };
const VIEWPORT_PADDING = 48;

export interface MapViewportProps {
  map: MapDocument;
  mode?: "select" | "pan" | "draw" | "text";
  selectedFeatureId?: string;
  drawingPoints?: Vec2[];
  onSelectFeature?: (featureId: string | null) => void;
  onCanvasClick?: (point: Vec2) => void;
  onMoveFeature?: (featureId: string, delta: Vec2) => void;
  onFeatureDragStart?: (featureId: string) => void;
  onFeatureDragEnd?: () => void;
  onMoveVertex?: (
    featureId: string,
    vertexIndex: number,
    point: Vec2,
  ) => void;
  onVertexDragStart?: (featureId: string, vertexIndex: number) => void;
  onVertexDragEnd?: () => void;
  onDrawingPreview?: (point: Vec2 | null) => void;
  onFinishDrawing?: () => void;
  onCancelInteraction?: () => void;
}

export function MapViewport({
  map,
  mode = "pan",
  selectedFeatureId,
  drawingPoints = [],
  onSelectFeature,
  onCanvasClick,
  onMoveFeature,
  onFeatureDragStart,
  onFeatureDragEnd,
  onMoveVertex,
  onVertexDragStart,
  onVertexDragEnd,
  onDrawingPreview,
  onFinishDrawing,
  onCancelInteraction,
}: MapViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<Size>(INITIAL_SIZE);
  const hasMeasuredRef = useRef(false);
  const interactionRef = useRef<
    | { kind: "pan"; pointerId: number; last: Vec2 }
    | { kind: "feature"; pointerId: number; featureId: string; last: Vec2 }
    | {
        kind: "vertex";
        pointerId: number;
        featureId: string;
        vertexIndex: number;
      }
    | null
  >(null);
  const featureClickRef = useRef(false);
  const [size, setSize] = useState<Size>(INITIAL_SIZE);
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const [isPanning, setIsPanning] = useState(false);
  const [drawingPreviewPoint, setDrawingPreviewPoint] = useState<Vec2 | null>(
    null,
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const nextSize: Size = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      const previousSize = sizeRef.current;
      sizeRef.current = nextSize;
      setSize(nextSize);
      setViewport((current) => {
        if (!hasMeasuredRef.current) {
          hasMeasuredRef.current = true;
          return fitViewport(
            { x: 0, y: 0, width: map.width, height: map.height },
            nextSize,
            VIEWPORT_PADDING,
          );
        }
        return resizeViewport(current, previousSize, nextSize);
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [map.width, map.height]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const bounds = container.getBoundingClientRect();
      const pointer = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      setViewport((current) =>
        zoomViewportAtPointer(
          current,
          pointer,
          event.deltaY,
          event.deltaMode,
        ),
      );
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      const interaction = interactionRef.current;
      if (event.key !== "Escape" || !interaction) {
        return;
      }

      if (containerRef.current?.hasPointerCapture(interaction.pointerId)) {
        containerRef.current.releasePointerCapture(interaction.pointerId);
      }
      interactionRef.current = null;
      setIsPanning(false);
      onCancelInteraction?.();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancelInteraction]);

  function zoomAtCenter(factor: number) {
    setViewport((current) => zoomViewportAtCenter(current, size, factor));
  }

  function resetView() {
    setViewport(
      resetViewport(
        { width: map.width, height: map.height },
        size,
        VIEWPORT_PADDING,
      ),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode !== "pan") {
      return;
    }

    if (event.button !== 0 || interactionRef.current !== null) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "pan",
      pointerId: event.pointerId,
      last: { x: event.clientX, y: event.clientY },
    };
    setIsPanning(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (mode === "draw" && interactionRef.current === null) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const point = screenToWorld(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        viewport,
      );
      setDrawingPreviewPoint(point);
      onDrawingPreview?.(point);
    }

    const interaction = interactionRef.current;

    if (interaction?.kind === "feature" && interaction.pointerId === event.pointerId) {
      const delta: Vec2 = {
        x: (event.clientX - interaction.last.x) / viewport.scale,
        y: (event.clientY - interaction.last.y) / viewport.scale,
      };
      interactionRef.current = {
        ...interaction,
        last: { x: event.clientX, y: event.clientY },
      };
      onMoveFeature?.(interaction.featureId, delta);
      return;
    }

    if (interaction?.kind === "vertex" && interaction.pointerId === event.pointerId) {
      const bounds = event.currentTarget.getBoundingClientRect();
      onMoveVertex?.(
        interaction.featureId,
        interaction.vertexIndex,
        screenToWorld(
          { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
          viewport,
        ),
      );
      return;
    }

    if (interaction?.kind !== "pan" || interaction.pointerId !== event.pointerId) {
      return;
    }

    const delta: Vec2 = {
      x: event.clientX - interaction.last.x,
      y: event.clientY - interaction.last.y,
    };

    interactionRef.current = {
      ...interaction,
      last: { x: event.clientX, y: event.clientY },
    };
    setViewport((current) => panViewport(current, delta));
  }

  function stopPanning(event: ReactPointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;

    if (
      interaction &&
      interaction.kind !== "pan" &&
      interaction.pointerId === event.pointerId
    ) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      interactionRef.current = null;
      if (interaction.kind === "feature") {
        onFeatureDragEnd?.();
      }
      onVertexDragEnd?.();
      return;
    }

    if (!interaction || interaction.kind !== "pan" || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    interactionRef.current = null;
    setIsPanning(false);
  }

  function handleLostPointerCapture() {
    if (interactionRef.current?.kind === "feature") {
      onFeatureDragEnd?.();
    }
    if (interactionRef.current?.kind === "vertex") {
      onVertexDragEnd?.();
    }
    interactionRef.current = null;
    setIsPanning(false);
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (mode === "pan" || !onCanvasClick) {
      return;
    }

    if (mode === "select" && featureClickRef.current) {
      featureClickRef.current = false;
      return;
    }
    if (mode === "select" && event.target !== event.currentTarget) {
      return;
    }

    if (mode === "draw" && event.detail === 2) {
      onFinishDrawing?.();
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const point = screenToWorld(
      { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      viewport,
    );
    const firstPoint = drawingPoints[0];
    if (
      mode === "draw" &&
      firstPoint &&
      Math.hypot(
        point.x * viewport.scale + viewport.x -
          (firstPoint.x * viewport.scale + viewport.x),
        point.y * viewport.scale + viewport.y -
          (firstPoint.y * viewport.scale + viewport.y),
      ) <= 12
    ) {
      onFinishDrawing?.();
      return;
    }
    onCanvasClick(point);
  }

  function handleFeaturePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    featureId: string,
  ) {
    onSelectFeature?.(featureId);
    featureClickRef.current = true;

    if (mode !== "select" || event.button !== 0) {
      return;
    }

    event.stopPropagation();
    featureClickRef.current = true;
    containerRef.current?.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "feature",
      pointerId: event.pointerId,
      featureId,
      last: { x: event.clientX, y: event.clientY },
    };
    onFeatureDragStart?.(featureId);
  }

  function handleVertexPointerDown(
    event: ReactPointerEvent<SVGCircleElement>,
    featureId: string,
    vertexIndex: number,
  ) {
    event.stopPropagation();
    featureClickRef.current = true;
    if (mode !== "select" || event.button !== 0) {
      return;
    }
    containerRef.current?.setPointerCapture(event.pointerId);
    interactionRef.current = {
      kind: "vertex",
      pointerId: event.pointerId,
      featureId,
      vertexIndex,
    };
    onVertexDragStart?.(featureId, vertexIndex);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#8DB7B2]">
      <div
        ref={containerRef}
        className={`absolute inset-0 touch-none select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPanning}
        onPointerCancel={stopPanning}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleCanvasClick}
      >
        <svg
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${size.width} ${size.height}`}
          className="block h-full w-full"
          role="img"
          aria-label={`${map.name} map`}
        >
          <defs>
            <pattern
              id="map-grid"
              width={100}
              height={100}
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 100 0 L 0 0 0 100"
                fill="none"
                stroke="#657F61"
                strokeOpacity={0.14}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="#8DB7B2" />

          <g
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            <rect
              x={0}
              y={0}
              width={map.width}
              height={map.height}
              fill="#D8C49A"
              stroke="#657F61"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={0}
              y={0}
              width={map.width}
              height={map.height}
              fill="url(#map-grid)"
            />

            {map.features.map((feature) => (
              <MapFeature
                key={feature.id}
                feature={feature}
                selected={selectedFeatureId === feature.id}
                onSelect={(featureId) => {
                  if (mode === "select") {
                    onSelectFeature?.(featureId);
                  }
                }}
                onPointerDown={handleFeaturePointerDown}
                onVertexPointerDown={handleVertexPointerDown}
                viewportScale={viewport.scale}
              />
            ))}
            {drawingPoints.length > 0 ? (
              <>
                <polyline
                  points={[...drawingPoints, ...(drawingPreviewPoint ? [drawingPreviewPoint] : [])]
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#657F61"
                  strokeWidth={3}
                  strokeDasharray="8 6"
                  vectorEffect="non-scaling-stroke"
                />
                {drawingPoints.map((point, index) => (
                  <circle
                    key={`${point.x}-${point.y}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill="#657F61"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </>
            ) : null}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-[#353F39]/10 bg-white/95 p-1.5 text-[#353F39] shadow-[0_8px_24px_rgba(53,63,57,0.16)]">
        <button
          type="button"
          onClick={() => zoomAtCenter(1 / 1.25)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition hover:bg-[#F7F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657F61]"
        >
          −
        </button>
        <span
          className="min-w-14 text-center text-xs font-medium tabular-nums"
          aria-live="polite"
        >
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomAtCenter(1.25)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold transition hover:bg-[#F7F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657F61]"
        >
          +
        </button>
        <span className="mx-1 h-5 w-px bg-[#353F39]/10" />
        <button
          type="button"
          onClick={resetView}
          className="rounded-full px-2 py-1 text-xs font-medium transition hover:bg-[#F7F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657F61]"
        >
          Fit
        </button>
      </div>

      {map.features.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow">
            This map is empty.
          </p>
        </div>
      ) : null}
    </div>
  );
}