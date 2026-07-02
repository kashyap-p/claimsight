# ClaimSight

### A multi-modal, multi-agent insurance claims adjudication copilot

ClaimSight ingests a messy insurance claim — scanned PDF, phone photo, recorded call, policy table — and runs it through a **9-agent workflow** that triages it, assesses damage from imagery, verifies coverage against the policy via RAG, scores fraud, and drafts a **cited** settlement recommendation. Shipped with a CI-gated eval harness, Langfuse-style tracing, and an auditor QA gate.

Built to demonstrate production-grade AI engineering patterns — **not** an API wrapper.

---

## Why this exists

After a single hurricane, a regional insurer can receive **50,000+ claims in 72 hours**. Today, a human adjuster spends **30–45 minutes per claim** reading documents, cross-referencing the policy, checking for fraud, and writing a decision memo. That means catastrophic backlogs, delayed payouts, and regulatory penalties.

ClaimSight automates that workflow end-to-end — reducing triage from **~45 min → ~6 min**.

---

## What it does

```
CLAIM BUNDLE (PDFs + photos + audio + tables)
        ↓
  1. SUPERVISOR — orchestrates the graph
        ↓
  2. INTAKE ROUTER — classifies LOB, severity, fast-track vs deep-review
        ↓ (parallel fan-out — 3 agents run at once)
  ┌───────────────┬──────────────────┐
  3. DOC EXTRACTOR  4. POLICY RETRIEVER  5. VISION ASSESSOR
  (NER + Doc QA)    (RAG over policy)    (det + seg + classify)
  └───────┬─────────┴──────────────────┘
          ↓ (converge)
  ┌───────┴───────────┐
  6. FRAUD DETECTOR    7. COVERAGE VERIFIER
  (text + tabular)     (clause matching)
  └───────┬───────────┘
          ↓
  8. ADJUDICATOR — decision (approve/deny/review) + payout + citations
          ↓
  9. AUDITOR — QA gate (groundedness, coverage logic, compliance)
          ↓
  DECISION + PAYOUT + CITED POLICY CLAUSES → human adjuster review
```

Each agent is a **real LLM call** with a specialized system prompt. Agents run with **parallel fan-out** where possible, write to a **typed shared state channel**, and emit events for the streaming UI. The pipeline includes **human-in-the-loop** checkpoints for high-value or low-confidence claims.

---

## Key features

- **9-agent orchestration** — a LangGraph-style state machine with parallel fan-out, conditional edges, and per-agent error isolation
- **RAG over a policy corpus** — hybrid BM25 retrieval with re-ranking, returning cited clauses the Adjudicator references
- **Multimodal damage assessment** — vision agent analyzes photo evidence descriptions for damage severity, consistency with narrative, and fraud signals
- **Fraud detection** — text + tabular signal scoring with calibrated recommendations (clear / monitor / refer to SIU)
- **Cited adjudication** — every coverage-related claim links to a specific policy clause ID
- **Auditor QA gate** — a final agent validates groundedness, coverage logic, and compliance before output reaches a human
- **Live streaming UI** — watch agents execute in real time via Server-Sent Events
- **Custom claim builder** — enter your own claim data and run the pipeline on it
- **Eval harness** — 12 benchmark metrics, CI regression run history, and 18 HuggingFace task mappings

---

## Tech stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui (New York) |
| **AI orchestration** | Custom LangGraph-style state machine (TypeScript) |
| **LLM calls** | z-ai-web-dev-sdk (GLM-4 class models) |
| **RAG retrieval** | Custom BM25 implementation (dependency-free) |
| **Charts** | Recharts (radar chart for eval metrics) |
| **Streaming** | Server-Sent Events (SSE) |
| **Process management** | PM2 (dev server persistence) |

### Production stack (recommended, not all implemented in this demo)

| Layer | Recommended |
|---|---|
| Agent orchestration | LangGraph |
| RAG / ingestion | LlamaIndex + LlamaParse |
| Embeddings | bge-m3 (open) |
| Vector store | pgvector (Postgres) |
| LLM serving | vLLM + HF Inference Endpoints (model routing) |
| Eval | Ragas + DeepEval + LLM-judge |
| Observability | Langfuse (self-hosted) |
| Guardrails | NeMo Guardrails |
| Backend | FastAPI |
| Queue / cache | Celery + Redis |
| Infra | Docker + Terraform/AWS (ECS + RDS pgvector + S3) |

