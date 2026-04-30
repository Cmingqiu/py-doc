'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Step, StepVar } from '@/types/visualizer';

interface VariableTrackerProps {
  steps: Step[];
  currentStep: number;
}

function collectVars(steps: Step[], upTo: number): Record<string, StepVar> {
  const vars: Record<string, StepVar> = {};
  for (let i = 0; i <= upTo; i++) {
    const s = steps[i];
    if (!s) continue;
    for (const [key, val] of Object.entries(s?.vars ?? {})) {
      if (val.value !== undefined) {
        vars[key] = val;
      }
    }
  }
  return vars;
}

export default function VariableTracker({
  steps,
  currentStep
}: VariableTrackerProps) {
  const vars = currentStep >= 0 ? collectVars(steps, currentStep) : {};
  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const changedKeys = new Set(
    currentStepData
      ? Object.entries(currentStepData.vars ?? {})
          .filter(([, v]) => v.changed)
          .map(([k]) => k)
      : []
  );

  return (
    <div className='rounded-lg bg-zinc-900 p-4 h-full overflow-auto'>
      <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3'>
        变量追踪
      </h3>
      {Object.keys(vars).length === 0 ? (
        <p className='text-zinc-600 text-sm italic'>尚未创建变量</p>
      ) : (
        <div className='space-y-2'>
          <AnimatePresence mode='popLayout'>
            {Object.entries(vars).map(([name, val]) => (
              <motion.div
                key={name}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                  changedKeys.has(name)
                    ? 'bg-amber-500/15 ring-1 ring-amber-500/30'
                    : 'bg-zinc-800'
                }`}>
                <span className='font-mono text-sm text-blue-300 shrink-0'>
                  {name}
                </span>
                <span className='text-zinc-600'>=</span>
                <span className='font-mono text-sm text-green-300'>
                  {val.value}
                </span>
                <span className='ml-auto text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded'>
                  {val.type}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
