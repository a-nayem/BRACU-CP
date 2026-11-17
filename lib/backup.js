// JSON backup of the planner state: export on one device, import on another. Nothing is sent to a server.
import { COURSES } from "./data.js";
import { GRADE_POINTS } from "./engine.js";

export const BACKUP_APP = "bracu-cse-planner";
export const BACKUP_VERSION = 2; // v2: retakes[code] = { to, goal }. v1 files (retakes[code] = earlier grade string) still import.
const MAX_BYTES = 1024 * 1024;
const PLANS = ["sustainable", "heavy", "cg", "risky"];

export function makeBackup(state) {
  return JSON.stringify({ app: BACKUP_APP, v: BACKUP_VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
}

const isObj = (o) => o && typeof o === "object" && !Array.isArray(o);
const known = (c) => typeof c === "string" && Object.prototype.hasOwnProperty.call(COURSES, c);

// Checks a backup file and keeps only values the planner understands. Returns { ok, state, summary } or { ok: false, error }.
export function parseBackup(text) {
  if (typeof text !== "string" || text.length > MAX_BYTES) return { ok: false, error: "That file is too large to be a planner backup." };
  let o;
  try { o = JSON.parse(text); } catch { return { ok: false, error: "That file is not valid JSON." }; }
  if (!isObj(o) || o.app !== BACKUP_APP || !isObj(o.state)) return { ok: false, error: "That file is not a planner backup." };
  if (o.v !== BACKUP_VERSION && o.v !== 1) return { ok: false, error: `Unsupported backup version ${String(o.v)}.` };
  const s = o.state, out = {};

  out.completed = Array.isArray(s.completed) ? [...new Set(s.completed.filter(known))] : [];
  out.grades = {};
  if (isObj(s.grades)) for (const [c, g] of Object.entries(s.grades)) if (known(c) && typeof g === "string" && g in GRADE_POINTS) out.grades[c] = g;
  out.retakes = {};
  const okG = (g) => typeof g === "string" && (g === "" || g in GRADE_POINTS);
  if (isObj(s.retakes)) for (const [c, e] of Object.entries(s.retakes)) {
    if (!known(c)) continue;
    if (isObj(e)) out.retakes[c] = { to: okG(e.to) ? e.to : "", goal: okG(e.goal) ? e.goal : "" };
    else if (o.v === 1 && okG(e) && e) { out.retakes[c] = { to: out.grades[c] || "", goal: "" }; out.grades[c] = e; } // v1: grades = new grade, retakes = earlier grade
  }
  out.edits = {};
  if (isObj(s.edits)) for (const k of PLANS) if (Array.isArray(s.edits[k])) out.edits[k] = [...new Set(s.edits[k].filter(known))];
  out.slots = {};
  if (isObj(s.slots)) for (const [c, v] of Object.entries(s.slots)) if (known(c) && Array.isArray(v)) out.slots[c] = v;
  out.target = [9, 12, 15].includes(s.target) ? s.target : 12;
  out.electives = s.electives === true;
  out.eng102First = s.eng102First === true;
  out.semester = Number.isInteger(s.semester) && s.semester >= 1 && s.semester <= 12 ? s.semester : null;
  out.residential = [3, 4, 5].includes(s.residential) ? s.residential : null;

  return { ok: true, state: out, summary: { courses: out.completed.length, grades: Object.keys(out.grades).length, retakes: Object.keys(out.retakes).length } };
}
