"use client";

import { useState, useCallback } from "react";
import { SiteHeader } from "@/components/claimsight/site-header";
import { SiteHero } from "@/components/claimsight/site-hero";
import { ClaimsDashboard } from "@/components/claimsight/claims-dashboard";
import { ClaimProcessor } from "@/components/claimsight/claim-processor";
import { EvalDashboard } from "@/components/claimsight/eval-dashboard";
import { ArchitectureView } from "@/components/claimsight/architecture-view";
import { SiteFooter } from "@/components/claimsight/site-footer";

export default function Home() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const handleNav = useCallback((id: string) => {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleSelectClaim = useCallback((id: string) => {
    setSelectedClaimId(id);
    // scroll to processor after selection
    setTimeout(() => {
      const el = document.getElementById("processor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader onNav={handleNav} />
      <main className="flex-1">
        <SiteHero />
        <ClaimsDashboard onSelectClaim={handleSelectClaim} selectedId={selectedClaimId ?? undefined} />
        <ClaimProcessor claimId={selectedClaimId} />
        <EvalDashboard />
        <ArchitectureView />
      </main>
      <SiteFooter />
    </div>
  );
}
