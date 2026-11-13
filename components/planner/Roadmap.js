"use client";
import { useMemo } from "react";
import { roadmap, verdict, progress, bucketOf } from "@/lib/engine";
import { COURSES, DEGREE } from "@/lib/data";
import { Tag } from "./shared";

const BUCKET_STYLE = {
  "Program core": "text-brand-300",
  "School core": "text-sky-300",
  GenEd: "text-emerald-300",
  "Program elective": "text-amber-300",
  Project: "text-fuchsia-300",
};

export default function Roadmap({ state, cgpaOk = false, startSemester = 1, residential = null }) {
  const eng = !!state.eng102First;
  const completed = useMemo(() => new Set(state.completed), [state.completed]);
  const plan = useMemo(
    () => roadmap(state.completed, 14, { targetCredits: state.target, includeElectives: state.electives, eng102First: eng, cgpaOk, startSemester, residential }),
    [state.completed, state.target, state.electives, eng, cgpaOk, startSemester, residential]
  );
  const prog = useMemo(() => progress(state.completed, COURSES, { eng102First: eng }), [state.completed, eng]);
  const left = [
    ["Program core", prog.core.total - prog.core.done],
    ["School core", prog.foundation.total - prog.foundation.done],
    ["GenEd", prog.gened.total - prog.gened.done],
    ["Program elective", prog.electives.total - prog.electives.done],
    ["Project", prog.project.total - prog.project.done],
  ];
  const projectLeft = prog.project.missing.length > 0;
  const planCredits = plan.reduce((n, s) => n + s.courses.reduce((m, c) => m + COURSES[c].credits, 0), 0) + (projectLeft ? DEGREE.project.reduce((n, c) => n + COURSES[c].credits, 0) : 0);
  let done = new Set(completed);
  return (
    <div>
      <p className="mb-2 max-w-2xl text-sm text-gray-400">
        A balanced path built from the official degree plan. Required courses and the ones that unlock the most later courses come first, semesters are kept Do-able
        (pressure 6.0 or lower) whenever a plan can still finish on time. Heavy pressure is used only when no lighter plan fits, and every semester shows its pressure score out of 10.
        It ends once all {DEGREE.totalCredits} credits are covered. Four courses a semester is the normal pace. Five are only planned from semester 6 onward
        and only with a CGPA of 3.5 or higher. CSE400 (project or thesis) takes one course slot in each of the last 3 semesters and its 4 credits count in full at the end.
      </p>
      {plan.length > 0 && (
        <p className="mb-4 text-sm text-gray-500">{plan.length} semesters left (semester {plan[0].semester} to {plan[plan.length - 1].semester}), {planCredits} credits to take.
          {plan.some((s) => s.pressure > 6) ? ` ${plan.filter((s) => s.pressure > 6).length} of them are above 6.0 because no lighter plan finishes on time.` : " Every semester is Do-able."}</p>
      )}
      <ul className="mb-6 flex flex-wrap gap-2 text-xs">
        {left.map(([name, cr]) => (
          <li key={name} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-gray-300">
            <span className={BUCKET_STYLE[name]}>{name}</span> <span className="text-gray-500">{cr > 0 ? `${cr} cr left` : "done"}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plan.map((s) => {
          const v = s.courses.length ? verdict(s.courses, done) : null;
          s.courses.forEach((c) => (done = new Set([...done, c])));
          return (
            <div key={s.semester} className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between"><h4 className="font-medium text-white">Semester {s.semester}{s.residential && <span className="ml-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 align-middle text-[10px] font-medium text-emerald-300">Residential</span>}</h4>{v && <Tag v={v} />}</div>
              <ul className="space-y-1.5 text-sm">
                {s.courses.map((c) => {
                  const b = bucketOf(c);
                  return (
                    <li key={c} className="flex gap-2">
                      <span className="w-16 shrink-0 font-mono text-xs text-brand-300">{c}</span>
                      <span className="min-w-0 flex-1 truncate text-gray-300" title={COURSES[c].name}>{COURSES[c].name}</span>
                      <span className={`shrink-0 text-[10px] ${BUCKET_STYLE[b]}`}>{b}</span>
                    </li>
                  );
                })}
                {s.project && (
                  <li className="flex gap-2 rounded-lg border border-fuchsia-400/20 bg-fuchsia-500/[0.06] px-2 py-1.5">
                    <span className="w-16 shrink-0 font-mono text-xs text-fuchsia-300">CSE400</span>
                    <span className="min-w-0 flex-1 text-gray-300">Project or thesis, part {s.project.part} of {s.project.of}</span>
                  </li>
                )}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                {v ? `pressure ${s.pressure} / 10 · ${v.load.credits} credits` : "No other courses"}
                {s.project && s.project.part !== s.project.of ? " · CSE400 in progress" : ""}
                {s.project && s.project.part === s.project.of ? " · CSE400 credited (4 cr)" : ""}
              </p>
            </div>
          );
        })}
        {!plan.length && <p className="text-sm text-gray-500">{projectLeft ? "Nothing eligible yet." : "All required credits are covered."}</p>}
      </div>
      <p className="mt-4 text-xs text-gray-500">CSE400 is not counted in the semester load index.</p>
    </div>
  );
}
