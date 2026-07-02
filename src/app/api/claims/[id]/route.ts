import { NextResponse } from "next/server";
import { getClaimById, claims } from "@/lib/claims";

// Statically generate all known claim detail pages
export const revalidate = 300;

export async function generateStaticParams() {
  return claims.map((c) => ({ id: c.id }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claim = getClaimById(id);
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }
  return NextResponse.json(claim);
}
