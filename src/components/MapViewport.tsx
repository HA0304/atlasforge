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
  translateViewport,
  type Size,
  type Vec2,
  type Viewport,
} from "@/lib/geometry/transforms";
import type {
  LabelFeature,
  MapDocument,
  PolygonFeature,
} from "@/lib/map/types";

const INITIAL_SIZE: Size = { width: 0, height: 0 };
const INITIAL_VIEWPORT: Viewport = { x: 0, y: 0, scale: 1 };
const VIEWPORT_PADDING = 48;

interface MapViewportProps {
  map: MapDocument;
}

function polygonPoints(polygon: PolygonFeature): string {
  return polygon.points.map((point) => `${point.x},${point.y}`).join(" ");
}

function MapFeatureShape({ feature }: { feature: PolygonFeature | LabelFeature }) {
  if (feature.kind === "polygon") {
    return (
      <polygon
        points={polygonPoints(feature)}
        fill={feature.fill}
        stroke={feature.stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <text
      x={feature.position.x}
      y={feature.position.y}
      fill={feature.color}
      fontSize={feature.fontSize}
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ userSelect: "none" }}
    >
      {feature.text}
    </text>
  );
}

export function MapViewport({ map }: MapViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<Size>(INITIAL_SIZE);
  const hasMeasuredRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; last: Vec2 } | null>(null);
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

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
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
    setViewport((current) => translateViewport(current, delta));
  }

  function stopPanning(event: ReactPointerEvent<HTMLDivElement>) {
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
    dragRef.current = null;
    setIsPanning(false);
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
              <MapFeatureShape key={feature.id} feature={feature} />
            ))}
          </g>
        </svg>
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