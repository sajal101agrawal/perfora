import Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, extractToolInput } from "./anthropic";
import type { Analysis, ATSCategory } from "./types";

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description:
    "Submit a structured analysis of the resume. Call this with all required fields populated.",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description:
          "A concise 3-5 sentence professional summary of the candidate. Highlight their level, domain, and standout qualities.",
      },
      atsScore: {
        type: "number",
        description:
          "Overall ATS compatibility score from 0-100. Weight: keyword density 25, formatting/structure 20, measurable achievements 20, skills section 15, contact completeness 10, education clarity 10.",
      },
      categories: {
        type: "array",
        description: "Scored breakdown of ATS categories.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            score: {
              type: "number",
              description: "Score achieved (0 to maxScore)",
            },
            maxScore: { type: "number", description: "Maximum possible score" },
            feedback: {
              type: "string",
              description: "One or two sentences of specific, actionable feedback.",
            },
          },
          required: ["name", "score", "maxScore", "feedback"],
        },
      },
      gaps: {
        type: "array",
        items: { type: "string" },
        description:
          "Employment gaps or missing sections identified. Each entry is a clear description.",
      },
      missingSkills: {
        type: "array",
        items: { type: "string" },
        description:
          "Skills commonly expected for this role/level that are absent or insufficiently highlighted.",
      },
      interviewQuestions: {
        type: "array",
        items: { type: "string" },
        description:
          "7-10 targeted interview questions a recruiter would likely ask based on this resume.",
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "3-5 notable strengths evident from the resume.",
      },
      recommendations: {
        type: "array",
        items: { type: "string" },
        description:
          "5-7 specific, prioritized recommendations to improve this resume.",
      },
    },
    required: [
      "summary",
      "atsScore",
      "categories",
      "gaps",
      "missingSkills",
      "interviewQuestions",
      "strengths",
      "recommendations",
    ],
  },
};

export async function analyzeResume(pdfBuffer: Buffer): Promise<Analysis> {
  const base64 = pdfBuffer.toString("base64");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: `You are an expert ATS (Applicant Tracking System) analyst and career coach with 15+ years of experience reviewing resumes across all industries and levels.

Analyze this resume thoroughly and call the submit_analysis tool with your findings.

ATS scoring rubric (total 100 points):
- Keyword density & relevance: 25 points (role-specific keywords, industry terms, action verbs)
- Formatting & structure: 20 points (consistent dates, clear sections, no tables/columns/graphics that break parsers)
- Measurable achievements: 20 points (quantified accomplishments with numbers, %, $, timeframes)
- Skills section quality: 15 points (dedicated skills section, relevant technical/soft skills)
- Contact information completeness: 10 points (email, phone, location, LinkedIn)
- Education clarity: 10 points (degree, institution, graduation date clearly stated)

Be specific and actionable in all feedback. Do not be generic.`,
          },
        ],
      },
    ],
  });

  const raw = extractToolInput<Analysis>(response, "submit_analysis");

  const categories: ATSCategory[] = (raw.categories ?? []).map((c) => ({
    name: String(c.name),
    score: Number(c.score),
    maxScore: Number(c.maxScore),
    feedback: String(c.feedback),
  }));

  return {
    summary: String(raw.summary),
    atsScore: Number(raw.atsScore),
    categories,
    gaps: (raw.gaps ?? []).map(String),
    missingSkills: (raw.missingSkills ?? []).map(String),
    interviewQuestions: (raw.interviewQuestions ?? []).map(String),
    strengths: (raw.strengths ?? []).map(String),
    recommendations: (raw.recommendations ?? []).map(String),
  };
}
