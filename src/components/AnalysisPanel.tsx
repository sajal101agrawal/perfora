"use client";

import { ScoreRing } from "./ScoreRing";
import type { Analysis, ATSCategory } from "@/lib/types";

interface AnalysisPanelProps {
  analysis: Analysis;
  filename: string;
  onGenerateResume: () => void;
  generatingResume: boolean;
}

function getScoreMeta(pct: number): { label: string; bg: string; text: string } {
  if (pct >= 80) return { label: "EXCELLENT", bg: "#059669", text: "#fff" };
  if (pct >= 65) return { label: "GOOD START", bg: "#0891b2", text: "#fff" };
  if (pct >= 45) return { label: "NEEDS WORK", bg: "#d97706", text: "#fff" };
  if (pct >= 25) return { label: "POOR", bg: "#f97316", text: "#fff" };
  return { label: "CRITICAL", bg: "#dc2626", text: "#fff" };
}

function MetricBox({ name, score, maxScore }: ATSCategory) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const normalized = Math.round(pct);
  const { label, bg } = getScoreMeta(pct);

  const shortName = name
    .replace("Keyword Density & Relevance", "KEYWORDS")
    .replace("Formatting & Structure", "FORMAT")
    .replace("Measurable Achievements", "IMPACT")
    .replace("Skills Section Quality", "SKILLS")
    .replace("Contact Information Completeness", "CONTACT")
    .replace("Education Clarity", "EDUCATION")
    .toUpperCase();

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-stone-100 bg-white p-3">
      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">
        {shortName}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-2xl font-extrabold tabular-nums text-stone-900 leading-none">
          {normalized}
        </span>
        <span className="text-xs text-stone-400 font-medium">/100</span>
      </div>
      <span
        className="mt-0.5 inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
        style={{ backgroundColor: bg, color: "#fff" }}
      >
        {label}
      </span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="space-y-1.5">
      <div className="relative h-3 w-full overflow-hidden rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #84cc16 75%, #22c55e 100%)",
          }}
        />
        {/* white cut-off mask for the unfilled portion */}
        <div
          className="absolute right-0 top-0 bottom-0 bg-stone-100 rounded-r-full transition-all duration-700"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="relative h-3">
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${clamped}%`, transform: "translateX(-50%)" }}
        >
          <div className="w-px h-2 bg-stone-700" />
          <div
            className="w-1.5 h-1.5 rounded-sm bg-stone-700"
            style={{ transform: "rotate(45deg)", marginTop: "-2px" }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
        <span>0</span>
        <span className="text-stone-600">Your Resume</span>
        <span>100</span>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mb-3">
      {title}
    </h3>
  );
}

function Divider() {
  return <div className="border-t border-stone-100 my-5" />;
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded bg-stone-100 text-[10px] font-extrabold text-stone-500">
            {i + 1}
          </span>
          <span className="text-sm leading-relaxed text-stone-700">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-300" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: ATSCategory[] }) {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const pct = cat.maxScore > 0 ? (cat.score / cat.maxScore) * 100 : 0;
        const { label, bg } = getScoreMeta(pct);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-stone-700">{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tabular-nums text-stone-500">
                  {cat.score}/{cat.maxScore}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: bg }}
                >
                  {label}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: bg }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-400">{cat.feedback}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AnalysisPanel({
  analysis,
  filename,
  onGenerateResume,
  generatingResume,
}: AnalysisPanelProps) {
  const topCategories = [...analysis.categories]
    .sort((a, b) => b.maxScore - a.maxScore)
    .slice(0, 4);

  return (
    <div className="flex flex-col h-full">
      {/* ── Score header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-stone-100 bg-white">
        <div className="flex items-start gap-4">
          <ScoreRing score={analysis.atsScore} />
          <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
            {topCategories.map((cat, i) => (
              <MetricBox key={i} {...cat} />
            ))}
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <ScoreBar score={analysis.atsScore} />
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerateResume}
          disabled={generatingResume}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#1e2844" }}
        >
          {generatingResume ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Building ATS Resume...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate ATS Resume
            </>
          )}
        </button>

        <p className="mt-2 text-center text-[10px] text-stone-400 truncate" title={filename}>
          {filename}
        </p>
      </div>

      {/* ── Scrollable sections ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-0 bg-white">

        {/* Professional Summary */}
        <div>
          <SectionHeader title="Professional Summary" />
          <p className="text-sm leading-relaxed text-stone-700">{analysis.summary}</p>
        </div>

        <Divider />

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <SectionHeader title="Recommendations" />
            <NumberedList items={analysis.recommendations} />
            <Divider />
          </div>
        )}

        {/* Full score breakdown */}
        {analysis.categories.length > 0 && (
          <div>
            <SectionHeader title="Score Breakdown" />
            <CategoryBreakdown categories={analysis.categories} />
            <Divider />
          </div>
        )}

        {/* Missing skills */}
        {analysis.missingSkills.length > 0 && (
          <div>
            <SectionHeader title="Missing or Undersold Skills" />
            <TagList items={analysis.missingSkills} />
            <Divider />
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div>
            <SectionHeader title="Strengths" />
            <BulletList items={analysis.strengths} />
            <Divider />
          </div>
        )}

        {/* Gaps */}
        {analysis.gaps.length > 0 && (
          <div>
            <SectionHeader title="Identified Gaps" />
            <BulletList items={analysis.gaps} />
            <Divider />
          </div>
        )}

        {/* Interview questions */}
        {analysis.interviewQuestions.length > 0 && (
          <div>
            <SectionHeader title="Likely Interview Questions" />
            <ol className="space-y-3">
              {analysis.interviewQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700">
                  <span className="shrink-0 text-xs font-extrabold text-stone-400 mt-0.5">
                    Q{i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}
