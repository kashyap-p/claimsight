// ClaimSight — Sample claims corpus
// Realistic insurance claims spanning auto + homeowners lines of business.
// Each claim includes a narrative, document artifacts, photo evidence,
// a referenced policy, and a ground-truth adjudication label (for eval).

export type LineOfBusiness = "auto" | "homeowners" | "property";
export type ClaimStatus = "intake" | "processing" | "approved" | "denied" | "review";

export interface ClaimDocument {
  id: string;
  type: "claim_form" | "repair_estimate" | "police_report" | "photos" | "medical_bill" | "policy";
  title: string;
  content: string; // extracted text of the document
}

export interface ClaimPhoto {
  id: string;
  description: string; // what the adjuster/vision model would see
  url?: string;
}

export interface Claim {
  id: string;
  claimant: string;
  lob: LineOfBusiness;
  dateOfLoss: string;
  reportedDate: string;
  status: ClaimStatus;
  location: string;
  amount: number; // claimed amount USD
  narrative: string;
  documents: ClaimDocument[];
  photos: ClaimPhoto[];
  policyId: string;
  // ground truth for the eval harness
  expected: {
    decision: "approve" | "deny" | "review";
    reason: string;
    fraudFlag: boolean;
  };
}

export const claims: Claim[] = [
  {
    id: "CLM-2026-00471",
    claimant: "Marcus Holloway",
    lob: "auto",
    dateOfLoss: "2026-05-14",
    reportedDate: "2026-05-15",
    status: "intake",
    location: "Austin, TX",
    amount: 8420,
    narrative:
      "I was rear-ended at a stoplight on Lamar Blvd. The other driver admitted fault at the scene. My 2021 Toyota RAV4 sustained significant rear bumper and trunk damage. I have a police report and three repair estimates. The at-fault driver's insurance is Progressive but I'm filing through my own collision coverage.",
    documents: [
      {
        id: "doc-471-1",
        type: "claim_form",
        title: "First Notice of Loss Form",
        content:
          "Claimant: Marcus Holloway | Policy: AUTO-PL-88231 | DOB: 03/12/1986 | VIN: JTMRWRFV8MD214673 | Vehicle: 2021 Toyota RAV4 XLE | Date of Loss: 05/14/2026 | Time: 4:35 PM | Location: Lamar Blvd & W 6th St, Austin TX | Coverage: Collision (Deductible $500), Liability 100/300/50, Rental $40/day max 30 days | Description: Rear-end collision while stopped at traffic light. Other driver admitted fault. Police report filed (APD-26-04412).",
      },
      {
        id: "doc-471-2",
        type: "police_report",
        title: "Austin PD Crash Report APD-26-04412",
        content:
          "Report #: APD-26-04412 | Date: 05/14/2026 16:35 | Location: 1900 Lamar Blvd, Austin TX | Unit 1 (at fault): 2018 Honda Civic, TX plate KZD-4421, Driver: James P. Delacroix, DOB 07/22/1979. Unit 2 (not at fault): 2021 Toyota RAV4, TX plate RFW-8810, Driver: Marcus Holloway. Narrative: Unit 1 failed to control speed and struck rear of Unit 2 which was lawfully stopped for red signal. Unit 1 driver admitted distraction by mobile device. No injuries reported at scene. Both vehicles drivable. Citations issued: Unit 1 cited for failure to control speed (Sec 545.351). Diagrams and photos attached.",
      },
      {
        id: "doc-471-3",
        type: "repair_estimate",
        title: "Repair Estimate — Caliber Collision #4471",
        content:
          "Vehicle: 2021 Toyota RAV4 XLE | VIN: JTMRWRFV8MD214673 | Mileage: 31,240 | Estimate Total: $7,920.00 | Labor: 28.5 hrs @ $62/hr = $1,767 | Parts: OEM rear bumper cover $489, rear bumper reinforcement $215, trunk floor pan $612, tail lamp assembly LH $348, tail lamp assembly RH $348, rear body panel $1,180, backup sensor module $294, various clips/fasteners $86 | Subtotal parts: $3,572 | Paint & materials: 6.2 units @ $32 = $198 | Refinish: $485 | Frame/structural: $890 (rear body panel pull & realign) | Towing: $85 | Subtotal: $7,920 | Deductible applied: $500 | Net estimate: $7,420. Supplement likely for hidden damage per estimator notes.",
      },
    ],
    photos: [
      {
        id: "ph-471-1",
        description:
          "Rear view of silver Toyota RAV4. Rear bumper cover crushed inward approximately 8 inches. Trunk lid misaligned, gap visible on left side. Both tail lamps cracked. License plate bent. Damage consistent with moderate-velocity rear impact. No frame intrusion visible from exterior. Road surface dry, daylight, clear weather.",
      },
      {
        id: "ph-471-2",
        description:
          "Close-up of rear bumper showing paint transfer (white paint from striking vehicle) and horizontal scrape pattern. Impact point centered slightly left of license plate. Backup sensor housing cracked.",
      },
    ],
    policyId: "AUTO-PL-88231",
    expected: { decision: "approve", reason: "Covered collision loss, at-fault third party admitted, estimate reasonable", fraudFlag: false },
  },
  {
    id: "CLM-2026-00503",
    claimant: "Priya Venkatesan",
    lob: "homeowners",
    dateOfLoss: "2026-05-18",
    reportedDate: "2026-05-19",
    status: "intake",
    location: "Round Rock, TX",
    amount: 24750,
    narrative:
      "Hailstorm damaged our roof and gutters. We had a roofer inspect and they said the entire roof needs replacement. Several windows were also cracked. This happened during the storm that came through Tuesday night.",
    documents: [
      {
        id: "doc-503-1",
        type: "claim_form",
        title: "HO Claim Form",
        content:
          "Claimant: Priya Venkatesan | Policy: HO-3-55109 | Property: 4427 Cypress Creek Dr, Round Rock TX 78664 | Date of Loss: 05/18/2026 | Coverage A (Dwelling): $385,000 | Coverage B (Other Structures): $38,500 | Coverage C (Personal Property): $192,500 | Coverage D (Loss of Use): $77,000 | Deductible: Wind/Hail 2% of Coverage A = $7,700 | Cause: Wind/hail damage to roof, gutters, skylights. Roof age 9 years (architectural shingle).",
      },
      {
        id: "doc-503-2",
        type: "repair_estimate",
        title: "Roofing Estimate — Bluebonnet Roofing Co.",
        content:
          "Property: 4427 Cypress Creek Dr, Round Rock TX | Roof: 28-square architectural asphalt shingle, 9 years old | Inspection: Hail impacts documented across 85% of roof plane, average 8-12 hits per 10x10 test square. Shingle mat exposed, granule loss severe. Gutters dented along north and east elevations. Two skylights cracked. Recommendation: Full roof replacement per IRC protocol when >10 hits/sq. Estimate: Tear-off & disposal $2,800 | New GAF Timberline HDZ architectural shingles $9,800 | Underlayment (synthetic) $1,240 | Ice & water shield $680 | New gutters (aluminum 5\") $3,200 | Skylight replacement (2x Velux fixed) $2,500 | Labor 6 days crew of 5 $3,510 | Total: $23,730. Window glass repair separate estimate $1,020.",
      },
      {
        id: "doc-503-3",
        type: "photos",
        title: "NOAA Weather Verification",
        content:
          "NOAA Storm Report 05/18/2026 Williamson County TX: Severe thunderstorm warning issued 19:42 CDT. Trained spotter reported 1.75 inch hail (golf ball) at 4427 Cypress Creek Dr area 20:08 CDT. Wind gusts 58 mph recorded at Round Rock station KRYO. Storm duration approximately 42 minutes over the claim area. Confirmed by NWS Austin/San Antonio office.",
      },
    ],
    photos: [
      {
        id: "ph-503-1",
        description:
          "Aerial/drone view of residential roof. Widespread circular impact marks visible across shingle surface, consistent with hailstones 1.5-2 inch diameter. Granule loss creates dark patches. Gutters show dimpling. Two skylights with radial cracks. Damage pattern uniform across all roof planes — consistent with hail event rather than aging.",
      },
    ],
    policyId: "HO-3-55109",
    expected: { decision: "approve", reason: "Covered wind/hail peril, NOAA-verified event, estimate within reason for full replacement", fraudFlag: false },
  },
  {
    id: "CLM-2026-00618",
    claimant: "Derek Saltzman",
    lob: "auto",
    dateOfLoss: "2026-06-02",
    reportedDate: "2026-06-03",
    status: "intake",
    location: "Dallas, TX",
    amount: 14800,
    narrative:
      "Single vehicle accident. I swerved to avoid a dog and hit a guardrail. No other cars involved. The car is pretty messed up in the front. I don't have a police report because it was on a rural road at night.",
    documents: [
      {
        id: "doc-618-1",
        type: "claim_form",
        title: "FNOL Form",
        content:
          "Claimant: Derek Saltzman | Policy: AUTO-PL-77014 | VIN: 5YJ3E1EA8MF004218 | Vehicle: 2017 Tesla Model 3 | Date of Loss: 06/02/2026 | Time: 11:45 PM | Location: FM-740 near Lake Ray Hubbard, Dallas TX | Coverage: Collision $1000 deductible, Comprehensive $250. | Description: Single vehicle collision with guardrail, swerved to avoid animal. No other parties. No police report filed.",
      },
      {
        id: "doc-618-2",
        type: "repair_estimate",
        title: "Repair Estimate — Tesla Certified Body Shop",
        content:
          "Vehicle: 2017 Tesla Model 3 Long Range | Mileage: 94,100 | Estimate: $14,800. Front bumper assembly $1,200 | Front crash bar $680 | HV coolant radiator $1,450 | Front struts (2) $1,890 | Subframe $2,100 | B-pillar reinforcement $3,200 | Airbag module (driver) $1,500 | Airbag module (passenger) $1,500 | Dash panel $900 | Labor 62 hrs @ $78 = $4,836 | Frame pull $800 | Refinish $1,200 | Total $14,800. Note: HV battery damage suspected, supplement likely $8,000-12,000 pending diagnostic.",
      },
    ],
    photos: [
      {
        id: "ph-618-1",
        description:
          "Front-end damage to grey Tesla Model 3. Front bumper shattered, hood buckled, both airbags deployed. Crash bar pushed inward approximately 14 inches. Damage appears concentrated to front-center. Vehicle photographed in what appears to be a residential driveway (not roadside). No guardrail damage visible in photos. Damage severity inconsistent with low-speed guardrail contact described.",
      },
    ],
    policyId: "AUTO-PL-77014",
    expected: { decision: "review", reason: "Inconsistencies: no police report, photo location inconsistent, damage pattern ambiguous, possible prior damage", fraudFlag: true },
  },
  {
    id: "CLM-2026-00722",
    claimant: "Eleanor Whitfield",
    lob: "homeowners",
    dateOfLoss: "2026-06-08",
    reportedDate: "2026-06-10",
    status: "intake",
    location: "Houston, TX",
    amount: 6300,
    narrative:
      "A pipe burst in our upstairs bathroom and flooded the hallway and downstairs ceiling. We turned off the water immediately but there's drywall damage and warped flooring. This happened two days ago.",
    documents: [
      {
        id: "doc-722-1",
        type: "claim_form",
        title: "HO Claim Form",
        content:
          "Claimant: Eleanor Whitfield | Policy: HO-3-44920 | Property: 8814 Bramblewood Ln, Houston TX 77042 | Date of Loss: 06/08/2026 | Coverage A: $275,000 | Coverage C: $137,500 | Deductible: All Other Perils $1,000 | Cause: Sudden/accidental discharge of water from supply line to upstairs toilet. Water damaged hallway drywall, ceiling of downstairs living room, and laminate flooring. Mitigation began within 2 hours.",
      },
      {
        id: "doc-722-2",
        type: "repair_estimate",
        title: "Mitigation & Repair Estimate — SERVPRO",
        content:
          "Property: 8814 Bramblewood Ln, Houston TX | Water extraction & drying (3 days equip) $2,400 | Hallway drywall removal & replacement (2x10 section) $890 | Downstairs ceiling repair (living room) $1,200 | Laminate flooring replacement (180 sqft) $1,810 | Baseboard replacement $420 | Anti-microbial treatment $380 | Total: $7,100 less deductible $1,000 = $6,100. Moisture readings confirm drying complete. No mold detected. Supply line valve replaced.",
      },
    ],
    photos: [
      {
        id: "ph-722-1",
        description:
          "Upstairs hallway with section of drywall ceiling cut open (mitigation access). Water staining on remaining ceiling. Buckled laminate flooring visible at doorway. Industrial dehumidifier and air movers present. Damage consistent with recent water intrusion from above. No mold growth visible.",
      },
    ],
    policyId: "HO-3-44920",
    expected: { decision: "approve", reason: "Sudden/accidental water discharge is covered peril, mitigation prompt, estimate reasonable", fraudFlag: false },
  },
  {
    id: "CLM-2026-00844",
    claimant: "Tonya Brescia",
    lob: "auto",
    dateOfLoss: "2026-06-15",
    reportedDate: "2026-06-16",
    status: "intake",
    location: "San Antonio, TX",
    amount: 3200,
    narrative:
      "Hit and run in a parking lot. Someone backed into my car while I was in the store and drove off. There's a note on my windshield from a witness with their plate number. Damage is to the driver side door.",
    documents: [
      {
        id: "doc-844-1",
        type: "claim_form",
        title: "FNOL Form",
        content:
          "Claimant: Tonya Brescia | Policy: AUTO-PL-90117 | Vehicle: 2019 Honda Civic | VIN: 2HGFC2F69KH004881 | Date of Loss: 06/15/2026 | Time: ~2:00 PM | Location: H-E-B Parking Lot, 1604 & Bandera Rd, San Antonio TX | Coverage: Collision $500 deductible, Uninsured Motorist $250 deductible. | Description: Vehicle parked, unattended. Returned to find damage to driver side front door and quarter panel. Witness note left with plate: TX BPX-2290. No police report.",
      },
      {
        id: "doc-844-2",
        type: "repair_estimate",
        title: "Repair Estimate — Maaco #3411",
        content:
          "Vehicle: 2019 Honda Civic LX | Mileage: 67,800 | Driver front door skin replacement $680 | Front quarter panel repair (pull & fill) $420 | Door glass & regulator (cracked) $310 | Mirror housing $145 | Refinish driver side $1,240 | Labor 12 hrs @ $52 = $624 | Total $3,200 less deductible.",
      },
    ],
    photos: [
      {
        id: "ph-844-1",
        description:
          "Silver Honda Civic in parking lot. Driver side front door has deep scrape and dent running horizontally. Quarter panel creased. Side mirror housing cracked. White paint transfer visible (consistent with SUV/truck height). Damage consistent with low-speed backing collision. Witness note visible under wiper.",
      },
    ],
    policyId: "AUTO-PL-90117",
    expected: { decision: "approve", reason: "Covered collision, witness plate for UM subrogation, estimate reasonable", fraudFlag: false },
  },
  {
    id: "CLM-2026-00915",
    claimant: "Reginald Frost",
    lob: "property",
    dateOfLoss: "2026-06-20",
    reportedDate: "2026-06-21",
    status: "intake",
    location: "Fort Worth, TX",
    amount: 41000,
    narrative:
      "Our commercial warehouse had a fire in the storage area. The fire department said it was electrical. We lost inventory and there's smoke damage throughout. This is the second fire we've had in 18 months.",
    documents: [
      {
        id: "doc-915-1",
        type: "claim_form",
        title: "Commercial Property Claim",
        content:
          "Claimant: Reginald Frost / Frost Distribution LLC | Policy: CP-00-BB9912 | Property: 11700 Industry Blvd, Bldg C, Fort Worth TX 76118 | Date of Loss: 06/20/2026 | Coverage: Building $650,000 | Business Personal Property $280,000 | Deductible $2,500 | Cause: Fire — origin electrical panel in storage bay 4. | Note: Insured reports prior fire loss 12/2024 (CLM-2024-66120, paid $38,500).",
      },
      {
        id: "doc-915-2",
        type: "repair_estimate",
        title: "Fire Damage Estimate — Blackstone Restoration",
        content:
          "Property: 11700 Industry Blvd Bldg C | Structural: Bay 4 roof charred, requires replacement 2,400 sqft $18,000 | Smoke remediation all bays (12,000 sqft) $9,500 | Inventory loss: 840 units product @ $38 avg = $31,920 | Electrical panel replacement $4,200 | Sprinkler system repair (activated, 12 heads) $3,800 | Total: $67,420. Supplemental inventory audit pending.",
      },
    ],
    photos: [
      {
        id: "ph-915-1",
        description:
          "Interior of commercial warehouse. Charring concentrated around electrical panel on east wall of bay 4. Smoke residue on ceiling throughout. Sprinkler heads deployed. Inventory pallets near panel destroyed; pallets further from origin show smoke but not heat damage. Burn pattern V-shaped originating at panel — consistent with electrical origin. No signs of multiple origins or accelerant pour patterns visible.",
      },
    ],
    policyId: "CP-00-BB9912",
    expected: { decision: "review", reason: "Repeat fire loss (2 in 18 months) triggers SIU review per underwriting guidelines", fraudFlag: true },
  },
];

export function getClaimById(id: string): Claim | undefined {
  return claims.find((c) => c.id === id);
}
