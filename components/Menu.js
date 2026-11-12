"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

const CARDS = [
  {
    title: "Make a Course Plan",
    text: "Get four algorithm-built semester plans from your completed courses, then swap any course and see the result change live.",
    cta: "Start planning", href: "/planner/#plan", rgb: "40, 88, 168", text400: "#5b8bd4", stroke: "#5b8bd4",
    art: (
      <g fill="none" strokeWidth="1.8">
        <path className="graphic-path" d="M200 60 L290 110 L200 160 L110 110 Z" />
        <path className="graphic-path" d="M200 100 L290 150 L200 200 L110 150 Z" opacity=".7" />
        <path className="graphic-path" d="M200 140 L290 190 L200 240 L110 190 Z" opacity=".45" />
      </g>
    ),
  },
  {
    title: "Graduation Roadmap",
    text: "Map every remaining semester up to 136 credits, with each term's load balanced and prerequisites in the right order.",
    cta: "View roadmap", href: "/planner/#roadmap", rgb: "16, 185, 129", text400: "#34d399", stroke: "#34d399",
    art: (
      <g fill="none" strokeWidth="1.8">
        <path className="guide" d="M60 220 H340 M60 160 H340 M60 100 H340" strokeDasharray="6 8" opacity=".35" />
        <path className="graphic-path" d="M70 220 L140 170 L200 190 L270 110 L330 70" />
        <path className="graphic-path" d="M300 66 L332 68 L322 98" />
      </g>
    ),
  },
  {
    title: "Check a Plan",
    text: "Test any set of courses for missing prerequisites, section clashes and an overall load score before you register.",
    cta: "Check my plan", href: "/planner/#plan", rgb: "245, 158, 11", text400: "#fbbf24", stroke: "#fbbf24",
    art: (
      <g fill="none" strokeWidth="1.6">
        <circle className="graphic-path" cx="220" cy="150" r="30" />
        <circle className="graphic-path" cx="220" cy="150" r="60" />
        <circle className="guide" cx="220" cy="150" r="90" strokeDasharray="6 8" />
        <circle className="graphic-path" cx="270" cy="105" r="5" />
        <circle className="graphic-path" cx="170" cy="190" r="5" />
        <circle className="graphic-path" cx="250" cy="220" r="5" />
      </g>
    ),
  },
  {
    title: "CGPA Tracker",
    text: "Enter your grades, see your CGPA, and find out which grades you need to reach a target.",
    cta: "Track my CGPA", href: "/planner/#cgpa", rgb: "160, 168, 168", text400: "#c8cfcf", stroke: "#c8cfcf",
    art: (
      <g fill="none" strokeWidth="1.6">
        <path className="graphic-path" d="M200 70 L270 110 L270 190 L200 230 L130 190 L130 110 Z" />
        <path className="guide" d="M200 70 V150 M130 110 L200 150 L270 110" strokeDasharray="6 8" />
        <circle className="graphic-path" cx="200" cy="150" r="9" />
        <path className="guide" d="M270 110 L340 80 M130 190 L60 220" strokeDasharray="6 8" />
      </g>
    ),
  },
];

export default function Menu() {
  const refs = useRef([]);

  useEffect(() => {
    const draw = (card) => {
      card.querySelectorAll(".graphic-path").forEach((p) => {
        p.style.transition = "none";
        p.style.strokeDashoffset = "1000";
        void p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)";
        p.style.strokeDashoffset = "0";
      });
    };
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const card = e.target;
          const i = refs.current.indexOf(card);
          card.style.transitionDelay = `${i * 150}ms`;
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
          setTimeout(() => { card.style.transitionDelay = "0ms"; }, 900 + i * 150);
          draw(card);
          io.unobserve(card);
        }),
      { threshold: 0.15 }
    );
    refs.current.forEach((c) => c && io.observe(c));
    const hovers = refs.current.map((c) => {
      const f = () => draw(c);
      c.addEventListener("mouseenter", f);
      return [c, f];
    });
    return () => { io.disconnect(); hovers.forEach(([c, f]) => c.removeEventListener("mouseenter", f)); };
  }, []);

  return (
    <section id="menu" className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0a0f1c] py-24">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 10%, rgba(40,88,168,0.12), transparent 40%), radial-gradient(circle at 85% 90%, rgba(160,168,168,0.06), transparent 40%)" }} />
      <div className="relative mx-auto w-full max-w-7xl space-y-12 p-4 sm:space-y-16 sm:p-8 lg:p-12">
        <header className="text-center">
          <p className="mb-3 text-xl font-medium text-[#94a3b8]">What would you like to do?</p>
          <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">Pick Your Path</h2>
        </header>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          {CARDS.map((c, i) => (
            <article
              key={c.title}
              ref={(el) => (refs.current[i] = el)}
              style={{ "--rgb": c.rgb, opacity: 0, transform: "translateY(48px)", transition: "opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1), background 500ms, border-color 500ms, box-shadow 500ms" }}
              className="svc-card group relative min-h-[340px] overflow-hidden rounded-[2rem] backdrop-blur-md sm:min-h-[380px]"
            >
              <div className="svc-grid pointer-events-none absolute inset-0" />
              <div className="absolute inset-y-0 right-0 w-1/2" style={{ animationDelay: `${-i}s` }}>
                <div className="svc-art h-full w-full" style={{ animationDelay: `${-i}s` }}>
                  <svg viewBox="0 0 400 300" className="h-full w-full" fill="none" stroke={c.stroke} aria-hidden="true" preserveAspectRatio="xMidYMid meet">{c.art}</svg>
                </div>
              </div>
              <div className="relative z-10 flex h-full min-h-[340px] w-full flex-col justify-between p-8 sm:min-h-[380px] sm:w-3/4 sm:p-10 lg:w-2/3">
                <div>
                  <h3 className="mb-4 text-2xl font-medium text-white sm:text-3xl">{c.title}</h3>
                  <p className="text-base leading-relaxed text-[#94a3b8] sm:text-lg">{c.text}</p>
                </div>
                <div className="mt-8">
                  <Link
                    href={c.href}
                    className="inline-flex items-center gap-2 rounded-full border border-[#1f2b45] bg-[#0a0f1c]/50 px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                    style={{ color: c.text400 }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `rgba(${c.rgb}, .4)`; e.currentTarget.style.background = `rgba(${c.rgb}, .1)`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.background = ""; }}
                  >
                    {c.cta}
                    <svg className="svc-arrow h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-[#94a3b8] sm:text-xl">
          <span className="font-medium tracking-wide text-white">CSE Planner</span> is an unofficial student tool. Prerequisites follow the
          BRACU CSE course list; difficulty scores are estimates, not official ratings.
        </footer>
      </div>
    </section>
  );
}
