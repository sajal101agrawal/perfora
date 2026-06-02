import { NextRequest, NextResponse } from "next/server";
import { analyzeResume } from "@/lib/analyze";
import { saveAnalysis } from "@/lib/db";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10 MB

function isPdf(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.slice(0, 5).toString("ascii") === "%PDF-";
}

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
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No resume file provided. Send a PDF as field 'resume'." },
      { status: 400 }
    );
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Only PDF files are accepted." },
      { status: 415 }
    );
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      {
        error: `File too large. Maximum size is 10 MB (received ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
      },
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
      {
        error:
          "File does not appear to be a valid PDF (missing %PDF- header). Please upload a genuine PDF.",
      },
      { status: 415 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 }
    );
  }

  let analysis;
  try {
    analysis = await analyzeResume(buffer);
  } catch (err) {
    console.error("[analyze] Claude call failed:", err);
    const msg =
      err instanceof Error ? err.message : "Unknown error during analysis.";
    if (msg.includes("Could not process document")) {
      return NextResponse.json(
        {
          error:
            "Claude could not process this PDF. It may be encrypted, scanned without text, or corrupt.",
        },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: `Analysis failed: ${msg}` },
      { status: 500 }
    );
  }

  // Persist to Postgres (fail-soft — missing DB just means no persistence)
  const dbId = await saveAnalysis(file.name, analysis);

  return NextResponse.json({
    analysis,
    id: dbId,
    filename: file.name,
  });
}

export const maxDuration = 60;
