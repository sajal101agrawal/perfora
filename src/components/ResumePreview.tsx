"use client";

import { useRef, useState } from "react";

interface ResumePreviewProps {
  originalPdfUrl: string;
  atsPdfUrl?: string;
  filename?: string;
  generating?: boolean;
}

function PdfFrame({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    setLoaded(false);
    setFailed(false);
  }

  return (
    <div className="relative w-full h-full bg-[#e8eaee]">
      {!loaded && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-500 z-10">
          <svg className="h-7 w-7 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-stone-400">Loading preview...</span>
        </div>
      )}
      {!failed ? (
        <iframe
          ref={iframeRef}
          src={`${url}#toolbar=0&navpanes=0&view=FitH`}
          title={title}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <svg className="h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="font-semibold text-stone-600">Preview unavailable</p>
            <p className="mt-1 text-sm text-stone-400">Your browser blocked inline PDF preview.</p>
          </div>
          <a
            href={url}
            download={title}
            className="rounded-lg px-5 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: "#1e2844" }}
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}

export function ResumePreview({
  originalPdfUrl,
  atsPdfUrl,
  filename = "ats-resume.pdf",
  generating = false,
}: ResumePreviewProps) {
  const [activeTab, setActiveTab] = useState<"original" | "ats">(
    atsPdfUrl ? "ats" : "original"
  );

  // Switch to ATS tab when it becomes available
  const [prevAts, setPrevAts] = useState(atsPdfUrl);
  if (atsPdfUrl && atsPdfUrl !== prevAts) {
    setPrevAts(atsPdfUrl);
    setActiveTab("ats");
  }

  const activeUrl = activeTab === "ats" && atsPdfUrl ? atsPdfUrl : originalPdfUrl;

  function handleDownload() {
    const url = atsPdfUrl ?? originalPdfUrl;
    const a = document.createElement("a");
    a.href = url;
    a.download = atsPdfUrl ? filename : "original-resume.pdf";
    a.click();
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f2f7]">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200"
        style={{ backgroundColor: "#f8f9fb" }}
      >
        {/* Tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("original")}
            className={[
              "px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === "original"
                ? "text-white"
                : "text-stone-400 hover:text-stone-600 hover:bg-stone-100",
            ].join(" ")}
            style={
              activeTab === "original"
                ? { backgroundColor: "#1e2844" }
                : {}
            }
          >
            Original
          </button>
          {(atsPdfUrl || generating) && (
            <button
              onClick={() => !generating && atsPdfUrl && setActiveTab("ats")}
              disabled={generating || !atsPdfUrl}
              className={[
                "px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:cursor-default",
                activeTab === "ats" && atsPdfUrl
                  ? "text-white"
                  : generating
                  ? "text-stone-400"
                  : "text-stone-400 hover:text-stone-600 hover:bg-stone-100",
              ].join(" ")}
              style={
                activeTab === "ats" && atsPdfUrl
                  ? { backgroundColor: "#1e2844" }
                  : {}
              }
            >
              {generating && (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              ATS Resume
              {generating && (
                <span className="text-[9px] font-medium text-stone-400 normal-case tracking-normal">
                  building...
                </span>
              )}
              {atsPdfUrl && !generating && (
                <span
                  className="rounded-full px-1.5 py-px text-[9px] font-extrabold uppercase text-white"
                  style={{ backgroundColor: "#059669" }}
                >
                  Ready
                </span>
              )}
            </button>
          )}
        </div>

        {/* Download */}
        {atsPdfUrl && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: "#1e2844" }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        )}
      </div>

      {/* PDF frame */}
      <div className="flex-1 relative overflow-hidden">
        {generating && activeTab === "original" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm">
            <svg className="h-3.5 w-3.5 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Building your ATS resume...
          </div>
        )}
        <PdfFrame url={activeUrl} title={activeTab === "ats" ? filename : "Your resume"} />
      </div>
    </div>
  );
}
