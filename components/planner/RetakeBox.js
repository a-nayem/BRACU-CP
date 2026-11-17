"use client";
import { useMemo, useState } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { COURSES } from "@/lib/data";
import { GRADE_POINTS } from "@/lib/engine";
import { GRADES } from "./shared";

const sel = "rounded-lg border border-white/10 bg-panel px-1.5 py-1 text-xs text-slate-200";
const gradeOpts = (label) => [<option key="" value="">{label}</option>, ...GRADES.map((g) => <option key={g} value={g}>{GRADE_POINTS[g].toFixed(1)} ({g})</option>)];

// Repeat and retake: pick the courses being repeated (an F) or retaken (to improve a grade). They are planned first in Steps 2 and 3,
// count in the semester load, and the new grade replaces the earlier one in the CGPA.
export default function RetakeBox({ state, patch, info }) {
  const [q, setQ] = useState("");
  const rt = state.retakes || {};
  const listed = Object.keys(rt).filter((c) => COURSES[c]);
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return Object.values(COURSES).filter((c) => !listed.includes(c.code) && (c.code + " " + c.name).toLowerCase().includes(n) && !c.residentialOnly).sort((a, b) => a.code.localeCompare(b.code)).slice(0, 6);
  }, [q, listed.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (code) => {
    patch((s) => ({ completed: s.completed.includes(code) ? s.completed : [...s.completed, code], retakes: { ...(s.retakes || {}), [code]: { to: "", goal: "" } } }));
    setQ("");
  };
  const remove = (code) => patch((s) => { const r = { ...(s.retakes || {}) }; delete r[code]; return { retakes: r }; });
  const setField = (code, k, v) => patch((s) => ({ retakes: { ...(s.retakes || {}), [code]: { ...(s.retakes || {})[code], [k]: v } } }));
  const setOriginal = (code, v) => patch((s) => ({ grades: { ...s.grades, [code]: v } }));

  const kindOf = (c) => (info.effective[c] === "F" ? "Repeat" : "Retake");
  const stateOf = (c) => {
    const e = rt[c] || {};
    if (e.to && info.effective[c] !== "F") return `Replaced ${info.original[c] || "no grade"} with ${e.to}`;
    if (info.effective[c] === "F") return "Not passed yet. Planned first in your next semester.";
    return "Planned in your next semester to improve the grade";
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="flex items-center gap-2 text-sm text-slate-300"><RotateCcw className="h-4 w-4 text-brand-300" aria-hidden="true" />Repeat and retake</p>
      <p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">
        Add a course you failed (repeat) or want to improve (retake). Enter the earlier grade, then the new grade once you have it. The new grade replaces the earlier one in your CGPA, the credits are counted once, and the course is planned first in Steps 2 and 3.
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a course, e.g. CSE220" aria-label="Add a repeat or retake course"
          className="w-full rounded-xl border border-white/10 bg-sunken-2 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none" />
      </div>
      {results.length > 0 && (
        <ul className="mt-2 space-y-1" aria-label="Matching courses">
          {results.map((c) => (
            <li key={c.code}><button type="button" onClick={() => add(c.code)} className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-left text-xs text-slate-300 hover:border-brand-400/50 hover:text-white">
              <span className="font-mono text-brand-300">{c.code}</span><span className="min-w-0 truncate">{c.name}</span><span className="ml-auto text-slate-500">{c.credits} cr</span>
            </button></li>
          ))}
        </ul>
      )}
      {listed.length > 0 && (
        <ul className="mt-4 space-y-3">
          {listed.map((c) => {
            const e = rt[c] || {}, pending = info.pendingSet.has(c);
            return (
              <li key={c} className="rounded-2xl border border-white/10 bg-sunken p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200"><span className="mr-2 font-mono text-brand-300">{c}</span>{COURSES[c].name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{COURSES[c].credits} cr · {stateOf(c)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${kindOf(c) === "Repeat" ? "border-red-400/40 bg-red-500/10 text-red-300" : "border-brand-400/40 bg-brand-500/10 text-brand-300"}`}>{kindOf(c)}</span>
                    <button type="button" onClick={() => remove(c)} aria-label={`Remove ${c} from repeat and retake`} className="rounded-full p-1 text-slate-500 hover:text-white"><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                  <label className="flex items-center gap-1.5">Earlier grade<select className={sel} value={state.grades[c] || ""} onChange={(ev) => setOriginal(c, ev.target.value)} aria-label={`Earlier grade for ${c}`}>{gradeOpts("Grade")}</select></label>
                  <label className="flex items-center gap-1.5">New grade<select className={sel} value={e.to || ""} onChange={(ev) => setField(c, "to", ev.target.value)} aria-label={`New grade for ${c}`}>{gradeOpts("Not taken yet")}</select></label>
                  {pending && <label className="flex items-center gap-1.5">Goal<select className={sel} value={e.goal || ""} onChange={(ev) => setField(c, "goal", ev.target.value)} aria-label={`Goal grade for ${c}`}>{gradeOpts("None")}</select></label>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {info.pending.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          {info.pending.length} to take, {info.credits(info.pending)} credits. {info.improve.length > 0 ? `${info.credits(info.improve)} of those credits are retakes of courses you already passed: they fill semester slots and add load but do not move you closer to the degree.` : ""}
        </p>
      )}
    </div>
  );
}
