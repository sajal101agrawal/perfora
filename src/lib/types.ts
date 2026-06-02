export const ATS_THRESHOLD = 70;

export interface ATSCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface Analysis {
  summary: string;
  atsScore: number;
  categories: ATSCategory[];
  gaps: string[];
  missingSkills: string[];
  interviewQuestions: string[];
  strengths: string[];
  recommendations: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
  honors?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  url?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    languages?: string[];
    tools?: string[];
  };
  projects: Project[];
  certifications: Certification[];
}

export interface AnalysisRecord {
  id: string;
  createdAt: Date;
  filename: string;
  analysis: Analysis;
  resumeData?: ResumeData;
}
