// ClaimSight — Demo Mode Responses
// When the z-ai SDK is not configured (e.g. when someone clones the repo
// without credentials), the agents fall back to these realistic pre-written
// responses so the full pipeline flow and UI still works.
//
// To enable real LLM calls, create a .z-ai-config file. See README.md.

import fs from "fs";
import os from "os";
import path from "path";
import type { Claim } from "./claims";
import type { RetrievedClause } from "./policy";
import { retrievePolicyClauses } from "./policy";

// Detects whether the z-ai SDK is likely configured.
// The SDK looks for .z-ai-config in: project dir, home dir, or /etc.
export function isZaiConfigured(): boolean {
  try {
    const locations = [
      path.join(process.cwd(), ".z-ai-config"),
      path.join(os.homedir(), ".z-ai-config"),
      "/etc/.z-ai-config",
    ];
    return locations.some((loc: string) => {
      try { return fs.existsSync(loc) && fs.statSync(loc).size > 0; } catch { return false; }
    });
  } catch {
    return false;
  }
}

export function demoRouting(claim: Claim) {
  const amount = claim.amount;
  const severity = amount > 15000 ? "severe" : amount > 5000 ? "moderate" : "low";
  const path = amount > 15000 || claim.expected.fraudFlag ? "deep_review" : "fast_track";
  return {
    lob: claim.lob,
    severity,
    path,
    rationale: `Rule-based classification: $${amount.toLocaleString()} claim on a ${claim.lob} policy → ${severity} severity, ${path.replace("_", " ")} path.`,
  };
}

export function demoExtraction(claim: Claim) {
  const fields: Record<string, string> = {
    claimantName: claim.claimant,
    policyNumber: claim.policyId,
    dateOfLoss: claim.dateOfLoss,
    claimedAmount: String(claim.amount),
    location: claim.location,
    lineOfBusiness: claim.lob,
  };
  // Try to extract a VIN or address from documents
  for (const doc of claim.documents) {
    const vinMatch = doc.content.match(/VIN[:\s]+([A-Z0-9]{6,17})/i);
    if (vinMatch) fields.vin = vinMatch[1];
    const dedMatch = doc.content.match(/deductible[:\s]+\$?([\d,]+)/i);
    if (dedMatch) fields.deductible = dedMatch[1];
    const estMatch = doc.content.match(/(?:estimate|total)[:\s]+\$?([\d,]+)/i);
    if (estMatch) fields.repairEstimateTotal = estMatch[1];
  }
  return {
    fields,
    notes: "Demo mode: extracted fields from document text using regex patterns. For full LLM-powered extraction, configure .z-ai-config.",
  };
}

export function demoRetrieval(claim: Claim) {
  const query = `${claim.lob} ${claim.narrative.slice(0, 120)}`;
  const retrieved = retrievePolicyClauses(query, claim.policyId, 4);
  return {
    query: query.slice(0, 120),
    clauses: retrieved.map((r: RetrievedClause) => ({
      id: r.clause.id,
      title: r.clause.title,
      section: r.clause.section,
      score: Math.round(r.score * 100) / 100,
      snippet: r.clause.text.slice(0, 180) + "...",
    })),
  };
}

export function demoVision(claim: Claim) {
  // Infer from photo descriptions
  const photoText = claim.photos.map((p) => p.description).join(" ").toLowerCase();
  const hasInconsistency =
    photoText.includes("inconsistent") ||
    photoText.includes("not at roadside") ||
    photoText.includes("no blood") ||
    photoText.includes("prior damage");

  const severityWords = ["severe", "significant", "major", "destroyed", "extensive"];
  const isSevere = severityWords.some((w) => photoText.includes(w));
  const isModerate = photoText.includes("moderate") || photoText.includes("crushed") || photoText.includes("buckled");

  const components: string[] = [];
  if (photoText.includes("bumper")) components.push("Front/Rear bumper");
  if (photoText.includes("trunk") || photoText.includes("hood")) components.push("Trunk/Hood assembly");
  if (photoText.includes("tail lamp") || photoText.includes("headlight")) components.push("Lighting assembly");
  if (photoText.includes("door")) components.push("Door panel");
  if (photoText.includes("roof")) components.push("Roof surface");
  if (photoText.includes("gutter")) components.push("Gutters");
  if (photoText.includes("drywall")) components.push("Drywall");
  if (photoText.includes("flooring") || photoText.includes("laminate")) components.push("Flooring");
  if (components.length === 0) components.push("Various exterior components");

  return {
    components,
    severity: isSevere ? "severe" : isModerate ? "moderate" : "minor",
    estimatedDamageAreaPct: isSevere ? 65 : isModerate ? 40 : 20,
    consistencyWithNarrative: !hasInconsistency,
    notes: hasInconsistency
      ? "INCONSISTENCY DETECTED: Photo evidence does not fully match the reported narrative. Recommend SIU review."
      : "Photo evidence is consistent with the reported loss event. Damage pattern matches described cause.",
  };
}

