export const TAG_STYLE = {
  doable: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  heavy: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  edge: "bg-orange-500/10 text-orange-300 border-orange-400/30",
  no: "bg-red-500/10 text-red-300 border-red-400/30",
};
export const TAG_BAR = { doable: "#34d399", heavy: "#fbbf24", edge: "#fb923c", no: "#f87171" };

export function Tag({ v, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TAG_STYLE[v.key]} ${className}`}>
      {v.label}
    </span>
  );
}

// Prerequisite tags, same look as Step 1 (red HP for hard, blue SP for soft).
export const HP_STYLE = "rounded-md border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-300";
export const SP_STYLE = "rounded-md border border-brand-400/30 bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-300";
export const NEUTRAL_TAG = "rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400";

// Course status badges and course tags for the Swap and Add panel cards.
export const STATUS_STYLE = {
  completed: "border-white/10 bg-white/5 text-slate-400",
  eligible: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  blocked: "border-red-400/30 bg-red-500/10 text-red-300",
  inPlan: "border-brand-400/40 bg-brand-500/15 text-brand-300",
};
export const COURSE_TAG_ON = "rounded-md border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300";
export const COURSE_TAG_OFF = "rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-400";

export const DAYS =["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
export const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
