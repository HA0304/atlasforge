import type { MouseEvent, PointerEvent } from "react";

import type { LabelFeature, MapFeature, PolygonFeature } from "@/lib/map/types";

export interface MapFeatureProps {
  feature: MapFeature;
  selected: boolean;
  onSelect: (featureId: string) => void;
  onPointerDown: (event: PointerEvent<SVGGElement>, featureId: string) => void;
}

function polygonPoints(polygon: PolygonFeature): string {
  return polygon.points.map((point) => `${point.x},${point.y}`).join(" ");
}

function FeatureShape({ feature }: { feature: PolygonFeature | LabelFeature }) {
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

export function MapFeature({
  feature,
  selected,
  onSelect,
  onPointerDown,
}: MapFeatureProps) {
  function handleClick(event: MouseEvent<SVGGElement>) {
    event.stopPropagation();
    onSelect(feature.id);
  }

  return (
    <g
      onClick={handleClick}
      onPointerDown={(event) => onPointerDown(event, feature.id)}
      aria-label={feature.kind === "polygon" ? feature.name : feature.text}
    >
      <FeatureShape feature={feature} />
      {selected && feature.kind === "polygon" ? (
        <polygon
          points={polygonPoints(feature)}
          fill="none"
          stroke="#657f61"
          strokeWidth={3}
          strokeDasharray="8 6"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
      {selected && feature.kind === "label" ? (
        <rect
          x={feature.position.x - feature.text.length * feature.fontSize * 0.3}
          y={feature.position.y - feature.fontSize * 0.7}
          width={feature.text.length * feature.fontSize * 0.6}
          height={feature.fontSize * 1.4}
          fill="none"
          stroke="#657f61"
          strokeWidth={2}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
}
