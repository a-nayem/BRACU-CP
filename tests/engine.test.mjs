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

import { progress, hiddenCodes, bucketOf } from "../lib/engine.js";

test("degree buckets add up to 136 and MAT110/PHY111 count inside GenEd", () => {
  const p = progress([]);
  assert.equal(p.core.total + p.foundation.total + p.gened.total + p.electives.total + p.project.total, 136);
  assert.equal(p.project.total, 4);
  assert.equal(progress(["MAT110", "PHY111"]).gened.done, 6);
  assert.equal(progress(["MAT110", "PHY111"]).foundation.done, 0);
  assert.equal(bucketOf("MAT110"), "GenEd");
  assert.equal(bucketOf("MAT215"), "School core");
});

test("ENG103 is only for ENG102 freshers who skip ENG101", () => {
  assert.ok(hiddenCodes(false).has("ENG103") && !hiddenCodes(false).has("ENG101"));
  assert.ok(hiddenCodes(true).has("ENG101") && !hiddenCodes(true).has("ENG103"));
  assert.deepEqual(progress([], undefined, { eng102First: true }).gened.streams[1].fixed, ["ENG102", "ENG103"]);
  assert.deepEqual(progress([]).gened.streams[1].fixed, ["ENG102", "ENG101"]);
});

test("CSE101 is never suggested", () => {
  const plan = roadmap([], 14, { targetCredits: 12, maxLoad: 7, includeElectives: true });
  assert.ok(plan.every((s) => !s.courses.includes("CSE101")));
  const strat = planStrategies({ completed: new Set(), targetCredits: 12, includeElectives: true });
  assert.ok(Object.values(strat).every((l) => !l.includes("CSE101")));
});

test("roadmap covers exactly 136 credits and runs CSE400 over the last 3 semesters", () => {
  for (const eng of [false, true]) {
    const plan = roadmap([], 14, { targetCredits: 12, maxLoad: 7, eng102First: eng });
    const codes = plan.flatMap((s) => s.courses);
    assert.equal(new Set(codes).size, codes.length);
    const credits = codes.reduce((n, c) => n + COURSES[c].credits, 0) + 4;
    assert.equal(credits, 136);
    assert.ok(codes.includes(eng ? "ENG103" : "ENG101") && !codes.includes(eng ? "ENG101" : "ENG103"));
    assert.deepEqual(plan.filter((s) => s.project).map((s) => s.project.part), [1, 2, 3]);
    assert.deepEqual(plan.slice(-3).map((s) => !!s.project), [true, true, true]);
  }
});

test("roadmap is complete and empty when everything is done", () => {
  const first = roadmap([], 14, { targetCredits: 12, maxLoad: 7 });
  const all = first.flatMap((s) => s.courses).concat("CSE400");
  assert.equal(roadmap(all, 14, { targetCredits: 12, maxLoad: 7 }).length, 0);
});

test("12 semesters from scratch at 4 courses a semester, CSE400 takes a slot in the last 3", () => {
  const plan = roadmap([], 14, { targetCredits: 12, maxLoad: 7 });
  assert.equal(plan.length, 12);
  assert.deepEqual(plan.map((s) => s.courses.length), [4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 2]);
  assert.deepEqual(plan.slice(-3).map((s) => s.project.part), [1, 2, 3]);
  assert.ok(plan.slice(0, -3).every((s) => !s.project));
});

test("5 courses only with CGPA 3.5 and from semester 6", () => {
  const no = roadmap([], 14, { targetCredits: 15, maxLoad: 7, cgpaOk: false });
  assert.ok(no.every((s) => s.courses.length <= 4));
  const yes = roadmap([], 14, { targetCredits: 15, maxLoad: 7, cgpaOk: true });
  assert.ok(yes.slice(0, 5).every((s) => s.courses.length <= 4));
  assert.ok(yes.some((s) => s.courses.length === 5));
  assert.ok(yes.length < no.length);
});
