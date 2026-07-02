// ClaimSight — Policy Corpus for RAG
// A realistic (synthetic) set of insurance policy documents that the
// Policy Retriever agent searches over. Each clause is a retrievable chunk
// with an ID so the Adjudicator can cite it.

export interface PolicyClause {
  id: string;
  policyId: string;
  section: string;
  title: string;
  text: string;
  keywords: string[]; // for sparse retrieval
}

export const policies: PolicyClause[] = [
  // ===== AUTO POLICY AUTO-PL-88231 (Holloway) =====
  {
    id: "auto-88231-coll",
    policyId: "AUTO-PL-88231",
    section: "Part D — Coverage for Damage to Your Auto",
    title: "Collision Coverage",
    text: "We will pay for direct and accidental loss to your covered auto caused by collision with another object or by overturn. Our payment will be reduced by the applicable deductible shown on the Declarations. Collision means the upset of your covered auto or its impact with another vehicle or object. A deductible of $500 applies to collision losses under this policy.",
    keywords: ["collision", "rear", "end", "impact", "object", "vehicle", "deductible", "500", "damage", "auto"],
  },
  {
    id: "auto-88231-subro",
    policyId: "AUTO-PL-88231",
    section: "Part D — Conditions",
    title: "Subrogation",
    text: "If we make payment under this policy and the loss is caused by another party, we are subrogated to the rights of recovery the insured has against that party. The insured shall do nothing to prejudice our subrogation rights. We may pursue recovery from the at-fault party or their insurer, including their liability coverage, and will reimburse the insured's deductible upon recovery.",
    keywords: ["subrogation", "at", "fault", "third", "party", "recovery", "other", "driver", "liability"],
  },
  {
    id: "auto-88231-rental",
    policyId: "AUTO-PL-88231",
    section: "Part D — Extended Coverage",
    title: "Rental Reimbursement",
    text: "If you carry collision or comprehensive coverage, we will pay up to $40 per day, maximum 30 days, for a rental vehicle while your covered auto is being repaired due to a covered loss. Rental reimbursement begins when the vehicle is delivered to the repair facility and ends when repairs are complete or the limit is exhausted.",
    keywords: ["rental", "reimbursement", "loaner", "40", "30", "days", "repair", "vehicle"],
  },
  {
    id: "auto-88231-excl-racing",
    policyId: "AUTO-PL-88231",
    section: "Part D — Exclusions",
    title: "Exclusions — Racing and Speed Contests",
    text: "We do not cover loss to your covered auto while being used in any racing, speed, or endurance contest, or while practicing for such contest. This exclusion applies whether or not the contest is officially sanctioned.",
    keywords: ["racing", "speed", "contest", "exclusion", "exclude", "track"],
  },

  // ===== AUTO POLICY AUTO-PL-77014 (Saltzman — Tesla, suspicious) =====
  {
    id: "auto-77014-coll",
    policyId: "AUTO-PL-77014",
    section: "Part D — Collision Coverage",
    title: "Collision",
    text: "Collision coverage applies with a deductible of $1,000. We cover direct and accidental loss caused by collision with another object or overturn of the insured vehicle.",
    keywords: ["collision", "deductible", "1000", "object", "damage"],
  },
  {
    id: "auto-77014-duty",
    policyId: "AUTO-PL-77014",
    section: "Conditions — Duties After Loss",
    title: "Duties After an Accident or Loss",
    text: "The insured must: (1) promptly notify us of the loss; (2) cooperate with our investigation including providing a recorded statement and proof of loss; (3) permit us to inspect the vehicle and obtain repair estimates; (4) as soon as practicable, file a police report for any collision exceeding $1,000 or involving hit-and-run, theft, or vandalism. Failure to comply with these duties may result in denial of the claim.",
    keywords: ["duties", "police", "report", "cooperate", "statement", "proof", "loss", "investigation", "deny", "failure"],
  },
  {
    id: "auto-77014-concealment",
    policyId: "AUTO-PL-77014",
    section: "Conditions — Concealment, Misrepresentation or Fraud",
    title: "Concealment, Misrepresentation or Fraud",
    text: "We do not provide coverage under this policy if you or any person seeking coverage intentionally conceals or misrepresents a material fact or circumstance, or engages in fraud or false statement regarding this insurance or the loss. Any such concealment, misrepresentation, or fraud voids coverage for that loss. This includes prior or unrelated damage presented as part of the current loss.",
    keywords: ["fraud", "misrepresentation", "concealment", "false", "prior", "damage", "void", "voids", "intentional"],
  },
  {
    id: "auto-77014-prior",
    policyId: "AUTO-PL-77014",
    section: "Part D — Exclusions",
    title: "Exclusion — Prior or Unrelated Damage",
    text: "We do not cover loss to your covered auto for prior damage, pre-existing damage, or damage unrelated to the reported loss event. Only damage directly caused by the reported occurrence is covered. Our adjuster will distinguish recent from pre-existing damage through paint transfer, rust, weathering, and impact analysis.",
    keywords: ["prior", "pre", "existing", "unrelated", "old", "damage", "exclude", "rust"],
  },

  // ===== HO-3 POLICY HO-3-55109 (Venkatesan — hail) =====
  {
    id: "ho-55109-perils",
    policyId: "HO-3-55109",
    section: "Section I — Perils Insured Against",
    title: "Coverage A — Dwelling (Open Perils)",
    text: "We insure against risk of direct physical loss to the dwelling described in the Declarations, except we do not cover loss caused by: earth movement, water damage from flood or surface water, power failure, neglect, war, nuclear hazard, or intentional acts. All other direct physical losses to the dwelling are covered unless specifically excluded. Wind and hail are covered perils under this open-perils coverage.",
    keywords: ["wind", "hail", "storm", "roof", "dwelling", "open", "perils", "covered", "physical", "loss"],
  },
  {
    id: "ho-55109-ded-hail",
    policyId: "HO-3-55109",
    section: "Section I — Deductibles",
    title: "Wind/Hail Deductible",
    text: "For losses caused by wind or hail, a special deductible of 2% of Coverage A (Dwelling) applies. With Coverage A of $385,000, the wind/hail deductible is $7,700. This deductible applies separately to each loss and is in lieu of the All Other Perils deductible.",
    keywords: ["wind", "hail", "deductible", "2", "percent", "7700", "coverage", "a", "dwelling"],
  },
  {
    id: "ho-55109-rcv",
    policyId: "HO-3-55109",
    section: "Section I — Loss Settlement",
    title: "Loss Settlement — Roof Replacement",
    text: "For dwellings, loss is settled on a replacement cost basis. For roof surfacing, if the roof is less than 10 years old and damaged by a covered peril, we will pay the full replacement cost without deduction for depreciation. If the roof is 10 years or older, actual cash value (ACV) applies. The insured roof is 9 years old; replacement cost basis applies.",
    keywords: ["roof", "replacement", "cost", "rcv", "acv", "depreciation", "age", "10", "years", "shingle"],
  },
  {
    id: "ho-55109-pairs",
    policyId: "HO-3-55109",
    section: "Section I — Conditions",
    title: "Matching — Exterior Surfacing",
    text: "When a covered loss requires replacement of roof surfacing, siding, or exterior wall covering, we will pay to replace the undamaged portion only if the new material cannot reasonably match the existing in color, texture, or size, and applicable law requires replacement of the whole plane. Otherwise we replace only the damaged area. Reasonable matching efforts will be made.",
    keywords: ["matching", "siding", "roof", "exterior", "replace", "uniform", "color", "plane"],

  },

  // ===== HO-3 POLICY HO-3-44920 (Whitfield — water) =====
  {
    id: "ho-44920-water",
    policyId: "HO-3-44920",
    section: "Section I — Perils Insured Against",
    title: "Water Damage — Sudden & Accidental Discharge",
    text: "We cover sudden and accidental discharge or overflow of water or steam from within a plumbing, heating, air conditioning, or automatic fire protective sprinkler system, or from within a household appliance. This includes the cost of tearing out and replacing any part of the building necessary to repair the system or appliance. Gradual seepage, leakage, or continuous repeated discharge over a period of weeks, months, or years is excluded.",
    keywords: ["water", "pipe", "burst", "discharge", "plumbing", "sudden", "accidental", "leak", "appliance", "supply", "line"],
  },
  {
    id: "ho-44920-duty-mitigate",
    policyId: "HO-3-44920",
    section: "Section I — Conditions",
    title: "Duties After Loss — Mitigation",
    text: "The insured shall take all reasonable steps to protect the property from further damage after a loss, including shutting off water, removing standing water, and beginning drying within a reasonable time. Costs of temporary repairs and mitigation are reimbursable as part of the loss if reasonable and documented. Failure to mitigate may reduce the recoverable amount.",
    keywords: ["mitigate", "mitigation", "protect", "further", "damage", "drying", "temporary", "repair", "shut", "off"],
  },
  {
    id: "ho-44920-mold",
    policyId: "HO-3-44920",
    section: "Section I — Exclusions",
    title: "Exclusion — Mold, Fungi, Wet Rot",
    text: "We do not cover loss caused by mold, fungi, wet or dry rot, unless the mold is a direct result of a covered water loss and is discovered and reported within 30 days of the loss. In such cases, coverage for mold remediation is limited to $10,000.",
    keywords: ["mold", "fungi", "rot", "remediation", "limit", "10000", "exclude"],
  },
  {
    id: "ho-44920-aop",
    policyId: "HO-3-44920",
    section: "Section I — Deductibles",
    title: "All Other Perils Deductible",
    text: "For all losses not subject to the wind/hail deductible, an All Other Perils (AOP) deductible of $1,000 applies. Water damage from sudden discharge is subject to the AOP deductible.",
    keywords: ["deductible", "aop", "all", "other", "perils", "1000", "water"],
  },

  // ===== COMMERCIAL CP-00-BB9912 (Frost — fire, repeat loss) =====
  {
    id: "cp-9912-fire",
    policyId: "CP-00-BB9912",
    section: "Causes of Loss — Special Form",
    title: "Fire Coverage",
    text: "This policy insures against direct physical loss caused by or resulting from fire, including damage from smoke, water, and other firefighting measures. Fire is a covered cause of loss under the special form. Loss settlement is on a replacement cost basis for the building and actual cash value for stock unless endorsed otherwise.",
    keywords: ["fire", "smoke", "electrical", "warehouse", "commercial", "building", "stock", "covered"],
  },
  {
    id: "cp-9912-siu",
    policyId: "CP-00-BB9912",
    section: "Conditions — Fraud and SIU Referral",
    title: "Suspicious Loss Investigation (SIU)",
    text: "Any claim involving: (a) a prior fire or theft loss at the same or related insured location within 36 months; (b) financial distress of the insured; (c) inconsistencies between the reported cause and physical evidence; or (d) losses occurring shortly after policy inception or coverage increase — shall be referred to the Special Investigations Unit (SIU) for examination under oath before any payment is made. Coverage is conditional on the insured's cooperation with the SIU investigation, including submission to an Examination Under Oath (EUO).",
    keywords: ["siu", "special", "investigation", "fraud", "prior", "fire", "repeat", "examination", "under", "oath", "euo", "suspicious", "36", "months"],
  },
  {
    id: "cp-9912-bpp",
    policyId: "CP-00-BB9912",
    section: "Coverage B — Business Personal Property",
    title: "Business Personal Property (Stock) Valuation",
    text: "Business personal property, including stock and inventory, is settled on an actual cash value basis unless a replacement cost endorsement is purchased. The insured must provide an inventory of damaged and undamaged property, including quantity, cost, selling price, and value. Payment for stock is limited to the actual cash value at the time of loss. A debris removal endorsement provides up to $25,000 for removal of debris of covered property.",
    keywords: ["stock", "inventory", "business", "personal", "property", "bpp", "actual", "cash", "value", "acv", "debris"],
  },

  // ===== AUTO-PL-90117 (Brescia — hit and run) =====
  {
    id: "auto-90117-um",
    policyId: "AUTO-PL-90117",
    section: "Part C — Uninsured Motorists Coverage",
    title: "Uninsured Motorists — Hit and Run",
    text: "We will pay damages which an insured person is legally entitled to recover from the owner or operator of an uninsured motor vehicle because of bodily injury or property damage caused by an accident. A hit-and-run vehicle is treated as an uninsured motor vehicle provided: (1) the accident is reported to the police within 24 hours; or (2) the identity of the at-fault vehicle can be established through witness or physical evidence. A $250 deductible applies to UM property damage. If the at-fault party is identified, we will subrogate.",
    keywords: ["uninsured", "motorist", "um", "hit", "and", "run", "250", "deductible", "witness", "parking", "lot", "subrogation"],
  },
  {
    id: "auto-90117-coll",
    policyId: "AUTO-PL-90117",
    section: "Part D — Collision",
    title: "Collision Coverage",
    text: "Collision coverage applies with a $500 deductible. If a hit-and-run occurs and UM coverage conditions are not met, the insured may elect to process the loss under collision coverage instead.",
    keywords: ["collision", "500", "deductible", "parked", "unattended", "hit", "run"],
  },
];

