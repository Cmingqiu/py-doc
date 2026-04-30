"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Step } from "@/types/visualizer";

interface CodeStepperProps {
  code: string;
  steps: Step[];
  currentStep: number;
}

export default function CodeStepper({ code, steps, currentStep }: CodeStepperProps) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const highlightLine = currentStep >= 0 ? steps[currentStep]?.line : -1;
  const lineNumWidth = String(lines.length).length;
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightLine < 0 || !containerRef.current) return;
    const lineEl = containerRef.current.querySelector(`[data-line="${highlightLine}"]`);
    lineEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightLine]);

  return (
    <div ref={containerRef} className="h-full overflow-auto rounded-lg bg-zinc-900 text-sm">
      <table className="w-full border-collapse font-mono">
        <tbody>
          {lines.map((line, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === highlightLine;

            return (
              <tr
                key={`${id}-${lineNum}`}
                data-line={lineNum}
                className={`relative transition-colors duration-200 ${
                  isActive ? "bg-blue-500/20" : "hover:bg-white/5"
                }`}
              >
                <td className="select-none px-3 py-0.5 text-right text-zinc-600 w-[1%] whitespace-nowrap">
                  {String(lineNum).padStart(lineNumWidth)}
                </td>
                <td className="px-4 py-0.5 whitespace-pre">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="highlight"
                        className="absolute inset-0 rounded-sm border-l-2 border-blue-400 bg-blue-500/10"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <span className="relative z-10 text-zinc-100">{line || " "}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
