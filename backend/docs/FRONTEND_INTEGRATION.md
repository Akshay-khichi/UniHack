# SpecTrace Frontend Integration Guide

## Base URL

```
http://localhost:3000
```

## Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

Errors:
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Product not found" }
}
```

## Key Endpoints

### Products
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products` | Create product |
| GET | `/api/products` | List products (paginated) |
| GET | `/api/products/:id` | Get product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

Query params for list: `page`, `limit`, `search`, `category`, `status`, `sortBy`, `sortOrder`

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products/:id/documents` | Upload document (multipart/form-data, field: `file`) |
| GET | `/api/products/:id/documents` | List documents |

Query params for upload: `sourceType` (TECHNICAL_DATASHEET/MARKETING_DOCUMENT/USER_INPUT), `documentType`

### Processing
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/products/:id/process` | Trigger full AI processing pipeline |
| GET | `/api/products/:id/fields` | Get extracted fields |
| GET | `/api/products/:id/evidence` | Get evidence records |

### Review
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/:id/reviews/queue` | Get pending review queue |
| GET | `/api/products/:id/reviews` | All reviews for product |
| POST | `/api/products/reviews/:reviewId/approve` | Approve review |
| POST | `/api/products/reviews/:reviewId/edit` | Edit with new value |
| POST | `/api/products/reviews/:reviewId/reject` | Reject |
| POST | `/api/products/reviews/:reviewId/mark-unverified` | Mark unverified |
| GET | `/api/products/:id/versions` | Version history |

### Export
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/:id/export?format=json` | Full JSON export |
| GET | `/api/products/:id/export?format=csv` | CSV with field traceability |

## Field Status Values

| Status | Meaning |
|--------|---------|
| `FACT` | Human-verified or unambiguous source |
| `AI_INFERENCE` | AI-inferred from category knowledge (≥0.7 confidence) |
| `UNVERIFIED` | Extracted but not yet verified |
| `CONFLICT` | Multiple sources disagree — requires human review |
| `REVIEW_REQUIRED` | Validation errors — requires human review |

**Status precedence:** `CONFLICT → UNVERIFIED → REVIEW_REQUIRED → AI_INFERENCE → FACT`

## Conflict Handling

When a conflict is detected:
```json
{
  "canonicalName": "maximumPressure",
  "status": "CONFLICT",
  "value": 210,
  "unit": "bar",
  "sourceType": "TECHNICAL_DATASHEET",
  "contradictionGroupId": "abc123def456",
  "contradictingValues": [
    {
      "value": 250,
      "unit": "bar",
      "sourceType": "MARKETING_DOCUMENT",
      "excerpt": "Maximum pressure 250 bar"
    }
  ]
}
```

The frontend **must** display both values and require a human resolution action (approve/edit/reject).

## Typical Frontend Workflow

1. `POST /api/products` — create product
2. `POST /api/products/:id/documents` — upload 1+ documents
3. `POST /api/products/:id/process` — trigger pipeline
4. Poll `GET /api/products/:id` until `status !== 'PROCESSING'`
5. If `status === 'REVIEW_REQUIRED'`:
   - `GET /api/products/:id/reviews/queue` — fetch pending items
   - For each conflict: display both values, get user choice
   - `POST /api/products/reviews/:reviewId/approve|edit|reject`
6. `GET /api/products/:id/export?format=json` — export
