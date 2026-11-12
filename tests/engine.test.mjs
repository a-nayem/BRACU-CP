import test from "node:test";
import assert from "node:assert/strict";
import { COURSES, DEGREE } from "../lib/data.js";
import { loadOf, prereqStatus, roadmap, clashes, cgpa, verdict, planStrategies, suggestSemester } from "../lib/engine.js";

test("difficulty matches the workbook formula", () => {
  for (const c of Object.values(COURSES)) {
    if (c.workbookDifficulty == null) continue;
    assert.ok(Math.abs(c.difficulty - c.workbookDifficulty) < 0.011, c.code);
  }
});

test("load index tracks the workbook combo examples", () => {
  const combos = [
    [["CSE220", "CSE230", "CSE260", "ENG102"], 6.84], [["CSE221", "CSE230", "CSE331"], 8.12],
    [["CSE321", "CSE340", "CSE370", "CSE320"], 7.38], [["CSE250", "CSE251", "CSE260", "CSE350"], 9.2],
    [["CSE321", "CSE331", "CSE422", "CSE370"], 8.75], [["CSE330", "CSE422", "CSE423", "CSE230"], 9.79],
    [["CSE470", "CSE420", "CSE421"], 7.73],
  ];
  for (const [codes, expected] of combos) assert.ok(Math.abs(loadOf(codes).index - expected) < 0.35, codes.join());
});

test("hard prerequisites block, soft prerequisites warn", () => {
  assert.equal(prereqStatus("CSE420", new Set(["CSE321", "CSE340"])).ok, false);
  const t = prereqStatus("CSE321", new Set(["CSE221"]), ["CSE340"]);
  assert.ok(t.ok && t.missingSoft.length === 0);
  assert.equal(prereqStatus("CSE321", new Set(["CSE221"]), []).missingSoft[0], "CSE340");
});

test("project course is gated by earned credits", () => {
  const r = suggestSemester({ completed: new Set(["CSE110"]), targetCredits: 12, includeElectives: true });
  assert.ok(!r.eligible.includes("CSE400"));
});

test("roadmap never schedules a course before its hard prerequisites", () => {
  const done = new Set(["CSE110"]);
  for (const sem of roadmap(["CSE110"], 8, { targetCredits: 12, maxLoad: 7.5 })) {
    for (const c of sem.courses) assert.ok(COURSES[c].hard.every((h) => done.has(h)), `${c} in S${sem.semester}`);
    sem.courses.forEach((c) => done.add(c));
  }
});

test("clash detection: overlap flagged, back-to-back not", () => {
  const a = { code: "A", slots: [{ days: ["S"], start: "08:00", end: "09:20" }] };
  assert.equal(clashes([a, { code: "B", slots: [{ days: ["S"], start: "09:00", end: "10:20" }] }]).length, 1);
  assert.equal(clashes([a, { code: "C", slots: [{ days: ["S"], start: "09:20", end: "10:40" }] }]).length, 0);
});

test("cgpa uses the latest grade for retakes", () => {
  assert.equal(cgpa([{ code: "CSE110", grade: "F" }, { code: "CSE110", grade: "A" }]).cgpa, 4);
});

test("verdict: missing hard prerequisite forces the last tier", () => {
  const v = verdict(["CSE420"], new Set());
  assert.equal(v.key, "no");
  assert.equal(verdict(["ENG101", "BNG103"], new Set()).key, "doable");
});

test("four strategies are produced and each is a valid size", () => {
  const plans = planStrategies({ completed: new Set(["CSE110", "ENG101", "MAT110", "PHY111"]), targetCredits: 12 });
  assert.deepEqual(Object.keys(plans).sort(), ["cg", "heavy", "risky", "sustainable"]);
  for (const k of Object.keys(plans)) assert.ok(plans[k].length >= 3, k);
  assert.ok(DEGREE.totalCredits === 136);
});
