export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export const MAX_HISTORY_ENTRIES = 50;

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(
  history: HistoryState<T>,
  next: T,
): HistoryState<T> {
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY_ENTRIES),
    present: next,
    future: [],
  };
}

export function undoHistory<T>(
  history: HistoryState<T>,
): HistoryState<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(
  history: HistoryState<T>,
): HistoryState<T> {
  const next = history.future[0];
  if (next === undefined) {
    return history;
  }

  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY_ENTRIES),
    present: next,
    future: history.future.slice(1),
  };
}
