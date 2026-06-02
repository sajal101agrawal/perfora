# ResumeIQ — ATS Resume Analyzer

Upload a PDF resume and get a professional summary, an ATS score with a scored breakdown, employment gaps, missing skills, and likely interview questions. If the ATS score is below 70 (or on request), generate a clean ATS-friendly resume rendered with LaTeX, previewed in-browser, and downloadable as PDF.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL (optional) · Tectonic (LaTeX) · Anthropic Claude

---

## Key Design Decisions

**No separate OCR.** The PDF is sent to Claude as a native document block; Claude extracts text and layout itself (`src/lib/analyze.ts`).

**Structured output via forced tool use.** Both the analysis and the rewritten resume come back as validated JSON (`tool_choice: {type: "tool"}`), not free text — far more reliable than parsing prose.

**LaTeX you can trust.** Claude returns structured resume data; the server injects it (with full LaTeX escaping) into a vetted single-column, no-tables template (`src/lib/latex.ts`) and compiles with Tectonic. This guarantees compilation and ATS-parseable output, instead of asking the model to emit raw LaTeX.

**Single-hue UI.** One accent color ("pine") expressed as a shade ramp plus a warm neutral. Even the ATS score ring uses intensity, never red/green.

**Postgres is optional.** Without `DATABASE_URL` the app runs fine; with it, each analysis is persisted (`db/init.sql`, `src/lib/db.ts`).

---

## Project Layout

```
src/lib/
  anthropic.ts   Claude client, MODEL constant, tool-input extractor
  analyze.ts     PDF → structured Analysis (forced tool use)
  resume.ts      PDF + gaps → structured ResumeData (forced tool use)
  latex.ts       ResumeData → escaped LaTeX → Tectonic → PDF buffer
  db.ts          optional Postgres persistence (fail-soft)
  types.ts       shared types + ATS threshold constant

src/app/
  page.tsx                 upload → analysis → resume orchestration
  api/analyze/route.ts     validates PDF, runs analysis, persists
  api/resume/route.ts      builds + compiles the ATS resume PDF

src/components/
  Uploader.tsx      drag-and-drop file uploader with validation
  AnalysisPanel.tsx full analysis display with score breakdown
  ScoreRing.tsx     animated SVG score ring (single pine-green hue)
  ResumePreview.tsx in-browser PDF viewer with download button

db/
  init.sql          Postgres schema (auto-run by Docker)
```

---

## Run with Docker (recommended — includes Tectonic + Postgres)

```bash
cp .env.example .env       # fill in ANTHROPIC_API_KEY
docker compose up --build
# → http://localhost:3000
```

The Docker image installs Tectonic and warms its package cache during build, so the first resume generation is fast.

---

## Run Locally (dev)

You need Node 20+ and Tectonic on your PATH:

```bash
# macOS
brew install tectonic

# Linux / other
curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh
```

```bash
npm install
cp .env.example .env          # add ANTHROPIC_API_KEY
# optional: start just the DB
#   docker compose up -d db
#   then set DATABASE_URL=postgres://resume:resume@localhost:5432/resume
npm run dev                   # → http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-6` | Model override |
| `DATABASE_URL` | No | — | Postgres connection string |

Available models: `claude-sonnet-4-6` (default) · `claude-opus-4-8` (strongest) · `claude-haiku-4-5` (cheapest)

---

## File Limits

- PDF only, validated by MIME type and `%PDF-` magic bytes on the server
- Maximum 10 MB per upload
- Encrypted or image-only (scanned) PDFs may fail — Claude requires parseable text content

---

## Notes

- For very large resumes, switch from inline base64 to the [Anthropic Files API](https://docs.anthropic.com/en/api/files).
- The LaTeX template lives in `buildLatex()` in `src/lib/latex.ts` — adjust typography and sections there.
- The ATS threshold (70) is a single constant in `src/lib/types.ts`.
