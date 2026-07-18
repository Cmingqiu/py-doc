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
    <div className="rounded-lg p-4 h-full overflow-auto" style={{ background: 'var(--bg-card)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        调用栈
      </h3>
      {stack.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>栈为空</p>
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
                  i === stack.length - 1 ? "ring-1" : ""
                }`}
                style={i === stack.length - 1 ? {
                  background: 'var(--code-highlight)',
                  color: 'var(--accent-secondary)',
                  borderColor: 'var(--accent-primary)'
                } : {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)'
                }}
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
