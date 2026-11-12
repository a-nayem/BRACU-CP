import test from "node:test";
import assert from "node:assert/strict";
import { COURSES } from "../lib/data.js";
import { courseTagList, MISSING_TAG_CODES } from "../lib/courseTags.js";

test("CSE courses get no extra picker tags", () => {
  for (const c of Object.values(COURSES)) if (c.group === "CSE") assert.equal(courseTagList(c).length, 0, c.code);
});
test("Math and Science carry lab and assignment tags", () => {
  for (const c of Object.values(COURSES).filter((c) => c.group === "MATH" || c.group === "SCI")) {
    const labels = courseTagList(c).map((t) => t[0]);
    assert.ok(labels.some((l) => /lab/i.test(l)), c.code + " lab");
    assert.ok(labels.some((l) => l.startsWith("Assignments")), c.code + " assignments");
  }
});
test("GenEd carries assignment, exam and presentation tags where known", () => {
  assert.ok(courseTagList(COURSES.POL101).map((t) => t[0]).includes("Mid"));
  assert.ok(courseTagList(COURSES.POL101).map((t) => t[0]).includes("Final"));
  assert.ok(courseTagList(COURSES.ENG103).map((t) => t[0]).includes("Presentation"));
  for (const c of Object.values(COURSES).filter((c) => c.group === "GENED")) assert.ok(courseTagList(c).some((t) => t[0].startsWith("Assignments")), c.code);
});
test("report manual tag codes missing from the dataset", () => {
  console.log("Missing from dataset:", MISSING_TAG_CODES.join(", ") || "none");
});
