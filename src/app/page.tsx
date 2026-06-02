"use client";

import { useState, useCallback } from "react";
import { Uploader } from "@/components/Uploader";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { ResumePreview } from "@/components/ResumePreview";
import type { Analysis } from "@/lib/types";

type AppState =
  | { stage: "idle" }
  | { stage: "analyzing"; originalPdfUrl: string }
  | { stage: "done"; analysis: Analysis; id: string | null; filename: string; originalPdfUrl: string }
  | { stage: "generating"; analysis: Analysis; id: string | null; filename: string; originalPdfUrl: string }
  | { stage: "preview"; analysis: Analysis; id: string | null; filename: string; originalPdfUrl: string; atsPdfUrl: string };

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Home() {
  const [state, setState] = useState<AppState>({ stage: "idle" });
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Revoke any previous blob URLs
    if (
      state.stage !== "idle" &&
      state.stage !== "analyzing" &&
      "originalPdfUrl" in state
    ) {
      URL.revokeObjectURL(state.originalPdfUrl);
    }
    if (state.stage === "preview") {
      URL.revokeObjectURL(state.atsPdfUrl);
    }

    const originalPdfUrl = URL.createObjectURL(file);
    setCurrentFile(file);
    setError(null);
    setState({ stage: "analyzing", originalPdfUrl });

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);

      setState({
        stage: "done",
        analysis: data.analysis as Analysis,
        id: data.id ?? null,
        filename: file.name,
        originalPdfUrl,
      });
    } catch (err) {
      URL.revokeObjectURL(originalPdfUrl);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setState({ stage: "idle" });
    }
  }, [state]);

  const handleGenerateResume = useCallback(async () => {
    if ((state.stage !== "done" && state.stage !== "preview") || !currentFile) return;

    const { analysis, id, filename, originalPdfUrl } = state;
    const prevAtsPdfUrl = state.stage === "preview" ? state.atsPdfUrl : undefined;

    setError(null);
    setState({ stage: "generating", analysis, id, filename, originalPdfUrl });

    const formData = new FormData();
    formData.append("resume", currentFile);
    formData.append("analysis", JSON.stringify(analysis));
    if (id) formData.append("id", id);

    try {
      const res = await fetch("/api/resume", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const blob = await res.blob();
      if (prevAtsPdfUrl) URL.revokeObjectURL(prevAtsPdfUrl);
      const atsPdfUrl = URL.createObjectURL(blob);

      setState({ stage: "preview", analysis, id, filename, originalPdfUrl, atsPdfUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setState({ stage: "done", analysis, id, filename, originalPdfUrl });
    }
  }, [state, currentFile]);

  function handleReset() {
    if (state.stage !== "idle") {
      if ("originalPdfUrl" in state) URL.revokeObjectURL(state.originalPdfUrl);
      if (state.stage === "preview") URL.revokeObjectURL(state.atsPdfUrl);
    }
    setCurrentFile(null);
    setError(null);
    setState({ stage: "idle" });
  }

  const isAnalyzing = state.stage === "analyzing";
  const isGenerating = state.stage === "generating";
  const showSplit =
    state.stage === "analyzing" ||
    state.stage === "done" ||
    state.stage === "generating" ||
    state.stage === "preview";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top navigation bar ── */}
      <nav
        className="flex shrink-0 items-center justify-between px-5 py-0 z-10"
        style={{ backgroundColor: "#1e2844", height: "48px" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-extrabold uppercase tracking-widest text-white">
            ResumeIQ
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {showSplit && (
            <>
              {isAnalyzing && (
                <span className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white/60">
                  <Spinner className="h-3.5 w-3.5 text-white/60" />
                  Analyzing...
                </span>
              )}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Re-upload
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      {state.stage === "idle" ? (
        /* Upload screen */
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-[#f0f2f7] px-4 py-12">
          <div className="w-full max-w-lg">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
                Resume Analyzer
              </h1>
              <p className="mt-3 text-base text-stone-500">
                Upload your PDF and get an ATS score, skill gap analysis, professional
                summary, and an AI-generated ATS-optimized resume.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                <span className="font-semibold">Error: </span>{error}
              </div>
            )}

            <Uploader onFile={handleFile} />

            <div className="mt-6 grid grid-cols-5 gap-2">
              {["ATS Score", "Score Breakdown", "Skill Gaps", "Interview Prep", "ATS Resume"].map(
                (f) => (
                  <div
                    key={f}
                    className="flex flex-col items-center rounded-lg border border-stone-200 bg-white px-2 py-3 text-center"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 leading-tight">
                      {f}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Split pane */
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left panel ── */}
          <div
            className="flex flex-col overflow-hidden border-r border-stone-200 bg-white"
            style={{ width: "42%", minWidth: "340px" }}
          >
            {isAnalyzing ? (
              /* Analyzing loading state */
              <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#eef0f6" }}
                >
                  <Spinner className="h-8 w-8 text-[#1e2844]" />
                </div>
                <div>
                  <p className="text-base font-bold text-stone-800">Analyzing your resume</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Claude is reading your PDF and scoring every section...
                  </p>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full animate-bounce bg-[#1e2844]"
                      style={{ animationDelay: `${i * 0.15}s`, opacity: 0.4 + i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <AnalysisPanel
                analysis={
                  (state as Extract<AppState, { analysis: Analysis }>).analysis
                }
                filename={
                  (state as Extract<AppState, { filename: string }>).filename
                }
                onGenerateResume={handleGenerateResume}
                generatingResume={isGenerating}
              />
            )}
          </div>

          {/* ── Right panel ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {error && (
              <div
                className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
                role="alert"
              >
                <span className="font-semibold">Error: </span>{error}
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-red-400 hover:text-red-600"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            <ResumePreview
              originalPdfUrl={
                (state as Extract<AppState, { originalPdfUrl: string }>).originalPdfUrl
              }
              atsPdfUrl={
                state.stage === "preview" ? state.atsPdfUrl : undefined
              }
              filename={
                state.stage !== "analyzing"
                  ? `ats-${(state as Extract<AppState, { filename: string }>).filename}`
                  : "ats-resume.pdf"
              }
              generating={isGenerating}
            />
          </div>
        </div>
      )}
    </div>
  );
}
