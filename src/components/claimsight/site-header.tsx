"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  onNav: (id: string) => void;
}

export function SiteHeader({ onNav }: Props) {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setDemoMode(d.demoMode))
      .catch(() => setDemoMode(true));
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <button
          onClick={() => onNav("top")}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight">ClaimSight</span>
        </button>

        <nav className="flex items-center gap-1 text-sm overflow-x-auto scrollbar-thin">
          <NavBtn label="Claims Queue" onClick={() => onNav("dashboard")} />
          <NavBtn label="Pipeline" onClick={() => onNav("processor")} />
          <NavBtn label="Custom Claim" onClick={() => onNav("custom")} />
          <NavBtn label="Eval Harness" onClick={() => onNav("evals")} />
          <NavBtn label="Architecture" onClick={() => onNav("architecture")} />
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {demoMode && (
            <Badge
              variant="outline"
              className="text-xs border-chart-3/40 text-chart-3 bg-chart-3/5 hidden md:inline-flex"
              title="Running with simulated agent responses. Configure .z-ai-config for real LLM calls. See README."
            >
              demo mode
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
            9 agents
          </Badge>
        </div>
      </div>
    </header>
  );
}

function NavBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap text-sm font-medium"
    >
      {label}
    </button>
  );
}
