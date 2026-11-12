"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.15, delayChildren: 0.6 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } };

export default function HeroContent() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pointer-events-none flex w-full flex-col items-center justify-start pt-32 text-center md:h-full md:w-[45%] md:items-start md:justify-center md:pt-0 md:text-left"
    >
      <motion.div variants={item} className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-300">
        <Zap className="h-4 w-4 text-brand-400" /> Built for BRACU CSE
      </motion.div>

      <motion.h1 variants={item} className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-[5rem]">
        Plan Your <br /> Smarter <br />
        <span className="relative inline-block">
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent opacity-40 blur-xl dark:opacity-100 dark:mix-blend-screen">
            Semesters
          </span>
          <span className="relative bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">Semesters</span>
        </span>
      </motion.h1>

      <motion.p variants={item} className="mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-400 md:text-xl">
        Check prerequisites, balance course difficulty and map your road to 136 credits. Built on the official BRACU CSE course
        list, with load scoring you can adjust course by course.
      </motion.p>

      <motion.div variants={item} className="pointer-events-auto mt-10 flex flex-wrap justify-center gap-4 md:justify-start">
        <Link
          href="/planner/"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#214b91] to-[#4a7fd0] px-8 py-4 font-medium text-on-brand shadow-[0_0_20px_rgba(40,88,168,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(91,139,212,0.6)]"
        >
          Make a Course Plan
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/#features"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-sunken px-8 py-4 font-medium text-white transition-all hover:bg-white/5"
        >
          Explore Features
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
