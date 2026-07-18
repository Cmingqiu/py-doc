"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Step } from "@/types/visualizer";

interface FlowAnimatorProps {
  steps: Step[];
  currentStep: number;
}

const actionLabels: Record<Step["action"], { label: string; color: string; themeVar?: string }> = {
  assign: { label: "赋值", color: "bg-blue-500", themeVar: "var(--accent-primary)" },
  swap: { label: "交换", color: "bg-cyan-500", themeVar: "var(--accent-secondary)" },
  condition: { label: "判断", color: "bg-yellow-500", themeVar: "var(--accent-highlight)" },
  loop_iter: { label: "循环", color: "bg-green-500", themeVar: "var(--accent-primary)" },
  call: { label: "调用", color: "bg-purple-500", themeVar: "var(--accent-secondary)" },
  return: { label: "返回", color: "bg-pink-500", themeVar: "var(--accent-highlight)" },
  output: { label: "输出", color: "bg-orange-500", themeVar: "var(--accent-warm)" },
};

export default function FlowAnimator({ steps, currentStep }: FlowAnimatorProps) {
  const step = currentStep >= 0 ? steps[currentStep] : null;
  if (!step) {
    return (
      <div className="rounded-lg p-4 h-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
        <p className="text-sm italic" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>点击播放按钮开始演示</p>
      </div>
    );
  }

  const action = actionLabels[step.action];

  return (
    <div className="rounded-lg p-4 h-full overflow-auto" style={{ background: 'var(--bg-card)' }}>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        执行流
      </h3>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
              background: action.themeVar,
              color: 'var(--bg-primary)'
            }}>
              {action.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>第 {currentStep + 1}/{steps.length} 步</span>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{step.note}</p>

          {step.branch !== undefined && (
            <div className={`text-sm font-semibold`} style={{
              color: step.branch === "true" ? 'var(--accent-primary)' : 'var(--accent-warm)'
            }}>
              {step.branch === "true" ? "条件成立 - 进入分支" : "条件不成立 - 跳过分支"}
            </div>
          )}

          {step.loopVar && (
            <div className="text-sm" style={{ color: 'var(--accent-primary)' }}>
              循环变量 <span className="font-mono">{step.loopVar}</span> = <span className="font-mono">{step.loopValue}</span>
            </div>
          )}

          {step.output && (
            <div className="rounded px-3 py-2 font-mono text-sm" style={{
              background: 'var(--bg-elevated)',
              color: 'var(--accent-highlight)'
            }}>
              &gt;&gt;&gt; {step.output}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
