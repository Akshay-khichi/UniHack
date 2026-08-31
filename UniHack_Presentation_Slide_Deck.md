# UniHack Hackathon Presentation Deck
## AI-Powered Product Intelligence for Industrial Commerce

================================================================================
SLIDE 1: GUIDELINES (Template Slide - No Edits Needed)
================================================================================

================================================================================
SLIDE 2: TITLE & TEAM DETAILS
================================================================================
Title: SpecTrace / UniHack: AI-Powered Product Intelligence for Industrial Commerce
Subtitle: End-to-End Automated Industrial Catalog Enrichment Pipeline

Team Details:
- Team Name: [Your Team Name]
- Team Leader Name: Akshay Khichi
- Track: Unilog Product Content Enrichment Challenge

================================================================================
SLIDE 3: BRIEF ABOUT YOUR SOLUTION
================================================================================
Summary:
SpecTrace is an enterprise-grade automated product intelligence pipeline that transforms cryptic, incomplete, and noisy distributor product records into standardized, search-ready e-commerce catalog deliverables conforming exactly to Unilog's 252-column schema.

Core Value Proposition:
- Ingestion & Normalization: Ingests unstandardized supplier feeds (cryptic descriptions, placeholder brands, conflated manufacturer names) and applies deterministic UOM and text cleaning.
- 3-Tier Taxonomy & 5-Tier Content Engine: Maps products into industrial standard Department > Class > Fine taxonomy while generating 5 tailored description tiers (Invoice <=40 chars, Mobile 60-80 chars, Short, Long, and Marketing descriptions).
- Multi-Key Resilient Architecture: High-throughput round-robin multi-key pool with automated quota management and 1:1 schema mapping that processed 1,000 catalog items with 100% completion and zero schema deviations.

================================================================================
SLIDE 4: CORE QUESTIONS
================================================================================
1. How does your solution enrich minimal product information?
- Multi-Layer Entity Extraction: Parses cryptic part descriptions (e.g., abbreviations, dimensions, materials, tolerances) using structured LLM reasoning and deterministic regex parsers.
- Supplier vs. Product Brand Disambiguation: Solves supplier conflation (e.g. separating distributor names like 'Appliance Dealers Cooperative' from true product brands like 'FRIGIDAIRE®').
- 5-Tier Standardized Copy Synthesis: Produces character-constrained ERP descriptions (Invoice <=40 chars ALL CAPS) up to comprehensive e-commerce marketing copy.
- Deep Technical Attribute Extraction: Populates up to 50 structured attribute slots with normalized values and standardized Units of Measure (UOM).

2. How does your solution ensure accuracy and trust in the generated product data?
- Multi-Factor Confidence Scoring: Evaluates extraction completeness, source coverage, attribute-level confidence, and classpath consistency.
- Self-Consistency Guardrails: Flags ungrounded attributes, missing manufacturer identities, or low-confidence extractions for automated human review.
- Strict Delivery Validation: 100% deterministic schema diffing against the 252 canonical delivery headers (0 missing, 0 extra, 0 renamed).

3. What makes your solution scalable for enterprise product catalogs?
- Multi-Key High-Throughput Engine: Dynamic API pool with independent per-key rate limiting (15 RPM) and automated daily cap failover across multiple credentials.
- Dual-Layer Caching & Resume: Row-index persistent cache (NDJSON) enabling instantaneous lookup, interrupted-run resumption, and zero duplicate API consumption.
- Extensible Model Agnostic Layer: Modular LLM architecture supporting Gemini 3.5 Flash, local models, and batch inference pipelines for millions of SKUs.

================================================================================
SLIDE 5: OPPORTUNITIES
================================================================================
a. How different is it from any of the other existing ideas?
- Solves Real Industrial Data Realities: Handles supplier typos and duplicate MPNs (e.g. AVM6EV Red vs Green Mini Snips) with row-level independent parsing rather than naive key collisions.
- Strict 252-Column Enterprise Compliance: Generates production-ready delivery files in both CSV and multi-sheet XLSX formats with verified column alignment.
- Hybrid Deterministic + LLM Pipeline: Combines exact regex normalization (fractions, UOMs, casing) with generative reasoning to eliminate hallucinated attributes.

