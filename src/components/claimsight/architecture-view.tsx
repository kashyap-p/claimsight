"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitBranch, Cpu, Eye, ShieldAlert, Gavel, Search,
  Layers, Gauge, Boxes, Server, Zap, Lock, RefreshCw,
  FileText, ShieldCheck, Workflow,
} from "lucide-react";

const layers = [
  {
    title: "Agent Orchestration",
    icon: GitBranch,
    color: "var(--primary)",
    items: [
      "LangGraph state machine with typed shared state channel",
      "Supervisor + worker topology with parallel fan-out",
      "Conditional edges (LOB + severity → path)",
      "Human-in-the-loop interrupts (LangGraph checkpoint)",
      "Per-agent retry + circuit breakers",
    ],
  },
  {
    title: "RAG & Retrieval",
    icon: Search,
    color: "var(--chart-2)",
    items: [
      "Hybrid: pgvector dense (bge-m3) + BM25 sparse",
      "Reciprocal rank fusion",
      "Cross-encoder re-ranking (Text Ranking) — top 20 → top 5",
      "Hierarchical chunking + parent-doc retrieval",
      "Metadata-filtered semantic search (policy#, state, LOB)",
    ],
  },
  {
    title: "Multimodal Vision",
    icon: Eye,
    color: "var(--chart-3)",
    items: [
      "Image Classification (severity) + Object Detection (components)",
      "Image Segmentation → damage-area % → cost estimate",
      "Zero-Shot Image Classification (LOB routing at inference)",
      "Image Feature Extraction → visual RAG / fraud dedup",
      "Depth Estimation (drone roof, stretch V2)",
    ],
  },
  {
    title: "LLMOps & Eval",
    icon: Gauge,
    color: "var(--chart-4)",
    items: [
      "Langfuse tracing — every span, token, cost, prompt version",
      "Prompt versioning in Git, loaded by version tag",
      "CI-gated eval harness (Ragas + DeepEval + LLM-judge)",
      "Model routing: vLLM open models + frontier-for-reasoning (−63% $/claim)",
      "NeMo Guardrails — PII redaction, schema validation",
      "Semantic cache (Redis) for repeat policy queries",
    ],
  },
];

const techStack = [
  { layer: "Orchestration", choice: "LangGraph", note: "stateful graphs, HITL interrupts" },
  { layer: "RAG / Ingest", choice: "LlamaIndex + LlamaParse", note: "hierarchical retrieval" },
  { layer: "Embeddings", choice: "bge-m3 (open)", note: "multilingual, self-hostable" },
  { layer: "Vector Store", choice: "pgvector (Postgres)", note: "ACID joins w/ structured rows" },
  { layer: "LLM Serving", choice: "vLLM + HF Inference", note: "model routing = cost control" },
  { layer: "Eval", choice: "Ragas + DeepEval", note: "multimodal coverage" },
  { layer: "Observability", choice: "Langfuse (self-hosted)", note: "trace/cost/eval surface" },
  { layer: "Guardrails", choice: "NeMo Guardrails", note: "PII + schema validation" },
  { layer: "Backend", choice: "FastAPI", note: "async, typed, LangGraph-native" },
  { layer: "Frontend", choice: "Next.js + shadcn/ui", note: "adjuster dashboard" },
  { layer: "Queue / Cache", choice: "Celery + Redis", note: "batch ingestion + sem cache" },
  { layer: "Infra", choice: "Docker + Terraform/AWS", note: "ECS + RDS pgvector + S3" },
];

const dataApis = [
  "FEMA Disaster Declarations — catastrophe flagging",
  "NOAA / NWS Weather — hail/wind/flood verification",
  "NHTSA Vehicle API — VIN decode + recall lookup",
  "openFDA — medical/health-adjacent claims",
  "USGS Flood Hazard Layer — flood-zone verification",
  "Synthea — synthetic patient data",
  "Kaggle fraud datasets — labeled eval corpus",
];

