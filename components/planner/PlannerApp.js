"use client";
import { useMemo } from "react";
import { usePlannerState } from "@/lib/store";
import { cgpa } from "@/lib/engine";
import CoursePicker from "./CoursePicker";
import PlanView from "./PlanView";
import Roadmap from "./Roadmap";

const Section = ({ id, kicker, title, children }) => (
  <section id={id} className="scroll-mt-24 py-16">
    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-brand-300">{kicker}</p>
    <h2 className="mb-8 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
    {children}
  </section>
);

export default function PlannerApp() {
  const { state, patch, reset, ready } = usePlannerState();
  const skill = useMemo(() => {
    const g = cgpa(state.completed.filter((c) => state.grades[c]).map((c) => ({ code: c, grade: state.grades[c] })));
    return g.credits ? (g.cgpa - 3.0) * 0.3 : 0;
  }, [state.completed, state.grades]);

  return (
    <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-28 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]" style={{ background: "radial-gradient(60% 60% at 20% 0%, rgba(40,88,168,0.25), transparent 70%)" }} />
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Your course planner</h1>
        <p className="mt-4 text-lg font-light text-gray-400">
          Tell us what you have finished, then compare four ways to build your next semester. Swap any course and the load and warnings update instantly.
          Everything stays in this browser.
        </p>
      </header>

      <Section id="cgpa" kicker="Step 1" title="What have you completed?">
        <CoursePicker state={state} patch={patch} />
      </Section>

      <Section id="plan" kicker="Step 2" title="Choose a plan for next semester">
        <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Credits</span>
            {[9, 12, 15].map((n) => (
              <button key={n} onClick={() => patch({ target: n, edits: {} })} className={`rounded-full border px-3 py-1 ${state.target === n ? "border-brand-400 bg-brand-500/25 text-white" : "border-white/10 text-gray-400 hover:text-white"}`}>{n}</button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={state.electives} onChange={(e) => patch({ electives: e.target.checked, edits: {} })} className="h-4 w-4 accent-[#2858a8]" />
            Include electives
          </label>
          <button onClick={() => { if (confirm("Clear everything saved in this browser?")) reset(); }} className="text-gray-500 underline-offset-2 hover:text-white hover:underline">Clear saved data</button>
        </div>
        {ready && <PlanView state={state} patch={patch} skill={skill} />}
        <p className="mt-6 text-xs text-gray-500">
          Difficulty scores are analyst estimates from published topics, lab requirements and assessment signals. They are not official BRACU ratings.
          Prerequisites follow cse.bracu.ac.bd/course/list; always confirm in the official advising system.
        </p>
      </Section>

      <Section id="roadmap" kicker="Step 3" title="Your road to graduation">
        {ready && <Roadmap state={state} />}
      </Section>
    </div>
  );
}
