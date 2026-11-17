// Repeat and retake bookkeeping. grades[code] is the grade of the first attempt. retakes[code] = { to, goal } marks a course as
// repeated or retaken: `to` is the new grade once taken, `goal` is an optional grade the student hopes for (used only for the CGPA estimate).
// Policy used (BRACU style): the new grade replaces the earlier one in the CGPA, and the course credits are counted once.
// An F is a repeat: the course is not passed until a passing grade is entered. A passed course can be retaken to improve the grade.
import { COURSES } from "./data.js";

export function retakeInfo(state, courses = COURSES) {
  const completed = (state.completed || []).filter((c) => courses[c]);
  const grades = state.grades || {}, rt = state.retakes || {};
  const effective = {}, original = {};
  const passed = [], repeat = [], improve = [], replaced = [];
  for (const c of completed) {
    const orig = grades[c] || "", e = rt[c];
    const eff = (e && e.to) || orig;
    original[c] = orig; effective[c] = eff;
    if (eff !== "F") passed.push(c); else repeat.push(c);
    if (eff !== "F" && e && !e.to) improve.push(c);
    if (eff !== "F" && e && e.to) replaced.push(c);
  }
  const pending = [...repeat, ...improve];
  const pendingSet = new Set(pending);
  const records = completed.filter((c) => effective[c]).map((c) => ({ code: c, grade: effective[c] }));
  // The grades each pending course would have if the student reaches the goal grade entered for it.
  const goalRecords = records.map((r) => (pendingSet.has(r.code) && rt[r.code]?.goal ? { ...r, grade: rt[r.code].goal } : r));
  const hasGoal = pending.some((c) => rt[c]?.goal);
  // Records as they were before the retakes that already happened.
  const beforeRecords = completed.filter((c) => original[c] || effective[c]).map((c) => ({ code: c, grade: replaced.includes(c) || (rt[c]?.to) ? original[c] : effective[c] })).filter((r) => r.grade);
  const credits = (codes) => codes.reduce((n, c) => n + (courses[c]?.credits || 0), 0);
  return { completed, effective, original, passed, repeat, improve, replaced, pending, pendingSet, records, goalRecords, hasGoal, beforeRecords, credits };
}
