# BRACU CSE Course Planner

Unofficial student tool. Static Next.js site (no backend, no accounts). Plans are saved in the browser only.

## What it does
- Prerequisite checks from the official BRACU CSE course list (hard prerequisites block, soft ones warn)
- Load score per semester (Light to Extreme) from the difficulty workbook
- Four strategy plans for next semester: Sustainable, Heavy pressure, Best CG optimization, Risky but worth a shot
- Swap any course and see the load, tag and warnings change live
- Roadmap to 136 credits, CGPA tracker with target calculator, optional section clash check

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run build      # static export into ./out
```

## Deploy on GitHub Pages
1. Push this folder to a GitHub repo (branch `main`).
2. Repo Settings > Pages > Source = **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` tests, builds and publishes on every push. It sets `NEXT_PUBLIC_REPO_NAME` to the repo name automatically, so assets load from `https://<user>.github.io/<repo>/`.
4. For a custom domain, Vercel or Cloudflare Pages, build with `NEXT_PUBLIC_REPO_NAME` empty.

## Edit before you publish
- `lib/site.js`: footer e-mail, phone, location and LinkedIn (placeholders until you fill them in)
- `lib/data.js`: degree rules (`DEGREE`). Elective credits are computed as the remainder of 136, so set the real number for your cohort
- `public/bracu-logo.png`: the transparent logo texture shown in the 3D hero (higher resolution than 169px will look sharper)

## Data
- `scripts/build_data.py` rebuilds `lib/courses.generated.js` from the workbook plus the official prerequisite list. Edit its `OFFICIAL` map when BRACU changes prerequisites, then run `npm run data`.
- Difficulty scores are analyst estimates, not official BRACU ratings.
- HP/SP on the official page are assumed to mean hard/soft prerequisite.

## Layout
- `app/page.js` landing: 3D hero, menu, features, footer
- `app/planner/page.js` planner
- `lib/engine.js` all algorithms (prerequisites, load, strategies, roadmap, CGPA, clashes)
