"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Leaf, Flame, Target, Dices, X, Plus, ArrowLeftRight, AlertTriangle, AlertCircle, RotateCcw, Clock } from "lucide-react";
import { COURSES } from "@/lib/data";
import { planStrategies, verdict, unlockStats, prereqStatus, expectedGP, STRATEGIES } from "@/lib/engine";
import { Tag, TAG_BAR, DAYS } from "./shared";
import CoursePanel from "./CoursePanel";

const META = {
  sustainable: {
    Icon: Leaf, key: "sustainable",
    note: "Keeps the semester under a 6.0 load so labs and assignments never pile up. Required courses and ones that unlock later courses still come first.",
    words: ["steady pace", "low burnout", "load up to 6.0", "time for labs"],
  },
  heavy: {
    Icon: Flame, key: "heavy",
    note: "Adds an extra course and accepts a load up to 9.0 to clear required courses fastest. Expect overlapping labs and exams and very little slack.",
    words: ["fast track", "most credits", "high load", "little slack"],
  },
  cg: {
    Icon: Target, key: "cg",
    note: "Picks courses where a strong grade is most likely, using the difficulty estimates shifted by your CGPA. Required courses get a bonus so progress does not stall. The grade outlook is an estimate, not a promise.",
    words: ["protect CGPA", "safer picks", "expected grade", "steady progress"],
  },
  risky: {
    Icon: Dices, key: "risky",
    note: "Bets on hard, high-unlock courses now so later semesters open up. Worth it only if you are comfortable with a very heavy load.",
    words: ["high payoff", "unlocks many courses", "hard courses early", "load up to 9.5"],
  },
};
const ORDER = ["sustainable", "cg", "heavy", "risky"];

