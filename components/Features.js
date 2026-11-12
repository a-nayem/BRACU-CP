"use client";
import { useEffect, useRef } from "react";
import { ShieldCheck, Gauge, Sparkles, Map, TrendingUp, CalendarClock } from "lucide-react";

const FEATURES = [
  { Icon: ShieldCheck, color: "#5b8bd4", title: "Prerequisite Checking", text: "Hard prerequisites block a course and soft ones warn you, straight from the official BRACU CSE course list." },
  { Icon: Gauge, color: "#38bdf8", title: "Semester Load Score", text: "Six difficulty factors roll up into one load index with clear bands, from Light to Extreme." },
  { Icon: Sparkles, color: "#34d399", title: "Strategy-based Plans", text: "Four plans per semester: sustainable, heavy pressure, best CG and risky but worth a shot." },
  { Icon: Map, color: "#fbbf24", title: "Graduation Roadmap", text: "See every remaining semester mapped out against the 136-credit programme." },
  { Icon: TrendingUp, color: "#c8cfcf", title: "CGPA Tracker", text: "Enter grades, watch your CGPA, and see what grades a target would need." },
  { Icon: CalendarClock, color: "#818cf8", title: "Clash Checker", text: "Enter your own section times and spot overlaps before registration opens." },
];

export default function Features() {
  const root = useRef(null);

  useEffect(() => {
    const els = [...root.current.querySelectorAll(".fade-up")];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = els.indexOf(e.target);
        e.target.style.transitionDelay = `${i * 100}ms`;
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }),
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));

    const cards = [...root.current.querySelectorAll(".glass-card")];
    const move = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
    };
    cards.forEach((c) => c.addEventListener("mousemove", move));
    return () => { io.disconnect(); cards.forEach((c) => c.removeEventListener("mousemove", move)); };
  }, []);

  return (
    <section ref={root} id="features" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24">
      {/* No background video supplied: layered BRAC-blue gradients instead */}
      <div className="absolute inset-0 -z-10 bg-[#030610]" />
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 20% 20%, rgba(40,88,168,0.35), transparent 70%), radial-gradient(50% 50% at 85% 80%, rgba(91,139,212,0.18), transparent 70%)" }} />
      <div className="absolute inset-0 -z-10 bg-black/40" />

      <div className="mx-auto w-full max-w-[1100px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="fade-up flex flex-col justify-start md:col-span-2 lg:col-span-1 lg:row-span-2">
            <h2 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-[56px]">Core Features</h2>
            <p className="max-w-sm pr-4 text-lg leading-relaxed text-[#a1a1aa] lg:max-w-none">
              Everything you need to choose your courses, balance your workload and reach graduation with confidence.
            </p>
          </div>
          <div className="hidden lg:col-span-1 lg:block" />
          {FEATURES.map(({ Icon, color, title, text }) => (
            <article key={title} className="glass-card fade-up flex flex-col items-center rounded-[24px] p-8 text-center">
              <div className="mb-6 h-12 w-12 transition-transform duration-300 hover:scale-110" style={{ color, filter: `drop-shadow(0 0 15px ${color}80)` }}>
                <Icon className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="mb-2.5 text-[17px] font-medium text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-[#a1a1aa]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
