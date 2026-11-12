import { COURSES, BANDS, DEGREE } from "./data.js";

// ---------- Difficulty and load ----------
// Load index = average difficulty + weighted counts of high-intensity, lab-heavy and math-heavy courses.
// Weights were fitted (non-negative least squares) to the workbook's "Combo Examples" sheet; fit error is within about 0.2.
// Credits above 12 add a penalty (my extension: the examples only cover 9 and 12 credits).
export const LOAD_W = { high: 0.33, lab: 0.14, math: 0.20, overCredit: 0.2 };

export const bandOf = (idx) => BANDS.find((b) => idx <= b.max).label;

export function loadOf(codes, courses = COURSES) {
  const cs = codes.map((c) => courses[c]).filter(Boolean);
  if (!cs.length) return { index: 0, avg: 0, credits: 0, band: "Light", counts: { high: 0, lab: 0, math: 0, concept: 0 } };
  const credits = cs.reduce((s, c) => s + c.credits, 0);
  const avg = cs.reduce((s, c) => s + c.difficulty, 0) / cs.length;
  const counts = {
    high: cs.filter((c) => c.difficulty >= 7.5).length,
    lab: cs.filter((c) => c.scores.lab >= 7).length,
    math: cs.filter((c) => c.scores.math >= 7.5).length,
    concept: cs.filter((c) => c.scores.conceptual >= 8).length,
  };
  let idx = avg + LOAD_W.high * counts.high + LOAD_W.lab * counts.lab + LOAD_W.math * counts.math;
  if (credits > 12) idx += LOAD_W.overCredit * (credits - 12);
  idx = Math.min(10, idx);
  return { index: +idx.toFixed(2), avg: +avg.toFixed(2), credits, band: bandOf(idx), counts };
}

// ---------- Prerequisites ----------
// completed: Set of codes. together: codes taken in the same semester (satisfy soft prerequisites only).
export function prereqStatus(code, completed, together = [], courses = COURSES) {
  const c = courses[code];
  const missingHard = c.hard.filter((p) => !completed.has(p));
  const missingSoft = c.soft.filter((p) => !completed.has(p) && !together.includes(p));
  return {
    ok: missingHard.length === 0,
    missingHard,
    missingSoft, // warning only
    softViaTogether: c.soft.filter((p) => !completed.has(p) && together.includes(p)),
  };
}

// Hard prerequisites of courses taken in the same semester do NOT count.
export function eligibleCourses(completed, pool, courses = COURSES) {
  return pool.filter((code) => !completed.has(code) && prereqStatus(code, completed, [], courses).ok);
}

// ---------- Unlock value / critical path ----------
function buildDependents(courses) {
  const d = {};
  for (const c of Object.values(courses)) for (const p of [...c.hard, ...c.soft, ...(c.advisory || [])]) (d[p] ||= []).push(c.code);
  return d;
}
// Number of courses (transitively) that depend on this one, and longest chain length after it.
export function unlockStats(courses = COURSES) {
  const dep = buildDependents(courses);
  const memo = {};
  const walk = (code) => {
    if (memo[code]) return memo[code];
    const seen = new Set();
    let depth = 0;
    for (const d of dep[code] || []) {
      const r = walk(d);
      seen.add(d);
      r.set.forEach((x) => seen.add(x));
      depth = Math.max(depth, 1 + r.depth);
    }
    return (memo[code] = { set: seen, depth });
  };
  const out = {};
  for (const code of Object.keys(courses)) {
    const r = walk(code);
    out[code] = { unlocks: r.set.size, depth: r.depth };
  }
  return out;
}