export default function PlanView({ state, patch, skill }) {
  const [active, setActive] = useState("sustainable");
  const [showSlots, setShowSlots] = useState(false);
  const [panel, setPanel] = useState(null); // { mode: "swap" | "add", code, baseline } while the side panel is open
  const completed = useMemo(() => new Set(state.completed), [state.completed]);
  const stats = useMemo(() => unlockStats(), []);

  const suggested = useMemo(
    () => planStrategies({ completed, targetCredits: state.target, includeElectives: state.electives, skill }),
    [completed, state.target, state.electives, skill]
  );
  const planOf = (k) => state.edits[k] ?? suggested[k] ?? [];
  const info = useMemo(() => {
    const o = {};
    for (const k of ORDER) {
      const codes = planOf(k);
      o[k] = { codes, v: verdict(codes, completed, state.slots), unlocks: codes.reduce((s, c) => s + stats[c].unlocks, 0) };
    }
    return o;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested, state.edits, state.slots, completed]);

  const setPlan = (k, codes) => patch((s) => ({ edits: { ...s.edits, [k]: codes } }));
  const reset = (k) => patch((s) => { const e = { ...s.edits }; delete e[k]; return { edits: e }; });

  const cur = info[active];
  const edited = state.edits[active] !== undefined;
  const meta = META[active];

  // The side panel remembers the load when it opened, so its summary can show the change ("6.1 to 6.8").
  const openPanel = (mode, code) => setPanel({ mode, code, baseline: { index: cur.v.load.index, credits: cur.v.load.credits } });

  const slotOf = (code) => state.slots[code]?.[0] || { days: [], start: "", end: "" };
  const setSlot = (code, p) =>
    patch((s) => {
      const next = { ...slotOf(code), ...p };
      const slots = { ...s.slots };
      if (!next.days.length || !next.start || !next.end) delete slots[code]; else slots[code] = [next];
      // keep partially filled values visible by stashing them separately
      return { slots, draft: { ...(s.draft || {}), [code]: next } };
    });
  const draftOf = (code) => state.draft?.[code] || slotOf(code);

  return (
    <div className={`plan-shift grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 ${panel ? "panel-open" : ""}`}>
      {/* Left: accordion */}
      <div className="min-w-0">
        <ul className="space-y-3">
          {ORDER.map((k) => {
            const m = META[k], on = k === active, r = info[k];
            return (
              <li key={k} className={`rounded-2xl border transition-colors ${on ? "border-brand-400/40 bg-brand-500/[0.07]" : "border-white/5 bg-white/[0.02]"}`}>
                <button onClick={() => setActive(k)} aria-expanded={on} className="flex w-full items-center gap-4 p-4 text-left">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? "bg-brand-500/15 text-brand-300" : "bg-white/5 text-gray-400"}`}>
                    <m.Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className={`block text-base font-medium ${on ? "text-brand-300" : "text-gray-300"}`}>{STRATEGIES[k].label}</span>
                    <span className="mt-1 flex items-center gap-2"><Tag v={r.v} /><span className="text-xs text-gray-500">load {r.v.load.index} · {r.v.load.credits} cr</span></span>
                  </span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${on ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                <div className={`acc-body ${on ? "open" : ""}`}>
                  <div>
                    <div className="px-4 pb-5 pl-[4.75rem]">
                      <p className="text-sm leading-relaxed text-gray-400">{m.note}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.words.map((w) => <span key={w} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-gray-300">{w}</span>)}
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        Now: {r.codes.length} courses, load {r.v.load.index} ({r.v.load.band}), unlocks {r.unlocks} later course links.
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: visual panel */}
      <div className="grid-bg relative min-w-0 overflow-hidden rounded-[2rem] border border-white/5 p-4 sm:p-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/40 blur-[120px]" />
        <div className="glass-panel relative rounded-2xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-xs text-gray-400">plan_{active}.v1{edited ? " (edited)" : ""}</span>
          </div>

          <div key={active} className="panel-in space-y-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><Tag v={cur.v} className="mb-1" /><h3 className="text-lg font-medium text-white">{STRATEGIES[active].label}</h3></div>
              <div className="text-right"><p className="text-3xl font-semibold text-white">{cur.v.load.index}</p><p className="text-xs text-gray-500">load index · {cur.v.load.band}</p></div>
            </div>

            <div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, cur.v.load.index * 10)}%`, background: TAG_BAR[cur.v.key] }} />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-gray-600"><span>Light</span><span>6.0</span><span>7.5</span><span>9.0</span><span>Extreme</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[["Credits", cur.v.load.credits], ["Avg difficulty", cur.v.load.avg], ["High intensity", cur.v.load.counts.high]].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-white/5 bg-sunken p-3"><p className="text-lg font-semibold text-white">{v}</p><p className="text-[11px] text-gray-500">{l}</p></div>
              ))}
            </div>

            {active === "cg" && cur.codes.length > 0 && (
              <p className="rounded-xl border border-white/5 bg-sunken p-3 text-sm text-gray-300">
                Expected semester GPA: <span className="font-semibold text-white">{(cur.codes.reduce((s, c) => s + expectedGP(c, skill), 0) / cur.codes.length).toFixed(2)}</span>
                <span className="text-gray-500"> (estimate from difficulty{skill ? " and your CGPA" : ""})</span>
              </p>
            )}

            <ul className="space-y-2">
              {cur.codes.map((code) => {
                const c = COURSES[code], st = prereqStatus(code, completed, cur.codes);
                return (
                  <li key={code} className="rounded-xl border border-white/5 bg-sunken p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-16 shrink-0 font-mono text-xs text-brand-300">{code}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-200" title={c.name}>{c.name}</span>
                      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-white/10 sm:block"><span className="block h-full bg-brand-400" style={{ width: `${c.difficulty * 10}%` }} /></span>
                      <span className="w-8 text-right text-xs text-gray-400">{c.difficulty.toFixed(1)}</span>
                      <button
                        onClick={() => openPanel("swap", code)} aria-label={`Swap ${code}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-panel px-2 py-1 text-xs text-gray-300 hover:border-brand-400/50 hover:text-white"
                      >
                        <ArrowLeftRight className="h-3 w-3" aria-hidden="true" /> Swap
                      </button>
                      <button onClick={() => setPlan(active, cur.codes.filter((x) => x !== code))} aria-label={`Remove ${code}`} className="text-gray-500 hover:text-red-300"><X className="h-4 w-4" /></button>
                    </div>
                    {(!st.ok || st.missingSoft.length > 0) && (
                      <p className={`mt-2 flex items-center gap-1.5 text-xs ${st.ok ? "text-amber-300" : "text-red-300"}`}>
                        {st.ok ? <AlertTriangle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        {!st.ok ? `Needs ${st.missingHard.join(", ")} first` : `Recommended before: ${st.missingSoft.join(", ")}`}
                      </p>
                    )}
                  </li>
                );
              })}
              {!cur.codes.length && <li className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-gray-500">No eligible courses. Mark more courses as completed or add one below.</li>}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openPanel("add")}
                className="inline-flex min-w-0 max-w-full flex-1 items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-transparent px-3 py-2 text-left text-sm text-gray-300 hover:border-brand-400/60 hover:text-white"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" /> Add a course
              </button>
              {edited && (
                <button onClick={() => reset(active)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                  <RotateCcw className="h-4 w-4" /> Reset to suggestion
                </button>
              )}
            </div>

            {(cur.v.clash.length > 0 || cur.v.hardMissing.length > 0) && (
              <div className="space-y-1.5 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                {cur.v.hardMissing.map((h) => <p key={h.code}>{h.code} is blocked: complete {h.missing.join(", ")} first.</p>)}
                {cur.v.clash.map(([a, b]) => <p key={a + b}>Section clash: {a} overlaps {b}.</p>)}
              </div>
            )}

            <div>
              <button onClick={() => setShowSlots((s) => !s)} className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-white">
                <Clock className="h-4 w-4" /> {showSlots ? "Hide" : "Check"} section times <span className="text-xs text-gray-500">(optional, you enter them)</span>
              </button>
              {showSlots && (
                <ul className="mt-3 space-y-2">
                  {cur.codes.map((code) => {
                    const sl = draftOf(code);
                    return (
                      <li key={code} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-sunken p-2.5 text-xs">
                        <span className="w-16 font-mono text-brand-300">{code}</span>
                        {DAYS.map((d) => (
                          <button key={d} onClick={() => setSlot(code, { days: sl.days.includes(d) ? sl.days.filter((x) => x !== d) : [...sl.days, d] })}
                            className={`rounded-md border px-1.5 py-0.5 ${sl.days.includes(d) ? "border-brand-400 bg-brand-500/30 text-white" : "border-white/10 text-gray-400"}`}>{d}</button>
                        ))}
                        <input type="time" value={sl.start} onChange={(e) => setSlot(code, { start: e.target.value })} aria-label={`${code} start`} className="rounded-md border border-white/10 bg-panel px-1.5 py-0.5 text-gray-200" />
                        <span className="text-gray-500">to</span>
                        <input type="time" value={sl.end} onChange={(e) => setSlot(code, { end: e.target.value })} aria-label={`${code} end`} className="rounded-md border border-white/10 bg-panel px-1.5 py-0.5 text-gray-200" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {panel && (
        <CoursePanel
          mode={panel.mode} code={panel.code} baseline={panel.baseline}
          plan={cur.codes} verdict={cur.v} strategyLabel={STRATEGIES[active].label}
          completed={completed} includeElectives={state.electives}
          onChange={(codes) => setPlan(active, codes)} onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}
