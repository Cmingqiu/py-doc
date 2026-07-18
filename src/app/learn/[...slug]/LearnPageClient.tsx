"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { SourceFile } from "@/types/visualizer";
import { usePlaybackStore } from "@/stores/playback";
import CodeStepper from "@/components/visualizer/CodeStepper";
import VariableTracker from "@/components/visualizer/VariableTracker";
import CallStack from "@/components/visualizer/CallStack";
import FlowAnimator from "@/components/visualizer/FlowAnimator";
import PlaybackBar from "@/components/player/PlaybackBar";
import ThemePicker from "@/components/theme/ThemePicker";

export default function LearnPageClient({ source }: { source: SourceFile }) {
  const { setSteps, currentStep, steps, isPlaying, next } = usePlaybackStore();

  useEffect(() => {
    setSteps(source.steps.steps);
  }, [source.steps.steps, setSteps]);

  // 键盘控制
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (!isPlaying) next();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, next]);

  const hasCallStack = steps.some((s) => s.callStack && s.callStack.length > 0);

  return (
    <div className="relative z-10 flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="shrink-0 px-4 py-3 flex items-center gap-4 border-b backdrop-blur-sm" style={{
        borderColor: 'var(--code-border)',
        background: 'var(--bg-primary)',
        opacity: 0.95
      }}>
        <Link
          href="/"
          className="text-sm hover:text-blue-400 transition-colors flex items-center gap-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>
        <div className="h-4 w-px" style={{ background: 'var(--code-border)' }} />
        <h1 className="text-base font-semibold gradient-text">{source.title}</h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{source.description}</span>
        <div className="ml-auto">
          <ThemePicker />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Code */}
        <div className="w-1/2 border-r flex flex-col" style={{ borderColor: 'var(--code-border)' }}>
          <div className="shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b" style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--code-border)',
            opacity: 0.5
          }}>
            代码
          </div>
          <div className="flex-1 min-h-0">
            <CodeStepper
              code={source.code}
              steps={steps}
              currentStep={currentStep}
            />
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 min-h-0 grid grid-rows-[1fr_auto_1fr] gap-0">
            {/* Flow Animator */}
            <div className="border-b" style={{ borderColor: 'var(--code-border)' }}>
              <FlowAnimator steps={steps} currentStep={currentStep} />
            </div>

            {/* Variable Tracker */}
            <div className="border-b" style={{ borderColor: 'var(--code-border)' }}>
              <VariableTracker steps={steps} currentStep={currentStep} />
            </div>

            {/* Call Stack (conditional) */}
            {hasCallStack && (
              <CallStack steps={steps} currentStep={currentStep} />
            )}
          </div>
        </div>
      </div>

      {/* Playback bar */}
      <div className="shrink-0 border-t backdrop-blur-sm" style={{
        borderColor: 'var(--code-border)',
        background: 'var(--bg-primary)',
        opacity: 0.95
      }}>
        <PlaybackBar />
      </div>
    </div>
  );
}
