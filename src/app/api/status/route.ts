import { NextResponse } from "next/server";
import { isZaiConfigured } from "@/lib/demo-responses";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    demoMode: !isZaiConfigured(),
    llmConfigured: isZaiConfigured(),
  });
}
