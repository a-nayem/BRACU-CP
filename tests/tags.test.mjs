import test from "node:test";
import assert from "node:assert/strict";
import { COURSES } from "../lib/data.js";
import { courseTagList, MISSING_TAG_CODES } from "../lib/courseTags.js";

const labels = (code) => courseTagList(COURSES[code]).map((t) => t[0]);

test("CSE courses get no extra picker tags", () => {
  for (const c of Object.values(COURSES)) if (c.group === "CSE") assert.equal(courseTagList(c).length, 0, c.code);
});
test("Math and Science carry a lab tag", () => {
  for (const c of Object.values(COURSES).filter((c) => c.group === "MATH" || c.group === "SCI")) assert.ok(labels(c.code).some((l) => /lab/i.test(l)), c.code);
});
test("known GenEd tags render and false shows as No", () => {
  for (const l of ["Assignment", "Mid", "Final"]) assert.ok(labels("POL101").includes(l), l);
  assert.ok(labels("PSY101").includes("No final"));
  assert.ok(labels("ENG103").includes("Presentation"));
  const c = { group: "GENED", mid: false, final: true, assignment: true };
  assert.deepEqual(courseTagList(c).map((t) => t[0]), ["Assignment", "No mid", "Final"]);
});
test("no 10-point assignment scale in tags", () => {
  for (const c of Object.values(COURSES)) for (const [l] of courseTagList(c)) assert.ok(!/\/10/.test(l), c.code);
});
test("report manual tag codes missing from the dataset", () => {
  console.log("Missing from dataset:", MISSING_TAG_CODES.join(", ") || "none");
});
