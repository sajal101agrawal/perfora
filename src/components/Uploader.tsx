"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface UploaderProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function Uploader({ onFile, disabled = false }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSend(file: File) {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
      return;
    }
    onFile(file);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndSend(file);
    // reset input so same file can be re-uploaded
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSend(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload resume PDF"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            inputRef.current?.click();
          }
        }}
        className={[
          "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 text-center transition-all",
          disabled
            ? "cursor-not-allowed opacity-50 border-stone-300"
            : dragging
            ? "border-pine-600 bg-pine-50 cursor-copy scale-[1.01]"
            : "border-stone-300 bg-stone-50 hover:border-pine-500 hover:bg-pine-50/50 cursor-pointer",
        ].join(" ")}
        style={{
          borderColor: dragging ? "#2a8f65" : undefined,
          backgroundColor: dragging ? "#f0faf5" : undefined,
        }}
      >
        {/* Icon */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: dragging ? "#d4f0e5" : "#e8f4ef" }}
        >
          <svg
            className="h-8 w-8"
            style={{ color: "#2a8f65" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>

        <div>
          <p className="text-base font-semibold text-stone-800">
            Drop your resume here
          </p>
          <p className="mt-1 text-sm text-stone-500">
            or{" "}
            <span style={{ color: "#1a6b4a" }} className="font-medium underline underline-offset-2">
              browse files
            </span>
          </p>
          <p className="mt-2 text-xs text-stone-400">PDF only · max 10 MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