b. How will it be able to solve the problem statement given?
- Fully bridges the gap between messy distributor feeds and e-commerce buyer searchability.
- Automates the full 8-stage enrichment sequence: Input Ingestion -> Taxonomy Classification -> Attribute Extraction -> Brand/Manufacturer Cleansing -> Description Building -> Schema Formatting.

c. USP of the Proposed Solution
- Zero-Manual Overhead 252-Column Generator: Instant export of complete 1,000-row catalog records.
- True Brand Disambiguation Engine: Prevents distributor contamination in manufacturer fields.
- Resilient Multi-Key Worker Pool: Enterprise reliability even under stringent free-tier quota limits.

================================================================================
SLIDE 6: LIST OF FEATURES OFFERED BY THE SOLUTION
================================================================================
1. 3-Level Automated Taxonomy Classification (Dept, Class, Fine Classpath generation).
2. 5-Tier Search & ERP Description Builder (Invoice, Mobile, Short, Long, Marketing).
3. Structured Attribute & UOM Normalizer (Fractional inch conversion, metric standardization).
4. Distributor vs. Manufacturer Disambiguation (Extracts authentic brand identity).
5. Multi-Key API Round-Robin Pool (Independent RPM pacing, automated quota rotation).
6. Deterministic 252-Header Schema Validator (Zero column drift).
7. Self-Consistency Confidence & Review Queue (Automated flagging of ungroundable data).
8. Instant In-Memory Dataset Cache (Millisecond UI response for 1,000+ catalog rows).
9. Dual-Format Delivery Exporter (Formatted CSV and native XLSX exports).
10. Web Dashboard & Interactive Review Interface (Real-time product curation).

================================================================================
SLIDE 7: PROCESS FLOW DIAGRAM
================================================================================
Input Feed (Raw CSV / 6 Columns: Mfg_Part_Num, Part_Desc, Brand Placeholders, Part_Manuf)
       |
       v
[Stage 1: Ingestion & De-duplication] -> Row-Index Persistence & Normalization
       |
       v
[Stage 2: Pre-Processing & Disambiguation] -> Extract True Brand / Filter Distributor Artifacts
       |
       v
[Stage 3: Multi-Key LLM Reasoning Engine] -> Taxonomy (Dept/Class/Fine) + Attributes + 5-Tier Copy
       |
       v
[Stage 4: Rule-Based Cleansing & UOM Normalization] -> Regex Standardization & Casing Guardrails
       |
       v
[Stage 5: Self-Consistency & Confidence Scoring] -> Quality Breakdown (Auto-Flag Review Queue)
       |
       v
[Stage 6: Canonical Schema Alignment] -> Exact 252-Column Ordering
       |
       v
Final Output (CSV & XLSX Delivery Files / 1,000 Verified Rows)

================================================================================
SLIDE 8: WIREFRAMES / MOCK DIAGRAMS OF THE PROPOSED SOLUTION
================================================================================
UI Overview:
- Top Navigation: Quick status KPIs, Global search, Theme toggle (Light/Dark).
- Left Sidebar: Dashboard, Products, Add Product, Review Queue, Catalog, UniHack Enrichment.
- Main Enrichment Workspace:
  - Drag-and-Drop CSV Ingestion Area with sample dataset loader.
  - Interactive Product Selection Table with live batch progress.
  - Side-by-Side Product Inspector displaying Classpath, 5-Tier Descriptions, and Attribute badges with confidence scores.
  - One-click 'Download 252-Column CSV' and 'Download XLSX' action buttons.

================================================================================
SLIDE 9: ARCHITECTURE DIAGRAM
================================================================================
Client Tier:
- React 18 / TanStack Router / TailwindCSS / Radix UI Components

