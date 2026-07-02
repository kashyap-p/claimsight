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
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Claims Queue</h2>
          <p className="text-muted-foreground mt-1">
            Live claims awaiting adjudication. Select one to run the full agent pipeline.
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
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
                selectedId === claim.id ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => onSelectClaim(claim.id)}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono text-sm font-semibold">{claim.id}</span>
                      <Badge variant="outline" className={`text-xs ${lobColors[claim.lob] ?? ""}`}>
                        {claim.lob}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{claim.status}</Badge>
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
                  <Button variant="ghost" size="sm" className="shrink-0">
                    Process <ChevronRight className="w-4 h-4 ml-1" />
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
