"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { SITE } from "@/lib/site";

const Logo = ({ className, style }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
    <path d="M16 3 28 10v12L16 29 4 22V10Z" />
    <path d="M11 21V11l10 10V11" strokeLinecap="round" />
  </svg>
);

export default function Footer() {
  const footer = useRef(null), glow = useRef(null), text = useRef(null);

  useEffect(() => {
    const f = footer.current, g = glow.current, t = text.current;
    let raf = 0;
    const set = (gt, tt) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { g.style.transform = gt; t.style.transform = tt; }); };
    const move = (e) => {
      const r = f.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      set(`translate(calc(-50% + ${nx * 40}px), ${ny * 30}px)`, `translate(${nx * -15}px, calc(18% + ${ny * -10}px))`);
    };
    const leave = () => set("translate(-50%, 0)", "translate(0, 18%)");
    f.addEventListener("mousemove", move);
    f.addEventListener("mouseleave", leave);

    const items = [...f.querySelectorAll(".animate-item")];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold: 0.1 });
    items.forEach((el) => io.observe(el));
    return () => { f.removeEventListener("mousemove", move); f.removeEventListener("mouseleave", leave); io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  let d = 0;
  const delay = () => ({ transitionDelay: `${(d += 100)}ms` });

  const contacts = [
    { Icon: Mail, label: "E-mail", value: SITE.email, href: `mailto:${SITE.email}` },
    { Icon: Phone, label: "Number", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    { Icon: MapPin, label: "Location", value: SITE.location, href: "#", narrow: true },
  ];

  return (
    <footer ref={footer} id="about" className="relative z-0 overflow-hidden border-t border-slate-900/50 bg-page pb-8 pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 flex flex-col items-center justify-end overflow-hidden">
        <div ref={glow} className="footer-glow smooth-transform absolute bottom-[-150px] left-1/2 h-[500px] w-4/5 max-w-[1200px] -translate-x-1/2 rounded-[100%] bg-brand-500 opacity-40 blur-[130px]" />
        <div ref={text} className="footer-huge-text smooth-transform relative flex w-full translate-y-[18%] items-center justify-center gap-[2vw] text-[17vw] font-black leading-none tracking-tighter text-page">
          <Logo style={{ width: "13vw", height: "13vw" }} />
          PLANNER
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-24 grid grid-cols-1 gap-16 lg:mb-40 lg:grid-cols-2 lg:gap-8">
          <div>
            <div className="animate-item group mb-12 flex items-center gap-3" style={delay()}>
              <Logo className="h-8 w-8 text-brand-500 transition-transform duration-500 group-hover:rotate-180" />
              <span className="text-3xl font-bold tracking-tight text-white">{SITE.name}</span>
            </div>
            <h2 className="animate-item mb-12 max-w-xl text-4xl font-semibold leading-[1.1] text-white lg:text-5xl xl:text-6xl" style={delay()}>
              Plan smarter. <br />
              <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">Graduate on time.</span>
            </h2>
            <Link
              href="/planner/"
              className="animate-item inline-flex items-center justify-center rounded bg-brand-500 px-8 py-4 text-sm font-bold tracking-widest text-on-brand transition-all duration-300 hover:-translate-y-1 hover:bg-brand-400 hover:shadow-[0_10px_30px_-10px_rgba(40,88,168,0.6)]"
              style={delay()}
            >
              START PLANNING
            </Link>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-10 lg:mt-0 lg:pl-20 xl:pl-32">
            {contacts.map(({ Icon, label, value, href, narrow }) => (
              <a key={label} href={href} className="contact-card animate-item group flex cursor-pointer items-start gap-6" style={delay()}>
                <div className="icon-wrapper flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="pt-1">
                  <p className="mb-1 text-sm font-medium uppercase tracking-wider text-slate-500 transition-colors group-hover:text-slate-400">{label}</p>
                  <p className={`text-lg font-medium text-slate-200 transition-colors group-hover:text-brand-400 ${narrow ? "max-w-xs" : ""}`}>{value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="animate-item flex flex-col items-center justify-between gap-6 border-t border-slate-800/50 pt-10 md:flex-row" style={delay()}>
          <div className="text-center md:text-left">
            <p className="text-sm text-slate-500">&copy; 2026 {SITE.name}. An unofficial student tool.</p>
            <p className="text-sm text-slate-500">Not affiliated with BRAC University. Difficulty scores are estimates.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/#features" className="transition-colors hover:text-brand-400">Features</Link>
            <Link href="/planner/" className="transition-colors hover:text-brand-400">Planner</Link>
            <a href="https://cse.bracu.ac.bd/course/list" className="transition-colors hover:text-brand-400">Course list</a>
            <a
              href={SITE.linkedin}
              aria-label="LinkedIn"
              className="ml-2 flex h-9 w-9 items-center justify-center rounded bg-brand-500 text-on-brand transition-all hover:-translate-y-1 hover:bg-brand-400 hover:shadow-[0_4px_15px_-3px_rgba(40,88,168,0.5)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11.5H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.77 2.65 4.77 6.1v5.85h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4V9.75Z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
