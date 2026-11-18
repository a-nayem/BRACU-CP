"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { COURSES } from "@/lib/data";
import { GRADE_POINTS } from "@/lib/engine";
import { GRADES } from "./shared";

const sel = "rounded-lg border border-white/10 bg-panel px-2 py-1.5 text-xs text-slate-200 focus:border-brand-400 focus:outline-none";
const PASS = GRADES.filter((g) => g !== "F");
const opts = (label, list = GRADES) => [<option key="" value="">{label}</option>, ...list.map((g) => <option key={g} value={g}>{GRADE_POINTS[g].toFixed(1)} ({g})</option>)];
const seg = (on) => `rounded-full border px-3 py-1 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${on ? "border-brand-400 bg-brand-500/25 text-white" : "border-white/10 text-slate-400 hover:text-white"}`;

// One full-width card per repeated (failed) or retaken (improving) course. Asks: repeat or retake, the last grade, whether it has
// been taken yet, then the new grade (if taken) or the grade the student expects (if not).
function RetakeCard({ code, state, patch, info }) {
  const c = COURSES[code], e = (state.retakes || {})[code] || {};
  const repeat = info.original[code] === "F";
  const [taken, setTaken] = useState(!!e.to);
  const setRt = (k, v) => patch((s) => ({ retakes: { ...(s.retakes || {}), [code]: { ...((s.retakes || {})[code] || {}), [k]: v } } }));
  const setGrade = (v) => patch((s) => ({ grades: { ...s.grades, [code]: v } }));
  const remove = () => patch((s) => { const r = { ...(s.retakes || {}) }; delete r[code]; return { retakes: r }; });
  const setKind = (isRepeat) => (isRepeat ? setGrade("F") : repeat && setGrade(""));
  const setTakenTo = (v) => { setTaken(v); if (!v) setRt("to", ""); };

  return (
    <li className="col-span-full rounded-2xl border border-brand-400/40 bg-brand-500/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-100"><span className="mr-2 font-mono font-semibold text-brand-300">{code}</span>{c.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">{c.credits} cr &middot; difficulty {c.difficulty.toFixed(1)}</p>
        </div>
        <button type="button" onClick={remove} aria-label={`Remove ${code} from repeat and retake`} className="rounded-full p-1 text-slate-400 hover:text-white"><X className="h-4 w-4" aria-hidden="true" /></button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs text-slate-400">What is it?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Repeat or retake for ${code}`}>
            <button type="button" aria-pressed={repeat} onClick={() => setKind(true)} className={seg(repeat)}>Repeat (I failed it)</button>
            <button type="button" aria-pressed={!repeat} onClick={() => setKind(false)} className={seg(!repeat)}>Retake (improve the grade)</button>
          </div>
        </div>
        <label className="block text-xs text-slate-400">Last grade
          <select className={`${sel} mt-1.5 block`} value={state.grades[code] || ""} disabled={repeat} onChange={(ev) => setGrade(ev.target.value)} aria-label={`Last grade for ${code}`}>
            {repeat ? <option value="F">{GRADE_POINTS.F.toFixed(1)} (F)</option> : opts("Choose a grade", PASS)}
          </select>
        </label>

        <div>
          <p className="mb-1.5 text-xs text-slate-400">Have you taken it again yet?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Taken again for ${code}`}>
            <button type="button" aria-pressed={!taken} onClick={() => setTakenTo(false)} className={seg(!taken)}>Not yet</button>
            <button type="button" aria-pressed={taken} onClick={() => setTakenTo(true)} className={seg(taken)}>Already taken</button>
          </div>
        </div>
        {taken ? (
          <label className="block text-xs text-slate-400">New grade
            <select className={`${sel} mt-1.5 block`} value={e.to || ""} onChange={(ev) => setRt("to", ev.target.value)} aria-label={`New grade for ${code}`}>{opts("Choose a grade")}</select>
          </label>
        ) : (
          <label className="block text-xs text-slate-400">Expected new grade
            <select className={`${sel} mt-1.5 block`} value={e.goal || ""} onChange={(ev) => setRt("goal", ev.target.value)} aria-label={`Expected new grade for ${code}`}>{opts("None", PASS)}</select>
          </label>
        )}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        {taken && e.to && !(info.effective[code] === "F") ? `The new grade ${e.to} replaces ${info.original[code] || "the earlier grade"} in your CGPA.` : repeat || info.effective[code] === "F" ? "Not passed yet. Planned first in your next semester." : "Planned in your next semester to improve the grade."}
      </p>
    </li>
  );
}

export default function RetakeCards({ state, patch, info, results, onAdd }) {
  const listed = Object.keys(state.retakes || {}).filter((c) => COURSES[c]);
  return (
    <>
      {results.length > 0 && (
        <li className="col-span-full">
          <ul className="space-y-1" aria-label="Matching courses">
            {results.map((c) => (
              <li key={c.code}><button type="button" onClick={() => onAdd(c.code)} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-sunken px-4 py-2 text-left text-sm text-slate-300 hover:border-brand-400/50 hover:text-white">
                <span className="font-mono text-brand-300">{c.code}</span><span className="min-w-0 truncate">{c.name}</span><span className="ml-auto text-xs text-slate-500">{c.credits} cr</span>
              </button></li>
            ))}
          </ul>
        </li>
      )}
      {listed.map((c) => <RetakeCard key={c} code={c} state={state} patch={patch} info={info} />)}
      {!listed.length && !results.length && (
        <li className="col-span-full rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
          Type a course code in the search box above and pick it. Its card appears here.
        </li>
      )}
      {info.pending.length > 0 && (
        <li className="col-span-full text-xs text-slate-400">
          {info.pending.length} to take, {info.credits(info.pending)} credits.{info.improve.length > 0 ? ` ${info.credits(info.improve)} of those credits are retakes of courses you already passed: they fill semester slots and add load but do not move you closer to the degree.` : ""} Credits are counted once and the new grade replaces the earlier one. They are planned first in Steps 2 and 3.
        </li>
      )}
    </>
  );
}
