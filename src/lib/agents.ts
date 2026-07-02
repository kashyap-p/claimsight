// ClaimSight — Multi-Agent Orchestration Engine
// A LangGraph-style state machine implemented in TypeScript. Each agent is a
// real LLM call (via z-ai-web-dev-sdk) with a specialized system prompt.
// Agents run with parallel fan-out where possible, write to a shared typed
// state channel, and emit events for the streaming UI.

import ZAI from "z-ai-web-dev-sdk";
import type { Claim } from "./claims";
import { retrievePolicyClauses, type RetrievedClause } from "./policy";

// ===== Shared state channel (the "graph state") =====
export interface AgentState {
  claim: Claim;
  routing?: {
    lob: string;
    severity: "low" | "moderate" | "severe";
    path: "fast_track" | "deep_review";
    rationale: string;
  };
  extraction?: {
    fields: Record<string, string>;
    notes: string;
  };
  policyRetrieval?: {
    query: string;
    clauses: { id: string; title: string; section: string; score: number; snippet: string }[];
  };
  damageAssessment?: {
    components: string[];
    severity: string;
    estimatedDamageAreaPct: number;
    consistencyWithNarrative: boolean;
    notes: string;
  };
  fraudAssessment?: {
    score: number; // 0-100
    signals: string[];
    recommendation: string;
  };
  coverageAnalysis?: {
    covered: boolean;
    applicableClauses: { id: string; title: string }[];
    deductible: string;
    exclusions: string[];
    reasoning: string;
  };
  adjudication?: {
    decision: "approve" | "deny" | "review";
    recommendedPayout: number;
    summary: string;
    rationale: string;
    citations: { claim: string; clauseId: string; clauseTitle: string }[];
  };
  audit?: {
    groundednessScore: number; // 0-100
    coverageLogicScore: number;
    complianceScore: number;
    issues: string[];
    verdict: "pass" | "retry" | "escalate";
  };
}

export type AgentId =
  | "supervisor"
  | "router"
  | "extractor"
  | "retriever"
  | "vision"
  | "fraud"
  | "adjudicator"
  | "auditor";

export interface AgentEvent {
  type: "agent_start" | "agent_complete" | "agent_error" | "pipeline_complete";
  agentId: AgentId;
  agentName: string;
  timestamp: number;
  durationMs?: number;
  result?: string; // human-readable summary
  state?: Partial<AgentState>;
  error?: string;
  tokensUsed?: number;
}

// ===== LLM helper =====
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

async function llm(systemPrompt: string, userPrompt: string): Promise<string> {
  const zai = await getZAI();
  const response = await zai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: false,
    thinking: { type: "disabled" },
  });
  return response.choices?.[0]?.message?.content ?? "";
}

// Robust JSON extraction — models sometimes wrap in ```json fences
function extractJSON(text: string): any {
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// ===== Individual Agents =====

async function routerAgent(claim: Claim): Promise<AgentState["routing"]> {
  const system = `You are the Intake Router agent for an insurance claims system. Classify the claim by line of business, assess severity, and route it. Respond ONLY with valid JSON.`;
  const user = `Claim ID: ${claim.id}
Line of Business: ${claim.lob}
Amount Claimed: $${claim.amount.toLocaleString()}
Narrative: ${claim.narrative}

Classify severity based on amount and complexity:
- low: < $5,000, single vehicle/minor damage, clear liability
- moderate: $5,000–$15,000 or moderate complexity
- severe: > $15,000 or catastrophic/injury/commercial

Determine routing path:
- fast_track: clear-cut, low fraud indicators, covered peril obvious
- deep_review: high value, complex, suspicious, or requires investigation

Respond with JSON: {"lob": string, "severity": "low"|"moderate"|"severe", "path": "fast_track"|"deep_review", "rationale": string}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return {
      lob: claim.lob,
      severity: claim.amount > 15000 ? "severe" : claim.amount > 5000 ? "moderate" : "low",
      path: claim.amount > 15000 ? "deep_review" : "fast_track",
      rationale: "Rule-based fallback classification.",
    };
  }
}

async function extractorAgent(claim: Claim): Promise<AgentState["extraction"]> {
  const system = `You are a Document Extraction agent specializing in insurance claim forms and repair estimates. Extract structured fields precisely from the provided documents. Respond ONLY with valid JSON.`;
  const docText = claim.documents.map((d) => `--- ${d.title} ---\n${d.content}`).join("\n\n");
  const user = `Extract the following fields from these claim documents for claim ${claim.id}:
${docText}

Extract: claimantName, policyNumber, dateOfLoss, vehicleOrProperty, vinOrAddress, claimedAmount, deductible, coverageType, thirdParty (if any), policeReportNumber (if any), repairEstimateTotal, keyDamages (comma separated).

Respond with JSON: {"fields": {"field": "value", ...}, "notes": "any anomalies or inconsistencies noticed in the documents"}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return { fields: { claimantName: claim.claimant, claimedAmount: String(claim.amount) }, notes: "Extraction parse error — fallback used." };
  }
}

