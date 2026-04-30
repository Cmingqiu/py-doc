"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Step } from "@/types/visualizer";

interface FlowAnimatorProps {
  steps: Step[];
  currentStep: number;
}

const actionLabels: Record<Step["action"], { label: string; color: string }> = {
  assign: { label: "赋值", color: "bg-blue-500" },
  swap: { label: "交换", color: "bg-cyan-500" },
  condition: { label: "判断", color: "bg-yellow-500" },
  loop_iter: { label: "循环", color: "bg-green-500" },
  call: { label: "调用", color: "bg-purple-500" },
  return: { label: "返回", color: "bg-pink-500" },
  output: { label: "输出", color: "bg-orange-500" },
};

export default function FlowAnimator({ steps, currentStep }: FlowAnimatorProps) {
  const step = currentStep >= 0 ? steps[currentStep] : null;
  if (!step) {
    return (
      <div className="rounded-lg bg-zinc-900 p-4 h-full flex items-center justify-center">
        <p className="text-zinc-600 text-sm italic">点击播放按钮开始演示</p>
      </div>
    );
  }

  const action = actionLabels[step.action];

  return (
    <div className="rounded-lg bg-zinc-900 p-4 h-full overflow-auto">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
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
            <span className={`${action.color} text-white text-xs font-bold px-2 py-0.5 rounded`}>
              {action.label}
            </span>
            <span className="text-zinc-500 text-xs">第 {currentStep + 1}/{steps.length} 步</span>
          </div>

          <p className="text-zinc-100 text-sm leading-relaxed">{step.note}</p>

          {step.branch !== undefined && (
            <div className={`text-sm font-semibold ${step.branch === "true" ? "text-green-400" : "text-red-400"}`}>
              {step.branch === "true" ? "条件成立 - 进入分支" : "条件不成立 - 跳过分支"}
            </div>
          )}

          {step.loopVar && (
            <div className="text-sm text-green-300">
              循环变量 <span className="font-mono">{step.loopVar}</span> = <span className="font-mono">{step.loopValue}</span>
            </div>
          )}

          {step.output && (
            <div className="bg-zinc-800 rounded px-3 py-2 font-mono text-sm text-amber-300">
              &gt;&gt;&gt; {step.output}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
