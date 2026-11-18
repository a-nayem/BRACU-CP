"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { COURSES, DEGREE } from "@/lib/data";
import { progress, cgpa, GRADE_POINTS, hiddenCodes } from "@/lib/engine";
import { GRADES } from "./shared";
import RetakeCards from "./RetakeBox";

const FILTERS = [
  ["all", "All"], ["core", "CSE core"], ["foundation", "Math and science"], ["gened", "GenEd"], ["elective", "Electives"], ["retake", "Repeat / retake"],
];
const inFilter = (c, f) =>
  f === "all" || f === "retake" ? true : f === "core" ? c.category === "core" || c.category === "project" : f === "foundation" ? c.group === "MATH" || c.group === "SCI" : f === "gened" ? c.group === "GENED" : c.category === "elective";

export default function CoursePicker({ state, patch, info }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("core");
  const done = useMemo(() => new Set(state.completed), [state.completed]);
  const eng = !!state.eng102First;
  const hid = useMemo(() => hiddenCodes(eng), [eng]);
  const list = useMemo(
    () =>
      Object.values(COURSES)
        .filter((c) => !hid.has(c.code) && inFilter(c, f) && (c.code + " " + c.name).toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.code.localeCompare(b.code)),
    [q, f, hid]
  );
  // Repeat / retake tab: the search box finds a course to add; its card then appears in the list.
  const retakeResults = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (f !== "retake" || !n) return [];
    const listed = Object.keys(state.retakes || {});
    return Object.values(COURSES).filter((c) => !hid.has(c.code) && !c.residentialOnly && !listed.includes(c.code) && (c.code + " " + c.name).toLowerCase().includes(n)).sort((a, b) => a.code.localeCompare(b.code)).slice(0, 6);
  }, [q, f, hid, state.retakes]);
  const addRetake = (code) => {
    patch((s) => ({ completed: s.completed.includes(code) ? s.completed : [...s.completed, code], retakes: { ...(s.retakes || {}), [code]: { to: "", goal: "" } } }));
    setQ("");
  };
  const retakeCount = Object.keys(state.retakes || {}).length;

  // Everything works from the effective grade: a new (retake) grade replaces the earlier one, and an F is not passed.
  const prog = useMemo(() => progress(info.passed, COURSES, { eng102First: eng }), [info, eng]);
  // Current CGPA: one grade per course, the latest attempt. A pending repeat (F) still counts until it is replaced.
  const gpa = useMemo(() => cgpa(info.records), [info]);
  // Without the courses still to be repeated or retaken: the base for the target estimate, since their new grades will replace these.
  const gpaBase = useMemo(() => cgpa(info.records.filter((r) => !info.pendingSet.has(r.code))), [info]);
  const gpaBefore = useMemo(() => (info.replaced.length ? cgpa(info.beforeRecords) : null), [info]);
  const gpaGoal = useMemo(() => (info.hasGoal ? cgpa(info.goalRecords) : null), [info]);
  const failed = info.repeat;
  const [target, setTarget] = useState("3.5");

  const toggle = (code) =>
    patch((s) => ({ completed: s.completed.includes(code) ? s.completed.filter((c) => c !== code) : [...s.completed, code] }));

  // Average grade point needed on the remaining credits to reach the target CGPA
  // Failed courses are replaced when retaken, so their credits move from the graded total to the remaining credits.
  // Retakes of passed courses are not in the remaining credits, but their new grade will replace the old one, so they count here.
  const remaining = prog.remaining + info.credits(info.improve);
  const pts = gpaBase.cgpa * gpaBase.credits;
  const need = remaining > 0 && +target > 0 ? ((+target) * (gpaBase.credits + remaining) - pts) / remaining : null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder={f === "retake" ? "Add a course to repeat or retake, e.g. CSE220" : "Search a code or name, e.g. CSE221"}
              className="w-full rounded-xl border border-white/10 bg-sunken-2 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
              aria-label={f === "retake" ? "Add a repeat or retake course" : "Search courses"}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(([k, l]) => (
              <button key={k} onClick={() => setF(k)} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${f === k ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}>{l}{k === "retake" && retakeCount > 0 ? ` (${retakeCount})` : ""}</button>
            ))}
          </div>
        </div>
        <button
          onClick={() => patch({ eng102First: !eng })} aria-pressed={eng}
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${eng ? "border-brand-400 bg-brand-500/25 text-white" : "border-white/10 text-slate-400 hover:border-brand-400/50 hover:text-white"}`}
        >
          {eng ? "Started with ENG102: ENG103 required, ENG101 not needed" : "I started with ENG102 in my first semester"}
        </button>
        <ul className="scroll-thin grid max-h-[34rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {f === "retake" ? <RetakeCards state={state} patch={patch} info={info} results={retakeResults} onAdd={addRetake} /> : list.map((c) => {
            const on = done.has(c.code);
            const hard = c.hard || [];
            const soft = c.soft || [];
            return (
              <li key={c.code}>
                <div
                  role="button" tabIndex={0} aria-pressed={on} aria-label={`${c.code} ${c.name}, ${on ? "completed" : "not completed"}`}
                  onClick={() => toggle(c.code)}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(c.code); } }}
                  className={`flex h-full min-h-[8.5rem] cursor-pointer flex-col rounded-2xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${on ? "border-brand-400/50 bg-brand-500/10" : "border-white/10 bg-sunken hover:border-brand-400/40"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-brand-300">{c.code}</span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${on ? "border-brand-400 bg-brand-500 text-white" : "border-white/20 text-transparent"}`} aria-hidden="true">&#10003;</span>
                  </div>
                  <p className="mt-1 text-sm leading-snug text-slate-200">{c.name}</p>
                  {c.choices && <p className="mt-1 text-[10px] leading-snug text-slate-500">Options: {c.choices.join(", ")}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hard.map((h) => <span key={"h" + h} className="rounded-md border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300">HP: {h}</span>)}
                    {soft.map((h) => <span key={"s" + h} className="rounded-md border border-brand-400/30 bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-300">SP: {h}</span>)}
                    {!hard.length && !soft.length && <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">No prerequisite</span>}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="text-xs font-semibold text-slate-300" title="Estimated difficulty (1 to 10), not an official rating">{c.credits} cr &middot; difficulty {c.difficulty.toFixed(1)}</span>
                    {on && info.effective[c.code] === "F" && <span className="rounded-md border border-red-400/40 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300">Repeat needed</span>}
                    {on && (
                      <select
                        value={state.grades[c.code] || ""}
                        onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
                        onChange={(e) => patch((s) => ({ grades: { ...s.grades, [c.code]: e.target.value } }))}
                        className="rounded-lg border border-white/10 bg-panel px-1.5 py-1 text-xs text-slate-200" aria-label={`Grade for ${c.code}`}
                      >
                        <option value="">Grade</option>
                        {GRADES.map((g) => <option key={g} value={g}>{GRADE_POINTS[g].toFixed(1)} ({g})</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {f !== "retake" && !list.length && <li className="col-span-full p-4 text-center text-sm text-slate-500">No courses match.</li>}
        </ul>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-1 flex items-end justify-between">
            <p className="text-sm text-slate-400">Credits earned</p>
            <p className="text-2xl font-semibold text-white">{prog.earned}<span className="text-sm text-slate-500"> / {DEGREE.totalCredits}</span></p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300" style={{ width: `${(prog.earned / DEGREE.totalCredits) * 100}%` }} /></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Program core</dt><dd className="text-slate-200">{prog.core.done}/{prog.core.total} cr</dd></div>
            <div><dt className="text-slate-500">School core</dt><dd className="text-slate-200">{prog.foundation.done}/{prog.foundation.total} cr</dd></div>
            <div><dt className="text-slate-500">GenEd</dt><dd className="text-slate-200">{prog.gened.done}/{prog.gened.total} cr</dd></div>
            <div><dt className="text-slate-500">Program elective</dt><dd className="text-slate-200">{prog.electives.done}/{prog.electives.total} cr</dd></div>
            <div><dt className="text-slate-500">CSE400</dt><dd className="text-slate-200">{prog.project.done}/{prog.project.total} cr</dd></div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Credit groups follow the official CSE degree plan. MAT110 and PHY111 count inside GenEd.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm text-slate-400">CGPA (graded courses)</p>
          <p className="text-4xl font-semibold text-white">{gpa.credits ? gpa.cgpa.toFixed(2) : "-"}</p>
          <p className="text-xs text-slate-500">{gpa.credits} graded credits{failed.length > 0 ? `, includes ${failed.length} F until repeated` : ""}</p>
          {gpaBefore && (
            <p className="mt-1 text-xs text-slate-400">Repeats and retakes changed it from {gpaBefore.cgpa.toFixed(2)} to {gpa.cgpa.toFixed(2)}. Only the newest grade of a course counts.</p>
          )}
          {gpaGoal && (
            <p className="mt-1 text-xs text-brand-300">If you reach your goal grades: {gpaGoal.cgpa.toFixed(2)}</p>
          )}
          {info.pending.length > 0 && (
            <p className="mt-1 text-xs text-red-300">To take again: {info.pending.join(", ")} ({info.credits(info.pending)} credits, planned first in Steps 2 and 3). Credits are counted once, and the new grade replaces the earlier one.</p>
          )}
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
