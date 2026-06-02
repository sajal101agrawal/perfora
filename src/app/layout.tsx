import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeIQ — ATS Resume Analyzer",
  description:
    "Upload your PDF resume and get an ATS score, skill gap analysis, professional summary, and an AI-generated ATS-optimized resume compiled with LaTeX.",
  openGraph: {
    title: "ResumeIQ — ATS Resume Analyzer",
    description: "Get an ATS score and generate an optimized resume with Claude AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
