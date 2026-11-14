import test from "node:test";
import assert from "node:assert/strict";
import { COURSES } from "../lib/data.js";
import { roadmap, residentialMust, RESIDENTIAL_COURSES, planStrategies, isGened } from "../lib/engine.js";

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
  assert.deepEqual(residentialMust(new Set([...RESIDENTIAL_COURSES, "ENG102", "BU201"])), []);
});

test("CSE470 comes before CSE471 in every roadmap", () => {
  for (const [done, st] of [[[], 1], [start, 3]]) {
    const plan = roadmap(done, 14, { targetCredits: 12, includeElectives: true, startSemester: st });
    const at = (c) => plan.find((s) => s.courses.includes(c))?.semester;
    if (at("CSE471") !== undefined) assert.ok(at("CSE470") < at("CSE471"), `start S${st}`);
  }
});

const cstOf = (codes) => codes.filter((c) => COURSES[c].stream === 5);

test("residential list: ENG102 after ENG101, BU201 once ENG102 is done", () => {
  assert.deepEqual(residentialMust(new Set(["ENG101"])), [...RESIDENTIAL_COURSES, "ENG102"]);
  assert.deepEqual(residentialMust(new Set(["ENG102"])), [...RESIDENTIAL_COURSES, "BU201"]);
  assert.deepEqual(residentialMust(new Set(), COURSES, new Set(), true), [...RESIDENTIAL_COURSES, "BU201"]);
});

test("roadmap plans exactly one CST course", () => {
  for (const [done, o] of [[[], {}], [start, { startSemester: 3 }], [start, { startSemester: 3, residential: 4 }]]) {
    const plan = roadmap(done, 14, { targetCredits: 12, includeElectives: true, ...o });
    assert.equal(cstOf(plan.flatMap((s) => s.courses)).length, 1);
  }
});

test("roadmap puts ENG102 (or BU201) only in the residential semester", () => {
  const plan = roadmap(["CSE110", "MAT110", "PHY111", "ENG101"], 14, { targetCredits: 12, includeElectives: true, startSemester: 2, residential: 4 });
  const at = (c) => plan.find((s) => s.courses.includes(c))?.semester;
  assert.equal(at("ENG102"), 4);
  assert.equal(at("BU201"), undefined);
  const plan2 = roadmap(["CSE110", "MAT110", "PHY111", "ENG102"], 14, { targetCredits: 12, includeElectives: true, startSemester: 2, residential: 3, eng102First: true });
  const at2 = (c) => plan2.find((s) => s.courses.includes(c))?.semester;
  assert.equal(at2("BU201"), 3);
  for (const c of RESIDENTIAL_COURSES) assert.equal(at2(c), 3);
});

test("Step 2 follows the residential rules", () => {
  const done = new Set(start);
  const now = planStrategies({ completed: done, targetCredits: 12, residentialNow: true });
  for (const set of Object.values(now)) { assert.ok(set.includes("ENG102")); assert.ok(cstOf(set).length <= 1); }
  const pending = planStrategies({ completed: done, targetCredits: 12, residentialPending: true });
  for (const set of Object.values(pending)) for (const c of [...RESIDENTIAL_COURSES, "ENG102", "BU201"]) assert.ok(!set.includes(c), c);
});
