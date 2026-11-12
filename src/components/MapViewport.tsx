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
}: MapViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<Size>(INITIAL_SIZE);
  const hasMeasuredRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; last: Vec2 } | null>(null);
  const featureDragRef = useRef<{
    pointerId: number;
    featureId: string;
    last: Vec2;
  } | null>(null);
  const [size, setSize] = useState<Size>(INITIAL_SIZE);
  const [viewport, setViewport] = useState<Viewport>(INITIAL_VIEWPORT);
  const [isPanning, setIsPanning] = useState(false);

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

    if (event.button !== 0 || dragRef.current !== null) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      last: { x: event.clientX, y: event.clientY },
    };
    setIsPanning(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const featureDrag = featureDragRef.current;

    if (featureDrag?.pointerId === event.pointerId) {
      const delta: Vec2 = {
        x: (event.clientX - featureDrag.last.x) / viewport.scale,
        y: (event.clientY - featureDrag.last.y) / viewport.scale,
      };
      featureDragRef.current = {
        ...featureDrag,
        last: { x: event.clientX, y: event.clientY },
      };
      onMoveFeature?.(featureDrag.featureId, delta);
      return;
    }

    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const delta: Vec2 = {
      x: event.clientX - drag.last.x,
      y: event.clientY - drag.last.y,
    };

    dragRef.current = {
      pointerId: drag.pointerId,
      last: { x: event.clientX, y: event.clientY },
    };
    setViewport((current) => panViewport(current, delta));
  }

  function stopPanning(event: ReactPointerEvent<HTMLDivElement>) {
    const featureDrag = featureDragRef.current;

    if (featureDrag?.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      featureDragRef.current = null;
      onFeatureDragEnd?.();
      return;
    }

    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
    setIsPanning(false);
  }

  function handleLostPointerCapture() {
    if (featureDragRef.current) {
      onFeatureDragEnd?.();
    }
    dragRef.current = null;
    featureDragRef.current = null;
    setIsPanning(false);
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    if (mode === "pan" || !onCanvasClick) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    onCanvasClick(
      screenToWorld(
        {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
        viewport,
      ),
    );
  }

  function handleFeaturePointerDown(
    event: ReactPointerEvent<SVGGElement>,
    featureId: string,
  ) {
    onSelectFeature?.(featureId);

    if (mode !== "select" || event.button !== 0) {
      return;
    }

    event.stopPropagation();
    containerRef.current?.setPointerCapture(event.pointerId);
    featureDragRef.current = {
      pointerId: event.pointerId,
      featureId,
      last: { x: event.clientX, y: event.clientY },
    };
    onFeatureDragStart?.(featureId);
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0f172a]">
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
                stroke="#c8d9df"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="#0f172a" />

          <g
            transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
          >
            <rect
              x={0}
              y={0}
              width={map.width}
              height={map.height}
              fill="#a9d6e5"
              stroke="#6d8b96"
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
                onSelect={(featureId) => onSelectFeature?.(featureId)}
                onPointerDown={handleFeaturePointerDown}
              />
            ))}
            {drawingPoints.length > 0 ? (
              <>
                <polyline
                  points={drawingPoints
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke="#38bdf8"
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
                    fill="#38bdf8"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </>
            ) : null}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-900/90 p-1.5 shadow-xl backdrop-blur">
        <button
          type="button"
          onClick={() => zoomAtCenter(1 / 1.25)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded text-lg font-semibold text-zinc-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          −
        </button>
        <span
          className="min-w-14 text-center text-xs font-medium tabular-nums text-zinc-300"
          aria-live="polite"
        >
          {Math.round(viewport.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomAtCenter(1.25)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded text-lg font-semibold text-zinc-200 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          +
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          onClick={resetView}
          className="rounded px-2 py-1 text-xs font-medium text-zinc-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
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