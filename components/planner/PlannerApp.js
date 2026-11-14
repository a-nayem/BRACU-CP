"use client";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { usePlannerState } from "@/lib/store";
import { cgpa, progress } from "@/lib/engine";
import { COURSES } from "@/lib/data";
import CoursePicker from "./CoursePicker";
import PlanView from "./PlanView";
import Roadmap from "./Roadmap";

// Pill buttons for the Step 2 controls. On state uses the same sky blue tint as the filter chips in the course panel.
const PILL = "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";
const PILL_ON = "border-brand-400 bg-brand-500/25 text-white";
const PILL_OFF = "border-white/10 text-gray-400 hover:border-brand-400/50 hover:text-white";

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
  const { state, patch, reset, ready } = usePlannerState();
  const g = useMemo(() => cgpa(state.completed.filter((c) => state.grades[c]).map((c) => ({ code: c, grade: state.grades[c] }))), [state.completed, state.grades]);
  const skill = g.credits ? (g.cgpa - 3.0) * 0.3 : 0;
  // A failed (F) course is not completed: it stays on the plan as a retake. Everything below Step 1 works from the passed courses only.
  const passed = useMemo(() => state.completed.filter((c) => state.grades[c] !== "F"), [state.completed, state.grades]);
  // The semester the student picked wins. Without a pick, finished semesters are estimated at 12 credits each. Five courses need CGPA 3.5+ and are allowed from semester 6.
  const semDone = useMemo(() => (state.semester ? state.semester - 1 : Math.round(progress(passed, COURSES, { eng102First: !!state.eng102First }).earned / 12)), [state.semester, passed, state.eng102First]);
  const cgpaOk = g.credits > 0 && g.cgpa >= 3.5;
  const fiveNow = cgpaOk && semDone + 1 > 5;
  // The residential semester is the 3rd unless the student picked the 4th or 5th.
  const resSem = state.residential || 3;
  const residentialNow = semDone + 1 === resSem;
  const residentialPending = semDone + 1 < resSem;
  const view = { ...state, completed: passed, residentialNow, residentialPending, ...(state.target === 15 && !fiveNow ? { target: 12 } : {}) };

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-12">
      <div className="planner-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]" />
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Your course planner</h1>
        <p className="mt-4 text-lg font-light text-gray-400">
          Tell us what you have finished, then compare four ways to build your next semester. Swap any course and the load and warnings update instantly.
          Everything stays in this browser.
        </p>
      </header>

      <Section id="cgpa" kicker="Step 1" title="What have you completed?">
        <SemesterMenu state={state} patch={patch} />
        <CoursePicker state={state} patch={patch} />
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
          <button onClick={() => { if (confirm("Clear everything saved in this browser?")) reset(); }} className={`${PILL} border-white/10 text-gray-500 hover:border-red-400/40 hover:text-white`}>Clear saved data</button>
        </div>
        <p className="-mt-4 mb-6 text-xs text-gray-500">
          4 courses (12 credits) is the normal load. 5 courses (15 credits) need a CGPA of 3.5 or higher and are only allowed from semester 6.
          {state.target === 15 && !fiveNow && cgpaOk ? ` You are planning semester ${semDone + 1}, so this plan uses 12 credits.` : ""}
        </p>
        {ready && <PlanView state={view} patch={patch} skill={skill} />}
        <p className="mt-6 text-xs text-gray-500">
          Difficulty scores are analyst estimates from published topics, lab requirements and assessment signals. They are not official BRACU ratings.
          Prerequisites follow cse.bracu.ac.bd/course/list; always confirm in the official advising system.
        </p>
      </Section>

      <Section id="roadmap" kicker="Step 3" title="Your road to graduation">
        {ready && <Roadmap state={{ ...view, ...(state.target === 15 && !cgpaOk ? { target: 12 } : { target: state.target }) }} cgpaOk={cgpaOk} startSemester={semDone + 1} residential={resSem} />}
      </Section>
    </div>
  );
}
