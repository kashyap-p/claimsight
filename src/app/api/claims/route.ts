import { NextResponse } from "next/server";
import { claims } from "@/lib/claims";

// Static data — safe to cache. Revalidate every 5 min in case claims change.
export const revalidate = 300;

export async function GET() {
  return NextResponse.json(
    claims.map((c) => ({
      id: c.id,
      claimant: c.claimant,
      lob: c.lob,
      dateOfLoss: c.dateOfLoss,
      status: c.status,
      location: c.location,
      amount: c.amount,
      narrative: c.narrative.slice(0, 140) + "...",
      policyId: c.policyId,
      documentCount: c.documents.length,
      photoCount: c.photos.length,
    }))
  );
}
