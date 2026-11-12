// Manual course tags for Math, Science and GenEd courses. CSE courses are untouched.
// The workbook has no lab, exam, drama or presentation columns for these groups, so they live here.
// Codes that do not exist in COURSES are ignored, and MISSING_TAG_CODES lists them.
//   true = has it, false = confirmed it does not, absent = unknown (no tag shown)

// Lab: Math and Science only. VERIFY the PHY labs against your section outline.
export const MANUAL_LAB = { MAT110: false, MAT120: false, MAT215: false, MAT216: false, PHY111: true, PHY112: true };

// Exams (GenEd): add a code here when a course gains or drops a midterm or final.
export const MANUAL_EXAMS = {
  POL101: { mid: true, final: true },
  HUM101: { mid: true, final: true }, // not in lib/courses.generated.js yet
  HUM102: { mid: true, final: true }, // not in lib/courses.generated.js yet
};

// Presentation and drama (GenEd). ENG103 is a presentation course by title. Add drama codes as you confirm them.
export const MANUAL_PRESENTATION = { ENG103: true };
export const MANUAL_DRAMA = {};

export const MISSING_TAG_CODES = [];

export function applyCourseTags(courses) {
  const all = new Set([...Object.keys(MANUAL_LAB), ...Object.keys(MANUAL_EXAMS), ...Object.keys(MANUAL_PRESENTATION), ...Object.keys(MANUAL_DRAMA)]);
  for (const code of all) if (!courses[code]) MISSING_TAG_CODES.push(code);

  for (const c of Object.values(courses)) {
    if (c.group === "CSE") continue;
    const gened = c.group === "GENED";
    if (c.group === "MATH" || c.group === "SCI") {
      if (c.code in MANUAL_LAB) { c.lab = MANUAL_LAB[c.code]; c.labDetail = c.lab ? "Lab component" : "No lab"; }
    }
    c.assignmentScore = c.scores?.assignment ?? null;
    if (gened) {
      const ex = MANUAL_EXAMS[c.code];
      c.mid = ex ? ex.mid : null;
      c.final = ex ? ex.final : null;
      c.presentation = c.code in MANUAL_PRESENTATION ? MANUAL_PRESENTATION[c.code] : null;
      c.drama = c.code in MANUAL_DRAMA ? MANUAL_DRAMA[c.code] : null;
    }
  }
  return courses;
}

// Tag list shown on Math, Science and GenEd cards: [label, highlighted, tooltip]. CSE cards return [].
export function courseTagList(c) {
  if (c.group === "CSE") return [];
  const t = [];
  if ((c.group === "MATH" || c.group === "SCI") && c.lab != null) t.push([c.lab ? "Lab" : "No lab", c.lab, c.labDetail || undefined]);
  if (c.assignmentScore != null) t.push([`Assignments ${c.assignmentScore}/10`, c.assignmentScore >= 6, "Estimated assignment load (1 to 10), not an official rating"]);
  if (c.group === "GENED") {
    if (c.presentation) t.push(["Presentation", true]);
    if (c.drama) t.push(["Drama", true]);
    if (c.mid) t.push(["Mid", true]);
    if (c.final) t.push(["Final", true]);
    if (c.mid === false && c.final === false) t.push(["No mid or final", false]);
  }
  return t;
}
