"use client";

import { usePlaybackStore } from "@/stores/playback";

export default function PlaybackBar() {
  const { currentStep, steps, isPlaying, speed, next, prev, play, pause, setSpeed, goTo, reset } =
    usePlaybackStore();
  const total = steps.length;
  const canPrev = currentStep > 0;
  const canNext = currentStep < total - 1;

  return (
    <div className="flex items-center gap-4 rounded-lg px-4 py-3" style={{ background: 'var(--bg-card)' }}>
      <button
        onClick={reset}
        className="transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="重置"
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.5 8c-2.65 0-5.05 1-6.9 2.65M2.5 8v6h6" />
        </svg>
      </button>

      <button
        onClick={prev}
        disabled={!canPrev}
        className="transition-colors disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        title="上一步"
        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {isPlaying ? (
        <button
          onClick={pause}
          className="transition-colors"
          style={{ color: 'var(--text-primary)' }}
          title="暂停"
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
          </svg>
        </button>
      ) : (
        <button
          onClick={play}
          disabled={!canNext}
          className="transition-colors disabled:opacity-30"
          style={{ color: 'var(--text-primary)' }}
          title="播放"
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--accent-primary)')}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      <button
        onClick={next}
        disabled={!canNext}
        className="transition-colors disabled:opacity-30"
        style={{ color: 'var(--text-secondary)' }}
        title="下一步"
        onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>速度</span>
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`text-xs px-2 py-1 rounded transition-colors`}
            style={speed === s ? {
              background: 'var(--accent-primary)',
              color: 'var(--bg-primary)'
            } : {
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              if (speed !== s) {
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (speed !== s) {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="flex-1 mx-4">
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={currentStep}
          onChange={(e) => goTo(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
        {currentStep + 1} / {total}
      </span>
    </div>
  );
}
