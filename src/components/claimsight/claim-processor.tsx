"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, Play, RotateCcw, CheckCircle2, AlertTriangle, XCircle,
  Cpu, Search, FileText, Eye, ShieldAlert, Gavel, ClipboardCheck,
  GitBranch, Clock, Quote, CircleDollarSign, Activity,
} from "lucide-react";
import type { Claim } from "@/lib/claims";

// Agent definitions for the graph visualization
const AGENTS = [
  { id: "supervisor", name: "Supervisor", icon: GitBranch, color: "var(--primary)", desc: "Orchestrates the graph" },
  { id: "router", name: "Intake Router", icon: Cpu, color: "#0ea5e9", desc: "Classifies LOB & severity" },
  { id: "extractor", name: "Document Extractor", icon: FileText, color: "#8b5cf6", desc: "NER + Doc QA on forms" },
  { id: "retriever", name: "Policy Retriever", icon: Search, color: "#14b8a6", desc: "RAG over policy corpus" },
  { id: "vision", name: "Vision Assessor", icon: Eye, color: "#f59e0b", desc: "Det + Seg + Classif" },
  { id: "fraud", name: "Fraud Detector", icon: ShieldAlert, color: "#ef4444", desc: "Text + tabular signals" },
  { id: "coverage", name: "Coverage Verifier", icon: ClipboardCheck, color: "#10b981", desc: "Clause matching" },
  { id: "adjudicator", name: "Adjudicator", icon: Gavel, color: "#6366f1", desc: "Cited recommendation" },
  { id: "auditor", name: "Auditor", icon: ShieldAlert, color: "#0d9488", desc: "QA gate" },
] as const;

type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentEvent {
  type: "agent_start" | "agent_complete" | "agent_error" | "pipeline_complete";
  agentId: string;
  agentName: string;
  timestamp: number;
  durationMs?: number;
  result?: string;
  state?: any;
  error?: string;
}

interface Props {
  claimId: string | null;
}

