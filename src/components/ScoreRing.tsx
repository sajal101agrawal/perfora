"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRing({ score, size = 112, strokeWidth = 9 }: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedScore / 100);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`ATS Score: ${clampedScore} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 rotate-[-90deg]"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e4e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#1e2844"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="relative flex flex-col items-center leading-none">
        <span className="text-3xl font-extrabold tabular-nums text-[#1e2844]">
          {clampedScore}
        </span>
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          OVERALL
        </span>
      </div>
    </div>
  );
}