// ---------- Requirements and graduation progress ----------
export function progress(completedCodes, courses = COURSES) {
  const done = new Set(completedCodes);
  const credits = (codes) => codes.filter((c) => done.has(c)).reduce((s, c) => s + courses[c].credits, 0);
  const sum = (codes) => codes.reduce((s, c) => s + courses[c].credits, 0);
  const core = DEGREE.coreCSE, found = DEGREE.foundation, proj = DEGREE.project;
  const gen = DEGREE.gened;
  const genDone = [...done].filter((c) => courses[c]?.group === "GENED");
  const streamStatus = {};
  for (const [s, rule] of Object.entries(gen.streams)) {
    const inStream = genDone.filter((c) => courses[c].stream === +s);
    const fixedMissing = (rule.fixed || []).filter((c) => !done.has(c));
    streamStatus[s] = { label: rule.label, have: inStream.length, need: rule.need, fixedMissing, met: inStream.length >= rule.need && !fixedMissing.length };
  }
  const requiredCredits = sum(core) + sum(proj) + sum(found) + gen.credits;
  const electiveCredits = Math.max(0, DEGREE.totalCredits - requiredCredits);
  const electivesDone = [...done].filter((c) => courses[c]?.category === "elective").reduce((s, c) => s + courses[c].credits, 0);
  const genCredits = Math.min(gen.credits, genDone.reduce((s, c) => s + courses[c].credits, 0));
  const earned = credits(core) + credits(proj) + credits(found) + genCredits + Math.min(electivesDone, electiveCredits);
  return {
    earned, total: DEGREE.totalCredits, remaining: Math.max(0, DEGREE.totalCredits - earned),
    core: { done: credits(core), total: sum(core), missing: core.filter((c) => !done.has(c)) },
    foundation: { done: credits(found), total: sum(found), missing: found.filter((c) => !done.has(c)) },
    project: { missing: proj.filter((c) => !done.has(c)) },
    gened: { done: genCredits, total: gen.credits, streams: streamStatus },
    electives: { done: Math.min(electivesDone, electiveCredits), total: electiveCredits },
  };
}

// ---------- CGPA (BRACU 4.0 scale) ----------
export const GRADE_POINTS = { "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7, "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0 };
export function cgpa(records, courses = COURSES) {
  // records: [{code, grade}] ; retakes: latest entry for a code wins
  const latest = {};
  records.forEach((r) => (latest[r.code] = r));
  let pts = 0, cr = 0;
  for (const r of Object.values(latest)) {
    const gp = GRADE_POINTS[r.grade];
    if (gp === undefined || !courses[r.code]) continue;
    pts += gp * courses[r.code].credits; cr += courses[r.code].credits;
  }
  return { cgpa: cr ? +(pts / cr).toFixed(2) : 0, credits: cr };
}

// ---------- Section clash ----------
// slot: { days: ["S","T"], start: "08:00", end: "09:20" } (minutes compared). Sections come from the student, not from BRACU.
const mins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export function clashes(selected) {
  // selected: [{code, slots:[{days,start,end}]}]
  const out = [];
  for (let i = 0; i < selected.length; i++)
    for (let j = i + 1; j < selected.length; j++)
      for (const a of selected[i].slots) for (const b of selected[j].slots)
        if (a.days.some((d) => b.days.includes(d)) && mins(a.start) < mins(b.end) && mins(b.start) < mins(a.end))
          out.push([selected[i].code, selected[j].code]);
  return out;
}

// ---------- Semester suggestion ----------
// opts: { completed:Set, targetCredits:9|12|15, maxBand:"Heavy", pool?:codes, strengths?:{math,lab,...}, mustTake?:[], exclude?:[] }
// Exhaustive search over subsets of eligible courses. Score = priority/unlock value - load penalty.
export function suggestSemester(opts, courses = COURSES) {
  const { completed, targetCredits = 12, maxLoad = 7.5, mustTake = [], exclude = [] } = opts;
  const prog = progress([...completed], courses);
  const stats = unlockStats(courses);
  const pool = opts.pool || Object.keys(courses).filter((c) => courses[c].category !== "elective" || opts.includeElectives);
  const advOk = (c) => (courses[c].advisory || []).every((a) => completed.has(a));
  const earnedNow = prog.earned;
  let cand = eligibleCourses(completed, pool, courses)
    .filter((c) => !exclude.includes(c) && advOk(c))
    .filter((c) => !DEGREE.project.includes(c) || earnedNow >= DEGREE.projectMinCredits);

  const priority = makePriority(completed, courses, prog, stats, opts.includeElectives);
  // Soft prerequisites can be satisfied by taking the soft course in the same semester; handled in scoring.
  cand = cand.sort((a, b) => priority(b) - priority(a)).slice(0, 18);
  const k = Math.round(targetCredits / 3);
  const best = [];
  const combo = (start, cur) => {
    if (cur.length === k) { evaluate(cur); return; }
    for (let i = start; i < cand.length; i++) { cur.push(cand[i]); combo(i + 1, cur); cur.pop(); }
  };
  const evaluate = (set) => {
    if (mustTake.some((m) => !set.includes(m))) return;
    // Soft prerequisite warnings
    let softPenalty = 0;
    for (const c of set) softPenalty += prereqStatus(c, completed, set, courses).missingSoft.length * 1.5;
    const load = loadOf(set, courses);
    const over = Math.max(0, load.index - maxLoad);
    const score = set.reduce((s, c) => s + priority(c), 0) - over * 4 - load.index * 0.35 - softPenalty;
    best.push({ set: [...set], load, score });
  };
  combo(0, []);
  best.sort((a, b) => b.score - a.score);
  // Keep a few distinct options
  return { options: best.slice(0, 5), eligible: cand };
}

