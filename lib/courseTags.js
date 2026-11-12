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

// GenEd. Researched from public BRACU course outlines (year in each comment). Outlines vary by faculty, section and semester,
// so treat these as the latest outline found and correct any that differ in your section. null = nothing found.
export const GENED_TAGS = {
  ENG101: { a: true, pres: true, proj: null, drama: null, mid: true, fin: true }, // Fall 2023 outline plus buX outline
  ENG102: { a: null, pres: true, proj: null, drama: null, mid: true, fin: true }, // GenEd curriculum (class presentations), midterm and final papers exist
  ENG103: { a: null, pres: true, proj: null, drama: null, mid: null, fin: null }, // title only
  STA201: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // outline 2025
  BIO101: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CHE101: { a: null, pres: null, proj: null, drama: null, mid: true, fin: null }, // Fall 2019 outline
  ENV103: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  MAT101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // Spring 2019 outline
  PHY101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // GenEd curriculum 2025
  STA101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // Spring 2020 outline
  GSC110: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  BNG103: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // outline 2025
  HUM103: { a: true, pres: true, proj: null, drama: true, mid: true, fin: true }, // Fall 2025 outline plus residential outline (drama): verify per section
  EMB101: { a: true, pres: true, proj: null, drama: null, mid: null, fin: null }, // Spring 2023 outline
  ANT101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // Spring 2024 outline
  BUS102: { a: true, pres: true, proj: null, drama: null, mid: true, fin: true }, // Summer 2023 outline
  ECO101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // Summer 2025 outline
  ECO102: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  POL101: { a: true, pres: true, proj: true, drama: null, mid: true, fin: true }, // Spring and Fall 2025 outlines plus your note
  PSY101: { a: null, pres: true, proj: true, drama: null, mid: true, fin: false }, // Summer 2026 outline: no final exam in the marks list
  SOC101: { a: true, pres: null, proj: null, drama: null, mid: true, fin: true }, // Summer 2020 outline
  CST201: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST204: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST301: { a: true, pres: null, proj: true, drama: null, mid: null, fin: null }, // student uploads
  CST302: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST303: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST304: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST305: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST306: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST307: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST308: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST309: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  CST310: { a: null, pres: null, proj: null, drama: null, mid: null, fin: null },
  HUM101: { a: null, pres: null, proj: null, drama: null, mid: true, fin: true }, // your note. Course not in dataset yet
  HUM102: { a: null, pres: null, proj: true, drama: null, mid: true, fin: true }, // your note plus Summer 2025 outline (group project). Not in dataset yet
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
