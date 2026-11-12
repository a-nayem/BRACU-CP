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

export const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
export const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"];