// ---------- Multi-semester roadmap ----------
export function roadmap(startCompleted, semesters, optsPerSem = {}, courses = COURSES) {
  const done = new Set(startCompleted), plan = [];
  for (let i = 0; i < semesters; i++) {
    const r = suggestSemester({ completed: done, ...optsPerSem }, courses);
    if (!r.options.length) break;
    const pick = r.options[0];
    plan.push({ semester: i + 1, courses: pick.set, load: pick.load });
    pick.set.forEach((c) => done.add(c));
  }
  return plan;
}


// ---------- Shared priority: required courses first, then unlock value ----------
export function neededSet(prog) {
  const needed = new Set([...prog.core.missing, ...prog.foundation.missing, ...prog.project.missing]);
  Object.values(prog.gened.streams).forEach((st) => st.fixedMissing.forEach((c) => needed.add(c)));
  return needed;
}
export function makePriority(completed, courses, prog, stats) {
  const needed = neededSet(prog);
  return (c) => {
    let p = 0;
    if (needed.has(c)) p += 3;
    p += Math.min(stats[c].unlocks, 8) * 0.35 + stats[c].depth * 0.25;
    if (courses[c].group === "GENED" && !needed.has(c)) p -= 1.5;
    if (courses[c].category === "elective") p -= 1.0;
    return p;
  };
}

// ---------- Verdict tags (the four labels shown on cards) ----------
export const VERDICTS = {
  doable: "Do-able",
  heavy: "Heavy pressure",
  edge: "Edge corner",
  no: "Absolutely not recommended",
};
// completed: Set. slots: {code: [{days,start,end}]}. Blocking problems force the last tier.
export function verdict(codes, completed, slots = {}, courses = COURSES) {
  const load = loadOf(codes, courses);
  const hardMissing = [], softMissing = [];
  for (const c of codes) {
    const st = prereqStatus(c, completed, codes, courses);
    if (!st.ok) hardMissing.push({ code: c, missing: st.missingHard });
    if (st.missingSoft.length) softMissing.push({ code: c, missing: st.missingSoft });
  }
  const clash = clashes(codes.filter((c) => slots[c]?.length).map((c) => ({ code: c, slots: slots[c] })));
  let key = load.index <= 6.0 ? "doable" : load.index <= 7.5 ? "heavy" : load.index <= 9.0 ? "edge" : "no";
  const blocked = hardMissing.length > 0 || clash.length > 0;
  if (blocked) key = "no";
  return { key, label: VERDICTS[key], load, hardMissing, softMissing, clash, blocked };
}

// ---------- Course status for a given plan (used by the Swap and Add panel) ----------
// state: "completed" | "blocked" (a hard prerequisite is missing) | "eligible".
// inPlan is separate so a selected course can still show its blocked reason.
// Hard prerequisites of courses in the same plan do not count, soft ones do (as in prereqStatus).
export function courseStatus(code, completed, planCodes = [], courses = COURSES) {
  const st = prereqStatus(code, completed, planCodes, courses);
  const state = completed.has(code) ? "completed" : st.ok ? "eligible" : "blocked";
  return { state, inPlan: planCodes.includes(code), missingHard: st.missingHard, missingSoft: st.missingSoft };
}

