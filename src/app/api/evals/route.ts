import { NextResponse } from "next/server";
import { evalMetrics, evalRuns, hfTaskUsage } from "@/lib/evals";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ evalMetrics, evalRuns, hfTaskUsage });
}
