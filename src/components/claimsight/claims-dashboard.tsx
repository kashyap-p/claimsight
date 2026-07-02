"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, DollarSign, MapPin, ChevronRight, Loader2 } from "lucide-react";

interface ClaimSummary {
  id: string;
  claimant: string;
  lob: string;
  dateOfLoss: string;
  status: string;
  location: string;
  amount: number;
  narrative: string;
  policyId: string;
  documentCount: number;
  photoCount: number;
}

interface Props {
  onSelectClaim: (id: string) => void;
  selectedId?: string;
}

const lobColors: Record<string, string> = {
  auto: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  homeowners: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  property: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export function ClaimsDashboard({ onSelectClaim, selectedId }: Props) {
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claims")
      .then((r) => r.json())
      .then((data) => {
        setClaims(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="dashboard" className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {/* How it works onboarding */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">i</span>
          <span className="font-semibold text-sm">How to use ClaimSight</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="flex gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
            <div>
              <div className="font-medium">Pick a claim</div>
              <div className="text-muted-foreground text-xs leading-relaxed">Click any claim card below — these are pre-loaded sample insurance claims.</div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
            <div>
              <div className="font-medium">Run the pipeline</div>
              <div className="text-muted-foreground text-xs leading-relaxed">Hit the green &quot;Run Pipeline&quot; button that appears — 9 AI agents start working.</div>
            </div>
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
            <div>
              <div className="font-medium">Watch agents live</div>
              <div className="text-muted-foreground text-xs leading-relaxed">Agents stream results in real time, ending with a cited approve/deny decision.</div>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-primary/20 text-xs text-muted-foreground">
          💡 This is a <span className="font-medium text-foreground">workflow automation tool</span>, not a chatbot — there&apos;s no text input. The &quot;input&quot; is selecting a claim and clicking Run.
        </div>
      </div>

      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Claims Queue</h2>
          <p className="text-muted-foreground mt-1">
            Live claims awaiting adjudication. <span className="font-medium text-foreground">Click a claim to select it →</span>
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {claims.length} claims · 3 lines of business
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading claims...
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {claims.map((claim, idx) => (
            <Card
              key={claim.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 group relative ${
                selectedId === claim.id ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => onSelectClaim(claim.id)}
            >
              {idx === 0 && !selectedId && (
                <div className="absolute -top-2 left-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm pointer-events-none">
                  START HERE
                </div>
              )}
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono text-sm font-semibold">{claim.id}</span>
                      <Badge variant="outline" className={`text-xs ${lobColors[claim.lob] ?? ""}`}>
                        {claim.lob}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{claim.status}</Badge>
                      {selectedId === claim.id && (
                        <Badge className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <div className="font-semibold text-base mb-1">{claim.claimant}</div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{claim.narrative}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {claim.amount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {claim.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {claim.documentCount} docs
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {claim.photoCount} photos
                      </span>
                      <span className="font-mono">{claim.policyId}</span>
                    </div>
                  </div>
                  <Button
                    variant={selectedId === claim.id ? "default" : "ghost"}
                    size="sm"
                    className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {selectedId === claim.id ? "Selected" : "Select"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