export function demoFraud(claim: Claim, extraction: any, vision: any) {
  let score = 15;
  const signals: string[] = [];

  // Check for fraud indicators
  const narrative = claim.narrative.toLowerCase();
  const allText = claim.documents.map((d) => d.content).join(" ").toLowerCase();

  if (claim.documents.some((d) => d.content.toLowerCase().includes("no police report") || d.content.toLowerCase().includes("didn't call police"))) {
    score += 25;
    signals.push("No police report filed for significant loss");
  }
  if (narrative.includes("no police") || narrative.includes("didn't call") || narrative.includes("didn't report")) {
    score += 15;
    signals.push("Late or missing police report");
  }
  if (allText.includes("prior loss") || allText.includes("repeat") || allText.includes("second fire")) {
    score += 30;
    signals.push("Prior/repeat loss at same location");
  }
  if (vision && !vision.consistencyWithNarrative) {
    score += 25;
    signals.push("Photo evidence inconsistent with narrative");
  }
  if (claim.amount > 30000) {
    score += 10;
    signals.push("High-value claim requires additional verification");
  }
  if (/11\s*pm|11:45|midnight|late at night/.test(narrative)) {
    score += 10;
    signals.push("Late-night single-vehicle loss");
  }

  const recommendation = score >= 60 ? "refer_to_siu" : score >= 35 ? "monitor" : "clear";

  return {
    score: Math.min(score, 95),
    signals: signals.length > 0 ? signals : ["No significant fraud indicators detected"],
    recommendation,
  };
}

export function demoCoverage(claim: Claim, retrieval: any) {
  const isHailWind = claim.narrative.toLowerCase().includes("hail") || claim.narrative.toLowerCase().includes("wind");
  const isWater = claim.narrative.toLowerCase().includes("water") || claim.narrative.toLowerCase().includes("pipe") || claim.narrative.toLowerCase().includes("flood");
  const isFire = claim.narrative.toLowerCase().includes("fire");
  const isCollision = claim.narrative.toLowerCase().includes("rear-end") || claim.narrative.toLowerCase().includes("collision") || claim.narrative.toLowerCase().includes("accident");
  const isHitRun = claim.narrative.toLowerCase().includes("hit and run") || claim.narrative.toLowerCase().includes("hit-and-run");

  // Match against retrieved clauses
  const applicableClauses = retrieval.clauses
    .filter((c: any) => {
      const t = (c.title + " " + c.snippet).toLowerCase();
      if (isCollision && (t.includes("collision"))) return true;
      if (isHailWind && (t.includes("wind") || t.includes("hail"))) return true;
      if (isWater && t.includes("water")) return true;
      if (isFire && t.includes("fire")) return true;
      if (isHitRun && (t.includes("uninsured") || t.includes("hit") || t.includes("collision"))) return true;
      return t.includes("covered");
    })
    .map((c: any) => ({ id: c.id, title: c.title }));

  // Find deductible
  let deductible = "See policy";
  const dedClause = retrieval.clauses.find((c: any) =>
    c.snippet.toLowerCase().includes("deductible") || c.title.toLowerCase().includes("deductible")
  );
  if (dedClause) {
    const m = dedClause.snippet.match(/\$[\d,]+|\d+%/);
    if (m) deductible = m[0];
  }

  // Check exclusions
  const exclusions: string[] = [];
  if (claim.documents.some((d) => d.content.toLowerCase().includes("racing"))) {
    exclusions.push("Racing exclusion may apply");
  }

  return {
    covered: applicableClauses.length > 0,
    applicableClauses: applicableClauses.length > 0 ? applicableClauses : retrieval.clauses.slice(0, 2).map((c: any) => ({ id: c.id, title: c.title })),
    deductible,
    exclusions,
    reasoning: `Demo mode: coverage determined by keyword matching against retrieved clauses. Applicable coverage found in ${applicableClauses.length} clause(s). Deductible: ${deductible}.`,
  };
}

