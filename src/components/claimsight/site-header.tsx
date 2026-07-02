"use client";

import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  onNav: (id: string) => void;
}

export function SiteHeader({ onNav }: Props) {
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
          <NavBtn label="Eval Harness" onClick={() => onNav("evals")} />
          <NavBtn label="Architecture" onClick={() => onNav("architecture")} />
        </nav>

        <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex shrink-0">
          12 agents
        </Badge>
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
