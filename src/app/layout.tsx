import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClaimSight — Multi-Modal Multi-Agent Claims Adjudication Copilot",
  description:
    "A production-grade AI system that ingests messy insurance claims and runs them through a 12-agent LangGraph workflow: triage, document extraction, vision-based damage assessment, RAG over policy corpora, fraud scoring, and cited settlement recommendations.",
  keywords: ["AI engineering", "LangGraph", "RAG", "multi-agent", "LLMOps", "claims", "insurance", "HuggingFace", "pgvector"],
  authors: [{ name: "ClaimSight" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ClaimSight — Multi-Agent Claims Adjudication Copilot",
    description: "12-agent LangGraph workflow with RAG, multimodal vision, fraud detection, eval harness & LLMOps.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClaimSight",
    description: "Multi-modal multi-agent claims adjudication copilot",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
