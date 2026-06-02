import { NextRequest, NextResponse } from "next/server";
import { rewriteResume } from "@/lib/resume";
import { compilePdf } from "@/lib/latex";
import { updateResumeData } from "@/lib/db";
import type { Analysis } from "@/lib/types";

const MAX_PDF_SIZE = 10 * 1024 * 1024;

function isPdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.slice(0, 5).toString("ascii") === "%PDF-";
}

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data." },
      { status: 400 }
    );
  }

  const file = formData.get("resume");
  const analysisRaw = formData.get("analysis");
  const dbId = formData.get("id");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No resume file provided." },
      { status: 400 }
    );
  }

  if (!analysisRaw || typeof analysisRaw !== "string") {
    return NextResponse.json(
      { error: "No analysis data provided." },
      { status: 400 }
    );
  }

  let analysis: Analysis;
  try {
    analysis = JSON.parse(analysisRaw) as Analysis;
  } catch {
    return NextResponse.json(
      { error: "Invalid analysis JSON." },
      { status: 400 }
    );
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 }
    );
  }

  let buffer: Buffer;
  try {
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
  } catch {
    return NextResponse.json(
      { error: "Failed to read uploaded file." },
      { status: 500 }
    );
  }

  if (!isPdf(buffer)) {
    return NextResponse.json(
      { error: "File does not appear to be a valid PDF." },
      { status: 415 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  // Step 1: Rewrite resume content via Claude
  let resumeData;
  try {
    resumeData = await rewriteResume(buffer, analysis);
  } catch (err) {
    console.error("[resume] Rewrite failed:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown error during rewrite.";
    return NextResponse.json(
      { error: `Resume rewrite failed: ${msg}` },
      { status: 500 }
    );
  }

  // Step 2: Compile LaTeX → PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await compilePdf(resumeData);
  } catch (err) {
    console.error("[resume] LaTeX compile failed:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown compilation error.";

    if (msg.includes("not found") || msg.includes("ENOENT")) {
      return NextResponse.json(
        {
          error:
            "Tectonic (LaTeX compiler) is not installed or not in PATH. " +
            "Install it with: brew install tectonic",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `PDF compilation failed: ${msg}` },
      { status: 500 }
    );
  }

  // Step 3: Persist resume data (fail-soft)
  if (dbId && typeof dbId === "string") {
    await updateResumeData(dbId, resumeData);
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="ats-resume.pdf"',
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