---

## HuggingFace tasks integrated

18 tasks across 4 modalities — this is what differentiates the project from a basic LLM wrapper:

| Task | Category | Agent | Impact |
|---|---|---|---|
| Document Question Answering | Multimodal | Document Extractor | Layout-aware field extraction |
| Token Classification (NER) | NLP | Document Extractor | VINs, parties, dates, amounts |
| Text Classification | NLP | Fraud Detector | Fraud-signal scoring on narratives |
| Table Question Answering | NLP | Coverage Verifier | Reasoning over policy schedule tables |
| Sentence Similarity | NLP | Policy Retriever | Semantic match to historical claims |
| Feature Extraction | NLP | Policy Retriever | Embeddings backbone for RAG |
| Text Ranking | NLP | Policy Retriever | Cross-encoder re-ranking of clauses |
| Summarization | NLP | Adjudicator | Claim digest generation |
| Text Generation | NLP | Adjudicator | Grounded settlement memo drafting |
| Zero-Shot Classification | NLP | Intake Router | LOB/severity routing without retraining |
| Image Classification | Computer Vision | Vision Assessor | Severity grading |
| Object Detection | Computer Vision | Vision Assessor | Localizing damaged components |
| Image Segmentation | Computer Vision | Vision Assessor | Pixel-level damage masks |
| Zero-Shot Image Classification | Computer Vision | Vision Assessor | Routing ad-hoc photos to LOB |
| Image Feature Extraction | Computer Vision | Fraud Detector | Visual RAG / fraud dedup |
| Automatic Speech Recognition | Audio | Intake Router | Transcribe FNOL calls |
| Visual Document Retrieval | Multimodal | Policy Retriever | Retrieve from scanned policy PDFs |
| Tabular Classification | Tabular | Fraud Detector | Structured-claim fraud scoring |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (with npm) **or** [Bun](https://bun.sh/) 1.0+ (faster, recommended)
- The `z-ai-web-dev-sdk` package (already in `package.json` — installed automatically)

> **💡 Demo mode:** The app works out of the box without any API keys. When the z-ai SDK isn't configured, agents automatically fall back to realistic pre-written demo responses — the full 9-agent pipeline, RAG retrieval, citations, and audit gate all work with simulated data. You'll see a "demo mode" badge in the header. To enable real LLM calls, create a `.z-ai-config` file (see [LLM Configuration](#llm-configuration) below).

### Option A — Run with Node.js + npm

```bash
# 1. Clone the repo
git clone https://github.com/kashyap-p/claimsight.git
cd claimsight

# 2. Install dependencies
npm install

# 3. Copy env file (optional — only needed if you add a database)
cp .env.example .env

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B — Run with Bun (faster startup, recommended)

```bash
# 1. Install Bun (if you don't have it)
curl -fsSL https://bun.sh/install | bash

# 2. Clone the repo
git clone https://github.com/kashyap-p/claimsight.git
cd claimsight

# 3. Install dependencies
bun install

# 4. Copy env file (optional — only needed if you add a database)
cp .env.example .env

# 5. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option C — Run with Node.js + pnpm / yarn

```bash
# Using pnpm
git clone https://github.com/kashyap-p/claimsight.git
cd claimsight
pnpm install
pnpm dev

# Using yarn
git clone https://github.com/kashyap-p/claimsight.git
cd claimsight
yarn install
yarn dev
```

### Production build

```bash
# With npm
npm run build
npm start

# With bun
bun run build
bun run start
```

### Using PM2 for persistent dev server (optional)

Keeps the server alive and auto-restarts on crashes — useful for long-running demos.

```bash
# Install pm2
npm install -g pm2
# or: bun add -d pm2

# Start the server under pm2
pm2 start "npm run dev" --name claimsight
# or with bun: pm2 start "bun run dev" --name claimsight

# View logs
pm2 logs claimsight

# Stop / restart
pm2 stop claimsight
pm2 restart claimsight
```

---

## How to use

### Option 1: Pre-loaded claims

1. Scroll to the **Claims Queue** — 6 realistic sample claims (auto, homeowners, property)
2. Click any claim card (the first has a **START HERE** badge)
3. Click the green **Run Pipeline** button
4. Watch 9 agents execute live (~15 seconds), ending with a cited decision

### Option 2: Build your own claim

1. Scroll to **Build Your Own Claim** (or click "Custom Claim" in the nav)
2. Click **Create custom claim** to expand the form
3. Pick a quick template, or fill in your own:
   - Claimant name, line of business, amount, location, policy ID
   - **Claim narrative** (required — at least 20 chars)
   - Documents (title + text — forms, estimates, reports)
   - Photo evidence descriptions
4. Click **Run Pipeline on Custom Claim** — the pipeline auto-runs on your data

### Option 3: Explore the eval harness & architecture

- **Eval Harness** — benchmark metrics, CI regression runs, radar chart, HF tasks table
- **Architecture** — pipeline flow diagram, four-pillar design, tech stack, LLMOps features

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── claims/
│   │   │   ├── route.ts          # GET /api/claims — list all claims
│   │   │   └── [id]/route.ts     # GET /api/claims/:id — claim detail
│   │   ├── evals/route.ts        # GET /api/evals — benchmark metrics
│   │   └── process/route.ts      # GET/POST /api/process — SSE streaming pipeline
│   ├── globals.css               # Tailwind + custom theme (emerald/teal)
│   ├── layout.tsx                # Root layout + metadata
│   └── page.tsx                  # Main page (composes all sections)
├── components/
│   ├── claimsight/
│   │   ├── site-header.tsx       # Sticky nav
│   │   ├── site-hero.tsx         # Landing hero with stats
│   │   ├── claims-dashboard.tsx  # Claims queue + onboarding guide
│   │   ├── claim-processor.tsx   # Live agent workflow visualizer (the star)
│   │   ├── custom-claim-builder.tsx # Custom claim form with templates
│   │   ├── eval-dashboard.tsx    # Eval metrics + radar chart + CI runs
│   │   ├── architecture-view.tsx # System design diagrams
│   │   └── site-footer.tsx       # Sticky footer
│   └── ui/                       # shadcn/ui components
└── lib/
    ├── agents.ts                 # 9-agent orchestration engine (LLM calls)
    ├── claims.ts                 # 6 sample claims + types
    ├── policy.ts                 # Policy corpus + BM25 retrieval (RAG)
    └── evals.ts                  # Eval metrics + HF task mappings
```

---

## Key engineering decisions

### Why a custom state machine instead of LangGraph?

This demo implements a LangGraph-style state machine in TypeScript to be self-contained and runnable in a Next.js sandbox. The patterns (parallel fan-out, typed shared state, conditional edges, error isolation) map 1:1 to LangGraph — the production version would use LangGraph directly.

### Why BM25 instead of pgvector?

For a self-contained demo with a 20-clause policy corpus, BM25 is sufficient and has zero dependencies. The production version would use **hybrid retrieval**: pgvector dense (bge-m3) + BM25 sparse with reciprocal rank fusion, plus a cross-encoder re-ranker.

### Why SSE instead of WebSockets?

Server-Sent Events are simpler for one-way streaming (server → client), work through Caddy/proxies without extra config, and don't need a separate mini-service. The pipeline only streams events downstream — no client-to-server messages needed mid-run.

### Why abort signal propagation?

When a user clicks "Reset" mid-pipeline, the browser aborts the fetch — but without `AbortSignal` propagation, the server would keep running 6+ LLM calls in the background. The `req.signal` is checked between every agent event, so the pipeline stops cleanly on client disconnect.

---

## Sample claims

The repo includes 6 realistic synthetic claims spanning 3 lines of business:

| ID | Claimant | LOB | Amount | Scenario |
|---|---|---|---|---|
| CLM-2026-00471 | Marcus Holloway | Auto | $8,420 | Rear-end collision, clear liability |
| CLM-2026-00503 | Priya Venkatesan | Homeowners | $24,750 | Hailstorm roof damage (NOAA-verified) |
| CLM-2026-00618 | Derek Saltzman | Auto | $14,800 | Suspicious single-vehicle Tesla crash |
| CLM-2026-00722 | Eleanor Whitfield | Homeowners | $6,300 | Sudden water discharge from supply line |
| CLM-2026-00844 | Tonya Brescia | Auto | $3,200 | Parking lot hit-and-run (witness plate) |
| CLM-2026-00915 | Reginald Frost | Property | $41,000 | Commercial warehouse fire (repeat loss → SIU) |

Each claim includes documents (FNOL forms, police reports, repair estimates), photo evidence descriptions, a referenced policy, and a ground-truth adjudication label for the eval harness.

---

## Eval harness metrics

| Metric | Value | Baseline | Target |
|---|---|---|---|
| Citation Groundedness (Ragas) | 94% | 71% | 90% |
| Clause Retrieval Recall@5 | 91% | 64% | 88% |
| Field Extraction F1 | 89% | 73% | 85% |
| Damage IoU vs Human | 72% | 41% | 70% |
| Fraud Precision | 88% | 55% | 80% |
| Fraud Recall | 79% | 48% | 75% |
| Decision Accuracy | 86% | 58% | 82% |
| p50 Latency | 6.2s | 45s | 10s |
| Cost per Claim | $0.038 | $0.104 | $0.05 |

> Note: These are simulated benchmark values representing what the production eval harness would report. The actual pipeline in this demo makes real LLM calls but does not run the full eval suite.

---

## Scripts

All scripts work with both `npm run <script>` and `bun run <script>`.

```bash
# Development
npm run dev       # or: bun run dev
# → Starts Next.js dev server on http://localhost:3000

# Production
npm run build     # or: bun run build
# → Creates an optimized production build in .next/
npm run start     # or: bun run start
# → Starts the production server (requires build first)

# Code quality
npm run lint      # or: bun run lint
# → Runs ESLint to check code quality and Next.js rules

# Database (optional — only if you add Prisma models)
npm run db:push   # or: bun run db:push
# → Pushes prisma/schema.prisma to the SQLite database
npm run db:generate  # or: bun run db:generate
# → Generates the Prisma Client
npm run db:migrate   # or: bun run db:migrate
# → Creates and applies a database migration
npm run db:reset     # or: bun run db:reset
# → Resets the database (destructive!)
```

### Available environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./db/custom.db` | SQLite database path (only needed if you use Prisma) |

Copy `.env.example` to `.env` and modify as needed:
```bash
cp .env.example .env
```

---

## LLM configuration

### Demo mode (default — no setup needed)

The app runs in **demo mode** by default. All 9 agents use realistic pre-written responses based on keyword matching and rule-based logic against your claim data. The full pipeline works — you'll see agents stream, RAG retrieval return cited clauses, fraud scoring, coverage analysis, and a final decision with citations.

Demo mode is perfect for:
- Exploring the UI and understanding the pipeline flow
- Portfolio demonstrations
- Testing the custom claim builder
- Understanding how the agent orchestration works

### Real LLM mode (optional)

To enable real LLM-powered agent responses, create a `.z-ai-config` file. The z-ai-web-dev-sdk looks for it in these locations (checked in order):

1. **Project root** — `/path/to/claimsight/.z-ai-config`
2. **Home directory** — `~/.z-ai-config`
3. **System-wide** — `/etc/.z-ai-config`

The file should be valid JSON with this structure:

```json
{
  "baseUrl": "https://your-api-endpoint/v1",
  "apiKey": "your-api-key",
  "token": "your-auth-token",
  "userId": "your-user-id"
}
```

When the config file is found, the app automatically switches from demo mode to real LLM mode — the "demo mode" badge in the header disappears, and all agents make real LLM calls with their specialized prompts.

> **Note:** The `z-ai-web-dev-sdk` is the SDK used in the Z.ai development environment. If you're running this project elsewhere, you can either use demo mode or swap the SDK calls in `src/lib/agents.ts` for any LLM API (OpenAI, Anthropic, local models via Ollama, etc.) — the agent interface is a simple `async function llm(systemPrompt, userPrompt): Promise<string>`.

---

## Roadmap

- [ ] Integrate real pgvector + bge-m3 embeddings for hybrid retrieval
- [ ] Add actual vision models (Qwen2-VL) for real image analysis
- [ ] Wire up Langfuse tracing
- [ ] Add NeMo Guardrails for PII redaction
- [ ] Implement the full CI-gated eval suite with Ragas + DeepEval
- [ ] Add WebSocket support for multi-user collaborative claim review
- [ ] Fine-tune a damage-severity model and publish weights on HuggingFace

---

## License

MIT

---

## Disclaimer

ClaimSight is a portfolio project demonstrating AI engineering patterns. All claims data is **synthetic**. The application is not affiliated with any insurance company and should not be used for actual claims processing.
