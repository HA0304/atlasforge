import {
  MapDocumentError,
  parseMapDocument,
  serializeMapDocument,
} from "../map/serialization";
import type { MapDocument } from "../map/types";

export const MAP_STORAGE_KEY = "atlasforge-map-document";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type MapLoadResult =
  | { status: "empty" }
  | { status: "restored"; map: MapDocument }
  | { status: "discarded"; reason: "malformed" | "unsupported" }
  | { status: "unavailable"; error: "read" | "write" };

export type MapSaveResult =
  | { status: "saved" }
  | { status: "unavailable"; error: "write" };

export function loadMapFromStorage(
  storage: KeyValueStorage,
  key = MAP_STORAGE_KEY,
): MapLoadResult {
  let saved: string | null;

  try {
    saved = storage.getItem(key);
  } catch {
    return { status: "unavailable", error: "read" };
  }

  if (saved === null) {
    return { status: "empty" };
  }

  try {
    return { status: "restored", map: parseMapDocument(saved) };
  } catch (error) {
    try {
      storage.removeItem(key);
    } catch {
      // The stale value remains inaccessible; the in-memory document is unchanged.
    }

    return {
      status: "discarded",
      reason:
        error instanceof MapDocumentError &&
        error.path === "document.version"
          ? "unsupported"
          : "malformed",
    };
  }
}

export function saveMapToStorage(
  storage: KeyValueStorage,
  map: MapDocument,
  key = MAP_STORAGE_KEY,
): MapSaveResult {
  try {
    storage.setItem(key, serializeMapDocument(map));
    return { status: "saved" };
  } catch {
    return { status: "unavailable", error: "write" };
  }
}
