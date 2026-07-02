import { getClaimById } from "@/lib/claims";
import { runPipeline, type AgentEvent } from "@/lib/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/process?claimId=CLM-2026-00471
// Returns a Server-Sent Events stream of agent events as the pipeline executes.
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: AgentEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        for await (const event of runPipeline(claim)) {
          send(event);
        }
      } catch (err: any) {
        send({
          type: "agent_error",
          agentId: "supervisor",
          agentName: "Supervisor",
          timestamp: Date.now(),
          error: err?.message ?? "Pipeline failure",
        });
      } finally {
        controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