export function ArchitectureView() {
  return (
    <section id="architecture" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-border">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">System Design</h2>
        <p className="text-muted-foreground mt-1">
          Production-grade patterns: not an API wrapper — orchestration, RAG, multimodal, eval, LLMOps.
        </p>
      </div>

      {/* Pipeline flow diagram */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Workflow className="w-4 h-4" /> Multi-Agent Pipeline Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto scrollbar-thin">
            <div className="min-w-[760px] space-y-3">
              {/* Stage 1: Ingest */}
              <FlowStage
                label="1 · Ingest"
                color="var(--muted-foreground)"
                nodes={[
                  { icon: <Boxes className="w-4 h-4" />, label: "Claim Bundle (PDF + photo + audio + tables)" },
                ]}
              />
              <FlowArrow />
              {/* Stage 2: Router */}
              <FlowStage
                label="2 · Route"
                color="var(--chart-1)"
                nodes={[
                  { icon: <Cpu className="w-4 h-4" />, label: "Supervisor → Intake Router (zero-shot classify)" },
                ]}
              />
              <FlowArrow label="parallel fan-out" />
              {/* Stage 3: Parallel workers */}
              <FlowStage
                label="3 · Parallel Workers"
                color="var(--chart-2)"
                nodes={[
                  { icon: <FileText className="w-4 h-4" />, label: "Doc Extractor (NER + Doc QA)" },
                  { icon: <Search className="w-4 h-4" />, label: "Policy Retriever (RAG)" },
                  { icon: <Eye className="w-4 h-4" />, label: "Vision Assessor (Det+Seg+Classif)" },
                ]}
              />
              <FlowArrow label="converge" />
              {/* Stage 4: Fraud + Coverage */}
              <FlowStage
                label="4 · Assess"
                color="var(--chart-5)"
                nodes={[
                  { icon: <ShieldAlert className="w-4 h-4" />, label: "Fraud Detector (text + tabular)" },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: "Coverage Verifier (clause match)" },
                ]}
              />
              <FlowArrow />
              {/* Stage 5: Adjudicator */}
              <FlowStage
                label="5 · Adjudicate"
                color="var(--chart-4)"
                nodes={[
                  { icon: <Gavel className="w-4 h-4" />, label: "Adjudicator (cited recommendation)" },
                ]}
              />
              <FlowArrow />
              {/* Stage 6: Auditor */}
              <FlowStage
                label="6 · QA Gate"
                color="var(--primary)"
                nodes={[
                  { icon: <Gauge className="w-4 h-4" />, label: "Auditor (groundedness + compliance) → pass / retry / escalate" },
                ]}
              />
              <FlowArrow label="human-in-the-loop" />
              {/* Stage 7: Output */}
              <FlowStage
                label="7 · Output"
                color="var(--chart-2)"
                nodes={[
                  { icon: <Gavel className="w-4 h-4" />, label: "Settlement memo + citations → adjuster review → payout" },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Four pillars */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <Card key={layer.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-lg"
                    style={{ backgroundColor: `color-mix(in oklch, ${layer.color} 15%, transparent)`, color: layer.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  {layer.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {layer.items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-muted-foreground/50 mt-0.5">▸</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tech stack table */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Recommended Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {techStack.map((t) => (
                <div key={t.layer} className="flex items-baseline gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground w-28 shrink-0 text-xs uppercase tracking-wide">{t.layer}</span>
                  <span className="font-semibold">{t.choice}</span>
                  <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">{t.note}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Server className="w-4 h-4" /> Real-World Data APIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {dataApis.map((api, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Zap className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span className="leading-snug">{api}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* LLMOps feature row */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> LLMOps — Production Maturity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <OpsFeature icon={<Gauge className="w-4 h-4" />} title="Observability" desc="Langfuse: every span, token cost, latency, prompt version traced" />
            <OpsFeature icon={<GitBranch className="w-4 h-4" />} title="Prompt Versioning" desc="Prompts in Git, A/B via feature flag, rollback in seconds" />
            <OpsFeature icon={<Cpu className="w-4 h-4" />} title="Model Routing" desc="Open models for extraction, frontier for reasoning — −63% $/claim" />
            <OpsFeature icon={<Lock className="w-4 h-4" />} title="Guardrails" desc="NeMo: PII redaction (SSN, VIN), output schema validation" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FlowStage({ label, color, nodes }: { label: string; color: string; nodes: { icon: React.ReactNode; label: string }[] }) {
  return (
    <div>
      <div className="text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color }}>{label}</div>
      <div className="flex gap-2 flex-wrap">
        {nodes.map((node, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm bg-card"
            style={{ borderColor: `color-mix(in oklch, ${color} 30%, transparent)` }}
          >
            <span style={{ color }}>{node.icon}</span>
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 pl-3 py-0.5">
      <div className="w-0.5 h-4 bg-border" />
      {label && <span className="text-[10px] text-muted-foreground font-mono">{label}</span>}
    </div>
  );
}

function OpsFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 mb-1.5 text-primary">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
