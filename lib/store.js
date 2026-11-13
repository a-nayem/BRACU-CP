"use client";
import { useEffect, useState, useCallback } from "react";

const KEY = "bracu-cse-planner-v1";
const DEFAULT = { completed: [], grades: {}, edits: {}, slots: {}, target: 12, electives: false, eng102First: false, semester: null, residential: null, retakes: {} };

// Light per-browser persistence. All access is wrapped: storage can be blocked or empty.
export function usePlannerState() {
  const [state, setState] = useState(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, ready]);

  const patch = useCallback((p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })), []);
  const reset = useCallback(() => setState(DEFAULT), []);
  return { state, patch, reset, ready };
}
