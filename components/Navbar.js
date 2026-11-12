"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Home", href: "/#home" },
  { label: "Menu", href: "/#menu" },
  { label: "Features", href: "/#features" },
  { label: "Planner", href: "/planner/" },
  { label: "About", href: "/#about" },
];

export default function Navbar({ solid = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || solid
          ? "py-4 bg-[#030610]/60 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          : "py-8 bg-transparent border-b border-transparent"
      }`}
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative">
            <Hexagon className="h-7 w-7 text-brand-400" strokeWidth={1.75} />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-sm bg-brand-300/60 blur-[3px]" />
          </span>
          <span className="font-bold tracking-[0.2em] text-white">CSE PLANNER</span>
        </Link>

        <div className="hidden items-center gap-12 md:flex">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="text-sm text-gray-400 transition-colors hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/planner/"
            className="hidden items-center gap-2.5 rounded-full border border-white/10 px-5 py-2 text-sm text-gray-200 transition-colors hover:bg-white/5 hover:text-white md:inline-flex"
          >
            <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(40,88,168,0.9)]" />
            Get Started
          </Link>
          <button
            className="text-white md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 top-full bg-[#030610]/95 p-6 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-5">
              {LINKS.map((l) => (
                <Link key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-lg text-gray-300 hover:text-white">
                  {l.label}
                </Link>
              ))}
              <Link
                href="/planner/"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-full border border-white/10 py-3 text-center text-white"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
