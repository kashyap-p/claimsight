"use client";

import { ShieldCheck, Zap, GitBranch, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SiteHero() {
  return (
    <section className="relative overflow-hidden border-b border-border grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">ClaimSight</span>
          <Badge variant="secondary" className="ml-2 font-mono text-xs">v0.4.2</Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
          The multi-modal,{" "}
          <span className="text-primary">multi-agent</span>{" "}
          claims adjudication copilot.
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
          Ingest a messy insurance claim — scanned PDF, phone photo, recorded call, policy table —
          and a 12-agent <span className="font-semibold text-foreground">LangGraph</span> workflow triages it,
          assesses damage from imagery, verifies coverage against the policy via{" "}
          <span className="font-semibold text-foreground">RAG</span>, scores fraud, and drafts a{" "}
          <span className="font-semibold text-foreground">cited</span> settlement recommendation.
          Shipped with a CI-gated eval harness and Langfuse tracing.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl">
          <StatCard icon={<GitBranch className="w-4 h-4" />} label="Agents in graph" value="12" sub="supervisor + workers" />
          <StatCard icon={<Zap className="w-4 h-4" />} label="Triage time" value="6 min" sub="down from 45 min" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Citation groundedness" value="94%" sub="Ragas faithfulness" />
          <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="HF tasks used" value="18" sub="across 4 modalities" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1.5">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