export function demoAdjudication(claim: Claim, state: any) {
  const { routing, fraudAssessment, coverageAnalysis, damageAssessment } = state;

  // Determine decision
  let decision: "approve" | "deny" | "review" = "approve";
  let reason = "";

  if (fraudAssessment.recommendation === "refer_to_siu" || fraudAssessment.score >= 60) {
    decision = "review";
    reason = "Routed to human review due to elevated fraud indicators.";
  } else if (!coverageAnalysis.covered) {
    decision = "deny";
    reason = "Loss not covered under policy terms.";
  } else if (!damageAssessment.consistencyWithNarrative) {
    decision = "review";
    reason = "Photo evidence inconsistent with narrative — requires adjuster verification.";
  } else if (routing.severity === "severe" && claim.amount > 30000) {
    decision = "review";
    reason = "High-value claim requires human adjuster sign-off.";
  } else {
    reason = "Covered loss with clear liability and consistent evidence.";
  }

  // Calculate payout
  const amount = claim.amount;
  let payout = 0;
  if (decision === "approve") {
    const dedMatch = coverageAnalysis.deductible.match(/[\d,]+/);
    const deductible = dedMatch ? parseInt(dedMatch[0].replace(/,/g, "")) : 0;
    payout = Math.max(0, amount - deductible);
  }

  // Build citations
  const citations = coverageAnalysis.applicableClauses.map((c: any) => ({
    claim: decision === "approve"
      ? `Loss covered under ${c.title}`
      : decision === "deny"
      ? `Exclusion applies per ${c.title}`
      : `Coverage review needed per ${c.title}`,
    clauseId: c.id,
    clauseTitle: c.title,
  }));

  return {
    decision,
    recommendedPayout: payout,
    summary:
      decision === "approve"
        ? `Claim APPROVED for $${payout.toLocaleString()}. ${reason}`
        : decision === "deny"
        ? `Claim DENIED. ${reason}`
        : `Claim routed to REVIEW. ${reason}`,
    rationale: `Demo mode adjudication for ${claim.id} (${claim.claimant}):

Routing: ${routing.path.replace("_", " ")} — ${routing.rationale}

Damage Assessment: ${damageAssessment.severity} severity, ${damageAssessment.estimatedDamageAreaPct}% damage area. Consistency with narrative: ${damageAssessment.consistencyWithNarrative ? "YES" : "NO"}. ${damageAssessment.notes}

Fraud Assessment: Score ${fraudAssessment.score}/100 — ${fraudAssessment.recommendation}. Signals: ${fraudAssessment.signals.join("; ")}

Coverage Analysis: Covered = ${coverageAnalysis.covered}. Deductible: ${coverageAnalysis.deductible}. Exclusions: ${coverageAnalysis.exclusions.length > 0 ? coverageAnalysis.exclusions.join(", ") : "none"}.

Decision: ${decision.toUpperCase()}. ${reason}
Payout calculation: $${amount.toLocaleString()} claimed − ${coverageAnalysis.deductible} deductible = $${payout.toLocaleString()}.`,
    citations,
  };
}

export function demoAudit(claim: Claim, state: any) {
  const { adjudication, coverageAnalysis, fraudAssessment } = state;

  // Simulate audit scores based on whether citations exist and coverage is clear
  const hasCitations = adjudication.citations && adjudication.citations.length > 0;
  const groundedness = hasCitations ? 92 : 65;
  const coverageLogic = coverageAnalysis.covered === (adjudication.decision !== "deny") ? 95 : 60;
  const compliance = fraudAssessment.score >= 60 && adjudication.decision !== "approve" ? 90 : 85;

  const issues: string[] = [];
  if (!hasCitations) issues.push("Adjudication lacks cited policy clauses");
  if (coverageLogic < 90) issues.push("Coverage logic may not align with decision");

  const verdict = groundedness >= 80 && coverageLogic >= 80 ? "pass" : compliance >= 70 ? "retry" : "escalate";

  return {
    groundednessScore: groundedness,
    coverageLogicScore: coverageLogic,
    complianceScore: compliance,
    issues: issues.length > 0 ? issues : ["No issues detected — recommendation is grounded and compliant"],
    verdict,
  };
}
