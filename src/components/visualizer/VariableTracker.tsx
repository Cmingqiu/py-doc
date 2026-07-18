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
    <div className='rounded-lg p-4 h-full overflow-auto' style={{ background: 'var(--bg-card)' }}>
      <h3 className='text-xs font-semibold uppercase tracking-wider mb-3' style={{ color: 'var(--text-muted)' }}>
        变量追踪
      </h3>
      {Object.keys(vars).length === 0 ? (
        <p className='text-sm italic' style={{ color: 'var(--text-muted)', opacity: 0.6 }}>尚未创建变量</p>
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
                  changedKeys.has(name) ? 'ring-1' : ''
                }`}
                style={changedKeys.has(name) ? {
                  background: 'var(--code-highlight)',
                  borderColor: 'var(--accent-warm)',
                  boxShadow: `0 0 10px var(--glow-focus)`
                } : {
                  background: 'var(--bg-elevated)'
                }}>
                <span className='font-mono text-sm shrink-0' style={{ color: 'var(--accent-secondary)' }}>
                  {name}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>=</span>
                <span className='font-mono text-sm' style={{ color: 'var(--accent-primary)' }}>
                  {val.value}
                </span>
                <span className='ml-auto text-[10px] px-1.5 py-0.5 rounded' style={{
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)'
                }}>
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
