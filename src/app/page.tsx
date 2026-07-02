"use client";

import { useState, useCallback } from "react";
import { SiteHeader } from "@/components/claimsight/site-header";
import { SiteHero } from "@/components/claimsight/site-hero";
import { ClaimsDashboard } from "@/components/claimsight/claims-dashboard";
import { ClaimProcessor } from "@/components/claimsight/claim-processor";
import { CustomClaimBuilder, type CustomClaimData } from "@/components/claimsight/custom-claim-builder";
import { EvalDashboard } from "@/components/claimsight/eval-dashboard";
import { ArchitectureView } from "@/components/claimsight/architecture-view";
import { SiteFooter } from "@/components/claimsight/site-footer";

export default function Home() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [customClaim, setCustomClaim] = useState<CustomClaimData | null>(null);

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
    setCustomClaim(null); // clear any custom claim when picking a pre-loaded one
    setTimeout(() => {
      const el = document.getElementById("processor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, []);

  const handleRunCustom = useCallback((data: CustomClaimData) => {
    setCustomClaim(data);
    setSelectedClaimId(null); // clear any pre-loaded claim selection
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
        <ClaimProcessor claimId={selectedClaimId} customClaim={customClaim} />
        <CustomClaimBuilder onRunCustom={handleRunCustom} />
        <EvalDashboard />
        <ArchitectureView />
      </main>
      <SiteFooter />
    </div>
  );
}
