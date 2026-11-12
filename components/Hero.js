"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import HeroContent from "./HeroContent";

const ThreeScene = dynamic(() => import("./three/ThreeScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-page" />,
});

export default function Hero() {
  return (
    <section id="home" className="relative h-screen min-h-[800px] w-full overflow-hidden bg-page">
      <ThreeScene />
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="mx-auto flex w-full max-w-7xl px-6 lg:px-12">
          <HeroContent />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <div className="flex h-9 w-5 justify-center rounded-full border border-white/20 pt-2">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(91,139,212,0.9)]"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <span className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-500">Scroll to discover</span>
      </div>
    </section>
  );
}