// ---------- Expected grade point (estimate, not a prediction) ----------
// Harder courses lower the expected grade; a student's CGPA history shifts it up or down.
export function expectedGP(code, skill = 0, courses = COURSES) {
  const d = courses[code].difficulty;
  return Math.max(1.0, Math.min(4.0, 4.35 - 0.28 * d + skill));
}

// ---------- Four strategies ----------
export const STRATEGIES = {
  sustainable: { label: "Sustainable", ceiling: 6.0 },
  heavy: { label: "Heavy pressure", ceiling: 9.0 },
  cg: { label: "Best CG optimization", ceiling: 7.5 },
  risky: { label: "Risky but worth a shot", ceiling: 9.5 },
};

// opts: { completed:Set, targetCredits, includeElectives, skill }
// Returns { [strategy]: string[] } with one distinct course set per strategy where possible.
export function planStrategies(opts, courses = COURSES) {
  const { completed, targetCredits = 12, includeElectives = false, skill = 0 } = opts;
  const prog = progress([...completed], courses);
  const stats = unlockStats(courses);
  const priority = makePriority(completed, courses, prog, stats);
  const needed = neededSet(prog);
  const pool = Object.keys(courses).filter((c) => includeElectives || courses[c].category !== "elective");
  const earned = prog.earned;
  const advOk = (c) => (courses[c].advisory || []).every((a) => completed.has(a));
  const cand = eligibleCourses(completed, pool, courses)
    .filter((c) => advOk(c) && (!DEGREE.project.includes(c) || earned >= DEGREE.projectMinCredits))
    .sort((a, b) => priority(b) - priority(a))
    .slice(0, 16);
  const baseK = Math.min(cand.length, Math.max(1, Math.round(targetCredits / 3)));
  const kFor = { sustainable: baseK, heavy: Math.min(cand.length, baseK + 1), cg: baseK, risky: baseK };

  const scoreOf = {
    sustainable: (set, load) => set.reduce((s, c) => s + priority(c), 0) - 20 * Math.max(0, load.index - 6.0) - 0.5 * load.index,
    heavy: (set, load) => set.reduce((s, c) => s + priority(c) + 0.4, 0) - 4 * Math.max(0, load.index - 9.0),
    cg: (set, load) =>
      set.reduce((s, c) => s + expectedGP(c, skill, courses) * 1.6 + (needed.has(c) ? 0.8 : 0) + priority(c) * 0.35, 0) - 3 * Math.max(0, load.index - 7.5),
    risky: (set, load) =>
      set.reduce((s, c) => s + stats[c].unlocks * 0.55 + stats[c].depth * 0.9 + priority(c) * 0.3 + courses[c].difficulty * 0.4, 0) -
      5 * Math.max(0, load.index - 9.5),
  };

  const ranked = {};
  const keys = opts.only || Object.keys(STRATEGIES);
  for (const key of keys) {
    const k = kFor[key], list = [];
    const rec = (start, cur) => {
      if (cur.length === k) {
        const load = loadOf(cur, courses);
        let sc = scoreOf[key](cur, load);
        for (const c of cur) sc -= prereqStatus(c, completed, cur, courses).missingSoft.length * 1.5;
        list.push({ set: [...cur], sc });
        return;
      }
      for (let i = start; i < cand.length; i++) { cur.push(cand[i]); rec(i + 1, cur); cur.pop(); }
    };
    rec(0, []);
    list.sort((a, b) => b.sc - a.sc);
    ranked[key] = list.slice(0, 12);
  }
  // Make strategies distinct: take the best set not already used by an earlier strategy.
  const out = {}, used = new Set();
  for (const key of ["sustainable", "cg", "heavy", "risky"].filter((k) => keys.includes(k))) {
    const pick = ranked[key].find((r) => !used.has([...r.set].sort().join())) || ranked[key][0];
    out[key] = pick ? pick.set : [];
    if (pick) used.add([...pick.set].sort().join());
  }
  return out;
}