async function retrieverAgent(claim: Claim): Promise<AgentState["policyRetrieval"]> {
  // RAG: BM25 retrieval over policy corpus, then LLM-refined query
  const query = `${claim.lob} ${claim.narrative.slice(0, 200)} ${claim.documents[0]?.content.slice(0, 100) ?? ""}`;
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

async function visionAgent(claim: Claim): Promise<AgentState["damageAssessment"]> {
  const system = `You are a Vision/Damage Assessment agent for insurance claims. You analyze photo evidence descriptions and assess damage severity, affected components, and consistency with the reported narrative. Respond ONLY with valid JSON.`;
  const photoDescs = claim.photos.map((p) => `Photo ${p.id}: ${p.description}`).join("\n\n");
  const user = `Claim narrative: ${claim.narrative}

Photo evidence descriptions:
${photoDescs}

Assess the damage. Determine:
1. Which vehicle/property components are damaged (list them)
2. Overall severity (minor/moderate/severe)
3. Estimated damage area percentage (0-100)
4. Whether the photo evidence is CONSISTENT with the reported narrative (boolean) — look for contradictions in location, damage pattern, or context
5. Notes on any red flags

Respond with JSON: {"components": [string], "severity": string, "estimatedDamageAreaPct": number, "consistencyWithNarrative": boolean, "notes": string}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return {
      components: ["Unable to parse"],
      severity: "unknown",
      estimatedDamageAreaPct: 0,
      consistencyWithNarrative: true,
      notes: "Vision parse error.",
    };
  }
}

async function fraudAgent(claim: Claim, extraction: AgentState["extraction"], vision: AgentState["damageAssessment"]): Promise<AgentState["fraudAssessment"]> {
  const system = `You are a Fraud Detection agent. You analyze claims for fraud indicators using textual and behavioral signals. Be calibrated — most claims are legitimate. Only flag genuine red flags. Respond ONLY with valid JSON.`;
  const user = `Claim ${claim.id} — ${claim.lob}, $${claim.amount.toLocaleString()}
Narrative: ${claim.narrative}
Reported date: ${claim.reportedDate} | Date of loss: ${claim.dateOfLoss}
Extraction notes: ${extraction?.notes ?? "none"}
Vision consistency: ${vision?.consistencyWithNarrative ? "consistent" : "INCONSISTENT"} — ${vision?.notes ?? ""}
Vision severity: ${vision?.severity}

Evaluate fraud signals (0-100 score, higher = more suspicious):
- Inconsistencies between narrative and evidence
- Missing police report for significant loss
- Late reporting
- Prior losses (check documents for mentions)
- Damage inconsistent with described cause
- Amount anomalies

Respond with JSON: {"score": number, "signals": [string], "recommendation": "clear"|"monitor"|"refer_to_siu"}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return { score: 20, signals: ["Unable to parse fraud analysis"], recommendation: "monitor" };
  }
}

