import { Pool } from "pg";
import type { Analysis, ResumeData, AnalysisRecord } from "./types";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on("error", (err) => {
      console.error("[db] Unexpected pool error:", err);
    });
  }
  return pool;
}

export async function initDb(): Promise<void> {
  const db = getPool();
  if (!db) return;

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        filename    TEXT NOT NULL,
        ats_score   INT NOT NULL,
        analysis    JSONB NOT NULL,
        resume_data JSONB
      );
      CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);
    `);
    console.log("[db] Schema ready");
  } catch (err) {
    console.error("[db] initDb failed:", err);
  }
}

export async function saveAnalysis(
  filename: string,
  analysis: Analysis,
  resumeData?: ResumeData
): Promise<string | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query<{ id: string }>(
      `INSERT INTO analyses (filename, ats_score, analysis, resume_data)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        filename,
        analysis.atsScore,
        JSON.stringify(analysis),
        resumeData ? JSON.stringify(resumeData) : null,
      ]
    );
    return result.rows[0].id;
  } catch (err) {
    console.error("[db] saveAnalysis failed (non-fatal):", err);
    return null;
  }
}

export async function updateResumeData(
  id: string,
  resumeData: ResumeData
): Promise<void> {
  const db = getPool();
  if (!db) return;

  try {
    await db.query(
      `UPDATE analyses SET resume_data = $1 WHERE id = $2`,
      [JSON.stringify(resumeData), id]
    );
  } catch (err) {
    console.error("[db] updateResumeData failed (non-fatal):", err);
  }
}

export async function getAnalysis(
  id: string
): Promise<AnalysisRecord | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const result = await db.query(
      `SELECT id, created_at, filename, analysis, resume_data
       FROM analyses WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      createdAt: row.created_at,
      filename: row.filename,
      analysis: row.analysis as Analysis,
      resumeData: row.resume_data as ResumeData | undefined,
    };
  } catch (err) {
    console.error("[db] getAnalysis failed (non-fatal):", err);
    return null;
  }
}

export async function listAnalyses(limit = 20): Promise<AnalysisRecord[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const result = await db.query(
      `SELECT id, created_at, filename, analysis, resume_data
       FROM analyses ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      filename: row.filename,
      analysis: row.analysis as Analysis,
      resumeData: row.resume_data as ResumeData | undefined,
    }));
  } catch (err) {
    console.error("[db] listAnalyses failed (non-fatal):", err);
    return [];
  }
}

export const isDbEnabled = (): boolean => !!process.env.DATABASE_URL;
