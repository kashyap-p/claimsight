"use client";

import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">ClaimSight</div>
              <div className="text-xs text-muted-foreground">
                Multi-modal multi-agent claims adjudication copilot · portfolio project
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-chart-2 animate-pulse" />
              pipeline operational
            </span>
            <span className="font-mono">v0.4.2 · 12 agents · 18 HF tasks</span>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <span>Built with Next.js · LangGraph · pgvector · Langfuse · z-ai SDK</span>
          <span>Sample data is synthetic. Not affiliated with any insurer.</span>
        </div>
      </div>
    </footer>
  );
}