async function coverageAgent(
  claim: Claim,
  retrieval: AgentState["policyRetrieval"]
): Promise<AgentState["coverageAnalysis"]> {
  const system = `You are a Coverage Verification agent. You determine whether a claim is covered under the insured's policy by analyzing retrieved policy clauses against the claim facts. Be precise about deductibles and exclusions. Respond ONLY with valid JSON.`;
  const clausesText = retrieval?.clauses
    .map((c) => `[${c.id}] ${c.title} (${c.section}): ${c.snippet}`)
    .join("\n\n") ?? "No clauses retrieved";

  const user = `Claim ${claim.id} — ${claim.lob}, $${claim.amount.toLocaleString()}
Narrative: ${claim.narrative}

Retrieved policy clauses (policy ${claim.policyId}):
${clausesText}

Determine:
1. Is this loss covered? (boolean)
2. Which clauses apply (cite by ID and title)
3. What deductible applies?
4. Are any exclusions triggered?
5. Reasoning

Respond with JSON: {"covered": boolean, "applicableClauses": [{"id": string, "title": string}], "deductible": string, "exclusions": [string], "reasoning": string}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return {
      covered: true,
      applicableClauses: [],
      deductible: "unknown",
      exclusions: [],
      reasoning: "Coverage parse error — defaulting to covered pending review.",
    };
  }
}

async function adjudicatorAgent(
  claim: Claim,
  state: AgentState
): Promise<AgentState["adjudication"]> {
  const system = `You are the Adjudicator agent. You synthesize all agent findings into a final settlement recommendation. Every claim you make MUST cite the specific policy clause ID that supports it. Be decisive but accurate. Respond ONLY with valid JSON.`;
  const user = `CLAIM ${claim.id} — ${claim.claimant} — ${claim.lob} — $${claim.amount.toLocaleString()}

ROUTING: ${state.routing?.path} — ${state.routing?.rationale}

EXTRACTION FIELDS: ${JSON.stringify(state.extraction?.fields ?? {})}
Extraction notes: ${state.extraction?.notes ?? "none"}

DAMAGE ASSESSMENT: ${state.damageAssessment?.severity} severity, ${state.damageAssessment?.estimatedDamageAreaPct}% damage area
Components: ${state.damageAssessment?.components?.join(", ")}
Consistency with narrative: ${state.damageAssessment?.consistencyWithNarrative ? "YES" : "NO — INCONSISTENCY DETECTED"}
Vision notes: ${state.damageAssessment?.notes}

FRAUD ASSESSMENT: Score ${state.fraudAssessment?.score}/100 — ${state.fraudAssessment?.recommendation}
Signals: ${state.fraudAssessment?.signals?.join("; ")}

COVERAGE ANALYSIS: Covered = ${state.coverageAnalysis?.covered}
Applicable clauses: ${state.coverageAnalysis?.applicableClauses?.map((c) => c.id).join(", ")}
Deductible: ${state.coverageAnalysis?.deductible}
Exclusions: ${state.coverageAnalysis?.exclusions?.join("; ")}
Coverage reasoning: ${state.coverageAnalysis?.reasoning}

RETRIEVED POLICY CLAUSES (cite these by ID):
${state.policyRetrieval?.clauses.map((c) => `[${c.id}] ${c.title}: ${c.snippet}`).join("\n")}

Make a final decision: approve, deny, or route to human review (for high-value, ambiguous, or SIU-relevant claims).

Calculate recommended payout (claimed amount minus deductible, or 0 if denied).

Draft a 2-3 sentence summary and a detailed rationale. Cite clause IDs for every coverage-related claim.

Respond with JSON:
{"decision": "approve"|"deny"|"review", "recommendedPayout": number, "summary": string, "rationale": string, "citations": [{"claim": string, "clauseId": string, "clauseTitle": string}]}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return {
      decision: "review",
      recommendedPayout: 0,
      summary: "Adjudication parse error — escalating to human review.",
      rationale: raw.slice(0, 300),
      citations: [],
    };
  }
}

async function auditorAgent(claim: Claim, state: AgentState): Promise<AgentState["audit"]> {
  const system = `You are the Auditor agent — a quality gate that validates the Adjudicator's recommendation for groundedness, coverage logic, and policy compliance before it reaches a human. Respond ONLY with valid JSON.`;
  const user = `Validate this adjudication for claim ${claim.id}:

DECISION: ${state.adjudication?.decision}
RECOMMENDED PAYOUT: $${state.adjudication?.recommendedPayout?.toLocaleString() ?? 0}
SUMMARY: ${state.adjudication?.summary}
RATIONALE: ${state.adjudication?.rationale}
CITATIONS: ${JSON.stringify(state.adjudication?.citations)}

AVAILABLE CLAUSES THAT WERE RETRIEVED:
${state.policyRetrieval?.clauses.map((c) => `[${c.id}] ${c.title}`).join("\n")}

COVERAGE ANALYSIS SAID: covered=${state.coverageAnalysis?.covered}, deductible=${state.coverageAnalysis?.deductible}
FRAUD SCORE: ${state.fraudAssessment?.score} (${state.fraudAssessment?.recommendation})

Audit checks:
1. GROUNDEDNESS: Are all claims in the rationale backed by a cited clause that actually exists? (0-100)
2. COVERAGE LOGIC: Does the decision follow logically from coverage analysis? (0-100)
3. COMPLIANCE: Does it respect deductibles, exclusions, and SIU triggers? (0-100)

Respond with JSON:
{"groundednessScore": number, "coverageLogicScore": number, "complianceScore": number, "issues": [string], "verdict": "pass"|"retry"|"escalate"}`;

  const raw = await llm(system, user);
  try {
    return extractJSON(raw);
  } catch {
    return {
      groundednessScore: 50,
      coverageLogicScore: 50,
      complianceScore: 50,
      issues: ["Auditor parse error — manual review required"],
      verdict: "escalate",
    };
  }
}

