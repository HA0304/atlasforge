"use client";

import { useEffect, useRef, useState } from "react";

import { MapViewport } from "@/components/MapViewport";
import {
  MapDocumentError,
  parseMapDocument,
  serializeMapDocument,
} from "@/lib/map/serialization";
import type { MapDocument, Point } from "@/lib/map/types";

const STORAGE_KEY = "atlasforge-map-document";

interface MapEditorProps {
  initialMap: MapDocument;
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function MapEditor({ initialMap }: MapEditorProps) {
  const [map, setMap] = useState<MapDocument>(() => {
    if (typeof window === "undefined") {
      return initialMap;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return initialMap;
    }

    try {
      return parseMapDocument(saved);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialMap;
    }
  });
  const [mode, setMode] = useState<"pan" | "draw">("pan");
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );
  const [labelText, setLabelText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeMapDocument(map));
  }, [map]);

  function startDrawing() {
    setMode("draw");
    setDrawingPoints([]);
    setSelectedFeatureId(null);
    setMessage("Click the map to add polygon points.");
  }

  function finishDrawing() {
    if (drawingPoints.length < 3) {
      setMessage("A polygon needs at least three points.");
      return;
    }

    setMap((current) => ({
      ...current,
      features: [
        ...current.features,
        {
          kind: "polygon",
          id: createId("polygon"),
          name: `Region ${current.features.length + 1}`,
          points: drawingPoints,
          fill: "#d9c7a3",
          stroke: "#6b5b45",
        },
      ],
    }));
    setDrawingPoints([]);
    setMode("pan");
    setMessage("Polygon added.");
  }

  function addLabel() {
    const text = labelText.trim();

    if (!text) {
      setMessage("Enter label text first.");
      return;
    }

    setMap((current) => ({
      ...current,
      features: [
        ...current.features,
        {
          kind: "label",
          id: createId("label"),
          text,
          position: { x: current.width / 2, y: current.height / 2 },
          fontSize: 24,
          color: "#222222",
        },
      ],
    }));
    setLabelText("");
    setMessage("Label added at the map center.");
  }

  function deleteSelected() {
    if (!selectedFeatureId) {
      setMessage("Select a feature first.");
      return;
    }

    setMap((current) => ({
      ...current,
      features: current.features.filter(
        (feature) => feature.id !== selectedFeatureId,
      ),
    }));
    setSelectedFeatureId(null);
    setMessage("Feature deleted.");
  }

  function exportMap() {
    const blob = new Blob([serializeMapDocument(map)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${map.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Map exported.");
  }

  async function importMap(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const imported = parseMapDocument(await file.text());
      setMap(imported);
      setSelectedFeatureId(null);
      setMessage("Map imported.");
    } catch (error) {
      setMessage(
        error instanceof MapDocumentError
          ? error.message
          : "Unable to import map.",
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-zinc-900 px-4 py-2">
        <button
          type="button"
          onClick={() => {
            setMode("pan");
            setDrawingPoints([]);
          }}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            mode === "pan" ? "bg-sky-500 text-white" : "bg-white/10 text-zinc-300"
          }`}
        >
          Pan / select
        </button>
        <button
          type="button"
          onClick={startDrawing}
          className={`rounded px-3 py-1.5 text-xs font-medium ${
            mode === "draw" ? "bg-sky-500 text-white" : "bg-white/10 text-zinc-300"
          }`}
        >
          Draw polygon
        </button>
        <button
          type="button"
          onClick={finishDrawing}
          disabled={mode !== "draw"}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 disabled:opacity-40"
        >
          Finish polygon
        </button>
        <button
          type="button"
          onClick={deleteSelected}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300"
        >
          Delete selected
        </button>
        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
        <input
          value={labelText}
          onChange={(event) => setLabelText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addLabel();
            }
          }}
          placeholder="Label text"
          aria-label="Label text"
          className="min-w-32 rounded bg-white/10 px-2 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-sky-400"
        />
        <button
          type="button"
          onClick={addLabel}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300"
        >
          Add label
        </button>
        <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />
        <button
          type="button"
          onClick={exportMap}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="rounded bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300"
        >
          Import JSON
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            void importMap(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {message ? (
          <span className="ml-auto text-xs text-zinc-400" role="status">
            {message}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        <MapViewport
          map={map}
          mode={mode}
          selectedFeatureId={selectedFeatureId ?? undefined}
          drawingPoints={drawingPoints}
          onSelectFeature={(featureId) => {
            setMode("pan");
            setSelectedFeatureId(featureId);
          }}
          onCanvasClick={(point) => {
            if (mode === "draw") {
              setDrawingPoints((points) => [...points, point]);
            } else {
              setSelectedFeatureId(null);
            }
          }}
        />
      </div>
    </div>
  );
}
