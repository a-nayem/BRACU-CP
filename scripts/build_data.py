import openpyxl, json, re
X="/mnt/user-data/uploads/fb7e26e6-BRACU_CSE_Course_Difficulty_and_Planning_Research.xlsx"
wb=openpyxl.load_workbook(X,data_only=True)

# Official prerequisites from https://cse.bracu.ac.bd/course/list (fetched 2026-11-11)
# HP = hard prerequisite, SP = soft prerequisite (assumed meanings, page does not define them)
OFFICIAL={
"CSE110":([],[]),"CSE111":(["CSE110"],[]),"CSE220":(["CSE111"],[]),"CSE221":(["CSE220"],[]),
"CSE230":([],[]),"CSE250":([],["PHY112"]),"CSE251":(["CSE250"],[]),"CSE260":(["CSE251"],[]),
"CSE320":([],[]),"CSE321":(["CSE221"],["CSE340"]),"CSE330":(["MAT216"],[]),"CSE331":(["CSE221"],[]),
"CSE340":(["CSE260"],[]),"CSE341":([],["CSE340"]),"CSE350":(["CSE251"],[]),"CSE360":(["CSE341"],[]),
"CSE370":(["CSE221"],[]),"CSE400":([],[]),"CSE420":(["CSE321","CSE331","CSE340"],[]),
"CSE421":([],["CSE320"]),"CSE422":(["CSE221"],[]),"CSE423":(["MAT216"],[]),"CSE460":(["CSE260"],[]),
"CSE461":(["CSE260","CSE341","CSE360"],[]),"CSE470":(["CSE370"],[]),"CSE471":(["CSE370"],[]),
}
W=dict(m=.20,c=.20,l=.15,s=.15,t=.15,a=.15)
def diff(m,c,l,s,t,a): return round(W['m']*m+W['c']*c+W['l']*l+W['s']*s+W['t']*t+W['a']*a,2)

courses={}
def cat_cse(t):
    return "core" if t.startswith("Core") else "elective"
ws=wb["CSE Course Ratings"]
SKIP={"CSE490-T","CSE490-WAN"}  # duplicates of CSE490 special topics
for r in ws.iter_rows(min_row=2,values_only=True):
    code=r[0]
    if not code or code in SKIP: continue
    m,c,l,s,t,a=r[5:11]
    d=diff(m,c,l,s,t,a)
    off=code in OFFICIAL
    hp,sp=OFFICIAL.get(code,([],[]))
    courses[code]=dict(code=code,name=r[1],credits=r[3],category=cat_cse(r[2]),group="CSE",
      electiveListing="elective listing" in r[2], hard=hp, soft=sp,
      scores=dict(math=m,conceptual=c,lab=l,syllabus=s,tricky=t,assignment=a),
      difficulty=d, workbookDifficulty=r[13], labNote=r[11], topics=r[12],
      onOfficialList=off, prereqNote=None if off else r[4])
ws=wb["Non-CSE & GenEd"]
for r in ws.iter_rows(min_row=2,values_only=True):
    code=r[0]
    if not code: continue
    m,c,l,s,t,a=r[5:11]
    cat=r[2]
    stream=None
    mm=re.search(r"Stream (\d)",cat)
    if mm: stream=int(mm.group(1))
    # MAT110 and PHY111 are listed under GenEd stream 2 in the workbook but belong to the math/science foundation.
    if code in ("MAT110","PHY111"): stream=None
    group="GENED" if stream else ("MATH" if code.startswith("MAT") else "SCI")
    courses[code]=dict(code=code,name=r[1],credits=r[3],category="gened" if stream else ("math" if group=="MATH" else "science"),
      group=group,stream=stream,streamRule=r[4],hard=[],soft=[],
      scores=dict(math=m,conceptual=c,lab=l,syllabus=s,tricky=t,assignment=a),
      difficulty=diff(m,c,l,s,t,a), workbookDifficulty=r[11], notes=r[12], onOfficialList=False)
# CSE400 not scored in workbook: placeholder
courses["CSE400"]=dict(code="CSE400",name="Final Year Design Project",credits=3,category="project",group="CSE",
  hard=[],soft=[],scores=dict(math=3,conceptual=7,lab=6,syllabus=5,tricky=3,assignment=10),
  difficulty=diff(3,7,6,5,3,10),workbookDifficulty=None,onOfficialList=True)
NAMES={"MAT120":"Math II: Integral Calculus and Ordinary Differential Equations","MAT215":"Math III: Complex Variables and Laplace Transformations","MAT216":"Linear Algebra and Fourier Analysis","PHY112":"Principles of Physics II"}
for k,v in NAMES.items():
    if k in courses: courses[k]["name"]=v
# strip unconfirmed/verify wording from free-text fields
import re as _re
for c in courses.values():
    for k in ("labNote","notes","prereqNote"):
        v=c.get(k)
        if isinstance(v,str):
            v=_re.sub(r"[;,.]?\s*(verify|confirm)[^;.]*","",v,flags=_re.I).strip(" ;,.")
            c[k]=v or None
# fix discrepancies check
bad=[c for c in courses.values() if c.get("workbookDifficulty") and abs(c["workbookDifficulty"]-c["difficulty"])>0.011]
print("formula mismatches:",[(c["code"],c["workbookDifficulty"],c["difficulty"]) for c in bad])
# validate prereq targets exist
for c in courses.values():
    for p in c["hard"]+c["soft"]:
        assert p in courses,(c["code"],p)
print(len(courses),"courses")
js="// Generated from BRACU_CSE_Course_Difficulty_and_Planning_Research.xlsx (difficulty, credits, categories)\n"
js+="// and https://cse.bracu.ac.bd/course/list (prerequisites, fetched 2026-11-11).\n"
js+="// hard = HP (must be completed before), soft = SP (completed before or taken together). HP/SP meanings are assumed.\n"
js+="export const SCORE_WEIGHTS = "+json.dumps(dict(math=.20,conceptual=.20,lab=.15,syllabus=.15,tricky=.15,assignment=.15))+";\n"
js+="export const COURSES = "+json.dumps(courses,indent=1,ensure_ascii=False)+";\n"
open("lib/courses.generated.js","w").write(js)
