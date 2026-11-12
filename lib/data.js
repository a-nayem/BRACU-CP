import { COURSES, SCORE_WEIGHTS } from "./courses.generated.js";
export { COURSES, SCORE_WEIGHTS };

// ---- Degree configuration (EDIT to match your cohort's degree plan) ----
export const DEGREE = {
  totalCredits: 136,
  coreCSE: Object.values(COURSES).filter(c => c.category === "core").map(c => c.code),
  project: ["CSE400"],
  // Math/science foundation. Sample-plan assumption from the workbook: verify against your cohort.
  foundation: ["MAT110", "MAT120", "MAT215", "MAT216", "PHY111", "PHY112"],
  // GenEd (Fall 2020 onward): 39 credits / 13 courses, 5 streams
  gened: {
    credits: 39,
    streams: {
      1: { need: 2, label: "English (any two ENG)" },
      2: { need: 2, label: "Science and Math (min two)" },
      3: { need: 3, fixed: ["BNG103", "HUM103"], label: "Arts and Humanities (BNG103, HUM103 + one more)" },
      4: { need: 2, fixed: ["EMB101"], label: "Social Science (EMB101 + one more)" },
      5: { need: 1, label: "CST (at least one)" },
    },
    freeElectives: 3,
  },
  // ASSUMPTION (not from BRACU): senior-standing gate used only when suggesting CSE400. Edit to your policy.
  projectMinCredits: 100,
  // Credits not covered above are treated as CSE elective / free credits (computed, not assumed).
};

// Semester load bands from the workbook's Scoring & Method sheet (planning heuristics)
export const BANDS = [
  { max: 3.0, label: "Light" },
  { max: 4.5, label: "Manageable" },
  { max: 6.0, label: "Moderate-heavy" },
  { max: 7.5, label: "Heavy" },
  { max: 9.0, label: "Very heavy" },
  { max: 10.01, label: "Extreme" },
];

// ASSUMPTION (not official): typical sequencing of foundation courses, used only to order suggestions.
// The official list shows no prerequisites for these, so validation never blocks on them.
export const ADVISORY_CHAINS = [
  ["MAT110", "MAT120", "MAT215", "MAT216"],
  ["PHY111", "PHY112"],
  ["ENG101", "ENG102"],
];
for (const chain of ADVISORY_CHAINS)
  for (let i = 1; i < chain.length; i++) if (COURSES[chain[i]]) COURSES[chain[i]].advisory = [chain[i - 1]];
