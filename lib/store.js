"use client";
import { useEffect, useState, useCallback } from "react";

const KEY = "bracu-cse-planner-v1";
const DEFAULT = { completed: [], grades: {}, edits: {}, slots: {}, target: 12, electives: false, eng102First: false, semester: null, residential: null, retakes: {} };

// Nothing is saved automatically: the entries live in memory for this visit only. A student keeps their data by exporting a
// JSON file (lib/backup.js) and importing it next time, so the next person on the same computer starts empty.
export function usePlannerState() {
  const [state, setState] = useState(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Earlier versions saved the last student's entries in this browser. Remove that old copy once.
    try { localStorage.removeItem(KEY); } catch {}
    setReady(true);
  }, []);

  const patch = useCallback((p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })), []);
  const reset = useCallback(() => setState(DEFAULT), []);
  // Replaces everything with an imported backup (already checked by parseBackup).
  const replace = useCallback((next) => setState({ ...DEFAULT, ...next }), []);
  return { state, patch, reset, replace, ready };
}
