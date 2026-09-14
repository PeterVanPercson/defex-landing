"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The two original sets of 36 Bézier curves. Stable timing avoids restarting
// the animation on a render and makes server/client output deterministic.
function FloatingPaths({ position, active }: { position: number; active: boolean }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => {
        const d = `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;
        const stroke = { d, stroke: "currentColor", strokeWidth: 0.5 + i * 0.03, strokeOpacity: Math.min(1, 0.1 + i * 0.03) };
        return active ? (
          <motion.path
            key={i}
            {...stroke}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{ pathLength: 1, opacity: [0.3, 0.6, 0.3], pathOffset: [0, 1, 0] }}
            transition={{ duration: 20 + ((i * 7) % 10), repeat: Infinity, ease: "linear" }}
          />
        ) : <path key={i} {...stroke} opacity={0.45} />;
      })}
    </svg>
  );
}

export function BackgroundPaths({
  title = "Background Paths",
  decorativeOnly = false,
  className,
}: {
  title?: string;
  decorativeOnly?: boolean;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const visible = useInView(container);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const active = visible && pageVisible && !paused && !reducedMotion;

  return (
    <div ref={container} className={cn("background-paths", !decorativeOnly && "background-paths--demo", className)}>
      <div className="background-paths__lines pointer-events-none absolute inset-0" aria-hidden="true">
        <FloatingPaths position={1} active={active} />
        <FloatingPaths position={-1} active={active} />
      </div>
      {!decorativeOnly && (
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-5xl font-semibold tracking-tighter sm:text-7xl md:text-8xl">
            {title.split(" ").map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                className="mr-4 inline-block last:mr-0"
                initial={reducedMotion ? false : { y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
              >{word}</motion.span>
            ))}
          </h1>
        </div>
      )}
      {!reducedMotion && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="background-paths__toggle"
          aria-pressed={paused}
          aria-label="Pause background animation"
          onClick={() => setPaused(!paused)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5 10 6 3 10.5Z" /> : <path d="M2.5 2h2v8h-2zM7.5 2h2v8h-2z" />}
          </svg>
          {paused ? "Play motion" : "Pause motion"}
        </Button>
      )}
    </div>
  );
}
