"use client";
import { useSyncExternalStore, useCallback } from "react";

const KEY = "bracu-theme";
const EVT = "bracu-themechange";

const subscribe = (cb) => { window.addEventListener(EVT, cb); return () => window.removeEventListener(EVT, cb); };
const snapshot = () => document.documentElement.classList.contains("dark");

// Light is the default; the choice is remembered per browser.
export function useDark() {
  const dark = useSyncExternalStore(subscribe, snapshot, () => false);
  const setDark = useCallback((v) => {
    document.documentElement.classList.toggle("dark", v);
    try { localStorage.setItem(KEY, v ? "dark" : "light"); } catch {}
    window.dispatchEvent(new Event(EVT));
  }, []);
  return [dark, setDark];
}

// Runs before first paint (inlined in <head>) so there is no flash of the wrong theme.
export const THEME_INIT = `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
