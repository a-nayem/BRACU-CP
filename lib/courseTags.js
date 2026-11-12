// Manual tags for Math, Science and GenEd courses. CSE courses are untouched.
// The workbook has no columns for these, so fill them from the faculty outline.
// true = the course has it, false = confirmed it does not, null = unknown (no tag shown).
//   a = assignment, pres = presentation, proj = project, drama = drama, mid = midterm, fin = final, lab = lab
// Codes missing from the dataset are ignored and listed in MISSING_TAG_CODES.

// Math and Science. Labs confirmed: PHY111, PHY112, MAT120. MAT110, MAT215 and MAT216 = false is still my assumption: verify.
export const MATH_SCI_TAGS = {
  MAT110: { lab: false, a: null },
  MAT120: { lab: true, a: null },
  MAT215: { lab: false, a: null },
  MAT216: { lab: false, a: null },
  PHY111: { lab: true, a: null },
  PHY112: { lab: true, a: null },
};

// GenEd. Filled in so far: POL101 mid/final, HUM101 and HUM102 mid/final (reported by you), ENG103 presentation (by title).
export const GENED_TAGS = {
  ENG101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ENG102: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ENG103: { a: null, pres: true, proj: null, drama: null, mid: null, fin: null },
  STA201: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  BIO101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CHE101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ENV103: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  MAT101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  PHY101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  STA101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  GSC110: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  BNG103: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  HUM103: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  EMB101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ANT101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  BUS102: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ECO101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  ECO102: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  POL101: { a: null, pres: null, proj: null, drama: null, mid: true, fin: true },
  PSY101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  SOC101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST201: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST204: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST301: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST302: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST303: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST304: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST305: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST306: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST307: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST308: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST309: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST310: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  HUM101: { a: null, pres: null, proj: null, drama: null, mid: true, fin: true }, // course not in dataset yet
  HUM102: { a: null, pres: null, proj: null, drama: null, mid: true, fin: true }, // course not in dataset yet
};

export const MISSING_TAG_CODES = [];

export function applyCourseTags(courses) {
  for (const code of [...Object.keys(MATH_SCI_TAGS), ...Object.keys(GENED_TAGS)])
    if (!courses[code] && !MISSING_TAG_CODES.includes(code)) MISSING_TAG_CODES.push(code);
  for (const c of Object.values(courses)) {
    if (c.group === "MATH" || c.group === "SCI") {
      const t = MATH_SCI_TAGS[c.code] || {};
      c.lab = t.lab ?? null; c.labDetail = c.lab == null ? null : c.lab ? "Lab component" : "No lab";
      c.assignment = t.a ?? null;
    } else if (c.group === "GENED") {
      const t = GENED_TAGS[c.code] || {};
      c.assignment = t.a ?? null; c.presentation = t.pres ?? null; c.project = t.proj ?? null;
      c.drama = t.drama ?? null; c.mid = t.mid ?? null; c.final = t.fin ?? null;
    }
  }
  return courses;
}

// Tags for Math, Science and GenEd cards: [label, has, tooltip]. CSE cards return [].
// A confirmed false shows as "No ..." and an unknown (null) shows nothing.
export function courseTagList(c) {
  if (c.group === "CSE") return [];
  const pairs = c.group === "GENED"
    ? [[c.assignment, "Assignment"], [c.presentation, "Presentation"], [c.project, "Project"], [c.drama, "Drama"], [c.mid, "Mid"], [c.final, "Final"]]
    : [[c.lab, "Lab"], [c.assignment, "Assignment"]];
  return pairs.filter(([v]) => v != null).map(([v, l]) => [v ? l : "No " + l.toLowerCase(), v, l === "Lab" ? c.labDetail || undefined : undefined]);
}
