# BRACU CSE Course Planner - Product Requirements Document

Version 1.0 - 12 Nov 2026
Owner: Alif Nayem (Ayanokouji)
Status: v1 built. Landing (3D hero, menu, features, footer) and planner (four strategies, live swap, roadmap, CGPA, clash check) are working. See README.md.

---

## 1. Summary

A static, no-backend web app that helps a BRACU CSE student decide which courses to take each semester. It validates prerequisites, estimates how heavy a course combination is, suggests a balanced semester load, tracks CGPA and graduation progress, and checks section time clashes. All course data lives in one `data.js` file. All logic is custom algorithmic code in `engine.js`. No accounts, no database.

Goal: good performance with less hassle. The planner should steer a student away from stacking several very hard courses in one semester and toward the order that unlocks the most later courses.

## 2. Goals and non-goals

### Goals
- Full CSE curriculum with math, physics and GenEd, using short course codes
- Official prerequisite checking (hard blocks, soft warnings)
- Semester load scoring with named bands (Light to Extreme)
- Suggested course sets for a target credit load and a maximum difficulty ceiling
- Multi-semester roadmap to graduation
- CGPA calculator and graduation progress against 136 credits
- Section clash checker using times the student enters
- Free deploy on GitHub Pages as a static site

### Non-goals
- Live registration, login to the BRACU portal or fetching section data from BRACU
- Accounts, cloud sync or a database
- Official difficulty ratings (scores are analyst estimates and the UI must say so)
- Postgraduate courses (CSE700 and above)

## 3. Users

- Primary: BRACU CSE undergraduates planning the next semester or the whole degree
- Secondary: advisors or friends who open a shared plan link

## 4. Data sources and rules

| Data | Source | Notes |
|---|---|---|
| Prerequisites | https://cse.bracu.ac.bd/course/list (fetched 11 Nov 2026) | HP = hard, SP = soft. Meanings are assumed, the page does not define them |
| Difficulty scores, credits, categories | `BRACU_CSE_Course_Difficulty_and_Planning_Research.xlsx` | Formula: 0.20 Math + 0.20 Conceptual + 0.15 Lab + 0.15 Syllabus + 0.15 Tricky exam + 0.15 Assignment |
| Load bands | Same workbook, Scoring and Method sheet | 1.0-3.0 Light, 3.1-4.5 Manageable, 4.6-6.0 Moderate-heavy, 6.1-7.5 Heavy, 7.6-9.0 Very heavy, 9.1-10 Extreme |
| GenEd rules | Same workbook | 39 credits, 13 courses, 5 streams (Fall 2020 onward) |

Conflict rule: when the workbook and the course list disagree on a prerequisite, the course list wins.

Known assumptions to verify:
1. HP means hard prerequisite, SP means soft (can be taken together)
2. CSE400 appears only after 100 earned credits
3. Foundation sequencing (MAT110 > MAT120 > MAT215 > MAT216, PHY111 > PHY112, ENG101 > ENG102) is advisory only and never blocks
4. CSE400 has placeholder scores and credits
5. Elective credit requirement is computed as the remainder of 136 and needs the real degree-plan number
6. About 25 elective courses are not on the official list and are flagged "not on official list"

## 5. Functional requirements

### FR1 - Course catalogue
- Searchable, filterable list (by group, category, difficulty, lab, math)
- Course card shows code, name, credits, six sub-scores, weighted difficulty, prerequisites, unlocks count
- Badges: "Not on official list", "Placeholder", "Estimate"

### FR2 - Student state
- Mark courses as completed, in progress or planned
- Enter grades per completed course
- Persist in `localStorage` (try/catch around every access)
- Export and import as JSON
- Share a plan by encoding state into the URL hash (no server)

### FR3 - Prerequisite validation
- Hard prerequisite missing: course is blocked, show which ones
- Soft prerequisite missing: warning, cleared if the soft course is in the same semester
- Hard prerequisites do not count when taken in the same semester
- Advisory chains influence suggestions only

### FR4 - Semester load
- Input: a set of courses
- Output: load index, band, average difficulty, credits, counts of high-intensity (>= 7.5), lab-heavy (>= 7), math-heavy (>= 7.5) and concept-heavy (>= 8) courses
- Index = average + 0.33 x high + 0.14 x lab + 0.20 x math, plus 0.2 per credit above 12, capped at 10
- Weights were fitted to the workbook's Combo Examples (error within about 0.3)

### FR5 - Semester suggestion
- Inputs: completed set, target credits (9, 12 or 15), maximum load, must-take list, excluded list, include electives toggle
- Search: exhaustive over the top 18 eligible candidates
- Score favours required courses, courses with many dependents and long chains after them, and penalises exceeding the load ceiling and missing soft prerequisites
- Output: top 5 options with load breakdown and a short reason per course

### FR6 - Roadmap
- Chain suggestions across N semesters until graduation
- Show per-semester load band and total credits remaining
- Let the user lock a semester and regenerate the rest