API Tier:
- Node.js Express Backend / TypeScript
- REST API Endpoints (/api/unilog/enrich, /api/products, /api/reviews)

Processing & Intelligence Layer:
- Multi-Key Manager (Round-Robin Pool across 4 Gemini API Credentials)
- Pacing Controller (Independent 15 RPM throttling & quota failover)
- Prompt Engine (Structured JSON extraction with few-shot schema constraints)
- Normalization Service (UOM parser, Invoice description truncation, Case standardizer)

Storage & Delivery Tier:
- In-Memory Dataset Cache + NDJSON File Persistence (Zero-loss crash resilience)
- Canonical 252-Header Mapping Engine (XLSX & CSV Export Generators)
- Optional MongoDB Store (Mongoose models with offline graceful fallback)

================================================================================
SLIDE 10: TECHNOLOGIES USED IN THE SOLUTION
================================================================================
Frontend:
- React 18, Vite, TypeScript
- TanStack Router, TanStack Table
- Tailwind CSS, Radix UI, Lucide Icons

Backend:
- Node.js, Express, TypeScript
- @google/genai SDK (Google Gemini 3.5 Flash / Flash Lite)
- Zod (Schema validation & data sanitization)
- xlsx (Spreadsheet buffer generation)
- Pino & Pino-HTTP (Structured logging)

Infrastructure & DevOps:
- Render Cloud Deployment (Web Services)
- GitHub Actions & Version Control
- NDJSON Local Cache Storage

================================================================================
SLIDE 11: ESTIMATED IMPLEMENTATION COST (OPTIONAL)
================================================================================
Cloud Infrastructure (Monthly):
- Web Service Hosting (Render Starter / AWS ECS): $7 - $25 / month
- Optional Document & Image CDN (Cloudinary / S3): $0 - $15 / month

AI Model Inference Costs:
- Gemini 3.5 Flash Lite: ~$0.075 per 1,000 enriched products
- Batch Catalog Processing (100,000 SKUs): ~$7.50 total inference cost

Total Operational Cost:
- Extremely cost-efficient (~$0.0001 per enriched product record), delivering >95% operational savings compared to manual catalog curation teams.

================================================================================
SLIDE 12: SNAPSHOTS OF THE MVP
================================================================================
Key Screens to Include in Slide:
1. UniHack Batch Enrichment View: 1,000 rows loaded, instant multi-item selection, real-time status.
2. Enriched Product Card: 5-tier descriptions, classpath hierarchy, attribute table with confidence ratings.
3. Review Queue Interface: Filtered low-confidence items with inline editing and approval workflows.
4. Output Excel Sheet: Screenshot of output_delivery_format.xlsx showing populated 252 columns across 1,000 rows.

================================================================================
SLIDE 13: ADDITIONAL DETAILS / FUTURE DEVELOPMENT
================================================================================
1. Direct Manufacturer Web-Scraping & Datasheet Ingestion: Automated web crawling of OEM spec sheets for deep electrical/mechanical attribute grounding.
2. Automated Image Processing & Asset Extraction: Computer vision pipeline to crop, optimize, and classify product images and dimensional diagrams.
3. Custom LOV (List of Values) Enterprise Integration: Automated classpath and attribute value compliance against enterprise ERP master taxonomies.
4. Continuous Integration with PIM/ERP: Webhooks and connectors for direct sync into Akeneo, Pimcore, SAP, or Shopify Plus catalogs.

================================================================================
SLIDE 14: PROJECT LINKS
================================================================================
1. GitHub Public Repository:
   https://github.com/Akshay-khichi/UniHack

2. Demo Video Link (3 Minutes):
   [Insert your YouTube Unlisted or Google Drive Video Link here]

3. Working Prototype Link:
   https://unihack-nyab.onrender.com

================================================================================
SLIDE 15: THANK YOU
================================================================================
AI-Powered Product Intelligence for Industrial Commerce
Thank You!
Q&A
