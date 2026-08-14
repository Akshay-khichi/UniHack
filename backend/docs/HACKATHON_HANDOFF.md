# SpecTrace — Hackathon Handoff

## What Was Built

Full backend for the SpecTrace AI-powered product intelligence platform.
13 phases, all verified. No frontend — backend-only as specified.

## What Works Right Now

| Feature | Status |
|---------|--------|
| Product CRUD | [YES] Working |
| Document upload (Cloudinary) | [YES] Working (requires credentials) |
| AI Extraction (Gemini) | [YES] Working (requires API key) |
| Normalization | [YES] Working (deterministic, no AI) |
| Validation | [YES] Working (deterministic, no AI) |
| Evidence storage | [YES] Working |
| Verification (Gemini) | [YES] Working (requires API key) |
| Contradiction engine | [YES] Working (deterministic) |
| Confidence scoring | [YES] Working (deterministic) |
| Quality scoring | [YES] Working (deterministic) |
| RAG enrichment | [YES] Working (requires API key + Atlas Vector Search optional) |
| Human review | [YES] Working |
| Versioning | [YES] Working (immutable) |
| Processing pipeline | [YES] Working (full orchestrator) |
| JSON export | [YES] Working |
| CSV export | [YES] Working |
| HC-5020 demo seed | [YES] Working |
| Test suite | [YES] 88/88 pass |
| Typecheck | [YES] Clean |
| Build | [YES] Clean |

## What Needs Real Credentials to Test End-to-End

1. **MongoDB Atlas** — set `MONGODB_URI` in `.env`
2. **Cloudinary** — set `CLOUDINARY_*` in `.env`
3. **Gemini** — set `GEMINI_API_KEY` in `.env`

Without credentials, the system starts fine. Endpoints that require external services return 503.

## Demo Scenario (HC-5020)

```bash
npm run seed           # Create HC-5020
npm run seed:knowledge # Load knowledge base

# Then via API:
# 1. Upload Technical Datasheet (doc saying 210 bar)
# 2. Upload Marketing Document (doc saying 250 bar)
# 3. POST /api/products/:id/process
# 4. GET /api/products/:id/fields → maximumPressure status=CONFLICT
# 5. GET /api/products/:id/reviews/queue → one pending review
```

## Architecture Decisions

- **No AI for contradiction detection** — deterministic, auditable, correct
- **No AI for validation** — deterministic, no hallucination risk
- **AI enrichment never produces FACT** — always AI_INFERENCE (≥0.7 confidence) or UNVERIFIED
- **Verification defaults to UNVERIFIED on any failure** — never invents support
- **Immutable versions** — pre-save guard prevents mutation
- **Status precedence** — CONFLICT always wins; UNVERIFIED beats AI_INFERENCE

## Files to Know

| File | Purpose |
|------|---------|
| `src/services/contradiction/contradictionService.ts` | Core conflict engine |
| `src/services/processing/processingOrchestrator.ts` | Full pipeline |
| `src/services/enrichment/enrichmentService.ts` | RAG enrichment (NEVER FACT) |
| `src/services/review/reviewService.ts` | Human review actions |
| `src/utils/jsonParser.ts` | Robust Gemini JSON parser |
| `docs/FRONTEND_INTEGRATION.md` | Frontend API reference |

## Known Limitations

- PDF text extraction requires Gemini to receive a URL or text content — binary PDF buffer not passed directly
- Atlas Vector Search index must be manually created in the Atlas UI (see SETUP.md)
- Multer 1.x deprecation warning — upgrade to 2.x for production hardening
- `--forceExit` needed in Jest due to open handles (likely pino transport in test mode)
