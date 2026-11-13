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
export function hiddenCodes(eng102First = false) {
  // CSE101 is not for CSE students. ENG101 is skipped by ENG102 freshers; ENG103 is only for them.
  return new Set([...DEGREE.hidden, eng102First ? "ENG101" : "ENG103"]);
}
const streamOf = (c, courses) => DEGREE.gened.streamOf[c] ?? courses[c]?.stream;
export const isGened = (c, courses = COURSES) => courses[c]?.group === "GENED" || c in DEGREE.gened.streamOf;
export function bucketOf(code, courses = COURSES) {
  if (DEGREE.project.includes(code)) return "Project";
  if (DEGREE.schoolCore.includes(code)) return "School core";
  if (courses[code]?.category === "core") return "Program core";
  if (isGened(code, courses)) return "GenEd";
  return "Program elective";
}
export function progress(completedCodes, courses = COURSES, opts = {}) {
  const eng = !!opts.eng102First;
  const done = new Set(completedCodes);
  const credits = (codes) => codes.filter((c) => done.has(c)).reduce((s, c) => s + courses[c].credits, 0);
  const sum = (codes) => codes.reduce((s, c) => s + courses[c].credits, 0);
  const core = DEGREE.coreCSE, found = DEGREE.schoolCore, proj = DEGREE.project;
  const gen = DEGREE.gened;
  const genDone = [...done].filter((c) => courses[c] && isGened(c, courses) && !hiddenCodes(eng).has(c));
  const streamStatus = {};
  for (const [s, rule] of Object.entries(gen.streams)) {
    const inStream = genDone.filter((c) => streamOf(c, courses) === +s);
    const fixed = s === "1" ? ["ENG102", eng ? "ENG103" : "ENG101"] : rule.fixed || [];
    const fixedMissing = fixed.filter((c) => !done.has(c));
    streamStatus[s] = { label: rule.label, have: inStream.length, need: rule.need, fixed, fixedMissing, met: inStream.length >= rule.need && !fixedMissing.length };
  }
  const electivesDone = [...done].filter((c) => courses[c]?.category === "elective" && !DEGREE.hidden.includes(c)).reduce((s, c) => s + courses[c].credits, 0);
  const electiveTotal = DEGREE.programElectiveCredits;
  const genCredits = Math.min(gen.credits, genDone.reduce((s, c) => s + courses[c].credits, 0));
  const electiveCredits = Math.min(electivesDone, electiveTotal);
  const earned = credits(core) + credits(proj) + credits(found) + genCredits + electiveCredits;
  return {
    earned, total: DEGREE.totalCredits, remaining: Math.max(0, DEGREE.totalCredits - earned),
    core: { done: credits(core), total: sum(core), missing: core.filter((c) => !done.has(c)) },
    foundation: { done: credits(found), total: sum(found), missing: found.filter((c) => !done.has(c)) },
    project: { done: credits(proj), total: sum(proj), missing: proj.filter((c) => !done.has(c)) },
    gened: { done: genCredits, total: gen.credits, streams: streamStatus },
    electives: { done: electiveCredits, total: electiveTotal },
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
  const { completed, targetCredits = 12, maxLoad = 7.5, mustTake = [], exclude = [], accept } = opts;
  const eng = !!opts.eng102First, hid = hiddenCodes(eng);
  const prog = progress([...completed], courses, { eng102First: eng });
  const stats = unlockStats(courses);
  const pool = (opts.pool || Object.keys(courses).filter((c) => courses[c].category !== "elective" || opts.includeElectives)).filter((c) => !hid.has(c));
  const advOk = (c) => (courses[c].advisory || []).every((a) => completed.has(a) || hid.has(a));
  const earnedNow = prog.earned;
  let cand = eligibleCourses(completed, pool, courses)
    .filter((c) => !exclude.includes(c) && advOk(c))
    .filter((c) => !DEGREE.project.includes(c) || earnedNow >= DEGREE.projectMinCredits);

  const priority = makePriority(completed, courses, prog, stats, opts.includeElectives);
  // Soft prerequisites can be satisfied by taking the soft course in the same semester; handled in scoring.
  cand = cand.sort((a, b) => priority(b) - priority(a)).slice(0, 18);
  const best = [];
  const evaluate = (set) => {
    if (mustTake.some((m) => !set.includes(m))) return;
    if (accept && !accept(set)) return;
    // Soft prerequisite warnings
    let softPenalty = 0;
    for (const c of set) softPenalty += prereqStatus(c, completed, set, courses).missingSoft.length * 1.5;
    const load = loadOf(set, courses);
    const over = Math.max(0, load.index - maxLoad);
    const score = set.reduce((s, c) => s + priority(c), 0) - over * 4 - load.index * 0.35 - softPenalty;
    best.push({ set: [...set], load, score });
  };
  const combo = (start, cur, k) => {
    if (cur.length === k) { evaluate(cur); return; }
    for (let i = start; i < cand.length; i++) { cur.push(cand[i]); combo(i + 1, cur, k); cur.pop(); }
  };
  // Aim for the target size; fall back to fewer courses when few remain or the slot rules allow fewer.
  for (let k = Math.min(cand.length, Math.round(targetCredits / 3)); k >= 1 && !best.length; k--) combo(0, [], k);
  best.sort((a, b) => b.score - a.score);
  return { options: best.slice(0, 5), eligible: cand };
}

// ---------- Multi-semester roadmap ----------
// What is still open for graduation: fixed required courses plus "pick one" slots and elective slots.
function openSlots(done, prog, courses, hid) {
  const fixedGen = Object.values(prog.gened.streams).flatMap((st) => st.fixedMissing);
  const fixed = [...new Set([...prog.core.missing, ...prog.foundation.missing, ...fixedGen])];
  const picks = {};
  for (const [s, st] of Object.entries(prog.gened.streams)) picks[s] = Math.max(0, st.need - st.have - st.fixedMissing.length);
  const pickCount = Object.values(picks).reduce((a, b) => a + b, 0);
  const genLeft = Math.max(0, DEGREE.gened.credits - prog.gened.done);
  const fixedGenCredits = fixedGen.reduce((s, c) => s + courses[c].credits, 0);
  const genElec = Math.max(0, Math.round((genLeft - fixedGenCredits - pickCount * 3) / 3));
  const progElec = Math.max(0, Math.round((prog.electives.total - prog.electives.done) / 3));
  const free = (c) => courses[c] && !done.has(c) && !hid.has(c) && !fixed.includes(c);
  const easiest = (list, n) => list.sort((a, b) => courses[a].difficulty - courses[b].difficulty).slice(0, n);
  const pool = new Set(fixed);
  const gen = Object.keys(courses).filter((c) => free(c) && isGened(c, courses) && c !== "STA201");
  for (const [s, n] of Object.entries(picks)) if (n > 0) easiest(gen.filter((c) => streamOf(c, courses) === +s), 4).forEach((c) => pool.add(c));
  if (genElec > 0) easiest(gen.filter((c) => !pool.has(c)), 4).forEach((c) => pool.add(c));
  if (progElec > 0) easiest(Object.keys(courses).filter((c) => free(c) && courses[c].category === "elective"), 6).forEach((c) => pool.add(c));
  const fixedSet = new Set(fixed);
  const accept = (set) => {
    const left = { ...picks };
    let ge = genElec, pe = progElec;
    for (const c of set) {
      if (fixedSet.has(c)) continue;
      if (courses[c].category === "elective") { if (--pe < 0) return false; continue; }
      const s = streamOf(c, courses);
      if (left[s] > 0) left[s]--; else if (--ge < 0) return false;
    }
    return true;
  };
  const any = fixed.length + pickCount + genElec + progElec > 0;
  return { pool: [...pool], accept, any, fixed, picks, genElec, progElec };
}

// Greedy planning tends to leave the hardest required courses for the end. Swap courses between semesters
// (only when every prerequisite order stays valid) to even out the load and avoid soft-prerequisite warnings.
function balanceLoad(plan, start, courses, hid) {
  const valid = () => {
    const seen = new Set(start);
    for (const sem of plan) {
      for (const c of sem.courses) {
        if (!courses[c].hard.every((h) => seen.has(h))) return false;
        if (!(courses[c].advisory || []).every((a) => seen.has(a) || hid.has(a))) return false;
      }
      sem.courses.forEach((c) => seen.add(c));
    }
    return true;
  };
  const cost = () => {
    const seen = new Set(start);
    let t = 0;
    for (const sem of plan) {
      const idx = loadOf(sem.courses, courses).index;
      t += idx * idx + Math.max(0, idx - 7) ** 2 * 6;
      // English is taken early in practice: nudge ENG courses toward the first semesters
      for (const c of sem.courses) if (c.startsWith("ENG")) t += sem.semester * sem.semester * 0.8;
      for (const c of sem.courses) t += prereqStatus(c, seen, sem.courses, courses).missingSoft.length * 14;
      sem.courses.forEach((c) => seen.add(c));
    }
    return t;
  };
  let best = cost();
  for (let pass = 0; pass < 6; pass++) {
    let improved = false;
    for (let a = 0; a < plan.length; a++) for (let b = a + 1; b < plan.length; b++)
      for (let i = 0; i < plan[a].courses.length; i++) for (let j = 0; j < plan[b].courses.length; j++) {
        const ca = plan[a].courses[i], cb = plan[b].courses[j];
        if (courses[ca].credits !== courses[cb].credits) continue;
        plan[a].courses[i] = cb; plan[b].courses[j] = ca;
        const c = valid() ? cost() : Infinity;
        if (c < best - 1e-6) { best = c; improved = true; } else { plan[a].courses[i] = ca; plan[b].courses[j] = cb; }
      }
    if (!improved) break;
  }
  plan.forEach((sem) => (sem.load = loadOf(sem.courses, courses)));
}

// opts: { targetCredits, maxLoad, eng102First }. CSE400 is shown across the last 3 semesters and credited in full at the end.
export function roadmap(startCompleted, semesters, opts = {}, courses = COURSES) {
  const eng = !!opts.eng102First, hid = hiddenCodes(eng);
  const done = new Set(startCompleted), plan = [];
  for (let i = 0; i < semesters; i++) {
    const prog = progress([...done], courses, { eng102First: eng });
    const open = openSlots(done, prog, courses, hid);
    if (!open.any) break;
    const r = suggestSemester({ ...opts, completed: done, pool: open.pool, accept: open.accept, eng102First: eng }, courses);
    if (!r.options.length) break;
    const pick = r.options[0];
    plan.push({ semester: i + 1, courses: pick.set, load: pick.load });
    pick.set.forEach((c) => done.add(c));
  }
  balanceLoad(plan, startCompleted, courses, hid);
  if (!done.has("CSE400")) {
    while (plan.length < 3) plan.push({ semester: plan.length + 1, courses: [], load: loadOf([], courses) });
    plan.slice(-3).forEach((sem, k) => (sem.project = { part: k + 1, of: 3 }));
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
  const hid = hiddenCodes(!!opts.eng102First);
  const prog = progress([...completed], courses, { eng102First: !!opts.eng102First });
  const stats = unlockStats(courses);
  const priority = makePriority(completed, courses, prog, stats);
  const needed = neededSet(prog);
  const pool = Object.keys(courses).filter((c) => !hid.has(c) && (includeElectives || courses[c].category !== "elective"));
  const earned = prog.earned;
  const advOk = (c) => (courses[c].advisory || []).every((a) => completed.has(a) || hid.has(a));
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
