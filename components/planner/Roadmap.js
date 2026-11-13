"use client";
import { useMemo } from "react";
import { roadmap, verdict } from "@/lib/engine";
import { COURSES } from "@/lib/data";
import { Tag } from "./shared";

export default function Roadmap({ state }) {
  const completed = useMemo(() => new Set(state.completed), [state.completed]);
  const plan = useMemo(
    () => roadmap(state.completed, 14, { targetCredits: state.target, maxLoad: 7.0, includeElectives: state.electives }),
    [state.completed, state.target, state.electives]
  );
  let done = new Set(completed);
  return (
    <div>
      <p className="mb-2 max-w-2xl text-sm text-gray-400">
        A balanced path, one semester at a time: required courses and the ones that unlock the most later courses come first, with the load kept near 7.0 or
        below. It ends once all 136 credits are covered: one CST course, only the other GenEd the degree needs, and the elective credits that remain.
      </p>
      {plan.length > 0 && (
        <p className="mb-6 text-sm text-gray-500">{plan.length} semesters left, {plan.reduce((n, s) => n + s.courses.length * 3, 0)} credits to take.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plan.map((s) => {
          const v = verdict(s.courses, done);
          s.courses.forEach((c) => (done = new Set([...done, c])));
          return (
            <div key={s.semester} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between"><h4 className="font-medium text-white">Semester {s.semester}</h4><Tag v={v} /></div>
              <ul className="space-y-1.5 text-sm">
                {s.courses.map((c) => (
                  <li key={c} className="flex gap-2"><span className="w-16 shrink-0 font-mono text-xs text-brand-300">{c}</span><span className="min-w-0 truncate text-gray-300">{COURSES[c].name}</span></li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">load {v.load.index} · {v.load.credits} credits</p>
            </div>
          );
        })}
        {!plan.length && <p className="text-sm text-gray-500">Nothing eligible yet.</p>}
      </div>
    </div>
  );
}
