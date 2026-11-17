"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { Check, Download, Upload } from "lucide-react";
import { usePlannerState } from "@/lib/store";
import { cgpa, progress } from "@/lib/engine";
import { COURSES } from "@/lib/data";
import { makeBackup, parseBackup } from "@/lib/backup";
import { retakeInfo } from "@/lib/retake";
import CoursePicker from "./CoursePicker";
import PlanView from "./PlanView";
import Roadmap from "./Roadmap";

// Pill buttons for the Step 2 controls. On state uses the same sky blue tint as the filter chips in the course panel.
const PILL = "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";
const PILL_ON = "border-brand-400 bg-brand-500/25 text-white";
const PILL_OFF = "border-white/10 text-gray-400 hover:border-brand-400/50 hover:text-white";

// Save and restore: nothing is saved automatically. The student exports a JSON file and imports it on their next visit or on another device.
function BackupBar({ state, replace }) {
  const [note, setNote] = useState(null); // { ok, text }
  const exportJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([makeBackup(state)], { type: "application/json" }));
    a.download = `bracu-planner-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setNote({ ok: true, text: "Backup downloaded. Import it on another device to continue there." });
  };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const r = parseBackup(String(rd.result));
      if (!r.ok) return setNote({ ok: false, text: r.error });
      if (!confirm("Replace what is on screen with this backup?")) return;
      replace(r.state);
      setNote({ ok: true, text: `Imported ${r.summary.courses} completed ${r.summary.courses === 1 ? "course" : "courses"}, ${r.summary.grades} ${r.summary.grades === 1 ? "grade" : "grades"} and ${r.summary.retakes} ${r.summary.retakes === 1 ? "retake" : "retakes"}.` });
    };
    rd.onerror = () => setNote({ ok: false, text: "That file could not be read." });
    rd.readAsText(f);
  };
  const btn = `${PILL} ${PILL_OFF}`;
  return (
    <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-gray-300">Save and restore</p>
      <p className="mb-3 text-xs text-gray-500">Nothing is saved on this computer or sent to a server. Export a JSON file before you leave and import it next time, on this or any other device.</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={exportJson} className={btn}><Download className="h-3.5 w-3.5" aria-hidden="true" />Export JSON</button>
        <label className={`${btn} cursor-pointer focus-within:ring-2 focus-within:ring-brand-400`} htmlFor="planner-import">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />Import JSON
          <input type="file" accept="application/json,.json" id="planner-import" className="sr-only" onChange={onFile} />
        </label>
        {note && <span role="status" className={`pl-2 text-xs ${note.ok ? "text-emerald-300" : "text-red-300"}`}>{note.text}</span>}
      </div>
    </div>
  );
}

// Start menu: which semester the student is planning and which semester is the residential one (3rd, 4th or 5th, by seat status).
// The residential semester cannot be picked as the planning semester.
function SemesterMenu({ state, patch }) {
  const sems = Array.from({ length: 12 }, (_, i) => i + 1);
  const pill = (on) => `${PILL} ${on ? PILL_ON : PILL_OFF}`;
  return (
    <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-gray-300">Which semester are you planning for?</p>
      <p className="mb-3 text-xs text-gray-500">This sets the semester numbers in Steps 2 and 3. It does not depend on credits, so repeats and retakes cannot throw it off.</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Semester you are planning for">
        {sems.map((n) => (
          <button key={n} disabled={state.residential === n} title={state.residential === n ? "This is your residential semester" : undefined}
            onClick={() => patch({ semester: state.semester === n ? null : n, edits: {} })} aria-pressed={state.semester === n}
            className={`${pill(state.semester === n)} ${state.residential === n ? "cursor-not-allowed opacity-30 line-through" : ""}`}>{n}</button>
        ))}
        {!state.semester && <span className="self-center pl-2 text-xs text-gray-500">Not picked, estimated from your completed credits.</span>}
      </div>
      <p className="mb-2 mt-5 text-sm text-gray-300">Residential semester</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Residential semester">
        {[[3, "3rd semester"], [4, "4th semester"], [5, "5th semester"]].map(([n, l]) => (
          <button key={n} onClick={() => patch((s) => ({ residential: s.residential === n ? null : n, semester: s.semester === n ? null : s.semester, edits: {} }))} aria-pressed={(state.residential || 3) === n} className={pill((state.residential || 3) === n)}>{l}</button>
        ))}
        <span className="self-center pl-2 text-xs text-gray-500">BNG103, HUM103, EMB101 and ENG102 (or BU201 if ENG102 is done) are planned only in that semester. It is the 3rd unless you pick the 4th or 5th.</span>
      </div>
    </div>
  );
}

const Section = ({ id, kicker, title, children }) => (
  <section id={id} className="scroll-mt-24 py-16">
    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-brand-300">{kicker}</p>
    <h2 className="mb-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
    {children}
  </section>
);

export default function PlannerApp() {
  const { state, patch, reset, replace, ready } = usePlannerState();
  // Effective grades: a new (retake) grade replaces the earlier one; an F is not passed and goes back into the plan as a repeat.
  const info = useMemo(() => retakeInfo(state), [state.completed, state.grades, state.retakes]);
  const g = useMemo(() => cgpa(info.records), [info]);
  const skill = g.credits ? (g.cgpa - 3.0) * 0.3 : 0;
  // A failed (F) course is not completed: it stays on the plan as a retake. Everything below Step 1 works from the passed courses only.
  const passed = info.passed;
  // The semester the student picked wins. Without a pick, finished semesters are estimated at 12 credits each. Five courses need CGPA 3.5+ and are allowed from semester 6.
  const semDone = useMemo(() => (state.semester ? state.semester - 1 : Math.round(progress(passed, COURSES, { eng102First: !!state.eng102First }).earned / 12)), [state.semester, passed, state.eng102First]);
  const cgpaOk = g.credits > 0 && g.cgpa >= 3.5;
  const fiveNow = cgpaOk && semDone + 1 > 5;
  // The residential semester is the 3rd unless the student picked the 4th or 5th.
  const resSem = state.residential || 3;
  const residentialNow = semDone + 1 === resSem;
  const residentialPending = semDone + 1 < resSem;
  const view = useMemo(() => ({ ...state, completed: passed, residentialNow, residentialPending, retake: info.pending, ...(state.target === 15 && !fiveNow ? { target: 12 } : {}) }), [state, passed, residentialNow, residentialPending, fiveNow, info]);
  // Steps 2 and 3 are heavy to calculate. They follow a deferred copy so ticking a course in Step 1 responds at once and the plans catch up right after.
  const live = useMemo(() => ({ view, skill, cgpaOk, startSemester: semDone + 1, residential: resSem, target: state.target }), [view, skill, cgpaOk, semDone, resSem, state.target]);
  const lag = useDeferredValue(live);
  const updating = lag !== live;
  const roadState = useMemo(() => ({ ...lag.view, target: lag.target === 15 && !lag.cgpaOk ? 12 : lag.target }), [lag]);

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-12">
      <div className="planner-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]" />
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Your course planner</h1>
        <p className="mt-4 text-lg font-light text-gray-400">
          Tell us what you have finished, then compare four ways to build your next semester. Swap any course and the load and warnings update instantly.
          Nothing is saved on this computer: export a JSON file to keep your entries.
        </p>
      </header>

      <Section id="cgpa" kicker="Step 1" title="What have you completed?">
        <BackupBar state={state} replace={replace} />
        <SemesterMenu state={state} patch={patch} />
        <CoursePicker state={state} patch={patch} info={info} />
      </Section>

      <Section id="plan" kicker="Step 2" title="Choose a plan for next semester">
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Credits</span>
            {[9, 12, 15].map((n) => {
              const locked = n === 15 && !cgpaOk;
              return (
                <button key={n} disabled={locked} title={locked ? "5 courses need a CGPA of 3.5 or higher (enter your grades in Step 1)" : undefined}
                  onClick={() => patch({ target: n, edits: {} })} aria-pressed={state.target === n}
                  className={`${PILL} ${state.target === n ? PILL_ON : PILL_OFF} ${locked ? "cursor-not-allowed opacity-40" : ""}`}>{n}</button>
              );
            })}
          </div>
          <button
            onClick={() => patch({ electives: !state.electives, edits: {} })} aria-pressed={state.electives}
            className={`${PILL} ${state.electives ? PILL_ON : PILL_OFF}`}
          >
            {state.electives && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />}
            Include electives
          </button>
          <button onClick={() => { if (confirm("Clear everything on screen?")) reset(); }} className={`${PILL} border-white/10 text-gray-500 hover:border-red-400/40 hover:text-white`}>Clear all entries</button>
        </div>
        <p className="-mt-4 mb-6 text-xs text-gray-500">
          4 courses (12 credits) is the normal load. 5 courses (15 credits) need a CGPA of 3.5 or higher and are only allowed from semester 6.
          {state.target === 15 && !fiveNow && cgpaOk ? ` You are planning semester ${semDone + 1}, so this plan uses 12 credits.` : ""}
        </p>
        {ready && <div className={updating ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={updating}><PlanView state={lag.view} patch={patch} skill={lag.skill} /></div>}
        <p className="mt-6 text-xs text-gray-500">
          Difficulty scores are analyst estimates from published topics, lab requirements and assessment signals. They are not official BRACU ratings.
          Prerequisites follow cse.bracu.ac.bd/course/list; always confirm in the official advising system.
        </p>
      </Section>

      <Section id="roadmap" kicker="Step 3" title="Your road to graduation">
        {ready && <div className={updating ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={updating}><Roadmap state={roadState} cgpaOk={lag.cgpaOk} startSemester={lag.startSemester} residential={lag.residential} /></div>}
      </Section>
    </div>
  );
}
