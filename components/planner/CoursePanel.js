"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X, Check } from "lucide-react";
import { COURSES } from "@/lib/data";
import { courseStatus, prereqStatus } from "@/lib/engine";
import { Tag, HP_STYLE, SP_STYLE, NEUTRAL_TAG, STATUS_STYLE, COURSE_TAG_ON, COURSE_TAG_OFF, CourseTags } from "./shared";

const FILTERS = [
  ["all", "All"], ["eligible", "Eligible"], ["core", "CSE core"], ["foundation", "Math and science"], ["gened", "GenEd"], ["elective", "Electives"],
];
const STATUS_LABEL = { completed: "Completed", eligible: "Eligible", blocked: "Blocked", inPlan: "In your plan" };

// Lab, Project and Assignment-heavy tags for CSE cards, read from the workbook note and scores. [label, on, tooltip]
const LAB_YES = ["weekly", "alternate", "3-hour", "lab listed", "lab/", "practical/lab", "indicated"];
function cseTags(c) {
  if (c.group !== "CSE") return [];
  const t = (c.labNote || "").toLowerCase();
  const lab = c.lab ?? (/no lab|lab not/.test(t) ? false : LAB_YES.some((k) => t.includes(k)) ? true : (c.scores?.lab ?? 0) >= 6);
  const project = c.project ?? (/project|research/.test(t) ? true : null);
  const heavy = c.assignmentHeavy ?? (c.scores?.assignment ?? 0) >= 8;
  const out = [[lab ? "Lab" : "No lab", lab, c.labNote || undefined]];
  if (project != null) out.push([project ? "Project" : "No project", project]);
  if (heavy) out.push(["Assignment-heavy", true, "Assignment and project intensity score of 8 or more"]);
  return out;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Right-side panel for the Swap and "+ Add a course" actions in the plan view.
// Props:
//   mode "swap" | "add", code (the course being swapped, swap mode only)
//   plan (course codes in the current plan), verdict (verdict() of that plan), baseline ({ index, credits } when the panel opened)
//   strategyLabel, completed (Set), includeElectives, hidden (Set of codes not offered, e.g. from hiddenCodes())
//   onChange(codes) saves the new plan, onClose()
export default function CoursePanel({ mode, code, plan, verdict, baseline, strategyLabel, completed, includeElectives, hidden, onChange, onClose }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");
  const [current, setCurrent] = useState(code); // swap mode: the course that currently fills the swapped slot
  const [closing, setClosing] = useState(false);
  const ref = useRef(null);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, reducedMotion() ? 0 : 200);
  };

  // Escape closes. Focus moves into the panel on open and returns to the trigger on close.
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") requestClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trapTab = (e) => {
    if (e.key !== "Tab") return;
    const els = [...ref.current.querySelectorAll("button:not([disabled]), input, [href], [tabindex]:not([tabindex='-1'])")].filter((el) => el.offsetParent !== null);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  // Stable order: eligible first, then blocked, then completed. It uses completed courses only, so tapping a card never moves it.
  const courses = useMemo(() => {
    const rank = (c) => (completed.has(c.code) ? 2 : prereqStatus(c.code, completed, []).ok ? 0 : 1);
    return Object.values(COURSES)
      .filter((c) => includeElectives || c.category !== "elective")
      .filter((c) => !hidden?.has(c.code))
      .map((c) => ({ c, rank: rank(c) }))
      .sort((a, b) => a.rank - b.rank || a.c.code.localeCompare(b.c.code));
  }, [completed, includeElectives, hidden]);

  const inFilter = ({ c, rank }) =>
    f === "all" ? true : f === "eligible" ? rank === 0 : f === "core" ? c.category === "core" || c.category === "project"
    : f === "foundation" ? c.group === "MATH" || c.group === "SCI" : f === "gened" ? c.group === "GENED" : c.category === "elective";
  const needle = q.trim().toLowerCase();
  const list = courses.filter((x) => inFilter(x) && (!needle || (x.c.code + " " + x.c.name).toLowerCase().includes(needle)));

  const pick = (target) => {
    const st = courseStatus(target, completed, plan);
    if (st.state === "completed") return;
    if (mode === "add") {
      onChange(st.inPlan ? plan.filter((x) => x !== target) : [...plan, target]);
      return;
    }
    // Swap: one slot only. Tapping another card changes the replacement; courses already in the plan cannot be duplicated.
    if (target === current || st.inPlan) return;
    onChange(plan.map((x) => (x === current ? target : x)));
    setCurrent(target);
  };

  const delta = +(verdict.load.index - baseline.index).toFixed(2);
  const deltaColor = delta > 0 ? "text-amber-300" : delta < 0 ? "text-emerald-300" : "text-slate-400";
  const title = mode === "swap" ? `Swap ${code}` : "Add courses";

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className={`backdrop-in absolute inset-0 bg-black/40 ${closing ? "out" : ""}`} onClick={requestClose} aria-hidden="true" />
      <aside
        ref={ref} role="dialog" aria-label={title} tabIndex={-1} onKeyDown={trapTab}
        className={`side-panel ${closing ? "out" : ""} absolute inset-y-0 right-0 flex w-full flex-col border-l border-white/10 bg-panel shadow-2xl outline-none sm:w-[34rem] min-[1440px]:w-[36rem]`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400">{strategyLabel} plan{mode === "swap" ? ". Pick a replacement, tap again to change it." : ". Tap cards to add or remove them."}</p>
          </div>
          <button onClick={requestClose} aria-label="Close panel" className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-white/10 bg-sunken px-5 py-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Load index</p>
              <p className="text-xl font-semibold text-white">
                {baseline.index} <span className="text-sm font-normal text-slate-400">to</span> {verdict.load.index}
                {delta !== 0 && <span className={`ml-2 text-xs font-medium ${deltaColor}`}>{delta > 0 ? "+" : ""}{delta}</span>}
              </p>
            </div>
            <Tag v={verdict} />
            <p className="ml-auto text-sm text-slate-300">
              {verdict.load.credits} cr
              {verdict.load.credits !== baseline.credits && <span className="text-xs text-slate-500"> (was {baseline.credits})</span>}
              <span className="block text-xs text-slate-500">{plan.length} course{plan.length === 1 ? "" : "s"}</span>
            </p>
          </div>
          {(verdict.hardMissing.length > 0 || verdict.clash.length > 0) && (
            <p className="mt-2 text-xs text-red-300">
              {verdict.hardMissing.length > 0 && `Blocked: ${verdict.hardMissing.map((h) => `${h.code} needs ${h.missing.join(", ")}`).join("; ")}. `}
              {verdict.clash.length > 0 && "Section clash in your plan."}
            </p>
          )}
        </div>

        <div className="space-y-3 border-b border-white/10 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a code or name, e.g. CSE221" aria-label="Search courses"
              className="w-full rounded-xl border border-white/10 bg-sunken-2 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.filter(([k]) => k !== "elective" || includeElectives).map(([k, l]) => (
              <button key={k} onClick={() => setF(k)} aria-pressed={f === k}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${f === k ? "border-brand-400 bg-brand-500/20 text-white" : "border-white/10 text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
        </div>

        <ul className="scroll-thin grid min-h-0 flex-1 grid-cols-1 content-start gap-3 overflow-y-auto overscroll-contain px-5 py-4 sm:grid-cols-2">
          {list.map(({ c }) => {
            const st = courseStatus(c.code, completed, plan);
            const selected = mode === "swap" ? c.code === current : st.inPlan;
            const locked = st.state === "completed" || (mode === "swap" && st.inPlan && c.code !== current);
            const badges = [];
            if (st.inPlan) badges.push("inPlan");
            if (st.state === "completed") badges.push("completed");
            if (st.state === "blocked") badges.push("blocked");
            if (st.state === "eligible" && !st.inPlan) badges.push("eligible");
            const hard = c.hard || [], soft = c.soft || [];
            return (
              <li key={c.code}>
                <button
                  type="button" onClick={() => pick(c.code)} aria-pressed={selected} aria-disabled={locked}
                  aria-label={`${c.code} ${c.name}, ${badges.map((b) => STATUS_LABEL[b]).join(", ")}`}
                  className={`flex h-full w-full flex-col rounded-2xl border p-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    selected ? "border-brand-400 bg-brand-500/10 ring-1 ring-brand-400/60" : "border-white/10 bg-sunken hover:border-brand-400/40"
                  } ${locked ? "cursor-not-allowed opacity-50" : st.state === "blocked" && !selected ? "opacity-80" : ""}`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-brand-300">{c.code}</span>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-400 bg-brand-500 text-white" : "border-white/20 text-transparent"}`} aria-hidden="true">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-slate-200">{c.name}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-300" title="Estimated difficulty (1 to 10), not an official rating">
                    {c.credits} cr &middot; difficulty {c.difficulty.toFixed(1)}
                  </span>

                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {hard.map((h) => <span key={"h" + h} className={HP_STYLE}>HP: {h}</span>)}
                    {soft.map((s) => <span key={"s" + s} className={SP_STYLE}>SP: {s}</span>)}
                    {!hard.length && !soft.length && <span className={NEUTRAL_TAG}>No prerequisite</span>}
                  </span>

                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {badges.map((b) => (
                      <span key={b} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[b]}`}>{STATUS_LABEL[b]}</span>
                    ))}
                  </span>
                  {st.state === "blocked" && <span className="mt-1.5 block text-[11px] text-red-300">needs {st.missingHard.join(", ")}</span>}

                  <span className="mt-auto flex flex-wrap gap-1.5 pt-2.5">
                    <CourseTags c={c} className="contents" />
                    {cseTags(c).map(([label, on, title]) => <span key={label} className={on ? COURSE_TAG_ON : COURSE_TAG_OFF} title={title}>{label}</span>)}
                  </span>
                </button>
              </li>
            );
          })}
          {!list.length && <li className="col-span-full p-6 text-center text-sm text-slate-500">No courses match.</li>}
        </ul>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
          <p className="text-xs text-slate-500">Changes save as you tap.</p>
          <button onClick={requestClose} className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-on-brand hover:bg-brand-600">Done</button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