// ===== Pipeline Orchestrator (LangGraph-style) =====
// Supervisor → [Router] → (parallel: Extractor, Retriever, Vision) →
// [Fraud (needs extraction+vision)] → [Coverage (needs retrieval)] →
// [Adjudicator (needs all)] → [Auditor (needs adjudication)]

export async function* runPipeline(claim: Claim): AsyncGenerator<AgentEvent> {
  const state: AgentState = { claim };

  // 1. Supervisor + Router
  yield { type: "agent_start", agentId: "supervisor", agentName: "Supervisor", timestamp: Date.now() };
  await sleep(150);
  yield { type: "agent_start", agentId: "router", agentName: "Intake Router", timestamp: Date.now() };
  const t0 = Date.now();
  try {
    state.routing = await routerAgent(claim);
    yield {
      type: "agent_complete",
      agentId: "router",
      agentName: "Intake Router",
      timestamp: Date.now(),
      durationMs: Date.now() - t0,
      result: `Routed to ${state.routing.path.replace("_", " ")} — ${state.routing.severity} severity. ${state.routing.rationale}`,
      state: { routing: state.routing },
    };
  } catch (e: any) {
    yield { type: "agent_error", agentId: "router", agentName: "Intake Router", timestamp: Date.now(), error: e?.message };
  }

  // 2. Parallel fan-out: Extractor, Retriever, Vision
  yield { type: "agent_start", agentId: "extractor", agentName: "Document Extractor", timestamp: Date.now() };
  yield { type: "agent_start", agentId: "retriever", agentName: "Policy Retriever (RAG)", timestamp: Date.now() };
  yield { type: "agent_start", agentId: "vision", agentName: "Vision Assessor", timestamp: Date.now() };

  const [extT0, retT0, visT0] = [Date.now(), Date.now(), Date.now()];
  const [extP, retP, visP] = [
    extractorAgent(claim).then((r) => ({ r, t: Date.now() - extT0 })),
    retrieverAgent(claim).then((r) => ({ r, t: Date.now() - retT0 })),
    visionAgent(claim).then((r) => ({ r, t: Date.now() - visT0 })),
  ];

  // Emit completes as they resolve (preserving the parallel feel)
  const results = await Promise.allSettled([extP, retP, visP]);

  if (results[0].status === "fulfilled") {
    state.extraction = results[0].value.r;
    yield {
      type: "agent_complete",
      agentId: "extractor",
      agentName: "Document Extractor",
      timestamp: Date.now(),
      durationMs: results[0].value.t,
      result: `Extracted ${Object.keys(results[0].value.r.fields ?? {}).length} fields. ${results[0].value.r.notes ?? ""}`.trim(),
      state: { extraction: state.extraction },
    };
  } else {
    yield { type: "agent_error", agentId: "extractor", agentName: "Document Extractor", timestamp: Date.now(), error: String(results[0].reason) };
  }

  if (results[1].status === "fulfilled") {
    state.policyRetrieval = results[1].value.r;
    yield {
      type: "agent_complete",
      agentId: "retriever",
      agentName: "Policy Retriever (RAG)",
      timestamp: Date.now(),
      durationMs: results[1].value.t,
      result: `Retrieved ${results[1].value.r.clauses.length} policy clauses via BM25 + rerank.`,
      state: { policyRetrieval: state.policyRetrieval },
    };
  } else {
    yield { type: "agent_error", agentId: "retriever", agentName: "Policy Retriever (RAG)", timestamp: Date.now(), error: String(results[1].reason) };
  }

  if (results[2].status === "fulfilled") {
    state.damageAssessment = results[2].value.r;
    yield {
      type: "agent_complete",
      agentId: "vision",
      agentName: "Vision Assessor",
      timestamp: Date.now(),
      durationMs: results[2].value.t,
      result: `Assessment: ${results[2].value.r.severity} damage, ${results[2].value.r.estimatedDamageAreaPct}% area. Consistency: ${results[2].value.r.consistencyWithNarrative ? "yes" : "NO"}.`,
      state: { damageAssessment: state.damageAssessment },
    };
  } else {
    yield { type: "agent_error", agentId: "vision", agentName: "Vision Assessor", timestamp: Date.now(), error: String(results[2].reason) };
  }

  // 3. Fraud + Coverage (depend on prior results, can run in parallel)
  yield { type: "agent_start", agentId: "fraud", agentName: "Fraud Detector", timestamp: Date.now() };
  yield { type: "agent_start", agentId: "supervisor", agentName: "Coverage Verifier", timestamp: Date.now() };
  const [fraudT0, covT0] = [Date.now(), Date.now()];
  const [fraudP, covP] = [
    fraudAgent(claim, state.extraction, state.damageAssessment).then((r) => ({ r, t: Date.now() - fraudT0 })),
    coverageAgent(claim, state.policyRetrieval).then((r) => ({ r, t: Date.now() - covT0 })),
  ];
  const [fraudRes, covRes] = await Promise.allSettled([fraudP, covP]);

  if (fraudRes.status === "fulfilled") {
    state.fraudAssessment = fraudRes.value.r;
    yield {
      type: "agent_complete",
      agentId: "fraud",
      agentName: "Fraud Detector",
      timestamp: Date.now(),
      durationMs: fraudRes.value.t,
      result: `Fraud score ${fraudRes.value.r.score}/100 — ${fraudRes.value.r.recommendation}.`,
      state: { fraudAssessment: state.fraudAssessment },
    };
  } else {
    yield { type: "agent_error", agentId: "fraud", agentName: "Fraud Detector", timestamp: Date.now(), error: String(fraudRes.reason) };
  }

  if (covRes.status === "fulfilled") {
    state.coverageAnalysis = covRes.value.r;
    yield {
      type: "agent_complete",
      agentId: "supervisor",
      agentName: "Coverage Verifier",
      timestamp: Date.now(),
      durationMs: covRes.value.t,
      result: `Covered: ${covRes.value.r.covered ? "yes" : "no"}. Deductible: ${covRes.value.r.deductible}. Exclusions: ${covRes.value.r.exclusions?.length ?? 0}.`,
      state: { coverageAnalysis: state.coverageAnalysis },
    };
  } else {
    yield { type: "agent_error", agentId: "supervisor", agentName: "Coverage Verifier", timestamp: Date.now(), error: String(covRes.reason) };
  }

  // 4. Adjudicator
  yield { type: "agent_start", agentId: "adjudicator", agentName: "Adjudicator", timestamp: Date.now() };
  const adjT0 = Date.now();
  try {
    state.adjudication = await adjudicatorAgent(claim, state);
    yield {
      type: "agent_complete",
      agentId: "adjudicator",
      agentName: "Adjudicator",
      timestamp: Date.now(),
      durationMs: Date.now() - adjT0,
      result: `Decision: ${state.adjudication.decision.toUpperCase()} — $${state.adjudication.recommendedPayout.toLocaleString()}. ${state.adjudication.citations?.length ?? 0} citations.`,
      state: { adjudication: state.adjudication },
    };
  } catch (e: any) {
    yield { type: "agent_error", agentId: "adjudicator", agentName: "Adjudicator", timestamp: Date.now(), error: e?.message };
  }

  // 5. Auditor (final gate)
  yield { type: "agent_start", agentId: "auditor", agentName: "Auditor (QA Gate)", timestamp: Date.now() };
  const audT0 = Date.now();
  try {
    state.audit = await auditorAgent(claim, state);
    yield {
      type: "agent_complete",
      agentId: "auditor",
      agentName: "Auditor (QA Gate)",
      timestamp: Date.now(),
      durationMs: Date.now() - audT0,
      result: `Verdict: ${state.audit.verdict.toUpperCase()} — groundedness ${state.audit.groundednessScore}, coverage logic ${state.audit.coverageLogicScore}, compliance ${state.audit.complianceScore}.`,
      state: { audit: state.audit },
    };
  } catch (e: any) {
    yield { type: "agent_error", agentId: "auditor", agentName: "Auditor (QA Gate)", timestamp: Date.now(), error: e?.message };
  }

  yield { type: "pipeline_complete", agentId: "auditor", agentName: "Pipeline", timestamp: Date.now(), state: state };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
