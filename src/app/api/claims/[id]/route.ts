import { NextResponse } from "next/server";
import { getClaimById } from "@/lib/claims";

export const dynamic = "force-dynamic";

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
