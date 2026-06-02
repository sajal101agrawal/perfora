import { execSync } from "child_process";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { ResumeData } from "./types";

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}")
    .replace(/\|/g, "\\textbar{}")
    .replace(/"/g, "``")
    .replace(/'/g, "'");
}

function escUrl(url: string): string {
  return url.replace(/[%#_~^\\{}]/g, (c) => {
    const map: Record<string, string> = {
      "%": "\\%",
      "#": "\\#",
      _: "\\_",
      "~": "\\textasciitilde{}",
      "^": "\\textasciicircum{}",
      "\\": "\\textbackslash{}",
      "{": "\\{",
      "}": "\\}",
    };
    return map[c] ?? c;
  });
}

function buildContactLine(data: ResumeData): string {
  const parts: string[] = [];
  if (data.contact.email)
    parts.push(`\\href{mailto:${escUrl(data.contact.email)}}{${esc(data.contact.email)}}`);
  if (data.contact.phone) parts.push(esc(data.contact.phone));
  if (data.contact.location) parts.push(esc(data.contact.location));
  if (data.contact.linkedin)
    parts.push(
      `\\href{${escUrl(data.contact.linkedin)}}{${esc(data.contact.linkedin.replace(/^https?:\/\//, ""))}}`
    );
  if (data.contact.github)
    parts.push(
      `\\href{${escUrl(data.contact.github)}}{${esc(data.contact.github.replace(/^https?:\/\//, ""))}}`
    );
  if (data.contact.website)
    parts.push(
      `\\href{${escUrl(data.contact.website)}}{${esc(data.contact.website.replace(/^https?:\/\//, ""))}}`
    );
  return parts.join(" $\\cdot$ ");
}

function buildExperience(data: ResumeData): string {
  if (!data.experience || data.experience.length === 0) return "";

  const entries = data.experience
    .map((job) => {
      const bullets = job.bullets
        .map((b) => `  \\item ${esc(b)}`)
        .join("\n");
      const loc = job.location ? ` \\hfill {\\small ${esc(job.location)}}` : "";
      return `\\subsection*{${esc(job.title)} \\textnormal{\\small at ${esc(job.company)}}${loc}}
{\\small \\textit{${esc(job.startDate)} -- ${esc(job.endDate)}}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");

  return `\\section*{Experience}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n${entries}`;
}

function buildEducation(data: ResumeData): string {
  if (!data.education || data.education.length === 0) return "";

  const entries = data.education
    .map((edu) => {
      const extras: string[] = [];
      if (edu.gpa) extras.push(`GPA: ${esc(edu.gpa)}`);
      if (edu.honors) extras.push(esc(edu.honors));
      const extraLine =
        extras.length > 0
          ? `\n{\\small ${extras.join(" $\\cdot$ ")}}`
          : "";
      return `\\textbf{${esc(edu.institution)}} \\hfill {\\small ${esc(edu.graduationDate)}}\\\\
{\\small ${esc(edu.degree)} in ${esc(edu.field)}}${extraLine}`;
    })
    .join("\n\n\\vspace{0.5em}\n");

  return `\\section*{Education}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n${entries}`;
}

function buildSkills(data: ResumeData): string {
  if (!data.skills) return "";

  const rows: string[] = [];
  if (data.skills.technical?.length)
    rows.push(
      `\\textbf{Technical:} & ${esc(data.skills.technical.join(", "))} \\\\`
    );
  if (data.skills.tools?.length)
    rows.push(
      `\\textbf{Tools:} & ${esc(data.skills.tools.join(", "))} \\\\`
    );
  if (data.skills.languages?.length)
    rows.push(
      `\\textbf{Languages:} & ${esc(data.skills.languages.join(", "))} \\\\`
    );
  if (data.skills.soft?.length)
    rows.push(
      `\\textbf{Soft Skills:} & ${esc(data.skills.soft.join(", "))} \\\\`
    );

  if (rows.length === 0) return "";

  return `\\section*{Skills}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n\\begin{tabular}{@{}l l}\n${rows.join("\n")}\n\\end{tabular}`;
}

function buildProjects(data: ResumeData): string {
  if (!data.projects || data.projects.length === 0) return "";

  const entries = data.projects
    .map((proj) => {
      const techLine = proj.technologies.length
        ? `{\\small \\textit{${esc(proj.technologies.join(", "))}}}\\\\`
        : "";
      const bullets = proj.bullets
        .map((b) => `  \\item ${esc(b)}`)
        .join("\n");
      const nameWithLink = proj.url
        ? `\\href{${escUrl(proj.url)}}{${esc(proj.name)}}`
        : esc(proj.name);
      return `\\subsection*{${nameWithLink}}
${techLine}
{\\small ${esc(proj.description)}}
\\begin{itemize}
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");

  return `\\section*{Projects}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n${entries}`;
}

function buildCertifications(data: ResumeData): string {
  if (!data.certifications || data.certifications.length === 0) return "";

  const items = data.certifications
    .map(
      (c) =>
        `  \\item \\textbf{${esc(c.name)}} --- ${esc(c.issuer)} \\hfill {\\small ${esc(c.date)}}`
    )
    .join("\n");

  return `\\section*{Certifications}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n\\begin{itemize}\n${items}\n\\end{itemize}`;
}

export function buildLatex(data: ResumeData): string {
  const summarySection = data.summary
    ? `\\section*{Summary}\n\\vspace{-0.5em}\n\\hrule\n\\vspace{0.5em}\n${esc(data.summary)}\n`
    : "";

  const sections = [
    summarySection,
    buildExperience(data),
    buildEducation(data),
    buildSkills(data),
    buildProjects(data),
    buildCertifications(data),
  ]
    .filter(Boolean)
    .join("\n\n");

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{parskip}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}

% Hyperlink styling
\\hypersetup{
  colorlinks=true,
  urlcolor=black,
  linkcolor=black
}

% Compact lists
\\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=1.2em}

% Section formatting — applies to both \section and \section*
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}
\\titlespacing*{\\section}{0pt}{1em}{0.2em}

% Subsection formatting — applies to both \subsection and \subsection*
\\titleformat{\\subsection}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing*{\\subsection}{0pt}{0.6em}{0.1em}

\\pagestyle{empty}

\\begin{document}

% Header
\\begin{center}
  {\\LARGE\\textbf{${esc(data.contact.name)}}}\\\\[4pt]
  {\\small ${buildContactLine(data)}}
\\end{center}

\\vspace{0.5em}

${sections}

\\end{document}`;
}

export async function compilePdf(data: ResumeData): Promise<Buffer> {
  const latex = buildLatex(data);

  const workDir = join(
    tmpdir(),
    `resume-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(workDir, { recursive: true });

  const texPath = join(workDir, "resume.tex");
  const pdfPath = join(workDir, "resume.pdf");

  writeFileSync(texPath, latex, "utf8");

  try {
    execSync(`tectonic -X compile "${texPath}" --outdir "${workDir}"`, {
      timeout: 60000,
      stdio: "pipe",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stderr =
      err && typeof err === "object" && "stderr" in err
        ? String((err as { stderr: Buffer }).stderr)
        : "";
    const stdout =
      err && typeof err === "object" && "stdout" in err
        ? String((err as { stdout: Buffer }).stdout)
        : "";
    throw new Error(
      `Tectonic compilation failed: ${msg}\nstderr: ${stderr}\nstdout: ${stdout}`
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = readFileSync(pdfPath);
  } catch {
    throw new Error(
      `Tectonic ran but output PDF not found at ${pdfPath}. Check LaTeX source.`
    );
  }

  return pdfBuffer;
}
