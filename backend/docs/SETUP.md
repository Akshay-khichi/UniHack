# SpecTrace Backend — Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB Atlas account
- Cloudinary account
- Google AI Studio API key (Gemini)

## Installation

```bash
git clone <repo-url>
cd spectrace-backend
npm install
cp .env.example .env
```

## Environment Variables

Edit `.env`:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/spectrace
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
GEMINI_API_KEY=<your_key>
ALLOWED_ORIGINS=http://localhost:5173
MAX_FILE_SIZE_MB=50
```

## MongoDB Atlas Setup

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP (or 0.0.0.0/0 for dev)
4. Copy the connection string to `MONGODB_URI`

### Atlas Vector Search (Phase 9 — Optional)

For RAG enrichment to use vector search:
1. Go to your cluster → Search → Create Search Index
2. Index name: `vector_index`
3. Collection: `categoryknowledges`
4. Field: `embedding`, dimensions: 768 (Gemini text-embedding-004)

If not configured, the system falls back to exact category match retrieval.

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Find credentials in Dashboard → Settings → Access Keys
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Google Gemini Setup

1. Get an API key at [aistudio.google.com](https://aistudio.google.com)
2. Set `GEMINI_API_KEY`

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm test

# Type check
npm run typecheck
```

## Seeding Demo Data

```bash
npm run seed           # Create HC-5020 product
npm run seed:knowledge # Load Hydraulic Cylinder knowledge base
npm run verify         # Verify setup
```

## Security Notes

- `.env` is gitignored — never commit credentials
- All file uploads are validated for MIME type, extension, and filename safety
- CORS uses exact-origin matching — no substring checks
- Mongoose injection protected via Zod validation on all inputs
- Stack traces never leaked in production (`NODE_ENV=production`)
