import test from "node:test";
import assert from "node:assert/strict";
import { makeBackup, parseBackup } from "../lib/backup.js";

const state = { completed: ["CSE110", "MAT110", "CSE110"], grades: { CSE110: "A", MAT110: "F" }, retakes: { CSE110: "C" }, edits: { cg: ["CSE111"] }, slots: {}, target: 12, electives: true, eng102First: false, semester: 4, residential: 5 };

test("export then import returns the same state", () => {
  const r = parseBackup(makeBackup(state));
  assert.ok(r.ok);
  assert.deepEqual(r.state.completed, ["CSE110", "MAT110"]);
  assert.deepEqual(r.state.grades, state.grades);
  assert.deepEqual(r.state.retakes, state.retakes);
  assert.equal(r.state.semester, 4);
  assert.equal(r.state.residential, 5);
  assert.equal(r.summary.courses, 2);
});

test("bad files are rejected with a message", () => {
  assert.equal(parseBackup("not json").ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "other", v: 1, state: {} })).ok, false);
  assert.equal(parseBackup(JSON.stringify({ app: "bracu-cse-planner", v: 9, state: {} })).ok, false);
  assert.equal(parseBackup("x".repeat(2 * 1024 * 1024)).ok, false);
});

test("unknown courses, grades and values are dropped", () => {
  const r = parseBackup(JSON.stringify({ app: "bracu-cse-planner", v: 1, state: { completed: ["NOPE999", "CSE110"], grades: { CSE110: "Z", NOPE999: "A" }, target: 99, semester: 40, residential: 9, electives: "yes" } }));
  assert.ok(r.ok);
  assert.deepEqual(r.state.completed, ["CSE110"]);
  assert.deepEqual(r.state.grades, {});
  assert.equal(r.state.target, 12);
  assert.equal(r.state.semester, null);
  assert.equal(r.state.residential, null);
  assert.equal(r.state.electives, false);
});