### FR7 - Graduation progress
- Core, foundation, project, GenEd (per stream status with fixed courses) and elective credits
- Credits earned against 136 and remaining credits

### FR8 - CGPA
- 4.0 scale (A 4.0, A- 3.7, B+ 3.3, B 3.0, B- 2.7, C+ 2.3, C 2.0, D 1.0, F 0)
- Retakes: latest grade wins
- What-if: required grades to reach a target CGPA

### FR9 - Clash checker
- Student enters section days and times per course
- Detects overlaps across selected courses and names the conflicting pair
- Times are entered by the student, never fetched

### FR10 - Views
Two views are required. Their layout, look and content will be defined by the two prompts supplied by the owner.

- View A: pending prompt
- View B: pending prompt

## 6. Non-functional requirements

- Static export, no server runtime
- All computation client-side, under 100 ms for a suggestion
- Works offline after first load
- Responsive from 360 px wide phones up
- Accessible: keyboard navigable, contrast AA, no colour-only meaning
- No tracking and no external requests at runtime
- Every score shown as an estimate, with the source and date

## 7. Architecture

```
planner/
  app/                    Next.js App Router
    layout.js
    page.js               View A (placeholder until prompt)
    plan/page.js          View B (placeholder until prompt)
  components/             Course card, load meter, semester board, clash editor
  lib/
    data.js               Generated course data and degree config
    engine.js             Prerequisites, load, suggestions, roadmap, CGPA, clashes
    store.js              State, localStorage and URL-hash sync
  tests/engine.test.mjs   Unit tests for the engine
  scripts/build_data.py   Regenerates data.js from the workbook
  public/
  next.config.mjs
  package.json
  .github/workflows/deploy.yml
```

Stack: Next.js (App Router), React, plain CSS or Tailwind, Node test runner for engine tests. No UI state library needed beyond React context.

## 8. Deploying on GitHub

The app is a static export hosted on GitHub Pages.

1. `next.config.mjs`:
   ```js
   const repo = process.env.NEXT_PUBLIC_REPO_NAME || "";
   export default {
     output: "export",
     images: { unoptimized: true },
     basePath: repo ? `/${repo}` : "",
     assetPrefix: repo ? `/${repo}/` : "",
     trailingSlash: true,
   };
   ```
2. Create a GitHub repo, for example `a-nayem/bracu-cse-planner`, and push the project
3. In the repo: Settings > Pages > Source = GitHub Actions
4. Add `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy
   on:
     push: { branches: [main] }
   permissions: { contents: read, pages: write, id-token: write }
   concurrency: { group: pages, cancel-in-progress: true }
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: npm }
         - run: npm ci
         - run: npm test
         - run: npm run build
           env: { NEXT_PUBLIC_REPO_NAME: bracu-cse-planner }
         - uses: actions/upload-pages-artifact@v3
           with: { path: out }
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
       steps:
         - id: d
           uses: actions/deploy-pages@v4
   ```
5. Live at `https://a-nayem.github.io/bracu-cse-planner/`
6. Custom domain or Vercel or Cloudflare Pages work with the same static build (leave `NEXT_PUBLIC_REPO_NAME` empty)

## 9. Testing and acceptance

Engine tests (must pass in CI):
- Difficulty recomputation equals the workbook for every course
- Load index within 0.35 of the eight workbook combos
- CSE321 with CSE221 done and CSE340 planned together: OK, no warning
- CSE420 without CSE331: blocked
- CSE400 suggested only at or above 100 earned credits
- Roadmap from CSE110 never places a course before its hard prerequisites
- Clash detection: overlapping slots flagged, back-to-back slots not flagged
- CGPA matches hand calculation, retake uses latest grade

Acceptance:
- A new student can pick completed courses and get a 12-credit suggestion in under a minute
- Shared URL reproduces the same plan on another device
- `npm run build` outputs a static `out/` folder with no runtime errors
- Lighthouse accessibility score of 90 or higher

## 10. Milestones

| # | Milestone | Status |
|---|---|---|
| M1 | Data layer from workbook and course list | Done |
| M2 | Engine with tests against workbook combos | Done (CI tests to be added) |
| M3 | Project scaffold, static export and GitHub Pages workflow | Next |
| M4 | View A from owner prompt | Blocked on prompt |
| M5 | View B from owner prompt | Blocked on prompt |
| M6 | State persistence, JSON export and share link | After views |
| M7 | CGPA, clash editor and roadmap screens | After views |
| M8 | Accessibility pass, mobile pass, deploy | Final |

## 11. Risks

- Prerequisite data can change each semester: keep `build_data.py` and re-run it, show the data date in the footer
- Difficulty scores are estimates: label them clearly and allow user overrides per course
- Degree plans differ by cohort: keep `DEGREE` config editable and document it
- Section times are not available from BRACU: manual entry only

## 12. Open questions

1. The two view prompts (blocking M4 and M5)
2. Real elective credit requirement and any cohort-specific core changes
3. Confirm HP and SP meanings
4. GitHub repo name and whether to use a custom domain
5. Should users be able to override a course's difficulty score
