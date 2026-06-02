import Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, extractToolInput } from "./anthropic";
import type { Analysis, ResumeData } from "./types";

const RESUME_TOOL: Anthropic.Tool = {
  name: "submit_resume_data",
  description:
    "Submit structured, ATS-optimized resume data. Every field should be polished and impactful.",
  input_schema: {
    type: "object" as const,
    properties: {
      contact: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          location: { type: "string" },
          linkedin: { type: "string" },
          github: { type: "string" },
          website: { type: "string" },
        },
        required: ["name", "email"],
      },
      summary: {
        type: "string",
        description:
          "A powerful 3-4 sentence professional summary. Start with job title + years of experience. Include top 2-3 skills. End with value proposition.",
      },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            title: { type: "string" },
            startDate: { type: "string", description: "e.g. Jan 2022" },
            endDate: {
              type: "string",
              description: "e.g. Dec 2023 or Present",
            },
            location: { type: "string" },
            bullets: {
              type: "array",
              items: { type: "string" },
              description:
                "4-6 achievement-oriented bullets. Start with strong action verb. Include metrics where possible. Use STAR format implicitly.",
            },
          },
          required: ["company", "title", "startDate", "endDate", "bullets"],
        },
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            institution: { type: "string" },
            degree: { type: "string" },
            field: { type: "string" },
            graduationDate: { type: "string" },
            gpa: { type: "string" },
            honors: { type: "string" },
          },
          required: ["institution", "degree", "field", "graduationDate"],
        },
      },
      skills: {
        type: "object",
        properties: {
          technical: {
            type: "array",
            items: { type: "string" },
            description: "Hard technical skills, frameworks, languages",
          },
          soft: {
            type: "array",
            items: { type: "string" },
            description: "Soft skills and competencies",
          },
          languages: {
            type: "array",
            items: { type: "string" },
            description: "Programming or spoken languages",
          },
          tools: {
            type: "array",
            items: { type: "string" },
            description: "Tools, platforms, software",
          },
        },
        required: ["technical", "soft"],
      },
      projects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            bullets: {
              type: "array",
              items: { type: "string" },
              description: "2-3 impact bullets",
            },
            url: { type: "string" },
          },
          required: ["name", "description", "technologies", "bullets"],
        },
      },
      certifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            issuer: { type: "string" },
            date: { type: "string" },
          },
          required: ["name", "issuer", "date"],
        },
      },
    },
    required: [
      "contact",
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
    ],
  },
};

export async function rewriteResume(
  pdfBuffer: Buffer,
  analysis: Analysis
): Promise<ResumeData> {
  const base64 = pdfBuffer.toString("base64");

  const gapsText =
    analysis.gaps.length > 0
      ? `\n\nIdentified gaps to address:\n${analysis.gaps.map((g) => `- ${g}`).join("\n")}`
      : "";

  const missingSkillsText =
    analysis.missingSkills.length > 0
      ? `\n\nMissing skills to incorporate if genuinely applicable:\n${analysis.missingSkills.map((s) => `- ${s}`).join("\n")}`
      : "";

  const recommendationsText =
    analysis.recommendations.length > 0
      ? `\n\nRecommendations to implement:\n${analysis.recommendations.map((r) => `- ${r}`).join("\n")}`
      : "";

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    tools: [RESUME_TOOL],
    tool_choice: { type: "tool", name: "submit_resume_data" },
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
            text: `You are an expert resume writer specializing in ATS-optimized resumes that also impress human readers.

The original resume received an ATS score of ${analysis.atsScore}/100. Your goal is to rewrite it to score 85+.

Current ATS analysis:
${gapsText}${missingSkillsText}${recommendationsText}

Rewriting principles:
1. Preserve ALL factual information — do not invent employers, degrees, or experiences
2. Quantify every achievement possible (use reasonable estimates if exact numbers aren't given, but stay truthful)
3. Start every bullet with a strong, varied action verb (Led, Built, Reduced, Increased, Designed, Implemented, etc.)
4. Use industry-standard section headers: Summary, Experience, Education, Skills, Projects, Certifications
5. Ensure dates are consistent (Month Year format)
6. Front-load keywords in bullets and summary
7. Only add skills from missingSkills list if they are genuinely evidenced in the original resume
8. Keep bullets concise: 1-2 lines each, impact-focused

Call submit_resume_data with the completely rewritten, ATS-optimized resume data.`,
          },
        ],
      },
    ],
  });

  const raw = extractToolInput<ResumeData>(response, "submit_resume_data");

  return {
    contact: {
      name: String(raw.contact?.name ?? ""),
      email: String(raw.contact?.email ?? ""),
      phone: raw.contact?.phone ? String(raw.contact.phone) : undefined,
      location: raw.contact?.location
        ? String(raw.contact.location)
        : undefined,
      linkedin: raw.contact?.linkedin
        ? String(raw.contact.linkedin)
        : undefined,
      github: raw.contact?.github ? String(raw.contact.github) : undefined,
      website: raw.contact?.website ? String(raw.contact.website) : undefined,
    },
    summary: String(raw.summary ?? ""),
    experience: (raw.experience ?? []).map((e) => ({
      company: String(e.company),
      title: String(e.title),
      startDate: String(e.startDate),
      endDate: String(e.endDate),
      location: e.location ? String(e.location) : undefined,
      bullets: (e.bullets ?? []).map(String),
    })),
    education: (raw.education ?? []).map((e) => ({
      institution: String(e.institution),
      degree: String(e.degree),
      field: String(e.field),
      graduationDate: String(e.graduationDate),
      gpa: e.gpa ? String(e.gpa) : undefined,
      honors: e.honors ? String(e.honors) : undefined,
    })),
    skills: {
      technical: (raw.skills?.technical ?? []).map(String),
      soft: (raw.skills?.soft ?? []).map(String),
      languages: raw.skills?.languages
        ? (raw.skills.languages ?? []).map(String)
        : undefined,
      tools: raw.skills?.tools
        ? (raw.skills.tools ?? []).map(String)
        : undefined,
    },
    projects: (raw.projects ?? []).map((p) => ({
      name: String(p.name),
      description: String(p.description),
      technologies: (p.technologies ?? []).map(String),
      bullets: (p.bullets ?? []).map(String),
      url: p.url ? String(p.url) : undefined,
    })),
    certifications: (raw.certifications ?? []).map((c) => ({
      name: String(c.name),
      issuer: String(c.issuer),
      date: String(c.date),
    })),
  };
}