export function ClaimProcessor({ claimId }: Props) {
  const [claim, setClaim] = useState<Claim | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [finalState, setFinalState] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load claim detail
  useEffect(() => {
    if (!claimId) {
      setClaim(null);
      return;
    }
    fetch(`/api/claims/${claimId}`)
      .then((r) => r.json())
      .then((data) => setClaim(data))
      .catch(() => setClaim(null));
    // Reset state on new claim
    setAgentStatuses({});
    setEvents([]);
    setFinalState(null);
    setActiveAgent(null);
  }, [claimId]);

  const handleRun = useCallback(async () => {
    if (!claimId || running) return;
    setRunning(true);
    setAgentStatuses({});
    setEvents([]);
    setFinalState(null);
    setActiveAgent(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`/api/process?claimId=${claimId}`, { signal: controller.signal });
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event: AgentEvent = JSON.parse(jsonStr);
              handleEvent(event);
            } catch {
              // ignore parse errors on partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setEvents((prev) => [
          ...prev,
          {
            type: "agent_error",
            agentId: "supervisor",
            agentName: "Supervisor",
            timestamp: Date.now(),
            error: err?.message ?? "Connection error",
          },
        ]);
      }
    } finally {
      setRunning(false);
      setActiveAgent(null);
    }
  }, [claimId, running]);

  const handleEvent = useCallback((event: AgentEvent) => {
    if (event.type === "agent_start") {
      setAgentStatuses((prev) => ({ ...prev, [event.agentId]: "running" }));
      setActiveAgent(event.agentId);
    } else if (event.type === "agent_complete") {
      setAgentStatuses((prev) => ({ ...prev, [event.agentId]: "done" }));
      if (event.state) {
        setFinalState((prev: any) => ({ ...prev, ...event.state }));
      }
    } else if (event.type === "agent_error") {
      setAgentStatuses((prev) => ({ ...prev, [event.agentId]: "error" }));
    } else if (event.type === "pipeline_complete") {
      setFinalState(event.state);
    }
    setEvents((prev) => [...prev, event]);
  }, []);

  // Auto-scroll event log
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [events]);

  const handleReset = () => {
    abortRef.current?.abort();
    setRunning(false);
    setAgentStatuses({});
    setEvents([]);
    setFinalState(null);
    setActiveAgent(null);
  };

  if (!claimId || !claim) {
    return (
      <section id="processor" className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4">
              <Gavel className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No claim selected yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              Click a claim card above (look for the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold align-middle">START HERE</span> badge) to load it here, then hit <span className="font-semibold text-foreground">Run Pipeline</span> to watch the 9 agents work.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Waiting for claim selection
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section id="processor" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-border">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Adjudication Pipeline</h2>
          <p className="text-muted-foreground mt-1">
            <span className="font-mono text-sm">{claim.id}</span> · {claim.claimant} · {claim.lob}
          </p>
        </div>
        <div className="flex gap-2">
          {running ? (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
          ) : (
            <Button size="lg" onClick={handleRun} className="agent-pulse text-base px-6">
              <Play className="w-4 h-4 mr-2 fill-current" /> Run Pipeline
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left: Agent graph + claim detail */}
        <div className="lg:col-span-2 space-y-4">
          <AgentGraph statuses={agentStatuses} activeAgent={activeAgent} />
          <ClaimDetailCard claim={claim} />
        </div>

        {/* Right: Event log + results */}
        <div className="lg:col-span-3 space-y-4">
          <EventLogCard events={events} logRef={eventLogRef} running={running} />
          {finalState && <ResultsPanel state={finalState} />}
        </div>
      </div>
    </section>
  );
}

// ===== Agent Graph Visualization =====
function AgentGraph({ statuses, activeAgent }: { statuses: Record<string, AgentStatus>; activeAgent: string | null }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4" /> Agent Graph
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {AGENTS.map((agent, idx) => {
          const status = statuses[agent.id] ?? "idle";
          const Icon = agent.icon;
          return (
            <div key={agent.id}>
              <div
                className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                  status === "running"
                    ? "border-primary bg-primary/5 agent-pulse"
                    : status === "done"
                    ? "border-primary/30 bg-primary/5"
                    : status === "error"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-card"
                }`}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ backgroundColor: `color-mix(in oklch, ${agent.color} 15%, transparent)`, color: agent.color }}
                >
                  {status === "running" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === "done" ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: agent.color }} />
                  ) : status === "error" ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <Icon className="w-4 h-4 opacity-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight">{agent.name}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{agent.desc}</div>
                </div>
                {status === "running" && (
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary animate-pulse">
                    running
                  </Badge>
                )}
                {status === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                )}
              </div>
              {idx < AGENTS.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <div className={`w-0.5 h-3 ${statuses[agent.id] === "done" ? "bg-primary/40" : "bg-border"}`} />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ===== Claim Detail Card =====
function ClaimDetailCard({ claim }: { claim: Claim }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Claim Bundle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Amount" value={`$${claim.amount.toLocaleString()}`} />
          <Field label="Date of Loss" value={claim.dateOfLoss} />
          <Field label="Location" value={claim.location} />
          <Field label="Policy" value={claim.policyId} mono />
        </div>
        <Separator />
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">CLAIMANT NARRATIVE</div>
          <p className="text-sm leading-relaxed">{claim.narrative}</p>
        </div>
        <Separator />
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">DOCUMENTS ({claim.documents.length})</div>
          <div className="space-y-1.5">
            {claim.documents.map((doc) => (
              <div key={doc.id} className="flex items-start gap-2 text-xs">
                <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-muted-foreground line-clamp-2">{doc.content.slice(0, 120)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">PHOTO EVIDENCE ({claim.photos.length})</div>
          <div className="space-y-1.5">
            {claim.photos.map((photo) => (
              <div key={photo.id} className="flex items-start gap-2 text-xs">
                <Eye className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-muted-foreground line-clamp-2">{photo.description.slice(0, 140)}...</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

// ===== Event Log =====
function EventLogCard({ events, logRef, running }: { events: AgentEvent[]; logRef: React.RefObject<HTMLDivElement | null>; running: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" /> Pipeline Trace
          {running && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Click <span className="font-medium text-foreground">Run Pipeline</span> to stream live agent execution.
          </div>
        ) : (
          <div
            ref={logRef}
            className="max-h-72 overflow-y-auto scrollbar-thin space-y-1.5 pr-1 font-mono text-xs"
          >
            {events.map((event, i) => (
              <EventLine key={i} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventLine({ event }: { event: AgentEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString("en-US", { hour12: false }) +
    "." + String(event.timestamp % 1000).padStart(3, "0");

  if (event.type === "agent_error") {
    return (
      <div className="flex gap-2 text-destructive fade-in-up">
        <span className="text-muted-foreground">{time}</span>
        <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span><span className="font-semibold">{event.agentName}</span>: {event.error}</span>
      </div>
    );
  }

  const isStart = event.type === "agent_start";
  return (
    <div className={`flex gap-2 fade-in-up ${isStart ? "text-muted-foreground" : ""}`}>
      <span className="text-muted-foreground">{time}</span>
      {isStart ? (
        <Play className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
      )}
      <span>
        <span className="font-semibold">{event.agentName}</span>
        {isStart ? " started" : " complete"}
        {!isStart && event.durationMs != null && (
          <span className="text-muted-foreground"> · {event.durationMs}ms</span>
        )}
        {!isStart && event.result && (
          <span className="text-muted-foreground"> — {event.result}</span>
        )}
      </span>
    </div>
  );
}

// ===== Results Panel =====
function ResultsPanel({ state }: { state: any }) {
  const adjudication = state.adjudication;
  const audit = state.audit;

  if (!adjudication) return null;

  const decisionColor =
    adjudication.decision === "approve" ? "text-chart-2" :
    adjudication.decision === "deny" ? "text-destructive" :
    "text-chart-3";

  const decisionBg =
    adjudication.decision === "approve" ? "bg-chart-2/10 border-chart-2/20" :
    adjudication.decision === "deny" ? "bg-destructive/10 border-destructive/20" :
    "bg-chart-3/10 border-chart-3/20";

  return (
    <div className="space-y-4">
      {/* Decision card */}
      <Card className={`border-2 ${decisionBg}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Final Decision</div>
              <div className={`text-3xl font-bold ${decisionColor} capitalize`}>{adjudication.decision}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Recommended Payout</div>
              <div className="text-3xl font-bold flex items-center gap-1">
                <CircleDollarSign className="w-6 h-6" />
                {Number(adjudication.recommendedPayout ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
          <Separator className="my-3" />
          <p className="text-sm leading-relaxed">{adjudication.summary}</p>
        </CardContent>
      </Card>

      {/* Agent findings grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {state.routing && (
          <FindingCard title="Routing" icon={<GitBranch className="w-4 h-4" />}>
            <div className="flex gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="text-xs capitalize">{state.routing.path.replace("_", " ")}</Badge>
              <Badge variant="outline" className="text-xs capitalize">{state.routing.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{state.routing.rationale}</p>
          </FindingCard>
        )}

        {state.damageAssessment && (
          <FindingCard title="Damage Assessment" icon={<Eye className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <div className="text-muted-foreground">Severity</div>
                <div className="font-medium capitalize">{state.damageAssessment.severity}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Damage area</div>
                <div className="font-medium">{state.damageAssessment.estimatedDamageAreaPct}%</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium mb-1.5 ${
              state.damageAssessment.consistencyWithNarrative ? "text-chart-2" : "text-destructive"
            }`}>
              {state.damageAssessment.consistencyWithNarrative ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Consistent with narrative</>
              ) : (
                <><AlertTriangle className="w-3.5 h-3.5" /> INCONSISTENCY detected</>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">{state.damageAssessment.notes}</p>
          </FindingCard>
        )}

        {state.fraudAssessment && (
          <FindingCard title="Fraud Assessment" icon={<ShieldAlert className="w-4 h-4" />}>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold">
                {state.fraudAssessment.score}
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${
                  state.fraudAssessment.recommendation === "clear" ? "text-chart-2" :
                  state.fraudAssessment.recommendation === "refer_to_siu" ? "text-destructive" :
                  "text-chart-3"
                }`}
              >
                {state.fraudAssessment.recommendation.replace(/_/g, " ")}
              </Badge>
            </div>
            {state.fraudAssessment.signals?.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {state.fraudAssessment.signals.slice(0, 3).map((s: string, i: number) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-muted-foreground/60">•</span> {s}
                  </li>
                ))}
              </ul>
            )}
          </FindingCard>
        )}

        {state.coverageAnalysis && (
          <FindingCard title="Coverage Verification" icon={<ClipboardCheck className="w-4 h-4" />}>
            <div className={`flex items-center gap-1.5 text-xs font-medium mb-2 ${
              state.coverageAnalysis.covered ? "text-chart-2" : "text-destructive"
            }`}>
              {state.coverageAnalysis.covered ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Covered under policy</>
              ) : (
                <><XCircle className="w-3.5 h-3.5" /> Not covered</>
              )}
            </div>
            <div className="text-xs space-y-1">
              <div><span className="text-muted-foreground">Deductible:</span> <span className="font-medium">{state.coverageAnalysis.deductible}</span></div>
              {state.coverageAnalysis.exclusions?.length > 0 && (
                <div><span className="text-muted-foreground">Exclusions:</span> <span className="font-medium text-destructive">{state.coverageAnalysis.exclusions.join(", ")}</span></div>
              )}
            </div>
          </FindingCard>
        )}
      </div>

      {/* Retrieved clauses (RAG) */}
      {state.policyRetrieval?.clauses?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" /> Retrieved Policy Clauses (RAG)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.policyRetrieval.clauses.map((clause: any) => (
              <div key={clause.id} className="rounded-lg border border-border p-3 bg-muted/30">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{clause.id}</Badge>
                    <span className="text-sm font-medium">{clause.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">score {clause.score}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{clause.section}</div>
                <p className="text-xs leading-relaxed">{clause.snippet}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Adjudication rationale + citations */}
      {adjudication.rationale && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gavel className="w-4 h-4" /> Adjudication Rationale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{adjudication.rationale}</p>
            {adjudication.citations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5" /> CITATIONS ({adjudication.citations.length})
                </div>
                <div className="space-y-2">
                  {adjudication.citations.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg border-l-2 border-primary/40 pl-3 py-1.5">
                      <p className="text-xs mb-1">{c.claim}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[10px]">{c.clauseId}</Badge>
                        <span className="text-xs text-muted-foreground">{c.clauseTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit gate */}
      {audit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Auditor QA Gate
              <Badge
                variant="outline"
                className={`text-xs ml-auto capitalize ${
                  audit.verdict === "pass" ? "text-chart-2 border-chart-2/30" :
                  audit.verdict === "escalate" ? "text-destructive border-destructive/30" :
                  "text-chart-3 border-chart-3/30"
                }`}
              >
                {audit.verdict}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <ScoreBar label="Groundedness" value={audit.groundednessScore} />
              <ScoreBar label="Coverage Logic" value={audit.coverageLogicScore} />
              <ScoreBar label="Compliance" value={audit.complianceScore} />
            </div>
            {audit.issues?.length > 0 && (
              <div className="text-xs">
                <div className="text-muted-foreground font-medium mb-1">ISSUES</div>
                <ul className="space-y-0.5">
                  {audit.issues.map((issue: string, i: number) => (
                    <li key={i} className="flex gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-chart-3 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FindingCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 80 ? "bg-chart-2" : v >= 60 ? "bg-chart-3" : "bg-destructive";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{v}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
