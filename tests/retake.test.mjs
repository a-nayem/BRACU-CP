import test from "node:test";
import assert from "node:assert/strict";
import { retakeInfo } from "../lib/retake.js";
import { cgpa } from "../lib/engine.js";

test("new grade replaces earlier, F is a repeat, no new grade is a pending retake", () => {
  const st = { completed: ["CSE110", "MAT110", "PHY111"], grades: { CSE110: "C", MAT110: "F", PHY111: "B" }, retakes: { CSE110: { to: "A", goal: "" }, MAT110: { to: "", goal: "B" }, PHY111: { to: "", goal: "A" } } };
  const i = retakeInfo(st);
  assert.deepEqual(i.repeat, ["MAT110"]);
  assert.deepEqual(i.improve, ["PHY111"]);
  assert.deepEqual(i.replaced, ["CSE110"]);
  assert.deepEqual(i.pending.sort(), ["MAT110", "PHY111"]);
  assert.ok(!i.passed.includes("MAT110"));
  assert.equal(i.effective.CSE110, "A");
  assert.ok(cgpa(i.goalRecords).cgpa > cgpa(i.records).cgpa);
  assert.ok(cgpa(i.records).cgpa > cgpa(i.beforeRecords).cgpa);
});