// ===== Sparse retrieval (BM25-style) over the policy corpus =====
// A lightweight, dependency-free BM25 implementation. In production this
// would be pgvector + tsvector with reciprocal rank fusion, but for a
// self-contained demo this demonstrates the retrieval+reranking pattern.

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

const N = policies.length;
const docTokens = policies.map((p) => [...tokenize(p.text), ...tokenize(p.title), ...p.keywords.map((k) => k.toLowerCase())]);
const docFreq: Record<string, number> = {};
docTokens.forEach((tokens) => {
  const seen = new Set(tokens);
  seen.forEach((t) => {
    docFreq[t] = (docFreq[t] || 0) + 1;
  });
});

const avgDocLen = docTokens.reduce((s, t) => s + t.length, 0) / N;
const k1 = 1.5;
const b = 0.75;

function bm25Score(query: string, docIdx: number): number {
  const qTokens = tokenize(query);
  const doc = docTokens[docIdx];
  const docLen = doc.length;
  let score = 0;
  const tf: Record<string, number> = {};
  doc.forEach((t) => {
    tf[t] = (tf[t] || 0) + 1;
  });
  qTokens.forEach((qt) => {
    if (docFreq[qt] === undefined) return;
    const idf = Math.log((N - docFreq[qt] + 0.5) / (docFreq[qt] + 0.5) + 1);
    const f = tf[qt] || 0;
    if (f === 0) return;
    const denom = f + k1 * (1 - b + b * (docLen / avgDocLen));
    score += (idf * (f * (k1 + 1))) / denom;
  });
  return score;
}

export interface RetrievedClause {
  clause: PolicyClause;
  score: number;
}

export function retrievePolicyClauses(query: string, policyId: string, topK = 4): RetrievedClause[] {
  const candidates = policies
    .map((p, idx) => ({ clause: p, idx, score: bm25Score(`${query} ${policyId.replace(/-/g, " ")}`, idx) }))
    .filter((c) => c.clause.policyId === policyId || c.score > 0)
    .sort((a, b) => b.score - a.score);
  // Always prioritize the matching policy, then by score
  const samePolicy = candidates.filter((c) => c.clause.policyId === policyId);
  const others = candidates.filter((c) => c.clause.policyId !== policyId);
  return [...samePolicy, ...others].slice(0, topK).map((c) => ({ clause: c.clause, score: c.score }));
}
