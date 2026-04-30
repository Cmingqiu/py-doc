"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Step } from "@/types/visualizer";

interface CallStackProps {
  steps: Step[];
  currentStep: number;
}

function getCallStack(steps: Step[], upTo: number): string[] {
  let stack: string[] = [];
  for (let i = 0; i <= upTo; i++) {
    const s = steps[i];
    if (s.callStack) {
      stack = [...s.callStack];
    }
  }
  return stack;
}

export default function CallStack({ steps, currentStep }: CallStackProps) {
  const stack = currentStep >= 0 ? getCallStack(steps, currentStep) : [];

  return (
    <div className="rounded-lg bg-zinc-900 p-4 h-full overflow-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        调用栈
      </h3>
      {stack.length === 0 ? (
        <p className="text-zinc-600 text-sm italic">栈为空</p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {stack.map((frame, i) => (
              <motion.div
                key={`${frame}-${i}`}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`font-mono text-sm px-3 py-1.5 rounded ${
                  i === stack.length - 1
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {frame}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
