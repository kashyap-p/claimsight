import { getClaimById, type Claim, type LineOfBusiness } from "@/lib/claims";
import { runPipeline, type AgentEvent } from "@/lib/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// GET /api/process?claimId=CLM-2026-00471  — run a pre-loaded claim
// POST /api/process  { claim: {...} }      — run a custom user-built claim
// Returns a Server-Sent Events stream of agent events as the pipeline executes.

function buildStream(claim: Claim, signal: AbortSignal) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        if (signal.aborted) return;
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        for await (const event of runPipeline(claim)) {
          if (signal.aborted) break;
          send(event);
        }
      } catch (err: any) {
        if (!signal.aborted) {
          send({
            type: "agent_error",
            agentId: "supervisor",
            agentName: "Supervisor",
            timestamp: Date.now(),
            error: err?.message ?? "Pipeline failure",
          });
        }
      } finally {
        try {
          if (!signal.aborted) {
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
          }
          controller.close();
        } catch {
          // controller already closed (client aborted) — safe to ignore
        }
      }
    },
    cancel() {
      // Client disconnected — the signal handles cleanup
    },
  });
}

function streamResponse(claim: Claim, signal: AbortSignal) {
  return new Response(buildStream(claim, signal), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const claimId = searchParams.get("claimId");

  if (!claimId) {
    return new Response(JSON.stringify({ error: "claimId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const claim = getClaimById(claimId);
  if (!claim) {
    return new Response(JSON.stringify({ error: "Claim not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return streamResponse(claim, req.signal);
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const c = body?.claim;
  if (!c || !c.narrative) {
    return new Response(JSON.stringify({ error: "claim.narrative is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validLobs: LineOfBusiness[] = ["auto", "homeowners", "property"];
  const lob: LineOfBusiness = validLobs.includes(c.lob) ? c.lob : "auto";

  // Build a Claim object from the user input, filling sensible defaults
  const claim: Claim = {
    id: c.id || `CLM-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
    claimant: c.claimant || "Custom Claimant",
    lob,
    dateOfLoss: c.dateOfLoss || new Date().toISOString().slice(0, 10),
    reportedDate: new Date().toISOString().slice(0, 10),
    status: "intake",
    location: c.location || "Unknown",
    amount: Number(c.amount) || 0,
    narrative: String(c.narrative).slice(0, 4000),
    documents: Array.isArray(c.documents) && c.documents.length > 0
      ? c.documents.map((d: any, i: number) => ({
          id: d.id || `doc-custom-${i + 1}`,
          type: d.type || "claim_form",
          title: d.title || `Document ${i + 1}`,
          content: String(d.content || "").slice(0, 8000),
        })).filter((d: any) => d.content.length > 0)
      : [
          {
            id: "doc-custom-1",
            type: "claim_form" as const,
            title: "Claim Narrative (provided by user)",
            content: String(c.narrative).slice(0, 8000),
          },
        ],
    photos: Array.isArray(c.photos) && c.photos.length > 0
      ? c.photos.map((p: any, i: number) => ({
          id: p.id || `ph-custom-${i + 1}`,
          description: String(p.description || "").slice(0, 4000),
        })).filter((p: any) => p.description.length > 0)
      : [],
    policyId: c.policyId || (lob === "auto" ? "AUTO-PL-88231" : lob === "homeowners" ? "HO-3-55109" : "CP-00-BB9912"),
    expected: { decision: "review", reason: "Custom claim — no ground truth", fraudFlag: false },
  };

  return streamResponse(claim, req.signal);
}
