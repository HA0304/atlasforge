import { describe, expect, it } from "vitest";

import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "./history";

describe("document history", () => {
  it("undoes and redoes a committed edit", () => {
    const first = createHistory("first");
    const second = pushHistory(first, "second");
    const undone = undoHistory(second);

    expect(undone.present).toBe("first");
    expect(redoHistory(undone).present).toBe("second");
  });

  it("clears redo after a new edit", () => {
    const history = pushHistory(undoHistory(pushHistory(createHistory(0), 1)), 2);
    const next = pushHistory(undoHistory(history), 3);

    expect(next.present).toBe(3);
    expect(next.future).toEqual([]);
  });

  it("bounds history to fifty entries", () => {
    let history = createHistory(0);
    for (let value = 1; value <= 60; value += 1) {
      history = pushHistory(history, value);
    }

    expect(history.past).toHaveLength(50);
    expect(history.past[0]).toBe(10);
  });
});
