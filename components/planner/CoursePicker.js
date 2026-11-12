"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { COURSES, DEGREE } from "@/lib/data";
import { progress, cgpa } from "@/lib/engine";
import { GRADES } from "./shared";

const FILTERS = [
  ["all", "All"], ["core", "CSE core"], ["foundation", "Math and science"], ["gened", "GenEd"], ["elective", "Electives"],
];
const inFilter = (c, f) =>
  f === "all" ? true : f === "core" ? c.category === "core" || c.category === "project" : f === "foundation" ? c.group === "MATH" || c.group === "SCI" : f === "gened" ? c.group === "GENED" : c.category === "elective";

export default function CoursePicker({ state, patch }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("core");
  const done = useMemo(() => new Set(state.completed), [state.completed]);
  const list = useMemo(
    () =>
      Object.values(COURSES)
        .filter((c) => inFilter(c, f) && (c.code + " " + c.name).toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [q, f]
  );
  const prog = useMemo(() => progress(state.completed), [state.completed]);
  const gpa = useMemo(() => cgpa(state.completed.filter((c) => state.grades[c]).map((c) => ({ code: c, grade: state.grades[c] }))), [state.completed, state.grades]);
  const [target, setTarget] = useState("3.5");

  const toggle = (code) =>
    patch((s) => ({ completed: s.completed.includes(code) ? s.completed.filter((c) => c !== code) : [...s.completed, code] }));

  // Average grade point needed on the remaining credits to reach the target CGPA
  const remaining = prog.remaining;
  const pts = gpa.cgpa * gpa.credits;
  const need = remaining > 0 && +target > 0 ? ((+target) * (gpa.credits + remaining) - pts) / remaining : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a code or name, e.g. CSE221"
              className="w-full rounded-xl border border-white/10 bg-sunken-2 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
              aria-label="Search courses"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(([k, l]) => (
              <button key={k} onClick={() => setF(k)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${f === k ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
        </div>
        <ul className="scroll-thin max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
          {list.map((c) => {
            const on = done.has(c.code);
            return (
              <li key={c.code} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${on ? "border-brand-400/40 bg-brand-500/10" : "border-white/5 bg-sunken"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(c.code)} className="h-4 w-4 accent-[#2858a8]" aria-label={`Mark ${c.code} completed`} />
                <span className="w-16 shrink-0 font-mono text-xs text-brand-300">{c.code}</span>
                <span className="min-w-0 flex-1 truncate text-slate-200">{c.name}</span>
                {c.placeholder && <span className="text-[10px] text-amber-300">placeholder</span>}
                {c.category === "elective" && !c.onOfficialList && <span className="hidden text-[10px] text-slate-500 sm:inline">not on official list</span>}
                <span className="w-10 shrink-0 text-right text-xs text-slate-400" title="Estimated difficulty">{c.difficulty.toFixed(1)}</span>
                {on && (
                  <select
                    value={state.grades[c.code] || ""} onChange={(e) => patch((s) => ({ grades: { ...s.grades, [c.code]: e.target.value } }))}
                    className="rounded-lg border border-white/10 bg-panel px-1.5 py-1 text-xs text-slate-200" aria-label={`Grade for ${c.code}`}
                  >
                    <option value="">Grade</option>
                    {GRADES.map((g) => <option key={g}>{g}</option>)}
                  </select>
                )}
              </li>
            );
          })}
          {!list.length && <li className="p-4 text-center text-sm text-slate-500">No courses match.</li>}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Tick what you have completed. The number on the right is the estimated difficulty (1 to 10), not an official rating.</p>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 flex items-end justify-between">
            <p className="text-sm text-slate-400">Credits earned</p>
            <p className="text-2xl font-semibold text-white">{prog.earned}<span className="text-sm text-slate-500"> / {DEGREE.totalCredits}</span></p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300" style={{ width: `${(prog.earned / DEGREE.totalCredits) * 100}%` }} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">CSE core</dt><dd className="text-slate-200">{prog.core.done}/{prog.core.total} cr</dd></div>
            <div><dt className="text-slate-500">Math and science</dt><dd className="text-slate-200">{prog.foundation.done}/{prog.foundation.total} cr</dd></div>
            <div><dt className="text-slate-500">GenEd</dt><dd className="text-slate-200">{prog.gened.done}/{prog.gened.total} cr</dd></div>
            <div><dt className="text-slate-500">Electives</dt><dd className="text-slate-200">{prog.electives.done}/{prog.electives.total} cr</dd></div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Elective credits are whatever remains of 136 after the required groups, so check this against your own degree plan.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">CGPA (graded courses)</p>
          <p className="text-4xl font-semibold text-white">{gpa.credits ? gpa.cgpa.toFixed(2) : "-"}</p>
          <p className="text-xs text-slate-500">{gpa.credits} graded credits</p>
          <label className="mt-4 block text-sm text-slate-400" htmlFor="tgt">Target CGPA</label>
          <input id="tgt" type="number" step="0.05" min="0" max="4" value={target} onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-24 rounded-lg border border-white/10 bg-sunken-2 px-2 py-1.5 text-sm text-white" />
          {need !== null && (
            <p className="mt-2 text-sm text-slate-300">
              {need > 4.0 ? "Not reachable on the remaining credits." : need <= 0 ? "Already above target." : <>You need about <span className="font-semibold text-white">{need.toFixed(2)}</span> average on the remaining {remaining} credits.</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
