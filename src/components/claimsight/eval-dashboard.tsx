"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import {
  Activity, TrendingUp, TrendingDown, GitCommit, CheckCircle2, XCircle,
  Gauge, Cpu, Database, ShieldCheck, FileText, Eye, Gavel,
} from "lucide-react";

interface EvalMetric {
  name: string;
  description: string;
  value: number;
  unit: string;
  baseline: number;
  target: number;
  category: string;
}

interface EvalRun {
  id: string;
  timestamp: string;
  commitSha: string;
  promptVersion: string;
  passed: boolean;
  metrics: { name: string; value: number; delta: number }[];
}

interface HfTaskUsage {
  task: string;
  category: string;
  agent: string;
  impact: string;
}

interface EvalData {
  evalMetrics: EvalMetric[];
  evalRuns: EvalRun[];
  hfTaskUsage: HfTaskUsage[];
}

const categoryColors: Record<string, string> = {
  retrieval: "var(--chart-1)",
  extraction: "var(--chart-4)",
  vision: "var(--chart-3)",
  fraud: "var(--chart-5)",
  adjudication: "var(--chart-2)",
  system: "var(--chart-1)",
};

const categoryIcons: Record<string, React.ReactNode> = {
  retrieval: <Database className="w-3.5 h-3.5" />,
  extraction: <FileText className="w-3.5 h-3.5" />,
  vision: <Eye className="w-3.5 h-3.5" />,
  fraud: <ShieldCheck className="w-3.5 h-3.5" />,
  adjudication: <Gavel className="w-3.5 h-3.5" />,
  system: <Cpu className="w-3.5 h-3.5" />,
};

export function EvalDashboard() {
  const [data, setData] = useState<EvalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evals")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-border">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading eval harness...
        </div>
      </section>
    );
  }

  const { evalMetrics, evalRuns, hfTaskUsage } = data;

  // Radar chart data — normalize metrics to 0-100
  const radarData = evalMetrics
    .filter((m) => m.unit === "%")
    .slice(0, 8)
    .map((m) => ({
      metric: m.name.length > 18 ? m.name.slice(0, 16) + "…" : m.name,
      ClaimSight: m.value,
      Baseline: m.baseline,
      Target: m.target,
    }));

  return (
    <section id="evals" className="mx-auto max-w-6xl px-4 sm:px-6 py-12 border-t border-border">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Eval Harness</h2>
          <p className="text-muted-foreground mt-1">
            CI-gated regression testing across retrieval, extraction, vision, fraud & adjudication.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          <Gauge className="w-3 h-3 mr-1" /> {evalMetrics.length} metrics · {evalRuns.length} runs logged
        </Badge>
      </div>

      {/* Metric cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {evalMetrics.map((metric) => (
          <MetricCard key={metric.name} metric={metric} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Radar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> Quality Radar — ClaimSight vs Baseline vs Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                <Radar name="Baseline" dataKey="Baseline" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.15} strokeDasharray="4 4" />
                <Radar name="Target" dataKey="Target" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.1} strokeDasharray="2 2" />
                <Radar name="ClaimSight" dataKey="ClaimSight" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CI run history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <GitCommit className="w-4 h-4" /> CI Eval Runs (Prompt Regression Gate)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evalRuns.map((run) => (
                <div
                  key={run.id}
                  className={`rounded-lg border p-3 ${run.passed ? "border-chart-2/20 bg-chart-2/5" : "border-destructive/20 bg-destructive/5"}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {run.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-chart-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-mono text-xs">{run.commitSha}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">{run.promptVersion}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {run.metrics.map((m) => (
                      <div key={m.name} className="text-xs">
                        <span className="text-muted-foreground">{m.name}: </span>
                        <span className="font-mono font-medium">{m.value}</span>
                        <span className={`ml-0.5 ${m.delta > 0 ? "text-chart-2" : m.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {m.delta > 0 ? "+" : ""}{m.delta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Merge blocked if any metric drops &gt;2% vs. previous green run.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HF Tasks usage table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4" /> HuggingFace Tasks Integrated — {hfTaskUsage.length} across 4 modalities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <div className="col-span-4 sm:col-span-3">Task</div>
              <div className="col-span-3 hidden sm:block">Category</div>
              <div className="col-span-4 sm:col-span-2">Agent</div>
              <div className="col-span-4 sm:col-span-3">Impact</div>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {hfTaskUsage.map((t, i) => (
                <div
                  key={t.task}
                  className={`grid grid-cols-12 gap-2 px-3 py-2.5 text-sm items-start ${
                    i % 2 === 0 ? "bg-card" : "bg-muted/20"
                  }`}
                >
                  <div className="col-span-4 sm:col-span-3 font-medium">{t.task}</div>
                  <div className="col-span-3 hidden sm:block">
                    <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                  </div>
                  <div className="col-span-4 sm:col-span-2 text-xs text-muted-foreground">{t.agent}</div>
                  <div className="col-span-4 sm:col-span-3 text-xs text-muted-foreground">{t.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({ metric }: { metric: EvalMetric }) {
  const meetsTarget = metric.value >= metric.target;
  const beatsBaseline = metric.value > metric.baseline;
  const displayValue =
    metric.unit === "$" ? `$${metric.value}` :
    metric.unit === "ms" ? `${metric.value}s` :
    metric.unit === "%" ? `${metric.value}%` :
    `${metric.value}`;

  // For latency/cost, lower is better — invert the bar
  const lowerIsBetter = metric.unit === "ms" || metric.unit === "$";
  const ratio = lowerIsBetter
    ? Math.min(1, metric.baseline / metric.value)
    : Math.min(1, metric.value / 100);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {categoryIcons[metric.category]}
            <span className="uppercase tracking-wide">{metric.category}</span>
          </div>
          {meetsTarget ? (
            <Badge variant="outline" className="text-[10px] text-chart-2 border-chart-2/30">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> target met
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-chart-3 border-chart-3/30">
              <TrendingUp className="w-3 h-3 mr-0.5" /> improving
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold tracking-tight">{displayValue}</span>
          <span className="text-xs text-muted-foreground">
            {beatsBaseline ? (
              <span className="text-chart-2 inline-flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> vs {metric.unit === "%" ? metric.baseline + "%" : metric.unit === "$" ? "$" + metric.baseline : metric.baseline + (metric.unit === "ms" ? "s" : "")}</span>
            ) : (
              <span className="text-destructive inline-flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> vs {metric.baseline}</span>
            )}
          </span>
        </div>
        <div className="text-sm font-medium mb-1">{metric.name}</div>
        <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">{metric.description}</p>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full transition-all"
            style={{ width: `${ratio * 100}%`, backgroundColor: meetsTarget ? "var(--chart-2)" : "var(--primary)" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
