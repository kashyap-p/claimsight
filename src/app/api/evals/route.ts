import { NextResponse } from "next/server";
import { evalMetrics, evalRuns, hfTaskUsage } from "@/lib/evals";

// Static benchmark data — fully cacheable
export const revalidate = 3600;

export async function GET() {
  return NextResponse.json({ evalMetrics, evalRuns, hfTaskUsage });
}
