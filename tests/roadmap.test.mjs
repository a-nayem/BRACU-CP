import test from "node:test";
import assert from "node:assert/strict";
import { COURSES } from "../lib/data.js";
import { roadmap, residentialMust, RESIDENTIAL_COURSES } from "../lib/engine.js";

const start = ["CSE110", "MAT110", "PHY111", "ENG101", "CSE111", "MAT120", "PHY112", "CSE230"];

test("roadmap keeps hard and soft prerequisites in order", () => {
  const seen = new Set(start);
  for (const sem of roadmap(start, 14, { targetCredits: 12, includeElectives: true, startSemester: 3 })) {
    for (const c of sem.courses) {
      assert.ok(COURSES[c].hard.every((h) => seen.has(h)), `${c} hard in S${sem.semester}`);
      assert.ok(COURSES[c].soft.every((h) => seen.has(h) || sem.courses.includes(h)), `${c} soft in S${sem.semester}`);
    }
    sem.courses.forEach((c) => seen.add(c));
  }
});

test("every roadmap semester carries a pressure score out of 10", () => {
  for (const sem of roadmap(start, 14, { targetCredits: 12, includeElectives: true, startSemester: 3 })) {
    assert.ok(sem.pressure >= 0 && sem.pressure <= 10, `S${sem.semester}`);
  }
});

test("the residential semester holds the residential GenEd courses still missing", () => {
  const plan = roadmap(start, 14, { targetCredits: 12, includeElectives: true, startSemester: 3, residential: 4 });
  const sem = plan.find((s) => s.semester === 4);
  assert.ok(sem.residential);
  const taken = new Set(plan.filter((s) => s.semester < 4).flatMap((s) => s.courses));
  for (const c of RESIDENTIAL_COURSES) assert.ok(taken.has(c) || sem.courses.includes(c), c);
  assert.deepEqual(residentialMust(new Set(RESIDENTIAL_COURSES)), []);
});

test("CSE470 comes before CSE471 in every roadmap", () => {
  for (const [done, st] of [[[], 1], [start, 3]]) {
    const plan = roadmap(done, 14, { targetCredits: 12, includeElectives: true, startSemester: st });
    const at = (c) => plan.find((s) => s.courses.includes(c))?.semester;
    if (at("CSE471") !== undefined) assert.ok(at("CSE470") < at("CSE471"), `start S${st}`);
  }
});
