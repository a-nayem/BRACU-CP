import { COURSES, SCORE_WEIGHTS } from "./courses.generated.js";
import { applyCourseTags } from "./courseTags.js";
export { COURSES, SCORE_WEIGHTS };

// Adds the Math, Science and GenEd tags (lab, assignment, presentation, mid, final...) used on the picker and panel cards.
applyCourseTags(COURSES);

// ---- Degree configuration (EDIT to match your cohort's degree plan) ----
export const DEGREE = {
  totalCredits: 136,
  // Official CSE plan: GenEd 39 + School core 12 + Program core 75 + Program elective 6 + CSE400 4 = 136
  coreCSE: Object.values(COURSES).filter(c => c.category === "core").map(c => c.code),
  project: ["CSE400"], // 4 credits, taken over the last 3 semesters as a project or a thesis, credited in full at the end
  schoolCore: ["MAT120", "MAT215", "MAT216", "PHY112"],
  foundation: ["MAT120", "MAT215", "MAT216", "PHY112"], // same list, kept for older code
  programElectiveCredits: 6,
  // GenEd (Fall 2020 onward): 39 credits = 11 required courses + 2 GenEd electives
  gened: {
    credits: 39,
    // MAT110 and PHY111 are GenEd stream 2 courses in the official plan, although they also show under Math and science
    streamOf: { MAT110: 2, PHY111: 2 },
    streams: {
      1: { need: 2, fixed: ["ENG102"], label: "English (ENG102 plus ENG101, or ENG103 if you started with ENG102)" },
      2: { need: 3, fixed: ["MAT110", "PHY111", "STA201"], label: "Math and natural sciences (MAT110, PHY111, STA201)" },
      3: { need: 3, fixed: ["BNG103", "HUM103"], label: "Arts and humanities (BNG103, HUM103 and one from the list)" },
      4: { need: 2, fixed: ["EMB101"], label: "Social science (EMB101 and one from the list)" },
      5: { need: 1, label: "CST (one from the list)" },
    },
    electives: 2,
  },
  // Not part of the CSE degree
  hidden: ["CSE101"],
  // Assumption (not from BRACU): earned credits needed before CSE400 is suggested as a normal course.
  projectMinCredits: 100,
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
