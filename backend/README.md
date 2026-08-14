# SpecTrace Backend

AI-powered product intelligence platform backend for industrial commerce.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env
# Fill in your credentials

# Run development server
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Build production
npm run build
```

## Key Features

- **AI Extraction** — Gemini extracts structured fields from PDFs, CSVs, JSON documents
- **Contradiction Detection** — Deterministic engine catches value conflicts (210 bar vs 250 bar)
- **Evidence Traceability** — Every claim linked to source document, page, and excerpt
- **Human Review** — Conflict queue, approve/edit/reject, immutable audit trail
- **Quality Scoring** — 0–100 score with completeness, confidence, contradiction factors
- **RAG Enrichment** — Category knowledge base fills gaps without fabricating facts
- **Export** — Full JSON and CSV with field-level traceability

## Architecture

See [docs/SETUP.md](docs/SETUP.md) for full setup instructions.
See [docs/openapi.yaml](docs/openapi.yaml) for API reference.
See [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md) for frontend integration guide.

## Demo: HC-5020 Conflict Scenario

```bash
npm run seed         # Create HC-5020 product
npm run seed:knowledge  # Load hydraulic cylinder knowledge
```

When HC-5020 is processed with two documents:
- Technical Datasheet: Maximum Pressure = 210 bar
- Marketing Document: Maximum Pressure = 250 bar

Expected result: `CONFLICT` status, both values preserved, human review required.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm test` | Run test suite |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Build to dist/ |
| `npm run seed` | Seed HC-5020 demo product |
| `npm run seed:knowledge` | Seed category knowledge base |
| `npm run verify` | Verify setup |
| `npm run smoke` | Run smoke tests against running server |
