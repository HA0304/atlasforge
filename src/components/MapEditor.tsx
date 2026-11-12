"use client";

import { useEffect, useRef, useState } from "react";

import { MapViewport } from "@/components/MapViewport";
import {
  MapDocumentError,
  parseMapDocument,
  serializeMapDocument,
} from "@/lib/map/serialization";
import { moveFeatureInDocument } from "@/lib/map/features";
import type {
  LabelFeature,
  MapDocument,
  MapFeature,
  Point,
  PolygonFeature,
} from "@/lib/map/types";

const STORAGE_KEY = "atlasforge-map-document";

type EditorTool = "select" | "pan" | "draw" | "text";

interface MapEditorProps {
  initialMap: MapDocument;
}

interface HistoryState {
  past: MapDocument[];
  future: MapDocument[];
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readStoredMap(initialMap: MapDocument): MapDocument {
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
}

function featureById(
  map: MapDocument,
  featureId: string | null,
): MapFeature | undefined {
  return map.features.find((feature) => feature.id === featureId);
}

export function MapEditor({ initialMap }: MapEditorProps) {
  const [map, setMap] = useState<MapDocument>(() => readStoredMap(initialMap));
  const [tool, setTool] = useState<EditorTool>("select");
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );
  const [labelText, setLabelText] = useState("");
  const [mapNameDraft, setMapNameDraft] = useState(map.name);
  const [message, setMessage] = useState<string | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HistoryState>({ past: [], future: [] });
  const featureDragStartRef = useRef<MapDocument | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeMapDocument(map));
  }, [map]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "z" && !isTyping) {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (modifier && event.key.toLowerCase() === "y" && !isTyping) {
        event.preventDefault();
        redo();
        return;
      }

      if (isTyping) {
        return;
      }

      if (event.key === "Escape") {
        setTool("select");
        setDrawingPoints([]);
      } else if (event.key.toLowerCase() === "v") {
        setTool("select");
      } else if (event.key.toLowerCase() === "h") {
        setTool("pan");
      } else if (event.key.toLowerCase() === "p") {
        startDrawing();
      } else if (event.key.toLowerCase() === "t") {
        setTool("text");
      } else if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelected();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function commitMap(nextMap: MapDocument, status?: string) {
    setMap((current) => {
      historyRef.current.past.push(current);
      historyRef.current.future = [];
      return nextMap;
    });
    if (status) {
      setMessage(status);
    }
  }

  function updateMap(
    updater: (current: MapDocument) => MapDocument,
    status?: string,
  ) {
    setMap((current) => {
      const next = updater(current);
      historyRef.current.past.push(current);
      historyRef.current.future = [];
      return next;
    });
    if (status) {
      setMessage(status);
    }
  }

  function undo() {
    const previous = historyRef.current.past.pop();
    if (!previous) {
      return;
    }

    setMap((current) => {
      historyRef.current.future.push(current);
      return previous;
    });
    setMapNameDraft(previous.name);
    setMessage("Undid last change.");
  }

  function redo() {
    const next = historyRef.current.future.pop();
    if (!next) {
      return;
    }

    setMap((current) => {
      historyRef.current.past.push(current);
      return next;
    });
    setMapNameDraft(next.name);
    setMessage("Redid last change.");
  }

  function startDrawing() {
    setTool("draw");
    setDrawingPoints([]);
    setSelectedFeatureId(null);
    setIsContextOpen(false);
    setMessage("Click the map to add polygon points.");
  }

  function finishDrawing() {
    if (drawingPoints.length < 3) {
      setMessage("A polygon needs at least three points.");
      return;
    }

    commitMap(
      {
        ...map,
        features: [
          ...map.features,
          {
            kind: "polygon",
            id: createId("polygon"),
            name: `Region ${map.features.length + 1}`,
            points: drawingPoints,
            fill: "#B8D4A5",
            stroke: "#657F61",
          },
        ],
      },
      "Polygon added.",
    );
    setDrawingPoints([]);
    setTool("select");
  }

  function addLabel(position: Point) {
    const text = labelText.trim();

    if (!text) {
      setMessage("Enter label text first.");
      return;
    }

    commitMap(
      {
        ...map,
        features: [
          ...map.features,
          {
            kind: "label",
            id: createId("label"),
            text,
            position,
            fontSize: 24,
            color: "#353F39",
          },
        ],
      },
      "Label added.",
    );
    setLabelText("");
    setTool("select");
  }

  function deleteSelected() {
    if (!selectedFeatureId) {
      return;
    }

    updateMap(
      (current) => ({
        ...current,
        features: current.features.filter(
          (feature) => feature.id !== selectedFeatureId,
        ),
      }),
      "Object deleted.",
    );
    setSelectedFeatureId(null);
    setIsContextOpen(false);
  }

  function updateSelected(
    updater: (feature: MapFeature) => MapFeature,
    status?: string,
  ) {
    if (!selectedFeatureId) {
      return;
    }

    updateMap(
      (current) => ({
        ...current,
        features: current.features.map((feature) =>
          feature.id === selectedFeatureId ? updater(feature) : feature,
        ),
      }),
      status,
    );
  }

  function handleCanvasClick(point: Point) {
    if (tool === "draw") {
      setDrawingPoints((points) => [...points, point]);
    } else if (tool === "text") {
      addLabel(point);
    } else if (tool === "select") {
      setSelectedFeatureId(null);
      setIsContextOpen(false);
    }
  }

  function handleFeatureMove(featureId: string, delta: Point) {
    setMap((current) => ({
      ...current,
      features: moveFeatureInDocument(current.features, featureId, delta),
    }));
  }

  function handleFeatureDragStart() {
    featureDragStartRef.current = map;
  }

  function handleFeatureDragEnd() {
    const start = featureDragStartRef.current;
    featureDragStartRef.current = null;

    if (!start) {
      return;
    }

    setMap((current) => {
      if (serializeMapDocument(start) === serializeMapDocument(current)) {
        return current;
      }
      historyRef.current.past.push(start);
      historyRef.current.future = [];
      return current;
    });
    setMessage("Object moved.");
  }

  function saveMap() {
    window.localStorage.setItem(STORAGE_KEY, serializeMapDocument(map));
    setMessage("Map saved locally.");
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
      commitMap(imported, "Map imported.");
      setMapNameDraft(imported.name);
      setSelectedFeatureId(null);
      setIsContextOpen(false);
    } catch (error) {
      setMessage(
        error instanceof MapDocumentError
          ? error.message
          : "Unable to import map.",
      );
    }
  }

  function commitMapName() {
    const name = mapNameDraft.trim();
    if (!name || name === map.name) {
      setMapNameDraft(map.name);
      return;
    }
    commitMap({ ...map, name }, "Map name updated.");
  }

  const selectedFeature = featureById(map, selectedFeatureId);
  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  return (
    <div className="relative h-full overflow-hidden bg-[#F7F5EF] text-[#353F39]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-3 pt-4 sm:pt-5">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-[#353F39]/10 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(53,63,57,0.12)] backdrop-blur">
          <div className="flex items-center gap-2 whitespace-nowrap px-2.5">
            <span className="text-sm font-bold tracking-tight">AtlasForge</span>
            <input
              value={mapNameDraft}
              onChange={(event) => setMapNameDraft(event.target.value)}
              onBlur={commitMapName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Map name"
              className="w-24 rounded-md bg-[#F7F5EF] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[#8DB7B2] sm:w-32"
            />
          </div>
          <ToolbarButton active={tool === "select"} onClick={() => setTool("select")} label="Select (V)">
            ↖
          </ToolbarButton>
          <ToolbarButton active={tool === "pan"} onClick={() => setTool("pan")} label="Pan (H)">
            ✋
          </ToolbarButton>
          <ToolbarButton active={tool === "draw"} onClick={startDrawing} label="Polygon (P)">
            △
          </ToolbarButton>
          <ToolbarButton active={tool === "text"} onClick={() => setTool("text")} label="Text (T)">
            T
          </ToolbarButton>
          <div className="mx-1 h-6 w-px bg-[#353F39]/10" />
          <ToolbarButton disabled={!canUndo} onClick={undo} label="Undo">
            ↶
          </ToolbarButton>
          <ToolbarButton disabled={!canRedo} onClick={redo} label="Redo">
            ↷
          </ToolbarButton>
          <ToolbarButton onClick={saveMap} label="Save map">
            ↓
          </ToolbarButton>
          <ToolbarButton onClick={exportMap} label="Export JSON">
            ↑
          </ToolbarButton>
          <ToolbarButton
            onClick={() => importInputRef.current?.click()}
            label="Import JSON"
          >
            ⇧
          </ToolbarButton>
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
        </div>
      </div>

      <MapViewport
        map={map}
        mode={tool}
        selectedFeatureId={selectedFeatureId ?? undefined}
        drawingPoints={drawingPoints}
        onSelectFeature={(featureId) => {
          setSelectedFeatureId(featureId);
          setIsContextOpen(featureId !== null);
          if (tool !== "select") {
            setTool("select");
          }
        }}
        onCanvasClick={handleCanvasClick}
        onMoveFeature={handleFeatureMove}
        onFeatureDragStart={handleFeatureDragStart}
        onFeatureDragEnd={handleFeatureDragEnd}
      />

      {tool === "draw" ? (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-medium shadow-lg">
          {drawingPoints.length} points ·{" "}
          <button type="button" className="font-bold text-[#657F61]" onClick={finishDrawing}>
            Finish polygon
          </button>
        </div>
      ) : null}

      {tool === "text" ? (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white p-1.5 shadow-lg">
          <input
            value={labelText}
            onChange={(event) => setLabelText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setMessage("Click the map to place the label.");
              }
            }}
            placeholder="Type a label, then click map"
            aria-label="New label text"
            className="w-48 rounded-full bg-[#F7F5EF] px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-[#8DB7B2]"
          />
        </div>
      ) : null}

      {selectedFeature && isContextOpen ? (
        <ContextPanel
          feature={selectedFeature}
          onClose={() => {
            setIsContextOpen(false);
            setSelectedFeatureId(null);
          }}
          onDelete={deleteSelected}
          onUpdate={updateSelected}
        />
      ) : null}
      {message ? (
        <div className="absolute bottom-5 right-4 z-10 rounded-full bg-white px-3 py-2 text-xs font-medium shadow-lg" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  active = false,
  disabled = false,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657F61] ${
        active
          ? "bg-[#657F61] text-white"
          : "text-[#353F39]/70 hover:bg-[#F7F5EF] hover:text-[#353F39]"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function ContextPanel({
  feature,
  onClose,
  onDelete,
  onUpdate,
}: {
  feature: MapFeature;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (
    updater: (feature: MapFeature) => MapFeature,
    status?: string,
  ) => void;
}) {
  return (
    <aside className="absolute right-4 top-20 z-10 w-64 rounded-2xl border border-[#353F39]/10 bg-white p-4 shadow-[0_12px_35px_rgba(53,63,57,0.14)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#353F39]/50">
          {feature.kind}
        </span>
        <button type="button" onClick={onClose} aria-label="Close object controls" className="text-lg text-[#353F39]/50">
          ×
        </button>
      </div>
      {feature.kind === "polygon" ? (
        <PolygonControls feature={feature} onUpdate={onUpdate} />
      ) : (
        <LabelControls feature={feature} onUpdate={onUpdate} />
      )}
      <button
        type="button"
        onClick={onDelete}
        className="mt-4 w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Delete object
      </button>
    </aside>
  );
}

function PolygonControls({
  feature,
  onUpdate,
}: {
  feature: PolygonFeature;
  onUpdate: (
    updater: (feature: MapFeature) => MapFeature,
    status?: string,
  ) => void;
}) {
  return (
    <>
      <label className="block text-xs font-medium text-[#353F39]/60">
        Name
        <input
          defaultValue={feature.name}
          onBlur={(event) =>
            onUpdate(
              (current) =>
                current.kind === "polygon"
                  ? { ...current, name: event.target.value.trim() || current.name }
                  : current,
              "Object renamed.",
            )
          }
          className="mt-1 w-full rounded-lg bg-[#F7F5EF] px-2.5 py-2 text-sm text-[#353F39] outline-none focus:ring-2 focus:ring-[#8DB7B2]"
        />
      </label>
      <ColorControl
        label="Fill"
        value={feature.fill}
        onChange={(fill) =>
          onUpdate(
            (current) => (current.kind === "polygon" ? { ...current, fill } : current),
            "Fill updated.",
          )
        }
      />
    </>
  );
}

function LabelControls({
  feature,
  onUpdate,
}: {
  feature: LabelFeature;
  onUpdate: (
    updater: (feature: MapFeature) => MapFeature,
    status?: string,
  ) => void;
}) {
  return (
    <>
      <label className="block text-xs font-medium text-[#353F39]/60">
        Text
        <input
          defaultValue={feature.text}
          onBlur={(event) =>
            onUpdate(
              (current) =>
                current.kind === "label"
                  ? { ...current, text: event.target.value.trim() || current.text }
                  : current,
              "Label updated.",
            )
          }
          className="mt-1 w-full rounded-lg bg-[#F7F5EF] px-2.5 py-2 text-sm text-[#353F39] outline-none focus:ring-2 focus:ring-[#8DB7B2]"
        />
      </label>
      <ColorControl
        label="Text color"
        value={feature.color}
        onChange={(color) =>
          onUpdate(
            (current) => (current.kind === "label" ? { ...current, color } : current),
            "Text color updated.",
          )
        }
      />
    </>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 flex items-center justify-between text-xs font-medium text-[#353F39]/60">
      {label}
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent"
      />
    </label>
  );
}
