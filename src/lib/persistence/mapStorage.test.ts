import { describe, expect, it } from "vitest";

import {
  MAP_STORAGE_KEY,
  loadMapFromStorage,
  saveMapToStorage,
  type KeyValueStorage,
} from "./mapStorage";
import { createEmptyMapDocument, serializeMapDocument } from "../map/serialization";

function createMemoryStorage(initial?: Record<string, string>): KeyValueStorage {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe("map localStorage adapter", () => {
  it("saves and restores a versioned map", () => {
    const storage = createMemoryStorage();
    const map = createEmptyMapDocument("Recovered", 640, 480);

    expect(saveMapToStorage(storage, map)).toEqual({ status: "saved" });
    expect(loadMapFromStorage(storage)).toEqual({
      status: "restored",
      map,
    });
  });

  it("reports an empty store", () => {
    expect(loadMapFromStorage(createMemoryStorage())).toEqual({
      status: "empty",
    });
  });

  it("discards malformed JSON and leaves storage recoverable", () => {
    const storage = createMemoryStorage({
      [MAP_STORAGE_KEY]: "{not-json",
    });

    expect(loadMapFromStorage(storage)).toEqual({
      status: "discarded",
      reason: "malformed",
    });
    expect(storage.getItem(MAP_STORAGE_KEY)).toBeNull();
  });

  it("discards unsupported map versions", () => {
    const map = createEmptyMapDocument();
    const stale = JSON.stringify({ ...JSON.parse(serializeMapDocument(map)), version: 99 });
    const storage = createMemoryStorage({
      [MAP_STORAGE_KEY]: stale,
    });

    expect(loadMapFromStorage(storage)).toEqual({
      status: "discarded",
      reason: "unsupported",
    });
  });

  it("reports read and write storage failures", () => {
    const unreadable: KeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    const unwritable: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    };

    expect(loadMapFromStorage(unreadable)).toEqual({
      status: "unavailable",
      error: "read",
    });
    expect(saveMapToStorage(unwritable, createEmptyMapDocument())).toEqual({
      status: "unavailable",
      error: "write",
    });
  });
});
